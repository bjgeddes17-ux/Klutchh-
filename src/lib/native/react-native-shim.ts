// Shim for react-native-web to provide missing exports required by Expo modules
export * from 'react-native-web';

export const TurboModuleRegistry = {
  get: () => null,
  getEnforcing: () => null,
};
