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

function patchExpoModulePlugins() {
  const nodeModulesDir = path.join(rootDir, 'node_modules');
  const buildGradleFiles = findFilesRecursive(nodeModulesDir, 'build.gradle');

  const expoCorePluginPath = path.join(nodeModulesDir, 'expo-modules-core/android/ExpoModulesCorePlugin.gradle');
  if (!fs.existsSync(expoCorePluginPath)) {
    console.warn(`[Patch] Skip patching plugins: ExpoModulesCorePlugin.gradle not found at ${expoCorePluginPath}`);
    return;
  }

  const manualApplyHeader = '// Manual patch for missing expo-module-gradle-plugin';

  for (const filePath of buildGradleFiles) {
    if (filePath.includes('expo-modules-core')) continue;
    
    let content = fs.readFileSync(filePath, 'utf8');
    const hasPluginId = content.includes("'expo-module-gradle-plugin'");
    const hasManualApply = content.includes(manualApplyHeader);

    if (hasPluginId || (hasManualApply && content.includes('plugins {'))) {
      console.log(`[Patch] Patching/Repairing plugin usage in: ${filePath}`);
      
      // 1. Remove manual apply if it's in the wrong place
      content = content.replace(/\/\/ Manual patch[\s\S]*?applyKotlinExpoModulesCorePlugin\(\)\n/g, '');

      // 2. Replace plugins block with apply plugin
      content = content.replace(/plugins\s*\{([\s\S]*?)\}/g, (match, p1) => {
        let lines = p1.split('\n');
        let newApplies = '';
        lines.forEach(line => {
          let trimmed = line.trim();
          if (trimmed.startsWith('id ')) {
            let pluginId = trimmed.replace('id ', '').replace(/'/g, "").replace(/"/g, "").trim();
            if (pluginId && pluginId !== 'expo-module-gradle-plugin') {
              newApplies += `apply plugin: '${pluginId}'\n`;
            }
          }
        });
        return newApplies;
      });

      // 3. Add manual apply at the top
      const applyManual = `${manualApplyHeader}\napply from: new File(project(":expo-modules-core").projectDir.absolutePath, "ExpoModulesCorePlugin.gradle")\napplyKotlinExpoModulesCorePlugin()\n`;
      content = applyManual + content.trim();

      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
}

console.log('[Klutchh Android Patch] Running pre/post build patches...');
patchExpoModulesCorePlugin();
sanitizeAndroidBuildGradle();
patchAndroidGradleProperties();
patchExpoModulePlugins();
console.log('[Klutchh Android Patch] Complete.');
