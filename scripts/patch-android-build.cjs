/**
 * Patch script to resolve AGP 8+ / Gradle 8+ compatibility in Expo & React Native Android builds
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function findFilesRecursive(dir, filename) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(findFilesRecursive(fullPath, filename));
    } else if (item === filename) {
      results.push(fullPath);
    }
  }
  return results;
}

function patchExpoModulesCorePlugin() {
  const nodeModulesDir = path.join(rootDir, 'node_modules');
  const pluginPaths = findFilesRecursive(nodeModulesDir, 'ExpoModulesCorePlugin.gradle');

  for (const pluginPath of pluginPaths) {
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

function sanitizeAndroidBuildGradle() {
  const buildGradlePath = path.join(rootDir, 'android/build.gradle');
  if (fs.existsSync(buildGradlePath)) {
    let content = fs.readFileSync(buildGradlePath, 'utf8');
    // Ensure no broken afterEvaluate blocks exist
    if (content.includes('afterEvaluate')) {
      content = content.replace(/subprojects\s*\{[\s\S]*?afterEvaluate[\s\S]*?\}\s*\}/g, '');
      fs.writeFileSync(buildGradlePath, content, 'utf8');
      console.log(`[Patch] Sanitized android/build.gradle`);
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
sanitizeAndroidBuildGradle();
patchAndroidGradleProperties();
console.log('[Klutchh Android Patch] Complete.');
