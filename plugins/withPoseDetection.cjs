// plugins/withPoseDetection.js
// Expo Config Plugin for Google ML Kit Pose Detection on Android
const { withProjectBuildGradle, withAppBuildGradle } = require('@expo/config-plugins');

const withPoseDetection = (config) => {
  // Ensure Google Maven repository is present in root build.gradle
  config = withProjectBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes('maven { url "https://maven.google.com" }')) {
      config.modResults.contents = config.modResults.contents.replace(
        /allprojects\s*\{\s*repositories\s*\{/,
        `allprojects {\n    repositories {\n        maven { url "https://maven.google.com" }`
      );
    }
    return config;
  });

  // Ensure ML Kit Pose Detection dependencies are added to app/build.gradle
  config = withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes('com.google.mlkit:pose-detection')) {
      config.modResults.contents = config.modResults.contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n    implementation 'com.google.mlkit:pose-detection:18.0.0-beta3'\n    implementation 'com.google.mlkit:pose-detection-accurate:18.0.0-beta3'`
      );
    }
    return config;
  });

  return config;
};

module.exports = withPoseDetection;
