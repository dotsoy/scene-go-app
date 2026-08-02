#import "SceneGoSpeechRecognizer.h"
#import <Speech/Speech.h>
#import <AVFoundation/AVFoundation.h>

@interface SceneGoSpeechRecognizer () <SFSpeechRecognizerDelegate>
@property (nonatomic, strong) SFSpeechRecognizer *speechRecognizer;
@property (nonatomic, strong) SFSpeechAudioBufferRecognitionRequest *recognitionRequest;
@property (nonatomic, strong) SFSpeechRecognitionTask *recognitionTask;
@property (nonatomic, strong) AVAudioEngine *audioEngine;
@property (nonatomic, assign) BOOL hasListeners;
@end

@implementation SceneGoSpeechRecognizer

RCT_EXPORT_MODULE(SceneGoSpeechRecognizer);

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        _audioEngine = [[AVAudioEngine alloc] init];
        // recognizer 在每次 startListening 时按传入 locale 构建（含可用性降级）
        _speechRecognizer = [self buildRecognizerForLocale:@"zh-CN"];
    }
    return self;
}

/** 构建指定 locale 的识别器；不可用时自动降级到同语言前缀或 en-US */
- (SFSpeechRecognizer *)buildRecognizerForLocale:(NSString *)localeId {
    NSArray<NSLocale *> *supported = [SFSpeechRecognizer supportedLocales];
    if (supported.count == 0) return nil;

    // 精确匹配
    for (NSLocale *loc in supported) {
        if ([[loc localeIdentifier] isEqualToString:localeId]) {
            return [[SFSpeechRecognizer alloc] initWithLocale:loc];
        }
    }
    // 同语言前缀（如 zh-CN → zh-Hans / zh-TW）
    NSString *langPrefix = [[localeId componentsSeparatedByString:@"-"] firstObject];
    for (NSLocale *loc in supported) {
        if ([[loc localeIdentifier] hasPrefix:langPrefix]) {
            NSLog(@"[Speech] %@ 不可用，降级为 %@", localeId, loc.localeIdentifier);
            return [[SFSpeechRecognizer alloc] initWithLocale:loc];
        }
    }
    // 英文兑底
    for (NSLocale *loc in supported) {
        if ([[loc localeIdentifier] hasPrefix:@"en"]) {
            NSLog(@"[Speech] %@ 不可用，降级为 %@", localeId, loc.localeIdentifier);
            return [[SFSpeechRecognizer alloc] initWithLocale:loc];
        }
    }
    NSLog(@"[Speech] %@ 不可用，使用 %@", localeId, supported.firstObject.localeIdentifier);
    return [[SFSpeechRecognizer alloc] initWithLocale:supported.firstObject];
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"onSpeechResult", @"onSpeechError"];
}

- (void)startObserving {
    _hasListeners = YES;
}

- (void)stopObserving {
    _hasListeners = NO;
}

RCT_EXPORT_METHOD(startListening:(NSString *)localeStr
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    [SFSpeechRecognizer requestAuthorization:^(SFSpeechRecognizerAuthorizationStatus status) {
        dispatch_async(dispatch_get_main_queue(), ^{
            if (status != SFSpeechRecognizerAuthorizationStatusAuthorized) {
                reject(@"auth_denied", @"Speech recognition permission denied", nil);
                return;
            }

            // 按传入 locale 构建识别器（内部处理可用性降级）
            SFSpeechRecognizer *recognizer = [self buildRecognizerForLocale:localeStr.length > 0 ? localeStr : @"zh-CN"];
            if (!recognizer) {
                reject(@"locale_unavailable", @"No speech recognizer available for this device", nil);
                return;
            }
            recognizer.delegate = self;
            self.speechRecognizer = recognizer;
            [self startAudioRecordingWithRecognizer:recognizer resolver:resolve rejecter:reject];
        });
    }];
}

- (void)startAudioRecordingWithRecognizer:(SFSpeechRecognizer *)recognizer
                                 resolver:(RCTPromiseResolveBlock)resolve
                                 rejecter:(RCTPromiseRejectBlock)reject
{
    if (_recognitionTask) {
        [_recognitionTask cancel];
        _recognitionTask = nil;
    }

    AVAudioSession *audioSession = [AVAudioSession sharedInstance];
    NSError *error = nil;
    [audioSession setCategory:AVAudioSessionCategoryRecord mode:AVAudioSessionModeMeasurement options:AVAudioSessionCategoryOptionDuckOthers error:&error];
    [audioSession setActive:YES withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation error:&error];

    _recognitionRequest = [[SFSpeechAudioBufferRecognitionRequest alloc] init];
    AVAudioInputNode *inputNode = _audioEngine.inputNode;

    if (!_recognitionRequest || !inputNode) {
        reject(@"init_error", @"Unable to create recognition request or input node", nil);
        return;
    }

    _recognitionRequest.shouldReportPartialResults = YES;

    __weak typeof(self) weakSelf = self;
    _recognitionTask = [recognizer recognitionTaskWithRequest:_recognitionRequest resultHandler:^(SFSpeechRecognitionResult * _Nullable result, NSError * _Nullable error) {
        typeof(self) strongSelf = weakSelf;
        if (!strongSelf) return;

        if (result) {
            NSString *transcript = result.bestTranscription.formattedString;
            if (strongSelf.hasListeners) {
                [strongSelf sendEventWithName:@"onSpeechResult" body:@{
                    @"transcript": transcript,
                    @"isFinal": @(result.isFinal)
                }];
            }
        }

        if (error) {
            // 错误事件上报（权限受限/网络不可达/识别引擎故障等）
            NSLog(@"[Speech] recognition error: %@", error.localizedDescription);
            if (strongSelf.hasListeners) {
                [strongSelf sendEventWithName:@"onSpeechError" body:@{ @"message": error.localizedDescription ?: @"unknown" }];
            }
        }

        if (error || (result && result.isFinal)) {
            [strongSelf.audioEngine stop];
            [inputNode removeTapOnBus:0];
            strongSelf.recognitionRequest = nil;
            strongSelf.recognitionTask = nil;
        }
    }];

    AVAudioFormat *recordingFormat = [inputNode outputFormatForBus:0];
    [inputNode installTapOnBus:0 bufferSize:1024 format:recordingFormat block:^(AVAudioPCMBuffer * _Nonnull buffer, AVAudioTime * _Nonnull when) {
        [weakSelf.recognitionRequest appendAudioPCMBuffer:buffer];
    }];

    [_audioEngine prepare];
    [_audioEngine startAndReturnError:&error];

    if (error) {
        reject(@"engine_error", error.localizedDescription, error);
    } else {
        resolve(@YES);
    }
}

RCT_EXPORT_METHOD(stopListening:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        if (self.audioEngine.isRunning) {
            [self.audioEngine stop];
            [self.recognitionRequest endAudio];
        }
        if (self.recognitionTask) {
            [self.recognitionTask cancel];
            self.recognitionTask = nil;
        }
        resolve(@YES);
    });
}

@end
