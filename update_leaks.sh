sed -i.bak '30,65c\
  // Extract worst energy leaks / biomechanical deviations\
  let leaks: any[] = [];\
  \
  if (aiReport?.biomechanicInsights) {\
    aiReport.biomechanicInsights.forEach((insight, idx) => {\
      if (insight.includes("Warning") || insight.includes("Leak") || insight.includes("Excessive") || insight.includes("upright") || insight.includes("stalling") || insight.includes("instability")) {\
        leaks.push({\
          title: insight.substring(0, 35) + "...",\
          severity: insight.includes("Severe") || insight.includes("Excessive") ? "CRITICAL STABILITY" : "HIGH PRIORITY",\
          severityColor: insight.includes("Severe") ? "#ef4444" : "#f97316",\
          impact: "Loss of power & kinetic efficiency",\
          phase: "Delivery Phase",\
          timestamp: keyframeList.length > 2 ? keyframeList[1].timestamp : 1.5,\
          description: insight,\
          fix: "Focus on corrective drills to stabilize joint loading and alignment.",\
          suggestedDrill: `${sportRule.name} Low-Hip Kinetic Hinge`,\
        });\
      }\
    });\
  }\
\
  if (aiReport?.injuryRiskAssessment?.findings) {\
    aiReport.injuryRiskAssessment.findings.forEach((finding, idx) => {\
      if (finding.includes("low") || finding.includes("Excellent") || finding.includes("Controlled") || finding.includes("sound")) return;\
      leaks.push({\
        title: finding.substring(0, 35) + "...",\
        severity: "INJURY VULNERABILITY",\
        severityColor: "#ef4444",\
        impact: "Ligament Strain Vector",\
        phase: "Ground Plant",\
        timestamp: keyframeList.length > 3 ? keyframeList[2].timestamp : 2.1,\
        description: finding,\
        fix: "Focus on corrective drills to stabilize joint loading and alignment.",\
        suggestedDrill: "Deceleration Plant & Knee Tracking",\
      });\
    });\
  }\
\
  if (leaks.length === 0) {\
    leaks.push({\
      title: "Premature Segment Deceleration",\
      severity: "MODERATE PRIORITY",\
      severityColor: "#eab308",\
      impact: "Kinetic Whip Stalling",\
      phase: "Delivery & Impact",\
      timestamp: 1.8,\
      description: "The kinetic chain exhibits slight stalling before distal release. Keep rotational momentum firing completely through.",\
      fix: "Maintain continuous rotational drive until lead arm reaches 45° past strike line.",\
      suggestedDrill: "Rotational Elastic Core Whip Snap",\
    });\
  }' src/components/Report/LeaksTab.native.tsx
