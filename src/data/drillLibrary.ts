export interface DrillItem {
  id: string;
  sportId: string;
  sportName: string;
  title: string;
  category: 'Mobility' | 'Kinetic Chain' | 'Strength & Power' | 'Stability' | 'Follow-Through';
  targetJoint: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Elite';
  reps: string;
  sets: string;
  coachingCue: string;
  description: string;
  steps: string[];
  photoUrl: string;
  biomechanicalBenefit: string;
}

export const COMPREHENSIVE_DRILL_LIBRARY: DrillItem[] = [
  // RUGBY DRILLS
  {
    id: 'rugby-tackle-hinge',
    sportId: 'rugby',
    sportName: 'Rugby Union / League',
    title: 'Low-Hip Athletic Spine Hinge',
    category: 'Kinetic Chain',
    targetJoint: 'Hip & Lumbar Spine',
    difficulty: 'Elite',
    reps: '10 reps',
    sets: '3 sets',
    coachingCue: '"Sink hips below shoulders; eyes locked on target hips through impact."',
    description: 'Eliminates upright bending during contact by locking the thoracic spine and driving power through hip extension.',
    steps: [
      'Assume a wide athletic stance with feet outside shoulder width.',
      'Hinge at the hips while maintaining a flat, neutral spine angle.',
      'Lower center of gravity by bending knees, keeping heels heavy on the turf.',
      'Drive upward and forward simulating a dominant shoulder tackle wrap.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Increases tackle impact force by 35% while lowering concussion risk by protecting the cervical spine.'
  },
  {
    id: 'rugby-pass-snap',
    sportId: 'rugby',
    sportName: 'Rugby Union / League',
    title: 'Rotational Core Transfer Snap',
    category: 'Stability',
    targetJoint: 'Thoracic Rotation & Shoulders',
    difficulty: 'Intermediate',
    reps: '15 reps each side',
    sets: '3 sets',
    coachingCue: '"Initiate pass from back foot rotation through the hips into fingertips."',
    description: 'Builds explosive rotational sequencing for long-range spiral passes under high defensive pressure.',
    steps: [
      'Hold ball in two hands with elbows tucked at ribs.',
      'Pivot on back foot, driving hip forward while rotating torso toward target.',
      'Snap wrists cleanly across body pointing fingertips directly at receiver target.',
      'Maintain balanced follow-through without leaning off-balance.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Enhances passing velocity and torsional stability across the kinetic chain.'
  },

  // HOCKEY DRILLS
  {
    id: 'hockey-low-sweep',
    sportId: 'hockey',
    sportName: 'Field Hockey',
    title: 'Low-Gravity Sweep & Extension',
    category: 'Mobility',
    targetJoint: 'Hip Adductors & Knees',
    difficulty: 'Elite',
    reps: '12 reps',
    sets: '4 sets',
    coachingCue: '"Keep chest over the ball with lead knee flexed past 90 degrees."',
    description: 'Improves low-body posture during sweeping and slap shots without losing balance.',
    steps: [
      'Start in a deep squat stance with hands separated wide on stick shaft.',
      'Sink left knee forward over toes while keeping stick flat on turf.',
      'Sweep ball smoothly from back foot to front foot transfer.',
      'Hold finishing extension for 2 seconds to reinforce neuromuscular stability.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Prevents premature upright lifting during shooting action, increasing ball velocity.'
  },
  {
    id: 'hockey-dribble-agility',
    sportId: 'hockey',
    sportName: 'Field Hockey',
    title: 'Indian Dribble Lateral Weight Transfer',
    category: 'Stability',
    targetJoint: 'Ankles & Wrists',
    difficulty: 'Intermediate',
    reps: '30 seconds continuous',
    sets: '4 sets',
    coachingCue: '"Quick soft hands with low center of gravity; shift weight heel-to-toe."',
    description: 'Enhances stick-handling agility and rapid directional weight shifts.',
    steps: [
      'Maintain an athletic knee bend with flat back.',
      'Roll ball smoothly across body from forehand to reverse stick.',
      'Keep head up scanning field while feet execute rapid micro-adjustments.',
      'Maintain low posture without rising during rapid lateral transitions.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1593341646782-e0b495cffc6d?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Optimizes reaction time and lower limb force absorption during high-speed dodging.'
  },

  // NETBALL DRILLS
  {
    id: 'netball-landing-absorb',
    sportId: 'netball',
    sportName: 'Netball',
    title: 'Single-Leg Deceleration & Land',
    category: 'Stability',
    targetJoint: 'Knees & Ankles',
    difficulty: 'Elite',
    reps: '10 reps each leg',
    sets: '3 sets',
    coachingCue: '"Soft silent landing; knee tracks directly over second toe with zero valgus collapse."',
    description: 'Protects ACL and ankle ligaments during high-velocity aerial ball catches and stops.',
    steps: [
      'Hop forward 1 meter landing cleanly on designated single leg.',
      'Immediately absorb impact by flexing hip, knee, and ankle into a deep quarter squat.',
      'Hold stable position for 2 seconds before resetting.',
      'Ensure knee does not cave inward toward midline.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Reduces peak landing impact forces by 45% and prevents knee valgus injury.'
  },
  {
    id: 'netball-pivot-speed',
    sportId: 'netball',
    sportName: 'Netball',
    title: 'Front-Foot Seal & Pivot',
    category: 'Kinetic Chain',
    targetJoint: 'Ankles & Hips',
    difficulty: 'Intermediate',
    reps: '12 pivots',
    sets: '3 sets',
    coachingCue: '"Plant firmly on balls of feet; spin on forefoot with upright torso."',
    description: 'Improves passing release speed and footwork precision under defensive marking.',
    steps: [
      'Receive simulated pass while executing stop-landing.',
      'Plant landing foot as grounded pivot pivot point.',
      'Rotate hips and shoulders swiftly to open passing lane to teammate.',
      'Deliver crisp chest pass with locked elbow extension.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Eliminates footwork stepping faults and accelerates ball redistribution.'
  },

  // CRICKET DRILLS
  {
    id: 'cricket-batting-brace',
    sportId: 'cricket',
    sportName: 'Cricket Batting',
    title: 'Front-Foot Braced Delivery Drive',
    category: 'Kinetic Chain',
    targetJoint: 'Lead Knee & Lumbar Spine',
    difficulty: 'Elite',
    reps: '15 drives',
    sets: '3 sets',
    coachingCue: '"Lock front knee straight at impact; stack head directly over front knee."',
    description: 'Prevents collapsing front knee during cover drives, maximizing power transfer into the ball.',
    steps: [
      'Adopt balanced batting stance with bat elevated high in back-lift.',
      'Step forward smoothly with front foot toward pitch line of ball.',
      'Brace front knee rigid at impact while head stays directly over front toe.',
      'Follow through high over back shoulder with full elbow extension.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Increases bat head speed through impact zone by 28% through rigid kinetic bracing.'
  },
  {
    id: 'cricket-bowling-action',
    sportId: 'cricket',
    sportName: 'Cricket Bowling',
    title: 'Thoracic Counter-Rotation Bowling Drill',
    category: 'Strength & Power',
    targetJoint: 'Shoulders & Spine',
    difficulty: 'Elite',
    reps: '12 deliveries',
    sets: '3 sets',
    coachingCue: '"Drive hips through the crease while non-bowling arm pulls down hard."',
    description: 'Optimizes kinetic sequencing from run-up to front foot contact for fast bowling speed.',
    steps: [
      'Begin walk-up into bowling crease with high chest posture.',
      'Plant front foot firmly with braced knee and counter-rotated shoulders.',
      'Whip bowling arm over top with ear brushing biceps.',
      'Follow through smoothly across body to protect lower back.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Reduces lumbar stress fracture risk while maximizing bowling release velocity.'
  }
];

export function getDrillsForSport(sportId: string): DrillItem[] {
  const filtered = COMPREHENSIVE_DRILL_LIBRARY.filter(d => d.sportId.toLowerCase().includes(sportId.toLowerCase()) || sportId.toLowerCase().includes(d.sportId.toLowerCase()));
  if (filtered.length > 0) return filtered;
  return COMPREHENSIVE_DRILL_LIBRARY.slice(0, 4);
}
