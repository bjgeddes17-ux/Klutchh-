import { FrameAnalysis, MediaPipeLandmark } from '../types';

export interface KineticTitanStats {
  omega: number; // Peak Angular Velocity (°/s)
  theta: number; // Principal Joint Angle (°)
  torque: number; // Estimated Peak Torque (Nm)
  titanPower: number; // 1-100 composite power score
  jointArmor: number; // 1-100 stability/safety score
  precision: number; // 1-100 alignment score
  kineticFlow: number; // 1-100 sequencing efficiency
  explosiveness: number; // rate of force development
}

/**
 * Mathematical Model for the Kinetic Titan Engine
 * Calculates physics-based metrics from raw pose data
 */
export function calculateKineticTitanMetrics(
  frames: FrameAnalysis[],
  principalJointIndex: number = 14, // Default to right elbow or knee depending on sport
  fps: number = 30
): KineticTitanStats {
  if (!frames || frames.length < 2) {
    return {
      omega: 0,
      theta: 0,
      torque: 0,
      titanPower: 0,
      jointArmor: 0,
      precision: 0,
      kineticFlow: 0,
      explosiveness: 0
    };
  }

  const dt = 1 / fps;
  let maxOmega = 0;
  let maxAlpha = 0; // Angular acceleration
  let principalAngle = 0;

  // 1. Calculate Angular Velocity (Omega) and Acceleration (Alpha)
  const angles: number[] = frames.map(f => {
    const val = Object.values(f.angles || {})[0];
    return typeof val === 'number' ? val : 120;
  });

  for (let i = 1; i < angles.length; i++) {
    const omega = Math.abs(angles[i] - angles[i - 1]) / dt;
    if (omega > maxOmega) maxOmega = omega;
    
    if (i > 1) {
      const prevOmega = Math.abs(angles[i - 1] - angles[i - 2]) / dt;
      const alpha = Math.abs(omega - prevOmega) / dt;
      if (alpha > maxAlpha) maxAlpha = alpha;
    }
  }

  principalAngle = angles[Math.floor(angles.length / 2)];

  // 2. Physics-Based Output Ability (Math Model)
  // Torque (τ) = I * α (Moment of Inertia * Angular Acceleration)
  // Simplified I for human limb segment (~0.15 - 0.25 kg*m^2)
  const limbInertia = 0.22; 
  const estimatedTorque = (limbInertia * (maxAlpha * (Math.PI / 180))); // Convert alpha to rad/s^2

  // 3. Titan Component Scorers
  // Power is a function of peak velocity and acceleration
  const titanPower = Math.min(99, Math.round((maxOmega / 800) * 50 + (maxAlpha / 2000) * 50));
  
  // Joint Armor is inverse of shear/instability (using angle variance as proxy)
  const angleMean = angles.reduce((a, b) => a + b, 0) / angles.length;
  const variance = angles.reduce((a, b) => a + Math.pow(b - angleMean, 2), 0) / angles.length;
  const jointArmor = Math.min(99, Math.max(40, Math.round(95 - (variance / 10))));

  // Precision based on deviation from "Golden Ratio" zones (110-145 typical for power)
  const precision = Math.min(99, Math.max(30, Math.round(100 - Math.abs(principalAngle - 128) * 0.8)));

  // Kinetic Flow (Sequencing)
  // High flow if velocity increases towards the end of the movement
  const firstHalf = angles.slice(0, Math.floor(angles.length / 2));
  const secondHalf = angles.slice(Math.floor(angles.length / 2));
  const firstVel = Math.abs(firstHalf[firstHalf.length - 1] - firstHalf[0]) / (firstHalf.length * dt);
  const secondVel = Math.abs(secondHalf[secondHalf.length - 1] - secondHalf[0]) / (secondHalf.length * dt);
  const kineticFlow = Math.min(99, Math.max(50, Math.round(85 + (secondVel > firstVel ? 10 : -15))));

  const explosiveness = Math.min(99, Math.round((maxAlpha / 3500) * 100));

  return {
    omega: Math.round(maxOmega),
    theta: Math.round(principalAngle),
    torque: parseFloat(estimatedTorque.toFixed(2)),
    titanPower,
    jointArmor,
    precision,
    kineticFlow,
    explosiveness
  };
}

export function getTitanRank(power: number): string {
  if (power >= 90) return 'Ethereal Titan';
  if (power >= 80) return 'Kinetic Overlord';
  if (power >= 70) return 'Force Master';
  if (power >= 60) return 'Velocity Vanguard';
  return 'Base Initiate';
}
