# Klutchh Biomechanical Architecture: Kotlin Implementation Guide

This guide outlines how to port the **Rules Engine** and **Drills Library** logic from the TypeScript web application into a **Kotlin/Android** environment.

## 1. Core Data Structures (Kotlin Data Classes)

To maintain parity with the web app, define your biomechanical types using Kotlin data classes.

```kotlin
enum class SkillLevel { GRASSROOTS, ACADEMY, ELITE_PRO }

data class JointRule(
    val id: String,
    val name: String,
    val idealMin: Double,
    val idealMax: Double,
    val importance: String, // "critical_safety", "performance", etc.
    val impactOnPerformance: String,
    val injuryRiskFactor: String
)

data class Drill(
    val name: String,
    val description: String,
    val reps: String,
    val targetJoint: String,
    val difficultyTier: SkillLevel,
    val coachingCue: String,
    val howToExecute: List<String>
)
```

## 2. The Biomechanical Rules Engine

In Kotlin, you should implement the analysis as a `UseCase` or `Service`. This logic processes the landmarks returned by the **MediaPipe Android SDK**.

```kotlin
class BiomechanicalRulesEngine {
    
    fun calculateAngle(a: Point3D, b: Point3D, c: Point3D): Double {
        // Implementation of the cosine rule or vector dot product
        // Parity with TypeScript calculateAngle()
    }

    fun analyzeTechnique(
        landmarks: List<Landmark>,
        rules: List<JointRule>,
        skillLevel: SkillLevel
    ): AnalysisResult {
        val scores = rules.map { rule ->
            val angle = calculateAngle(landmarks[rule.p1], landmarks[rule.p2], landmarks[rule.p3])
            val isWithinRange = angle >= rule.idealMin && angle <= rule.idealMax
            
            JointEvaluation(
                ruleId = rule.id,
                measuredAngle = angle,
                status = if (isWithinRange) "OPTIMAL" else "DEVIATION"
            )
        }
        return AnalysisResult(scores)
    }
}
```

## 3. The Narrative Feedback Engine (Kotlin)

The "Narrative Story" logic uses simple string templates and conditional logic to connect joint defects.

```kotlin
fun generateNarrativeFeedback(result: AnalysisResult, rules: List<JointRule>): String {
    val criticalIssues = result.scores.filter { it.status == "DEVIATION" }
    
    return if (criticalIssues.isEmpty()) {
        "Exceptional synchronization! Your kinetic chain is firing optimally."
    } else {
        val primary = criticalIssues.first()
        val rule = rules.find { it.id == primary.ruleId }
        "Your ${rule?.name} is showing a deviation. ${rule?.impactOnPerformance}"
    }
}
```

## 4. Expanding the Library in Kotlin

To add new sports or drills in the Android app:
1. **Repository Pattern**: Create a `SportRuleRepository` that returns the `JointRule` objects for a given sport ID.
2. **Local JSON/Firestore**: You can store the library in a local JSON file for offline access or sync it with the same **Firestore** database used by the Web app for cross-platform consistency.
3. **Dynamic Generator**: Implement a Kotlin version of the `generateDrillsForSport` function to ensure the mobile app always has a deep library of 50+ drills per sport.

## 5. Integration with MediaPipe Tasks
Use the `com.google.mediapipe:tasks-vision` dependency to get the landmarks, then pass those landmarks directly into your `BiomechanicalRulesEngine`.
