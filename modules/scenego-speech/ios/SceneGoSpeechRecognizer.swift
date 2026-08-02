import ExpoModulesCore
import Speech
import AVFoundation

public class SceneGoSpeechRecognizer: Module {
  private var speechRecognizer: SFSpeechRecognizer?
  private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
  private var recognitionTask: SFSpeechRecognitionTask?
  private let audioEngine = AVAudioEngine()
  // 授权回调期间收到 stop 时置位，授权完成后放弃启动（消除快速连点导致的双任务竞争）
  private var stopRequested = false

  /// 发送事件：旧架构 (Paper) 下必须经 RCT 事件桥 (EXReactNativeEventEmitter) 才能到达 JS
  /// （LegacyEventEmitterCompat 的 JSI 路径在旧架构 runtime 不可用，事件会被静默丢弃）
  private func emitEvent(_ name: String, _ body: [String: Any]) {
    if let serviceProtocol = NSProtocolFromString("EXEventEmitterService"),
       let legacyEmitter = (appContext?.legacyModule(implementing: serviceProtocol) as NSObject?) {
      legacyEmitter.perform(NSSelectorFromString("sendEventWithName:body:"), with: name, with: body as NSDictionary)
    } else {
      // 新架构 fallback：JSI 事件
      sendEvent(name, body)
    }
  }

  public func definition() -> ModuleDefinition {
    Name("SceneGoSpeechRecognizer")

    Events("onSpeechResult", "onSpeechError")

    AsyncFunction("startListening") { (promise: Promise) in
      self.startListening(locale: "zh-CN", promise: promise)
    }.runOnQueue(.main)

    AsyncFunction("stopListening") { (promise: Promise) in
      self.stopListening()
      promise.resolve(true)
    }.runOnQueue(.main)
  }

  private func startListening(locale: String, promise: Promise) {
    stopRequested = false
    SFSpeechRecognizer.requestAuthorization { status in
      DispatchQueue.main.async {
        // 授权窗口内用户已点关闭：放弃本次启动，避免 stop 后录音仍在后台运行
        guard !self.stopRequested else {
          promise.resolve(false)
          return
        }
        guard status == .authorized else {
          promise.reject("auth_denied", "Speech recognition permission denied")
          return
        }
        guard let recognizer = self.buildRecognizer(forLocale: locale) else {
          promise.reject("locale_unavailable", "No speech recognizer available for this device")
          return
        }
        self.speechRecognizer = recognizer
        self.beginRecording(with: recognizer, promise: promise)
      }
    }
  }

  /// 构建指定 locale 的识别器；不可用时自动降级到同语言前缀或 en-US
  private func buildRecognizer(forLocale localeId: String) -> SFSpeechRecognizer? {
    let supported = SFSpeechRecognizer.supportedLocales()
    guard !supported.isEmpty else { return nil }

    // 精确匹配
    if let exact = supported.first(where: { $0.identifier == localeId }) {
      return SFSpeechRecognizer(locale: exact)
    }
    // 同语言前缀（如 zh-CN → zh-Hans / zh-TW）
    let langPrefix = localeId.split(separator: "-").first.map(String.init) ?? ""
    if let sameLang = supported.first(where: { $0.identifier.hasPrefix(langPrefix) }) {
      NSLog("[Speech] %@ 不可用，降级为 %@", localeId, sameLang.identifier)
      return SFSpeechRecognizer(locale: sameLang)
    }
    // 英文兜底
    if let en = supported.first(where: { $0.identifier.hasPrefix("en") }) {
      NSLog("[Speech] %@ 不可用，降级为 %@", localeId, en.identifier)
      return SFSpeechRecognizer(locale: en)
    }
    if let first = supported.first {
      NSLog("[Speech] %@ 不可用，使用 %@", localeId, first.identifier)
      return SFSpeechRecognizer(locale: first)
    }
    return nil
  }

  private func beginRecording(with recognizer: SFSpeechRecognizer, promise: Promise) {
    if let task = recognitionTask {
      task.cancel()
      recognitionTask = nil
    }

    let audioSession = AVAudioSession.sharedInstance()
    do {
      try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
      try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
    } catch {
      promise.reject("audio_session_error", error.localizedDescription)
      return
    }

    let request = SFSpeechAudioBufferRecognitionRequest()
    request.shouldReportPartialResults = true
    recognitionRequest = request

    let inputNode = audioEngine.inputNode
    if inputNode.inputFormat(forBus: 0).sampleRate == 0 {
      // 无输入设备（模拟器未授权麦克风等）
      promise.reject("no_input_device", "No audio input device available")
      return
    }

    recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
      guard let self else { return }

      if let result {
        let transcript = result.bestTranscription.formattedString
        self.emitEvent("onSpeechResult", [
          "transcript": transcript,
          "isFinal": result.isFinal,
        ])
      }

      if let error {
        // cancel 是用户主动停止触发的正常错误（NSUserCancelledError），不视为异常，不上报
        let nsError = error as NSError
        if nsError.code != NSUserCancelledError {
          NSLog("[Speech] recognition error: %@", error.localizedDescription)
          self.emitEvent("onSpeechError", ["message": error.localizedDescription])
        }
      }

      if error != nil || (result?.isFinal ?? false) {
        self.audioEngine.stop()
        inputNode.removeTap(onBus: 0)
        self.recognitionRequest = nil
        self.recognitionTask = nil
      }
    }

    let recordingFormat = inputNode.outputFormat(forBus: 0)
    inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, _ in
      self?.recognitionRequest?.append(buffer)
    }

    audioEngine.prepare()
    do {
      try audioEngine.start()
      promise.resolve(true)
    } catch {
      promise.reject("engine_error", error.localizedDescription)
    }
  }

  private func stopListening() {
    stopRequested = true
    if audioEngine.isRunning {
      audioEngine.stop()
      recognitionRequest?.endAudio()
    }
    recognitionTask?.cancel()
    recognitionTask = nil
    // 释放录音会话，避免持续占用麦克风
    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
  }
}
