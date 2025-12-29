# Learning Path Progress & Validation Logic

## System Overview

This document defines the complete validation logic for learning paths, module completion, progress tracking, and final exams. This is NOT code - it is the business logic specification that must be implemented.

---

## 1. Module Completion Rules

### When a Module is Marked Complete

A module is marked as **completed** when the user:

1. **Completes the module quiz** with a passing score (≥ 70%)
2. Quiz data is stored in `ACADEMY_QUIZZES` (see `lib/quiz-data.ts`)
3. Each module has easy/medium/hard questions
4. User must answer questions and submit quiz

**Data Saved:**
```typescript
{
  userId: string,
  moduleId: string,  // e.g., "valuation-basics"
  completedAt: Date,
  quizScore: number, // 0-100
  quizAnswers: Record<string, string>, // questionId -> answer
  passed: boolean // true if score >= 70
}
```

**Database Update:**
- Add `moduleId` to user's `completedModules` array for this path
- Store quiz attempt record for audit trail
- Update `lastActivityDate`

### Completion Criteria by Module Type

All current modules require:
- **Quiz completion** with ≥ 70% score
- **Minimum time spent** (optional): 5 minutes (prevents clicking through)
- **All content viewed** (optional): User scrolled to bottom of module content

---

## 2. Progress Calculation

### Percent Completion Formula

```
percentComplete = (completedModules.length / totalModules) * 100
```

**Example:**
- Path has 4 modules
- User completed 3 modules
- `percentComplete = (3 / 4) * 100 = 75%`

### What Counts Toward Progress

✅ **Counts:**
- Module quizzes passed (≥ 70%)

❌ **Does NOT Count:**
- Time spent reading
- Bookmark/favorites
- Partial quiz attempts (score < 70%)
- Final exam attempts (separate from module progress)

### Progress States

| State | Condition | User Sees |
|-------|-----------|-----------|
| **Not Started** | completedModules.length = 0 | "Start Module 1" button |
| **In Progress** | 0 < completedModules.length < totalModules | Progress bar + next module |
| **Modules Complete** | completedModules.length = totalModules | "Take Final Exam" button |
| **Path Complete** | Final exam passed | "Path Completed" badge + certificate |

---

## 3. Path Unlocking Rules

### Calibration Requirement

Before ANY path can be started:

**Calibration Confidence ≥ 60%**

- User must complete calibration quizzes (in `/learning`)
- Calibration tracks user knowledge across domains
- Paths remain locked until threshold met

**UI Behavior:**
- Show `<CalibrationPrompt>` component if confidence < 60%
- Display locked paths with overlay
- "Take Calibration Quiz" button redirects to `/learning`

### When "Start Module 1" Becomes Available

Module 1 unlocks when:
1. ✅ Calibration confidence ≥ 60%
2. ✅ User has not yet completed any modules in this path

**All subsequent modules unlock sequentially:**
- Module 2 unlocks after Module 1 completed
- Module 3 unlocks after Module 2 completed
- etc.

**No module skipping allowed.**

---

## 4. Final Exam System

### When Final Exam Unlocks

Final exam becomes available when:

1. ✅ **All modules completed** (100% module progress)
2. ✅ **All module quizzes passed** with ≥ 70%
3. ✅ **Calibration confidence** ≥ 60% (maintained)

**UI Change:**
- "Start Module 1" button → "Take Final Exam" button
- Display exam metadata:
  - Time limit
  - Number of questions
  - Passing score required
  - "Once unlocked, you can attempt at any time"

### Exam Eligibility Check (Before Starting)

```typescript
function canTakeExam(user, pathId):
  // 1. Check all modules complete
  completedModules = getCompletedModules(user, pathId)
  totalModules = PATHS_CONTENT[pathId].deepDive.skills.length

  if completedModules.length < totalModules:
    return { eligible: false, reason: "Complete all modules first" }

  // 2. Check cooldown from last failed attempt
  lastAttempt = getLastExamAttempt(user, pathId)

  if lastAttempt AND lastAttempt.passed:
    return { eligible: false, reason: "Exam already passed" }

  if lastAttempt AND !lastAttempt.passed:
    cooldownHours = FINAL_EXAMS[pathId].cooldownPeriod
    timeSinceAttempt = now() - lastAttempt.attemptDate

    if timeSinceAttempt < cooldownHours:
      return {
        eligible: false,
        reason: "Cooldown active. Retry available in X hours"
      }

  return { eligible: true }
```

### Final Exam Configuration

See `lib/final-exams.ts` for complete exam definitions.

**Each path has:**
- **Exam Format:** MCQ, Scenario-Based, or Mixed
- **Total Questions:** 16-20 questions
- **Time Limit:** 45-60 minutes
- **Passing Score:** 75% (higher than module quizzes)
- **Cooldown Period:** 24 hours between attempts if failed

**Example: Market Analyst Final Exam**
- Format: Mixed (MCQ + Scenario)
- Questions: 20
- Time: 60 minutes
- Pass: 75% (15/20 correct)
- Cooldown: 24 hours

### Taking the Exam

**Flow:**
1. User clicks "Take Final Exam"
2. Show exam rules modal:
   - Time limit countdown
   - No pausing
   - Questions may be harder than module quizzes
   - Single-attempt per session
3. User confirms → Timer starts
4. Questions presented (no skipping back)
5. Submit exam

**During Exam:**
- Timer displayed prominently
- Cannot pause or exit without forfeiting attempt
- Auto-submit when timer expires
- Save answers continuously (in case of disconnect)

**After Submission:**
- Immediate grading
- Show score, pass/fail status
- Show correct answers with explanations
- If passed: Unlock "Path Completed" state
- If failed: Show retry date (24 hours later)

---

## 5. Path Completion

### When Path is Officially Completed

A path is marked **COMPLETED** when:

1. ✅ All modules completed (100%)
2. ✅ Final exam **PASSED** (≥ 75%)

**Critical Rule:**
**Module completion alone does NOT complete a path.**
**Final exam MUST be passed.**

### What Happens When Path is Completed

**Data Updates:**
```typescript
{
  userId: string,
  pathId: string,
  completedAt: Date,
  finalExamScore: number,
  finalExamAttempts: number, // How many tries it took
  certificateId: string, // Generated certificate
  totalTimeSpent: number // minutes across all modules + exam
}
```

**User Sees:**
- ✅ "Path Completed" badge on dashboard
- Certificate available for download
- Unlocks next recommended path (if any)
- Updates user profile: "Completed Paths" section
- May unlock special content or advanced modules

**Path Card Update:**
- Shows "COMPLETED" status
- Displays completion date
- Shows final exam score
- Option to review modules
- Option to download certificate

---

## 6. Exam Failure Handling

### What Happens If User Fails Final Exam

**Immediate:**
1. Display score and pass/fail status
2. Show detailed results:
   - Which questions were wrong
   - Correct answers + explanations
   - Breakdown by skill area (e.g., "Valuation: 3/5, Macro: 2/5")
3. Recommend modules to review based on weak areas

**Cooldown Period:**
- **24-hour cooldown** before retry allowed
- Display countdown timer: "Retry available in 18h 32m"
- User CANNOT retake exam until cooldown expires

**During Cooldown:**
- User CAN review modules (recommended)
- User CAN view exam questions they got wrong (with answers)
- User CANNOT start new exam attempt

**Retry Mechanism:**
- After 24 hours: "Take Final Exam" button re-enabled
- Questions are randomized (from same question bank)
- No penalty for multiple attempts
- Best score is NOT saved - only latest attempt matters for pass/fail

**Progressive Difficulty (Optional Enhancement):**
- After 3+ failed attempts: Unlock "Study Guide" with focused review
- After 5+ failed attempts: Suggest 1-on-1 tutoring or additional resources

---

## 7. Edge Cases & Rules

### User Starts Path, Then Calibration Drops Below 60%

**Scenario:** User completed 2 modules, then their calibration confidence drops to 55%.

**Rule:** Path remains accessible. Calibration requirement is checked ONLY at initial unlock, not continuously.

**Rationale:** Punishing users mid-path is poor UX. Trust the initial filter.

---

### User Passes Module Quiz, Then Retakes and Scores Lower

**Rule:** Keep the FIRST passing score (≥ 70%). Module remains marked complete.

**Rationale:** Once competency is demonstrated, no need to re-validate.

---

### User Passes Final Exam, Then Wants to Retake for Higher Score

**Rule:** Once exam is passed, retakes are DISABLED.

**Rationale:** Path is complete. Focus on new paths.

**Exception:** If we implement leaderboards, allow retakes but mark clearly in UI.

---

### Network Disconnects During Final Exam

**Rule:** Auto-save answers every 30 seconds. If disconnect:
1. Timer keeps running (server-side)
2. On reconnect: Resume where left off
3. If timer expired: Auto-submit with saved answers

**Penalty:** None, as long as reconnect is genuine (not cheating).

---

### User Abandons Exam Mid-Attempt

**Rule:** Treat as failed attempt. Cooldown applies.

**Rationale:** Starting an exam is a commitment. Prevents gaming the system.

---

## 8. Data Flow Summary

### Step-by-Step User Journey

1. **User Signs Up**
   - calibrationConfidence = 0%
   - completedModules = []
   - No paths unlocked

2. **User Takes Calibration Quizzes**
   - Each quiz updates calibration score
   - When calibrationConfidence ≥ 60%:
     - Paths unlock on dashboard
     - "Start Module 1" buttons appear

3. **User Starts Path (e.g., Market Analyst)**
   - Click "Start Module 1" (Valuation Basics)
   - Read module content
   - Take module quiz
   - Score ≥ 70% → Module marked complete
   - completedModules = ["valuation-basics"]
   - percentComplete = 25% (1/4 modules)

4. **User Completes All Modules**
   - completedModules = ["valuation-basics", "financial-modeling", "macro-economics", "investment-writing"]
   - percentComplete = 100%
   - "Take Final Exam" button appears

5. **User Takes Final Exam**
   - Eligibility check passes
   - Exam starts, 60-minute timer
   - User answers 20 questions
   - Submit exam

6. **Exam Grading (Pass)**
   - Score: 80% (16/20 correct)
   - passed = true (≥ 75%)
   - Path marked COMPLETED
   - Certificate generated
   - Badge unlocked

7. **Exam Grading (Fail)**
   - Score: 70% (14/20 correct)
   - passed = false (< 75%)
   - Show results + weak areas
   - 24-hour cooldown starts
   - Path remains "In Progress" (not complete)

---

## 9. Progress Tracker Logic (Component Integration)

### ProgressTracker Component Display

```typescript
// For each path:
const totalModules = PATHS_CONTENT[pathId].deepDive.skills.length
const completedModules = getUserCompletedModules(userId, pathId)
const percentComplete = (completedModules.length / totalModules) * 100

// Check final exam status
const examPassed = getExamStatus(userId, pathId).passed

let pathStatus: 'locked' | 'available' | 'in_progress' | 'completed'

if (calibrationConfidence < 60) {
  pathStatus = 'locked'
} else if (completedModules.length === 0) {
  pathStatus = 'available' // Can start
} else if (completedModules.length < totalModules || !examPassed) {
  pathStatus = 'in_progress'
} else {
  pathStatus = 'completed'
}
```

### Display Logic

| Status | Badge | Button | Progress Bar |
|--------|-------|--------|--------------|
| locked | 🔒 Locked | "Take Calibration Quiz" | 0%, grayed out |
| available | ✨ Available | "Start Module 1" | 0%, active |
| in_progress | 🔄 In Progress | "Continue" or "Take Final Exam" | X%, active |
| completed | ✅ Completed | "Review" or "Download Certificate" | 100%, green |

---

## 10. Implementation Checklist

### Backend Requirements

- [ ] `UserPathProgress` table/collection
  - userId, pathId, completedModules[], percentComplete, startedAt, completedAt
- [ ] `ModuleCompletion` table
  - userId, moduleId, completedAt, quizScore, quizAnswers
- [ ] `ExamAttempt` table
  - userId, pathId, attemptDate, score, passed, answers, timeSpent
- [ ] API: `POST /api/paths/:pathId/modules/:moduleId/complete`
- [ ] API: `POST /api/paths/:pathId/exam/start`
- [ ] API: `POST /api/paths/:pathId/exam/submit`
- [ ] API: `GET /api/paths/:pathId/exam/eligibility`

### Frontend Requirements

- [ ] Import `FINAL_EXAMS` from `lib/final-exams.ts`
- [ ] Create `<FinalExam>` component with timer
- [ ] Update `<ProgressTracker>` to show exam status
- [ ] Update `<PathRoadmap>` to conditionally show "Take Final Exam" button
- [ ] Create `<ExamResults>` modal with detailed breakdown
- [ ] Create `<Certificate>` component for download
- [ ] Handle cooldown UI (countdown timer)

---

## 11. Exam Question Design Principles

All final exam questions follow these rules:

### NO Trivia
❌ Bad: "In what year was the DCF model invented?"
✅ Good: "Calculate Terminal Value given FCF, WACC, and growth rate."

### Scenario-Based Over Definitional
❌ Bad: "What does VWAP stand for?"
✅ Good: "You need to execute a large order in a stock with morning volume spike. VWAP or TWAP?"

### Realistic Professional Context
✅ Questions mirror real job scenarios
✅ Multi-step reasoning required
✅ Trade-offs and judgment calls

### Difficulty Distribution
- 0% Easy (module quizzes covered basics)
- 60% Medium (application)
- 40% Hard (synthesis, judgment, calculation)

### Calculations Included
- 20-30% of questions require math
- Test formula knowledge + application
- Provide calculation steps in explanations

---

## 12. Quality Metrics

### Path Completion Rate Target
- **Goal:** 40-60% of users who start a path complete it
- Below 30%: Path too hard or unclear
- Above 70%: Path too easy or exam not rigorous

### Final Exam Pass Rate Target (First Attempt)
- **Goal:** 50-65%
- Below 40%: Exam too hard, review questions
- Above 75%: Exam too easy, increase rigor

### Median Attempts to Pass
- **Goal:** 1-2 attempts
- If median > 3: Exam may be unfairly hard or modules not preparing well

---

## System Design Summary

**Calibration** → **Unlock Paths** → **Complete Modules** → **Unlock Final Exam** → **Pass Exam** → **Path Completed**

Every step has clear validation rules. No shortcuts. No ambiguity.

This is production-ready specification.
