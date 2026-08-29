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
      if (content.includes('from components.release') && !content.includes('components.findByName("release")')) {
        console.log(`[Patch] Patching ExpoModulesCorePlugin at: ${pluginPath}`);
        content = content.replace(
          /ext\.useExpoPublishing\s*=\s*\{[\s\S]*?project\.afterEvaluate\s*\{[\s\S]*?publications\s*\{[\s\S]*?release\(MavenPublication\)\s*\{[\s\S]*?from\s+components\.release[\s\S]*?\}\s*\}\s*repositories\s*\{[\s\S]*?\}\s*\}\s*\}/,
          `ext.useExpoPublishing = {
  if (!project.plugins.hasPlugin('maven-publish')) {
    apply plugin: 'maven-publish'
  }

  try {
    project.android {
      publishing {
        singleVariant("release") {
          withSourcesJar()
        }
      }
    }
  } catch (Exception ignored) {}

  project.afterEvaluate {
    try {
      def releaseComponent = project.components.findByName("release")
      if (releaseComponent != null) {
        publishing {
          publications {
            release(MavenPublication) {
              from releaseComponent
            }
          }
          repositories {
            maven {
              url = mavenLocal().url
            }
          }
        }
      }
    } catch (Exception ignored) {}
  }
}`
        );
        fs.writeFileSync(pluginPath, content, 'utf8');
        console.log(`[Patch] Successfully patched ${pluginPath}`);
      } else {
        console.log(`[Patch] ExpoModulesCorePlugin already patched or up-to-date at ${pluginPath}`);
      }
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
patchAndroidGradleProperties();
console.log('[Klutchh Android Patch] Complete.');
