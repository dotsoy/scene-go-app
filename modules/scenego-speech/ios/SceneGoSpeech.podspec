Pod::Spec.new do |s|
  s.name           = 'SceneGoSpeech'
  s.version        = '1.0.0'
  s.summary        = 'SceneGo native speech recognition module (SFSpeechRecognizer)'
  s.description    = <<-DESC
  Expo local module bridging iOS SFSpeechRecognizer + AVAudioEngine for realtime dictation.
  DESC
  s.license        = 'MIT'
  s.author         = 'SceneGo'
  s.homepage       = 'https://scenego.app'
  s.platform       = :ios, '13.0'
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift files
  s.source_files = '**/*.{h,m,mm,swift}'
  s.frameworks = 'Speech', 'AVFoundation'
end
