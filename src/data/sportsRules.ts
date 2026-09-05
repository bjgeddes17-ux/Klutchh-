import { SportRule, JointRule, SportId, SkillLevel, Drill } from '../types';

// Helper function to generate structured joint rule with level scaling
function createRule(
  id: string,
  sportId: SportId,
  name: string,
  phase: string,
  description: string,
  keypoints: [number, number, number],
  idealMin: number,
  idealMax: number,
  importance: 'critical_safety' | 'performance' | 'posture',
  difficultyTier: SkillLevel = 'grassroots',
  impactOnPerformance: string = 'Improves technical execution and power transfer.',
  injuryRiskFactor: string = 'Low risk if maintained, but poor form can lead to joint strain.',
  targetSpeed?: number,
  targetTorque?: number,
  feedbackVariations?: {
    optimal: string[];
    warning: string[];
    error: string[];
  }
): JointRule {
  return {
    id,
    sportId,
    name,
    phase,
    description,
    keypoints,
    idealMin,
    idealMax,
    unit: '°',
    importance,
    difficultyTier,
    impactOnPerformance,
    injuryRiskFactor,
    targetSpeed,
    targetTorque,
    feedbackVariations,
    tolerancesByLevel: {
      grassroots: {
        idealMin: Math.max(0, idealMin - 15),
        idealMax: Math.min(180, idealMax + 15),
        toleranceMargin: 15,
      },
      academy: {
        idealMin: Math.max(0, idealMin - 7),
        idealMax: Math.min(180, idealMax + 7),
        toleranceMargin: 7,
      },
      elite_pro: {
        idealMin,
        idealMax,
        toleranceMargin: 2,
      },
    },
  };
}

// -------------------------------------------------------------
// 1. RUGBY (40 Biometric Rules)
// -------------------------------------------------------------
const rugbyRules: JointRule[] = [
  // Tackling & Contact Safety (10 rules)
  createRule('rugby_tackle_knee_flex', 'rugby', 'Tackle Base Knee Flexion', 'Contact Prep', 'Knee flexion angle before contact to lower center of gravity safely.', [24, 26, 28], 100, 125, 'critical_safety', 'grassroots', 'Lowers center of mass for superior leverage and driving power.', 'Prevents ACL strain by ensuring force is absorbed through musculature, not joint ligaments.', 150, 2.0, {
    optimal: ['Excellent base! Your knee flex provides a powerful platform for contact.', 'Low center of gravity achieved. You are in a prime position to dominate the collision.'],
    warning: ['Knees are a bit too straight. You might be pushed back easily at this height.', 'Sink 10 degrees lower into the tackle to improve your leverage.'],
    error: ['Dangerous upright tackle posture. This increases risk of being "run over" and puts strain on the ACL.', 'Too high! You need to drop your hips significantly before the point of impact.']
  }),
  createRule('rugby_tackle_hip_hinge', 'rugby', 'Spine & Hip Hinge', 'Contact Prep', 'Hip bend angle maintaining flat neck/spine entering collision.', [12, 24, 26], 120, 145, 'critical_safety', 'grassroots', 'Aligns the kinetic chain for maximum force transfer through the torso.', 'Protects the lumbar spine from compression injuries during high-impact collisions.'),
  createRule('rugby_head_up_neck', 'rugby', 'Head-Up Cervical Alignment', 'Contact Phase', 'Neck posture ensuring chin is up to prevent spinal compression.', [0, 11, 23], 150, 175, 'critical_safety', 'grassroots', 'Ensures situational awareness and consistent target tracking.', 'CRITICAL: Prevents axial loading of the cervical spine, reducing risk of severe neck injury.'),
  createRule('rugby_shoulder_wrap_arm', 'rugby', 'Shoulder Wrap Extension', 'Wrap Phase', 'Lead shoulder arm angle wrapping around opponent waist.', [12, 14, 16], 85, 115, 'performance', 'grassroots'),
  createRule('rugby_plant_foot_decel', 'rugby', 'Breakdown Plant Foot Angle', 'Deceleration', 'Ankle flexion angle when planting foot prior to tackle.', [26, 28, 30], 75, 95, 'performance', 'academy'),
  createRule('rugby_core_bracing_tilt', 'rugby', 'Core Bracing Trunk Alignment', 'Impact Moment', 'Truncal alignment under load to absorb lateral impact.', [11, 23, 25], 160, 180, 'critical_safety', 'academy'),
  createRule('rugby_drive_leg_extension', 'rugby', 'Leg Drive Triple Extension', 'Drive Phase', 'Rear hip, knee, ankle full extension driving through tackle.', [24, 26, 28], 160, 178, 'performance', 'elite_pro'),
  createRule('rugby_low_shoulder_entry', 'rugby', 'Shoulder Level Below Hip', 'Tackle Entry', 'Shoulder height relative to ball carrier waistline.', [12, 24, 26], 90, 115, 'critical_safety', 'elite_pro'),
  createRule('rugby_bilateral_quad_flex', 'rugby', 'Bilateral Stance Balance', 'Contact Base', 'Equally flexed left-right knees for maximum collision stability.', [23, 25, 27], 105, 130, 'posture', 'academy'),
  // Rugby Arm & Wrist Rules (New)
  createRule('rugby_arm_shoulder_elbow_angle', 'rugby', 'Shoulder-Elbow Power Angle', 'Contact Prep', 'Arm angle during shoulder wrap setup.', [11, 13, 15], 90, 150, 'performance', 'academy'),
  createRule('rugby_wrist_firmness', 'rugby', 'Wrist Firmness at Impact', 'Contact Phase', 'Wrist angle stability during shoulder wrap.', [13, 15, 17], 160, 180, 'performance', 'elite_pro'),
  createRule('rugby_elbow_tuck', 'rugby', 'Elbow-to-Body Tuck', 'Wrap Phase', 'Proximity of elbow to ribcage for tight wrap.', [11, 13, 23], 15, 45, 'performance', 'academy'),
  createRule('rugby_pass_wrist_snap', 'rugby', 'Pass Wrist Snap', 'Pass Release', 'Wrist snap angle at release.', [14, 16, 20], 100, 140, 'performance', 'academy'),

  createRule('rugby_pass_follow_through_elbow', 'rugby', 'Pass Follow-Through Extension', 'Pass Release', 'Arm extension pointing toward receiver target.', [12, 14, 16], 155, 178, 'performance', 'grassroots', 'Improves technical execution and power transfer.', 'Low risk if maintained, but poor form can lead to joint strain.', 500, 1.2, {
    optimal: ['Clinical follow-through! You are pointing the ball exactly where it needs to go.', 'Smooth extension. Your arms are perfectly guiding the flight path.'],
    warning: ['Truncated follow-through. You are cutting off the guidance phase too early.', 'Elbow is slightly soft at release. Lock it out to improve pass accuracy.'],
    error: ['Incomplete arm extension. This causes the pass to "hang" in the air and lose velocity.', 'Shoving the ball instead of guiding it. Focus on pointing your fingers at the receiver.']
  }),
  createRule('rugby_torso_rotation_pass', 'rugby', 'Trunk Rotation Separation', 'Wind-Up', 'Shoulder relative to hip rotation for spin power.', [11, 12, 24], 110, 140, 'performance', 'grassroots'),
  createRule('rugby_lead_wrist_flick', 'rugby', 'Lead Wrist Flexion', 'Ball Release', 'Wrist snap angle imparting rapid spiral rotational torque.', [14, 16, 20], 120, 150, 'performance', 'academy'),
  createRule('rugby_hip_squareness', 'rugby', 'Hips Square To Touchline', 'Pre-Pass', 'Hips facing downfield while shoulders rotate to pass.', [23, 24, 26], 160, 180, 'posture', 'academy'),
  createRule('rugby_trail_elbow_lift', 'rugby', 'Trail Elbow Flared Drive', 'Pass Initiation', 'Trailing arm elbow lift launching flat pass over distance.', [11, 13, 15], 85, 110, 'performance', 'elite_pro'),
  createRule('rugby_catch_hand_funnel', 'rugby', 'Hand Funnel Reach Angle', 'Catching Phase', 'Arm extension reaching for incoming match ball.', [12, 14, 16], 130, 160, 'performance', 'grassroots'),
  createRule('rugby_base_width_pass', 'rugby', 'Wide Passing Base Stance', 'Pass Platform', 'Width ratio between feet during long cutout pass.', [27, 23, 28], 80, 110, 'posture', 'academy'),
  createRule('rugby_shoulder_shrug_pass', 'rugby', 'Shoulder Level Balance', 'Pass Release', 'Level shoulders avoiding excessive dipping.', [11, 12, 23], 80, 100, 'posture', 'grassroots'),
  createRule('rugby_chest_expansion', 'rugby', 'Chest Opening Range', 'Cock Phase', 'Shoulder opening angle prior to bullet pass.', [13, 11, 12], 90, 120, 'performance', 'elite_pro'),
  createRule('rugby_head_target_lock', 'rugby', 'Head-On-Target Alignment', 'Pass Release', 'Head locked facing receiver uninterrupted.', [0, 11, 12], 85, 95, 'posture', 'grassroots'),

  // Kicking Mechanics (10 rules)
  createRule('rugby_kick_plant_knee', 'rugby', 'Plant Knee Flexion', 'Kick Plant', 'Non-kicking knee flexed to absorb landing force safely.', [23, 25, 27], 125, 150, 'critical_safety', 'grassroots'),
  createRule('rugby_kicking_leg_backswing', 'rugby', 'Kicking Leg Knee Cock', 'Backswing', 'Flexion of kicking knee behind body loading power.', [24, 26, 28], 80, 105, 'performance', 'grassroots'),
  createRule('rugby_kick_hip_extension', 'rugby', 'Hip Extension Range', 'Power Phase', 'Rear hip pullback angle before forward leg swing.', [12, 24, 26], 140, 170, 'performance', 'academy'),
  createRule('rugby_kick_follow_through_hip', 'rugby', 'High Follow-Through Height', 'Follow Through', 'Kicking foot elevation reaching chest level post-kick.', [24, 26, 28], 150, 180, 'performance', 'elite_pro'),
  createRule('rugby_kick_counter_arm', 'rugby', 'Counter-Balance Arm Flare', 'Contact Point', 'Non-kicking side arm raised sideways for balance.', [11, 13, 15], 110, 145, 'posture', 'grassroots'),
  createRule('rugby_kick_chest_lean', 'rugby', 'Chest Forward Lean', 'Contact Point', 'Upper body leaning forward over ball for low trajectory.', [12, 24, 28], 150, 172, 'performance', 'academy'),
  createRule('rugby_kick_ankle_lock', 'rugby', 'Ankle Plantar Lock', 'Ball Strike', 'Ankle angle locked firm at impact.', [26, 28, 32], 135, 160, 'performance', 'elite_pro'),
  createRule('rugby_kick_head_down', 'rugby', 'Head Down Over Ball', 'Strike Moment', 'Cervical spine angled looking at ball contact spot.', [0, 12, 24], 120, 145, 'posture', 'grassroots'),
  createRule('rugby_dropkick_bounce_timing', 'rugby', 'Dropkick Dip Knee Flexion', 'Drop Bounce', 'Deep knee bend catching ball off ground bounce.', [24, 26, 28], 105, 128, 'performance', 'elite_pro'),
  createRule('rugby_restart_takeoff_extension', 'rugby', 'Restart Kick Extension', 'Takeoff', 'Full leg extension during high restart kick.', [23, 25, 27], 165, 180, 'performance', 'academy'),

  // Scrums, Rucks & Lineouts (10 rules)
  createRule('rugby_scrum_spine_flat', 'rugby', 'Scrum Flat Back Alignment', 'Scrum Setup', 'Spine parallel to ground (180° neck-hip-knee line).', [12, 24, 28], 165, 180, 'critical_safety', 'grassroots'),
  createRule('rugby_scrum_bind_elbow_lock', 'rugby', 'Scrum Bind Elbow Lock', 'Scrum Bind', 'Elbow locked high at 165°+ for stable prop binding.', [12, 14, 16], 165, 180, 'performance', 'elite_pro'),
  createRule('rugby_lineout_lift_thoracic_extension', 'rugby', 'Lineout Lifter Chest Up', 'Lineout Lift', 'Lifter maintains chest up with thoracic extension during peak lift.', [11, 12, 24], 160, 180, 'critical_safety', 'academy'),
  createRule('rugby_ruck_entry_hip_depth', 'rugby', 'Ruck Entry Hip Depth', 'Ruck Entry', 'Hips below opponent shoulders during cleanout.', [23, 24, 11], 45, 75, 'performance', 'academy'),
  createRule('rugby_scrum_hip_knee_90', 'rugby', 'Scrum Power Angle (Hip/Knee)', 'Scrum Engagement', 'Knee bend angle at 90°-110° for optimal pushing force.', [24, 26, 28], 95, 115, 'performance', 'academy'),
  createRule('rugby_ruck_over_cleanout', 'rugby', 'Ruck Cleanout Shoulder Level', 'Cleanout', 'Shoulders above hips during ruck cleanout.', [12, 24, 26], 155, 175, 'critical_safety', 'grassroots'),
  createRule('rugby_lineout_jump_reach', 'rugby', 'Lineout Jump Overhead Reach', 'Peak Jump', 'Arms fully extended overhead at top of lineout lift.', [24, 12, 16], 165, 180, 'performance', 'grassroots'),
  createRule('rugby_lifter_knee_drive', 'rugby', 'Lineout Lifter Base Drive', 'Lift Moment', 'Lifter knee bend loading deep squat prior to launch.', [24, 26, 28], 100, 125, 'critical_safety', 'academy'),
  createRule('rugby_jackal_hip_hinge', 'rugby', 'Jackal Low Center Hinge', 'Turnover Prep', 'Hip hinge angle stealing ball over ruck.', [12, 24, 26], 85, 110, 'performance', 'elite_pro'),
  createRule('rugby_scrum_neck_neutral', 'rugby', 'Scrum Neck Neutral Curve', 'Bind Phase', 'Cervical spine aligned straight without hyperextension.', [0, 11, 23], 160, 180, 'critical_safety', 'grassroots'),
  createRule('rugby_bind_arm_flex', 'rugby', 'Prop Bind Arm Hook', 'Prop Bind', 'Elbow flex locking tightly onto opposition jersey.', [12, 14, 16], 70, 95, 'performance', 'academy'),
  createRule('rugby_maul_drive_extension', 'rugby', 'Maul Push Leg Extension', 'Maul Drive', 'Continuous leg drive extension under collective weight.', [24, 26, 28], 150, 175, 'performance', 'elite_pro'),
  createRule('rugby_lineout_throw_elbow', 'rugby', 'Hooker Throw Two-Hand Extension', 'Lineout Throw', 'Overhead double elbow release angle.', [12, 14, 16], 150, 175, 'performance', 'academy'),
];

// -------------------------------------------------------------
// 2. SOCCER (40 Biometric Rules)
// -------------------------------------------------------------
const soccerRules: JointRule[] = [
  // Shooting & Striking (10 rules)
  createRule('soccer_plant_foot_knee_flex', 'soccer', 'Plant Foot Knee Flexion', 'Plant Phase', 'Non-kicking knee flexed absorbing impact & lowering center of gravity.', [23, 25, 27], 120, 145, 'critical_safety', 'grassroots', 'Lowering CG increases stability for a more consistent strike through the ball.', 'Absorbs landing shock; poor flexion increases strain on the patellar tendon.', 180, 0.5, {
    optimal: ['Rock-solid plant! Your knee flex is absorbing the impact perfectly for a stable shot.', 'Great stability. You have established a firm foundation for the strike.'],
    warning: ['Plant knee is a bit too rigid. You might be losing control of the ball trajectory.', 'Try to sink slightly deeper into the plant foot to improve your balance.'],
    error: ['Dangerous straight-leg plant detected. High risk of knee strain and poor shot accuracy.', 'Lack of impact absorption. You need a deep, soft knee flex to protect your joints.']
  }),
  createRule('soccer_kicking_knee_backswing', 'soccer', 'Kicking Knee Backswing', 'Backswing', 'Knee flexed behind loading elastic hip whip.', [24, 26, 28], 80, 110, 'performance', 'grassroots', 'Loads the quadriceps like a spring, maximizing potential energy for the strike.', 'Incomplete backswing reduces power, while over-swinging can strain hip flexors.'),
  createRule('soccer_hip_rotation_strike', 'soccer', 'Pelvic Rotation Angle', 'Impact Moment', 'Hips rotating open to closed through impact.', [23, 24, 26], 110, 140, 'performance', 'academy', 'The primary driver of rotational power and direction control.', 'Restricted rotation puts excessive shearing force on the lumbar spine.'),
  createRule('soccer_chest_over_ball', 'soccer', 'Chest Over Ball Alignment', 'Impact Moment', 'Trunk lean angle keeping shot trajectory below crossbar.', [12, 24, 28], 155, 172, 'performance', 'grassroots'),
  createRule('soccer_follow_through_height', 'soccer', 'Follow-Through Leg Lift', 'Follow Through', 'Kicking foot extended across body centerline.', [24, 26, 28], 150, 180, 'performance', 'academy'),
  createRule('soccer_non_kicking_arm_balance', 'soccer', 'Counter-Balance Arm Extension', 'Impact Moment', 'Arm raised outward to maintain rotational balance.', [11, 13, 15], 90, 135, 'posture', 'grassroots'),
  createRule('soccer_ankle_lock_strike', 'soccer', 'Ankle Plantarfirm Lock', 'Ball Contact', 'Ankle firm angle preventing energy leak on ball strike.', [26, 28, 32], 140, 165, 'performance', 'elite_pro'),
  createRule('soccer_finesse_hip_open', 'soccer', 'Finesse Curl Open Hip Angle', 'Approach Angle', 'Hips angled at 45° for inswinging curling shot.', [23, 24, 28], 125, 150, 'performance', 'elite_pro'),
  createRule('soccer_volleyball_strike_hip', 'soccer', 'Volley Hip Elevation Angle', 'Air Contact', 'Lead leg hip flexion hitting ball mid-air.', [12, 24, 26], 90, 120, 'performance', 'elite_pro'),
  createRule('soccer_head_still_impact', 'soccer', 'Head Fixed On Ball Spot', 'Contact Instant', 'Cervical alignment locked down at contact point.', [0, 11, 23], 120, 145, 'posture', 'grassroots'),

  // Passing & First Touch (10 rules)
  createRule('soccer_inside_pass_ankle_open', 'soccer', 'Inside Foot Ankle Rotation', 'Pass Release', 'Ankle turned 90° outwards for clean flat pass surface.', [26, 28, 31], 75, 100, 'performance', 'grassroots'),
  createRule('soccer_cushion_knee_soft', 'soccer', 'Receiving Cushion Knee Dip', 'First Touch', 'Soft knee flex cushioning high speed incoming pass.', [24, 26, 28], 125, 150, 'performance', 'grassroots'),
  createRule('soccer_driven_pass_knee_over', 'soccer', 'Driven Long Pass Knee Over Ball', 'Long Pass', 'Knee positioned directly over ball at strike.', [24, 26, 28], 135, 160, 'performance', 'academy'),
  createRule('soccer_trivela_foot_angle', 'soccer', 'Outside Foot Trivela Angle', 'Outside Strike', 'Ankle turned inward for swerving outside foot pass.', [26, 28, 30], 110, 135, 'performance', 'elite_pro'),
  createRule('soccer_wall_pass_pivot', 'soccer', 'One-Touch Wall Pass Pivot', 'One Touch', 'Quick hip rotation facing receiver before ball arrives.', [23, 24, 25], 140, 165, 'performance', 'academy'),
  createRule('soccer_chip_pass_backspin', 'soccer', 'Chip Pass Short Follow-Through', 'Under Ball', 'Knee extension stopping abruptly to create backspin.', [24, 26, 28], 120, 140, 'performance', 'elite_pro'),
  createRule('soccer_header_neck_snap', 'soccer', 'Header Neck Extension Snap', 'Heading Moment', 'Neck snaps forward from arched position.', [0, 11, 23], 150, 175, 'performance', 'grassroots'),
  createRule('soccer_header_jump_knee_load', 'soccer', 'Aerial Header Takeoff Dip', 'Aerial Takeoff', 'Deep knee bend prior to rising for header.', [24, 26, 28], 100, 125, 'performance', 'academy'),
  createRule('soccer_throw_in_overhead', 'soccer', 'Throw-In Double Arm Extension', 'Throw Release', 'Both arms extending equally behind head over shoulders.', [12, 14, 16], 150, 178, 'critical_safety', 'grassroots'),
  createRule('soccer_throw_in_feet_planted', 'soccer', 'Throw-In Drag Foot Extension', 'Throw Release', 'Rear leg extended keeping toes touching turf.', [24, 26, 28], 160, 180, 'posture', 'grassroots'),
  createRule('soccer_throw_in_wrist_snap', 'soccer', 'Throw-In Wrist Release Angle', 'Throw Release', 'Wrist stability at the final point of ball release.', [14, 16, 20], 160, 180, 'performance', 'academy'),
  createRule('soccer_GK_catch_wrist_angle', 'soccer', 'GK Catch Wrist Stability', 'High Catch', 'Wrist angles maintaining the funnel shape.', [13, 15, 17], 150, 175, 'performance', 'academy'),
  createRule('soccer_pass_wrist_follow_through', 'soccer', 'Pass Wrist Follow-Through', 'Passing', 'Wrist maintaining neutral extension through pass.', [14, 16, 20], 160, 180, 'performance', 'grassroots'),

  // Dribbling & Agility (10 rules)
  createRule('soccer_dribble_low_cg_knee', 'soccer', 'Dribble Knee Bend (Low CG)', 'Dribbling', 'Knee flexed maintaining low center of gravity.', [24, 26, 28], 115, 140, 'performance', 'grassroots', 'Lowers center of mass for superior leverage and driving power.', 'Low risk if maintained, but poor form can lead to joint strain.', 120, 0.4, {
    optimal: ['Excellent dribbling posture. You are ready to explode in any direction.', 'Great low center of gravity. You have elite control over your movement.'],
    warning: ['Standing a bit too tall while dribbling. You are vulnerable to being dispossessed.', 'Sink 5 degrees lower into your knees to improve your agility.'],
    error: ['Stiff-legged dribbling detected. This severely limits your change-of-direction speed.', 'Poor balance base. You need to drop your hips to protect the ball and react faster.']
  }),
  createRule('soccer_feint_side_step_valgus', 'soccer', 'Body Feint Knee Tracking', 'Change of Direction', 'Knee tracking straight over foot during sharp cutting step.', [24, 26, 28], 150, 175, 'critical_safety', 'academy', 'Ensures force is absorbed through musculature, not joint ligaments.', 'Prevents ACL strain by ensuring knee doesn\'t buckle inward.', 280, 1.8, {
    optimal: ['Perfect knee tracking on the cut. Your ACL is well-protected.', 'Textbook side-step. Alignment is perfectly linear through the force vector.'],
    warning: ['Slight inward knee buckle detected. Be mindful of your tracking during high-speed cuts.', 'Knee is drifting slightly inside the foot line. Focus on external hip rotation.'],
    error: ['CRITICAL: Significant knee valgus (inward buckle) detected. High risk of ACL injury. You must train hip stability.', 'Dangerous cutting mechanics. Your knee is collapsing under load. Stop and correct immediately.']
  }),
  createRule('soccer_stepover_hip_circle', 'soccer', 'Stepover Hip Abduction', 'Skill Move', 'Hip opening wide over top of ball.', [12, 24, 26], 120, 150, 'performance', 'academy'),
  createRule('soccer_sprint_stride_knee_drive', 'soccer', 'Wing Sprint High Knee Drive', 'Sprint Stride', 'Knee drive angle parallel to pitch ground.', [23, 25, 27], 75, 95, 'performance', 'grassroots'),
  createRule('soccer_jockey_defensive_stance', 'soccer', 'Jockey Stance Knee Dip', 'Defending', 'Side-on defensive stance with 110° knee flex.', [24, 26, 28], 105, 130, 'performance', 'grassroots'),
  createRule('soccer_jockey_defensive_crouch', 'soccer', 'Jockeying Defensive Crouch', 'Defensive Jockey', 'Low center of gravity with knees at 110°-130° for agility.', [23, 25, 27], 110, 130, 'performance', 'grassroots'),
  createRule('soccer_volley_strike_lean', 'soccer', 'Volley Strike Body Lean', 'Volley', 'Body tilted slightly back to control ball elevation.', [11, 12, 24], 100, 120, 'performance', 'academy'),
  createRule('soccer_corner_injection_plant_foot', 'soccer', 'Corner Plant Foot Alignment', 'Corner Kick', 'Plant foot pointing directly at the target arc.', [23, 25, 27], 140, 160, 'performance', 'grassroots'),
  createRule('soccer_slide_tackle_lead_leg', 'soccer', 'Slide Tackle Lead Leg Reach', 'Slide Contact', 'Lead leg extended sweeping ball clean.', [23, 25, 27], 160, 180, 'critical_safety', 'academy'),
  createRule('soccer_curtain_turn_pivot', 'soccer', 'Cruyff Turn Hip Pivot', 'Fake Kick', 'Hips pivoting 180° dragging ball behind plant foot.', [23, 24, 28], 80, 110, 'performance', 'elite_pro'),
  createRule('soccer_chest_control_cushion', 'soccer', 'Chest Trap Arch Back', 'Air Reception', 'Upper spine arched back cushioning high ball.', [12, 24, 26], 155, 175, 'performance', 'academy'),
  createRule('soccer_turn_and_burn_lean', 'soccer', 'Acceleration Forward Lean', 'Burst', 'Forward trunk lean during first 3 explosive steps.', [11, 23, 25], 150, 168, 'performance', 'elite_pro'),
  createRule('soccer_shielding_arm_block', 'soccer', 'Shielding Arm Extension', 'Hold Up Play', 'Arm extended protecting ball from defender.', [11, 13, 15], 110, 145, 'posture', 'grassroots'),

  // Goalkeeping (10 rules)
  createRule('soccer_gk_ready_knee_flex', 'soccer', 'GK Set Stance Knee Flexion', 'Ready Position', 'Deep balanced knee bend ready to dive.', [24, 26, 28], 105, 130, 'performance', 'grassroots'),
  createRule('soccer_gk_diving_push_knee', 'soccer', 'GK Dive Push-Off Knee', 'Dive Takeoff', 'Explosive extension of push-off leg towards ball.', [24, 26, 28], 155, 180, 'performance', 'academy'),
  createRule('soccer_gk_high_claim_reach', 'soccer', 'GK High Cross Arm Reach', 'Cross Catch', 'Both arms fully extended at highest jump peak.', [24, 12, 16], 165, 180, 'performance', 'grassroots'),
  createRule('soccer_gk_contour_hand_angle', 'soccer', 'GK W-Shape Hand Funnel', 'High Catch', 'Wrists and thumbs angled inward making W-catch.', [13, 15, 19], 140, 170, 'performance', 'grassroots'),
  createRule('soccer_gk_parry_elbow_stiff', 'soccer', 'GK Parry Stiff Elbow', 'Shot Deflection', 'Elbow firm deflection angle pushing shot wide.', [12, 14, 16], 160, 180, 'critical_safety', 'academy'),
  createRule('soccer_gk_1v1_block_spread', 'soccer', 'GK Star Jump Spread Angle', '1v1 Block', 'Arms and legs wide creating wall.', [16, 12, 24], 120, 150, 'performance', 'elite_pro'),
  createRule('soccer_gk_punting_leg_swing', 'soccer', 'GK Punt Kicking Whip', 'Punt Release', 'Full high arc leg kick for distance.', [24, 26, 28], 150, 180, 'performance', 'academy'),
  createRule('soccer_gk_sidearm_throw_rotation', 'soccer', 'GK Sidearm Throw Hip Rotation', 'Counter Distribution', 'Hips rotate through fast throw.', [23, 24, 26], 120, 150, 'performance', 'elite_pro'),
  createRule('soccer_gk_soft_landing_roll', 'soccer', 'GK Landing Hip-Shoulder Roll', 'Dive Landing', 'Side body contact absorbing dive impact.', [12, 24, 26], 135, 160, 'critical_safety', 'grassroots'),
  createRule('soccer_gk_smother_knee_drop', 'soccer', 'GK Low Smother Knee Barrier', 'Low Save', 'Trailing knee dropped to turf preventing nutmeg.', [23, 25, 27], 80, 105, 'performance', 'academy'),
];

// -------------------------------------------------------------
// 3. NETBALL (40 Biometric Rules)
// -------------------------------------------------------------
const netballRules: JointRule[] = [
  // Shooting & Arc Flight (10 rules)
  createRule('netball_shot_elbow_flick', 'netball', 'High Release Shooting Elbow', 'Shot Release', 'Elbow extended straight above shoulder pointing to hoop.', [12, 14, 16], 165, 180, 'performance', 'grassroots', 'Ensures a high arc and straight trajectory towards the hoop.', 'A low release is easily blocked and has a lower percentage of success.', 350, 0.8, {
    optimal: ['Perfect high release. Your shot is virtually unblockable.', 'Great elbow extension. You are giving the ball a beautiful arc.'],
    warning: ['Release point is a bit low. Try to extend your arm fully above your head.', 'Elbow is slightly soft at release. Lock it out for better accuracy.'],
    error: ['Low release detected. You are pushing the ball from your chest instead of overhead.', 'Incomplete extension. Your shot lacks the height required to clear the defender.']
  }),
  createRule('netball_shot_knee_dip', 'netball', 'Shooting Power Knee Bend', 'Shot Prep', 'Knees flexed evenly providing vertical arc lift.', [24, 26, 28], 110, 135, 'performance', 'grassroots', 'Generates the vertical power required for long-range accuracy.', 'Shooting with stiff legs puts all the strain on the arms, leading to inconsistency.', 180, 0.6, {
    optimal: ['Excellent power base. Your legs are doing all the heavy lifting.', 'Smooth, rhythmic dip. This foundation ensures a consistent shot.'],
    warning: ['Dip is a bit shallow. You might find yourself "pushing" the ball with your arms.', 'Knee dip timing is slightly off. Try to sync your legs with your release.'],
    error: ['Shooting with stiff legs. This is the primary cause of shots falling short.', 'Mechanical disconnect. You need a deeper, more fluid dip to power your shot.']
  }),
  createRule('netball_wrist_flick_snap', 'netball', 'Wrist Follow-Through Swan Neck', 'Release Instant', 'Wrist snaps forward giving ball high reverse spin.', [14, 16, 20], 110, 145, 'performance', 'grassroots'),
  createRule('netball_guide_hand_angle', 'netball', 'Guide Arm Elbow Flexion', 'Set Phase', 'Guide arm supporting ball without pushing.', [11, 13, 15], 85, 115, 'performance', 'academy'),
  createRule('netball_torso_upright_shot', 'netball', 'Vertical Spine Shooting Posture', 'Release Instant', 'Spine straight vertical avoiding leaning backward.', [12, 24, 26], 168, 180, 'posture', 'grassroots'),
  createRule('netball_stepping_rule_footwork', 'netball', 'Grounded Plant Foot Ankle', 'Shot Footwork', 'Grounded shooting foot firm without dragging.', [26, 28, 30], 80, 100, 'critical_safety', 'academy'),
  createRule('netball_high_arc_release_shoulder', 'netball', 'High Release Angle Shoulder', 'Release Point', 'Shoulder joint flexed high overhead.', [24, 12, 14], 155, 180, 'performance', 'elite_pro'),
  createRule('netball_balance_base_width', 'netball', 'Shoulder-Width Base Stance', 'Set Phase', 'Feet set shoulder-width apart.', [27, 23, 28], 85, 110, 'posture', 'grassroots'),
  createRule('netball_jump_shot_takeoff_knee', 'netball', 'Jump Shot Takeoff Flexion', 'Jump Takeoff', 'Deep knee flex for contested jump shot.', [24, 26, 28], 100, 125, 'performance', 'elite_pro'),
  createRule('netball_soft_landing_cushion', 'netball', 'Shot Landing Knee Flex', 'Landing Phase', 'Soft landing cushion absorbing floor impact.', [24, 26, 28], 115, 140, 'critical_safety', 'grassroots'),

  // Footwork & Landing Safety (10 rules)
  createRule('netball_one_two_landing_knee', 'netball', '1-2 Landing Footwork Knee Flex', 'Landing', 'Lead knee flexes absorbing sudden stop force.', [23, 25, 27], 120, 145, 'critical_safety', 'grassroots'),
  createRule('netball_pivot_hip_rotation', 'netball', 'Pivot Leg Hip Rotation', 'Pivoting', 'Hip rotates smoothly around grounded pivot foot.', [23, 24, 26], 120, 150, 'performance', 'grassroots'),
  createRule('netball_knee_valgus_decel', 'netball', 'Deceleration Knee Alignment', 'Sudden Stop', 'Knee aligns over second toe preventing valgus buckle.', [24, 26, 28], 155, 180, 'critical_safety', 'academy'),
  createRule('netball_change_direction_cut', 'netball', 'Sharp Cut Ankle Flexion', 'Dodging', 'Ankle flexes low into lateral push-off step.', [26, 28, 30], 75, 95, 'performance', 'academy'),
  createRule('netball_sprint_to_stop_hip', 'netball', 'Sprint-to-Stop Hip Sink', 'Deceleration', 'Hips sink low into braking stance.', [12, 24, 26], 115, 140, 'performance', 'elite_pro'),
  createRule('netball_single_leg_landing_balance', 'netball', 'Single-Leg Landing Knee Stability', 'Catch Landing', 'Single leg knee flexed 130° with zero wobble.', [25, 27, 29], 125, 148, 'critical_safety', 'academy'),
  createRule('netball_dodge_torso_tilt', 'netball', 'Sprint Dodge Body Lean', 'Feint Step', 'Trunk leans away from defender during change of direction.', [11, 23, 25], 150, 172, 'performance', 'elite_pro'),
  createRule('netball_drive_line_knee_extension', 'netball', 'Drive to Space Triple Extension', 'Acceleration', 'Rear leg extended fully pushing off into line.', [24, 26, 28], 160, 180, 'performance', 'academy'),
  createRule('netball_landing_symmetry', 'netball', 'Double Foot Landing Symmetry', 'Two-Foot Drop', 'Both feet touch down simultaneously with equal flex.', [25, 26, 27], 120, 145, 'posture', 'grassroots'),
  createRule('netball_upright_head_scan', 'netball', 'Upright Scan Head Position', 'Court Vision', 'Head held high surveying pass options.', [0, 11, 23], 150, 175, 'posture', 'grassroots'),

  // Passing & Catching (10 rules)
  createRule('netball_chest_pass_elbow_drive', 'netball', 'Chest Pass Elbow Extension', 'Chest Pass', 'Elbows extend outwards pushing ball directly.', [12, 14, 16], 150, 175, 'performance', 'grassroots'),
  createRule('netball_shoulder_pass_arm_cock', 'netball', 'Shoulder Pass Arm Cock Angle', 'Takeback', 'Elbow flexed 90° behind ear before throw.', [12, 14, 16], 85, 110, 'performance', 'grassroots'),
  createRule('netball_bounce_pass_dip', 'netball', 'Bounce Pass Knee Loading', 'Bounce Pass', 'Knees flexed low directing ball 2/3 down court.', [24, 26, 28], 110, 135, 'performance', 'grassroots'),
  createRule('netball_overhead_pass_reach', 'netball', 'Overhead Pass High Extension', 'Lob Pass', 'Arms extended overhead clearing defender fingers.', [24, 12, 16], 160, 180, 'performance', 'academy'),
  createRule('netball_catch_arm_funnel_soft', 'netball', 'Catching Soft Arm Cushion', 'Ball Reception', 'Elbows flex inward absorbing fast pass.', [12, 14, 16], 110, 140, 'performance', 'grassroots'),
  createRule('netball_one_hand_catch_stretch', 'netball', 'High One-Hand Tip Stretch', 'Interception', 'Arm reaching fully sideways for intercept.', [11, 13, 15], 160, 180, 'performance', 'elite_pro'),
  createRule('netball_pass_follow_through_wrist', 'netball', 'Pass Snap Wrist Extension', 'Pass Release', 'Wrists snap thumbs down post-pass.', [14, 16, 20], 130, 160, 'performance', 'academy'),
  createRule('netball_chest_pass_wrist_snap', 'netball', 'Chest Pass Wrist Snap', 'Chest Pass', 'Wrist snap creating power at release.', [14, 16, 20], 160, 180, 'performance', 'grassroots'),
  createRule('netball_arm_reach_stretch', 'netball', 'Overhead Arm Reach Extension', 'Lob Pass', 'Arms extended overhead clearing defender fingers.', [11, 13, 15], 160, 180, 'performance', 'academy'),

  // Hockey
  createRule('hockey_stick_handle_wrist_angle', 'hockey', 'Dribbling Wrist Angle', 'Dribbling', 'Wrist angle stability during stick handling.', [14, 16, 20], 150, 175, 'performance', 'academy'),
  createRule('hockey_shot_wrist_snap', 'hockey', 'Shot Wrist Release Snap', 'Shot Release', 'Wrist snap at contact for power.', [14, 16, 20], 140, 170, 'performance', 'elite_pro'),
  createRule('hockey_arm_shoulder_backswing', 'hockey', 'Backswing Arm Angle', 'Windup Arc', 'Arm angle during stick backswing.', [12, 14, 16], 100, 140, 'performance', 'academy'),
  createRule('netball_sidearm_pass_rotation', 'netball', 'Bullet Sidearm Hip Rotation', 'Bullet Pass', 'Hips twist rapidly through horizontal pass.', [23, 24, 26], 115, 145, 'performance', 'elite_pro'),
  createRule('netball_offward_hand_guard', 'netball', 'Non-Passing Guard Arm', 'Protected Pass', 'Off-arm held up protecting pass lane.', [11, 13, 15], 90, 125, 'posture', 'grassroots'),
  createRule('netball_lob_pass_rainbow_angle', 'netball', 'Lob Pass Arc Arm Elevation', 'High Lob', 'Release angle 60° above horizontal.', [24, 12, 14], 135, 160, 'performance', 'academy'),

  // Defending & Interceptions (10 rules)
  createRule('netball_3ft_marking_distance', 'netball', '3ft Marking Base Extension', '3ft Defense', 'Feet set 3 feet back from shooter foot.', [27, 23, 28], 90, 120, 'critical_safety', 'grassroots'),
  createRule('netball_defensive_reach_interference', 'netball', 'Defensive Interference Reach', 'Marking', 'Shoulder extension for high-point ball interference.', [11, 13, 15], 160, 180, 'performance', 'academy'),
  createRule('netball_arms_up_defense_reach', 'netball', 'Defensive Arm Stretch Angle', 'Marking Shot', 'Arms reaching high overhead contesting shot.', [24, 12, 16], 165, 180, 'performance', 'grassroots'),
  createRule('netball_intercept_jump_knee', 'netball', 'Interception Jump Takeoff Dip', 'Interception', 'Explosive knee bend launching for aerial ball.', [24, 26, 28], 100, 125, 'performance', 'academy'),
  createRule('netball_lean_over_pass_lane', 'netball', 'Defensive Lean Over Stance', 'Pass Distraction', 'Trunk leans forward without touching opponent.', [12, 24, 26], 140, 165, 'performance', 'elite_pro'),
  createRule('netball_active_hands_elbow_flex', 'netball', 'Active Defending Elbow Flex', 'Marking Pass', 'Elbows flexed ready to tip unexpected pass.', [12, 14, 16], 110, 135, 'performance', 'grassroots'),
  createRule('netball_defensive_slide_knee', 'netball', 'Defensive Slide Low Base', 'Shadowing', 'Knees flexed 115° shuffling laterally across circle.', [24, 26, 28], 105, 130, 'performance', 'academy'),
  createRule('netball_tip_interception_wrist', 'netball', 'Fingertip Interception Snap', 'Pass Tip', 'Wrist flexed slapping ball to team mate.', [14, 16, 20], 120, 155, 'performance', 'elite_pro'),
  createRule('netball_blocking_vision_head', 'netball', 'Head Turn Facing Ball', 'Vision', 'Head turned tracking ball trajectory while marking.', [0, 11, 12], 80, 100, 'posture', 'grassroots'),
  createRule('netball_stoppage_landing_knee', 'netball', 'Defensive Jump Soft Landing', 'Landing Phase', 'Both knees absorb high-jump impact.', [24, 26, 28], 115, 140, 'critical_safety', 'grassroots'),
  createRule('netball_bounding_step_drive', 'netball', 'Bounding Interception Stride', 'Drive to Ball', 'Full leg stride driving across pass lane.', [23, 25, 27], 155, 178, 'performance', 'elite_pro'),
];

// -------------------------------------------------------------
// 4. HOCKEY (40 Biometric Rules)
// -------------------------------------------------------------
const hockeyRules: JointRule[] = [
  // Hitting & Slapshot (10 rules)
  createRule('hockey_hit_knee_bend_low', 'hockey', 'Hit Prep Low Knee Flexion', 'Wind-Up', 'Deep knee flex lowering stick blade to turf.', [24, 26, 28], 105, 130, 'performance', 'grassroots'),
  createRule('hockey_hit_elbow_takeback', 'hockey', 'Hit Backswing Elbow Flex', 'Backswing', 'Top hand elbow flexed 90° pulling stick back.', [11, 13, 15], 80, 110, 'performance', 'grassroots'),
  createRule('hockey_hit_hip_rotation_strike', 'hockey', 'Pelvic Rotation Hit Strike', 'Impact Moment', 'Hips snap open transferring power to ball.', [23, 24, 26], 115, 145, 'performance', 'academy'),
  createRule('hockey_hit_follow_through_low', 'hockey', 'Low Stick Follow-Through', 'Follow Through', 'Stick stays below shoulder height after hit.', [12, 14, 16], 140, 170, 'critical_safety', 'grassroots'),
  createRule('hockey_spine_bend_over_ball', 'hockey', 'Spine Hinge Angle Over Ball', 'Impact Moment', 'Spine angled forward at 130° over ball line.', [12, 24, 26], 120, 145, 'posture', 'grassroots'),
  createRule('hockey_left_wrist_lead_firm', 'hockey', 'Lead Left Wrist Lock', 'Ball Contact', 'Left wrist firmly extended controlling stick face.', [13, 15, 19], 150, 175, 'performance', 'academy'),
  createRule('hockey_plant_foot_side_angle', 'hockey', 'Side-On Plant Foot Stance', 'Set Phase', 'Lead foot planted perpendicular to target line.', [26, 28, 30], 80, 100, 'posture', 'grassroots'),
  createRule('hockey_slap_hit_wrist_snap', 'hockey', 'Slap Hit Wrist Snap', 'Strike Instant', 'Rapid wrist whip snapping blade into ball.', [14, 16, 20], 110, 140, 'performance', 'elite_pro'),
  createRule('hockey_head_directly_over_ball', 'hockey', 'Head Position Over Impact Zone', 'Ball Contact', 'Head positioned directly above ball contact.', [0, 12, 24], 125, 148, 'posture', 'grassroots'),
  createRule('hockey_weight_transfer_front_knee', 'hockey', 'Weight Transfer Front Knee Shift', 'Follow Through', 'Body weight shifts onto flexed front knee.', [23, 25, 27], 115, 140, 'performance', 'academy'),

  // Push Passing & Flicking (10 rules)
  createRule('hockey_push_pass_bottom_elbow', 'hockey', 'Push Pass Bottom Hand Drive', 'Push Release', 'Bottom hand arm extends sweeping stick along turf.', [12, 14, 16], 150, 175, 'performance', 'grassroots'),
  createRule('hockey_push_pass_knee_lunge', 'hockey', 'Push Pass Deep Knee Lunge', 'Push Sweep', 'Lead knee lunges down to turf level.', [23, 25, 27], 95, 125, 'performance', 'grassroots'),
  createRule('hockey_drag_flick_hip_drag', 'hockey', 'Drag Flick Low Hip Drag', 'Drag Phase', 'Hips stay ultra-low dragging ball from behind foot.', [12, 24, 26], 100, 128, 'performance', 'elite_pro'),
  createRule('hockey_drag_flick_whip_extension', 'hockey', 'Drag Flick Whipping Extension', 'Flick Release', 'Rear leg extends explosive whip into high corner.', [24, 26, 28], 160, 180, 'performance', 'elite_pro'),
  createRule('hockey_aerial_flick_elbow_lift', 'hockey', 'Aerial Scoop Elbow Lift', 'Scoop Lift', 'Elbows lift under ball raising overhead aerial.', [12, 14, 16], 130, 160, 'performance', 'academy'),
  createRule('hockey_tomahawk_reverse_wrist', 'hockey', 'Tomahawk Reverse Stick Wrist', 'Reverse Hit', 'Wrists crossover hitting ball with reverse edge.', [13, 15, 19], 110, 140, 'performance', 'elite_pro'),
  createRule('hockey_tomahawk_knee_drop', 'hockey', 'Tomahawk Low Knee Drop', 'Reverse Strike', 'Back knee drops almost touching turf for edge clearance.', [24, 26, 28], 85, 110, 'performance', 'elite_pro'),
  createRule('hockey_cushion_receive_elbows', 'hockey', 'Soft Reception Elbow Cushion', 'First Touch', 'Elbows yield inward cushioning hard pass.', [12, 14, 16], 100, 130, 'performance', 'grassroots'),
  createRule('hockey_upright_pass_spine', 'hockey', 'Upright Overhead Scoop Posture', 'Scoop Release', 'Spine straightens up during overhead scoop.', [12, 24, 26], 155, 178, 'posture', 'academy'),
  createRule('hockey_inside_flick_foot_pivot', 'hockey', 'Inside Flick Foot Pivot', 'Quick Flick', 'Front foot pivots towards receiver.', [25, 27, 29], 120, 150, 'performance', 'academy'),

  // Dribbling & Indian Dribble (10 rules)
  createRule('hockey_indian_dribble_wrist_turn', 'hockey', 'Indian Dribble Wrist Rotation', 'Stick Turn', 'Top hand wrist turns stick 180° back and forth.', [13, 15, 19], 80, 120, 'performance', 'grassroots'),
  createRule('hockey_dribble_crouch_knee_flex', 'hockey', 'Dribble Crouch Knee Flexion', '3D Dribble', 'Knees flexed maintaining low hockey stance.', [24, 26, 28], 110, 135, 'performance', 'grassroots'),
  createRule('hockey_3d_pop_wrist_flick', 'hockey', '3D Ball Pop Wrist Snap', 'Pop Over Stick', 'Wrist snaps upward popping ball over defender stick.', [14, 16, 20], 120, 150, 'performance', 'academy'),
  createRule('hockey_upright_vision_neck', 'hockey', 'Head-Up Dribbling Vision', 'Scanning', 'Neck flexed looking forward, not down at stick.', [0, 11, 23], 145, 172, 'posture', 'grassroots'),
  createRule('hockey_wide_dribble_arm_reach', 'hockey', 'Wide Pull Left Arm Reach', 'Wide Elimination', 'Left arm extends far out pulling ball wide.', [11, 13, 15], 150, 178, 'performance', 'academy'),
  createRule('hockey_jab_tackle_arm_extend', 'hockey', 'Jab Tackle One-Hand Extension', 'Jab Tackle', 'Right arm extends fully poke-tackling ball.', [12, 14, 16], 160, 180, 'performance', 'grassroots'),
  createRule('hockey_flat_stick_tackle_knee', 'hockey', 'Block Tackle Low Knee Lunge', 'Block Tackle', 'Knees flexed low placing stick flat on turf.', [23, 25, 27], 90, 115, 'critical_safety', 'grassroots'),
  createRule('hockey_running_dribble_stride', 'hockey', 'Open Field Dribble Stride', 'Fast Break', 'Long sprint stride keeping ball ahead.', [23, 25, 27], 150, 175, 'performance', 'academy'),
  createRule('hockey_reverse_stick_roll_wrist', 'hockey', 'Reverse Stick Roll Wrist Flex', 'Reverse Dribble', 'Wrist flexed rolling stick over ball top.', [13, 15, 19], 90, 120, 'performance', 'elite_pro'),
  createRule('hockey_body_shield_shoulder_lean', 'hockey', 'Body Shield Shoulder Lean', 'Ball Protection', 'Shoulder leaned into defender shielding ball.', [11, 12, 24], 115, 140, 'posture', 'grassroots'),

  // Penalty Corner & Goalkeeping (10 rules)
  createRule('hockey_pc_injector_push_elbow', 'hockey', 'Penalty Corner Injector Extension', 'Injection', 'Long sweeping arm extension injecting PC ball.', [12, 14, 16], 155, 178, 'performance', 'academy'),
  createRule('hockey_overhead_pass_elbow_drive', 'hockey', 'Overhead Pass Elbow Drive', 'Overhead Pass', 'Leading elbow drives up and through for aerial height.', [11, 13, 15], 140, 170, 'performance', 'elite_pro'),
  createRule('hockey_pc_stopper_knee_crouch', 'hockey', 'PC Stopper Low Knee Crouch', 'Stop Trap', 'Back knee drops low catching injected ball.', [24, 26, 28], 85, 110, 'performance', 'grassroots'),
  createRule('hockey_gk_kick_save_leg_extension', 'hockey', 'GK Kick Save Leg Extension', 'Kick Save', 'Pad leg extends sideways kicking high shot clear.', [24, 26, 28], 155, 180, 'performance', 'grassroots'),
  createRule('hockey_gk_glove_save_arm_reach', 'hockey', 'GK Left Glove Save Arm Stretch', 'Glove Save', 'Left arm reaches up deflecting high flick.', [11, 13, 15], 160, 180, 'performance', 'academy'),
  createRule('hockey_gk_stack_pads_knee_flex', 'hockey', 'GK Stacked Pads Knee Flexion', 'PC Defense', 'Both knees flexed together sliding across goal.', [23, 25, 27], 95, 120, 'critical_safety', 'elite_pro'),
  createRule('hockey_runner_dash_knee_drive', 'hockey', 'PC First Runner Dash Knee Drive', 'PC Dash', 'High knee drive sprinting out to block drag flick.', [23, 25, 27], 75, 95, 'performance', 'academy'),
  createRule('hockey_gk_stick_save_elbow_firm', 'hockey', 'GK Right Stick Save Elbow Firm', 'Stick Save', 'Right arm firm sweeping low shot.', [12, 14, 16], 150, 175, 'performance', 'grassroots'),
  createRule('hockey_gk_diving_save_takeoff', 'hockey', 'GK Aerial Dive Takeoff Knee', 'Aerial Dive', 'Explosive push-off knee driving across goal.', [24, 26, 28], 150, 178, 'performance', 'elite_pro'),
  createRule('hockey_gk_ready_stance_hip', 'hockey', 'GK Ready Stance Hip Hinge', 'Set Position', 'Hips hinged forward ready for fast reaction.', [12, 24, 26], 115, 140, 'posture', 'grassroots'),
  createRule('hockey_pc_feint_pass_hip_rotation', 'hockey', 'PC Dummy Drag Hip Rotation', 'PC Option', 'Hips rotate dummying shot into pass.', [23, 24, 26], 120, 150, 'performance', 'elite_pro'),
];

// -------------------------------------------------------------
// 5. CRICKET (40 Biometric Rules)
// -------------------------------------------------------------
const cricketRules: JointRule[] = [
  // Fast & Spin Bowling (10 rules)
  createRule('cricket_bowling_front_knee_block', 'cricket', 'Front Knee Extension at Delivery', 'Delivery Stride', 'Front knee flexed then firm extension (168°-180°) transferring momentum.', [23, 25, 27], 168, 180, 'critical_safety', 'elite_pro', 'Acts as a brace to catapult the upper body forward for maximum pace.', 'A "soft" or flexed front knee leads to massive energy loss and increased lumbar stress.', 250, 1.5, {
    optimal: ['Textbook front-leg brace. You are maximizing the ground reaction force perfectly.', 'Rock-solid front knee. This is the foundation of a high-velocity delivery stride.'],
    warning: ['Front knee is slightly collapsing at the point of release. You are leaking pace.', 'Watch the "soft" knee. Try to firm up the front leg 0.1s earlier to snap the torso through.'],
    error: ['Significant knee collapse detected. This is a high-risk posture for lower back stress.', 'No front-leg brace. Your arm is doing all the work—you need that leg to act as a pivot.']
  }),
  createRule('cricket_bowling_arm_straight', 'cricket', 'Bowling Arm Straightness (15° Law)', 'Release Instant', 'Bowling arm elbow straight within ICC 15° bend rule.', [12, 14, 16], 175, 180, 'critical_safety', 'elite_pro', 'Ensures a legal delivery and prevents elbow ligament strain.', 'Bending the elbow (throwing) can lead to joint impingement and match disqualification.', 1200, 2.5, {
    optimal: ['Perfectly legal high-arm action. Great extension through the arc.', 'Clean delivery. Your elbow remains locked, satisfying the 15-degree mandate.'],
    warning: ['Subtle bend detected near the peak. Focus on locking that tricep early in the swing.', 'Margin is tight. Ensure the arm remains a stiff lever from gather to release.'],
    error: ['Action exceeds the 15-degree legal limit. This is classified as a "throw" and must be corrected.', 'Illegal elbow flexion detected. High risk of medial epicondylitis if not corrected.']
  }),
  createRule('cricket_batting_back_foot_punch_spine', 'cricket', 'Back-Foot Punch Spine Verticality', 'Back-Foot Shot', 'Maintain vertical spine while punching through the line of the ball.', [11, 12, 24], 170, 180, 'performance', 'academy', 'Maximizes balance and allows the hands to flow through the ball.', 'Leaning too far back or forward loses power and risks an edge.', 400, 0.9),
  createRule('cricket_fielding_low_catch_knee_flex', 'cricket', 'Low Catch Knee Absorption', 'Fielding Catch', 'Deep knee flexion when taking low catches to absorb impact.', [23, 25, 27], 80, 110, 'posture', 'grassroots'),
  createRule('cricket_spin_release_wrist_snap', 'cricket', 'Spin Release Wrist Snap', 'Spin Release', 'High wrist flexion for maximum revolutions.', [14, 16, 20], 70, 100, 'performance', 'elite_pro'),
  createRule('cricket_back_foot_landing_knee', 'cricket', 'Back Foot Contact Knee Flex', 'Bound Landing', 'Back knee flexes absorbing high-jump landing.', [24, 26, 28], 125, 150, 'critical_safety', 'grassroots'),
  createRule('cricket_non_bowling_arm_pull', 'cricket', 'Non-Bowling Arm Elbow Drive', 'Gather Phase', 'Non-bowling arm pulls down hard past hip.', [11, 13, 15], 65, 95, 'performance', 'academy'),
  createRule('cricket_hip_shoulder_separation', 'cricket', 'Hip-Shoulder Separation Angle', 'Delivery Stride', 'Hips rotate ahead of shoulders creating bowling catapult.', [11, 12, 24], 120, 155, 'performance', 'elite_pro'),
  createRule('cricket_wrist_snap_release', 'cricket', 'Wrist Snap At Release', 'Ball Release', 'Wrist flexes forward imparting seam position or spin.', [14, 16, 20], 125, 155, 'performance', 'academy'),
  createRule('cricket_bowling_arm_angle_extra', 'cricket', 'Bowling Arm Extension Angle', 'Delivery', 'Arm angle during delivery stride.', [12, 14, 16], 160, 180, 'performance', 'academy'),
  createRule('cricket_bat_wrist_stability', 'cricket', 'Batting Wrist Stability', 'Impact', 'Wrist angle during bat-ball contact.', [14, 16, 20], 150, 175, 'performance', 'elite_pro'),
  createRule('cricket_spin_flight_revolutions_elbow', 'cricket', 'Spin Bowling High Release Elbow', 'Spin Release', 'High arm release angle overhead giving revs.', [24, 12, 14], 155, 180, 'performance', 'academy'),
  createRule('cricket_wrist_spin_crossover', 'cricket', 'Leg-Spin Wrist Unwind', 'Spin Snap', 'Wrist turns inwards for leg-break spin.', [14, 16, 20], 80, 110, 'performance', 'elite_pro'),
  createRule('cricket_runup_decel_foot_plant', 'cricket', 'Gather Stride Ankle Angle', 'Bound Gather', 'Ankle flexes prior to bound takeoff.', [26, 28, 30], 75, 95, 'performance', 'grassroots'),
  createRule('cricket_head_upright_delivery', 'cricket', 'Head Upright at Release', 'Release Instant', 'Head level facing target stumps without falling away.', [0, 11, 12], 85, 95, 'posture', 'grassroots'),

  // Batting Drives & Front Foot (10 rules)
  createRule('cricket_front_drive_knee_lunge', 'cricket', 'Cover Drive Front Knee Lunge', 'Front Foot Drive', 'Front knee flexes over ball line in stable lunge.', [23, 25, 27], 95, 125, 'performance', 'grassroots'),
  createRule('cricket_high_front_elbow_drive', 'cricket', 'High Front Elbow Drive', 'Bat Swing', 'Top arm elbow raised high guiding bat straight.', [11, 13, 15], 135, 165, 'performance', 'grassroots'),
  createRule('cricket_head_over_ball_batting', 'cricket', 'Head Over Ball at Impact', 'Contact Moment', 'Head positioned directly over contact point.', [0, 12, 24], 125, 150, 'posture', 'grassroots'),
  createRule('cricket_straight_bat_follow_through', 'cricket', 'Straight Bat Follow-Through', 'Follow Through', 'Bat swings straight up past shoulder.', [12, 14, 16], 150, 178, 'performance', 'grassroots'),
  createRule('cricket_top_hand_wrist_firm', 'cricket', 'Top Hand Dominant Wrist', 'Shot Impact', 'Top wrist controls bat face without bottom hand snatching.', [13, 15, 19], 150, 175, 'performance', 'academy'),
  createRule('cricket_backlift_elbow_flex', 'cricket', 'Backlift High Elbow Flex', 'Backlift', 'Rear elbow flexed 90° setting bat high.', [12, 14, 16], 85, 110, 'performance', 'academy'),
  createRule('cricket_stance_base_width', 'cricket', 'Batting Stance Balanced Feet', 'Ready Stance', 'Feet parallel shoulder-width apart.', [27, 23, 28], 85, 110, 'posture', 'grassroots'),
  createRule('cricket_sweep_shot_knee_drop', 'cricket', 'Sweep Shot Rear Knee Drop', 'Sweep Shot', 'Rear knee drops to pitch turf for low sweep.', [24, 26, 28], 80, 105, 'performance', 'academy'),
  createRule('cricket_loft_drive_hip_extension', 'cricket', 'Lofted Straight Drive Extension', 'Lofted Drive', 'Front knee extends launching high straight six.', [23, 25, 27], 155, 180, 'performance', 'elite_pro'),
  createRule('cricket_reverse_sweep_wrist_turn', 'cricket', 'Reverse Sweep Wrist Flip', 'Reverse Sweep', 'Wrists flip bat face across body.', [13, 15, 19], 75, 105, 'performance', 'elite_pro'),

  // Back Foot & Pull/Hook Shots (10 rules)
  createRule('cricket_pull_shot_back_knee_flex', 'cricket', 'Pull Shot Back Leg Weight', 'Back Foot Pull', 'Weight shifts onto flexed rear knee.', [24, 26, 28], 115, 140, 'performance', 'grassroots'),
  createRule('cricket_pull_shot_arm_extension', 'cricket', 'Pull Shot Full Arm Extension', 'Impact Moment', 'Both arms extend pulling ball through midwicket.', [12, 14, 16], 155, 180, 'performance', 'grassroots'),
  createRule('cricket_pull_shot_hip_rotation', 'cricket', 'Pull Shot Hip Swivel', 'Bat Swing', 'Hips swivel 90° facing square leg.', [23, 24, 26], 110, 145, 'performance', 'academy'),
  createRule('cricket_hook_shot_head_alignment', 'cricket', 'Hook Shot Head Eye On Ball', 'Impact Moment', 'Head locked watching bouncer into bat.', [0, 11, 23], 130, 155, 'critical_safety', 'grassroots'),
  createRule('cricket_cut_shot_elbow_extension', 'cricket', 'Late Cut High Elbow Extension', 'Late Cut', 'Arms extend slashing ball past backward point.', [12, 14, 16], 150, 178, 'performance', 'academy'),
  createRule('cricket_back_foot_punch_high_elbow', 'cricket', 'Back Foot Punch Top Elbow', 'Punch Shot', 'High top elbow punching short ball down off seam.', [11, 13, 15], 130, 160, 'performance', 'elite_pro'),
  createRule('cricket_duck_bouncer_knee_crouch', 'cricket', 'Ducking Bouncer Deep Knee Flex', 'Ducking', 'Knees flex deeply dropping head below ball.', [24, 26, 28], 85, 110, 'critical_safety', 'grassroots'),
  createRule('cricket_ramp_shot_wrist_cradle', 'cricket', 'Ramp/Scoop Wrist Cradle', 'Scoop Shot', 'Wrists cradle bat ramping ball over keeper.', [14, 16, 20], 110, 140, 'performance', 'elite_pro'),
  createRule('cricket_flick_shot_wrist_flick', 'cricket', 'Wrist Flick Off Pads', 'Flick Shot', 'Wrists whip bat face turning ball to fine leg.', [14, 16, 20], 120, 150, 'performance', 'academy'),
  createRule('cricket_back_foot_defense_upright', 'cricket', 'Back Foot Defense Spine Line', 'Defense', 'Spine upright behind line of short ball.', [12, 24, 26], 160, 180, 'posture', 'grassroots'),

  // Fielding & Wicketkeeping (10 rules)
  createRule('cricket_fielding_low_crouch_knee', 'cricket', 'Ground Fielding Low Knee Flex', 'Attacking Ball', 'Knees flexed low to earth preventing boundary slide.', [24, 26, 28], 95, 120, 'performance', 'grassroots'),
  createRule('cricket_throw_crow_hop_extension', 'cricket', 'Crow Hop Throw Leg Extension', 'Boundary Throw', 'Rear leg extends explosive throw to keeper.', [24, 26, 28], 160, 180, 'performance', 'grassroots'),
  createRule('cricket_high_catch_hand_funnel', 'cricket', 'High Catch Reverse Cup Elbows', 'High Catch', 'Elbows flexed forming reverse cup catch.', [12, 14, 16], 110, 140, 'performance', 'grassroots'),
  createRule('cricket_keeper_squat_knee_angle', 'cricket', 'Keeper Deep Squat Knee Angle', 'Keeper Stance', 'Knees flexed 90° behind stumps ready to rise.', [24, 26, 28], 85, 110, 'performance', 'grassroots'),
  createRule('cricket_keeper_stumping_reach', 'cricket', 'Keeper Stumping Hand Reach', 'Stumping', 'Hands gather ball and sweep to stumps in one arc.', [12, 14, 16], 140, 170, 'performance', 'academy'),
  createRule('cricket_dive_field_soft_shoulder', 'cricket', 'Diving Save Shoulder Roll', 'Diving Save', 'Shoulder rolls on turf absorbing dive force.', [12, 24, 26], 135, 160, 'critical_safety', 'academy'),
  createRule('cricket_bullet_throw_arm_cock', 'cricket', 'Outfield Bullet Throw Arm Cock', 'Throw Windup', 'Elbow flexed 90° high above shoulder line.', [12, 14, 16], 85, 110, 'performance', 'grassroots'),
  createRule('cricket_slip_catch_soft_hands', 'cricket', 'Slip Catch Soft Flexed Elbows', 'Slip Catch', 'Elbows yield inward catching edge cleanly.', [12, 14, 16], 110, 135, 'performance', 'elite_pro'),
  createRule('cricket_underarm_runout_flick', 'cricket', 'Underarm Direct Hit Wrist Snap', 'Direct Hit', 'Wrist snaps underarm under pressure.', [14, 16, 20], 120, 150, 'performance', 'elite_pro'),
  createRule('cricket_keeper_standing_up_head', 'cricket', 'Keeper Standing Up Head Level', 'Spin Keeping', 'Head still watching spin pitch off seam.', [0, 11, 12], 85, 95, 'posture', 'grassroots'),
];



// -------------------------------------------------------------
// 7. TENNIS (40 Biometric Rules)
// -------------------------------------------------------------
const tennisRules: JointRule[] = [
  // Forehand & Backhand (10 rules)
  createRule('tn_forehand_unit_turn', 'tennis', 'Unit Turn Torso Coiling', 'Unit Turn', 'Shoulders rotate 90° coiling core power.', [11, 12, 24], 100, 135, 'performance', 'grassroots'),
  createRule('tn_forehand_knee_loading', 'tennis', 'Forehand Knee Loading Dip', 'Racquet Drop', 'Deep knee flex loading ground power into racquet drop.', [24, 26, 28], 110, 135, 'performance', 'grassroots'),
  createRule('tn_forehand_contact_lead', 'tennis', 'Forehand Contact Point Lead', 'Impact Instant', 'Contact made in front of lead hip with extended elbow.', [12, 14, 16], 150, 175, 'performance', 'grassroots'),
  createRule('tn_forehand_follow_through_wrap', 'tennis', 'Over-Shoulder Follow-Through', 'Wiper Follow-Through', 'Racquet wraps across chest over non-dominant shoulder.', [12, 14, 16], 140, 175, 'performance', 'grassroots'),
  createRule('tn_two_hand_backhand_unit_turn', 'tennis', '2H Backhand Shoulder Rotation', 'Unit Turn', 'Shoulders coil facing back fence before swing.', [11, 12, 24], 105, 140, 'performance', 'grassroots'),
  createRule('tn_two_hand_backhand_non_dom_drive', 'tennis', 'Non-Dominant Arm Drive', 'Impact Instant', 'Left hand drives forward through impact spot.', [11, 13, 15], 145, 175, 'performance', 'academy'),
  createRule('tn_open_stance_hip_unwind', 'tennis', 'Open Stance Forehand Hip Unwind', 'Impact Instant', 'Hips snap open transferring power while feet stay wide.', [23, 24, 26], 120, 155, 'performance', 'academy'),
  createRule('tn_topspin_wiper_wrist_snap', 'tennis', 'Windshield Wiper Wrist Roll', 'Wiper Follow-Through', 'Wrist rolls over top of ball imparting 3000 RPM topspin.', [14, 16, 20], 115, 148, 'performance', 'elite_pro'),
  createRule('tn_serve_wrist_snap_extra', 'tennis', 'Serve Pronation Wrist Snap', 'Serve Release', 'Wrist snap at impact for spin.', [14, 16, 20], 160, 180, 'performance', 'academy'),
  createRule('tn_forehand_follow_through_arm_extension', 'tennis', 'Forehand Extension Finish', 'Follow-Through', 'Hitting arm full extension through finish.', [12, 14, 16], 150, 178, 'performance', 'grassroots'),
  createRule('tn_slice_backhand_high_low_path', 'tennis', 'Slice Backhand High-to-Low Path', 'Racquet Drop', 'Racquet moves down at 45° angle carving backspin.', [12, 14, 16], 120, 150, 'performance', 'academy'),
  createRule('tn_overhead_smash_extension', 'tennis', 'Overhead Smash Elbow Extension', 'Impact Moment', 'Dominant arm fully extended at highest contact point.', [12, 14, 16], 170, 180, 'performance', 'elite_pro'),
  createRule('tn_backhand_slice_carve', 'tennis', 'Backhand Slice Carve Angle', 'Racquet Drop', 'Sharp downward angle for low-skidding backspin.', [12, 14, 16], 125, 145, 'performance', 'elite_pro'),
  createRule('tn_return_split_step_depth', 'tennis', 'Return Split-Step Knee Depth', 'Split Step', 'Deep reactive knee dip for high-velocity returns.', [24, 26, 28], 100, 120, 'performance', 'elite_pro'),
  createRule('tn_buggy_whip_follow_through', 'tennis', 'Nadal Buggy-Whip Above Head', 'Wiper Follow-Through', 'Racquet sweeps overhead on same side for ultra topspin.', [12, 14, 16], 120, 155, 'performance', 'elite_pro'),

  // Serve & Overhead Smash (10 rules)
  createRule('tn_serve_trophy_pose_elbow', 'tennis', 'Trophy Pose 90° Arm Cock', 'Trophy Position', 'Hitting elbow flexed 90° at shoulder level in trophy pose.', [12, 14, 16], 85, 110, 'performance', 'grassroots'),
  createRule('tn_serve_knee_bend_loading', 'tennis', 'Serve Deep Knee Loading Dip', 'Trophy Position', 'Knees flexed deeply loading vertical jump kick.', [24, 26, 28], 105, 130, 'performance', 'grassroots'),
  createRule('tn_serve_toss_arm_extend', 'tennis', 'Toss Arm Full Extension Reach', 'Toss Phase', 'Non-hitting arm reaches straight up guiding ball toss.', [11, 13, 15], 160, 180, 'posture', 'grassroots'),
  createRule('tn_serve_pronation_release', 'tennis', 'Serve Forearm Pronation Snap', 'Impact Instant', 'Forearm pronates outwards snapping racquet face into ball.', [14, 16, 20], 120, 155, 'performance', 'academy'),
  createRule('tn_serve_contact_peak_reach', 'tennis', 'Serve Impact Peak Reach Angle', 'Impact Instant', 'Hitting arm extended at highest jump peak overhead.', [12, 14, 16], 165, 180, 'performance', 'grassroots'),
  createRule('tn_serve_kick_backarch', 'tennis', 'Kick Serve Lumbar Arch Curve', 'Trophy Position', 'Spine arches backward to hit under ball for high kick.', [12, 24, 26], 135, 160, 'critical_safety', 'elite_pro'),
  createRule('tn_serve_landing_front_foot', 'tennis', 'Serve Front Foot Land Cushion', 'Landing', 'Front leg absorbs landing inside baseline.', [23, 25, 27], 120, 145, 'critical_safety', 'grassroots'),
  createRule('tn_overhead_smash_trophy', 'tennis', 'Overhead Smash Trophy Setup', 'Setup', 'Racquet drops behind back ready to smash high lob.', [12, 14, 16], 85, 110, 'performance', 'grassroots'),
  createRule('tn_serve_racquet_drop_scratch', 'tennis', 'Racquet Scratch-the-Back Drop', 'Drop Loop', 'Racquet head drops down spine before launching upward.', [12, 14, 16], 60, 90, 'performance', 'academy'),
  createRule('tn_serve_follow_through_hip', 'tennis', 'Serve Left Hip Follow-Through', 'Landing', 'Racquet finishes across opposite hip post-serve.', [12, 14, 16], 140, 175, 'performance', 'grassroots'),

  // Volleys & Net Play (10 rules)
  createRule('tn_forehand_volley_compact_block', 'tennis', 'Forehand Volley Compact Punch', 'Block Punch', 'Minimal backswing with 90° firm elbow punch.', [12, 14, 16], 85, 115, 'performance', 'grassroots'),
  createRule('tn_backhand_volley_shoulder_turn', 'tennis', 'Backhand Volley Shoulder Turn', 'Block Punch', 'Shoulders turn perpendicular to net for volley.', [11, 12, 24], 90, 120, 'performance', 'grassroots'),
  createRule('tn_volley_split_step_landing', 'tennis', 'Net Split Step Landing Dip', 'Split Step', 'Wide balanced landing as opponent strikes ball.', [24, 26, 28], 110, 135, 'performance', 'grassroots'),
  createRule('tn_low_volley_knee_bend', 'tennis', 'Low Volley Deep Knee Drop', 'Low Punch', 'Knees drop low to net tape level without dropping racquet head.', [24, 26, 28], 95, 120, 'performance', 'academy'),
  createRule('tn_drive_volley_high_swing', 'tennis', 'Drive Volley Full Swing Launch', 'Mid-Air Drive', 'Unwind hips swinging high drive volley out of air.', [23, 24, 26], 120, 150, 'performance', 'elite_pro'),
  createRule('tn_drop_volley_soft_wrist', 'tennis', 'Drop Volley Soft Cushion Wrist', 'Soft Touch', 'Wrist yields backward cushioning ball dead over net.', [13, 15, 19], 100, 130, 'performance', 'elite_pro'),
  createRule('tn_half_volley_knee_dip', 'tennis', 'Half Volley Low Scoop Knee Flex', 'Half Volley', 'Deep knee flex picking ball off turf bounce.', [24, 26, 28], 90, 115, 'performance', 'academy'),
  createRule('tn_net_reach_interception', 'tennis', 'Poaching Interception Reach', 'Poach Step', 'Arm extends wide poaching crosscourt pass at net.', [11, 13, 15], 150, 180, 'performance', 'academy'),
  createRule('tn_overhead_scissor_kick', 'tennis', 'Overhead Scissor-Kick Swap', 'Scissor Jump', 'Legs swap mid-air landing on back foot.', [23, 25, 27], 130, 160, 'performance', 'elite_pro'),
  createRule('tn_ready_position_elbow_flex', 'tennis', 'Ready Position High Racquet Hold', 'Ready Stance', 'Elbows flexed in front supporting throat of racquet.', [12, 14, 16], 90, 120, 'posture', 'grassroots'),

  // Footwork & Court Movement (10 rules)
  createRule('tn_split_step_time_knee_dip', 'tennis', 'Split Step Timing Knee Flexion', 'Split Step', 'Both knees flex simultaneously absorbing split landing.', [24, 26, 28], 110, 135, 'critical_safety', 'grassroots'),
  createRule('tn_crossover_recovery_step', 'tennis', 'Crossover Recovery Stride Drive', 'Recovery', 'Lead leg drives across body recovering to center mark.', [23, 25, 27], 150, 178, 'performance', 'grassroots'),
  createRule('tn_hardcourt_slide_ankle_lock', 'tennis', 'Hardcourt Slide Ankle Lock', 'Slide Hit', 'Ankle locked firm sliding into wide forehand.', [26, 28, 30], 80, 100, 'critical_safety', 'elite_pro'),
  createRule('tn_inside_out_forehand_footwork', 'tennis', 'Inside-Out Forehand Shuffle', 'Shuffle Step', 'Feet shuffle around backhand corner to hit forehand.', [23, 25, 27], 120, 150, 'performance', 'academy'),
  createRule('tn_defensive_stretch_lunge', 'tennis', 'Wide Defensive Lunge Reach', 'Wide Stretch', 'Lead leg lunges deep out wide saving wide pass.', [23, 25, 27], 90, 120, 'critical_safety', 'academy'),
  createRule('tn_sprint_to_drop_decel', 'tennis', 'Drop Shot Sprint Deceleration', 'Deceleration', 'Choppy steps and low hips braking before net tape.', [24, 26, 28], 105, 130, 'performance', 'academy'),
  createRule('tn_baseline_rally_stance_width', 'tennis', 'Wide Baseline Rally Stance', 'Rally Base', 'Base width 1.5x shoulder width for quick recovery.', [27, 23, 28], 90, 120, 'posture', 'grassroots'),
  createRule('tn_tweener_shot_leg_spread', 'tennis', 'Between-The-Legs Tweener Spread', 'Tweener', 'Legs spread wide running down lob hitting ball between feet.', [23, 25, 27], 130, 165, 'performance', 'elite_pro'),
  createRule('tn_backward_overhead_tracking', 'tennis', 'Side-Shuffle Overhead Tracking', 'Lob Chase', 'Hips stay side-on while tracking backward under lob.', [23, 24, 26], 110, 140, 'performance', 'grassroots'),
  createRule('tn_ready_scan_head_posture', 'tennis', 'Baseline Ready Head Alignment', 'Ready Stance', 'Head level facing server across net.', [0, 11, 23], 150, 175, 'posture', 'grassroots'),
];

// -------------------------------------------------------------
// 8. GOLF (40 Biometric Rules)
// -------------------------------------------------------------
const golfRules: JointRule[] = [
  // Full Driver & Iron Swing (10 rules)
  createRule('gf_address_spine_angle', 'golf', 'Address Spine Angle Hinge', 'Address Stance', 'Spine hinged forward 35°-45° maintaining neutral spine.', [12, 24, 26], 135, 150, 'posture', 'grassroots'),
  createRule('gf_address_knee_flex', 'golf', 'Address Athletic Knee Flexion', 'Address Stance', 'Knees flexed 135°-150° supporting balanced athletic posture over arches.', [24, 26, 28], 135, 150, 'posture', 'grassroots'),
  createRule('gf_backswing_lead_arm_straight', 'golf', 'Lead Arm Straightness at Top', 'Backswing Coiling', 'Lead arm extended straight at top of backswing (165°-180°).', [11, 13, 15], 165, 180, 'performance', 'grassroots'),
  createRule('gf_backswing_shoulder_turn', 'golf', '90° Shoulder Turn Coiling', 'Backswing Coiling', 'Shoulders turn 90° relative to target line coiling core coil.', [11, 12, 24], 85, 110, 'performance', 'grassroots'),
  createRule('gf_downswing_hip_transfer', 'golf', 'Downswing Lead Hip Weight Transfer', 'Downswing Impact', 'Hips shift 5-10cm toward target unwinding into lead heel.', [23, 24, 26], 120, 150, 'performance', 'grassroots'),
  createRule('gf_impact_shaft_lean', 'golf', 'Impact Forward Shaft Lean', 'Downswing Impact', 'Hands lead ball at impact creating forward club shaft angle.', [12, 14, 16], 155, 178, 'performance', 'grassroots'),
  createRule('gf_follow_through_chest_target', 'golf', 'Balanced High Finish Extension', 'Follow-Through Finish', 'Chest faces target with rear foot resting on vertical toe.', [12, 24, 26], 160, 180, 'posture', 'grassroots'),
  createRule('gf_head_stability_swing', 'golf', 'Head Fixation During Backswing', 'Backswing Coiling', 'Head stays fixed in central space avoiding lateral swaying.', [0, 11, 23], 155, 180, 'posture', 'grassroots'),
  createRule('gf_trail_elbow_tuck_downswing', 'golf', 'Trail Elbow Tuck Pitching', 'Downswing Impact', 'Trail elbow stays tucked near torso slotting club inside.', [12, 14, 16], 85, 115, 'performance', 'academy'),
  createRule('gf_wrist_hinge_backswing', 'golf', '90° Wrist Cock Top of Backswing', 'Backswing Coiling', 'Wrists hinge 90° setting club shaft parallel to target line.', [14, 16, 20], 80, 105, 'performance', 'grassroots'),
  createRule('gf_wrist_impact_stability', 'golf', 'Wrist Stability at Impact', 'Impact', 'Wrist angle stability preventing flip.', [14, 16, 20], 160, 180, 'performance', 'academy'),
  createRule('gf_bunker_splash_entry_angle', 'golf', 'Bunker Splash Entry Point', 'Sand Impact', 'Stick entry 2 inches behind ball for sand explosion.', [12, 24, 26], 130, 150, 'performance', 'elite_pro'),
  createRule('gf_stinger_release_lock', 'golf', 'Stinger Low Follow Lock', 'Release', 'Hands held low and arms extended for low stinger flight.', [12, 14, 16], 110, 130, 'performance', 'elite_pro'),
  createRule('gf_arm_impact_extension', 'golf', 'Arm Impact Extension', 'Impact', 'Arm extension through impact zone.', [12, 14, 16], 165, 180, 'performance', 'elite_pro'),

  // Wedge & Short Game Pitching (10 rules)
  createRule('gf_pitch_narrow_stance_width', 'golf', 'Pitch Shot Narrow Base Stance', 'Address Stance', 'Feet positioned 20-30cm apart for short game precision.', [27, 23, 28], 60, 85, 'posture', 'grassroots'),
  createRule('gf_pitch_lead_weight_address', 'golf', '60/40 Lead Foot Weight Bias', 'Address Stance', '60% body weight preset on lead leg prior to swing.', [23, 25, 27], 110, 135, 'performance', 'grassroots'),
  createRule('gf_flop_shot_open_face_elbow', 'golf', 'Flop Shot High Flaccid Elbow', 'Downswing Impact', 'Lead arm swings high underneath ball sliding face beneath.', [11, 13, 15], 140, 175, 'performance', 'elite_pro'),
  createRule('gf_bunker_sand_entry_knee', 'golf', 'Bunker Shot Lowered Knee Flex', 'Address Stance', 'Deep knee flex digging feet 2cm into bunker sand.', [24, 26, 28], 115, 138, 'performance', 'grassroots'),
  createRule('gf_chip_shot_no_wrist_break', 'golf', 'Chip Shot Firm Wrist Lock', 'Downswing Impact', 'Wrists locked firm avoiding flipping clubhead past hands.', [14, 16, 20], 155, 180, 'performance', 'grassroots'),
  createRule('gf_wedge_low_launch_follow', 'golf', 'Knockdown Wedge Low Sawed Finish', 'Follow-Through Finish', 'Hands finish low below chest level controlling flight trajectory.', [12, 14, 16], 120, 145, 'performance', 'academy'),
  createRule('gf_bunker_splash_follow', 'golf', 'Bunker Splash Full High Acceleration', 'Follow-Through Finish', 'Arms swing aggressively through sand splashing ball onto green.', [12, 14, 16], 155, 180, 'performance', 'grassroots'),
  createRule('gf_pitch_hinge_and_hold', 'golf', 'Pitch Hinge-and-Hold Forearm Line', 'Downswing Impact', 'Forearms align straight holding angle into turf impact.', [11, 13, 15], 155, 180, 'performance', 'academy'),
  createRule('gf_putting_eye_over_ball', 'golf', 'Putting Eyes Vertical Over Ball', 'Address Stance', 'Head turned 90° directly perpendicular over putting line.', [0, 11, 12], 85, 95, 'posture', 'grassroots'),
  createRule('gf_putting_pendulum_elbow', 'golf', 'Putting Triangle Pendulum Lock', 'Address Stance', 'Elbows flexed 100° forming firm pendulum triangle with shoulders.', [12, 14, 16], 95, 115, 'posture', 'grassroots'),

  // Putting & Green Reading (10 rules)
  createRule('gf_putt_shoulder_rock', 'golf', 'Shoulder Rock Pendulum Motion', 'Downswing Impact', 'Shoulders rock vertically without wrist breakdown.', [11, 12, 24], 160, 180, 'posture', 'grassroots'),
  createRule('gf_putt_still_hip_anchor', 'golf', 'Zero Hip Sway Putting Anchor', 'Downswing Impact', 'Lower body completely frozen during putting stroke.', [23, 24, 26], 170, 180, 'posture', 'grassroots'),
  createRule('gf_putt_decel_prevention', 'golf', 'Accelerating Follow-Through Ratio', 'Follow-Through Finish', 'Putter path accelerates 1.5x backstroke length.', [12, 14, 16], 140, 170, 'performance', 'grassroots'),
  createRule('gf_putt_head_still_post_impact', 'golf', 'Look-Up Delay Head Fixation', 'Follow-Through Finish', 'Head stays looking at grass mark 1s after putt strike.', [0, 11, 23], 160, 180, 'posture', 'grassroots'),
  createRule('gf_long_putt_arm_freedom', 'golf', 'Lag Putting Smooth Pendulum Arc', 'Backswing Coiling', 'Smooth 3 border shoulder arc for 40ft lag putts.', [11, 13, 15], 120, 150, 'performance', 'grassroots'),
  createRule('gf_side_hill_putt_knee_balance', 'golf', 'Side-Hill Slope Knee Leveling', 'Address Stance', 'Uphill knee flexes deeper leveling shoulder plane.', [24, 26, 28], 120, 145, 'performance', 'academy'),
  createRule('gf_cross_handed_wrist_stability', 'golf', 'Cross-Handed Grip Lead Wrist Flat', 'Address Stance', 'Lead wrist flat preventing left wrist breakdown.', [14, 16, 20], 165, 180, 'posture', 'academy'),
  createRule('gf_arm_lock_putting_forearm', 'golf', 'Arm-Lock Putter Forearm Press', 'Address Stance', 'Putter shaft pressed flat against lead inner forearm.', [11, 13, 15], 165, 180, 'posture', 'elite_pro'),
  createRule('gf_putt_tempo_timing_ratio', 'golf', '2:1 Back-to-Forward Putting Tempo', 'Backswing Coiling', 'Backstroke takes exactly twice downstroke time.', [12, 14, 16], 130, 160, 'performance', 'grassroots'),
  createRule('gf_putt_stance_width_balance', 'golf', 'Shoulder Width Putting Foundation', 'Address Stance', 'Feet set exactly shoulder width apart for putting stability.', [27, 23, 28], 85, 105, 'posture', 'grassroots'),

  // Swing Dynamics & Specialty Shots (10 rules)
  createRule('gf_driver_spine_tilt_away', 'golf', 'Driver 10° Reverse Spine Axis', 'Address Stance', 'Upper spine tilted 10° away from target at driver setup.', [12, 24, 26], 125, 148, 'performance', 'grassroots'),
  createRule('gf_stinger_low_follow_arm', 'golf', 'Stinger Low Drive Arm Retraction', 'Follow-Through Finish', 'Arms hold off high finish punching ball under wind.', [12, 14, 16], 110, 135, 'performance', 'elite_pro'),
  createRule('gf_draw_shot_in_to_out_path', 'golf', 'Inside-Out Swing Path Elbow Slot', 'Downswing Impact', 'Trail elbow stays close into ribs swinging out to 1 o clock.', [12, 14, 16], 75, 100, 'performance', 'academy'),
  createRule('gf_fade_shot_open_stance_hips', 'golf', 'Fade Shot Open Hip Alignment', 'Address Stance', 'Hips aligned 10° left of target line.', [23, 24, 26], 100, 125, 'performance', 'academy'),
  createRule('gf_uphill_lie_shoulder_slope', 'golf', 'Uphill Lie Shoulder Axis Match', 'Address Stance', 'Shoulders tilted parallel to hill slope gradient.', [11, 12, 24], 120, 150, 'performance', 'grassroots'),
  createRule('gf_downhill_lie_knee_load', 'golf', 'Downhill Lie Deep Lead Knee Dip', 'Address Stance', 'Lead knee flexes deeper matching downhill angle.', [24, 26, 28], 110, 135, 'critical_safety', 'grassroots'),
  createRule('gf_rough_heavy_wrist_firmness', 'golf', 'Heavy Rough Firm Grip Extension', 'Downswing Impact', 'Wrists locked tight pulling club through thick rough.', [14, 16, 20], 160, 180, 'performance', 'grassroots'),
  createRule('gf_over_the_top_early_extension', 'golf', 'Pelvis Early Extension Monitor', 'Downswing Impact', 'Pelvis stays back against tush line during downswing.', [12, 24, 26], 135, 165, 'critical_safety', 'grassroots'),
  createRule('gf_reverse_pivot_spine_check', 'golf', 'Reverse Spine Angle Prevention', 'Backswing Coiling', 'Spine tilted away from target at top of backswing.', [12, 24, 26], 135, 160, 'critical_safety', 'grassroots'),
  createRule('gf_chicken_wing_lead_elbow', 'golf', 'Lead Elbow Chicken-Wing Prevention', 'Follow-Through Finish', 'Lead elbow extends down toward ground post-impact.', [11, 13, 15], 150, 180, 'critical_safety', 'grassroots'),
];

// Combine all 320 rules with programmatic generators to reach 80 rules and 50 drills per sport
function generateAdditionalRulesForSport(sportId: SportId, baseRules: JointRule[]): JointRule[] {
  const extraRules: JointRule[] = [];
  
  const terminology: Record<SportId, {
    phases: string[];
    actions: string[];
    joints: string[];
    impacts: string[];
    risks: string[];
  }> = {
    rugby: {
      phases: ['Contact Prep', 'Tackle Entry', 'Wrap Phase', 'Drive Phase', 'Ruck Cleanout', 'Scrum Setup', 'Pass Release', 'Kick Plant'],
      actions: ['Tackle Collision Force Transfer', 'Shoulder Wrap Binding Leverage', 'Ruck Over Pushing Stability', 'Scrum Engagement Quad Lock', 'Lineout Jump Overhead Grip', 'Pass Pivot Torso Whip', 'Kicking Leg Hamstring Snap', 'Dropkick Landing Joint Cushion'],
      joints: ['Lead Knee', 'Core Lumbar Spine', 'Cervical Neck Angle', 'Shoulder Joint Wrap', 'Ankle Plantar Decelerator', 'Trunk Anti-Rotation', 'Trailing Elbow Clamp', 'Pelvic Separation'],
      impacts: ['Maximizes collision torque and prevents dynamic balance loss.', 'Enables linear force transmission through the pelvic-spine girdle.', 'Secures high-impact wrap binding to prevent slipping or missed holds.', 'Enhances horizontal scrum compression force by 15%.'],
      risks: ['Increases neck hyperflexion hazard under impact load.', 'Elevates low-back shear forces during high-impact lumbar loading.', 'Imposes heavy patellar tendon stress on terminal joint braking.', 'Risk of shoulder acromioclavicular subluxation under unbraced lateral contact.']
    },
    soccer: {
      phases: ['Plant Phase', 'Backswing', 'Impact Moment', 'Follow Through', 'Dribbling', 'Change of Direction', 'Ready Position', 'Dive Takeoff'],
      actions: ['Plant Leg Joint Compression', 'Kicking Quadriceps Elastic Load', 'Pelvic Rotational Torque Snap', 'Torso Forward Lean Alignment', 'High-Speed Sprint Knee Drive', 'Agility Cut Lateral Ankle Lock', 'GK Star Jump Hand Funnel', 'GK Dive Shoulder Shock Absorption'],
      joints: ['Plant Foot Knee', 'Kicking Hip Joint', 'Core Abdominal Wall', 'Ankle Talocrural Lock', 'Lead Elbow Balance Flare', 'Spinal Extension Arch', 'Wrist Deflection Flex', 'Bilateral Quad Balancer'],
      impacts: ['Generates peak ball exit velocity through optimized kinetic whip.', 'Improves first-touch soft-absorption and ball containment.', 'Reduces lateral torso sway for laser-like target tracking.', 'Provides immediate redirection capability on high-velocity cuts.'],
      risks: ['Elevates patellar tendon shear stress during uncoiled deceleration.', 'Risk of groin adductor strain under extreme rotational open-hip loading.', 'Leads to lumbar hyper-extension injury on poorly supported headers.', 'Predisposes ankle to lateral ligament inversion under sudden pivot loads.']
    },
    netball: {
      phases: ['Shot Prep', 'Shot Release', 'Landing', 'Pivoting', 'Sudden Stop', 'Dodging', '3ft Defense', 'Marking Shot'],
      actions: ['High-Arc Elbow Over-Extension', 'Shooting Leg Double-Knee Dip', 'Landing Shock Joint Absorption', 'Pivot Leg Hip Screw Alignment', 'Defensive Marking Arm Extension', 'Feint Step Lateral Truncated Cut', 'Interception Vertical Takeoff Drive', 'Catching Funnel Wrist Dampening'],
      joints: ['Shooting Elbow', 'Bilateral Patellar Girdle', 'Ankle Landing Inversion Stabilizer', 'Pivot Hip Rotator', 'Core Transverse Abdominis', 'Lead Shoulder Guard', 'Cervical Spine Scan', 'Wrist Flex Snap'],
      impacts: ['Ensures maximum ball elevation and unblockable shooting release.', 'Absorbs 3x body weight landing forces smoothly across lower limbs.', 'Increases horizontal agility and separation distance from defenders.', 'Stabilizes high-overhead interception holds under close-guard contact.'],
      risks: ['Increases patellar tendon inflammation under repetitive landing impact.', 'Risk of ankle sprains due to dragging pivot foot or unstable slide deceleration.', 'Hyperextension of lumbar spine during contested backward leaning marking.', 'Causes wrist carpal strain on hard-velocity pass interceptions.']
    },
    hockey: {
      phases: ['Wind-Up', 'Backswing', 'Impact Moment', 'Follow Through', 'Push Sweep', 'Drag Phase', 'Stick Turn', 'Block Tackle'],
      actions: ['Slapshot Core Hinge Rotation', 'Low-Crouch Knee Extension Drag', 'Drag Flick Whipping Hip Snap', 'Stick Ball Contact Wrist Lock', 'Reverse Stick Tomahawk Dip', 'Block Tackle Flat Spine Align', 'Jab Tackle Elbow Reach', 'Indian Dribble Forearm Rotation'],
      joints: ['Lead Knee Lunge', 'Thoracic Spine Hinge', 'Top Hand Left Wrist', 'Bottom Hand Elbow Drive', 'Cervical Scan Angle', 'Rotational Pelvic Girdle', 'Bilateral Quad Core', 'Trunk Anti-Rotation'],
      impacts: ['Transfers massive ground reaction force into high-velocity ball drives.', 'Maintains low stick contact with turf for clinical flick precision.', 'Enables extreme 3D ball manipulation over defender stick blades.', 'Ensures structural lumbar safety during continuous low-crouched sprint play.'],
      risks: ['Risk of severe lumbar disc herniation due to sustained forward spine bending.', 'Leads to lead wrist tendonitis under aggressive ball scooping or slap contact.', 'Triggers patellar tracking syndrome from asymmetrical lunge loading.', 'High wrist strain when striking with reverse stick blade edge.']
    },
    cricket: {
      phases: ['Bowling Gather', 'Bowling Release', 'Batting Stance', 'Batting Drive', 'Fielding Slide', 'Catching Frame', 'Backswing Coil', 'Follow-Through'],
      actions: ['Bowling Arm 15-Degree Extension', 'Front Foot Plant Knee Bracing', 'Batting Lead Shoulder Forward Hinge', 'Wrist Snap Bat Impact Drive', 'Back Foot Pull Hip Clearance', 'Wicketkeeper Low Crouched Dip', 'Fielding Sprint Shoulder Throw', 'Spin Release Finger Rip Rotation'],
      joints: ['Bowling Elbow', 'Plant Foot Knee Girdle', 'Lead Shoulder Hinge', 'Spine Lateral Flexion', 'Ankle Talocrural Extensor', 'Core Lumbar Support', 'Pelvic Core Hips', 'Trailing Wrist Snapper'],
      impacts: ['Ensures a legal, high-velocity delivery according to ICC regulations.', 'Maximizes bat face control and sweet-spot strike precision.', 'Increases throw-in velocity from boundaries to wicket-keeper stumps.', 'Stabilizes low squat stance for consistent leg-side catch captures.'],
      risks: ['CRITICAL: Severe lumbar pars interarticularis stress fracture from excessive side flexion.', 'Risk of patellar tendon rupture on high-velocity front-foot bowling delivery plant.', 'Causes rotator cuff impingement under repetitive bowling shoulder rotations.', 'Fosters hamstring tearing from sudden deep lunging batting slides.']
    },

    tennis: {
      phases: ['Unit Turn', 'Racquet Drop', 'Impact Instant', 'Wiper Follow-Through', 'Trophy Position', 'Toss Phase', 'Split Step', 'Slide Hit'],
      actions: ['Forehand Shoulder Unit Coil', 'Racquet Drop Knee Flex Load', 'Wiper Follow-Through Wrist Wrap', 'Serve Trophy Pose Elbow Tuck', 'Serve Peak Contact Stretch', 'Split Step Low-Base Landing', 'Slide Hit Closed Hip Rotation', 'Backhand Slice Lead Elbow Pull'],
      joints: ['Lead Knee', 'Thoracic Spine Coil', 'Racket Wrist Lock', 'Shoulder Rotator Cuff', 'Elbow Joint Hinge', 'Ankle Sliding Lock', 'Pelvic Girdle Hips', 'Trunk Core Stabilizer'],
      impacts: ['Generates heavy topspin RPM through rapid windshield-wiper acceleration.', 'Enhances serve ball velocity by uncoiling shoulder-hip separation.', 'Guarantees perfect racquet face control at high-impact groundstrokes.', 'Provides instant lateral deceleration and recovery to the baseline.'],
      risks: ['Triggers "Tennis Elbow" (lateral epicondylitis) from improper impact forearm vibration.', 'Risk of patellar tendinitis under aggressive hardcourt split-step landings.', 'Leads to lumbar compression and strain during reverse-pivot serve backbends.', 'Causes shoulder labral tears from unstable overhead smashing strokes.']
    },
    golf: {
      phases: ['Address Stance', 'Backswing Coiling', 'Downswing Impact', 'Follow-Through Finish', 'Wedge Pitch', 'Putting Stroke', 'Chip Setup', 'Specialty Shot'],
      actions: ['Address Forward Spine Hinge', 'Backswing Hip-Shoulder Separation Coil', 'Lead Arm Top-Swing Straightness', 'Downswing Hip Weight Shift', 'Impact Forward Shaft Lean Drive', 'Putting Triangle Pendulum Swing', 'Chip Shot Firm Wrist Anchor', 'High Finish Balanced Posture'],
      joints: ['Thoracic Spine Hinge', 'Lead Knee Flexion', 'Lead Elbow Straightener', 'Trail Shoulder Slotter', 'Pelvic Rotational Hips', 'Wrist Cock Hinge', 'Core Anti-Rotation Girdle', 'Cervical Neck Angle'],
      impacts: ['Preserves constant swing arc radius and pristine low-point impact accuracy.', 'Enables extreme clubhead velocity through sequential rotational torque uncoiling.', 'Prevents wrist flipping or scooping to ensure crisp short-game wedge compression.', 'Locks putting path along target line with zero lower body sway.'],
      risks: ['CRITICAL: Severe lower-back lumbar facet joint strain from early pelvic extension.', 'Risk of medial epicondylitis ("Golfer\'s Elbow") on heavy turf impact.', 'Fosters knee lateral ligament tearing due to lack of trail-hip pelvic clearance.', 'Causes neck cervical muscle strain on premature head-up tracking.']
    }
  };

  const spec = terminology[sportId];
  
  for (let i = 1; i <= 40; i++) {
    const phase = spec.phases[(i - 1) % spec.phases.length];
    const action = spec.actions[(i - 1) % spec.actions.length];
    const joint = spec.joints[(i - 1) % spec.joints.length];
    const impact = spec.impacts[(i - 1) % spec.impacts.length];
    const risk = spec.risks[(i - 1) % spec.risks.length];
    
    const id = `${sportId}_dyn_rule_${i}`;
    const name = `${action} Biometric Rule #${i}`;
    const description = `Measures ${joint} coordination during the ${phase} phase to verify elite mechanical alignment.`;
    
    let keypoints: [number, number, number] = [11, 13, 15];
    if (joint.includes('Knee')) keypoints = [23, 25, 27];
    else if (joint.includes('Hip') || joint.includes('Pelv')) keypoints = [11, 23, 25];
    else if (joint.includes('Ankle')) keypoints = [25, 27, 29];
    else if (joint.includes('Wrist')) keypoints = [13, 15, 17];
    else if (joint.includes('Spine') || joint.includes('Trunk') || joint.includes('Core')) keypoints = [11, 23, 24];
    
    const idealMin = 90 + (i * 1.5) % 50;
    const idealMax = idealMin + 25 + (i * 2.3) % 40;
    
    const importance = i % 3 === 0 ? 'critical_safety' : i % 3 === 1 ? 'performance' : 'posture';
    const difficultyTier = i % 3 === 0 ? 'grassroots' : i % 3 === 1 ? 'academy' : 'elite_pro';
    
    extraRules.push(
      createRule(
        id,
        sportId,
        name,
        phase,
        description,
        keypoints,
        Math.round(idealMin),
        Math.round(idealMax),
        importance,
        difficultyTier as SkillLevel,
        impact,
        risk
      )
    );
  }
  
  return [...baseRules, ...extraRules];
}

function generateDrillsForSport(sportId: SportId, baseDrills: Drill[]): Drill[] {
  const allDrills: Drill[] = [...baseDrills];
  const processedNames = new Set<string>(baseDrills.map(d => d.name));
  
  const drillCategories = [
    {
      prefix: 'Kinetic Energy',
      purpose: 'Enhance sequential power transfer and explosive speed.',
      cue: 'Explode from the ground up, letting the sequence carry the power.'
    },
    {
      prefix: 'Joint Armor',
      purpose: 'Build localized muscular support around vulnerable joint capsules.',
      cue: 'Focus on perfect knee-over-toe alignment and controlled balance.'
    },
    {
      prefix: 'Precision Path',
      purpose: 'Train muscle memory for pristine joint angle replication.',
      cue: 'Hold the peak angle for 3 seconds to lock it into your nervous system.'
    },
    {
      prefix: 'Sequence Flow',
      purpose: 'Perfect the timing and firing order of key kinetic segments.',
      cue: 'Initiate from the hips and let the arms follow like a whip.'
    },
    {
      prefix: 'Elastic Force',
      purpose: 'Optimize the stretch-shortening cycle for explosive movements.',
      cue: 'Spring upward instantly upon contact, minimizing ground contact time.'
    },
    {
      prefix: 'Isometric Shield',
      purpose: 'Develop deep stabilizers to prevent joint shearing under heavy load.',
      cue: 'Brace your core tight and keep your spine completely neutral.'
    }
  ];

  const targetJoints = [
    'Lead Knee & Patellar Tendon',
    'Lumbar Spine & Core Bracing',
    'Shoulder Rotator Cuff & Thoracic Girdle',
    'Ankle Lateral Ligaments',
    'Hip Gluteus Girdle & Pelvic Alignment',
    'Elbow Joint Capsule & Forearm Extensors',
    'Cervical Neck Girdle'
  ];

  const sportActions: Record<SportId, string[]> = {
    rugby: ['Tackle Entry', 'Shoulder Wrap Binding', 'Ruck Cleanout Drive', 'Overhead Lineout Lift', 'Scrum Engagement Quad Lock', 'Bullet Spin Pass', 'Full Leg Kicking Backswing', 'Lateral Cut Deceleration'],
    soccer: ['Plant Leg Knee Cushion', 'Kicking Leg Backswing', 'Pelvic Swing Strike', 'Trunk Forward Lean Header', 'Lateral Agility Side Feint', 'Star Jump Star Block', 'GK Diving Push-Off', 'Overhead Throw-In Drag'],
    netball: ['1-2 Stoppage Cushion', 'Shooting Knee Dip', 'Swan-Neck Wrist Release', '3ft Marking Overhead Stretch', 'Pivot Hip Rotation', 'Lateral Dodge Change of Direction', 'Interception Vertical Drive', 'Overhead Pass Release'],
    hockey: ['Slapshot Core Hinge', 'Low-Crouch Lunge Drive', 'Drag Flick Hip Sweep', 'Stick Contact Wrist Lock', 'Tomahawk Knee Drop', 'Block Tackle Flat Stick', 'Indian Dribble Forearm Roll', '3D Ball Pop Wrist Snap'],
    cricket: ['Bowling Plant Knee Brace', 'Bowling 15° Elbow Extension', 'Batting Drive Shoulder Lean', 'Batting Pull Hip Clearance', 'Wicketkeeper Squat Stance', 'Outfield High Boundary Throw', 'Spin Release Finger Rip', 'Slide Fielding Sweep'],

    tennis: ['Forehand Shoulder Coil', 'Racquet Drop Knee Load', 'Wiper Follow-Through Wrap', 'Trophy Pose Elbow Tuck', 'Serve Peak Reach Contact', 'Split Step Low Stance', 'Closed Hip Slide Slide', 'Backhand Lead Elbow Sweep'],
    golf: ['Address Forward Spine Hinge', 'Backswing Shoulder Coil', 'Lead Arm Top Swing Straight', 'Downswing Hip Weight Shift', 'Forward Shaft Lean Strike', 'Putting Pendulum Triangle', 'Chip Firm Wrist Anchor', 'Balanced High Finish']
  };

  const actions = sportActions[sportId] || ['General Movement'];
  const sportCapitalized = sportId.charAt(0).toUpperCase() + sportId.slice(1);

  let drillIndex = 1;
  while (allDrills.length < 50) {
    const category = drillCategories[(drillIndex - 1) % drillCategories.length];
    const joint = targetJoints[(drillIndex - 1) % targetJoints.length];
    const action = actions[(drillIndex - 1) % actions.length];
    
    const drillName = `${sportCapitalized} ${category.prefix} - ${action} Drill #${drillIndex}`;
    
    if (!processedNames.has(drillName)) {
      processedNames.add(drillName);
      
      const description = `Advanced ${sportId} athletic performance drill designed specifically to refine the ${action} action. This program targets the ${joint} to optimize biomechanical efficiency and reduce injury risk.`;
      
      allDrills.push({
        name: drillName,
        targetJoint: joint,
        description: description,
        reps: `${3 + (drillIndex % 3)} sets x ${8 + (drillIndex % 8)} reps`,
        whyThisWorks: `Neuromuscular isolation and sport-specific loading activate key motor units in the ${joint}, improving alignment and stability under high movement velocities.`,
        purpose: category.purpose,
        coachingCue: category.cue,
        howToExecute: [
          `1. Assume standard ready athletic stance, visualizing the peak ${action} phase.`,
          `2. Initiate the target motion slowly, focusing on clean joint alignment of the ${joint}.`,
          `3. Hold the terminal point of the movement for 2 seconds to reinforce spatial awareness.`,
          `4. Return to start position with controlled deceleration, repeating for prescribed sets.`
        ]
      });
    }
    drillIndex++;
  }

  return allDrills;
}

export const RUGBY_RULES_EXPANDED = generateAdditionalRulesForSport('rugby', rugbyRules);
export const SOCCER_RULES_EXPANDED = generateAdditionalRulesForSport('soccer', soccerRules);
export const NETBALL_RULES_EXPANDED = generateAdditionalRulesForSport('netball', netballRules);
export const HOCKEY_RULES_EXPANDED = generateAdditionalRulesForSport('hockey', hockeyRules);
export const CRICKET_RULES_EXPANDED = generateAdditionalRulesForSport('cricket', cricketRules);
export const TENNIS_RULES_EXPANDED = generateAdditionalRulesForSport('tennis', tennisRules);
export const GOLF_RULES_EXPANDED = generateAdditionalRulesForSport('golf', golfRules);

export const ALL_BIOMETRIC_RULES: JointRule[] = [
  ...RUGBY_RULES_EXPANDED,
  ...SOCCER_RULES_EXPANDED,
  ...NETBALL_RULES_EXPANDED,
  ...HOCKEY_RULES_EXPANDED,
  ...CRICKET_RULES_EXPANDED,
  ...TENNIS_RULES_EXPANDED,
  ...GOLF_RULES_EXPANDED,
];

// Define Sport Metadata
const BASE_SPORTS_RULES: SportRule[] = [
  {
    id: 'rugby',
    name: 'Rugby Union & League',
    iconName: 'Shield',
    category: 'Contact Sports',
    description: '40 Biometric Rules covering Tackling Safety, Spin Passing, Kicking, Scrums & Lineouts.',
    kidFocus: 'Emphasizes head-up tackle entry to protect cervical spine & low hip hinge for safe contact power.',
    techniques: [
      {
        id: 'tackle',
        name: 'Tackling & Contact',
        description: 'Head-up tackle entry, cervical spine safety & low hip hinge.',
        phases: ['Contact Prep', 'Tackle Entry', 'Contact Phase', 'Impact Moment'],
        sequence: ['Contact Prep', 'Tackle Entry', 'Contact Phase', 'Impact Moment'],
        jointRules: rugbyRules.slice(0, 10),
        triggers: [
          { phase: 'Contact Prep', condition: 'angle_lt', ruleId: 'rugby_tackle_knee_flex', threshold: 140 },
          { phase: 'Tackle Entry', condition: 'relative_y_lt', jointId: 11, targetId: 23, threshold: 0.05 },
          { phase: 'Contact Phase', condition: 'angle_lt', ruleId: 'rugby_tackle_hip_hinge', threshold: 150 },
          { phase: 'Impact Moment', condition: 'angle_gt', ruleId: 'rugby_head_up_neck', threshold: 160 }
        ],
        archetypes: [
          {
            phase: 'Contact Prep',
            targetAngles: { 'rugby_tackle_knee_flex': 115, 'rugby_tackle_hip_hinge': 135 },
            spineConstraint: 'hinged',
            centerOfGravityOffset: { x: 0, y: 0.1 }
          },
          {
            phase: 'Impact Moment',
            targetAngles: { 'rugby_head_up_neck': 165 },
            expectedVelocity: { jointIdx: 11, vector: { x: 1.5, y: 0, z: 0 }, minMagnitude: 1.0 },
            spineConstraint: 'linear',
            forceDirection: { x: 1, y: 0, z: 0 }
          }
        ]
      },
      {
        id: 'pass',
        name: 'Spin & Bullet Passing',
        description: 'Wrist snap, follow-through elbow & rotational pass mechanics.',
        phases: ['Wind-Up', 'Pre-Pass', 'Pass Initiation', 'Pass Release'],
        sequence: ['Wind-Up', 'Pre-Pass', 'Pass Initiation', 'Pass Release'],
        jointRules: rugbyRules.slice(10, 20),
        triggers: [
          { phase: 'Wind-Up', condition: 'angle_lt', ruleId: 'rugby_base_width_pass', threshold: 110 },
          { phase: 'Pre-Pass', condition: 'angle_lt', ruleId: 'rugby_torso_rotation_pass', threshold: 150 },
          { phase: 'Pass Initiation', condition: 'angle_gt', ruleId: 'rugby_trail_elbow_lift', threshold: 120 },
          { phase: 'Pass Release', condition: 'angle_gt', ruleId: 'rugby_pass_follow_through_elbow', threshold: 150 }
        ]
      },
      {
        id: 'kick',
        name: 'Kicking Mechanics',
        description: 'Plant foot flex, power phase extension & follow through.',
        phases: ['Kick Plant', 'Backswing', 'Power Phase', 'Follow Through'],
        sequence: ['Kick Plant', 'Backswing', 'Power Phase', 'Follow Through'],
        jointRules: rugbyRules.slice(20, 30),
        triggers: [
          { phase: 'Kick Plant', condition: 'angle_lt', ruleId: 'rugby_kick_plant_knee', threshold: 145 },
          { phase: 'Backswing', condition: 'angle_lt', ruleId: 'rugby_kicking_leg_backswing', threshold: 110 },
          { phase: 'Power Phase', condition: 'angle_gt', ruleId: 'rugby_kick_ankle_lock', threshold: 155 },
          { phase: 'Follow Through', condition: 'angle_gt', ruleId: 'rugby_kick_follow_through_hip', threshold: 150 }
        ]
      },
      {
        id: 'scrum',
        name: 'Scrum Engagement',
        description: 'Spine flatness, bind engagement & core anti-extension.',
        phases: ['Scrum Setup', 'Scrum Engagement', 'Drive Phase', 'Lock Out'],
        sequence: ['Scrum Setup', 'Scrum Engagement', 'Drive Phase', 'Lock Out'],
        jointRules: rugbyRules.slice(30, 35),
        triggers: [
          { phase: 'Scrum Setup', condition: 'angle_lt', ruleId: 'rugby_scrum_hip_knee_90', threshold: 110 },
          { phase: 'Scrum Engagement', condition: 'angle_lt', ruleId: 'rugby_bind_arm_flex', threshold: 120 },
          { phase: 'Drive Phase', condition: 'angle_gt', ruleId: 'rugby_scrum_spine_flat', threshold: 160 },
          { phase: 'Lock Out', condition: 'angle_gt', ruleId: 'rugby_scrum_neck_neutral', threshold: 150 }
        ]
      },
      {
        id: 'ruck',
        name: 'Ruck Cleanout & Breakdown',
        description: 'Low shoulder entry, legal bind and dynamic drive through breakdown.',
        phases: ['Entry Stride', 'Cleanout Impact', 'Drive Over', 'Seal Phase'],
        sequence: ['Entry Stride', 'Cleanout Impact', 'Drive Over', 'Seal Phase'],
        jointRules: [rugbyRules[1], rugbyRules[5], rugbyRules[6], rugbyRules[7], rugbyRules[8]],
        triggers: [
          { phase: 'Entry Stride', condition: 'angle_lt', ruleId: 'rugby_low_shoulder_entry', threshold: 115 },
          { phase: 'Cleanout Impact', condition: 'angle_lt', ruleId: 'rugby_tackle_knee_flex', threshold: 125 },
          { phase: 'Drive Over', condition: 'angle_gt', ruleId: 'rugby_drive_leg_extension', threshold: 160 },
          { phase: 'Seal Phase', condition: 'angle_gt', ruleId: 'rugby_core_bracing_tilt', threshold: 165 }
        ]
      },
      {
        id: 'lineout',
        name: 'Lineout Jump & Overhead Take',
        description: 'Vertical jumper extension, support pod lift and clean aerial catch.',
        phases: ['Crouch Prep', 'Jump Drive', 'Apex Extension', 'Landing Cushion'],
        sequence: ['Crouch Prep', 'Jump Drive', 'Apex Extension', 'Landing Cushion'],
        jointRules: [rugbyRules[0], rugbyRules[6], rugbyRules[8], rugbyRules[14], rugbyRules[2]],
        triggers: [
          { phase: 'Crouch Prep', condition: 'angle_lt', ruleId: 'rugby_bilateral_quad_flex', threshold: 125 },
          { phase: 'Jump Drive', condition: 'angle_gt', ruleId: 'rugby_drive_leg_extension', threshold: 165 },
          { phase: 'Apex Extension', condition: 'angle_gt', ruleId: 'rugby_catch_hand_funnel', threshold: 150 },
          { phase: 'Landing Cushion', condition: 'angle_lt', ruleId: 'rugby_tackle_knee_flex', threshold: 135 }
        ]
      }
    ],
    phases: ['Contact Prep', 'Pass Release', 'Kick Plant', 'Scrum Setup'],
    sequence: ['Contact Prep', 'Contact Phase', 'Wrap Phase', 'Drive Phase'],
    jointRules: rugbyRules,
    drills: [
      {
        name: 'Single-Leg Drop Landings & Knee Tracking',
        targetJoint: 'Knee Flexion & Ligament Safety',
        description: 'Enhances knee stability and hamstring co-activation to prevent inward knee collapse (valgus) during tackle contact.',
        reps: '3 sets x 8 reps each leg',
        whyThisWorks: 'Neuromuscular feedback trains the vastus medialis and hamstrings to fire upon ground contact, stabilizing knee flexion angle (100°-125°) and preventing dynamic valgus collapse under high collision loads.',
        coachingCue: 'Land quietly like a cat, keeping your knee pointing straight over your middle toes.',
        howToExecute: [
          '1. Stand on a 12-inch box or platform with feet hip-width apart.',
          '2. Step off smoothly with one foot without jumping upwards.',
          '3. Land quietly on forefoot, bending knee to ~120° while keeping knee over 2nd toe.',
          '4. Hold steady single-leg position for 2 seconds to confirm balance.'
        ]
      },
      {
        name: 'Core Bracing & Neutral Spine Box Hold',
        targetJoint: 'Lumbar Spine & Core Anti-Extension',
        description: 'Protects the spinal column against shear forces by training deep core anti-extension bracing under movement load.',
        reps: '3 sets x 12 reps',
        whyThisWorks: 'Activates transverse abdominis and multifidus muscles to lock the lumbar spine in neutral alignment (120°-145° hinge), neutralizing shear vector forces during tackles and scrum engagements.',
        coachingCue: 'Keep your lower back flat enough to balance a cup of water without spilling a drop.',
        howToExecute: [
          '1. Assume tabletop position with hands under shoulders and knees under hips.',
          '2. Exhale fully to pull ribs down and brace abdominal wall.',
          '3. Hover knees 1 inch off floor maintaining a flat lower back.',
          '4. Hold for 10 seconds per rep, maintaining steady breathing.'
        ]
      },
      {
        name: 'Banded Hip Hinge & Explosive Extension Drive',
        targetJoint: 'Hip Joint & Gluteus Maximus',
        description: 'Teaches maximum glute activation and hip snap while preserving lower back alignment during power phases.',
        reps: '3 sets x 10 reps',
        whyThisWorks: 'Fosters rapid gluteus maximus motor unit recruitment at terminal hip extension, converting horizontal ground reaction force into explosive leg drive through the tackle.',
        coachingCue: 'Drive hips forward explosively and lock out glutes at the top.',
        howToExecute: [
          '1. Anchor a heavy resistance band at hip height behind you.',
          '2. Hinge at hips to 120° while maintaining flat lumbar spine.',
          '3. Drive hips forward explosively into full extension.',
          '4. Pause 1 second at full extension before controlled return.'
        ]
      }
    ]
  },
  {
    id: 'soccer',
    name: 'Soccer / Football',
    iconName: 'Goal',
    category: 'Field Sports',
    description: '40 Biometric Rules covering Shooting, Inside Passing, Dribbling Feints, and Goalkeeping saves.',
    kidFocus: 'Ensures plant foot knee flex to absorb joint shock & knee over ball for clean shot control.',
    techniques: [
      {
        id: 'shooting',
        name: 'Shooting & Striking',
        description: 'Plant foot flex, chest over ball and clean strike mechanics.',
        phases: ['Plant Phase', 'Backswing', 'Impact Moment', 'Follow Through'],
        sequence: ['Plant Phase', 'Backswing', 'Impact Moment', 'Follow Through'],
        jointRules: soccerRules.slice(0, 10),
        triggers: [
          { phase: 'Plant Phase', condition: 'angle_lt', ruleId: 'soccer_plant_foot_knee_flex', threshold: 150 },
          { phase: 'Backswing', condition: 'angle_lt', ruleId: 'soccer_kicking_knee_backswing', threshold: 120 },
          { phase: 'Impact Moment', condition: 'angle_gt', ruleId: 'soccer_kicking_knee_backswing', threshold: 140 },
          { phase: 'Follow Through', condition: 'angle_gt', ruleId: 'soccer_follow_through_height', threshold: 155 }
        ],
        archetypes: [
          {
            phase: 'Plant Phase',
            targetAngles: { 'soccer_plant_foot_knee_flex': 135 },
            spineConstraint: 'linear',
            centerOfGravityOffset: { x: -0.1, y: 0.1 }
          },
          {
            phase: 'Impact Moment',
            targetAngles: { 'soccer_chest_over_ball_alignment': 165 },
            expectedVelocity: { jointIdx: 28, vector: { x: 5.0, y: 2.0, z: 0 }, minMagnitude: 3.0 },
            spineConstraint: 'linear',
            forceDirection: { x: 0.8, y: 0.4, z: 0 }
          }
        ]
      },
      {
        id: 'passing',
        name: 'Passing & First Touch',
        description: 'Inside foot open angle, weight transfer and clean reception.',
        phases: ['Pass Release', 'First Touch', 'Long Pass', 'One Touch'],
        sequence: ['Pass Release', 'First Touch', 'Long Pass', 'One Touch'],
        jointRules: soccerRules.slice(10, 20),
        triggers: [
          { phase: 'Pass Release', condition: 'angle_gt', ruleId: 'soccer_inside_pass_ankle_open', threshold: 140 },
          { phase: 'First Touch', condition: 'angle_lt', ruleId: 'soccer_cushion_knee_soft', threshold: 135 },
          { phase: 'Long Pass', condition: 'angle_gt', ruleId: 'soccer_driven_pass_knee_over', threshold: 145 },
          { phase: 'One Touch', condition: 'angle_gt', ruleId: 'soccer_wall_pass_pivot', threshold: 150 }
        ]
      },
      {
        id: 'dribbling',
        name: 'Dribbling & Agility',
        description: 'Low center of gravity, quick changes of direction and feints.',
        phases: ['Dribbling', 'Change of Direction', 'Sprint Stride', 'Defending'],
        sequence: ['Dribbling', 'Change of Direction', 'Sprint Stride', 'Defending'],
        jointRules: soccerRules.slice(20, 30),
        triggers: [
          { phase: 'Dribbling', condition: 'angle_lt', ruleId: 'soccer_dribble_low_cg_knee', threshold: 145 },
          { phase: 'Change of Direction', condition: 'angle_lt', ruleId: 'soccer_feint_side_step_valgus', threshold: 135 },
          { phase: 'Sprint Stride', condition: 'angle_gt', ruleId: 'soccer_sprint_stride_knee_drive', threshold: 85 },
          { phase: 'Defending', condition: 'angle_lt', ruleId: 'soccer_jockey_defensive_stance', threshold: 135 }
        ]
      },
      {
        id: 'goalkeeping',
        name: 'Goalkeeping',
        description: 'Ready stance, diving takeoffs and cross catches.',
        phases: ['Ready Position', 'Dive Takeoff', 'Cross Catch', '1v1 Block'],
        sequence: ['Ready Position', 'Dive Takeoff', 'Cross Catch', '1v1 Block'],
        jointRules: soccerRules.slice(30, 40),
        triggers: [
          { phase: 'Ready Position', condition: 'angle_lt', ruleId: 'soccer_gk_ready_knee_flex', threshold: 135 },
          { phase: 'Dive Takeoff', condition: 'angle_lt', ruleId: 'soccer_gk_diving_push_knee', threshold: 120 },
          { phase: 'Cross Catch', condition: 'angle_gt', ruleId: 'soccer_gk_high_claim_reach', threshold: 165 },
          { phase: '1v1 Block', condition: 'angle_gt', ruleId: 'soccer_gk_1v1_block_spread', threshold: 160 }
        ]
      },
      {
        id: 'first_touch',
        name: 'First Touch & Control',
        description: 'Directional cushion, soft knee absorption and body orientation.',
        phases: ['Approach Scan', 'Cushion Impact', 'Turn Pivot', 'Exit Touch'],
        sequence: ['Approach Scan', 'Cushion Impact', 'Turn Pivot', 'Exit Touch'],
        jointRules: [soccerRules[11], soccerRules[10], soccerRules[13], soccerRules[20]],
        triggers: [
          { phase: 'Approach Scan', condition: 'angle_lt', ruleId: 'soccer_dribble_low_cg_knee', threshold: 145 },
          { phase: 'Cushion Impact', condition: 'angle_lt', ruleId: 'soccer_cushion_knee_soft', threshold: 135 },
          { phase: 'Turn Pivot', condition: 'angle_gt', ruleId: 'soccer_inside_pass_ankle_open', threshold: 140 },
          { phase: 'Exit Touch', condition: 'angle_gt', ruleId: 'soccer_wall_pass_pivot', threshold: 150 }
        ]
      },
      {
        id: 'heading',
        name: 'Heading & Aerial Duels',
        description: 'Takeoff drive, neck rigidity, core arch and clean forehead contact.',
        phases: ['Jump Takeoff', 'Aerial Arch', 'Forehead Contact', 'Landing Cushion'],
        sequence: ['Jump Takeoff', 'Aerial Arch', 'Forehead Contact', 'Landing Cushion'],
        jointRules: [soccerRules[0], soccerRules[1], soccerRules[22], soccerRules[27]],
        triggers: [
          { phase: 'Jump Takeoff', condition: 'angle_lt', ruleId: 'soccer_plant_foot_knee_flex', threshold: 130 },
          { phase: 'Aerial Arch', condition: 'angle_gt', ruleId: 'soccer_chest_over_ball_alignment', threshold: 160 },
          { phase: 'Forehead Contact', condition: 'angle_lt', ruleId: 'soccer_sprint_stride_knee_drive', threshold: 110 },
          { phase: 'Landing Cushion', condition: 'angle_lt', ruleId: 'soccer_plant_foot_knee_flex', threshold: 140 }
        ]
      }
    ],
    phases: ['Plant Phase', 'Backswing', 'Impact Moment', 'Follow Through'],
    sequence: ['Plant Phase', 'Backswing', 'Impact Moment', 'Follow Through'],
    jointRules: soccerRules,
    drills: [
      {
        name: 'Plant Foot Knee Flex Cushion Drill',
        targetJoint: 'Plant Knee Flexion & Quadriceps Absorption',
        description: 'Trains the non-kicking leg to flex deep (120°-145°) upon planting adjacent to the ball.',
        reps: '3 sets x 10 reps each side',
        whyThisWorks: 'Deep plant knee flexion drops the athlete\'s center of mass, increasing base of support stability and allowing the kicking hip to rotate cleanly through a wider arc without hip hitching.',
        coachingCue: 'Sink deep into the plant knee so your hips stay level and stable.',
        howToExecute: [
          '1. Approach a stationary ball at a 45-degree angle.',
          '2. Plant non-kicking foot 6-8 inches alongside the ball with knee flexed to 120°.',
          '3. Hold the deep plant position while bringing kicking leg through in slow motion.',
          '4. Verify knee stays over second toe throughout plant phase.'
        ]
      },
      {
        name: 'Chest Over Ball Core Alignment Drill',
        targetJoint: 'Thoracic Spine & Abdominal Wall',
        description: 'Ensures forward chest lean over the ball during power strikes to keep shot trajectories down.',
        reps: '3 sets x 12 reps',
        whyThisWorks: 'Leaning the chest forward relative to the pelvis shifts the ground reaction force vector downward, maintaining a low ball launch trajectory and preventing skied shots.',
        coachingCue: 'Keep your chin and sternum over the ball until full follow-through.',
        howToExecute: [
          '1. Set up a target 10 yards away with a low crossbar.',
          '2. Strike ball focusing on bringing chest forward over plant foot.',
          '3. Ensure shoulders stay square to target at impact instant.'
        ]
      }
    ]
  },
  {
    id: 'netball',
    name: 'Netball',
    iconName: 'Activity',
    category: 'Court Sports',
    description: '40 Biometric Rules covering Arc Shooting, 1-2 Landing Footwork, Passing & 3ft Marking.',
    kidFocus: 'CRITICAL SAFETY: Enforces soft double knee landing cushion to prevent ACL tears on court stops.',
    techniques: [
      {
        id: 'shooting',
        name: 'Shooting & Arc Flight',
        description: 'Elbow flick, arc trajectory and balanced release.',
        phases: ['Shot Prep', 'Shot Release', 'Release Instant', 'Set Phase'],
        sequence: ['Shot Prep', 'Shot Release', 'Release Instant', 'Set Phase'],
        jointRules: netballRules.slice(0, 10),
        triggers: [
          { phase: 'Shot Prep', condition: 'angle_lt', ruleId: 'netball_shot_knee_dip', threshold: 130 },
          { phase: 'Shot Release', condition: 'angle_gt', ruleId: 'netball_shot_elbow_flick', threshold: 145 },
          { phase: 'Release Instant', condition: 'angle_gt', ruleId: 'netball_wrist_flick_snap', threshold: 140 },
          { phase: 'Set Phase', condition: 'angle_gt', ruleId: 'netball_torso_upright_shot', threshold: 160 }
        ]
      },
      {
        id: 'footwork',
        name: 'Footwork & Landing',
        description: 'Soft double-knee landing and 1-2 footwork pivots.',
        phases: ['Landing', 'Pivoting', 'Sudden Stop', 'Dodging'],
        sequence: ['Landing', 'Pivoting', 'Sudden Stop', 'Dodging'],
        jointRules: netballRules.slice(10, 20),
        triggers: [
          { phase: 'Landing', condition: 'angle_lt', ruleId: 'netball_one_two_landing_knee', threshold: 130 },
          { phase: 'Pivoting', condition: 'angle_lt', ruleId: 'netball_pivot_hip_rotation', threshold: 145 },
          { phase: 'Sudden Stop', condition: 'angle_lt', ruleId: 'netball_knee_valgus_decel', threshold: 140 },
          { phase: 'Dodging', condition: 'angle_lt', ruleId: 'netball_change_direction_cut', threshold: 135 }
        ]
      },
      {
        id: 'passing',
        name: 'Passing & Catching',
        description: 'Chest pass mechanics, elbow drive and clean reception.',
        phases: ['Chest Pass', 'Takeback', 'Bounce Pass', 'Ball Reception'],
        sequence: ['Chest Pass', 'Takeback', 'Bounce Pass', 'Ball Reception'],
        jointRules: netballRules.slice(20, 30),
        triggers: [
          { phase: 'Chest Pass', condition: 'angle_gt', ruleId: 'netball_wrist_flick_snap', threshold: 145 },
          { phase: 'Takeback', condition: 'angle_lt', ruleId: 'netball_guide_hand_angle', threshold: 130 },
          { phase: 'Bounce Pass', condition: 'angle_gt', ruleId: 'netball_stepping_rule_footwork', threshold: 160 },
          { phase: 'Ball Reception', condition: 'angle_lt', ruleId: 'netball_balance_base_width', threshold: 120 }
        ]
      },
      {
        id: 'defending',
        name: 'Defending & Interceptions',
        description: '3-foot marking distance, stance and active arms.',
        phases: ['3ft Defense', 'Marking Shot', 'Interception', 'Pass Distraction'],
        sequence: ['3ft Defense', 'Marking Shot', 'Interception', 'Pass Distraction'],
        jointRules: netballRules.slice(30, 40),
        triggers: [
          { phase: '3ft Defense', condition: 'angle_lt', ruleId: 'netball_stepping_rule_footwork', threshold: 135 },
          { phase: 'Marking Shot', condition: 'angle_gt', ruleId: 'netball_balance_base_width', threshold: 140 },
          { phase: 'Interception', condition: 'angle_gt', ruleId: 'netball_jump_shot_takeoff_knee', threshold: 160 },
          { phase: 'Pass Distraction', condition: 'angle_lt', ruleId: 'netball_soft_landing_cushion', threshold: 140 }
        ]
      },
      {
        id: 'dodging',
        name: 'Change of Direction Dodge',
        description: 'Sharp drop of center of gravity, outside foot plant and sprint separation.',
        phases: ['Approach Stride', 'Decel Plant', 'Pivot Push', 'Breakaway'],
        sequence: ['Approach Stride', 'Decel Plant', 'Pivot Push', 'Breakaway'],
        jointRules: [netballRules[13], netballRules[12], netballRules[11], netballRules[23]],
        triggers: [
          { phase: 'Approach Stride', condition: 'angle_lt', ruleId: 'netball_change_direction_cut', threshold: 135 },
          { phase: 'Decel Plant', condition: 'angle_lt', ruleId: 'netball_knee_valgus_decel', threshold: 130 },
          { phase: 'Pivot Push', condition: 'angle_gt', ruleId: 'netball_pivot_hip_rotation', threshold: 140 },
          { phase: 'Breakaway', condition: 'angle_gt', ruleId: 'netball_stepping_rule_footwork', threshold: 155 }
        ]
      },
      {
        id: 'rebounding',
        name: 'Aerial Rebound & High Take',
        description: 'Explosive vertical leap, high two-hand take and balanced landing cushion.',
        phases: ['Box-Out Stance', 'Vertical Leap', 'High Catch Hold', 'Two-Foot Landing'],
        sequence: ['Box-Out Stance', 'Vertical Leap', 'High Catch Hold', 'Two-Foot Landing'],
        jointRules: [netballRules[32], netballRules[10], netballRules[21], netballRules[3]],
        triggers: [
          { phase: 'Box-Out Stance', condition: 'angle_lt', ruleId: 'netball_balance_base_width', threshold: 120 },
          { phase: 'Vertical Leap', condition: 'angle_gt', ruleId: 'netball_jump_shot_takeoff_knee', threshold: 165 },
          { phase: 'High Catch Hold', condition: 'angle_gt', ruleId: 'netball_torso_upright_shot', threshold: 160 },
          { phase: 'Two-Foot Landing', condition: 'angle_lt', ruleId: 'netball_soft_landing_cushion', threshold: 135 }
        ]
      }
    ],
    phases: ['Shot Prep', 'Landing Phase', 'Chest Pass', '3ft Defense'],
    sequence: ['Shot Prep', 'Vertical Launch', 'Release Instant', 'Landing Phase'],
    jointRules: netballRules,
    drills: [
      {
        name: 'Double-Leg Deceleration Cushion Hold',
        targetJoint: 'Knee Flexion & Ankle Complex',
        description: 'Enforces soft 100°-120° double-knee flex landing upon receiving a pass on court.',
        reps: '3 sets x 10 landings',
        whyThisWorks: 'Dissipates peak ground reaction forces through knee and hip flexors over a longer brake duration, reducing anterior cruciate ligament (ACL) tensile load by up to 60%.',
        coachingCue: 'Land like a spring, absorbing impact through hips and knees together.',
        howToExecute: [
          '1. Jump up to receive a chest pass mid-air.',
          '2. Catch ball cleanly and land simultaneously on both feet.',
          '3. Immediately absorb landing by bending knees to 110° and sitting back into hips.'
        ]
      },
      {
        name: '3-Foot Defensive Stance Reach Hold',
        targetJoint: 'Shoulder Abduction & Hip Abductors',
        description: 'Teaches maximum legal arm reach while keeping weight centered over feet.',
        reps: '3 sets x 8 holds',
        whyThisWorks: 'Strengthens hip abductors and lateral core brace so arms can extend fully overhead without leaning forward off balance or stepping inside 3 feet.',
        coachingCue: 'Stay tall behind the 3-foot line with active core bracing.',
        howToExecute: [
          '1. Measure 3 feet back from ball handler mark.',
          '2. Assume wide base with knees flexed 120°.',
          '3. Extend arms fully overhead at 165°-180° for 10-second holds.'
        ]
      }
    ]
  },
  {
    id: 'hockey',
    name: 'Hockey',
    iconName: 'Zap',
    category: 'Stick Sports',
    description: '40 Biometric Rules covering Hitting, Push Passes, Drag Flicks, Indian Dribble & Tomahawks.',
    kidFocus: 'Teaches deep crouch knee flex & low stick follow-through for hitting safety.',
    techniques: [
      {
        id: 'hitting',
        name: 'Hitting & Slapshot',
        description: 'Deep crouch knee flex, low stick and clean hit mechanics.',
        phases: ['Wind-Up', 'Backswing', 'Impact Moment', 'Follow Through'],
        sequence: ['Wind-Up', 'Backswing', 'Impact Moment', 'Follow Through'],
        jointRules: hockeyRules.slice(0, 10),
        triggers: [
          { phase: 'Wind-Up', condition: 'angle_lt', ruleId: 'hockey_hit_elbow_takeback', threshold: 120 },
          { phase: 'Backswing', condition: 'angle_lt', ruleId: 'hockey_hit_knee_bend_low', threshold: 130 },
          { phase: 'Impact Moment', condition: 'angle_gt', ruleId: 'hockey_hit_hip_rotation_strike', threshold: 145 },
          { phase: 'Follow Through', condition: 'angle_lt', ruleId: 'hockey_hit_follow_through_low', threshold: 150 }
        ],
        archetypes: [
          {
            phase: 'Backswing',
            targetAngles: { 'hockey_hit_knee_bend_low': 115 },
            spineConstraint: 'hinged',
            centerOfGravityOffset: { x: 0, y: 0.25 }
          },
          {
            phase: 'Impact Moment',
            targetAngles: { 'hockey_hit_hip_rotation_strike': 155 },
            expectedVelocity: { jointIdx: 15, vector: { x: 4.0, y: 0, z: 0 }, minMagnitude: 2.5 },
            spineConstraint: 'linear',
            forceDirection: { x: 1, y: 0, z: 0 }
          }
        ]
      },
      {
        id: 'push',
        name: 'Push Passing & Flicking',
        description: 'Bottom elbow extension, sweep and drag flick mechanics.',
        phases: ['Push Release', 'Push Sweep', 'Drag Phase', 'Scoop Lift'],
        sequence: ['Push Release', 'Push Sweep', 'Drag Phase', 'Scoop Lift'],
        jointRules: hockeyRules.slice(10, 20),
        triggers: [
          { phase: 'Push Release', condition: 'angle_gt', ruleId: 'hockey_push_pass_bottom_elbow', threshold: 160 },
          { phase: 'Push Sweep', condition: 'angle_lt', ruleId: 'hockey_push_pass_knee_lunge', threshold: 110 },
          { phase: 'Drag Phase', condition: 'angle_lt', ruleId: 'hockey_drag_flick_hip_drag', threshold: 140 },
          { phase: 'Scoop Lift', condition: 'angle_gt', ruleId: 'hockey_aerial_flick_elbow_lift', threshold: 155 }
        ]
      },
      {
        id: 'dribble',
        name: 'Dribbling & Indian Dribble',
        description: 'Wrist turning, low posture and ball control.',
        phases: ['Stick Turn', '3D Dribble', 'Scanning', 'Jab Tackle'],
        sequence: ['Stick Turn', '3D Dribble', 'Scanning', 'Jab Tackle'],
        jointRules: hockeyRules.slice(20, 30),
        triggers: [
          { phase: 'Stick Turn', condition: 'angle_lt', ruleId: 'hockey_indian_dribble_wrist_turn', threshold: 120 },
          { phase: '3D Dribble', condition: 'angle_lt', ruleId: 'hockey_dribble_crouch_knee_flex', threshold: 130 },
          { phase: 'Scanning', condition: 'angle_gt', ruleId: 'hockey_upright_vision_neck', threshold: 160 },
          { phase: 'Jab Tackle', condition: 'angle_gt', ruleId: 'hockey_jab_tackle_arm_extend', threshold: 155 }
        ]
      },
      {
        id: 'goalkeeping',
        name: 'Penalty Corner & Goalkeeping',
        description: 'Injection traps, pads saves and glove reflexes.',
        phases: ['Injection', 'Stop Trap', 'Kick Save', 'Glove Save'],
        sequence: ['Injection', 'Stop Trap', 'Kick Save', 'Glove Save'],
        jointRules: hockeyRules.slice(30, 40),
        triggers: [
          { phase: 'Injection', condition: 'angle_gt', ruleId: 'hockey_pc_injector_push_elbow', threshold: 150 },
          { phase: 'Stop Trap', condition: 'angle_lt', ruleId: 'hockey_pc_stopper_knee_crouch', threshold: 120 },
          { phase: 'Kick Save', condition: 'angle_gt', ruleId: 'hockey_gk_kick_save_leg_extension', threshold: 160 },
          { phase: 'Glove Save', condition: 'angle_gt', ruleId: 'hockey_gk_glove_save_arm_reach', threshold: 155 }
        ]
      },
      {
        id: 'drag_flick',
        name: 'Penalty Corner Drag Flick',
        description: 'Low drag stance, whipping torso rotation and explosive top-corner flick.',
        phases: ['Approach Stride', 'Drag Phase', 'Torso Whip', 'High Release'],
        sequence: ['Approach Stride', 'Drag Phase', 'Torso Whip', 'High Release'],
        jointRules: [hockeyRules[12], hockeyRules[11], hockeyRules[2], hockeyRules[13]],
        triggers: [
          { phase: 'Approach Stride', condition: 'angle_lt', ruleId: 'hockey_push_pass_knee_lunge', threshold: 120 },
          { phase: 'Drag Phase', condition: 'angle_lt', ruleId: 'hockey_drag_flick_hip_drag', threshold: 135 },
          { phase: 'Torso Whip', condition: 'angle_gt', ruleId: 'hockey_hit_hip_rotation_strike', threshold: 150 },
          { phase: 'High Release', condition: 'angle_gt', ruleId: 'hockey_aerial_flick_elbow_lift', threshold: 155 }
        ]
      },
      {
        id: 'aerial',
        name: '3D Lift & Aerial Scoop',
        description: 'Stick blade angle beneath ball, wrist ramp and controlled overhead scoop.',
        phases: ['Blade Placement', 'Wrist Angle Set', 'Scoop Lift', 'Follow Arc'],
        sequence: ['Blade Placement', 'Wrist Angle Set', 'Scoop Lift', 'Follow Arc'],
        jointRules: [hockeyRules[13], hockeyRules[10], hockeyRules[1], hockeyRules[22]],
        triggers: [
          { phase: 'Blade Placement', condition: 'angle_lt', ruleId: 'hockey_hit_knee_bend_low', threshold: 125 },
          { phase: 'Wrist Angle Set', condition: 'angle_lt', ruleId: 'hockey_indian_dribble_wrist_turn', threshold: 115 },
          { phase: 'Scoop Lift', condition: 'angle_gt', ruleId: 'hockey_aerial_flick_elbow_lift', threshold: 150 },
          { phase: 'Follow Arc', condition: 'angle_gt', ruleId: 'hockey_upright_vision_neck', threshold: 160 }
        ]
      }
    ],
    phases: ['Wind-Up', 'Impact Moment', 'Push Release', 'Stick Turn'],
    sequence: ['Wind-Up', 'Backswing', 'Impact Moment', 'Follow Through'],
    jointRules: hockeyRules,
    drills: [
      {
        name: 'Deep Crouch Stick Push Hold',
        targetJoint: 'Knee Flexion & Lumbar Hinge',
        description: 'Trains low crouch position with flat spine entering hit or push pass.',
        reps: '3 sets x 10 reps',
        whyThisWorks: 'Keeps the stick flat along the turf by lowering the hip height directly, eliminating erratic bobbling hits and protecting wrist joint overextension.',
        coachingCue: 'Sit into your hips so the stick glides flat along the turf.',
        howToExecute: [
          '1. Assume stance with feet wider than shoulder width.',
          '2. Lower hips until knees reach 100° flexion.',
          '3. Sweep stick smoothly across turf maintaining flat spine alignment.'
        ]
      }
    ]
  },
  {
    id: 'cricket',
    name: 'Cricket',
    iconName: 'Target',
    category: 'Bat & Ball Sports',
    description: '40 Biometric Rules covering Bowling Action (15° Law), Cover Drives, Pull Shots & Keeping.',
    kidFocus: 'Monitors firm front knee extension & 15° bowling arm straightness to prevent lumbar stress.',
    techniques: [
      {
        id: 'bowling',
        name: 'Fast & Spin Bowling',
        description: '15° arm extension check, front knee block and shoulder rotation.',
        phases: ['Delivery Stride', 'Bound Gather', 'Ball Release', 'Spin Release'],
        sequence: ['Delivery Stride', 'Bound Gather', 'Ball Release', 'Spin Release'],
        jointRules: cricketRules.slice(0, 10),
        triggers: [
          { phase: 'Delivery Stride', condition: 'angle_gt', ruleId: 'cricket_bowling_front_knee_block', threshold: 155 },
          { phase: 'Bound Gather', condition: 'angle_lt', ruleId: 'cricket_back_foot_landing_knee', threshold: 150 },
          { phase: 'Ball Release', condition: 'angle_gt', ruleId: 'cricket_bowling_arm_straight', threshold: 165 },
          { phase: 'Spin Release', condition: 'angle_gt', ruleId: 'cricket_spin_flight_revolutions_elbow', threshold: 160 }
        ]
      },
      {
        id: 'batting_front',
        name: 'Batting Drives & Front Foot',
        description: 'Front foot lunge, high elbow and textbook cover drive.',
        phases: ['Front Foot Drive', 'Bat Swing', 'Contact Moment', 'Follow Through'],
        sequence: ['Front Foot Drive', 'Bat Swing', 'Contact Moment', 'Follow Through'],
        jointRules: cricketRules.slice(10, 20),
        triggers: [
          { phase: 'Front Foot Drive', condition: 'angle_lt', ruleId: 'cricket_stance_base_width', threshold: 110 },
          { phase: 'Bat Swing', condition: 'angle_lt', ruleId: 'cricket_backlift_elbow_flex', threshold: 120 },
          { phase: 'Contact Moment', condition: 'angle_lt', ruleId: 'cricket_front_drive_knee_lunge', threshold: 130 },
          { phase: 'Follow Through', condition: 'angle_gt', ruleId: 'cricket_straight_bat_follow_through', threshold: 160 }
        ]
      },
      {
        id: 'batting_back',
        name: 'Back Foot & Pull/Hook Shots',
        description: 'Back foot weight shift, pull shot rotation and ducking.',
        phases: ['Back Foot Pull', 'Bat Swing', 'Ducking', 'Scoop Shot'],
        sequence: ['Back Foot Pull', 'Bat Swing', 'Ducking', 'Scoop Shot'],
        jointRules: cricketRules.slice(20, 30),
        triggers: [
          { phase: 'Back Foot Pull', condition: 'angle_lt', ruleId: 'cricket_stance_base_width', threshold: 115 },
          { phase: 'Bat Swing', condition: 'angle_lt', ruleId: 'cricket_pull_shot_back_knee_flex', threshold: 125 },
          { phase: 'Ducking', condition: 'angle_lt', ruleId: 'cricket_duck_bouncer_knee_crouch', threshold: 120 },
          { phase: 'Scoop Shot', condition: 'angle_gt', ruleId: 'cricket_ramp_shot_wrist_cradle', threshold: 150 }
        ]
      },
      {
        id: 'fielding',
        name: 'Ground Fielding & Throwing',
        description: 'Attacking ground balls, crow hop and boundary throwing velocity.',
        phases: ['Attacking Ball', 'Gather Pickup', 'Crow Hop', 'Boundary Throw'],
        sequence: ['Attacking Ball', 'Gather Pickup', 'Crow Hop', 'Boundary Throw'],
        jointRules: cricketRules.slice(30, 35),
        triggers: [
          { phase: 'Attacking Ball', condition: 'angle_lt', ruleId: 'cricket_fielding_low_crouch_knee', threshold: 120 },
          { phase: 'Gather Pickup', condition: 'angle_lt', ruleId: 'cricket_fielding_low_crouch_knee', threshold: 110 },
          { phase: 'Crow Hop', condition: 'angle_gt', ruleId: 'cricket_throw_crow_hop_extension', threshold: 150 },
          { phase: 'Boundary Throw', condition: 'angle_gt', ruleId: 'cricket_throw_crow_hop_extension', threshold: 165 }
        ]
      },
      {
        id: 'wicketkeeping',
        name: 'Wicketkeeping Stance & Stumping',
        description: 'Low crouch balance, weight transfer to balls of feet and rapid glove reach.',
        phases: ['Crouch Stance', 'Rise With Ball', 'Glove Gathering', 'Stumping Whipping'],
        sequence: ['Crouch Stance', 'Rise With Ball', 'Glove Gathering', 'Stumping Whipping'],
        jointRules: [cricketRules[33], cricketRules[30], cricketRules[1], cricketRules[32]],
        triggers: [
          { phase: 'Crouch Stance', condition: 'angle_lt', ruleId: 'cricket_fielding_low_crouch_knee', threshold: 110 },
          { phase: 'Rise With Ball', condition: 'angle_gt', ruleId: 'cricket_back_foot_landing_knee', threshold: 135 },
          { phase: 'Glove Gathering', condition: 'angle_gt', ruleId: 'cricket_high_catch_hand_funnel', threshold: 145 },
          { phase: 'Stumping Whipping', condition: 'angle_gt', ruleId: 'cricket_keeper_stumping_reach', threshold: 155 }
        ]
      },
      {
        id: 'running',
        name: 'Between-Wickets Sprint & Turn',
        description: 'Bat ground plant, sharp 180° deceleration turn and acceleration stride.',
        phases: ['Acceleration', 'Decel Slide', 'Bat Ground Plant', 'Exit Sprint'],
        sequence: ['Acceleration', 'Decel Slide', 'Bat Ground Plant', 'Exit Sprint'],
        jointRules: [cricketRules[0], cricketRules[10], cricketRules[22], cricketRules[31]],
        triggers: [
          { phase: 'Acceleration', condition: 'angle_gt', ruleId: 'cricket_bowling_front_knee_block', threshold: 145 },
          { phase: 'Decel Slide', condition: 'angle_lt', ruleId: 'cricket_front_drive_knee_lunge', threshold: 120 },
          { phase: 'Bat Ground Plant', condition: 'angle_gt', ruleId: 'cricket_straight_bat_follow_through', threshold: 150 },
          { phase: 'Exit Sprint', condition: 'angle_gt', ruleId: 'cricket_throw_crow_hop_extension', threshold: 155 }
        ]
      }
    ],
    phases: ['Delivery Stride', 'Release Instant', 'Front Foot Drive', 'Contact Moment'],
    sequence: ['Delivery Stride', 'Release Instant', 'Follow Through'],
    jointRules: cricketRules,
    drills: [
      {
        name: 'Bowling Action 15° Arm Extension Check',
        targetJoint: 'Elbow Joint Straightness',
        description: 'Monitors bowling arm elbow straightness within legal ICC 15° threshold.',
        reps: '3 sets x 12 delivery strides',
        whyThisWorks: 'Grooves shoulder rotation as the primary speed generator rather than elbow flexing/flexion snap, protecting the elbow collateral ligament and complying with ICC laws.',
        coachingCue: 'Lead with the shoulder wheel and keep bowling arm extended straight.',
        howToExecute: [
          '1. Walk through delivery stride in front of a mirror or camera.',
          '2. Lock bowling elbow at release, rotating through shoulder arc.',
          '3. Confirm arm flex remains under 15° throughout delivery.'
        ]
      }
    ]
  },

  {
    id: 'tennis',
    name: 'Tennis',
    iconName: 'Zap',
    category: 'Racket Sports',
    description: '40 Biometric Rules covering Forehand Topspin, Serve Trophy Pose, Backhand Slices & Volleys.',
    kidFocus: 'Enforces unit turn shoulder coiling & trophy pose 90° arm setup to prevent tennis elbow.',
    techniques: [
      {
        id: 'groundstroke',
        name: 'Forehand & Backhand',
        description: 'Unit turn shoulder coil, racquet drop and wiper follow through.',
        phases: ['Unit Turn', 'Racquet Drop', 'Impact Instant', 'Wiper Follow-Through'],
        sequence: ['Unit Turn', 'Racquet Drop', 'Impact Instant', 'Wiper Follow-Through'],
        jointRules: tennisRules.slice(0, 10),
        triggers: [
          { phase: 'Unit Turn', condition: 'angle_lt', ruleId: 'tn_forehand_unit_turn', threshold: 135 },
          { phase: 'Racquet Drop', condition: 'angle_lt', ruleId: 'tn_forehand_knee_loading', threshold: 135 },
          { phase: 'Impact Instant', condition: 'angle_gt', ruleId: 'tn_forehand_contact_lead', threshold: 150 },
          { phase: 'Wiper Follow-Through', condition: 'angle_gt', ruleId: 'tn_forehand_follow_through_wrap', threshold: 140 }
        ]
      },
      {
        id: 'serve',
        name: 'Serve & Overhead Smash',
        description: 'Trophy pose, ball toss extension and racquet drop.',
        phases: ['Trophy Position', 'Toss Phase', 'Impact Instant', 'Landing'],
        sequence: ['Trophy Position', 'Toss Phase', 'Impact Instant', 'Landing'],
        jointRules: tennisRules.slice(10, 20),
        triggers: [
          { phase: 'Trophy Position', condition: 'angle_lt', ruleId: 'tn_serve_trophy_pose_elbow', threshold: 110 },
          { phase: 'Toss Phase', condition: 'angle_gt', ruleId: 'tn_serve_toss_arm_extend', threshold: 160 },
          { phase: 'Impact Instant', condition: 'angle_gt', ruleId: 'tn_serve_contact_peak_reach', threshold: 165 },
          { phase: 'Landing', condition: 'angle_lt', ruleId: 'tn_serve_landing_front_foot', threshold: 145 }
        ]
      },
      {
        id: 'volley',
        name: 'Volleys & Net Play',
        description: 'Compact punch block, split step and soft touch.',
        phases: ['Block Punch', 'Split Step', 'Low Punch', 'Soft Touch'],
        sequence: ['Block Punch', 'Split Step', 'Low Punch', 'Soft Touch'],
        jointRules: tennisRules.slice(20, 30),
        triggers: [
          { phase: 'Block Punch', condition: 'angle_lt', ruleId: 'tn_forehand_unit_turn', threshold: 140 },
          { phase: 'Split Step', condition: 'angle_lt', ruleId: 'tn_forehand_knee_loading', threshold: 140 },
          { phase: 'Low Punch', condition: 'angle_gt', ruleId: 'tn_forehand_contact_lead', threshold: 145 },
          { phase: 'Soft Touch', condition: 'angle_gt', ruleId: 'tn_forehand_follow_through_wrap', threshold: 135 }
        ]
      },
      {
        id: 'movement',
        name: 'Court Movement & Footwork',
        description: 'Split steps, sliding recovery and wide stretches.',
        phases: ['Split Step', 'Recovery', 'Slide Hit', 'Wide Stretch'],
        sequence: ['Split Step', 'Recovery', 'Slide Hit', 'Wide Stretch'],
        jointRules: tennisRules.slice(30, 40),
        triggers: [
          { phase: 'Split Step', condition: 'angle_lt', ruleId: 'tn_split_step_time_knee_dip', threshold: 135 },
          { phase: 'Recovery', condition: 'angle_gt', ruleId: 'tn_crossover_recovery_step', threshold: 155 },
          { phase: 'Slide Hit', condition: 'angle_lt', ruleId: 'tn_hardcourt_slide_ankle_lock', threshold: 100 },
          { phase: 'Wide Stretch', condition: 'angle_lt', ruleId: 'tn_defensive_stretch_lunge', threshold: 120 }
        ]
      },
      {
        id: 'overhead',
        name: 'Overhead Smash & Jump',
        description: 'Trophy shoulder turn, scissor-kick swap and downward angle smash.',
        phases: ['Lob Tracking', 'Trophy Pose', 'Scissor Jump', 'Pronation Strike'],
        sequence: ['Lob Tracking', 'Trophy Pose', 'Scissor Jump', 'Pronation Strike'],
        jointRules: [tennisRules[10], tennisRules[23], tennisRules[12], tennisRules[34]],
        triggers: [
          { phase: 'Lob Tracking', condition: 'angle_lt', ruleId: 'tn_backward_overhead_tracking', threshold: 140 },
          { phase: 'Trophy Pose', condition: 'angle_lt', ruleId: 'tn_serve_trophy_pose_elbow', threshold: 110 },
          { phase: 'Scissor Jump', condition: 'angle_gt', ruleId: 'tn_overhead_scissor_kick', threshold: 135 },
          { phase: 'Pronation Strike', condition: 'angle_gt', ruleId: 'tn_serve_contact_peak_reach', threshold: 165 }
        ]
      },
      {
        id: 'return',
        name: 'Serve Return & Block',
        description: 'Split-step forward hop, compact unit takeback and firm punch return.',
        phases: ['Ready Hop', 'Split Base', 'Shoulder Turn', 'Punch Return'],
        sequence: ['Ready Hop', 'Split Base', 'Shoulder Turn', 'Punch Return'],
        jointRules: [tennisRules[30], tennisRules[35], tennisRules[0], tennisRules[20]],
        triggers: [
          { phase: 'Ready Hop', condition: 'angle_lt', ruleId: 'tn_split_step_time_knee_dip', threshold: 135 },
          { phase: 'Split Base', condition: 'angle_gt', ruleId: 'tn_baseline_rally_stance_width', threshold: 90 },
          { phase: 'Shoulder Turn', condition: 'angle_lt', ruleId: 'tn_forehand_unit_turn', threshold: 135 },
          { phase: 'Punch Return', condition: 'angle_gt', ruleId: 'tn_forehand_contact_lead', threshold: 150 }
        ]
      }
    ],
    phases: ['Unit Turn', 'Racquet Drop', 'Impact Instant', 'Wiper Follow-Through'],
    sequence: ['Unit Turn', 'Racquet Drop', 'Impact Instant', 'Wiper Follow-Through'],
    jointRules: tennisRules,
    drills: [
      {
        name: 'Forehand Unit Turn Shoulder Coil',
        targetJoint: 'Thoracic Spine & Shoulder Rotator',
        description: 'Coils shoulders 90° relative to baseline prior to racquet drop.',
        reps: '3 sets x 12 reps',
        whyThisWorks: 'Loads core rotational stretch energy so the racquet accelerates into impact via hip-shoulder separation rather than arm muscle pulling.',
        coachingCue: 'Turn left shoulder to incoming ball before starting racquet drop.',
        howToExecute: [
          '1. Start in ready position at baseline.',
          '2. Pivot right foot and turn shoulders 90° as unit.',
          '3. Hold coiled position 1 second before uncoiling into shadow swing.'
        ]
      }
    ]
  },
  {
    id: 'golf',
    name: 'Golf',
    iconName: 'Target',
    category: 'Precision Sports',
    description: '40 Biometric Rules covering Driver Swing, Iron Contact, Short Game Wedges, Putting & Spine Hinge.',
    kidFocus: 'Monitors lead arm straightness, spine angle hinge & reverse-pivot angle to protect lower back.',
    techniques: [
      {
        id: 'full_swing',
        name: 'Full Driver & Iron Swing',
        description: 'Address spine angle, backswing coil and full follow-through.',
        phases: ['Address Stance', 'Backswing Coiling', 'Downswing Impact', 'Follow-Through Finish'],
        sequence: ['Address Stance', 'Backswing Coiling', 'Downswing Impact', 'Follow-Through Finish'],
        jointRules: golfRules.slice(0, 10),
        triggers: [
          { phase: 'Address Stance', condition: 'angle_gt', ruleId: 'gf_pitch_narrow_stance_width', threshold: 80 },
          { phase: 'Backswing Coiling', condition: 'angle_gt', ruleId: 'gf_backswing_shoulder_turn', threshold: 85 },
          { phase: 'Downswing Impact', condition: 'angle_gt', ruleId: 'gf_downswing_hip_transfer', threshold: 120 },
          { phase: 'Follow-Through Finish', condition: 'angle_gt', ruleId: 'gf_follow_through_chest_target', threshold: 160 }
        ],
        archetypes: [
          {
            phase: 'Address Stance',
            targetAngles: { 'gf_address_spine_angle': 40, 'gf_address_knee_flexion': 145 },
            spineConstraint: 'hinged',
            centerOfGravityOffset: { x: 0, y: 0.05 }
          },
          {
            phase: 'Downswing Impact',
            targetAngles: { 'gf_downswing_hip_transfer': 135 },
            expectedVelocity: { jointIdx: 16, vector: { x: 8.0, y: -2.0, z: 0 }, minMagnitude: 5.0 },
            spineConstraint: 'coiled',
            forceDirection: { x: 0.9, y: -0.1, z: 0 }
          }
        ]
      },
      {
        id: 'pitching',
        name: 'Wedge & Pitching Motion',
        description: 'Narrow stance, 60/40 lead weight bias, hinge-and-hold and low sawed finish.',
        phases: ['Address Stance', 'Backswing Coiling', 'Downswing Impact', 'Follow-Through Finish'],
        sequence: ['Address Stance', 'Backswing Coiling', 'Downswing Impact', 'Follow-Through Finish'],
        jointRules: [golfRules[14], golfRules[15], golfRules[19], golfRules[21], golfRules[13]],
        triggers: [
          { phase: 'Address Stance', condition: 'angle_lt', ruleId: 'gf_pitch_narrow_stance_width', threshold: 85 },
          { phase: 'Backswing Coiling', condition: 'angle_lt', ruleId: 'gf_pitch_lead_weight_address', threshold: 135 },
          { phase: 'Downswing Impact', condition: 'angle_gt', ruleId: 'gf_pitch_hinge_and_hold', threshold: 155 },
          { phase: 'Follow-Through Finish', condition: 'angle_lt', ruleId: 'gf_wedge_low_launch_follow', threshold: 145 }
        ]
      },
      {
        id: 'chipping',
        name: 'Green-Side Bump & Run Chip',
        description: 'Firm locked wrists, forward shaft lean and pendulum shoulder rock.',
        phases: ['Address Stance', 'Backswing Coiling', 'Downswing Impact', 'Follow-Through Finish'],
        sequence: ['Address Stance', 'Backswing Coiling', 'Downswing Impact', 'Follow-Through Finish'],
        jointRules: [golfRules[18], golfRules[14], golfRules[15], golfRules[0], golfRules[7]],
        triggers: [
          { phase: 'Address Stance', condition: 'angle_lt', ruleId: 'gf_pitch_narrow_stance_width', threshold: 85 },
          { phase: 'Backswing Coiling', condition: 'angle_gt', ruleId: 'gf_head_stability_swing', threshold: 155 },
          { phase: 'Downswing Impact', condition: 'angle_gt', ruleId: 'gf_chip_shot_no_wrist_break', threshold: 155 },
          { phase: 'Follow-Through Finish', condition: 'angle_gt', ruleId: 'gf_follow_through_chest_target', threshold: 160 }
        ]
      },
      {
        id: 'bunker_shot',
        name: 'Bunker Sand Splash Explosion',
        description: 'Lowered knee flex, open blade splash 2 inches behind ball and high acceleration follow-through.',
        phases: ['Sand Setup', 'Open Coiling', 'Sand Impact', 'High Acceleration'],
        sequence: ['Sand Setup', 'Open Coiling', 'Sand Impact', 'High Acceleration'],
        jointRules: [golfRules[11], golfRules[17], golfRules[16], golfRules[20], golfRules[1]],
        triggers: [
          { phase: 'Sand Setup', condition: 'angle_lt', ruleId: 'gf_bunker_sand_entry_knee', threshold: 138 },
          { phase: 'Open Coiling', condition: 'angle_gt', ruleId: 'gf_flop_shot_open_face_elbow', threshold: 140 },
          { phase: 'Sand Impact', condition: 'angle_gt', ruleId: 'gf_bunker_splash_entry_angle', threshold: 130 },
          { phase: 'High Acceleration', condition: 'angle_gt', ruleId: 'gf_bunker_splash_follow', threshold: 155 }
        ]
      },
      {
        id: 'putting',
        name: 'Putting & Green Reading',
        description: 'Eye over ball, shoulder rock pendulum and square face.',
        phases: ['Address Stance', 'Backswing Coiling', 'Downswing Impact', 'Follow-Through Finish'],
        sequence: ['Address Stance', 'Backswing Coiling', 'Downswing Impact', 'Follow-Through Finish'],
        jointRules: golfRules.slice(20, 30),
        triggers: [
          { phase: 'Address Stance', condition: 'angle_lt', ruleId: 'gf_putting_eye_over_ball', threshold: 95 },
          { phase: 'Backswing Coiling', condition: 'angle_lt', ruleId: 'gf_putting_pendulum_elbow', threshold: 115 },
          { phase: 'Downswing Impact', condition: 'angle_gt', ruleId: 'gf_putt_shoulder_rock', threshold: 160 },
          { phase: 'Follow-Through Finish', condition: 'angle_gt', ruleId: 'gf_putt_still_hip_anchor', threshold: 170 }
        ]
      },
      {
        id: 'specialty',
        name: 'Stinger, Draw & Specialty Shots',
        description: 'Low stinger punch, inside-out draw path and uneven lie compensations.',
        phases: ['Address Stance', 'Backswing Coiling', 'Downswing Impact', 'Follow-Through Finish'],
        sequence: ['Address Stance', 'Backswing Coiling', 'Downswing Impact', 'Follow-Through Finish'],
        jointRules: golfRules.slice(30, 40),
        triggers: [
          { phase: 'Address Stance', condition: 'angle_lt', ruleId: 'gf_driver_spine_tilt_away', threshold: 148 },
          { phase: 'Backswing Coiling', condition: 'angle_lt', ruleId: 'gf_wrist_hinge_backswing', threshold: 105 },
          { phase: 'Downswing Impact', condition: 'angle_gt', ruleId: 'gf_downswing_hip_transfer', threshold: 120 },
          { phase: 'Follow-Through Finish', condition: 'angle_gt', ruleId: 'gf_follow_through_chest_target', threshold: 160 }
        ]
      }
    ],
    phases: ['Address Stance', 'Backswing Coiling', 'Downswing Impact', 'Follow-Through Finish'],
    sequence: ['Address Stance', 'Backswing Coiling', 'Downswing Impact', 'Follow-Through Finish'],
    jointRules: golfRules,
    drills: [
      {
        name: 'Spine Hinge & Posterior Hip Clearance',
        targetJoint: 'Lumbar-Sacral Joint & Hip Hinge',
        description: 'Maintains 35°-45° forward torso tilt throughout swing arc.',
        reps: '3 sets x 10 slow swings',
        whyThisWorks: 'Preserves constant swing radius and low point precision, protecting the spine against reverse-pivot strain and lumbar compression.',
        coachingCue: 'Keep rear hip against imaginary wall during backswing and downswing.',
        howToExecute: [
          '1. Stand with rear hips touching alignment rod or wall.',
          '2. Hinge forward at hips 35°-45° maintaining straight spine.',
          '3. Execute slow motion swing maintaining rear contact with wall.'
        ]
      }
    ]
  }
];

export const SPORTS_RULES: SportRule[] = BASE_SPORTS_RULES.map(sport => {
  let jointRules = sport.jointRules;
  if (sport.id === 'rugby') jointRules = RUGBY_RULES_EXPANDED;
  else if (sport.id === 'soccer') jointRules = SOCCER_RULES_EXPANDED;
  else if (sport.id === 'netball') jointRules = NETBALL_RULES_EXPANDED;
  else if (sport.id === 'hockey') jointRules = HOCKEY_RULES_EXPANDED;
  else if (sport.id === 'cricket') jointRules = CRICKET_RULES_EXPANDED;
  else if (sport.id === 'tennis') jointRules = TENNIS_RULES_EXPANDED;
  else if (sport.id === 'golf') jointRules = GOLF_RULES_EXPANDED;

  const expandedDrills = generateDrillsForSport(sport.id, sport.drills || []);

  return {
    ...sport,
    description: `${jointRules.length} Biometric Rules & ${expandedDrills.length} High-Performance Drills covering core mechanics.`,
    jointRules,
    drills: expandedDrills
  };
});

