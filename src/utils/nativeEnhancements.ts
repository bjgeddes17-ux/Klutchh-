import { LocalNotifications } from '@capacitor/local-notifications';

// Native Hardware & UX Enhancements for Production APK

// 1. Web Audio API Sound Cues (Zero external files, 100% offline)
class SoundCueManager {
  private audioCtx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public playTone(freq: number, durationMs: number, type: OscillatorType = 'sine', gainVal = 0.1) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      // Ignore audio context errors in restricted environments
    }
  }

  public countdownBeep(isFinal = false) {
    this.playTone(isFinal ? 880 : 440, 150, 'sine', 0.15);
  }

  public successChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      this.playTone(523.25, 120, 'triangle', 0.1); // C5
      setTimeout(() => this.playTone(659.25, 120, 'triangle', 0.1), 100); // E5
      setTimeout(() => this.playTone(783.99, 250, 'triangle', 0.15), 200); // G5
    } catch {
      this.playTone(600, 200, 'sine', 0.15);
    }
  }

  public errorBuzz() {
    this.playTone(180, 300, 'sawtooth', 0.2);
  }
}

export const soundCues = new SoundCueManager();

// 2. Screen Wake Lock API (Keeps screen active during recording/drills)
class WakeLockManager {
  private wakeLock: WakeLockSentinel | null = null;

  public async request(): Promise<void> {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        if (!this.wakeLock) {
          this.wakeLock = await navigator.wakeLock.request('screen');
          this.wakeLock.addEventListener('release', () => {
            this.wakeLock = null;
          });
        }
      } catch {
        // Wake lock denied or not available
      }
    }
  }

  public async release(): Promise<void> {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
      } catch {
        // Ignore release error
      }
      this.wakeLock = null;
    }
  }
}

export const wakeLock = new WakeLockManager();

// 3. Notification Manager (In-app alerts & Background running indicator)
class NotificationManager {
  private hasPermission = false;
  private BACKGROUND_NOTIF_ID = 999;

  public async requestPermission() {
    if (typeof window === 'undefined') return false;
    try {
      const status = await LocalNotifications.requestPermissions();
      this.hasPermission = status.display === 'granted';
      return this.hasPermission;
    } catch {
      return false;
    }
  }

  public async send(title: string, body: string, id: number = Math.floor(Math.random() * 1000)) {
    if (typeof window === 'undefined') return;
    if (!this.hasPermission) await this.requestPermission();
    if (!this.hasPermission) return;

    await LocalNotifications.schedule({
      notifications: [{ title, body, id, schedule: { at: new Date(Date.now() + 100) } }]
    });
  }

  public async showBackgroundRunning(title = 'Klutchh is active', body = 'Biomechanics engine is ready in the background.') {
    if (typeof window === 'undefined') return;
    if (!this.hasPermission) await this.requestPermission();
    if (!this.hasPermission) return;

    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: this.BACKGROUND_NOTIF_ID,
          ongoing: true,
          autoCancel: false,
          group: 'background_status'
        }
      ]
    });
  }

  public async hideBackgroundRunning() {
    if (typeof window === 'undefined') return;
    await LocalNotifications.cancel({
      notifications: [{ id: this.BACKGROUND_NOTIF_ID }]
    });
  }
}

export const notifications = new NotificationManager();

// 4. Haptic Feedback (Tactile vibration on touch & milestones)
export function triggerHaptic(style: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'medium') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      switch (style) {
        case 'light':
          navigator.vibrate(20);
          break;
        case 'medium':
          navigator.vibrate(40);
          break;
        case 'heavy':
          navigator.vibrate(80);
          break;
        case 'success':
          navigator.vibrate([30, 50, 80]);
          break;
        case 'error':
          navigator.vibrate([100, 50, 100, 50, 150]);
          break;
      }
    } catch {
      // Vibration not permitted
    }
  }
}

// 4. Background & App Lifecycle Visibility Manager
export function setupAppLifecycleHandlers(
  onBackground: () => void,
  onForeground: () => void
): () => void {
  if (typeof document === 'undefined') return () => {};

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      onBackground();
    } else {
      onForeground();
    }
  };

  const handlePageHide = () => {
    onBackground();
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pagehide', handlePageHide);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('pagehide', handlePageHide);
  };
}
