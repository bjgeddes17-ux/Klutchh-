package com.klutchh.ethos;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.util.Base64;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.google.mediapipe.framework.image.BitmapImageBuilder;
import com.google.mediapipe.framework.image.MPImage;
import com.google.mediapipe.tasks.components.containers.NormalizedLandmark;
import com.google.mediapipe.tasks.core.BaseOptions;
import com.google.mediapipe.tasks.core.Delegate;
import com.google.mediapipe.tasks.vision.core.RunningMode;
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker;
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarkerResult;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "NativeHardwarePose")
public class NativeHardwarePosePlugin extends Plugin {
    private static final String TAG = "NativeHardwarePose";
    private static final String MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
    private static final String LOCAL_MODEL_NAME = "pose_landmarker_lite.task";

    private PoseLandmarker poseLandmarker;
    private boolean isGpuAccelerated = false;
    private final ExecutorService backgroundExecutor = Executors.newSingleThreadExecutor();

    @Override
    public void load() {
        super.load();
        initPoseLandmarker();
    }

    private synchronized void initPoseLandmarker() {
        if (poseLandmarker != null) return;

        backgroundExecutor.execute(() -> {
            try {
                Context context = getContext();
                File modelFile = new File(context.getFilesDir(), LOCAL_MODEL_NAME);

                // Download model to local sandbox if not present
                if (!modelFile.exists() || modelFile.length() < 1000000) {
                    Log.i(TAG, "Downloading MediaPipe Lite Float16 model to native storage for maximum GPU speed...");
                    URL url = new URL(MODEL_URL);
                    try (InputStream in = url.openStream(); FileOutputStream out = new FileOutputStream(modelFile)) {
                        byte[] buffer = new byte[8192];
                        int bytesRead;
                        while ((bytesRead = in.read(buffer)) != -1) {
                            out.write(buffer, 0, bytesRead);
                        }
                    }
                    Log.i(TAG, "Model downloaded successfully: " + modelFile.getAbsolutePath());
                }

                // Try GPU delegate first
                try {
                    BaseOptions baseOptions = BaseOptions.builder()
                            .setModelAssetPath(modelFile.getAbsolutePath())
                            .setDelegate(Delegate.GPU)
                            .build();

                    PoseLandmarker.PoseLandmarkerOptions options = PoseLandmarker.PoseLandmarkerOptions.builder()
                            .setBaseOptions(baseOptions)
                            .setRunningMode(RunningMode.IMAGE)
                            .setNumPoses(1)
                            .setMinPoseDetectionConfidence(0.3f)
                            .setMinPosePresenceConfidence(0.3f)
                            .setMinTrackingConfidence(0.3f)
                            .build();

                    poseLandmarker = PoseLandmarker.createFromOptions(context, options);
                    isGpuAccelerated = true;
                    Log.i(TAG, "PoseLandmarker initialized with native GPU acceleration (Mali/Adreno OpenCL/Vulkan)");
                } catch (Exception e) {
                    Log.w(TAG, "GPU delegate failed, falling back to multi-core CPU delegate: " + e.getMessage());
                    BaseOptions cpuOptions = BaseOptions.builder()
                            .setModelAssetPath(modelFile.getAbsolutePath())
                            .setDelegate(Delegate.CPU)
                            .build();

                    PoseLandmarker.PoseLandmarkerOptions options = PoseLandmarker.PoseLandmarkerOptions.builder()
                            .setBaseOptions(cpuOptions)
                            .setRunningMode(RunningMode.IMAGE)
                            .setNumPoses(1)
                            .setMinPoseDetectionConfidence(0.3f)
                            .setMinPosePresenceConfidence(0.3f)
                            .setMinTrackingConfidence(0.3f)
                            .build();

                    poseLandmarker = PoseLandmarker.createFromOptions(context, options);
                    isGpuAccelerated = false;
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to initialize Native Pose Landmarker", e);
            }
        });
    }

    @PluginMethod
    public void getHardwareCapabilities(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("supported", true);
        ret.put("isGpuAccelerated", isGpuAccelerated);
        ret.put("modelType", "pose_landmarker_lite_fp16");
        ret.put("delegate", isGpuAccelerated ? "GPU_OPENCL_VULKAN" : "CPU_MULTI_THREAD");
        ret.put("platform", "android_native");
        call.resolve(ret);
    }

    @PluginMethod
    public void detectFromBase64(PluginCall call) {
        final String rawBase64 = call.getString("base64");
        if (rawBase64 == null) {
            call.reject("Must provide base64 image data");
            return;
        }

        backgroundExecutor.execute(() -> {
            try {
                String cleanBase64 = rawBase64;
                if (cleanBase64.contains(",")) {
                    cleanBase64 = cleanBase64.substring(cleanBase64.indexOf(",") + 1);
                }
                byte[] decoded = Base64.decode(cleanBase64, Base64.DEFAULT);
                Bitmap bitmap = BitmapFactory.decodeByteArray(decoded, 0, decoded.length);

                if (bitmap == null) {
                    call.reject("Could not decode bitmap");
                    return;
                }

                if (poseLandmarker == null) {
                    initPoseLandmarker();
                    if (poseLandmarker == null) {
                        call.reject("Pose model not ready");
                        return;
                    }
                }

                // Downscale if higher than 360px to accelerate inference
                Bitmap scaledBitmap = bitmap;
                if (bitmap.getWidth() > 360 || bitmap.getHeight() > 360) {
                    int maxDim = Math.max(bitmap.getWidth(), bitmap.getHeight());
                    float scale = 360f / maxDim;
                    int targetW = Math.round(bitmap.getWidth() * scale);
                    int targetH = Math.round(bitmap.getHeight() * scale);
                    scaledBitmap = Bitmap.createScaledBitmap(bitmap, targetW, targetH, true);
                }

                MPImage mpImage = new BitmapImageBuilder(scaledBitmap).build();
                PoseLandmarkerResult result = poseLandmarker.detect(mpImage);

                if (scaledBitmap != bitmap && !scaledBitmap.isRecycled()) {
                    scaledBitmap.recycle();
                }
                if (!bitmap.isRecycled()) {
                    bitmap.recycle();
                }

                JSObject response = new JSObject();
                JSArray landmarksArray = new JSArray();

                if (result != null && !result.landmarks().isEmpty() && !result.landmarks().get(0).isEmpty()) {
                    List<NormalizedLandmark> lmList = result.landmarks().get(0);
                    for (NormalizedLandmark lm : lmList) {
                        JSObject obj = new JSObject();
                        obj.put("x", lm.x());
                        obj.put("y", lm.y());
                        obj.put("z", lm.z());
                        obj.put("visibility", lm.visibility().isPresent() ? lm.visibility().get() : 1.0f);
                        obj.put("presence", lm.presence().isPresent() ? lm.presence().get() : 1.0f);
                        landmarksArray.put(obj);
                    }
                }

                response.put("landmarks", landmarksArray);
                response.put("hasPose", landmarksArray.length() > 0);
                call.resolve(response);
            } catch (Exception e) {
                Log.e(TAG, "Error in native pose detection", e);
                call.reject("Inference failed: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void processVideoFrames(PluginCall call) {
        final String videoPath = call.getString("videoPath");
        final Integer targetFps = call.getInt("fps", 18);
        final int fps = (targetFps != null && targetFps > 0) ? Math.min(targetFps, 24) : 18;

        if (videoPath == null) {
            call.reject("Must provide videoPath");
            return;
        }

        backgroundExecutor.execute(() -> {
            MediaMetadataRetriever retriever = new MediaMetadataRetriever();
            try {
                if (videoPath.startsWith("http://") || videoPath.startsWith("https://")) {
                    retriever.setDataSource(videoPath, new java.util.HashMap<String, String>());
                } else if (videoPath.startsWith("content://") || videoPath.startsWith("file://")) {
                    retriever.setDataSource(getContext(), Uri.parse(videoPath));
                } else {
                    retriever.setDataSource(videoPath);
                }

                String durationStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION);
                long durationMs = durationStr != null ? Long.parseLong(durationStr) : 0;
                
                long intervalUs = (1000000L / fps);
                long durationUs = durationMs * 1000L;

                if (poseLandmarker == null) {
                    initPoseLandmarker();
                }

                JSArray framesArray = new JSArray();
                int frameIndex = 0;

                for (long timeUs = 0; timeUs < durationUs; timeUs += intervalUs) {
                    Bitmap frameBitmap = null;
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O_MR1) {
                        // High-speed hardware-scaled extraction at 360p directly in native decoder
                        frameBitmap = retriever.getScaledFrameAtTime(timeUs, MediaMetadataRetriever.OPTION_CLOSEST, 360, 360);
                    } else {
                        Bitmap raw = retriever.getFrameAtTime(timeUs, MediaMetadataRetriever.OPTION_CLOSEST);
                        if (raw != null) {
                            frameBitmap = Bitmap.createScaledBitmap(raw, 360, 360, true);
                            if (raw != frameBitmap && !raw.isRecycled()) raw.recycle();
                        }
                    }

                    if (frameBitmap != null) {
                        MPImage mpImage = new BitmapImageBuilder(frameBitmap).build();
                        PoseLandmarkerResult result = (poseLandmarker != null) ? poseLandmarker.detect(mpImage) : null;

                        JSObject frameObj = new JSObject();
                        frameObj.put("index", frameIndex);
                        frameObj.put("timestamp", (timeUs / 1000000.0));

                        JSArray lmArray = new JSArray();
                        if (result != null && !result.landmarks().isEmpty() && !result.landmarks().get(0).isEmpty()) {
                            List<NormalizedLandmark> lmList = result.landmarks().get(0);
                            for (NormalizedLandmark lm : lmList) {
                                JSObject pt = new JSObject();
                                pt.put("x", lm.x());
                                pt.put("y", lm.y());
                                pt.put("z", lm.z());
                                pt.put("visibility", lm.visibility().isPresent() ? lm.visibility().get() : 1.0f);
                                lmArray.put(pt);
                            }
                        }
                        frameObj.put("landmarks", lmArray);
                        framesArray.put(frameObj);
                        frameIndex++;

                        if (!frameBitmap.isRecycled()) {
                            frameBitmap.recycle();
                        }
                    }
                }

                JSObject res = new JSObject();
                res.put("totalFrames", framesArray.length());
                res.put("frames", framesArray);
                res.put("durationMs", durationMs);
                call.resolve(res);
            } catch (Exception e) {
                Log.e(TAG, "Failed to analyze video natively", e);
                call.reject("Video analysis error: " + e.getMessage());
            } finally {
                try {
                    retriever.release();
                } catch (Exception ignored) {}
            }
        });
    }
}
