/**
 * Patch script to resolve AGP 8+ / Gradle 8+ compatibility in Expo & React Native Android builds
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function patchExpoModulesCorePlugin() {
  const pluginPaths = [
    path.join(rootDir, 'node_modules/expo-modules-core/android/ExpoModulesCorePlugin.gradle'),
    path.join(rootDir, 'node_modules/expo/node_modules/expo-modules-core/android/ExpoModulesCorePlugin.gradle'),
  ];

  for (const pluginPath of pluginPaths) {
    if (fs.existsSync(pluginPath)) {
      let content = fs.readFileSync(pluginPath, 'utf8');
      const startIdx = content.indexOf('ext.useExpoPublishing = {');
      const endIdx = content.indexOf('ext.useCoreDependencies = {');
      
      if (startIdx !== -1 && endIdx !== -1) {
        const replacement = `ext.useExpoPublishing = {\n  // No-op to avoid AGP 8+ DefaultSoftwareComponentContainer release publishing errors during APK compilation\n}\n\n`;
        const updated = content.substring(0, startIdx) + replacement + content.substring(endIdx);
        if (updated !== content) {
          fs.writeFileSync(pluginPath, updated, 'utf8');
          console.log(`[Patch] Successfully patched ExpoModulesCorePlugin at: ${pluginPath}`);
        } else {
          console.log(`[Patch] ExpoModulesCorePlugin already clean at: ${pluginPath}`);
        }
      }
    }
  }
}

function patchAndroidBuildGradle() {
  const buildGradlePath = path.join(rootDir, 'android/build.gradle');
  if (fs.existsSync(buildGradlePath)) {
    let content = fs.readFileSync(buildGradlePath, 'utf8');
    if (!content.includes('compileSdkVersion rootProject.ext.compileSdkVersion')) {
      const subprojectsBlock = `\nsubprojects {\n    afterEvaluate { project ->\n        if (project.hasProperty("android")) {\n            android {\n                compileSdkVersion rootProject.ext.compileSdkVersion\n                buildToolsVersion rootProject.ext.buildToolsVersion\n            }\n        }\n    }\n}\n`;
      content += subprojectsBlock;
      fs.writeFileSync(buildGradlePath, content, 'utf8');
      console.log(`[Patch] Added subprojects compileSdkVersion fallback to android/build.gradle`);
    }
  }
}

function patchAndroidGradleProperties() {
  const gradlePropertiesPath = path.join(rootDir, 'android/gradle.properties');
  if (fs.existsSync(gradlePropertiesPath)) {
    let content = fs.readFileSync(gradlePropertiesPath, 'utf8');
    let modified = false;

    // Ensure adequate JVM memory for C++ / Skia compilation
    if (!content.includes('-Xmx4096m')) {
      content = content.replace(
        /org\.gradle\.jvmargs=.*/g,
        'org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8'
      );
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(gradlePropertiesPath, content, 'utf8');
      console.log(`[Patch] Updated android/gradle.properties`);
    }
  }
}

console.log('[Klutchh Android Patch] Running pre/post build patches...');
patchExpoModulesCorePlugin();
patchAndroidBuildGradle();
patchAndroidGradleProperties();
console.log('[Klutchh Android Patch] Complete.');
