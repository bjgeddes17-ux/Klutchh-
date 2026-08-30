Pod::Spec.new do |s|
  s.name           = 'KlutchhBiometrics'
  s.version        = '1.0.0'
  s.summary        = 'Native Biometrics Engine'
  s.description    = 'High-performance MediaPipe bridge for Klutchh'
  s.author         = 'Klutchh'
  s.homepage       = 'https://klutchh.com'
  s.platforms      = { :ios => '13.4' }
  s.source         = { :path => '.' }
  s.source_files   = 'ios/**/*.{h,m,swift}'
  s.dependency 'ExpoModulesCore'
end
