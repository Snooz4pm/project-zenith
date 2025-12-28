/**
 * INTEGRATION EXAMPLE
 *
 * This file shows exactly how to add the Course Notes system
 * to your existing course page.
 *
 * Copy the relevant sections into app/learn/[courseId]/page.tsx
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

// Import the new components
import CourseScratchPad from '@/components/learning/CourseScratchPad';
import CoreConceptsPanel from '@/components/learning/CoreConceptsPanel';
import ScrollNudge from '@/components/learning/ScrollNudge';
import { saveCourseNote } from '@/lib/actions/notebook';

// Example Core Concepts Data (customize per module)
const CORE_CONCEPTS_BY_MODULE: Record<string, any[]> = {
  'liquidity': [
    {
      term: 'Market Depth',
      definition: 'The market's ability to sustain large orders without causing significant price movement. Measured by volume available at each price level.',
      importance: 'critical' as const
    },
    {
      term: 'Bid-Ask Spread',
      definition: 'The difference between the highest price a buyer is willing to pay (bid) and the lowest price a seller will accept (ask). Tighter spreads indicate higher liquidity.',
      importance: 'critical' as const
    },
    {
      term: 'Slippage',
      definition: 'The difference between the expected price of a trade and the actual execution price. More common in illiquid markets.',
      importance: 'important' as const
    },
    {
      term: 'Order Book',
      definition: 'Real-time electronic list of buy and sell orders organized by price level. Essential for assessing market depth.',
      importance: 'important' as const
    }
  ],
  'order-types': [
    {
      term: 'Market Order',
      definition: 'Executes immediately at the best available current market price. Guarantees execution but not price.',
      importance: 'critical' as const
    },
    {
      term: 'Limit Order',
      definition: 'Only executes at your specified price or better. Guarantees price but not execution.',
      importance: 'critical' as const
    },
    {
      term: 'Stop-Loss Order',
      definition: 'Triggers a market order when price reaches a specified level. Used to limit downside risk.',
      importance: 'important' as const
    },
    {
      term: 'Fill or Kill (FOK)',
      definition: 'Order must be executed immediately in its entirety or cancelled completely. No partial fills.',
      importance: 'good-to-know' as const
    }
  ],
  'risk-intro': [
    {
      term: 'Position Sizing',
      definition: 'The dollar amount or percentage of capital allocated to a single trade. Critical for risk management.',
      importance: 'critical' as const
    },
    {
      term: 'Risk-Reward Ratio',
      definition: 'The relationship between potential profit and potential loss on a trade. Professional traders target minimum 2:1.',
      importance: 'critical' as const
    },
    {
      term: 'Maximum Drawdown',
      definition: 'The largest peak-to-trough decline in account value. Key metric for evaluating strategy robustness.',
      importance: 'important' as const
    }
  ]
};

export default function CoursePageExample({ params }: { params: { courseId: string } }) {
  const { data: session } = useSession();
  const [activeModule, setActiveModule] = useState(0);

  // Your existing course data
  const courseId = params.courseId;
  const course = {
    title: 'Trading Fundamentals',
    modules: [
      { id: 'overview', title: 'The Genesis of Value' },
      { id: 'liquidity', title: 'The Role of Liquidity' },
      { id: 'order-types', title: 'Order Execution Flow' },
      { id: 'risk-intro', title: 'Risk Axioms' }
    ]
  };

  // Handler for saving notes
  async function handleSaveNote(content: string, metadata: any) {
    if (!session?.user?.id) {
      alert('Please log in to save notes');
      return;
    }

    const result = await saveCourseNote(session.user.id, content, {
      ...metadata,
      timestamp: Date.now()
    });

    if (result.success) {
      // Success feedback (optional toast instead of alert)
      alert('✓ Note saved to your Notebook');
    } else {
      alert('Failed to save note. Please try again.');
    }
  }

  // Get concepts for active module
  const currentModule = course.modules[activeModule];
  const currentConcepts = CORE_CONCEPTS_BY_MODULE[currentModule.id] || [];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white">

      {/* YOUR EXISTING COURSE CONTENT HERE */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <h1>{course.title}</h1>
        <div>
          {/* Your module content rendering */}
        </div>
      </main>

      {/*
        ========================================
        ADD THESE THREE COMPONENTS (ORDER MATTERS)
        ========================================
      */}

      {/* 1. Core Concepts Panel - Top Right */}
      {currentConcepts.length > 0 && (
        <CoreConceptsPanel
          concepts={currentConcepts}
          moduleTitle={currentModule.title}
        />
      )}

      {/* 2. Scratch Pad - Bottom Right */}
      <CourseScratchPad
        courseId={courseId}
        courseTitle={course.title}
        moduleId={currentModule.id}
        moduleTitle={currentModule.title}
        onSaveToNotebook={handleSaveNote}
      />

      {/* 3. Scroll Nudge - Bottom Center (OPTIONAL) */}
      <ScrollNudge
        onTriggerNotes={() => {
          // Optional: Add logic to programmatically open scratchpad
          // For now, nudge just suggests - user clicks button themselves
        }}
        threshold={1200}     // Show after 1200px scroll
        cooldown={45000}     // 45 seconds between nudges
      />
    </div>
  );
}

/**
 * CUSTOMIZATION TIPS:
 *
 * 1. Adjust Scroll Nudge threshold per module complexity:
 *    - Short modules (< 2000 words): threshold={800}
 *    - Long modules (> 5000 words): threshold={2000}
 *
 * 2. Define concepts per module difficulty:
 *    - Beginner modules: More 'critical' concepts
 *    - Advanced modules: More 'good-to-know' concepts
 *
 * 3. Disable features per course:
 *    - Exam prep: Remove ScrollNudge (less distraction)
 *    - Theory heavy: Keep all features
 *
 * 4. Position adjustments:
 *    - If you have other fixed elements, adjust z-index
 *    - ScratchPad: z-30
 *    - CoreConcepts: z-40 (backdrop) / z-50 (panel)
 *    - ScrollNudge: z-20
 */
