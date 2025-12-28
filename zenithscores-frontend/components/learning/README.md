# 📚 Course Notes System

**Professional note-taking for serious learning.**

This system adds **intentional, non-intrusive note-taking** to your course pages while reusing your existing Notebook infrastructure.

---

## 🎯 Core Philosophy

**NOT a second notebook. NOT auto-save.**

Users capture thoughts while reading → decide whether to save → notes go to main Notebook with full course context.

This forces **intentional note-taking** and avoids clutter.

---

## 📦 What's Included

### 3 Components

1. **CourseScratchPad** - Temporary notepad (local state)
2. **CoreConceptsPanel** - Collapsible reference sidebar
3. **ScrollNudge** - Optional scroll-based suggestion

### 2 Server Actions

- `saveCourseNote()` - Saves to existing `TradeJournal` model
- `getCourseNotes()` - Retrieves notes by course ID

### Full Documentation

- [INTEGRATION_EXAMPLE.tsx](./INTEGRATION_EXAMPLE.tsx) - Copy-paste ready code
- [COURSE_NOTES_INTEGRATION.md](../../COURSE_NOTES_INTEGRATION.md) - Complete guide

---

## ⚡ Quick Start (3 Steps)

### Step 1: Import Components

```typescript
import CourseScratchPad from '@/components/learning/CourseScratchPad';
import CoreConceptsPanel from '@/components/learning/CoreConceptsPanel';
import { saveCourseNote } from '@/lib/actions/notebook';
```

### Step 2: Add to JSX

```typescript
<CourseScratchPad
  courseId="trading-fundamentals"
  courseTitle="Trading Fundamentals"
  moduleId="liquidity"
  moduleTitle="The Role of Liquidity"
  onSaveToNotebook={handleSaveNote}
/>

<CoreConceptsPanel
  concepts={[
    {
      term: 'Liquidity',
      definition: 'Ease of buying/selling without price impact',
      importance: 'critical'
    }
  ]}
  moduleTitle="The Role of Liquidity"
/>
```

### Step 3: Handle Save

```typescript
async function handleSaveNote(content: string, metadata: any) {
  const result = await saveCourseNote(session.user.id, content, metadata);
  if (result.success) {
    alert('Saved to Notebook!');
  }
}
```

**Done.** Users can now take notes while reading.

---

## 🎨 UX Flow

1. User reads course content
2. Clicks "Take Notes" button (bottom-right)
3. Types in temporary scratchpad
4. After 20+ characters → "Save to Notebook?" prompt appears
5. User chooses:
   - **Save** → Goes to main Notebook with course context
   - **Discard** → Deleted forever
   - **Keep Draft** → Stays in scratchpad (session only)

**Key:** Nothing saved without explicit confirmation.

---

## 🗄️ Data Storage

Notes use your existing `TradeJournal` model:

```typescript
{
  type: 'course_note',
  title: 'Trading Fundamentals › Liquidity',
  liveLog: [{ content: "User's note text" }],
  marketContext: {
    source: 'course',
    courseId: 'trading-fundamentals',
    courseTitle: 'Trading Fundamentals',
    moduleId: 'liquidity',
    moduleTitle: 'The Role of Liquidity'
  },
  tags: ['course', 'trading-fundamentals', 'liquidity']
}
```

**No new tables. No migrations. Works immediately.**

---

## 🔧 Customization

### Disable Scroll Nudge
Simply don't include `<ScrollNudge />` component.

### Change Save Threshold
Edit in `CourseScratchPad.tsx`:
```typescript
if (currentNote.trim().length > 20) // Change 20 to your preference
```

### Adjust Positioning
All components use fixed positioning:
- ScratchPad: `bottom-6 right-6`
- CoreConcepts: `top-20 right-6`
- ScrollNudge: `bottom-24 left-1/2`

Change in each component's className.

---

## ✅ Production Ready

- ✅ TypeScript strict mode
- ✅ Error handling
- ✅ Server-side validation
- ✅ Responsive design
- ✅ Accessibility (keyboard nav)
- ✅ Terminal aesthetic (matches your brand)
- ✅ No breaking changes

---

## 📊 Component Specs

| Component | Position | Z-Index | Collapsible | Auto-Save |
|-----------|----------|---------|-------------|-----------|
| ScratchPad | Bottom-right | 30 | ✓ | ✗ |
| CoreConcepts | Top-right | 40-50 | ✓ | N/A |
| ScrollNudge | Bottom-center | 20 | Auto-hide | N/A |

---

## 🚨 Important Rules

### DO NOT:
- Auto-save notes
- Show modals
- Block content
- Add gamification
- Create duplicate notebook

### DO:
- Make everything collapsible
- Require explicit save confirmation
- Attach course metadata
- Maintain dark theme
- Keep it minimal

---

## 💡 Example Use Cases

### During Study
User reads about liquidity → jots down "Check AAPL bid-ask spread tomorrow" → saves to Notebook.

### Before Exam
User reviews all notes for course → filters by course ID in Notebook → studies saved concepts.

### Post-Lesson
User reflects on module → writes synthesis → saves as permanent note.

---

## 🎯 Success Metrics

**Good Signs:**
- Users write 2-5 notes per course
- 80%+ save rate (vs discard)
- Notes include personal context

**Bad Signs:**
- Users write 20+ notes per course (too cluttered)
- High discard rate (prompts too aggressive)
- Generic copy-paste definitions

**Goal:** Thoughtful, intentional note-taking.

---

## 🔗 Related Files

- `lib/actions/notebook.ts` - Server actions
- `prisma/schema.prisma` - TradeJournal model
- `app/notebook/page.tsx` - Main Notebook view
- `COURSE_NOTES_INTEGRATION.md` - Full integration guide

---

## 📞 Need Help?

See [INTEGRATION_EXAMPLE.tsx](./INTEGRATION_EXAMPLE.tsx) for working code.

All components are self-contained and documented inline.

**Ship it.** 🚀
