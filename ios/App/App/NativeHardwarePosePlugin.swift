import Foundation
import Capacitor
import AVFoundation
import Vision

@objc(NativeHardwarePosePlugin)
public class NativeHardwarePosePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeHardwarePosePlugin"
    public let jsName = "NativeHardwarePose"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getHardwareCapabilities", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "detectFromBase64", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "processVideoFrames", returnType: CAPPluginReturnPromise)
    ]

    private let processingQueue = DispatchQueue(label: "com.klutchh.pose.pipeline", qos: .userInitiated)

    @objc func getHardwareCapabilities(_ call: CAPPluginCall) {
        call.resolve([
            "supported": true,
            "isGpuAccelerated": true,
            "modelType": "Apple_Neural_Engine_Vision_Pose",
            "delegate": "APPLE_NEURAL_ENGINE_ANE_METAL",
            "platform": "ios_native"
        ])
    }

    @objc func detectFromBase64(_ call: CAPPluginCall) {
        guard let base64String = call.getString("base64") else {
            call.reject("Must provide base64 image data")
            return
        }

        processingQueue.async {
            var cleanBase64 = base64String
            if let commaRange = cleanBase64.range(of: ",") {
                cleanBase64 = String(cleanBase64[commaRange.upperBound...])
            }

            guard let data = Data(base64Encoded: cleanBase64),
                  let image = UIImage(data: data),
                  let cgImage = image.cgImage else {
                call.reject("Could not decode image")
                return
            }

            let requestHandler = VNImageRequestHandler(cgImage: cgImage, orientation: .up, options: [:])
            let request = VNDetectHumanBodyPoseRequest()

            do {
                try requestHandler.perform([request])
                guard let observations = request.results, let observation = observations.first else {
                    call.resolve(["landmarks": [], "hasPose": false])
                    return
                }

                let landmarks = self.mapVisionLandmarksToMediaPipe(observation: observation)
                call.resolve([
                    "landmarks": landmarks,
                    "hasPose": !landmarks.isEmpty
                ])
            } catch {
                call.reject("Vision Neural Engine pose inference error: \(error.localizedDescription)")
            }
        }
    }

    @objc func processVideoFrames(_ call: CAPPluginCall) {
        guard let videoPath = call.getString("videoPath") else {
            call.reject("Must provide videoPath")
            return
        }

        let targetFps = call.getInt("fps") ?? 24

        processingQueue.async {
            let url: URL
            if videoPath.starts(with: "file://") || videoPath.starts(with: "/") {
                url = URL(fileURLWithPath: videoPath)
            } else if let validUrl = URL(string: videoPath) {
                url = validUrl
            } else {
                call.reject("Invalid video URL or file path")
                return
            }

            let asset = AVAsset(url: url)
            guard let track = asset.tracks(withMediaType: .video).first else {
                call.reject("No video track found in asset")
                return
            }

            guard let reader = try? AVAssetReader(asset: asset) else {
                call.reject("Could not initialize AVAssetReader")
                return
            }

            let outputSettings: [String: Any] = [
                kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
                kCVPixelBufferMetalCompatibilityKey as String: true
            ]

            let trackOutput = AVAssetReaderTrackOutput(track: track, outputSettings: outputSettings)
            trackOutput.alwaysCopiesSampleData = false // Hardware Zero-Copy Stream
            reader.add(trackOutput)

            if !reader.startReading() {
                call.reject("AVAssetReader failed to start reading")
                return
            }

            var frames: [[String: Any]] = []
            var frameIndex = 0
            let frameDuration = 1.0 / Double(targetFps)
            var lastRecordedTime = -1.0

            while reader.status == .reading {
                guard let sampleBuffer = trackOutput.copyNextSampleBuffer() else { break }
                let timestamp = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
                let timeSeconds = CMTimeGetSeconds(timestamp)

                if lastRecordedTime < 0 || (timeSeconds - lastRecordedTime) >= frameDuration {
                    lastRecordedTime = timeSeconds

                    if let imageBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) {
                        let requestHandler = VNImageRequestHandler(cvPixelBuffer: imageBuffer, orientation: .up, options: [:])
                        let request = VNDetectHumanBodyPoseRequest()

                        try? requestHandler.perform([request])
                        if let observation = request.results?.first {
                            let landmarks = self.mapVisionLandmarksToMediaPipe(observation: observation)
                            frames.append([
                                "index": frameIndex,
                                "timestamp": timeSeconds,
                                "landmarks": landmarks
                            ])
                        } else {
                            frames.append([
                                "index": frameIndex,
                                "timestamp": timeSeconds,
                                "landmarks": []
                            ])
                        }
                        frameIndex += 1
                    }
                }
            }

            let durationSeconds = CMTimeGetSeconds(asset.duration)
            call.resolve([
                "totalFrames": frames.count,
                "frames": frames,
                "durationMs": Int(durationSeconds * 1000)
            ])
        }
    }

    private func mapVisionLandmarksToMediaPipe(observation: VNHumanBodyPoseObservation) -> [[String: Any]] {
        var results = Array(repeating: ["x": 0.0, "y": 0.0, "z": 0.0, "visibility": 0.0], count: 33)

        let jointMapping: [VNHumanBodyPoseObservation.JointName: Int] = [
            .nose: 0,
            .leftEye: 2,
            .rightEye: 5,
            .leftEar: 7,
            .rightEar: 8,
            .leftShoulder: 11,
            .rightShoulder: 12,
            .leftElbow: 13,
            .rightElbow: 14,
            .leftWrist: 15,
            .rightWrist: 16,
            .leftHip: 23,
            .rightHip: 24,
            .leftKnee: 25,
            .rightKnee: 26,
            .leftAnkle: 27,
            .rightAnkle: 28
        ]

        for (joint, index) in jointMapping {
            if let recognizedPoint = try? observation.recognizedPoint(joint), recognizedPoint.confidence > 0.1 {
                // Vision has origin at bottom-left, MediaPipe at top-left
                results[index] = [
                    "x": Double(recognizedPoint.location.x),
                    "y": Double(1.0 - recognizedPoint.location.y),
                    "z": 0.0,
                    "visibility": Double(recognizedPoint.confidence)
                ]
            }
        }

        return results
    }
}
