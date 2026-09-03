package com.klutchh.posedetector

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.pose.Pose
import com.google.mlkit.vision.pose.PoseDetection
import com.google.mlkit.vision.pose.PoseLandmark
import com.google.mlkit.vision.pose.accurate.AccuratePoseDetectorOptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.InputStream
import java.util.concurrent.Executors

class PoseDetectorModule : Module() {
  private val executor = Executors.newSingleThreadExecutor()

  private val detector by lazy {
    val options = AccuratePoseDetectorOptions.Builder()
      .setDetectorMode(AccuratePoseDetectorOptions.STREAM_MODE)
      .setPreferredHardwareConfigs(AccuratePoseDetectorOptions.CPU_GPU)
      .build()
    PoseDetection.getClient(options)
  }

  private val landmarkNames = mapOf(
    PoseLandmark.NOSE to "nose",
    PoseLandmark.LEFT_EYE_INNER to "left_eye_inner",
    PoseLandmark.LEFT_EYE to "left_eye",
    PoseLandmark.LEFT_EYE_OUTER to "left_eye_outer",
    PoseLandmark.RIGHT_EYE_INNER to "right_eye_inner",
    PoseLandmark.RIGHT_EYE to "right_eye",
    PoseLandmark.RIGHT_EYE_OUTER to "right_eye_outer",
    PoseLandmark.LEFT_EAR to "left_ear",
    PoseLandmark.RIGHT_EAR to "right_ear",
    PoseLandmark.LEFT_MOUTH to "left_mouth",
    PoseLandmark.RIGHT_MOUTH to "right_mouth",
    PoseLandmark.LEFT_SHOULDER to "left_shoulder",
    PoseLandmark.RIGHT_SHOULDER to "right_shoulder",
    PoseLandmark.LEFT_ELBOW to "left_elbow",
    PoseLandmark.RIGHT_ELBOW to "right_elbow",
    PoseLandmark.LEFT_WRIST to "left_wrist",
    PoseLandmark.RIGHT_WRIST to "right_wrist",
    PoseLandmark.LEFT_PINKY to "left_pinky",
    PoseLandmark.RIGHT_PINKY to "right_pinky",
    PoseLandmark.LEFT_INDEX to "left_index",
    PoseLandmark.RIGHT_INDEX to "right_index",
    PoseLandmark.LEFT_THUMB to "left_thumb",
    PoseLandmark.RIGHT_THUMB to "right_thumb",
    PoseLandmark.LEFT_HIP to "left_hip",
    PoseLandmark.RIGHT_HIP to "right_hip",
    PoseLandmark.LEFT_KNEE to "left_knee",
    PoseLandmark.RIGHT_KNEE to "right_knee",
    PoseLandmark.LEFT_ANKLE to "left_ankle",
    PoseLandmark.RIGHT_ANKLE to "right_ankle",
    PoseLandmark.LEFT_HEEL to "left_heel",
    PoseLandmark.RIGHT_HEEL to "right_heel",
    PoseLandmark.LEFT_FOOT_INDEX to "left_foot_index",
    PoseLandmark.RIGHT_FOOT_INDEX to "right_foot_index"
  )

  override fun definition() = ModuleDefinition {
    Name("PoseDetector")

    Function("isAvailable") {
      true
    }

    AsyncFunction("isAvailable") {
      true
    }

    AsyncFunction("detectPose") { imageUriString: String ->
      try {
        val bitmap = loadBitmapFromUri(imageUriString)
          ?: return@AsyncFunction mapOf("detected" to false, "error" to "Failed to load bitmap")
        
        val width = bitmap.width.toFloat()
        val height = bitmap.height.toFloat()
        val inputImage = InputImage.fromBitmap(bitmap, 0)
        val pose = Tasks.await(detector.process(inputImage))

        return@AsyncFunction formatPoseResult(pose, width, height)
      } catch (e: Exception) {
        return@AsyncFunction mapOf("detected" to false, "error" to (e.message ?: "Pose detection failed"))
      }
    }

    AsyncFunction("detectPoseFromBase64") { base64String: String ->
      try {
        val cleanBase64 = if (base64String.contains(",")) {
          base64String.substringAfter(",")
        } else {
          base64String
        }
        val decodedBytes = Base64.decode(cleanBase64, Base64.DEFAULT)
        val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
          ?: return@AsyncFunction mapOf("detected" to false, "error" to "Failed to decode Base64 image")

        val width = bitmap.width.toFloat()
        val height = bitmap.height.toFloat()
        val inputImage = InputImage.fromBitmap(bitmap, 0)
        val pose = Tasks.await(detector.process(inputImage))

        return@AsyncFunction formatPoseResult(pose, width, height)
      } catch (e: Exception) {
        return@AsyncFunction mapOf("detected" to false, "error" to (e.message ?: "Base64 pose detection failed"))
      }
    }
  }

  private fun loadBitmapFromUri(uriString: String): Bitmap? {
    return try {
      val context = appContext.reactContext ?: return null
      val uri = Uri.parse(uriString)

      if (uri.scheme == "file" || uri.scheme == null) {
        val path = uri.path ?: uriString
        val file = File(path)
        if (file.exists()) {
          BitmapFactory.decodeFile(file.absolutePath)
        } else {
          BitmapFactory.decodeFile(path)
        }
      } else if (uri.scheme == "content") {
        val inputStream: InputStream? = context.contentResolver.openInputStream(uri)
        val bitmap = BitmapFactory.decodeStream(inputStream)
        inputStream?.close()
        bitmap
      } else {
        BitmapFactory.decodeFile(uriString)
      }
    } catch (e: Exception) {
      null
    }
  }

  private fun formatPoseResult(pose: Pose, width: Float, height: Float): Map<String, Any?> {
    val allLandmarks = pose.allPoseLandmarks
    if (allLandmarks.isEmpty()) {
      return mapOf(
        "detected" to false,
        "landmarks" to emptyList<Map<String, Any>>(),
        "width" to width,
        "height" to height
      )
    }

    val landmarkList = mutableListOf<Map<String, Any>>()
    var totalConfidence = 0.0f
    var landmarkCount = 0

    for (landmark in allLandmarks) {
      val type = landmark.landmarkType
      val name = landmarkNames[type] ?: "landmark_$type"
      val pos = landmark.position
      val pos3D = landmark.position3D
      val inFrameLikelihood = landmark.inFrameLikelihood

      totalConfidence += inFrameLikelihood
      landmarkCount++

      // Normalized coordinates [0..1]
      val normX = if (width > 0) pos.x / width else 0.0f
      val normY = if (height > 0) pos.y / height else 0.0f

      landmarkList.add(
        mapOf(
          "type" to type,
          "name" to name,
          "x" to pos.x,
          "y" to pos.y,
          "normX" to normX.coerceIn(0.0f, 1.0f),
          "normY" to normY.coerceIn(0.0f, 1.0f),
          "z" to pos3D.z,
          "score" to inFrameLikelihood
        )
      )
    }

    val avgConfidence = if (landmarkCount > 0) totalConfidence / landmarkCount else 0.0f

    return mapOf(
      "detected" to true,
      "confidence" to avgConfidence,
      "landmarks" to landmarkList,
      "width" to width,
      "height" to height
    )
  }
}
