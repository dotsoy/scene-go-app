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
        NSLocale *locale = [NSLocale localeWithLocaleIdentifier:@"zh-CN"];
        _speechRecognizer = [[SFSpeechRecognizer alloc] initWithLocale:locale];
        _speechRecognizer.delegate = self;
        _audioEngine = [[AVAudioEngine alloc] init];
    }
    return self;
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
    [SFSpeechRecognizer requestAuthorization:^(SFSpeechRestrictedState status) {
        dispatch_async(dispatch_get_main_queue(), ^{
            if (status != SFSpeechRecognizerAuthorizationStatusAuthorized) {
                reject(@"auth_denied", @"Speech recognition permission denied", nil);
                return;
            }
            [self startAudioRecordingWithLocale:localeStr resolver:resolve rejecter:reject];
        });
    }];
}

- (void)startAudioRecordingWithLocale:(NSString *)localeStr
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
    _recognitionTask = [_speechRecognizer recognitionTaskWithRequest:_recognitionRequest resultHandler:^(SFSpeechRecognitionResult * _Nullable result, NSError * _Nullable error) {
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

        if (error || (result && result.isFinal)) {
            [strongSelf.audioEngine stop];
            [inputNode removeTapOnBus:0];
            strongSelf.recognitionRequest = nil;
            strongSelf.recognitionTask = nil;
        }
    }];

    AVAudioFormat *recordingFormat = [inputNode outputFormatForBus:0];
    [inputNode tapOnBus:0 bufferSize:1024 format:recordingFormat block:^(AVAudioPCMBuffer * _Nonnull buffer, AVAudioTime * _Nonnull when) {
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
