#import "SceneGoVisionClassifier.h"
#import <Vision/Vision.h>
#import <UIKit/UIKit.h>

@implementation SceneGoVisionClassifier

RCT_EXPORT_MODULE(SceneGoVisionClassifier);

RCT_EXPORT_METHOD(classifyScene:(NSString *)imageUri
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  if (!imageUri || [imageUri length] == 0) {
    reject(@"invalid_uri", @"Image URI is empty", nil);
    return;
  }

  NSString *cleanPath = imageUri;
  if ([cleanPath hasPrefix:@"file://"]) {
    cleanPath = [cleanPath substringFromIndex:7];
  }

  UIImage *image = [UIImage imageWithContentsOfFile:cleanPath];
  if (!image || !image.CGImage) {
    reject(@"read_error", @"Unable to load image for classification", nil);
    return;
  }

  VNClassifyImageRequest *request = [[VNClassifyImageRequest alloc] initWithCompletionHandler:^(VNRequest * _Nonnull request, NSError * _Nullable error) {
    if (error) {
      reject(@"vision_error", error.localizedDescription, error);
      return;
    }

    NSMutableArray *resultsArray = [NSMutableArray array];
    for (VNClassificationObservation *observation in request.results) {
      if (observation.confidence > 0.1) { // 过滤置信度 > 10% 的场景
        [resultsArray addObject:@{
          @"identifier": observation.identifier,
          @"confidence": @(observation.confidence)
        }];
      }
      if ([resultsArray count] >= 10) break; // 取前 10 个最匹配场景
    }

    resolve(resultsArray);
  }];

  VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithCGImage:image.CGImage options:@{}];
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    NSError *err = nil;
    [handler performRequests:@[request] error:&err];
    if (err) {
      reject(@"handler_error", err.localizedDescription, err);
    }
  });
}

@end
