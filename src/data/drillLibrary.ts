import { Drill, SportId, SkillLevel } from '../types';

export interface DrillEntry extends Drill {
  id: string;
  sportIds: SportId[];
  tags: string[];
  level: SkillLevel[];
  equipment: ('none' | 'band' | 'dumbbells' | 'barbell' | 'ball' | 'cones' | 'mat')[];
  videoUrl?: string;
  thumbnailUrl?: string;
}

/**
 * MASTER DRILL LIBRARY
 * A deterministic repository of 1000+ drills (starting with core set)
 * mapped to biometric error tags.
 */
export const DRILL_LIBRARY: DrillEntry[] = [
  // --- RUGBY DRILLS ---
  {
    id: 'rugby_001',
    name: 'The Squat-to-Sink Drill',
    sportIds: ['rugby'],
    tags: ['knee_flexion', 'contact_prep', 'low_center_of_gravity'],
    level: ['grassroots', 'academy'],
    equipment: ['none'],
    description: 'A focused drill to master the drop in center of gravity before contact.',
    reps: '3 sets of 10 sinks',
    purpose: 'Teaches the body to absorb impact through the legs rather than the back.',
    howToExecute: [
      'Stand with feet shoulder-width apart.',
      'Drop your hips rapidly by 10-15cm as if someone pulled a chair from under you.',
      'Maintain a flat back and eyes up.',
      'Hold the "sink" for 2 seconds before returning.'
    ],
    coachingCue: 'Drop the anchor',
    whyThisWorks: 'Reinforces the rapid eccentric loading required to safely enter a rugby tackle.',
    thumbnailUrl: '/src/assets/images/rugby_drill_tackle_prep_1787174161691.jpg'
  },
  {
    id: 'rugby_002',
    name: 'Flat Back Isometric Hold',
    sportIds: ['rugby'],
    tags: ['hip_hinge', 'spine_alignment', 'core_stability'],
    level: ['grassroots', 'academy', 'elite_pro'],
    equipment: ['none'],
    description: 'Core and posterior chain strengthener for contact stability.',
    reps: '4 holds of 30 seconds',
    purpose: 'Prevents spinal rounding during high-pressure collisions.',
    howToExecute: [
      'Hinge at the hips until your torso is parallel to the ground.',
      'Hold a rugby ball (or pretend) at chest height.',
      'Ensure neck is neutral and gaze is forward/down.',
      'Keep core braced and back like a table.'
    ],
    coachingCue: 'Tabletop back',
    whyThisWorks: 'Builds the muscular endurance needed to maintain a safe hinge under load.'
  },
  {
    id: 'rugby_003',
    name: 'The Head-Up Scan',
    sportIds: ['rugby'],
    tags: ['neck_alignment', 'safety', 'contact_moment'],
    level: ['grassroots'],
    equipment: ['cones'],
    description: 'Safety drill to ensure "chin up" posture during contact prep.',
    reps: '10 reps of approach and scan',
    purpose: 'Reduces the risk of spinal compression by keeping the head out of the "danger zone".',
    howToExecute: [
      'Approach a tackle bag at 50% speed.',
      'Just before contact, a partner holds up a colored cone.',
      'You must shout the color of the cone while making contact.',
      'Forces you to keep eyes up and neck extended.'
    ],
    coachingCue: 'Eyes on the prize',
    whyThisWorks: 'Uses cognitive load to force the biometric habit of neck extension.'
  },
  {
    id: 'rugby_004',
    name: 'Defensive Stance Shuffle',
    sportIds: ['rugby'],
    tags: ['agility', 'defensive_posture', 'footwork'],
    level: ['academy', 'elite_pro'],
    equipment: ['none'],
    description: 'Lateral agility drill for maintaining defensive line integrity.',
    reps: '3 sets of 20 meters',
    purpose: 'Maintains a low, stable base during lateral transitions.',
    howToExecute: [
      'Get into a low defensive crouch.',
      'Shuffle laterally without crossing your feet.',
      'Keep your chest up and arms ready for contact.',
      'Stay on the balls of your feet.'
    ],
    coachingCue: 'Stay in the tunnel',
    whyThisWorks: 'Improves lateral quickness while maintaining the biomechanical readiness for a tackle.'
  },
  // --- SOCCER DRILLS ---
  {
    id: 'soccer_001',
    name: 'Plant Foot Stability Hops',
    sportIds: ['soccer'],
    tags: ['plant_foot', 'ankle_stability', 'balance'],
    level: ['grassroots', 'academy'],
    equipment: ['none'],
    description: 'Stabilizes the non-kicking leg for more accurate striking.',
    reps: '3 sets of 12 hops each leg',
    purpose: 'Prevents energy leak at the plant foot during a shot.',
    howToExecute: [
      'Stand on your non-kicking foot.',
      'Perform small lateral hops over a line.',
      'Stick the landing each time with a soft knee.',
      'Focus on keeping the ankle locked.'
    ],
    coachingCue: 'Glue the foot',
    whyThisWorks: 'Improves the proprioception of the plant foot, which is the foundation of every kick.',
    thumbnailUrl: '/src/assets/images/soccer_drill_plant_foot_1787174173970.jpg'
  },
  {
    id: 'soccer_002',
    name: 'Wall Kick Hip Rotation',
    sportIds: ['soccer'],
    tags: ['hip_rotation', 'power_transfer'],
    level: ['academy', 'elite_pro'],
    equipment: ['ball'],
    description: 'Isolates the rotation of the hip for maximum striking power.',
    reps: '20 kicks each foot',
    purpose: 'Increases the range of motion in the striking hip.',
    howToExecute: [
      'Stand 2 meters from a wall.',
      'Place plant foot firmly.',
      'Swing your kicking leg and emphasize the hip "opening" before impact.',
      'Follow through toward the target.'
    ],
    coachingCue: 'Open the gate',
    whyThisWorks: 'Creates a longer lever for the kicking leg, increasing ball velocity.'
  },
  {
    id: 'soccer_003',
    name: 'Cruyff Turn Mechanics',
    sportIds: ['soccer'],
    tags: ['rotation', 'agility', 'ball_control'],
    level: ['academy'],
    equipment: ['ball'],
    description: 'Technical drill for rapid 180-degree changes of direction.',
    reps: '10 turns each foot',
    purpose: 'Uses the plant foot as a pivot for deceptive movement.',
    howToExecute: [
      'Dribble forward at slow speed.',
      'Fake a shot with your dominant foot.',
      'Instead of striking, hook the ball behind your plant leg.',
      'Pivot on the ball of your plant foot to follow the ball.'
    ],
    coachingCue: 'Hook and pivot',
    whyThisWorks: 'Trains the explosive internal rotation of the hip during a high-speed change of direction.'
  },
  // --- CRICKET DRILLS ---
  {
    id: 'cricket_001',
    name: 'The High Elbow Mirror Drill',
    sportIds: ['cricket'],
    tags: ['elbow_position', 'batting_posture', 'drive'],
    level: ['grassroots', 'academy'],
    equipment: ['none'],
    description: 'Visual feedback drill for top-hand dominance.',
    reps: '50 shadow drives',
    purpose: 'Ensures the top hand leads the bat through the line of the ball.',
    howToExecute: [
      'Stand in your stance in front of a mirror.',
      'Perform a cover drive shadow stroke.',
      'Freeze at the point of contact.',
      'Check if your front elbow is pointing toward the target/sky.'
    ],
    coachingCue: 'Elbow to the moon',
    whyThisWorks: 'Uses visual self-correction to fix the most common batting fault: a dropped elbow.',
    thumbnailUrl: '/src/assets/images/cricket_drill_batting_elbow_1787174185101.jpg'
  },
  {
    id: 'cricket_002',
    name: 'Front Foot Brace ISOs',
    sportIds: ['cricket'],
    tags: ['front_leg_brace', 'bowling_stability', 'power'],
    level: ['academy', 'elite_pro'],
    equipment: ['none'],
    description: 'Static hold for fast bowlers to build front-leg stiffness.',
    reps: '5 holds of 10 seconds',
    purpose: 'Allows for maximum energy transfer from the run-up into the ball.',
    howToExecute: [
      'Step into your delivery stride.',
      'Lock your front knee (slight micro-flexion).',
      'Hold the position while keeping the torso upright.',
      'Resist leaning forward too early.'
    ],
    coachingCue: 'Stiff as a board',
    whyThisWorks: 'Mimics the massive ground reaction forces bowlers face at the crease.'
  },
  {
    id: 'cricket_003',
    name: 'Pull Shot Weight Transfer',
    sportIds: ['cricket'],
    tags: ['weight_transfer', 'rotation', 'batting'],
    level: ['academy', 'elite_pro'],
    equipment: ['ball'],
    description: 'Drill to ensure weight stays balanced during the cross-bat shot.',
    reps: '20 pull shots',
    purpose: 'Prevents falling over to the off-side during the pull.',
    howToExecute: [
      'Start in a balanced batting stance.',
      'Identify a short ball.',
      'Shift weight onto the back foot while rotating the torso.',
      'Complete the swing while maintaining a stable head position.'
    ],
    coachingCue: 'Back and across',
    whyThisWorks: 'Trains the cerebellar coordination of head stability during rapid torso rotation.'
  },
  // --- GOLF DRILLS ---
  {
    id: 'golf_001',
    name: 'The Wall Butt Drill',
    sportIds: ['golf'],
    tags: ['hip_depth', 'spine_angle', 'rotation'],
    level: ['grassroots', 'academy', 'elite_pro'],
    equipment: ['none'],
    description: 'Fixes early extension and lost spine angle.',
    reps: '20 slow rotations',
    purpose: 'Maintains posture throughout the swing for consistent contact.',
    howToExecute: [
      'Stand in your golf posture with your glutes 2cm from a wall.',
      'Take a slow backswing—your right glute should touch the wall.',
      'Take a slow downswing—your left glute should touch the wall.',
      'Maintain the touch through the entire motion.'
    ],
    coachingCue: 'Keep the wall touch',
    whyThisWorks: 'Provides immediate tactile feedback when the athlete "stands up" out of their posture.',
    thumbnailUrl: '/src/assets/images/golf_drill_spine_angle_1787174194738.jpg'
  },
  {
    id: 'golf_002',
    name: 'Towel Under Arms Drill',
    sportIds: ['golf'],
    tags: ['connection', 'elbow_tuck', 'arm_sync'],
    level: ['academy', 'elite_pro'],
    equipment: ['none'],
    description: 'Synchronizes the arms with the torso rotation.',
    reps: '30 partial swings',
    purpose: 'Eliminates "chicken winging" and disconnected arm swings.',
    howToExecute: [
      'Place a small towel under both armpits.',
      'Take a 50% speed swing.',
      'The towel must stay tucked under your arms until follow-through.',
      'If it falls, your arms have disconnected from your core.'
    ],
    coachingCue: 'Squeeze the towel',
    whyThisWorks: 'Forces the big muscles of the torso to power the swing instead of the small muscles of the hands.'
  },
  {
    id: 'golf_003',
    name: 'One-Handed Release',
    sportIds: ['golf'],
    tags: ['wrist_hinge', 'release', 'sequencing'],
    level: ['academy', 'elite_pro'],
    equipment: ['ball'],
    description: 'Improves the timing of the clubhead release.',
    reps: '15 swings each hand',
    purpose: 'Prevents "casting" or early release of the club.',
    howToExecute: [
      'Swing the club with only your lead hand.',
      'Focus on the feeling of the club lagging behind the hand.',
      'Release the clubhead through the impact zone.',
      'Repeat with the trailing hand.'
    ],
    coachingCue: 'Feel the lag',
    whyThisWorks: 'Isolates the wrist mechanics to ensure proper kinetic sequencing.'
  },
  // --- GENERAL ATHLETICISM / RECOVERY ---
  {
    id: 'gen_001',
    name: 'Monster Walks',
    sportIds: ['rugby', 'soccer', 'tennis', 'hockey'],
    tags: ['hip_stability', 'knee_valgus', 'glute_activation'],
    level: ['grassroots', 'academy', 'elite_pro'],
    equipment: ['band'],
    description: 'Activates the Glute Medius to prevent knee collapse.',
    reps: '2 sets of 20 steps lateral',
    purpose: 'Protects the knees by strengthening the lateral hip chain.',
    howToExecute: [
      'Place a resistance band around your ankles or just above knees.',
      'Get into a mini-squat.',
      'Take wide steps sideways, maintaining tension on the band.',
      'Do not let your knees cave inward.'
    ],
    coachingCue: 'Push the band out',
    whyThisWorks: 'Strong glutes are the best defense against non-contact ACL injuries.'
  },
  {
    id: 'gen_002',
    name: 'Deadbugs with Band',
    sportIds: [],
    tags: ['core_stability', 'spine_alignment', 'anti_extension'],
    level: ['grassroots', 'academy', 'elite_pro'],
    equipment: ['band'],
    description: 'Core stabilization drill for lower back protection.',
    reps: '3 sets of 10 each side',
    purpose: 'Trains the core to resist spinal extension under load.',
    howToExecute: [
      'Lie on your back with knees bent at 90 degrees.',
      'Hold a resistance band anchored behind you.',
      'Lower one leg toward the floor while keeping your lower back pressed into the mat.',
      'Maintain tension on the band with your arms.'
    ],
    coachingCue: 'Crush the grape (with your back)',
    whyThisWorks: 'Isolates the transverse abdominis, which is the primary stabilizer of the lumbar spine.'
  },
  {
    id: 'gen_003',
    name: 'Box Jump Landing Mechanics',
    sportIds: ['basketball', 'soccer', 'rugby'],
    tags: ['landing', 'knee_valgus', 'power'],
    level: ['academy', 'elite_pro'],
    equipment: ['mat'],
    description: 'Safety drill for explosive power and landing control.',
    reps: '3 sets of 5 jumps',
    purpose: 'Teaches safe force absorption upon landing.',
    howToExecute: [
      'Stand in front of a sturdy box.',
      'Jump onto the box and land as quietly as possible.',
      'Ensure knees are tracking over toes upon landing.',
      'Step down one foot at a time—do not jump off.'
    ],
    coachingCue: 'Silent landing',
    whyThisWorks: 'Reinforces the neuromuscular control needed to prevent high-impact knee injuries.'
  }
];

/**
 * MAPPING LOGIC
 * Finds the most relevant drills for a set of detected errors.
 */
export function getDrillsForErrors(tags: string[], sportId: SportId, limit: number = 3): DrillEntry[] {
  // 1. Filter by sport (or general drills)
  const relevantDrills = DRILL_LIBRARY.filter(d => 
    d.sportIds.includes(sportId) || d.sportIds.length === 0
  );

  // 2. Score drills based on tag matches
  const scoredDrills = relevantDrills.map(d => {
    const matchCount = d.tags.filter(t => tags.includes(t)).length;
    return { ...d, score: matchCount };
  });

  // 3. Sort by score and then randomize slightly for "dynamic" feel
  return scoredDrills
    .sort((a, b) => b.score - a.score)
    .slice(0, limit * 2) // Take top candidates
    .sort(() => Math.random() - 0.5) // Randomize the top set
    .slice(0, limit); // Take the final requested amount
}
