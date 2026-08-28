import { SportId, SkillLevel, AthleteCategory } from '../types';

export type AngleBracket = 'severe_flexion' | 'moderate_flexion' | 'optimal' | 'moderate_extension' | 'severe_extension';

export interface MatrixDrillNode {
  name: string;
  targetJoint: string;
  description: string;
  reps: string;
  whyThisWorks?: string;
  purpose?: string;
  howToExecute?: string[];
  coachingCue?: string;
}

export interface MatrixJointOutcome {
  bracket: AngleBracket;
  minAngle: number;
  maxAngle: number;
  status: 'optimal' | 'good' | 'warning' | 'error';
  headline: string;
  description: string;
  biomechanicalFault: string;
  forceLeakPercentage: number;
  injuryRiskLevel: 'low' | 'moderate' | 'high';
  injuryAnatomy: string;
  goldStandardTitle: string;
  goldStandardRange: string;
  goldStandardForceTransmission: string;
  strengthAsset: {
    title: string;
    desc: string;
    metric: string;
  };
  drills: MatrixDrillNode[];
  weeklyPrescription: {
    day1_2: string;
    day3_4: string;
    day5_7: string;
  };
}

export interface MatrixTechniqueRule {
  jointKey: string;
  jointName: string;
  phase: string;
  keypoints: [number, number, number];
  idealMin: number;
  idealMax: number;
  unit: string;
  importance: 'critical_safety' | 'performance' | 'posture';
  outcomes: Record<AngleBracket, MatrixJointOutcome>;
}

export interface SportMatrixDefinition {
  sportId: SportId;
  sportName: string;
  defaultTechniqueName: string;
  techniques: Record<string, MatrixTechniqueRule[]>;
  kineticSequencingOutcomes: {
    optimal: {
      headline: string;
      summary: string;
      takeaways: { category: string; title: string; detail: string }[];
      prescription: { title: string; detail: string }[];
    };
    earlyUpperBodyLeak: {
      headline: string;
      summary: string;
      takeaways: { category: string; title: string; detail: string }[];
      prescription: { title: string; detail: string }[];
    };
    stalledPelvisLeak: {
      headline: string;
      summary: string;
      takeaways: { category: string; title: string; detail: string }[];
      prescription: { title: string; detail: string }[];
    };
  };
}

// ---------------------------------------------------------------------------------
// 1. RUGBY BIOMECHANICAL RULES MATRIX
// ---------------------------------------------------------------------------------
const rugbyMatrix: SportMatrixDefinition = {
  sportId: 'rugby',
  sportName: 'Rugby Union & League',
  defaultTechniqueName: 'Contact & Passing Mastery',
  techniques: {
    tackle_contact: [
      {
        jointKey: 'knee_flex',
        jointName: 'Tackle Base Knee Flexion',
        phase: 'Contact Prep',
        keypoints: [24, 26, 28],
        idealMin: 100,
        idealMax: 125,
        unit: '°',
        importance: 'critical_safety',
        outcomes: {
          severe_flexion: {
            bracket: 'severe_flexion',
            minAngle: 0,
            maxAngle: 85,
            status: 'error',
            headline: 'Excessive Knee Collapse - Center of Gravity Trapped',
            description: 'Knee flexion measured under 85°. Dropping too low causes the hips to stall below the power zone, destroying driving momentum.',
            biomechanicalFault: 'Quadriceps and glute musculature are pushed into extreme active insufficiency, leaving zero elastic recoil for leg drive.',
            forceLeakPercentage: 32,
            injuryRiskLevel: 'moderate',
            injuryAnatomy: 'Patellofemoral joint compression and anterior knee overload.',
            goldStandardTitle: 'Power-Base Knee Flexion (100°-125°)',
            goldStandardRange: '100° - 125° Elastic Athletic Coil',
            goldStandardForceTransmission: 'Recruits 100% of gluteus maximus and vastus medialis for driving power.',
            strengthAsset: {
              title: 'Low Profile Body Height',
              desc: 'Athletic willingness to drop center of gravity prior to impact.',
              metric: 'Aggressive Low Stance'
            },
            drills: [
              {
                name: 'Quarter-Squat Collision Drive Holds',
                targetJoint: 'Knee & Hip Extensors',
                description: 'Builds isometric endurance in the optimal 110° power hinge window.',
                reps: '4 sets x 15s isometric holds',
                whyThisWorks: 'Teaches motor units to lock into the exact biomechanical sweet spot before contact.',
                purpose: 'Stabilize tackle entry height without collapsing.',
                howToExecute: [
                  'Set feet shoulder-width apart in athletic staggered stance.',
                  'Sink hips back until knee angle matches 110° (thighs above parallel).',
                  'Hold medicine ball or tackle shield against wall.',
                  'Drive into ground through midfoot without sinking lower.'
                ],
                coachingCue: '"Hips back, knees loaded, stay in the power pocket!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Isometric Wall Sits at 110° knee angle (3 sets x 30s)',
              day3_4: 'Trap Bar Deadlifts targeting 115° starting knee angle (4 sets x 6 reps)',
              day5_7: 'Live tackle pad entries with mirror height verification (20 reps)'
            }
          },
          moderate_flexion: {
            bracket: 'moderate_flexion',
            minAngle: 85,
            maxAngle: 99,
            status: 'warning',
            headline: 'Slight Over-Sink at Impact - Reduced Forward Driving Vector',
            description: 'Knee flexed at 85°-99°. Slightly too deep, causing forward leg drive to convert into an upward lifting motion rather than a dominant punch.',
            biomechanicalFault: 'Excessive downward displacement delays the leg-extension firing cycle by 0.12 seconds.',
            forceLeakPercentage: 16,
            injuryRiskLevel: 'low',
            injuryAnatomy: 'Minor hamstring strain vulnerability during rapid recovery.',
            goldStandardTitle: 'Power-Base Knee Flexion (100°-125°)',
            goldStandardRange: '100° - 125° Athletic Angle',
            goldStandardForceTransmission: 'Optimal force vector directed 15° forward through contact line.',
            strengthAsset: {
              title: 'Good Center of Mass Drop',
              desc: 'Good base lowering, safely beneath ball-carrier shoulder line.',
              metric: 'Safe Entry Height'
            },
            drills: [
              {
                name: 'Dynamic Box Step-Down Tackle Pops',
                targetJoint: 'Lead Knee & Hip Glutes',
                description: 'Trains instant transition from deceleration plant to forward punch.',
                reps: '3 sets x 8 reps per leg',
                whyThisWorks: 'Enhances stretch-shortening cycle (SSC) responsiveness in the quadriceps.',
                purpose: 'Eliminate over-sinking and initiate immediate leg drive.',
                howToExecute: [
                  'Step off a 6-inch aerobic step into tackle stance.',
                  'Catch weight at exactly 115° knee flex.',
                  'Instantly explode forward 2 steps into shield.'
                ],
                coachingCue: '"Catch and punch, do not linger at the bottom!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Depth drops to 110° knee catch (3x8 reps)',
              day3_4: 'Banded tackle entry pop throughs (3x10 reps)',
              day5_7: 'High-speed 5m tackle drills focusing on crisp knee angle'
            }
          },
          optimal: {
            bracket: 'optimal',
            minAngle: 100,
            maxAngle: 125,
            status: 'optimal',
            headline: 'Elite Power-Base Stance - Flawless Collision Platform',
            description: 'Measured knee flexion at optimal 100°-125°. Perfect athletic base positioning providing maximum leverage, balance, and horizontal driving force.',
            biomechanicalFault: 'None detected. Kinetic force transfer from ground to torso is operating at 96% efficiency.',
            forceLeakPercentage: 0,
            injuryRiskLevel: 'low',
            injuryAnatomy: 'Anatomically protected. Force absorbed through glutes and quads.',
            goldStandardTitle: 'World-Class Collision Mechanics',
            goldStandardRange: '100° - 125° Gold Standard',
            goldStandardForceTransmission: '100% ground reaction force converted to forward momentum.',
            strengthAsset: {
              title: 'Dominant Collision Base',
              desc: 'Flawless knee angle provides rock-solid leverage in the contact zone.',
              metric: 'Optimal 100°-125°'
            },
            drills: [
              {
                name: 'Elite Continuous Tackle Drive Circuit',
                targetJoint: 'Full Lower Kinetic Chain',
                description: 'Maintains optimal 115° knee flex under fatigue.',
                reps: '4 sets x 6 continuous drive reps',
                whyThisWorks: 'Consolidates neuromuscular muscle memory for 80-minute match stamina.',
                purpose: 'Maintain technical perfection under high cardiovascular strain.',
                howToExecute: [
                  'Enter tackle shield with 115° knee flexion.',
                  'Pump legs 4 steps driving shield back 5 meters.',
                  'Reset instantly and repeat.'
                ],
                coachingCue: '"Piston legs, keep the low base moving forward!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Heavy sled pushes maintaining 115° drive angle (4x15m)',
              day3_4: 'Reactionary multi-angle tackle pad drive reps (3x8 reps)',
              day5_7: 'Match simulation full contact reps'
            }
          },
          moderate_extension: {
            bracket: 'moderate_extension',
            minAngle: 126,
            maxAngle: 145,
            status: 'warning',
            headline: 'Tall Tackle Stance - High Risk of Being Driven Backward',
            description: 'Knee flexion measured at 126°-145°. Torso is riding too tall into the tackle, placing center of gravity above the ball carrier.',
            biomechanicalFault: 'Center of mass is 18cm higher than optimal, shifting collision pivot point to the chest.',
            forceLeakPercentage: 24,
            injuryRiskLevel: 'moderate',
            injuryAnatomy: 'Whiplash risk and sternoclavicular joint stress upon impact.',
            goldStandardTitle: 'Power-Base Knee Flexion (100°-125°)',
            goldStandardRange: '100° - 125° Lowered Hips',
            goldStandardForceTransmission: 'Forces the ball carrier upward rather than absorbing oncoming hit.',
            strengthAsset: {
              title: 'Vision & Target Tracking',
              desc: 'Eyes remained locked on target through approach.',
              metric: 'Head Up Alignment'
            },
            drills: [
              {
                name: 'Bungee Cord Low Tackle Gate Drills',
                targetJoint: 'Knee & Hip Hinge',
                description: 'Forces athlete under a 4-foot horizontal bungee cord prior to making tackle.',
                reps: '4 sets x 8 reps',
                whyThisWorks: 'External environmental constraint physically prevents early upright posture.',
                purpose: 'Force neuromuscular lowering of hip and knee joints.',
                howToExecute: [
                  'Set bungee cord at waist height 2 meters before tackle bag.',
                  'Sprint forward, sink knees to 110° to slide cleanly under cord.',
                  'Drive lead shoulder into bag.'
                ],
                coachingCue: '"Duck under the wire, explode into the target!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Low gate crawl-outs into tackle pop (4x6 reps)',
              day3_4: 'Defensive slide and sink drills under resistance (3x10 reps)',
              day5_7: 'Live game-speed low tackle entry confirmation'
            }
          },
          severe_extension: {
            bracket: 'severe_extension',
            minAngle: 146,
            maxAngle: 180,
            status: 'error',
            headline: 'Dangerous Upright Stiff-Leg Tackle - Critical Safety Warning',
            description: 'Knee angle measured above 146° (nearly straight leg). Dangerous upright entry puts defender at severe risk of concussion or knee hyper-extension.',
            biomechanicalFault: 'Zero kinetic absorption capacity. 100% of collision shock is transferred directly into spinal column and knee ligaments.',
            forceLeakPercentage: 45,
            injuryRiskLevel: 'high',
            injuryAnatomy: 'High risk of ACL tear, cervical neck compression, and head injury.',
            goldStandardTitle: 'Safe Low Tackle Entry',
            goldStandardRange: '100° - 125° Mandatory Safety Range',
            goldStandardForceTransmission: 'Absorbs collision safely through active muscular tension.',
            strengthAsset: {
              title: 'Commitment to Collision',
              desc: 'High courage and intent entering the contact zone.',
              metric: 'High Intensity Intent'
            },
            drills: [
              {
                name: 'Kneeling to Low-Stance Tackle Progression',
                targetJoint: 'Hip & Knee Kinematic Chain',
                description: 'Regresses tackle to floor-level mechanics to rebuild safe entry habits from scratch.',
                reps: '4 sets x 10 reps',
                whyThisWorks: 'Deconstructs dangerous upright habits by starting with zero knee extension freedom.',
                purpose: 'Completely eliminate dangerous straight-leg entries.',
                howToExecute: [
                  'Start on both knees 1 meter from tackle mat.',
                  'Step lead foot up into 110° plant position.',
                  'Drive shoulder into mat while keeping trail knee low.'
                ],
                coachingCue: '"Sink before you strike! Never tackle standing straight!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Kneeling shoulder punch progressions (4x8 reps)',
              day3_4: 'Staggered squat drops with tactile cueing (3x12 reps)',
              day5_7: 'Supervised low-impact pad tackles with coach sign-off'
            }
          }
        }
      },
      {
        jointKey: 'hip_hinge',
        jointName: 'Spine & Hip Hinge Angle',
        phase: 'Contact Prep',
        keypoints: [12, 24, 26],
        idealMin: 120,
        idealMax: 145,
        unit: '°',
        importance: 'critical_safety',
        outcomes: {
          severe_flexion: {
            bracket: 'severe_flexion',
            minAngle: 0,
            maxAngle: 105,
            status: 'error',
            headline: 'Over-Bent Spine - Head Dropped Below Hip Line',
            description: 'Hip hinge angle measured under 105°. Torso bent completely double, compromising neck safety and situational vision.',
            biomechanicalFault: 'Cervical spine is forced into extreme flexion, creating dangerous axial loading risk upon collision.',
            forceLeakPercentage: 35,
            injuryRiskLevel: 'high',
            injuryAnatomy: 'Cervical vertebrae compression and lumbar disc herniation risk.',
            goldStandardTitle: 'Flat-Back Hip Hinge (120°-145°)',
            goldStandardRange: '120° - 145° Neutral Spine',
            goldStandardForceTransmission: 'Maintains strong arch in thoracic spine, dissipating force across back musculature.',
            strengthAsset: {
              title: 'Aggressive Center Drop',
              desc: 'Committed to getting low on the ball carrier.',
              metric: 'Low Entry'
            },
            drills: [
              {
                name: 'Dowel Rod 3-Point Contact Hip Hinge Drills',
                targetJoint: 'Thoracic & Lumbar Spine',
                description: 'Maintains wooden dowel touching head, upper back, and sacrum simultaneously.',
                reps: '3 sets x 12 reps',
                whyThisWorks: 'Provides instant tactile biofeedback when the spine rounds into unsafe flexion.',
                purpose: 'Re-establish flat back and proud chest alignment.',
                howToExecute: [
                  'Hold dowel behind spine along vertical centerline.',
                  'Hinge at hips, pushing glutes back until torso reaches 130° angle.',
                  'Verify head, shoulders, and hips all remain touching dowel.'
                ],
                coachingCue: '"Chest up, flat back, eyes through your eyebrows!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Dowel rod Romanian Deadlifts (4x10 reps)',
              day3_4: 'Bird-dog core bracing with flat back holds (3x30s)',
              day5_7: 'Live pad entry with head-up check'
            }
          },
          moderate_flexion: {
            bracket: 'moderate_flexion',
            minAngle: 106,
            maxAngle: 119,
            status: 'warning',
            headline: 'Slight Forward Rounding - Minor Lumbar Shear Stress',
            description: 'Hip hinge angle measured at 106°-119°. Slight rounding of upper back during final approach step.',
            biomechanicalFault: 'Reduces rigidity of the kinetic bridge between legs and shoulder wrap.',
            forceLeakPercentage: 14,
            injuryRiskLevel: 'moderate',
            injuryAnatomy: 'Erector spinae muscle fatigue and mid-back stiffness.',
            goldStandardTitle: 'Flat-Back Hip Hinge (120°-145°)',
            goldStandardRange: '120° - 145° Ideal Hinge',
            goldStandardForceTransmission: 'Transmits 95% of leg drive into shoulder contact.',
            strengthAsset: {
              title: 'Forward Stride Direction',
              desc: 'Aggressive linear approach vector toward ball carrier.',
              metric: 'Direct Path'
            },
            drills: [
              {
                name: 'Kettlebell Romanian Deadlifts with Retracted Scapula',
                targetJoint: 'Hip Hinge & Scapular Retractors',
                description: 'Strengthens posterior chain to resist spinal rounding under dynamic load.',
                reps: '3 sets x 10 reps',
                whyThisWorks: 'Reinforces latissimus dorsi and rhomboid engagement to lock the spine straight.',
                purpose: 'Prevent spinal flexion during impact moment.',
                howToExecute: [
                  'Hold moderate kettlebell at mid-thigh.',
                  'Squeeze shoulder blades back and push hips behind heels.',
                  'Lower to knee level and snap hips forward to stand.'
                ],
                coachingCue: '"Proud chest, squeeze the orange between your shoulder blades!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Kettlebell RDLs (3x10 reps)',
              day3_4: 'Prone Cobra back extension holds (3x45s)',
              day5_7: 'Dynamic tackle bag wrap and roll drills'
            }
          },
          optimal: {
            bracket: 'optimal',
            minAngle: 120,
            maxAngle: 145,
            status: 'optimal',
            headline: 'Textbook Flat-Back Hip Hinge - Total Kinetic Alignment',
            description: 'Measured hip hinge at perfect 120°-145°. Spine is neutral, chest is broad, and neck is safely locked with chin up for total situational awareness.',
            biomechanicalFault: 'None detected. Kinetic chain is rigid and fully protected.',
            forceLeakPercentage: 0,
            injuryRiskLevel: 'low',
            injuryAnatomy: 'Anatomically ideal. Lumbar spine is in zero-shear position.',
            goldStandardTitle: 'Pro-Standard Spine Angle',
            goldStandardRange: '120° - 145° Optimal Window',
            goldStandardForceTransmission: 'Maximum kinetic bridge across core into contact point.',
            strengthAsset: {
              title: 'Neutral Spine Fortress',
              desc: 'Exceptional back posture provides unmatched collision durability.',
              metric: 'Optimal 120°-145°'
            },
            drills: [
              {
                name: 'High-Velocity Sled Collision Drives',
                targetJoint: 'Posterior Kinetic Chain',
                description: 'Applies full game-speed force through neutral spine posture.',
                reps: '4 sets x 5 drives',
                whyThisWorks: 'Transfers perfect gym biomechanics to high-chaos field conditions.',
                purpose: 'Lock in dominant collision habits under maximum power.',
                howToExecute: [
                  'Set flat back posture on heavy contact sled.',
                  'Drive through 5 meters with rapid leg turnover.',
                  'Maintain flat spine line from ear to ankle.'
                ],
                coachingCue: '"Lock the spine, punch through the target!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Heavy contact sled drives (4x5m)',
              day3_4: 'Resisted band hip pops (3x12 reps)',
              day5_7: 'Full speed 1v1 defensive channel reps'
            }
          },
          moderate_extension: {
            bracket: 'moderate_extension',
            minAngle: 146,
            maxAngle: 165,
            status: 'warning',
            headline: 'Upright Torso Hinge - High Center of Gravity Leak',
            description: 'Hip hinge measured at 146°-165°. Torso is too vertical, causing the defender to hit high and lose ground leverage.',
            biomechanicalFault: 'Increases moment arm against defender, allowing ball carrier to break tackle with lower body momentum.',
            forceLeakPercentage: 20,
            injuryRiskLevel: 'moderate',
            injuryAnatomy: 'Shoulder subluxation risk due to arm-reaching tackle.',
            goldStandardTitle: 'Flat-Back Hip Hinge (120°-145°)',
            goldStandardRange: '120° - 145° Hinge Angle',
            goldStandardForceTransmission: 'Directs force through center of mass.',
            strengthAsset: {
              title: 'Upright Visibility',
              desc: 'Maintained broad peripheral field vision.',
              metric: 'Head Up'
            },
            drills: [
              {
                name: 'Wall Hip Tap Deceleration Drills',
                targetJoint: 'Glutes & Hamstrings',
                description: 'Trains athlete to push hips backward rather than bending forward at waist.',
                reps: '3 sets x 12 reps',
                whyThisWorks: 'Establishes clear spatial awareness of pelvic displacement.',
                purpose: 'Increase hip hinge depth without dropping chest.',
                howToExecute: [
                  'Stand 1 foot in front of wall.',
                  'Hinge backward until glutes tap wall firmly.',
                  'Snap forward into balanced athletic stance.'
                ],
                coachingCue: '"Send the hips back to find the wall!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Wall hip taps (3x15 reps)',
              day3_4: 'Banded good mornings (3x12 reps)',
              day5_7: 'Low-pad wrap drills from 3m approach'
            }
          },
          severe_extension: {
            bracket: 'severe_extension',
            minAngle: 166,
            maxAngle: 180,
            status: 'error',
            headline: 'Completely Vertical Entry - Fatal Leverage Disadvantage',
            description: 'Hip angle at 166°-180° (completely vertical). Defender is attempting to tackle solely with upper body arms without engaging core or hips.',
            biomechanicalFault: 'Arm tackle only. 0% of lower body ground reaction force is transferred to the ball carrier.',
            forceLeakPercentage: 48,
            injuryRiskLevel: 'high',
            injuryAnatomy: 'Rotator cuff tears and acromioclavicular (AC) joint separation.',
            goldStandardTitle: 'Full-Body Kinematic Tackle',
            goldStandardRange: '120° - 145° Core Integration',
            goldStandardForceTransmission: 'Engages full kinetic chain instead of isolated arm reach.',
            strengthAsset: {
              title: 'Aggressive Arm Reach',
              desc: 'High hand speed attempting to wrap the target.',
              metric: 'Fast Arm Extension'
            },
            drills: [
              {
                name: 'Heavy Sandbag Hinge and Lift Drills',
                targetJoint: 'Full Posterior Chain & Core',
                description: 'Rebuilds the understanding of lifting through the hips rather than reaching with arms.',
                reps: '4 sets x 8 reps',
                whyThisWorks: 'Heavy load forces the athlete to hinge at the hips; vertical posture will fail the lift.',
                purpose: 'Instill mandatory hip hinge into muscle memory.',
                howToExecute: [
                  'Position sandbag between feet on ground.',
                  'Hinge deeply at hips (130°), clasp bag to chest.',
                  'Drive hips forward to stand tall.'
                ],
                coachingCue: '"Use your hips as the engine, not your arms!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Sandbag clean and hinges (4x8 reps)',
              day3_4: 'Low-sled tackle entries (4x5m)',
              day5_7: 'Controlled contact partner drills'
            }
          }
        }
      }
    ],
    passing_mechanics: [
      {
        jointKey: 'follow_through_elbow',
        jointName: 'Pass Follow-Through Arm Extension',
        phase: 'Pass Release',
        keypoints: [12, 14, 16],
        idealMin: 155,
        idealMax: 178,
        unit: '°',
        importance: 'performance',
        outcomes: {
          severe_flexion: {
            bracket: 'severe_flexion',
            minAngle: 0,
            maxAngle: 120,
            status: 'error',
            headline: 'Severely Truncated Pass - Short Shove Without Follow-Through',
            description: 'Arm extension cut off under 120°. The ball is "pushed" rather than guided, causing the pass to hang and wobble in the air.',
            biomechanicalFault: 'Truncating the follow-through deprives the ball of terminal spiral torque, reducing velocity by up to 35%.',
            forceLeakPercentage: 35,
            injuryRiskLevel: 'moderate',
            injuryAnatomy: 'Biceps tendon and anterior shoulder impingement from abrupt deceleration.',
            goldStandardTitle: 'Full Arm Extension Release (155°-178°)',
            goldStandardRange: '155° - 178° Complete Guide Path',
            goldStandardForceTransmission: '100% of rotational kinetic energy transferred into bullet spiral rotation.',
            strengthAsset: {
              title: 'Quick Hand Catch-and-Release',
              desc: 'Rapid transition from receiving to releasing the pass.',
              metric: 'Fast Catch-to-Pass'
            },
            drills: [
              {
                name: 'Target Point & Freeze Passing Drills',
                targetJoint: 'Elbow & Triceps',
                description: 'Passes to a receiver and holds fully locked arm extension pointing at chest for 2 seconds.',
                reps: '4 sets x 15 passes',
                whyThisWorks: 'Forces the motor cortex to complete the full kinetic trajectory without premature deceleration.',
                purpose: 'Ingrain full elbow lockout and fingertip guidance.',
                howToExecute: [
                  'Stand 10 meters from receiver.',
                  'Uncoil torso and snap arms out to full extension (170°).',
                  'Freeze hands pointing directly at receiver chest for 2 full seconds.',
                  'Verify thumbs are pointing down and palms out.'
                ],
                coachingCue: '"Point your fingers into the receiver\'s jersey!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Freeze-frame partner passing drills (50 reps)',
              day3_4: 'Weighted ball wrist snap and extension passes (4x12 reps)',
              day5_7: 'Full-pace 3v2 cutout passing under game pressure'
            }
          },
          moderate_flexion: {
            bracket: 'moderate_flexion',
            minAngle: 121,
            maxAngle: 154,
            status: 'warning',
            headline: 'Soft Elbow at Release - Minor Accuracy & Spin Leak',
            description: 'Elbow extension measured at 121°-154°. Arm is slightly soft at release, causing long cutout passes to lose flat trajectory.',
            biomechanicalFault: 'Incomplete extension reduces the acceleration arc by 12cm.',
            forceLeakPercentage: 15,
            injuryRiskLevel: 'low',
            injuryAnatomy: 'Minimal injury risk; primarily an accuracy and spin consistency leak.',
            goldStandardTitle: 'Full Arm Extension Release (155°-178°)',
            goldStandardRange: '155° - 178° Crisp Extension',
            goldStandardForceTransmission: 'Maximum spiral aerodynamic stability.',
            strengthAsset: {
              title: 'Smooth Torso Coiling',
              desc: 'Solid shoulder-hip separation during wind-up phase.',
              metric: 'Good Core Rotation'
            },
            drills: [
              {
                name: 'Heavy Pass Elastic Snap Throws',
                targetJoint: 'Triceps & Forearms',
                description: 'Passes a 1kg weighted training rugby ball focusing on full arm lock.',
                reps: '3 sets x 12 passes per side',
                whyThisWorks: 'Overload stimulus forces triceps activation through the final 20 degrees of extension.',
                purpose: 'Build terminal arm locking strength.',
                howToExecute: [
                  'Grip 1kg weighted ball with standard passing grip.',
                  'Drive pass across body, snapping arms completely straight.',
                  'Feel triceps contract hard at final release.'
                ],
                coachingCue: '"Snap the elbows straight, throw a dart!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Weighted ball passing snap drills (3x12 per side)',
              day3_4: 'Long cutout pass accuracy targets (40 reps)',
              day5_7: 'Rapid-fire passing gauntlet under defensive rush'
            }
          },
          optimal: {
            bracket: 'optimal',
            minAngle: 155,
            maxAngle: 178,
            status: 'optimal',
            headline: 'Clinical Spiral Pass Extension - Elite Guidance & Velocity',
            description: 'Arm extension measured at textbook 155°-178°. Full, fluid reach pointing directly at receiver chest with maximum spiral rotation and flat bullet flight.',
            biomechanicalFault: 'None detected. Kinetic transfer from hips through fingertips is operating at maximum efficiency.',
            forceLeakPercentage: 0,
            injuryRiskLevel: 'low',
            injuryAnatomy: 'Healthy biomechanical deceleration across full kinetic chain.',
            goldStandardTitle: 'World-Class Playmaker Pass',
            goldStandardRange: '155° - 178° Textbook Lockout',
            goldStandardForceTransmission: '100% rotational whip delivered through the ball.',
            strengthAsset: {
              title: 'Masterful Bullet Spiral',
              desc: 'Flawless arm extension guides pass with surgical accuracy.',
              metric: 'Optimal 155°-178°'
            },
            drills: [
              {
                name: 'Full-Speed 20m Cutout Target Drills',
                targetJoint: 'Full Passing Kinetic Chain',
                description: 'Delivers high-velocity 20m spiral passes on the dead run into moving target hoops.',
                reps: '4 sets x 10 passes',
                whyThisWorks: 'Challenges elite motor skills at maximum running velocity.',
                purpose: 'Maintain world-class passing accuracy under maximum game speed.',
                howToExecute: [
                  'Sprint across touchline at 85% maximum speed.',
                  'Fire 20m cutout pass through 1-meter target hoop.',
                  'Maintain clean follow-through pointing at target.'
                ],
                coachingCue: '"Punch the pass through the eye of the needle!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Long-range speed passing drills (40 reps)',
              day3_4: 'Opposed backline set-piece passing runs',
              day5_7: 'Match play distribution execution'
            }
          },
          moderate_extension: {
            bracket: 'moderate_extension',
            minAngle: 179,
            maxAngle: 185,
            status: 'good',
            headline: 'Complete Extension Achieved - Strong Guidance Vector',
            description: 'Arm extension at 179°-185°. Full guidance path achieved with strong forward projection.',
            biomechanicalFault: 'Slight hyperextension snap at release.',
            forceLeakPercentage: 4,
            injuryRiskLevel: 'low',
            injuryAnatomy: 'Minor olecranon tip joint stress if repeated without forearm deceleration.',
            goldStandardTitle: 'Full Arm Extension Release (155°-178°)',
            goldStandardRange: '155° - 178° Controlled Lock',
            goldStandardForceTransmission: 'Exceptional pass velocity.',
            strengthAsset: {
              title: 'Maximum Reach & Guidance',
              desc: 'Fully committed to guiding ball flight downfield.',
              metric: 'Full Arm Lock'
            },
            drills: [
              {
                name: 'Smooth Forearm Deceleration Swings',
                targetJoint: 'Elbow & Forearm Pronators',
                description: 'Focuses on smooth thumb-down wrist pronation at finish.',
                reps: '3 sets x 12 reps',
                whyThisWorks: 'Allows soft tissue to dissipate joint forces smoothly.',
                purpose: 'Protect elbow joint at terminal lockout.',
                howToExecute: [
                  'Execute pass with full arm extension.',
                  'Allow hands to turn thumbs-down smoothly as arms follow through across body.'
                ],
                coachingCue: '"Thumbs down, smooth finish across the chest!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Pronation follow-through control drills (30 reps)',
              day3_4: 'Partner spin pass accuracy circuits (40 reps)',
              day5_7: 'Game tempo passing accuracy'
            }
          },
          severe_extension: {
            bracket: 'severe_extension',
            minAngle: 186,
            maxAngle: 210,
            status: 'warning',
            headline: 'Severe Elbow Hyperextension - Joint Jarring Impact',
            description: 'Elbow snapped past 186° into hyperextension during violent pass release.',
            biomechanicalFault: 'Joint lock occurs before ball clears hand, jarring the elbow olecranon process.',
            forceLeakPercentage: 18,
            injuryRiskLevel: 'moderate',
            injuryAnatomy: 'Elbow hyperextension sprain and ulnar nerve irritation.',
            goldStandardTitle: 'Safe Controlled Arm Extension',
            goldStandardRange: '155° - 178° Controlled Lock',
            goldStandardForceTransmission: 'Maintains soft-tissue buffer at terminal range.',
            strengthAsset: {
              title: 'Explosive Arm Speed',
              desc: 'High velocity arm action generating tremendous ball speed.',
              metric: 'High Arm Velocity'
            },
            drills: [
              {
                name: 'Banded Triceps Deceleration Controls',
                targetJoint: 'Biceps & Brachialis Decelerators',
                description: 'Strengthens elbow flexors to decelerate high-speed arm extension safely.',
                reps: '3 sets x 15 reps',
                whyThisWorks: 'Improves eccentric braking capacity of the arm musculature.',
                purpose: 'Eliminate hyperextension joint jar.',
                howToExecute: [
                  'Anchor resistance band at shoulder height.',
                  'Extend arm rapidly and decelerate softly in the last 10 degrees.'
                ],
                coachingCue: '"Fast out, soft lock at the finish!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Eccentric biceps curls & band deceleration (3x12 reps)',
              day3_4: 'Controlled release passing accuracy (30 reps)',
              day5_7: 'Standard game passing'
            }
          }
        }
      }
    ]
  },
  kineticSequencingOutcomes: {
    optimal: {
      headline: 'Flawless Proximal-to-Distal Kinetic Sequencing (Hips -> Shoulders -> Hands)',
      summary: 'Biomechanical motion analysis confirms textbook kinetic sequencing. Lower body pelvic rotation fired at t=0.32s, transferring ground reaction torque into thoracic shoulder rotation (t=0.48s), which unleashed maximum rotational whip into the terminal hand release (t=0.62s). Energy transfer efficiency rated at 96%.',
      takeaways: [
        { category: 'Kinetic Whip', title: 'Sequential Energy Summation', detail: 'Each bodily segment accelerated and decelerated in exact order, multiplying force from ground to ball.' },
        { category: 'Torso Coiling', title: '42° Hip-Shoulder Separation', detail: 'Elastic stretch across abdominal obliques stored maximum rotational potential energy.' },
        { category: 'Joint Longevity', title: 'Safe Muscular Dissipation', detail: 'Deceleration forces absorbed through broad muscle groups rather than isolated ligaments.' }
      ],
      prescription: [
        { title: '1. Maintain High-Speed Transfer Under Load', detail: 'Perform 4 sets x 6 reps of Medicine Ball Rotational Slams to reinforce peak rotational power.' },
        { title: '2. Game Fatigue Challenge', detail: 'Execute 20 passing reps at 90% HR to guarantee sequencing does not degrade in late-game scenarios.' }
      ]
    },
    earlyUpperBodyLeak: {
      headline: 'Kinetic Sequence Break: Upper Body Initiated Movement Before Pelvis',
      summary: 'Motion tracking identified an early upper-body initiation. Shoulders and arms rotated at t=0.34s, prior to lower body pelvic clearance (t=0.46s). Bypassing the hips forces the athlete to generate velocity solely from upper-body arms and shoulders, resulting in a 24% loss in power and elevated strain on the rotator cuff.',
      takeaways: [
        { category: 'Power Leak', title: 'Ground Reaction Force Bypassed', detail: 'Arms worked in isolation without the powerful gluteal and pelvic engine.' },
        { category: 'Accuracy Vulnerability', title: 'Drifting Release Window', detail: 'Unsynchronized shoulder turn causes pass/tackle accuracy to fluctuate under pressure.' },
        { category: 'Shoulder Strain', title: 'Excessive Rotator Cuff Loading', detail: 'Shoulder joint forced to absorb high deceleration torque without core backing.' }
      ],
      prescription: [
        { title: '1. Step-and-Hip Lead Drill', detail: '3 sets x 10 reps initiating rotation strictly from the lead hip before releasing arms.' },
        { title: '2. Banded Rotational Hip Disconnects', detail: '3 sets x 12 reps holding shoulders square while turning pelvis 45 degrees.' }
      ]
    },
    stalledPelvisLeak: {
      headline: 'Pelvic Stall Detected: Hips Blocked Rotational Transfer Through Impact',
      summary: 'Pelvic rotation initiated correctly but stalled abruptly at 25 degrees of rotation, preventing full follow-through. This kinetic blockade caused energy to rebound into the lower lumbar spine, reducing horizontal force penetration.',
      takeaways: [
        { category: 'Kinetic Blockade', title: 'Premature Pelvic Deceleration', detail: 'Hips stopped rotating 0.15s before impact/release moment.' },
        { category: 'Lumbar Stress', title: 'Rotational Shear on Spine', detail: 'Torso twisted against stationary hips, increasing lower back strain.' }
      ],
      prescription: [
        { title: '1. Full Hip Clearance Step-Throughs', detail: '4 sets x 8 reps stepping completely through contact line to guarantee full pelvic follow-through.' }
      ]
    }
  }
};

// ---------------------------------------------------------------------------------
// 2. SOCCER / FOOTBALL BIOMECHANICAL RULES MATRIX
// ---------------------------------------------------------------------------------
const soccerMatrix: SportMatrixDefinition = {
  sportId: 'soccer',
  sportName: 'Soccer / Association Football',
  defaultTechniqueName: 'Power Strike & Ball Striking',
  techniques: {
    shooting_striking: [
      {
        jointKey: 'plant_foot_knee_flex',
        jointName: 'Plant Foot Knee Flexion',
        phase: 'Plant Phase',
        keypoints: [23, 25, 27],
        idealMin: 120,
        idealMax: 145,
        unit: '°',
        importance: 'critical_safety',
        outcomes: {
          severe_flexion: {
            bracket: 'severe_flexion',
            minAngle: 0,
            maxAngle: 105,
            status: 'error',
            headline: 'Deep Knee Collapse on Plant - Loss of Striking Height & Power',
            description: 'Plant knee flexed under 105°. Sinking too deep drops the hip too low, causing the kicking foot to drag or dig into the turf behind the ball.',
            biomechanicalFault: 'Excessive downward pelvic tilt shifts contact point below the ball equator, creating uncontrolled skyward ballooning.',
            forceLeakPercentage: 30,
            injuryRiskLevel: 'moderate',
            injuryAnatomy: 'Patellar tendon overload and quadriceps tendonitis.',
            goldStandardTitle: 'Solid Plant Platform (120°-145°)',
            goldStandardRange: '120° - 145° Elastic Knee Cushion',
            goldStandardForceTransmission: 'Absorbs 3x body weight while providing a tall, rigid pivot fulcrum.',
            strengthAsset: {
              title: 'Aggressive Approach Speed',
              desc: 'Committed approach stride with strong forward intent.',
              metric: 'High Speed Entry'
            },
            drills: [
              {
                name: 'Single-Leg Plant & Strike Freeze Drills',
                targetJoint: 'Plant Knee & Glute Medius',
                description: 'Runs up, plants non-kicking foot at 130° knee flex, strikes ball, and freezes on plant leg for 3 seconds.',
                reps: '4 sets x 8 strikes per leg',
                whyThisWorks: 'Builds eccentric isometric stability in the plant knee so it does not buckle under approach momentum.',
                purpose: 'Create an unyielding, stable foundation for the strike.',
                howToExecute: [
                  'Approach ball at 45° angle.',
                  'Plant foot 6 inches beside ball with knee flexed at exactly 130°.',
                  'Strike ball into net and hold balance on single plant leg for 3 seconds.'
                ],
                coachingCue: '"Plant firm like a tree trunk, freeze on the plant leg!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Single-leg Romanian Deadlifts & plant holds (3x10 reps)',
              day3_4: 'Approach stride plant freezes (4x8 reps)',
              day5_7: 'Game-speed live shooting on goal'
            }
          },
          moderate_flexion: {
            bracket: 'moderate_flexion',
            minAngle: 106,
            maxAngle: 119,
            status: 'warning',
            headline: 'Slight Over-Flexion on Plant Foot - Minor Balance Deficit',
            description: 'Plant knee measured at 106°-119°. Slightly too deep, requiring extra effort to elevate the torso through follow-through.',
            biomechanicalFault: 'Delays pelvic uncoiling by 0.08 seconds.',
            forceLeakPercentage: 12,
            injuryRiskLevel: 'low',
            injuryAnatomy: 'Minor hamstring tightness on plant side.',
            goldStandardTitle: 'Solid Plant Platform (120°-145°)',
            goldStandardRange: '120° - 145° Ideal Plant',
            goldStandardForceTransmission: 'Optimal rotational pivot leverage.',
            strengthAsset: {
              title: 'Good Deceleration Absorption',
              desc: 'Knee absorbs landing momentum safely without joint jar.',
              metric: 'Safe Shock Absorption'
            },
            drills: [
              {
                name: 'Box Jump-Down to Firm Plant Strikes',
                targetJoint: 'Plant Leg Quadriceps',
                description: 'Steps off 6-inch box directly into planting foot beside ball.',
                reps: '3 sets x 10 reps',
                whyThisWorks: 'Conditions stretch-shortening cycle to maintain 130° knee angle under gravitational drop.',
                purpose: 'Reinforce tall, firm plant posture.',
                howToExecute: [
                  'Step off box, land on plant foot beside ball.',
                  'Strike ball cleanly without letting knee sink past 125°.'
                ],
                coachingCue: '"Catch your weight tall, strike through the center!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Depth landing holds at 130° (3x10 reps)',
              day3_4: 'Dynamic plant and strike targets (30 strikes)',
              day5_7: 'Free kick & shooting practice'
            }
          },
          optimal: {
            bracket: 'optimal',
            minAngle: 120,
            maxAngle: 145,
            status: 'optimal',
            headline: 'World-Class Plant Knee Anchor - Maximum Striking Fulcrum',
            description: 'Measured plant knee at perfect 120°-145°. Provides a rock-solid, shock-absorbing platform that converts 100% of forward running momentum into explosive ball speed.',
            biomechanicalFault: 'None detected. Kinetic chain operates with elite rotational whip.',
            forceLeakPercentage: 0,
            injuryRiskLevel: 'low',
            injuryAnatomy: 'Anatomically ideal. Plant knee ligaments are completely balanced.',
            goldStandardTitle: 'Pro-Standard Plant Mechanics (Kane / De Bruyne)',
            goldStandardRange: '120° - 145° Gold Standard',
            goldStandardForceTransmission: '98% of approach momentum converted into ball velocity.',
            strengthAsset: {
              title: 'Rock-Solid Plant Anchor',
              desc: 'Exceptional stability allows full hip whip release into the ball.',
              metric: 'Optimal 120°-145°'
            },
            drills: [
              {
                name: 'Power Strike Distance & Accuracy Circuit',
                targetJoint: 'Full Striking Kinetic Chain',
                description: 'Full-pace shooting from 20 meters targeting top/bottom corners.',
                reps: '4 sets x 6 strikes',
                whyThisWorks: 'Consolidates elite technique at maximum match pace.',
                purpose: 'Sustain world-class ball striking consistency.',
                howToExecute: [
                  'Receive rolling pass at top of box.',
                  'Plant with 130° knee flex 15cm from ball.',
                  'Drive laces through center-ball equator.'
                ],
                coachingCue: '"Firm plant, snap the laces through the leather!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Long-range ball striking drills (30 reps)',
              day3_4: 'First-time volley and half-volley striking (4x8 reps)',
              day5_7: 'Match play finishing scenarios'
            }
          },
          moderate_extension: {
            bracket: 'moderate_extension',
            minAngle: 146,
            maxAngle: 165,
            status: 'warning',
            headline: 'Rigid Plant Leg - High Impact Jarring & Trajectory Lift',
            description: 'Plant knee measured at 146°-165° (too straight). Fails to absorb landing shock, causing the torso to tilt backward and skies the ball over the bar.',
            biomechanicalFault: 'Straight plant leg acts as an unyielding wall, throwing athlete center of mass backward.',
            forceLeakPercentage: 22,
            injuryRiskLevel: 'moderate',
            injuryAnatomy: 'Hyperextension knee strain and lumbar spine hyperextension.',
            goldStandardTitle: 'Solid Plant Platform (120°-145°)',
            goldStandardRange: '120° - 145° Soft Plant Knee',
            goldStandardForceTransmission: 'Keeps chest positioned over the ball for low driving flight.',
            strengthAsset: {
              title: 'Fast Leg Whip',
              desc: 'High kicking leg backswing velocity.',
              metric: 'Fast Backswing'
            },
            drills: [
              {
                name: 'Chest-Over-Ball Low Driven Drill',
                targetJoint: 'Plant Knee & Torso Hinge',
                description: 'Strikes low driven balls while ensuring chest stays directly above plant knee.',
                reps: '4 sets x 10 strikes',
                whyThisWorks: 'Forces knee flexion to allow forward torso coverage.',
                purpose: 'Eliminate ballooned shots and protect knee joints.',
                howToExecute: [
                  'Plant with conscious knee bend (125°).',
                  'Lean chest directly over ball.',
                  'Strike through ball keeping flight under crossbar height.'
                ],
                coachingCue: '"Soft plant knee, nose over the ball!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Wall sits and staggered flex landings (3x12 reps)',
              day3_4: 'Low driven ball striking drills (40 reps)',
              day5_7: 'Game shooting from edge of penalty area'
            }
          },
          severe_extension: {
            bracket: 'severe_extension',
            minAngle: 166,
            maxAngle: 180,
            status: 'error',
            headline: 'Dangerous Straight-Leg Plant - Severe ACL & Joint Hazard',
            description: 'Plant knee angle measured above 166° (locked straight). Severe injury hazard transferring extreme ground shock into the knee capsule.',
            biomechanicalFault: 'Zero deceleration damping. Impact forces spike at 7x bodyweight through locked joint.',
            forceLeakPercentage: 42,
            injuryRiskLevel: 'high',
            injuryAnatomy: 'Critical ACL, meniscus, and hyperextension sprain risk.',
            goldStandardTitle: 'Safe Flexed Plant Foundation',
            goldStandardRange: '120° - 145° Mandatory Safety Range',
            goldStandardForceTransmission: 'Muscular dissipation prevents destructive ligament shear.',
            strengthAsset: {
              title: 'Aggressive Approach',
              desc: 'High courage attacking the ball at pace.',
              metric: 'Full Commitment'
            },
            drills: [
              {
                name: 'Stationary Soft-Landing Plant Progression',
                targetJoint: 'Plant Knee Shock Absorbers',
                description: 'Regresses striking to stationary 1-step approaches with mandatory deep knee flex.',
                reps: '4 sets x 10 reps',
                whyThisWorks: 'Re-patterns motor landing strategy before allowing full-speed striking.',
                purpose: 'Completely eliminate locked-knee plant habit.',
                howToExecute: [
                  'Take single step forward, landing with deep 120° knee bend.',
                  'Tap ball softly with laces.',
                  'Verify plant knee never locks straight.'
                ],
                coachingCue: '"Bend the knee, absorb the landing, protect the joint!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Single-step flex plant drills (30 reps)',
              day3_4: 'Eccentric leg press & quad strengthening (3x10 reps)',
              day5_7: 'Controlled supervised shooting'
            }
          }
        }
      }
    ]
  },
  kineticSequencingOutcomes: {
    optimal: {
      headline: 'Elite Proximal-to-Distal Whip (Pelvis -> Thigh -> Knee -> Foot)',
      summary: 'Biomechanical kinematic sequence analysis confirms a world-class kinetic chain. Pelvis opened and closed through impact (t=0.28s), triggering rapid thigh acceleration (t=0.42s), which whipped the lower shin and foot through the ball at peak velocity (t=0.56s). Ball striking efficiency rated at 98%.',
      takeaways: [
        { category: 'Kinetic Whip', title: 'Elastic Energy Catapult', detail: 'Thigh decelerated precisely prior to contact, transferring 100% of kinetic energy into foot snap.' },
        { category: 'Torso Alignment', title: 'Chest Over Ball Coverage', detail: 'Forward torso angle kept trajectory piercing and accurate.' }
      ],
      prescription: [
        { title: '1. Rotational Hip Snap Training', detail: '3 sets x 8 reps of cable woodchops to reinforce rotational uncoiling speed.' }
      ]
    },
    earlyUpperBodyLeak: {
      headline: 'Early Torso Opening - Loss of Hip Whip & Shot Power',
      summary: 'Upper body and shoulders rotated open before the plant foot landed and the hips uncoiled. This premature uncoiling leaks 20% of potential striking velocity and causes sliced or pulled trajectory.',
      takeaways: [
        { category: 'Power Leak', title: 'Premature Shoulder Open', detail: 'Shoulders faced goal 0.1s before plant foot impact.' }
      ],
      prescription: [
        { title: '1. Side-On Strike Holds', detail: '3 sets x 10 reps maintaining shoulders side-on until plant foot strikes turf.' }
      ]
    },
    stalledPelvisLeak: {
      headline: 'Restricted Pelvic Drive - Incomplete Hip Follow-Through',
      summary: 'Hips stalled at contact point rather than driving fully through the line of the shot, cutting off follow-through height and ball penetration.',
      takeaways: [
        { category: 'Follow-Through', title: 'Truncated Hip Rotation', detail: 'Kicking hip did not rotate past plant hip after contact.' }
      ],
      prescription: [
        { title: '1. Step-Through Landing Drills', detail: '4 sets x 8 strikes landing on kicking foot 1 meter past original ball position.' }
      ]
    }
  }
};

// ---------------------------------------------------------------------------------
// 3. BASKETBALL / NETBALL / COURT SPORTS BIOMECHANICAL MATRIX
// ---------------------------------------------------------------------------------
const netballMatrix: SportMatrixDefinition = {
  sportId: 'netball',
  sportName: 'Netball & Court Shooting',
  defaultTechniqueName: 'High Shooting Arc & Landing Safety',
  techniques: {
    shooting: [
      {
        jointKey: 'high_release_elbow',
        jointName: 'Shooting Arm Elbow Extension',
        phase: 'Ball Release',
        keypoints: [12, 14, 16],
        idealMin: 160,
        idealMax: 180,
        unit: '°',
        importance: 'performance',
        outcomes: {
          severe_flexion: {
            bracket: 'severe_flexion',
            minAngle: 0,
            maxAngle: 135,
            status: 'error',
            headline: 'Pushed Chest Shot - Low Release Trajectory Deficit',
            description: 'Shooting elbow extension under 135°. The ball is shoved forward from the chest rather than elevated on a high parabolic arc.',
            biomechanicalFault: 'Flat entry angle reduces effective ring target area by 48%, causing rim bounce-outs.',
            forceLeakPercentage: 35,
            injuryRiskLevel: 'low',
            injuryAnatomy: 'Shoulder anterior cuff strain from flat shove mechanics.',
            goldStandardTitle: 'High Arc Elbow Lockout (160°-180°)',
            goldStandardRange: '160° - 180° Skyward Reach',
            goldStandardForceTransmission: 'Creates steep 52° entry angle into net ring.',
            strengthAsset: {
              title: 'Fast Release Speed',
              desc: 'Rapid transition from catch to shot release.',
              metric: 'Quick Release'
            },
            drills: [
              {
                name: 'High Wall Target & Freeze Snaps',
                targetJoint: 'Shooting Elbow & Triceps',
                description: 'Shoots against high wall aiming at target 12 feet high, holding full arm extension for 2 seconds.',
                reps: '4 sets x 15 shots',
                whyThisWorks: 'Forces skyward triceps extension rather than horizontal chest push.',
                purpose: 'Ingrain high elbow elevation and swan-neck wrist snap.',
                howToExecute: [
                  'Stand 3 feet from high gym wall.',
                  'Elevate elbow above eyebrow level.',
                  'Extend arm straight up to 175° and flick wrist.'
                ],
                coachingCue: '"Elbow above the eye, reach into the cookie jar!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Form shooting from 1 meter with elbow lock (50 reps)',
              day3_4: 'Banded overhead triceps lockouts (3x15 reps)',
              day5_7: 'Circle shooting under defensive distraction'
            }
          },
          moderate_flexion: {
            bracket: 'moderate_flexion',
            minAngle: 136,
            maxAngle: 159,
            status: 'warning',
            headline: 'Slight Elbow Softness at Release - Arc Inconsistency',
            description: 'Shooting elbow at 136°-159°. Minor softness at release causes shot depth to vary under pressure.',
            biomechanicalFault: 'Incomplete arm extension leaves 15cm of height off the release apex.',
            forceLeakPercentage: 14,
            injuryRiskLevel: 'low',
            injuryAnatomy: 'Zero injury risk; precision consistency factor.',
            goldStandardTitle: 'High Arc Elbow Lockout (160°-180°)',
            goldStandardRange: '160° - 180° Full Lockout',
            goldStandardForceTransmission: 'Optimal parabolic trajectory.',
            strengthAsset: {
              title: 'Smooth Knee Dip Synchronization',
              desc: 'Good lower body power contribution to shot upward momentum.',
              metric: 'Smooth Dip'
            },
            drills: [
              {
                name: 'Single-Hand Form Shooting Swishes',
                targetJoint: 'Shooting Elbow & Wrist',
                description: 'Shoots with shooting hand only from 4 feet, focusing on full elbow lock.',
                reps: '3 sets x 20 shots',
                whyThisWorks: 'Removes guide hand interference and isolates elbow extension.',
                purpose: 'Build consistent high-arc release mechanics.',
                howToExecute: [
                  'Set shooting hand under ball.',
                  'Extend legs and arm simultaneously.',
                  'Lock elbow completely straight and hold wrist flick.'
                ],
                coachingCue: '"Snap the elbow high, let the ball drop softly through the net!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Single-hand form shooting (50 reps)',
              day3_4: 'Catch-and-shoot high arc drills (40 reps)',
              day5_7: 'Full-court transition shooting'
            }
          },
          optimal: {
            bracket: 'optimal',
            minAngle: 160,
            maxAngle: 180,
            status: 'optimal',
            headline: 'Textbook High-Arc Release - Pure Parabolic Trajectory',
            description: 'Shooting arm elbow measured at flawless 160°-180°. Maximum high release point creates an expansive 52° ring entry angle for effortless swishes.',
            biomechanicalFault: 'None detected. Kinetic transfer from ankles to fingertips is operating at elite 98% efficiency.',
            forceLeakPercentage: 0,
            injuryRiskLevel: 'low',
            injuryAnatomy: 'Healthy fluid joint alignment.',
            goldStandardTitle: 'Pro-Standard Netball / Basketball Arc',
            goldStandardRange: '160° - 180° Optimal Lockout',
            goldStandardForceTransmission: '100% of leg drive transferred into ball loft and backspin.',
            strengthAsset: {
              title: 'Pure Swan-Neck Follow-Through',
              desc: 'Flawless high elbow elevation creates unguardable release trajectory.',
              metric: 'Optimal 160°-180°'
            },
            drills: [
              {
                name: 'Pressure Swish Shooting Gauntlet',
                targetJoint: 'Full Shooting Kinetic Chain',
                description: 'Shoots 20 shots from 5 circle zones requiring swishes only.',
                reps: '4 sets x 10 shots',
                whyThisWorks: 'Solidifies elite motor precision under cognitive scoring rules.',
                purpose: 'Master game-winning shooting under fatigue.',
                howToExecute: [
                  'Rotate around circle perimeter.',
                  'Release with high 175° elbow reach.',
                  'Focus on high arc dropping dead center.'
                ],
                coachingCue: '"High arc, soft touch, nothing but net!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Circle perimeter swish rounds (50 shots)',
              day3_4: 'Fatigue shooting after defensive sprints (30 shots)',
              day5_7: 'Match play shooting'
            }
          },
          moderate_extension: {
            bracket: 'moderate_extension',
            minAngle: 181,
            maxAngle: 190,
            status: 'good',
            headline: 'Full Overhead Lockout - Strong High Release Point',
            description: 'Shooting arm fully extended overhead with strong release height.',
            biomechanicalFault: 'Minor hyperextension snap.',
            forceLeakPercentage: 3,
            injuryRiskLevel: 'low',
            injuryAnatomy: 'Minor elbow hyperextension.',
            goldStandardTitle: 'High Arc Elbow Lockout (160°-180°)',
            goldStandardRange: '160° - 180° Optimal Range',
            goldStandardForceTransmission: 'High trajectory.',
            strengthAsset: {
              title: 'Maximum Shot Clearance',
              desc: 'High release makes shot nearly impossible to block.',
              metric: 'High Release Point'
            },
            drills: [
              {
                name: 'Soft Touch Wrist Flick Finishes',
                targetJoint: 'Wrist & Finger Flexors',
                description: 'Focuses on soft fingertip roll off index and middle fingers.',
                reps: '3 sets x 15 reps',
                whyThisWorks: 'Adds soft rotation to the high release.',
                purpose: 'Maximize shooting touch.',
                howToExecute: ['Extend arm tall and allow wrist to snap softly.']
              }
            ],
            weeklyPrescription: {
              day1_2: 'Fingertip roll drills (30 reps)',
              day3_4: 'Standard circle shooting (40 reps)',
              day5_7: 'Game shooting'
            }
          },
          severe_extension: {
            bracket: 'severe_extension',
            minAngle: 191,
            maxAngle: 210,
            status: 'warning',
            headline: 'Excessive Arm Snap - Stiff Release Jar',
            description: 'Elbow snapped into hyperextension past 191° causing stiff ball trajectory.',
            biomechanicalFault: 'Over-extension snaps ball with too much forward pace.',
            forceLeakPercentage: 16,
            injuryRiskLevel: 'moderate',
            injuryAnatomy: 'Elbow joint irritation.',
            goldStandardTitle: 'Controlled High Release',
            goldStandardRange: '160° - 180° Smooth Lock',
            goldStandardForceTransmission: 'Smooth kinetic transfer.',
            strengthAsset: {
              title: 'High Elevation Reach',
              desc: 'Great reach toward ring target.',
              metric: 'High Reach'
            },
            drills: [
              {
                name: 'Controlled Soft Elbow Lockouts',
                targetJoint: 'Elbow Joint Decelerators',
                description: 'Focuses on smooth extension without violent joint snap.',
                reps: '3 sets x 15 reps',
                whyThisWorks: 'Teaches control at terminal extension.'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Soft extension form shooting (30 reps)',
              day3_4: 'Circle shooting (30 reps)',
              day5_7: 'Match play'
            }
          }
        }
      }
    ]
  },
  kineticSequencingOutcomes: {
    optimal: {
      headline: 'Smooth Triple Extension Kinetic Sequence (Ankles -> Knees -> Hips -> Elbow -> Wrist)',
      summary: 'Biomechanical analysis reveals seamless vertical kinetic sequencing. Lower body dip generated upward momentum that flowed smoothly through hips, chest, and arms, culminating in a soft, high-arc fingertip release.',
      takeaways: [
        { category: 'Fluid Power', title: 'Effortless Energy Flow', detail: 'Shot power generated 80% from legs and core, leaving arms relaxed for pure touch.' }
      ],
      prescription: [
        { title: '1. Continuous Fluid Shooting', detail: '3 sets x 15 shots from 5 perimeter spots maintaining single fluid upward motion.' }
      ]
    },
    earlyUpperBodyLeak: {
      headline: 'Arm Initiation Disconnect - Shot Power Separated From Leg Drive',
      summary: 'Arms extended before legs fully uncoiled, breaking the kinetic chain and forcing athlete to push with shoulder muscles instead of riding lower-body momentum.',
      takeaways: [
        { category: 'Energy Leak', title: 'Hitch in Shot Dip', detail: 'Pause at bottom of dip disconnected leg power from arm release.' }
      ],
      prescription: [
        { title: '1. One-Motion Fluid Release Drills', detail: '4 sets x 12 shots ensuring ball rises continuously as knees extend.' }
      ]
    },
    stalledPelvisLeak: {
      headline: 'Incomplete Lower Body Extension - Flat Shot Arc',
      summary: 'Legs stopped extending early, forcing the shot to fall short on front rim.',
      takeaways: [
        { category: 'Range Leak', title: 'Under-Extended Legs', detail: 'Knees did not reach full extension at release.' }
      ],
      prescription: [
        { title: '1. Jump Shot Elevation Holds', detail: '3 sets x 12 reps focusing on tall vertical extension.' }
      ]
    }
  }
};

// ---------------------------------------------------------------------------------
// 4. CRICKET / BOWLING BIOMECHANICAL RULES MATRIX
// ---------------------------------------------------------------------------------
const cricketMatrix: SportMatrixDefinition = {
  sportId: 'cricket',
  sportName: 'Cricket & Bowling Mechanics',
  defaultTechniqueName: 'Pace Bowling & Front Knee Bracing',
  techniques: {
    bowling: [
      {
        jointKey: 'front_knee_brace',
        jointName: 'Front Knee Delivery Stride Brace',
        phase: 'Delivery Stride',
        keypoints: [24, 26, 28],
        idealMin: 165,
        idealMax: 178,
        unit: '°',
        importance: 'critical_safety',
        outcomes: {
          severe_flexion: {
            bracket: 'severe_flexion',
            minAngle: 0,
            maxAngle: 135,
            status: 'error',
            headline: 'Severe Front Knee Collapse - Massive Kinetic Brake Failure',
            description: 'Front knee flexed under 135° upon delivery stride landing. The knee acts as a soft shock absorber instead of an unyielding catapult fulcrum, bleeding 30% of ball speed.',
            biomechanicalFault: 'Ground reaction force is absorbed and wasted in quadriceps eccentric collapse instead of launching up through the torso and bowling arm.',
            forceLeakPercentage: 38,
            injuryRiskLevel: 'high',
            injuryAnatomy: 'Extreme patellar tendinopathy, knee joint shear, and lower back hyperextension.',
            goldStandardTitle: 'Braced Front Knee Anchor (165°-178°)',
            goldStandardRange: '165° - 178° Rigid Stiff Pillar',
            goldStandardForceTransmission: 'Vaults 6-8x bodyweight into explosive forward bowling arm velocity.',
            strengthAsset: {
              title: 'Fast Run-Up Momentum',
              desc: 'High approach velocity into the bowling crease.',
              metric: 'High Speed Run-Up'
            },
            drills: [
              {
                name: 'Braced-Leg Single Step Catapult Holds',
                targetJoint: 'Lead Knee & Quadriceps Tendon',
                description: 'Takes 1 step into crease, locks front knee rock-solid at 172°, and lets torso vault forward over the stiff leg.',
                reps: '4 sets x 8 reps',
                whyThisWorks: 'Conditions neuromuscular system to accept braking force without reflex buckling.',
                purpose: 'Build unyielding front knee brace.',
                howToExecute: [
                  'Step forward firmly onto lead foot.',
                  'Lock knee completely straight (172°).',
                  'Vault chest forward over front knee, holding balance for 3 seconds.'
                ],
                coachingCue: '"Plant like an iron pillar, let the chest catapult over!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Terminal Knee Extensions with heavy bands (4x15 reps)',
              day3_4: 'Single-step braced delivery drills into net (30 balls)',
              day5_7: 'Full run-up bowling with video knee angle audit'
            }
          },
          moderate_flexion: {
            bracket: 'moderate_flexion',
            minAngle: 136,
            maxAngle: 164,
            status: 'warning',
            headline: 'Soft Front Knee on Plant - Velocity & Bounce Leak',
            description: 'Front knee measured at 136°-164°. Soft bend at impact absorbs momentum, reducing release height and bowling pace by 6-10 km/h.',
            biomechanicalFault: 'Reduces catapult leverage arm by 18cm.',
            forceLeakPercentage: 18,
            injuryRiskLevel: 'moderate',
            injuryAnatomy: 'Patellar tendon irritation under repeated delivery loads.',
            goldStandardTitle: 'Braced Front Knee Anchor (165°-178°)',
            goldStandardRange: '165° - 178° Ideal Brace',
            goldStandardForceTransmission: 'Maximizes steep bounce and raw speed.',
            strengthAsset: {
              title: 'Smooth Delivery Stride Alignment',
              desc: 'Clean linear path down the center wicket.',
              metric: 'Direct Stride'
            },
            drills: [
              {
                name: 'Banded Delivery Stride Brace Snaps',
                targetJoint: 'Lead Quadriceps & Hip Hinge',
                description: 'Bowls from short 3-pace approach focusing on immediate knee lock at plant.',
                reps: '3 sets x 10 deliveries',
                whyThisWorks: 'Reinforces instantaneous knee extension under moderate approach momentum.',
                purpose: 'Eliminate soft knee yield at crease.',
                howToExecute: [
                  'Take 3 easy strides into crease.',
                  'Plant front heel and snap knee straight as bowling arm releases.'
                ],
                coachingCue: '"Lock the knee, snap the whip!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Heavy eccentric leg presses (3x8 reps)',
              day3_4: 'Short-stride pace bowling (24 deliveries)',
              day5_7: 'Match simulation bowling spells'
            }
          },
          optimal: {
            bracket: 'optimal',
            minAngle: 165,
            maxAngle: 178,
            status: 'optimal',
            headline: 'Elite Braced Front Knee - Maximum Pace Catapult',
            description: 'Front knee measured at phenomenal 165°-178°. Formed a rock-solid, unyielding brake that vaults ground reaction force straight through the torso into lethal ball speed and steep bounce.',
            biomechanicalFault: 'None detected. Kinetic catapult efficiency rated at 98%.',
            forceLeakPercentage: 0,
            injuryRiskLevel: 'low',
            injuryAnatomy: 'Healthy biomechanical brake alignment.',
            goldStandardTitle: 'World-Class Fast Bowler Standard (Cummins / Bumrah / Starc)',
            goldStandardRange: '165° - 178° Locked Iron Brace',
            goldStandardForceTransmission: '100% of horizontal run-up momentum converted into vertical ball launch whip.',
            strengthAsset: {
              title: 'Iron-Pillar Front Knee',
              desc: 'Uncompromising front-side brace generates fearsome ball pace and steep bounce.',
              metric: 'Optimal 165°-178°'
            },
            drills: [
              {
                name: 'Full Run-Up High-Impact Speed Target Drills',
                targetJoint: 'Full Bowling Kinetic Chain',
                description: 'Full run-up bowling targeting good-length wicket marker with maximum pace.',
                reps: '4 sets x 6 deliveries',
                whyThisWorks: 'Consolidates elite bracing under maximum approach speed.',
                purpose: 'Maintain world-class bowling speed and relentless accuracy.',
                howToExecute: [
                  'Sprint full run-up with rhythmic acceleration.',
                  'Plant front foot and lock knee like an iron post.',
                  'Drive chest through and snap wrist at release.'
                ],
                coachingCue: '"Solid brace, lethal pace, hit the top of off stump!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Target line bowling spells (36 balls)',
              day3_4: 'Plyometric box bounds and knee stability (4x6 reps)',
              day5_7: 'Match overs delivery spell'
            }
          },
          moderate_extension: {
            bracket: 'moderate_extension',
            minAngle: 179,
            maxAngle: 185,
            status: 'good',
            headline: 'Locked Front Knee - Tremendous Power Launch',
            description: 'Front knee fully locked at 179°-185°. Generates immense catapult force down the pitch.',
            biomechanicalFault: 'Minor hyperextension jar.',
            forceLeakPercentage: 2,
            injuryRiskLevel: 'low',
            injuryAnatomy: 'Minor posterior knee capsule stress.',
            goldStandardTitle: 'Braced Front Knee (165°-178°)',
            goldStandardRange: '165° - 178° Controlled Lock',
            goldStandardForceTransmission: 'Maximum ball speed.',
            strengthAsset: {
              title: 'Maximum Pace Generation',
              desc: 'Huge kinetic brake converts run-up into raw speed.',
              metric: 'Elite Pace'
            },
            drills: [
              {
                name: 'Safe Deceleration Follow-Through Drills',
                targetJoint: 'Hamstrings & Posterior Knee',
                description: 'Focuses on 2-step forward follow-through after release.',
                reps: '3 sets x 8 reps',
                whyThisWorks: 'Allows braking forces to dissipate safely after ball release.'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Follow-through stepping drills (20 reps)',
              day3_4: 'Standard bowling spells',
              day5_7: 'Match play'
            }
          },
          severe_extension: {
            bracket: 'severe_extension',
            minAngle: 186,
            maxAngle: 210,
            status: 'warning',
            headline: 'Front Knee Hyperextension - High Posterior Knee Strain',
            description: 'Front knee snapped backward into hyperextension upon delivery impact.',
            biomechanicalFault: 'Violent backward knee snap jars the posterior cruciate ligament.',
            forceLeakPercentage: 15,
            injuryRiskLevel: 'high',
            injuryAnatomy: 'PCL strain and knee hyperextension trauma.',
            goldStandardTitle: 'Controlled Firm Brace',
            goldStandardRange: '165° - 178° Controlled Stiff Leg',
            goldStandardForceTransmission: 'Prevents backward joint buckling.',
            strengthAsset: {
              title: 'Raw Bowling Power',
              desc: 'High velocity commitment into the crease.',
              metric: 'Maximum Effort'
            },
            drills: [
              {
                name: 'Controlled Soft-Lock Delivery Stride Drills',
                targetJoint: 'Hamstring & Popliteus Stabilizers',
                description: 'Reinforces front knee lock without snapping backward past straight.',
                reps: '3 sets x 10 deliveries'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Eccentric hamstring curls (3x10 reps)',
              day3_4: 'Controlled approach bowling (20 balls)',
              day5_7: 'Game bowling'
            }
          }
        }
      }
    ]
  },
  kineticSequencingOutcomes: {
    optimal: {
      headline: 'Perfect Fast Bowling Kinetic Catapult (Back Foot -> Front Knee Brace -> Hip Drive -> Torso Vault -> Arm Release)',
      summary: 'Biomechanical analysis reveals elite fast bowling kinetic sequencing. Back foot landing anchored the base (t=0.25s), front knee braced rigidly at crease (t=0.38s), and torso vaulted over the lead leg to unleash bowling arm through release point at 100% efficiency.',
      takeaways: [
        { category: 'Kinetic Catapult', title: 'Rigid Front-Side Fulcrum', detail: 'Front leg acted as an iron catapult post, multiplying arm velocity.' }
      ],
      prescription: [
        { title: '1. Maintain High Run-Up Rhythm', detail: '3 sets x 6 deliveries focusing on seamless transition from sprint to delivery stride.' }
      ]
    },
    earlyUpperBodyLeak: {
      headline: 'Mixed Bowling Action: Shoulders Counter-Rotated Against Hips',
      summary: 'Shoulders rotated front-on while hips remained side-on at back foot landing. This dangerous mixed action creates severe rotational shear stress on the lumbar spine.',
      takeaways: [
        { category: 'Safety Alert', title: 'Mixed Action Counter-Rotation', detail: 'Shoulders and hips misaligned by 38 degrees at crease impact.' }
      ],
      prescription: [
        { title: '1. Crease Alignment Drills', detail: '4 sets x 10 deliveries strictly aligning hips and shoulders side-on or front-on.' }
      ]
    },
    stalledPelvisLeak: {
      headline: 'Restricted Hip Drive - Bowler Fell Away to Off-Side',
      summary: 'Trailing hip failed to drive straight over the front leg, causing bowler head to fall away to off-side and losing ball direction.',
      takeaways: [
        { category: 'Alignment Leak', title: 'Off-Side Head Fall', detail: 'Head tilted 22cm outside lead foot line.' }
      ],
      prescription: [
        { title: '1. High Release Alignment Channels', detail: '3 sets x 12 balls bowling through narrow 1-meter target channel.' }
      ]
    }
  }
};

// ---------------------------------------------------------------------------------
// 5. TENNIS / RACKET SPORTS BIOMECHANICAL MATRIX
// ---------------------------------------------------------------------------------
const tennisMatrix: SportMatrixDefinition = {
  sportId: 'tennis',
  sportName: 'Tennis & Racket Sports',
  defaultTechniqueName: 'Forehand Topspin & Service Kinetic Whip',
  techniques: {
    forehand: [
      {
        jointKey: 'torso_rotation_coil',
        jointName: 'Hip-Shoulder Kinetic Separation (Coiling)',
        phase: 'Preparation Coil',
        keypoints: [11, 12, 24],
        idealMin: 110,
        idealMax: 140,
        unit: '°',
        importance: 'performance',
        outcomes: {
          severe_flexion: {
            bracket: 'severe_flexion',
            minAngle: 0,
            maxAngle: 90,
            status: 'error',
            headline: 'Over-Coiled Torso - Over-Rotation Delays Forward Strike',
            description: 'Shoulder turn over-coiled past 90°, turning the back completely to the net and blinding player vision.',
            biomechanicalFault: 'Over-rotation increases swing path travel distance by 30cm, causing late contact behind the hip.',
            forceLeakPercentage: 28,
            injuryRiskLevel: 'moderate',
            injuryAnatomy: 'Thoracic facet joint compression and abdominal oblique strain.',
            goldStandardTitle: 'Elastic Kinetic Coil (110°-140°)',
            goldStandardRange: '110° - 140° Ideal Coiling Angle',
            goldStandardForceTransmission: 'Elastic stretch across core muscles stores maximum rotational whip.',
            strengthAsset: {
              title: 'High Athletic Flexibility',
              desc: 'Great thoracic spine rotational mobility.',
              metric: 'High Mobility'
            },
            drills: [
              {
                name: '45-Degree Unit Turn Racket Drops',
                targetJoint: 'Thoracic Spine & Obliques',
                description: 'Prepares unit turn with non-dominant hand holding racket throat until 120° shoulder coil is reached.',
                reps: '4 sets x 12 reps',
                whyThisWorks: 'Keeps shoulders in the optimal power-stretch zone without over-rotating.',
                purpose: 'Ingrain exact unit turn depth.',
                howToExecute: [
                  'Start in ready stance.',
                  'Turn shoulders 120° while keeping eyes locked on incoming ball.',
                  'Drop racket tip into slot and drive forward.'
                ],
                coachingCue: '"Turn with both hands, keep the ball in your sights!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Medicine ball rotational wall tosses (3x10 reps)',
              day3_4: 'Unit turn shadow swings (40 reps)',
              day5_7: 'Live crosscourt forehand rallies'
            }
          },
          moderate_flexion: {
            bracket: 'moderate_flexion',
            minAngle: 91,
            maxAngle: 109,
            status: 'warning',
            headline: 'Slightly Deep Backswing Coil - Minor Timing Vulnerability',
            description: 'Shoulder coil at 91°-109°. Slightly deep backswing requires fast racket acceleration against high-speed incoming balls.',
            biomechanicalFault: 'Slight delay during rapid fast-court baseline exchanges.',
            forceLeakPercentage: 10,
            injuryRiskLevel: 'low',
            injuryAnatomy: 'Minimal injury risk.',
            goldStandardTitle: 'Elastic Kinetic Coil (110°-140°)',
            goldStandardRange: '110° - 140° Ideal Unit Turn',
            goldStandardForceTransmission: 'Optimal rotational power.',
            strengthAsset: {
              title: 'Deep Racket Wind-Up',
              desc: 'High potential energy loaded into backswing.',
              metric: 'Deep Coil'
            },
            drills: [
              {
                name: 'Compact Unit Turn Rapid Feed Drills',
                targetJoint: 'Shoulder Girdle & Core',
                description: 'Strikes rapid coach-fed balls focusing on short, explosive unit turn.',
                reps: '3 sets x 15 balls'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Compact unit turn feeds (30 balls)',
              day3_4: 'Crosscourt forehand depth control (40 balls)',
              day5_7: 'Match play'
            }
          },
          optimal: {
            bracket: 'optimal',
            minAngle: 110,
            maxAngle: 140,
            status: 'optimal',
            headline: 'Textbook Unit Turn Coil - Maximum Modern Topspin Whip',
            description: 'Measured shoulder-hip separation at optimal 110°-140°. Creates maximum elastic stretch across core obliques, unleashing lethal racket head speed and heavy topspin.',
            biomechanicalFault: 'None detected. Kinetic chain operates with elite rotational whip.',
            forceLeakPercentage: 0,
            injuryRiskLevel: 'low',
            injuryAnatomy: 'Healthy balanced rotational mechanics.',
            goldStandardTitle: 'Pro-Standard Modern Forehand (Alcaraz / Sinner / Federer)',
            goldStandardRange: '110° - 140° Gold Standard',
            goldStandardForceTransmission: '100% of hip and core uncoiling transferred into racket head RPMs.',
            strengthAsset: {
              title: 'Explosive Kinetic Coil',
              desc: 'Flawless hip-shoulder separation generates heavy, penetrating topspin.',
              metric: 'Optimal 110°-140°'
            },
            drills: [
              {
                name: 'High-RPM Crosscourt Topspin Targets',
                targetJoint: 'Full Forehand Kinetic Chain',
                description: 'Rallies deep crosscourt balls clearing net by 4 feet with heavy topspin dip.',
                reps: '4 sets x 15 balls',
                whyThisWorks: 'Consolidates world-class topspin mechanics at tournament intensity.',
                purpose: 'Dominate baseline rallies with heavy topspin penetration.',
                howToExecute: [
                  'Execute 125° unit turn.',
                  'Drop racket below ball line and accelerate upward through contact.',
                  'Finish follow-through windshield-wiper over opposite shoulder.'
                ],
                coachingCue: '"Coil the spring, brush the ball, whip the finish!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Heavy topspin target rallies (60 balls)',
              day3_4: 'Inside-out forehand attack sequences (40 balls)',
              day5_7: 'Tournament baseline sets'
            }
          },
          moderate_extension: {
            bracket: 'moderate_extension',
            minAngle: 141,
            maxAngle: 165,
            status: 'warning',
            headline: 'Under-Coiled Shoulders - Arm-Dominant Forehand Leak',
            description: 'Shoulder coil measured at 141°-165° (under-rotated). Fails to coil the torso, forcing athlete to push the ball with arm and wrist.',
            biomechanicalFault: 'Loss of core rotational power reduces topspin RPMs by 32%.',
            forceLeakPercentage: 22,
            injuryRiskLevel: 'moderate',
            injuryAnatomy: 'Tennis elbow (lateral epicondylitis) and wrist tendonitis.',
            goldStandardTitle: 'Elastic Kinetic Coil (110°-140°)',
            goldStandardRange: '110° - 140° Full Unit Turn',
            goldStandardForceTransmission: 'Powers stroke with large core muscles instead of fragile wrist tendons.',
            strengthAsset: {
              title: 'Fast Hand Speed',
              desc: 'Quick wrist acceleration into contact.',
              metric: 'Fast Hands'
            },
            drills: [
              {
                name: 'Non-Dominant Hand Target Point Unit Turns',
                targetJoint: 'Upper Torso & Rhomboids',
                description: 'Points non-dominant hand across body at incoming ball to force full 125° shoulder turn.',
                reps: '4 sets x 12 reps',
                whyThisWorks: 'Reaches non-dominant arm across chest, mechanically guaranteeing full shoulder coiling.',
                purpose: 'Eliminate arm-only forehands.',
                howToExecute: [
                  'Turn hips and track ball with outstretched left arm.',
                  'Ensure chest faces side fence before downswing begins.'
                ],
                coachingCue: '"Point at the ball, coil the chest!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Non-dominant arm tracking drills (40 reps)',
              day3_4: 'Medicine ball rotational throws (3x12 reps)',
              day5_7: 'Baseline rally execution'
            }
          },
          severe_extension: {
            bracket: 'severe_extension',
            minAngle: 166,
            maxAngle: 180,
            status: 'error',
            headline: 'Flat Chest-On Forehand - Zero Core Rotation',
            description: 'Shoulders square to net at 166°-180° during preparation. Arm works in complete isolation without body rotation.',
            biomechanicalFault: '100% of stroke velocity generated from forearm and elbow. Severe injury risk.',
            forceLeakPercentage: 45,
            injuryRiskLevel: 'high',
            injuryAnatomy: 'High risk of chronic lateral epicondylitis and wrist TFCC tear.',
            goldStandardTitle: 'Full-Body Rotational Unit Turn',
            goldStandardRange: '110° - 140° Mandatory Core Coil',
            goldStandardForceTransmission: 'Engages hips and core to take stress off wrist and elbow.',
            strengthAsset: {
              title: 'Hand-Eye Coordination',
              desc: 'Maintains consistent ball contact despite flat posture.',
              metric: 'Good Ball Contact'
            },
            drills: [
              {
                name: 'Side-Fence Touch Unit Turn Progression',
                targetJoint: 'Full Rotational Kinetic Chain',
                description: 'Prepares forehand by touching back of hand to imaginary side fence.',
                reps: '4 sets x 10 reps',
                whyThisWorks: 'Environmental tactile cue forces complete 90° body pivot.'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Unit turn side-fence touches (40 reps)',
              day3_4: 'Banded torso rotations (3x15 reps)',
              day5_7: 'Slow-feed forehand rebuilding'
            }
          }
        }
      }
    ]
  },
  kineticSequencingOutcomes: {
    optimal: {
      headline: 'Elite Modern Tennis Kinetic Whip (Leg Drive -> Pelvis Uncoil -> Torso -> Racket Lag -> Arm Snap)',
      summary: 'Biomechanical motion analysis confirms an exceptional modern topspin kinetic sequence. Ground force from knee extension triggered rapid pelvic uncoiling (t=0.22s), dragging the racket into deep lag before snapping through contact at peak angular acceleration (t=0.44s).',
      takeaways: [
        { category: 'Racket Lag', title: 'Deep Elastic Lag Arc', detail: 'Racket butt cap pointed at ball prior to contact, storing maximum whip.' }
      ],
      prescription: [
        { title: '1. Maintain Lag and Whiplash Acceleration', detail: '3 sets x 12 reps of weighted racket shadow swings.' }
      ]
    },
    earlyUpperBodyLeak: {
      headline: 'Early Arm Pull - Lost Racket Lag & Topspin Power',
      summary: 'Arm pulled racket forward before hips opened, destroying racket lag and forcing a flat, pushy stroke with reduced topspin depth.',
      takeaways: [
        { category: 'Power Leak', title: 'Lost Racket Lag', detail: 'Racket head passed hands 0.08s too early.' }
      ],
      prescription: [
        { title: '1. Racket Butt-Cap Pointing Drills', detail: '4 sets x 10 reps leading downswing with butt cap toward incoming ball.' }
      ]
    },
    stalledPelvisLeak: {
      headline: 'Incomplete Pelvic Clearance - Locked Hips at Contact',
      summary: 'Hips stayed square at contact rather than clearing open to allow free arm extension down the line.',
      takeaways: [
        { category: 'Follow-Through Leak', title: 'Blocked Arm Extension', detail: 'Arm cramped against body at contact point.' }
      ],
      prescription: [
        { title: '1. Open-Stance Hip Clearance Drills', detail: '3 sets x 15 crosscourt open-stance forehands.' }
      ]
    }
  }
};

// ---------------------------------------------------------------------------------
// 6. GOLF BIOMECHANICAL MATRIX
// ---------------------------------------------------------------------------------
const golfMatrix: SportMatrixDefinition = {
  sportId: 'golf',
  sportName: 'Golf & Swing Mechanics',
  defaultTechniqueName: 'Driver & Iron Swing Mechanics',
  techniques: {
    swing: [
      {
        jointKey: 'spine_angle_tilt',
        jointName: 'Forward Spine Tilt & Posture Angle',
        phase: 'Impact & Address',
        keypoints: [12, 24, 28],
        idealMin: 145,
        idealMax: 165,
        unit: '°',
        importance: 'critical_safety',
        outcomes: {
          severe_flexion: {
            bracket: 'severe_flexion',
            minAngle: 0,
            maxAngle: 130,
            status: 'error',
            headline: 'Over-Bent Spine - Excessive Forward Slouch',
            description: 'Spine tilt bent under 130°. Excessive hunching crowds the swing space and causes steep, fat strikes digging into turf.',
            biomechanicalFault: 'Restricts thoracic rotational freedom by 40%, forcing arms to lift steeply over the top.',
            forceLeakPercentage: 32,
            injuryRiskLevel: 'moderate',
            injuryAnatomy: 'Lumbar disc herniation and neck strain.',
            goldStandardTitle: 'Athletic Spine Tilt (145°-165°)',
            goldStandardRange: '145° - 165° Flat Back Posture',
            goldStandardForceTransmission: 'Allows free, shallow rotational plane on the downswing.',
            strengthAsset: {
              title: 'Solid Knee Flexion Base',
              desc: 'Good stable knee bend at address.',
              metric: 'Stable Base'
            },
            drills: [
              {
                name: 'Wall-Glute Contact Address Setup',
                targetJoint: 'Lumbar Spine & Hip Hinge',
                description: 'Sets up in golf posture with glutes touching wall, maintaining 155° spine angle.',
                reps: '3 sets x 10 reps',
                whyThisWorks: 'Teaches hip hinge rather than spine slouching.',
                purpose: 'Establish athletic flat back posture.',
                howToExecute: [
                  'Stand 6 inches from wall.',
                  'Hinge at hips until glutes touch wall.',
                  'Keep spine straight from tailbone to head.'
                ],
                coachingCue: '"Hinge from the hips, keep the chest proud!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Wall hip hinge setups (30 reps)',
              day3_4: 'Thoracic foam roller extensions (3x15 reps)',
              day5_7: 'Range iron striking'
            }
          },
          moderate_flexion: {
            bracket: 'moderate_flexion',
            minAngle: 131,
            maxAngle: 144,
            status: 'warning',
            headline: 'Slightly Steep Torso Tilt - Minor Toe-Strike Bias',
            description: 'Spine tilt measured at 131°-144°. Slightly steep torso angle creates slight toe-strike contact bias on longer clubs.',
            biomechanicalFault: 'Narrow downswing arc.',
            forceLeakPercentage: 10,
            injuryRiskLevel: 'low',
            injuryAnatomy: 'Minimal injury risk.',
            goldStandardTitle: 'Athletic Spine Tilt (145°-165°)',
            goldStandardRange: '145° - 165° Ideal Tilt',
            goldStandardForceTransmission: 'Optimal clubhead speed and flush center-face compression.',
            strengthAsset: {
              title: 'Head Position Stability',
              desc: 'Head remained steady throughout backswing.',
              metric: 'Steady Head'
            },
            drills: [
              {
                name: 'Alignment Rod Spine Tilt Audits',
                targetJoint: 'Thorax & Hips',
                description: 'Holds club across chest and rotates into impact checking constant 155° tilt.',
                reps: '3 sets x 12 reps'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Club-across-chest posture rotations (30 reps)',
              day3_4: 'Range driver practice (30 balls)',
              day5_7: 'Course play'
            }
          },
          optimal: {
            bracket: 'optimal',
            minAngle: 145,
            maxAngle: 165,
            status: 'optimal',
            headline: 'Flawless Spine Tilt Maintenance - Pure Center-Face Compression',
            description: 'Spine angle measured at textbook 145°-165° throughout the swing arc. Zero early extension (standing up at impact), guaranteeing flush sweet-spot compression and maximum driving distance.',
            biomechanicalFault: 'None detected. Swing plane and kinematic sequence operating at PGA/LPGA Tour standard.',
            forceLeakPercentage: 0,
            injuryRiskLevel: 'low',
            injuryAnatomy: 'Anatomically protected. Spinal rotational forces distributed safely.',
            goldStandardTitle: 'Tour-Standard Spine Angle (McIlroy / Scheffler / Woods)',
            goldStandardRange: '145° - 165° Gold Standard',
            goldStandardForceTransmission: '100% of rotational ground force transferred into clubhead smash factor.',
            strengthAsset: {
              title: 'Masterful Posture Maintenance',
              desc: 'Maintains constant spine angle through impact, eliminating fat/thin mishits.',
              metric: 'Optimal 145°-165°'
            },
            drills: [
              {
                name: 'Smash-Factor Driver Calibration Drills',
                targetJoint: 'Full Golf Kinetic Chain',
                description: 'Drives 20 balls with launch monitor targeting 1.48+ smash factor.',
                reps: '4 sets x 5 drives',
                whyThisWorks: 'Rewards pure center-face impact generated by posture stability.',
                purpose: 'Maximize driving distance and fairway accuracy.',
                howToExecute: [
                  'Set 155° spine tilt at address.',
                  'Rotate shoulders 90° back, shift weight to lead heel.',
                  'Uncoil hips while maintaining exact spine tilt through impact.'
                ],
                coachingCue: '"Stay in the posture, compress the ball, rotate through!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Driver smash-factor optimization (30 balls)',
              day3_4: 'Iron flight-control trajectory sessions (40 balls)',
              day5_7: '18-hole competitive round'
            }
          },
          moderate_extension: {
            bracket: 'moderate_extension',
            minAngle: 166,
            maxAngle: 175,
            status: 'warning',
            headline: 'Early Extension Warning - Standing Up at Impact',
            description: 'Spine angle measured at 166°-175° (standing up at impact). Hips thrust toward ball, losing forward spine tilt and causing blocks or hooks.',
            biomechanicalFault: 'Pelvis thrusts forward 10cm, narrowing arm room and leaking clubhead speed.',
            forceLeakPercentage: 20,
            injuryRiskLevel: 'moderate',
            injuryAnatomy: 'Lower lumbar hyperextension and facet joint pinching.',
            goldStandardTitle: 'Athletic Spine Tilt (145°-165°)',
            goldStandardRange: '145° - 165° Maintained Posture',
            goldStandardForceTransmission: 'Keeps arms in front of chest for pure impact.',
            strengthAsset: {
              title: 'Explosive Hip Clearance',
              desc: 'High pelvic rotation speed on downswing.',
              metric: 'Fast Hip Turn'
            },
            drills: [
              {
                name: 'Chair-Behind-Glutes Swing Rotations',
                targetJoint: 'Lead Hip & Glute Max',
                description: 'Swings with lead glute pushing back against a chair through impact.',
                reps: '4 sets x 10 swings',
                whyThisWorks: 'Physical boundary prevents pelvis from thrusting forward toward the ball.',
                purpose: 'Completely eliminate early extension.',
                howToExecute: [
                  'Place back of chair touching lead glute at address.',
                  'Rotate into impact, pushing lead glute firmly back into chair.'
                ],
                coachingCue: '"Stay on the chair, chest down through impact!"'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Chair-glute swing drills (30 swings)',
              day3_4: 'Kettlebell RDLs for hip hinge strength (3x10 reps)',
              day5_7: 'Range iron compression practice'
            }
          },
          severe_extension: {
            bracket: 'severe_extension',
            minAngle: 176,
            maxAngle: 185,
            status: 'error',
            headline: 'Severe Early Extension - Complete Loss of Posture & Power',
            description: 'Spine angle at 176°-185° (completely straight). Athlete stands straight up before impact, flipping hands at ball to compensate.',
            biomechanicalFault: 'Flipping hands leads to wild inconsistency, high slices, fat chunks, and severe lower back jar.',
            forceLeakPercentage: 40,
            injuryRiskLevel: 'high',
            injuryAnatomy: 'Lumbar spine compression and right wrist tendonitis.',
            goldStandardTitle: 'Constant Spine Angle Maintenance',
            goldStandardRange: '145° - 165° Mandatory Posture',
            goldStandardForceTransmission: 'Maintains solid rotational axis.',
            strengthAsset: {
              title: 'Quick Hand Recovery',
              desc: 'Fast hand flip attempting to rescue contact.',
              metric: 'Fast Wrist Action'
            },
            drills: [
              {
                name: 'Impact-Bag Posture Compression Drills',
                targetJoint: 'Full Posterior Chain & Core',
                description: 'Strikes impact bag with lead hip cleared and forward spine angle locked in place.',
                reps: '4 sets x 10 reps',
                whyThisWorks: 'Provides solid resistance forcing maintained posture at impact.'
              }
            ],
            weeklyPrescription: {
              day1_2: 'Impact bag posture drills (30 reps)',
              day3_4: 'Wall glute rotations (30 reps)',
              day5_7: 'Slow-motion range striking'
            }
          }
        }
      }
    ]
  },
  kineticSequencingOutcomes: {
    optimal: {
      headline: 'Tour-Standard Kinetic Sequence (Pelvis -> Thorax -> Lead Arm -> Club Shaft)',
      summary: 'Biomechanical analysis reveals elite golf kinetic sequencing. Pelvis initiated transition with lead heel pressure shift (t=0.28s), followed by thorax rotation (t=0.38s), pulling the arms and club into maximum lag before releasing 115mph clubhead speed at impact.',
      takeaways: [
        { category: 'Kinetic Sequencing', title: 'Proximal-to-Distal Whip', detail: 'Each body segment accelerated and decelerated in peak mathematical order.' }
      ],
      prescription: [
        { title: '1. Maintain Downswing Transition Rhythm', detail: '3 sets x 10 reps of step-through swings to reinforce early lower-body initiation.' }
      ]
    },
    earlyUpperBodyLeak: {
      headline: 'Over-the-Top Kinematic Leak: Shoulders Initiated Downswing Before Pelvis',
      summary: 'Upper body and shoulders cast the club from the top at t=0.30s, before lower-body weight shifted to lead side (t=0.42s). This steep outside-in path causes slices, pulls, and a 15% loss in clubhead speed.',
      takeaways: [
        { category: 'Power Leak', title: 'Over-The-Top Casting', detail: 'Club thrown outside swing plane due to premature shoulder initiation.' }
      ],
      prescription: [
        { title: '1. Pump Drill Transition', detail: '4 sets x 8 reps pulling arms down to waist height before uncoiling shoulders.' }
      ]
    },
    stalledPelvisLeak: {
      headline: 'Pelvic Stall at Impact - Blocked Arm Release',
      summary: 'Hips stopped rotating at impact, forcing hands to flip and hook the ball left of target.',
      takeaways: [
        { category: 'Accuracy Leak', title: 'Flipped Release', detail: 'Hands flipped over stalled hips.' }
      ],
      prescription: [
        { title: '1. Lead Hip Clearance Drill', detail: '3 sets x 12 reps clearing lead hip 45 degrees open at impact.' }
      ]
    }
  }
};

// ---------------------------------------------------------------------------------
// 7. MASTER REPOSITORY LOOKUP TABLE
// ---------------------------------------------------------------------------------
export const SPORTS_BIOMECHANICS_MATRIX: Record<SportId, SportMatrixDefinition> = {
  rugby: rugbyMatrix,
  soccer: soccerMatrix,
  netball: netballMatrix,
  cricket: cricketMatrix,
  tennis: tennisMatrix,
  golf: golfMatrix,
  hockey: {
    ...rugbyMatrix,
    sportId: 'hockey',
    sportName: 'Field Hockey & Striking',
    defaultTechniqueName: 'Drag Flick & Slap Hit Mastery'
  }
};
