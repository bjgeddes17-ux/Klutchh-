import { SportId, JointRule } from '../types';

export interface KineticStep {
  stepNumber: number;
  phaseName: string;
  title: string;
  description: string;
  keyRuleName?: string;
  targetAngleRange?: string;
}

export function calculateKlutchhScore(ruleResults?: Record<string, 'optimal' | 'good' | 'warning' | 'error'>): number {
  if (!ruleResults) return 7.5;
  const keys = Object.keys(ruleResults);
  if (keys.length === 0) return 7.5;

  let total = 0;
  keys.forEach((k) => {
    const res = ruleResults[k];
    if (res === 'optimal') total += 10;
    else if (res === 'good') total += 8.0;
    else if (res === 'warning') total += 5.5;
    else if (res === 'error') total += 3.0;
  });

  const score = total / keys.length;
  return Math.min(10, Math.max(1, Math.round(score * 10) / 10));
}

export function getBiomechanicalSequence(sportId: SportId, movementPhase?: string): KineticStep[] {
  switch (sportId) {
    case 'rugby':
      return [
        {
          stepNumber: 1,
          phaseName: 'Base Setup',
          title: 'Foot Plant & Center of Gravity',
          description: 'Establish wide, stable base with 100°-125° knee flexion to absorb impact safely.',
          keyRuleName: 'Tackle Base Knee Flexion',
          targetAngleRange: '100° - 125°',
        },
        {
          stepNumber: 2,
          phaseName: 'Spine Alignment',
          title: 'Hip Hinge & Neutral Spine',
          description: 'Hinge hips maintaining flat back and chin up to protect cervical spine.',
          keyRuleName: 'Spine & Hip Hinge',
          targetAngleRange: '120° - 145°',
        },
        {
          stepNumber: 3,
          phaseName: 'Shoulder Engagement',
          title: 'Lead Shoulder Wrap',
          description: 'Drive lead shoulder below carrier waist and extend wrap arm firmly.',
          keyRuleName: 'Shoulder Wrap Extension',
          targetAngleRange: '85° - 115°',
        },
        {
          stepNumber: 4,
          phaseName: 'Power Release',
          title: 'Leg Drive & Triple Extension',
          description: 'Drive through rear hip, knee, and ankle for maximum forward collision momentum.',
          keyRuleName: 'Leg Drive Triple Extension',
          targetAngleRange: '160° - 178°',
        },
      ];

    case 'soccer':
      return [
        {
          stepNumber: 1,
          phaseName: 'Approach & Plant',
          title: 'Plant Foot Placement',
          description: 'Plant non-kicking foot 10-15cm beside ball with 120°-145° knee flex to absorb load.',
          keyRuleName: 'Plant Foot Knee Flexion',
          targetAngleRange: '120° - 145°',
        },
        {
          stepNumber: 2,
          phaseName: 'Elastic Backswing',
          title: 'Knee Cocking & Hip Extension',
          description: 'Flex kicking knee behind body (80°-110°) loading elastic pelvic stretch.',
          keyRuleName: 'Kicking Knee Backswing',
          targetAngleRange: '80° - 110°',
        },
        {
          stepNumber: 3,
          phaseName: 'Impact Instant',
          title: 'Chest Over Ball & Ankle Lock',
          description: 'Unwind pelvis, lean chest forward over ball, and lock ankle firmly at contact.',
          keyRuleName: 'Chest Over Ball Alignment',
          targetAngleRange: '155° - 172°',
        },
        {
          stepNumber: 4,
          phaseName: 'Follow Through',
          title: 'High Arc Follow-Through',
          description: 'Extend kicking leg cleanly across body centerline for controlled trajectory.',
          keyRuleName: 'Follow-Through Leg Lift',
          targetAngleRange: '150° - 180°',
        },
      ];

    case 'netball':
      return [
        {
          stepNumber: 1,
          phaseName: 'Pre-Landing',
          title: 'Deceleration Stance',
          description: 'Square shoulders and align hips while tracking incoming pass airborne.',
          keyRuleName: 'Landing Phase Stance',
          targetAngleRange: '110° - 135°',
        },
        {
          stepNumber: 2,
          phaseName: 'Landing Cushion',
          title: 'Bilateral Soft Knee Dip',
          description: 'Flex both knees simultaneously to cushion ground reaction forces on court.',
          keyRuleName: 'Soft Double Knee Landing',
          targetAngleRange: '120° - 145°',
        },
        {
          stepNumber: 3,
          phaseName: 'Core Lift',
          title: 'Overhead Extension',
          description: 'Raise ball straight above head keeping elbows aligned with target net.',
          keyRuleName: 'High Release Shooting Elbow',
          targetAngleRange: '165° - 180°',
        },
        {
          stepNumber: 4,
          phaseName: 'Shot Release',
          title: 'Wrist Flick & Arc Follow',
          description: 'Snap wrist forward at top of leap imparting high arc trajectory.',
          keyRuleName: 'Shooting Power Knee Bend',
          targetAngleRange: '110° - 135°',
        },
      ];

    case 'hockey':
      return [
        {
          stepNumber: 1,
          phaseName: 'Low Crouch',
          title: 'Knee Bend & Low Center of Gravity',
          description: 'Crouch low with knees flexed 105°-130° to maintain stick control near turf.',
          keyRuleName: 'Low Crouch Knee Flexion',
          targetAngleRange: '105° - 130°',
        },
        {
          stepNumber: 2,
          phaseName: 'Windup Arc',
          title: 'Torso Coiling & Backswing',
          description: 'Rotate shoulders away from target loading power through spine and core.',
          keyRuleName: 'Stick Backswing Arc',
          targetAngleRange: '90° - 120°',
        },
        {
          stepNumber: 3,
          phaseName: 'Ball Impact',
          title: 'Lead Knee Lead & Flat Stick',
          description: 'Transfer weight forward onto lead leg with flat stick contact.',
          keyRuleName: 'Impact Moment Contact',
          targetAngleRange: '125° - 150°',
        },
        {
          stepNumber: 4,
          phaseName: 'Low Follow-Through',
          title: 'Turf Sweep Extension',
          description: 'Maintain low stick follow-through parallel to pitch surface for hitting safety.',
          keyRuleName: 'Low Stick Follow-Through',
          targetAngleRange: '140° - 175°',
        },
      ];


    case 'tennis':
      return [
        {
          stepNumber: 1,
          phaseName: 'Unit Turn',
          title: 'Shoulder Coiling & Racquet Takeback',
          description: 'Rotate torso 90° to net with 85°-110° elbow bend loading hip power.',
          keyRuleName: 'Unit Turn Torso Coiling',
          targetAngleRange: '100° - 135°',
        },
        {
          stepNumber: 2,
          phaseName: 'Racquet Drop',
          title: 'Deep Knee Dip & Loop Drop',
          description: 'Flex knees into loaded position while dropping racquet head below ball height.',
          keyRuleName: 'Forehand Knee Loading',
          targetAngleRange: '110° - 135°',
        },
        {
          stepNumber: 3,
          phaseName: 'Impact Instant',
          title: 'Hip Unwinding & Contact Lead',
          description: 'Drive kinetic energy from legs into hip uncoil and contact ball ahead of front hip.',
          keyRuleName: 'Forehand Contact Point Lead',
          targetAngleRange: '150° - 175°',
        },
        {
          stepNumber: 4,
          phaseName: 'Wiper Follow-Through',
          title: 'Over-the-Shoulder Wrap',
          description: 'Extend hitting arm across chest sweeping racquet smoothly over opposite shoulder.',
          keyRuleName: 'Over-Shoulder Follow-Through',
          targetAngleRange: '140° - 175°',
        },
      ];

    case 'golf':
      return [
        {
          stepNumber: 1,
          phaseName: 'Address Stance',
          title: 'Spine Tilt & Athletic Knee Flex',
          description: 'Hinge hips 30°-45° forward with 135°-150° knee flexion maintaining neutral cervical posture.',
          keyRuleName: 'Address Spine Angle Hinge',
          targetAngleRange: '135° - 150°',
        },
        {
          stepNumber: 2,
          phaseName: 'Backswing Coiling',
          title: 'Lead Arm Straightness & Shoulder Turn',
          description: 'Keep lead arm straight (165°-180°) while coiling shoulders 90° against 45° hip turn.',
          keyRuleName: 'Lead Arm Straightness at Top',
          targetAngleRange: '165° - 180°',
        },
        {
          stepNumber: 3,
          phaseName: 'Downswing Impact',
          title: 'Pelvic Shift & Shaft Lean Contact',
          description: 'Unwind hips toward target transferring weight to lead foot with shaft forward lean.',
          keyRuleName: 'Downswing Lead Hip Weight Transfer',
          targetAngleRange: '120° - 150°',
        },
        {
          stepNumber: 4,
          phaseName: 'Follow-Through Finish',
          title: 'Chest-to-Target Tall Finish',
          description: 'Finish balanced on front foot with chest facing target and rear toe balanced upright.',
          keyRuleName: 'Balanced High Finish Extension',
          targetAngleRange: '160° - 180°',
        },
      ];

    case 'cricket':
    default:
      return [
        {
          stepNumber: 1,
          phaseName: 'Delivery Stride',
          title: 'Bound & Back Foot Contact',
          description: 'Align shoulders down pitch and land firm back foot in delivery stride.',
          keyRuleName: 'Delivery Stride Alignment',
          targetAngleRange: '140° - 165°',
        },
        {
          stepNumber: 2,
          phaseName: 'Front Foot Plant',
          title: 'Front Knee Lock & Brace',
          description: 'Plant front foot firmly with extended knee to transfer linear runup speed into rotational whip.',
          keyRuleName: 'Front Knee Firm Extension',
          targetAngleRange: '160° - 180°',
        },
        {
          stepNumber: 3,
          phaseName: 'Release Instant',
          title: '15° Bowling Arm Straightness',
          description: 'Drive bowling arm over shoulder within 15° legal elbow straightness threshold.',
          keyRuleName: '15° Law Bowling Elbow',
          targetAngleRange: '165° - 180°',
        },
        {
          stepNumber: 4,
          phaseName: 'Follow Through',
          title: 'Downfield Deceleration Arc',
          description: 'Flex rear knee and rotate hips downfield decelerating safely across body.',
          keyRuleName: 'Downfield Follow-Through',
          targetAngleRange: '135° - 170°',
        },
      ];
  }
}
