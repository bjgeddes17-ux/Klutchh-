import { SportId } from '../types';

export interface DrillItem {
  id: string;
  sportId: SportId;
  sportName: string;
  techniqueId?: string;
  techniqueName?: string;
  phase?: string;
  title: string;
  category: 'Mobility' | 'Kinetic Chain' | 'Strength & Power' | 'Stability' | 'Follow-Through' | 'Injury Prevention';
  targetJoint: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Elite';
  reps: string;
  sets: string;
  coachingCue: string;
  description: string;
  steps: string[];
  photoUrl: string;
  biomechanicalBenefit: string;
  targetAngleRule?: string;
  equipment?: string;
}

export const COMPREHENSIVE_DRILL_LIBRARY: DrillItem[] = [
  // ==========================================
  // 1. RUGBY UNION & LEAGUE (10 Drills)
  // ==========================================
  {
    id: 'rugby-tackle-hinge',
    sportId: 'rugby',
    techniqueId: 'tackling',
    techniqueName: 'Tackling & Contact',
    phase: 'Contact Wrap',
    sportName: 'Rugby Union / League',
    title: 'Low-Hip Athletic Spine Hinge',
    category: 'Kinetic Chain',
    targetJoint: 'Hip & Lumbar Spine',
    difficulty: 'Elite',
    reps: '10 reps each shoulder',
    sets: '3 sets',
    coachingCue: '"Sink hips below shoulders; eyes locked on target waistband through impact."',
    description: 'Eliminates dangerous upright bending during contact by locking the thoracic spine at 45° and driving forward power through explosive hip extension.',
    steps: [
      'Assume a wide athletic stance with feet outside shoulder width.',
      'Hinge at the hips while maintaining a flat, neutral spine angle.',
      'Lower center of gravity by bending knees to 110°-125°, keeping heels heavy on the turf.',
      'Drive upward and forward simulating a dominant shoulder tackle wrap.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Increases tackle impact force by 35% while lowering concussion risk by protecting the cervical spine.',
    targetAngleRule: 'Spine Hinge Angle: 40°-50°',
    equipment: 'Tackle Bag or Resistance Band'
  },
  {
    id: 'rugby-pass-snap',
    sportId: 'rugby',
    techniqueId: 'passing',
    techniqueName: 'Passing & Distribution',
    phase: 'Spiral Release',
    sportName: 'Rugby Union / League',
    title: 'Rotational Core Transfer Snap',
    category: 'Stability',
    targetJoint: 'Thoracic Rotation & Shoulders',
    difficulty: 'Intermediate',
    reps: '15 reps each side',
    sets: '3 sets',
    coachingCue: '"Initiate pass from back foot rotation through the hips into fingertips."',
    description: 'Builds explosive rotational sequencing for long-range spiral passes under high defensive pressure without drifting off-axis.',
    steps: [
      'Hold ball in two hands with elbows tucked at ribs.',
      'Pivot on back foot, driving hip forward while rotating torso toward target.',
      'Snap wrists cleanly across body pointing fingertips directly at receiver target.',
      'Maintain balanced follow-through without leaning off-balance.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Enhances passing velocity and torsional stability across the kinetic chain.',
    targetAngleRule: 'Lead Elbow Extension: 155°-175°',
    equipment: 'Match Ball'
  },
  {
    id: 'rugby-leg-drive-tackle',
    sportId: 'rugby',
    techniqueId: 'tackling',
    techniqueName: 'Tackling & Contact',
    phase: 'Leg Drive',
    sportName: 'Rugby Union / League',
    title: 'Short-Foot Chop & Leg Drive Blitz',
    category: 'Strength & Power',
    targetJoint: 'Knee Flexion & Glute Drive',
    difficulty: 'Elite',
    reps: '6 drives of 5 yards',
    sets: '4 sets',
    coachingCue: '"Chop feet rapidly into contact; maintain 100° knee bend to prevent losing ground."',
    description: 'Enforces rapid ground contact time and powerful horizontal hip drive during dominant collision tackles.',
    steps: [
      'Accelerate 3 steps into contact zone.',
      'Decelerate into short rapid chops with low center of mass.',
      'Engage shoulder into pad at 45° angle.',
      'Pound 4 rapid continuous leg drives through the contact plane.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Maximizes ground reaction momentum transfer and eliminates backward tackle collapse.',
    targetAngleRule: 'Drive Knee Angle: 95°-115°',
    equipment: 'Contact Shield'
  },
  {
    id: 'rugby-torpedo-kick-plant',
    sportId: 'rugby',
    techniqueId: 'kicking',
    techniqueName: 'Kicking Mechanics',
    phase: 'Plant Foot Impact',
    sportName: 'Rugby Union / League',
    title: 'Plant-Foot Stability & Torso Counter-Lean',
    category: 'Kinetic Chain',
    targetJoint: 'Plant Knee & Hip Abductors',
    difficulty: 'Intermediate',
    reps: '12 kicks each leg',
    sets: '3 sets',
    coachingCue: '"Anchor plant heel firmly; lock torso at 15° lateral tilt for maximum spiral flight."',
    description: 'Stabilizes the non-kicking leg on turf to establish a rigid rotational pivot for high-altitude spiral and box kicks.',
    steps: [
      'Approach ball with controlled 3-step rhythm.',
      'Plant non-kicking foot 20cm lateral to the ball with knee flexed 125°.',
      'Swing striking leg with locked ankle and extended toe.',
      'Maintain chest facing target with head down over ball.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Eliminates sliced kicks and increases punt distance by over 12 meters.',
    targetAngleRule: 'Plant Knee Flexion: 120°-135°',
    equipment: 'Kicking Tee & Balls'
  },
  {
    id: 'rugby-scrum-spine-lock',
    sportId: 'rugby',
    techniqueId: 'scrums',
    techniqueName: 'Scrums, Rucks & Lineouts',
    phase: 'Scrum Engagement',
    sportName: 'Rugby Union / League',
    title: 'Neutral Spine Anti-Compression Scrum Wall',
    category: 'Injury Prevention',
    targetJoint: 'Cervical & Lumbar Neutral Alignment',
    difficulty: 'Elite',
    reps: '5 holds of 12 seconds',
    sets: '4 sets',
    coachingCue: '"Chest up, shoulders retracted, spine parallel to turf from crown to tailbone."',
    description: 'Builds isometric spinal erector rigidity to prevent neck hyper-flexion during heavy forward pack engagement.',
    steps: [
      'Assume 4-point stance against scrum sled or isometric wall bar.',
      'Retract shoulder blades and set neck in neutral chin-tuck position.',
      'Flex knees to 90° and hips to 90° with flat horizontal spine.',
      'Exert progressive 85% maximum voluntary isometric contraction without rounding back.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Reduces axial neck compression loads by 60% and protects cervical vertebrae.',
    targetAngleRule: 'Spine-to-Ground Angle: 0°-10° (Flat)',
    equipment: 'Scrum Machine or Wall Bar'
  },
  {
    id: 'rugby-ruck-cleanout-gate',
    sportId: 'rugby',
    techniqueId: 'scrums',
    techniqueName: 'Scrums, Rucks & Lineouts',
    phase: 'Ruck Cleanout',
    sportName: 'Rugby Union / League',
    title: 'Low-Gate Ruck Cleanout Hinge',
    category: 'Strength & Power',
    targetJoint: 'Hip Extension & Shoulder Drive',
    difficulty: 'Intermediate',
    reps: '8 cleanouts each side',
    sets: '3 sets',
    coachingCue: '"Enter through the gate with hips lower than the opposition; drive upwards through the sternum."',
    description: 'Trains the athlete to enter rucks legally and forcefully from depth with hips lower than opponent shoulders.',
    steps: [
      'Approach ruck dummy strictly through the tackle gate.',
      'Drop hip height below 80cm while keeping back flat.',
      'Clamp under opponent arms and explode hips forward and upward.',
      'Secure ball territory with a solid wide base.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Prevents illegal off-feet penalties and secures 98% ball retention speed.',
    targetAngleRule: 'Hip Hinge Angle: 45°-55°',
    equipment: 'Ruck Shields'
  },
  {
    id: 'rugby-lineout-jump-cushion',
    sportId: 'rugby',
    techniqueId: 'scrums',
    techniqueName: 'Scrums, Rucks & Lineouts',
    phase: 'Lineout Catch & Land',
    sportName: 'Rugby Union / League',
    title: 'Lineout Jumper Aerial Arch & Landing Cushion',
    category: 'Stability',
    targetJoint: 'Thoracic Extension & Knee Landing',
    difficulty: 'Elite',
    reps: '8 vertical catches',
    sets: '3 sets',
    coachingCue: '"Reach high through the fingertips; absorb landing through hips and double knees softly."',
    description: 'Teaches lock jumpers to maintain rigid vertical posture in the air and land with balanced knee flexion to avoid ankle sprains.',
    steps: [
      'Time jump takeoff with lifters on lineout call.',
      'Lock core tight and reach two hands overhead at full extension.',
      'Secure ball cleanly at peak of jump.',
      'Land simultaneously on both feet, flexing knees to 110° to dissipate force.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Reduces peak landing impact by 40% on wet or uneven pitch turf.',
    targetAngleRule: 'Landing Knee Flexion: 105°-125°',
    equipment: 'Rugby Ball & 2 Lifters'
  },
  {
    id: 'rugby-tackle-technique-low',
    sportId: 'rugby',
    techniqueId: 'tackling',
    techniqueName: 'Tackling & Contact',
    phase: 'Contact Wrap',
    sportName: 'Rugby Union / League',
    title: 'Cheek-to-Cheek Low Tackle Drill',
    category: 'Kinetic Chain',
    targetJoint: 'Spine & Hips',
    difficulty: 'Intermediate',
    reps: '10 tackles',
    sets: '3 sets',
    coachingCue: '"Head to the side, cheek to cheek; wrap arms tight around the thighs."',
    description: 'Focuses on safe head placement and powerful arm wrapping during low tackles.',
    steps: [
      'Approach target with short, controlled steps.',
      'Dip hips low while maintaining a flat back.',
      'Place head safely to the side of the ball carrier.',
      'Drive shoulder into mid-thigh and wrap arms tightly.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Minimizes head injury risk and ensures a high tackle completion rate.',
    targetAngleRule: 'Spine Angle: 35°-50°',
    equipment: 'Tackle Bag'
  },
  {
    id: 'rugby-scrum-sled-drive',
    sportId: 'rugby',
    techniqueId: 'scrums',
    techniqueName: 'Scrums, Rucks & Lineouts',
    phase: 'Scrum Drive',
    sportName: 'Rugby Union / League',
    title: 'Scrum Sled Sustained Drive',
    category: 'Strength & Power',
    targetJoint: 'Knees & Hips',
    difficulty: 'Elite',
    reps: '5 drives of 10m',
    sets: '3 sets',
    coachingCue: '"Short steps, high knees; maintain horizontal spine throughout the drive."',
    description: 'Develops leg power and spinal stability during sustained scrum pressure.',
    steps: [
      'Engage sled with neutral spine and 90-degree knee bend.',
      'Drive forward with short, explosive steps.',
      'Maintain constant pressure without allowing hips to rise above shoulders.',
      'Reset and repeat after 10 meters.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Enhances scrummaging endurance and forward-pack dominance.',
    targetAngleRule: 'Knee Angle: 90°-110°',
    equipment: 'Scrum Sled'
  },

  // ==========================================
  // 2. SOCCER / FOOTBALL (10 Drills)
  // ==========================================
  {
    id: 'soccer-strike-chest-over',
    sportId: 'soccer',
    techniqueId: 'shooting',
    techniqueName: 'Shooting & Power Strike',
    phase: 'Plant & Strike',
    sportName: 'Football / Soccer',
    title: 'Chest-Over-Ball Impact Knee Lock',
    category: 'Kinetic Chain',
    targetJoint: 'Torso Angle & Lead Knee Extension',
    difficulty: 'Elite',
    reps: '12 strikes each foot',
    sets: '4 sets',
    coachingCue: '"Keep sternum leaning forward over the ball to keep the trajectory driven low and hard."',
    description: 'Prevents wild over-the-bar skying by anchoring the upper torso forward over the plant foot with striking ankle rigidly locked.',
    steps: [
      'Place ball 6 inches ahead of plant foot line.',
      'Plant non-kicking foot pointing directly at the target goal corner.',
      'Flex plant knee to 135° while tilting upper torso 15° forward over the ball.',
      'Strike ball through center with laces and follow through low along target line.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Maximizes shot accuracy by 42% and increases ball exit velocity via optimal kinetic linkage.',
    targetAngleRule: 'Torso Lean Angle: 12°-20° Forward',
    equipment: 'Cones & Match Soccer Balls'
  },
  {
    id: 'soccer-inside-pass-firm-ankle',
    sportId: 'soccer',
    techniqueId: 'passing',
    techniqueName: 'Inside Foot Passing',
    phase: 'Side-Foot Impact',
    sportName: 'Football / Soccer',
    title: 'Grounded Push-Pass Ankle Lock Drill',
    category: 'Stability',
    targetJoint: 'Hip External Rotation & Ankle Dorsiflexion',
    difficulty: 'Beginner',
    reps: '20 crisp passes each foot',
    sets: '3 sets',
    coachingCue: '"Open hips 90°; lock ankle rigid like a wall so ball zips flat along the grass."',
    description: 'Develops crisp, accurate 15-yard distribution passes by eliminating loose ankle wobbles at the moment of contact.',
    steps: [
      'Stand 10 yards from rebounder or partner.',
      'Plant support foot pointing directly at target.',
      'Rotate striking foot outwards 90° with ankle toes pointed slightly upward.',
      'Strike through middle equator of the ball and push through smoothly.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Eliminates pass bobbles and elevates passing completion rate to academy standards.',
    targetAngleRule: 'Striking Foot Rotation: 85°-95°',
    equipment: 'Rebound Board / Partner'
  },
  {
    id: 'soccer-header-cervical-brace',
    sportId: 'soccer',
    techniqueId: 'heading',
    techniqueName: 'Aerial Headers',
    phase: 'Forehead Contact',
    sportName: 'Football / Soccer',
    title: 'Thoracic Hinge & Neck Isometric Header Brace',
    category: 'Injury Prevention',
    targetJoint: 'Cervical Spine & Core Flexors',
    difficulty: 'Intermediate',
    reps: '10 controlled tosses',
    sets: '3 sets',
    coachingCue: '"Attack the ball with forehead; brace neck muscles tight prior to contact."',
    description: 'Teaches safe heading mechanics where power comes from core and thoracic flexion rather than loose whiplash neck snap.',
    steps: [
      'Receive underhand toss from partner 3 yards away.',
      'Arch upper back slightly with arms raised for spatial balance.',
      'Snap core forward, striking ball squarely on hairline forehead.',
      'Maintain rigid cervical muscle contraction throughout follow-through.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Reduces head acceleration during impact by 50%, mitigating sub-concussive brain strain.',
    targetAngleRule: 'Cervical Neck Angle: Rigid 175°-180°',
    equipment: 'Lightweight Training Ball'
  },
  {
    id: 'soccer-gk-dive-power-step',
    sportId: 'soccer',
    techniqueId: 'goalkeeping',
    techniqueName: 'Goalkeeping & Diving',
    phase: 'Lateral Push-Off',
    sportName: 'Football / Soccer',
    title: 'Lateral Power-Step & Low Dive Roll',
    category: 'Strength & Power',
    targetJoint: 'Hip Abductors & Lateral Ankle',
    difficulty: 'Elite',
    reps: '6 dives each side',
    sets: '4 sets',
    coachingCue: '"Step laterally into save direction; drive off outside edge of the shoe, never collapsing inward."',
    description: 'Optimizes horizontal launch distance for low and mid-height corner saves with safe body rolling to prevent hip bruising.',
    steps: [
      'Start in set position with weight on balls of feet.',
      'Take quick directional power step 45° toward ball trajectory.',
      'Push explosively through lead foot while extending bottom arm toward ball.',
      'Catch or parry cleanly and roll onto muscular lat/thigh surface.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Increases dive reach radius by 30cm and dissipates ground impact safely.',
    targetAngleRule: 'Power-Step Knee Angle: 110°-120°',
    equipment: 'GK Gloves, Balls & Cones'
  },
  {
    id: 'soccer-curl-whip-followthrough',
    sportId: 'soccer',
    techniqueId: 'shooting',
    techniqueName: 'Shooting & Power Strike',
    phase: 'Curling Wrap',
    sportName: 'Football / Soccer',
    title: 'Inswinging Free-Kick Hip Wrap Drill',
    category: 'Follow-Through',
    targetJoint: 'Hip Adductors & Trunk Rotation',
    difficulty: 'Intermediate',
    reps: '10 dead-ball strikes',
    sets: '3 sets',
    coachingCue: '"Wrap big toe around outside of ball; follow through across the standing knee."',
    description: 'Generates high Magnus-effect aerodynamic spin on free kicks and crosses without hyperextending groin adductors.',
    steps: [
      'Approach ball at 45° angle with long stride.',
      'Plant foot 8 inches wide of ball pointing 15° off-target.',
      'Whip inside edge of boot across ball circumference.',
      'Let kicking leg follow through naturally across the standing leg line.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Maximizes ball spin rate (RPM) while maintaining adductor muscle protection.',
    targetAngleRule: 'Follow-Through Cross Angle: 35°-45°',
    equipment: 'Soccer Balls & Mannequin Wall'
  },
  {
    id: 'soccer-volley-technique',
    sportId: 'soccer',
    techniqueId: 'shooting',
    techniqueName: 'Shooting & Power Strike',
    phase: 'Volley Contact',
    sportName: 'Football / Soccer',
    title: 'Balanced Volley Impact Drill',
    category: 'Kinetic Chain',
    targetJoint: 'Hip Flexion & Core Stability',
    difficulty: 'Elite',
    reps: '10 volleys each foot',
    sets: '3 sets',
    coachingCue: '"Lock your ankle; keep your body slightly over the ball to keep it down."',
    description: 'Trains the athlete to strike a moving aerial ball with precision and control.',
    steps: [
      'Receive an aerial toss from 5 meters away.',
      'Anticipate the bounce and set your plant foot.',
      'Swing your striking leg with a locked ankle and pointed toes.',
      'Strike the ball at waist height, leaning slightly forward.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Improves aerial ball striking accuracy and reduces mishit risk.',
    targetAngleRule: 'Body Lean: 100°-115°',
    equipment: 'Soccer Balls'
  },
  {
    id: 'soccer-defensive-jockey',
    sportId: 'soccer',
    techniqueId: 'defending',
    techniqueName: 'Defending & Tackling',
    phase: 'Jockeying',
    sportName: 'Football / Soccer',
    title: 'Low-Center Defensive Jockey',
    category: 'Stability',
    targetJoint: 'Knees & Ankles',
    difficulty: 'Intermediate',
    reps: '1 minute active',
    sets: '4 sets',
    coachingCue: '"Stay on your toes; keep your hips low and don\'t dive in."',
    description: 'Develops lateral agility and defensive positioning to contain attackers.',
    steps: [
      'Face the attacker in a side-on stance.',
      'Sink into a deep quarter squat, keeping weight on the balls of your feet.',
      'Shuffle laterally, mirroring the attacker\'s movement.',
      'Maintain a consistent 1.5-meter distance.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Reduces defensive reaction time and prevents being easily bypassed.',
    targetAngleRule: 'Knee Flexion: 110°-130°',
    equipment: 'Cones'
  },

  // ==========================================
  // 3. NETBALL (10 Drills)
  // ==========================================
  {
    id: 'netball-landing-absorb',
    sportId: 'netball',
    techniqueId: 'footwork',
    techniqueName: 'Footwork & Landing',
    phase: 'Landing Phase',
    sportName: 'Netball',
    title: 'Single-Leg Deceleration & ACL Armor Landing',
    category: 'Injury Prevention',
    targetJoint: 'Knees & Ankles',
    difficulty: 'Elite',
    reps: '10 landings each leg',
    sets: '4 sets',
    coachingCue: '"Soft silent landing; knee tracks directly over second toe with zero valgus collapse."',
    description: 'Protects ACL and ankle ligaments during high-velocity aerial ball catches and court sudden stops.',
    steps: [
      'Hop forward 1 meter landing cleanly on designated single leg.',
      'Immediately absorb impact by flexing hip, knee, and ankle into a deep quarter squat.',
      'Hold stable position for 2 seconds before resetting.',
      'Ensure knee does not cave inward toward midline.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Reduces peak landing impact forces by 45% and eliminates knee valgus ACL tearing vectors.',
    targetAngleRule: 'Landing Knee Flexion: 105°-125°',
    equipment: 'Flat Court Markers'
  },
  {
    id: 'netball-shot-vertical-arc',
    sportId: 'netball',
    techniqueId: 'shooting',
    techniqueName: 'Shooting & Arc Flight',
    phase: 'Shot Release',
    sportName: 'Netball',
    title: 'High-Arc Elbow Extension & Swan-Neck Flick',
    category: 'Kinetic Chain',
    targetJoint: 'Elbow Extension & Wrist Snap',
    difficulty: 'Intermediate',
    reps: '20 shots from 8ft',
    sets: '3 sets',
    coachingCue: '"Knees dip, elbows rise, finish with fingers waving goodbye to the hoop."',
    description: 'Synchronizes knee flexion dip with vertical arm extension to produce a steep 60° entry trajectory into the netball ring.',
    steps: [
      'Balance ball on fingertips of dominant shooting hand with guide hand lightly on side.',
      'Dip knees to 125° while keeping torso strictly vertical.',
      'Extend legs and shooting arm simultaneously toward sky.',
      'Snap wrist into full swan-neck follow-through at top of reach.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Improves goal shooting percentage by 30% through repeatable vertical kinetic sequencing.',
    targetAngleRule: 'Release Elbow Extension: 160°-175°',
    equipment: 'Netball & Regulation Ring'
  },
  {
    id: 'netball-pivot-speed',
    sportId: 'netball',
    techniqueId: 'footwork',
    techniqueName: 'Footwork & Landing',
    phase: 'Pivoting',
    sportName: 'Netball',
    title: 'Front-Foot Seal & 180° Pivot Agility',
    category: 'Stability',
    targetJoint: 'Ankles & Pelvic Rotation',
    difficulty: 'Intermediate',
    reps: '12 pivots each direction',
    sets: '3 sets',
    coachingCue: '"Plant firmly on ball of grounded foot; spin smoothly with upright spine."',
    description: 'Improves passing release speed and footwork precision under aggressive defensive marking without dragging the grounded pivot foot.',
    steps: [
      'Receive simulated pass on the move while executing a clean 1-2 stop.',
      'Lock the grounded landing foot as permanent pivot center.',
      'Rotate hips and shoulders swiftly to scan passing lanes.',
      'Deliver crisp pass within 3 seconds of possession.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Eliminates footwork stepping penalties and accelerates ball redistribution.',
    targetAngleRule: 'Pivot Foot Anchor: 0cm Drag',
    equipment: 'Netball & Court Cones'
  },
  {
    id: 'netball-3ft-defense-reach',
    sportId: 'netball',
    techniqueId: 'defending',
    techniqueName: 'Defending & Interceptions',
    phase: '3ft Defense',
    sportName: 'Netball',
    title: '3-Foot Defensive Base & Overhead Arm Block',
    category: 'Mobility',
    targetJoint: 'Shoulder Flexion & Lumbar Core',
    difficulty: 'Beginner',
    reps: '8 holds of 10 seconds',
    sets: '3 sets',
    coachingCue: '"Measure 3 feet back; wide stable base with active arms shadowing shooter eye line."',
    description: 'Teaches defenders to hold maximum legal 180° arm extension without leaning forward into obstruction territory.',
    steps: [
      'Plant feet 0.9m back from imaginary shooter landing foot.',
      'Widen stance to 1.5x shoulder width with knees flexed 130°.',
      'Extend both arms straight up at 170°-180° shoulder flexion.',
      'Hold position maintaining active weight on balls of feet.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Reduces obstruction penalties to 0 while maximizing shooter visual interference.',
    targetAngleRule: 'Shoulder Arm Elevation: 165°-180°',
    equipment: 'Measuring Tape & Netball'
  },

  // ==========================================
  // 4. FIELD HOCKEY (10 Drills)
  // ==========================================
  {
    id: 'hockey-low-sweep',
    sportId: 'hockey',
    techniqueId: 'hitting',
    techniqueName: 'Hitting & Slapshot',
    phase: 'Impact Moment',
    sportName: 'Field Hockey',
    title: 'Low-Gravity Sweep & Extension',
    category: 'Mobility',
    targetJoint: 'Hip Adductors & Knees',
    difficulty: 'Elite',
    reps: '12 reps',
    sets: '4 sets',
    coachingCue: '"Keep chest over the ball with lead knee flexed past 90 degrees."',
    description: 'Improves low-body posture during sweeping and slap hits without losing balance or lifting the stick prematurely.',
    steps: [
      'Start in a deep squat stance with hands separated wide on stick shaft.',
      'Sink left knee forward over toes while keeping stick flat on turf.',
      'Sweep ball smoothly from back foot to front foot transfer.',
      'Hold finishing extension for 2 seconds to reinforce neuromuscular stability.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Prevents premature upright lifting during shooting action, increasing ball velocity and safety.',
    targetAngleRule: 'Lead Knee Flexion: 90°-105°',
    equipment: 'Hockey Stick & Turf Balls'
  },
  {
    id: 'hockey-dribble-agility',
    sportId: 'hockey',
    techniqueId: 'dribble',
    techniqueName: 'Dribbling & Indian Dribble',
    phase: 'Stick Turn',
    sportName: 'Field Hockey',
    title: 'Indian Dribble Lateral Weight Transfer',
    category: 'Stability',
    targetJoint: 'Ankles & Wrists',
    difficulty: 'Intermediate',
    reps: '30 seconds continuous',
    sets: '4 sets',
    coachingCue: '"Quick soft hands with low center of gravity; shift weight heel-to-toe."',
    description: 'Enhances stick-handling agility and rapid directional weight shifts during high-pressure field elimination.',
    steps: [
      'Maintain an athletic knee bend with flat back.',
      'Roll ball smoothly across body from forehand to reverse stick.',
      'Keep head up scanning field while feet execute rapid micro-adjustments.',
      'Maintain low posture without rising during rapid lateral transitions.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1593341646782-e0b495cffc6d?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Optimizes reaction time and lower limb force absorption during high-speed dodging.',
    targetAngleRule: 'Wrist Pronation Angle: 70°-110°',
    equipment: 'Stick, Ball & Agility Cones'
  },
  {
    id: 'hockey-drag-flick-hip-transfer',
    sportId: 'hockey',
    techniqueId: 'push',
    techniqueName: 'Push Passing & Flicking',
    phase: 'Drag Phase',
    sportName: 'Field Hockey',
    title: 'Penalty Corner Drag-Flick Dynamic Lunge',
    category: 'Strength & Power',
    targetJoint: 'Lead Hip Flexor & Thoracic Uncoil',
    difficulty: 'Elite',
    reps: '10 drag flicks',
    sets: '4 sets',
    coachingCue: '"Drag ball from behind rear hip; explode lead knee into deep lunge while rotating core."',
    description: 'Builds massive kinetic torque for penalty corner drag flicks by dragging the ball along a 2-meter acceleration track before whipping into top corner.',
    steps: [
      'Receive injection ball behind right hip.',
      'Step left leg forward into deep 85° lunge while dragging ball on stick hook.',
      'Rotate shoulders 90° and whip wrist at release point.',
      'Follow through low to high across the left shoulder.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Increases drag flick velocity past 110 km/h with optimal aerodynamic trajectory.',
    targetAngleRule: 'Lunge Knee Depth: 80°-95°',
    equipment: 'Drag Flick Stick & PC Balls'
  },
  {
    id: 'hockey-tomahawk-wrist-snap',
    sportId: 'hockey',
    techniqueId: 'hitting',
    techniqueName: 'Hitting & Slapshot',
    phase: 'Reverse Strike',
    sportName: 'Field Hockey',
    title: 'Reverse Stick Tomahawk Edge Strike',
    category: 'Kinetic Chain',
    targetJoint: 'Forearm Pronation & Shoulder Rotator',
    difficulty: 'Elite',
    reps: '10 reverse hits',
    sets: '3 sets',
    coachingCue: '"Turn stick so flat edge meets ball; strike parallel to turf without chipping pitch."',
    description: 'Refines reverse-stick tomahawk mechanics ensuring the edge strikes clean through the ball center with low horizontal blade path.',
    steps: [
      'Grip stick with knuckles turned under.',
      'Drop body low over left knee, leaning torso toward turf.',
      'Sweep stick on flat plane parallel to turf.',
      'Strike ball cleanly on reverse edge and complete full rotational follow-through.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1593341646782-e0b495cffc6d?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Eliminates dangerous high stick infractions and delivers explosive reverse shots.',
    targetAngleRule: 'Stick-to-Turf Angle: < 15° Parallel',
    equipment: 'Stick, Balls & Goal Target'
  },

  // ==========================================
  // 5. CRICKET (10 Drills)
  // ==========================================
  {
    id: 'cricket-batting-brace',
    sportId: 'cricket',
    techniqueId: 'batting_front_foot',
    techniqueName: 'Front Foot Batting & Drives',
    phase: 'Front Foot Impact',
    sportName: 'Cricket',
    title: 'Front-Foot Braced Delivery Cover Drive',
    category: 'Kinetic Chain',
    targetJoint: 'Lead Knee & Lumbar Spine',
    difficulty: 'Elite',
    reps: '15 drives each side',
    sets: '3 sets',
    coachingCue: '"Lock front knee firm at impact; stack head directly over front toe with high elbow."',
    description: 'Prevents collapsing front knee during cover drives, maximizing energy transfer into the ball and eliminating air-bound catches.',
    steps: [
      'Adopt balanced batting stance with bat elevated high in back-lift.',
      'Step forward smoothly with front foot toward pitch line of ball.',
      'Brace front knee rigid at impact while head stays directly over front toe.',
      'Follow through high over back shoulder with full elbow extension.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Increases bat head speed through impact zone by 28% through rigid kinetic bracing.',
    targetAngleRule: 'Front Knee Bracing: 145°-165°',
    equipment: 'Bat, Tennis / Leather Balls'
  },
  {
    id: 'cricket-bowling-action',
    sportId: 'cricket',
    techniqueId: 'pace_bowling',
    techniqueName: 'Pace Bowling Action',
    phase: 'Front Foot Contact',
    sportName: 'Cricket',
    title: 'Thoracic Counter-Rotation Pace Bowling Drill',
    category: 'Strength & Power',
    targetJoint: 'Shoulders & Spine',
    difficulty: 'Elite',
    reps: '12 deliveries',
    sets: '4 sets',
    coachingCue: '"Drive hips through the crease while non-bowling arm pulls down hard against ribs."',
    description: 'Optimizes kinetic sequencing from run-up to front foot contact for maximum fast bowling pace with spinal protection.',
    steps: [
      'Begin 4-step walk-up into bowling crease with high chest posture.',
      'Plant front foot firmly with braced knee and counter-rotated shoulders.',
      'Whip bowling arm over top with ear brushing biceps.',
      'Follow through smoothly across body to protect lower back.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Reduces lumbar stress fracture risk by 55% while maximizing bowling release velocity.',
    targetAngleRule: 'Bowling Arm Extension: 170°-180° (Zero Flex)',
    equipment: 'Cricket Balls & Crease Markers'
  },
  {
    id: 'cricket-spin-wrist-cock',
    sportId: 'cricket',
    techniqueId: 'spin_bowling',
    techniqueName: 'Spin Bowling & Grip',
    phase: 'Revolutions Release',
    sportName: 'Cricket',
    title: 'Wrist-Cock Revolutions Snap & Seam Alignment',
    category: 'Kinetic Chain',
    targetJoint: 'Wrist Flexion & Finger Spread',
    difficulty: 'Intermediate',
    reps: '25 seam flicks',
    sets: '3 sets',
    coachingCue: '"Cock wrist at 90°; rip fingers hard over the seam at release to maximize revolutions."',
    description: 'Develops high revolution per minute (RPM) finger and wrist action for off-spin and leg-spin drift and sharp turn.',
    steps: [
      'Grip ball with index and middle fingers spread wide across seam.',
      'Cock wrist back 90° during backswing loading.',
      'Drive bowling arm down and rip fingers across seam at 12 o’clock release.',
      'Observe vertical upright seam rotation through the air.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Increases ball spin rate past 2000 RPM, producing dramatic pitch deviation.',
    targetAngleRule: 'Wrist Cock Angle: 80°-95°',
    equipment: 'Cricket Balls with Two-Tone Seam'
  },
  {
    id: 'cricket-wicketkeeping-crouch-rise',
    sportId: 'cricket',
    techniqueId: 'wicket_keeping',
    techniqueName: 'Wicket Keeping & Fielding',
    phase: 'Rising Take',
    sportName: 'Cricket',
    title: 'Wicket-Keeper Low Crouch & Late Rise Hold',
    category: 'Mobility',
    targetJoint: 'Deep Hip Flexion & Knee Cartilage',
    difficulty: 'Intermediate',
    reps: '15 takes',
    sets: '3 sets',
    coachingCue: '"Stay low until the ball bounces; rise with the bounce with soft yielding gloves."',
    description: 'Prevents premature rising by wicketkeepers on turning or bouncing pitches, ensuring clean takes and lightning stumpings.',
    steps: [
      'Set up in deep 80° knee crouch with gloves touching turf.',
      'Track ball path strictly without lifting head prematurely.',
      'Rise only as ball hits pitch surface.',
      'Give with the ball into hip pocket with soft palms.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Eliminates dropped catches off edges and accelerates stumping reaction time.',
    targetAngleRule: 'Crouch Knee Depth: 75°-90°',
    equipment: 'Keeping Gloves, Pads & Stumps'
  },
  {
    id: 'cricket-batting-pull-shot',
    sportId: 'cricket',
    techniqueId: 'batting_back_foot',
    techniqueName: 'Back Foot Batting & Pulls',
    phase: 'Back Foot Impact',
    sportName: 'Cricket',
    title: 'Back-Foot Pull Shot Hip Swivel',
    category: 'Strength & Power',
    targetJoint: 'Hips & Shoulders',
    difficulty: 'Intermediate',
    reps: '15 shots',
    sets: '3 sets',
    coachingCue: '"Weight on the back foot; roll the wrists to keep the ball down."',
    description: 'Develops powerful rotational mechanics for the pull shot against short-pitched bowling.',
    steps: [
      'Identify short ball and step back and across towards off-stump.',
      'Transfer weight to the back foot with a flexed knee.',
      'Swing the bat horizontally, rotating your hips 90 degrees.',
      'Roll the wrists over the ball at the point of impact.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Maximizes horizontal power and eliminates dangerous top-edges.',
    targetAngleRule: 'Back Knee Flexion: 110°-130°',
    equipment: 'Bat & Bowling Machine / Feeder'
  },
  {
    id: 'cricket-spin-release-snap-drill',
    sportId: 'cricket',
    techniqueId: 'spin_bowling',
    techniqueName: 'Spin Bowling & Grip',
    phase: 'Release Instant',
    sportName: 'Cricket',
    title: 'Spin Release Finger Snap',
    category: 'Kinetic Chain',
    targetJoint: 'Wrist & Fingers',
    difficulty: 'Elite',
    reps: '30 flicks',
    sets: '3 sets',
    coachingCue: '"Feel the seam; rip your fingers across the ball for maximum revs."',
    description: 'Improves the revolutions on the ball by strengthening the finger-rip at release.',
    steps: [
      'Grip the ball firmly across the seam.',
      'Practice short-arm releases focusing purely on the finger-snap.',
      'Aim for a consistent vertical seam rotation.',
      'Maintain a relaxed but fast wrist snap.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Significantly increases ball drift and sharp turn off the pitch.',
    targetAngleRule: 'Wrist Snap: 75°-90°',
    equipment: 'Cricket Balls'
  },

  // ==========================================
  // 6. TENNIS (10 Drills)
  // ==========================================
  {
    id: 'tennis-forehand-unit-turn',
    sportId: 'tennis',
    techniqueId: 'forehand',
    techniqueName: 'Forehand & Unit Turn',
    phase: 'Unit Turn',
    sportName: 'Tennis',
    title: 'Unit Turn Shoulder Coil & Racquet Lag',
    category: 'Kinetic Chain',
    targetJoint: 'Thoracic Spine & Shoulder Rotator',
    difficulty: 'Intermediate',
    reps: '15 shadow swings',
    sets: '3 sets',
    coachingCue: '"Turn left shoulder 90° to incoming ball before starting racquet drop."',
    description: 'Loads core rotational stretch energy so racquet accelerates into impact via hip-shoulder separation rather than arm muscle pulling.',
    steps: [
      'Start in ready position at baseline.',
      'Pivot right foot and turn shoulders 90° as a single solid unit.',
      'Hold coiled position 1 second before uncoiling into shadow swing.',
      'Whip racquet up through contact with windshield-wiper finish.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Increases forehand groundstroke speed by 15 mph while reducing tennis elbow tendonitis risk.',
    targetAngleRule: 'Shoulder Turn Angle: 85°-95°',
    equipment: 'Tennis Racquet'
  },
  {
    id: 'tennis-serve-trophy-pose',
    sportId: 'tennis',
    techniqueId: 'serve',
    techniqueName: 'Serve & Trophy Pose',
    phase: 'Trophy Pose',
    sportName: 'Tennis',
    title: 'Trophy Pose Knee Dip & Pronation Snap',
    category: 'Strength & Power',
    targetJoint: 'Knee Dip & Shoulder Internal Rotation',
    difficulty: 'Elite',
    reps: '15 serves',
    sets: '4 sets',
    coachingCue: '"Drop racquet down back like scratching spine; explode off both knees into court."',
    description: 'Builds world-class serve mechanics by synchronizing knee drive with deep racquet drop and aggressive forearm pronation.',
    steps: [
      'Toss ball 1 foot in front of baseline.',
      'Bend knees to 120° while bringing hitting elbow up to shoulder height (Trophy Pose).',
      'Drive upward off toes as racquet drops down the spine.',
      'Pronate forearm at impact and land inside baseline on front foot.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Maximizes flat and kick serve velocity with complete shoulder rotator cuff health.',
    targetAngleRule: 'Trophy Pose Knee Flexion: 115°-130°',
    equipment: 'Racquet, Balls & Serving Target'
  },
  {
    id: 'tennis-backhand-drive-step',
    sportId: 'tennis',
    techniqueId: 'backhand',
    techniqueName: 'Backhand & Weight Transfer',
    phase: 'Forward Contact',
    sportName: 'Tennis',
    title: 'Two-Handed Backhand Weight Transfer Push',
    category: 'Stability',
    targetJoint: 'Lead Hip & Non-Dominant Arm Extension',
    difficulty: 'Intermediate',
    reps: '12 drives each side',
    sets: '3 sets',
    coachingCue: '"Step forward into contact; drive non-dominant hand through like a left-handed forehand."',
    description: 'Eliminates leaning back during defensive backhands by driving the center of mass forward through the contact point.',
    steps: [
      'Pivot on back foot into closed stance.',
      'Step front foot firmly forward toward net at 45° angle.',
      'Drive non-dominant arm straight through ball trajectory.',
      'Finish high over opposite shoulder with chest facing net.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Improves backhand depth and consistency past the opponent service line by 38%.',
    targetAngleRule: 'Lead Foot Step Angle: 40°-50°',
    equipment: 'Racquet & Ball Basket'
  },
  {
    id: 'tennis-split-step-reaction',
    sportId: 'tennis',
    techniqueId: 'volley',
    techniqueName: 'Volley & Net Play',
    phase: 'Split Step',
    sportName: 'Tennis',
    title: 'Net Play Split-Step & Punch Volley',
    category: 'Stability',
    targetJoint: 'Ankle Stiffness & Compact Elbow',
    difficulty: 'Beginner',
    reps: '20 volleys',
    sets: '3 sets',
    coachingCue: '"Hop as opponent strikes ball; punch without taking a long backswing."',
    description: 'Teaches split-second net reflexes with zero backswing to block high-velocity passing shots.',
    steps: [
      'Hop lightly onto balls of both feet as opponent makes contact.',
      'Step forward toward net with lead foot.',
      'Punch racquet face through ball with firm wrist and zero backswing.',
      'Maintain head and racquet head above wrist level.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Reduces reaction latency by 120 milliseconds at the net.',
    targetAngleRule: 'Volley Backswing Angle: < 15° Minimal',
    equipment: 'Racquet & Partner Feeder'
  },

  // ==========================================
  // 7. GOLF (10 Drills)
  // ==========================================
  {
    id: 'golf-spine-hinge-posture',
    sportId: 'golf',
    techniqueId: 'full_swing',
    techniqueName: 'Full Driver & Iron Swing',
    phase: 'Address Stance',
    sportName: 'Golf',
    title: 'Spine Hinge & Posterior Hip Clearance',
    category: 'Kinetic Chain',
    targetJoint: 'Lumbar-Sacral Joint & Hip Hinge',
    difficulty: 'Intermediate',
    reps: '10 slow swings',
    sets: '3 sets',
    coachingCue: '"Keep rear hip against imaginary wall during backswing and downswing."',
    description: 'Maintains 35°-45° forward torso tilt throughout swing arc, preserving constant swing radius and low point precision.',
    steps: [
      'Stand with rear hips touching alignment rod or wall.',
      'Hinge forward at hips 35°-45° maintaining straight spine.',
      'Execute slow motion swing maintaining rear contact with wall.',
      'Rotate fully into upright balanced finish.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Eliminates early extension, slices, and protects lower lumbar vertebrae from reverse-pivot shear.',
    targetAngleRule: 'Spine Address Hinge: 35°-45°',
    equipment: 'Alignment Rod or Wall'
  },
  {
    id: 'golf-lead-arm-straight-backswing',
    sportId: 'golf',
    techniqueId: 'full_swing',
    techniqueName: 'Full Driver & Iron Swing',
    phase: 'Backswing Coiling',
    sportName: 'Golf',
    title: 'Lead Arm Straightness & Shoulder Turn Coil',
    category: 'Mobility',
    targetJoint: 'Lead Elbow & Thoracic Spine',
    difficulty: 'Elite',
    reps: '12 backswing coils',
    sets: '3 sets',
    coachingCue: '"Keep lead arm straight like a steel rod while turning back fully to target."',
    description: 'Builds maximum backswing swing arc width by keeping the lead elbow straight (165°-180°) without collapsing at the top.',
    steps: [
      'Take address with 7-iron.',
      'Initiate takeaway with shoulders and chest as single triangle.',
      'Turn back until left shoulder is tucked under chin with straight left arm.',
      'Pause 1 second at top before uncoiling into strike.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Increases clubhead speed by 8 mph and tightens dispersion circles.',
    targetAngleRule: 'Lead Elbow Angle: 165°-180°',
    equipment: 'Club & Mirror / Video Feed'
  },
  {
    id: 'golf-putting-pendulum-rock',
    sportId: 'golf',
    techniqueId: 'putting',
    techniqueName: 'Putting & Green Reading',
    phase: 'Downswing Impact',
    sportName: 'Golf',
    title: 'Shoulder-Rock Pendulum Putting Stroke',
    category: 'Stability',
    targetJoint: 'Shoulder Girdle & Locked Wrists',
    difficulty: 'Beginner',
    reps: '25 putts from 6ft',
    sets: '3 sets',
    coachingCue: '"Lock wrists rigid; let the shoulders rock like a grandfather clock pendulum."',
    description: 'Eliminates wrist breaking during putting stroke to maintain a square clubface and pure rolling ball trajectory.',
    steps: [
      'Place eyes directly over putting target line.',
      'Lock triangle formed by arms and shoulders.',
      'Rock shoulders back and through with zero wrist hinge.',
      'Listen for ball dropping into cup before looking up.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Eliminates pushed/pulled putts and masters distance tempo control.',
    targetAngleRule: 'Wrist Angle Deviation: < 2° (Locked)',
    equipment: 'Putter, Putting Mat & Balls'
  },
  {
    id: 'golf-wedge-pitch-tempo',
    sportId: 'golf',
    techniqueId: 'pitching',
    techniqueName: 'Wedge & Short Game Pitching',
    phase: 'Impact Moment',
    sportName: 'Golf',
    title: 'Narrow Stance Crisp Wedge Strike & Rotate',
    category: 'Kinetic Chain',
    targetJoint: 'Hip Rotation & Lead Wrist Flatness',
    difficulty: 'Intermediate',
    reps: '15 pitches of 30 yards',
    sets: '3 sets',
    coachingCue: '"Weight 60% on front foot; rotate chest through ball without flipping hands."',
    description: 'Ensures crisp ball-first contact on 30-60 yard wedge shots by preventing fat and thin skull mishits.',
    steps: [
      'Adopt narrow stance with feet 8 inches apart.',
      'Set 60% of body weight on lead foot at address.',
      'Take 3/4 backswing with firm wrists.',
      'Rotate chest smoothly through impact, holding flat lead wrist through finish.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Guarantees crisp turf contact and high backspin control.',
    targetAngleRule: 'Lead Wrist Flatness: 175°-180°',
    equipment: '56°/60° Wedge & Practice Balls'
  },
  {
    id: 'netball-overhead-intercept',
    sportId: 'netball',
    techniqueId: 'defending',
    techniqueName: 'Defending & Interceptions',
    phase: 'Interception',
    sportName: 'Netball',
    title: 'High Overhead Intercept Reach',
    category: 'Kinetic Chain',
    targetJoint: 'Shoulders & Fingers',
    difficulty: 'Elite',
    reps: '10 intercepts',
    sets: '3 sets',
    coachingCue: '"Extend through the fingertips; time your jump at the peak of the ball\'s arc."',
    description: 'Focuses on maximum vertical reach and timing to intercept high lob passes.',
    steps: [
      'Position yourself between the attacker and the goal.',
      'Explode vertically, extending both arms fully overhead.',
      'Time the reach to tip or catch the ball at your highest point.',
      'Land softly with balanced weight distribution.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1544648397-52ee3bf82abb?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Maximizes defensive disruption and turnover potential.',
    targetAngleRule: 'Shoulder Extension: 165°-180°',
    equipment: 'Netball & Feeder'
  },
  {
    id: 'hockey-reverse-sweep',
    sportId: 'hockey',
    techniqueId: 'passing',
    techniqueName: 'Passing & Receiving',
    phase: 'Reverse Pass',
    sportName: 'Field Hockey',
    title: 'Reverse Edge Sweep Power',
    category: 'Strength & Power',
    targetJoint: 'Wrists & Hips',
    difficulty: 'Intermediate',
    reps: '15 passes',
    sets: '3 sets',
    coachingCue: '"Stay low; sweep the stick flat across the turf using your core."',
    description: 'Develops power and accuracy for the reverse-edge sweep pass.',
    steps: [
      'Adopt a low, wide stance with knees flexed.',
      'Turn the stick over to the reverse edge.',
      'Sweep the stick horizontally across the turf.',
      'Rotate hips through the impact for maximum power.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Enables high-velocity passing from difficult angles.',
    targetAngleRule: 'Wrist Snap: 140°-165°',
    equipment: 'Hockey Sticks & Balls'
  },
  {
    id: 'tennis-backhand-slice',
    sportId: 'tennis',
    techniqueId: 'backhand',
    techniqueName: 'Backhand (1H & 2H)',
    phase: 'Slice Impact',
    sportName: 'Tennis',
    title: 'Backhand Slice Carving Drill',
    category: 'Kinetic Chain',
    targetJoint: 'Shoulders & Wrists',
    difficulty: 'Intermediate',
    reps: '20 slices',
    sets: '3 sets',
    coachingCue: '"High-to-low motion; carve around the ball for maximum backspin."',
    description: 'Develops the technical carving motion required for a deep, skidding slice.',
    steps: [
      'Start with the racquet high behind the shoulder.',
      'Step forward with the lead foot into a closed stance.',
      'Swing down and through the ball at a 45-degree angle.',
      'Finish with the racquet extended low and wide.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1595435062638-348f3214582f?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Creates low bounce and defensive utility on the backhand side.',
    targetAngleRule: 'Swing Path Angle: 40°-50°',
    equipment: 'Tennis Racquet & Balls'
  },
  {
    id: 'golf-bunker-explosion',
    sportId: 'golf',
    techniqueId: 'short_game',
    techniqueName: 'Wedge & Short Game',
    phase: 'Sand Impact',
    sportName: 'Golf',
    title: 'Bunker Explosion Splash Drill',
    category: 'Kinetic Chain',
    targetJoint: 'Knees & Hips',
    difficulty: 'Intermediate',
    reps: '15 shots',
    sets: '3 sets',
    coachingCue: '"Hit the sand, not the ball; splash the sand onto the green."',
    description: 'Trains the athlete to hit behind the ball in bunkers to create an explosion effect.',
    steps: [
      'Dig feet into the sand and open the clubface.',
      'Aim 2 inches behind the ball.',
      'Swing aggressively through the sand with a full follow-through.',
      'Focus on the "splash" of sand carrying the ball out.'
    ],
    photoUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=800&q=80',
    biomechanicalBenefit: 'Ensures consistent bunker escapes and distance control.',
    targetAngleRule: 'Knee Flexion: 115°-135°',
    equipment: 'Wedge & Bunker'
  }
];

export function getDrillsForSport(sportId?: string, techniqueId?: string): DrillItem[] {
  if (!sportId || sportId === 'all') {
    return COMPREHENSIVE_DRILL_LIBRARY;
  }

  return COMPREHENSIVE_DRILL_LIBRARY.filter(d => {
    const matchesSport = d.sportId.toLowerCase() === sportId.toLowerCase();
    if (techniqueId && techniqueId !== 'all') {
      return matchesSport && d.techniqueId === techniqueId;
    }
    return matchesSport;
  });
}

export function getDrillById(id: string): DrillItem | undefined {
  return COMPREHENSIVE_DRILL_LIBRARY.find(d => d.id === id);
}

export function getAllSportsList() {
  return [
    { id: 'all', name: 'All Sports', icon: 'Trophy' },
    { id: 'rugby', name: 'Rugby', icon: 'Flame' },
    { id: 'soccer', name: 'Soccer', icon: 'Activity' },
    { id: 'netball', name: 'Netball', icon: 'Target' },
    { id: 'hockey', name: 'Hockey', icon: 'Zap' },
    { id: 'cricket', name: 'Cricket', icon: 'Shield' },
    { id: 'tennis', name: 'Tennis', icon: 'Trophy' },
    { id: 'golf', name: 'Golf', icon: 'Target' },
  ];
}
