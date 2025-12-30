# ZENITH MOBILE UX STRATEGY & IMPLEMENTATION PLAN

## 1. MOBILE NAVIGATION ARCHITECTURE

**Philosophy:** Navigation is a distinct, intentional act. It does not happen by accident. It does not clutter the decision viewport.

### The Model: "Hub & Spoke" (No Tabs)
We are moving from a web-style "browse" model to a mobile-native "task" model.

-   **The Hub:** `Command Center` (Home). This is the only place where you see the "Big Picture".
-   **The Spokes:** Specific operational modes (`Trading`, `Signals`, `Learning`, `Community`).
-   **The Mechanism:**
    -   **Top-Left Menu (Hamburger):** Holds global navigation. Out of the way until needed.
    -   **Contextual Entry:** You enter `Trading` by tapping a specific asset or "Execute" from Home. You enter `Community` by tapping a discussion card.
    -   **Back is Back:** Standard browser/native back behavior. No bespoke back buttons unless necessary.

### 🚫 REMOVED:
-   **Bottom Thumb Nav / CardNav:** Deleted. It eats vertical space and invites accidental clicks.
-   **Swipe-to-Change-Section:** Banned. Too fragile.

### ✅ NEW STRUCTURE:
-   **Header:** Fixed height (60px).
    -   *Left:* Menu (Lucide `Menu`)
    -   *Center:* Context Title (e.g., "Command Center", "BTC/USD", "Signals")
    -   *Right:* Context Action (e.g., "Profile", "Share", or nothing)
-   **Footer:** Decision Bar (Contextual).
    -   *Home:* Nothing (content flows to bottom).
    -   *Trading:* "Buy/Sell" or "Close Position" actions.
    -   *Signals:* "Copy Trade" action.

---

## 2. SCREEN HIERARCHY & PRIMARY ACTIONS

Every screen must answer: *"What is the ONE thing I do here?"*

| Screen | Primary Action (Green Button/Highlight) | Secondary Actions (Text/Ghost) | Hidden/Deferred |
| :--- | :--- | :--- | :--- |
| **Command Center** | **Drill Down** (Tap a card to see details) | Quick Note, Check Notifications | detailed settings, history |
| **Market/Asset** | **Trade** (Buy/Sell) | Add to Watchlist, View Chart | technical indicators, social feed |
| **Signals** | **Execute Signal** | Read Thesis, Share | historical performance details |
| **Community** | **Reply/Post** | Like, Share | room switching (in menu) |
| **Profile** | **Edit Settings** | Log out | badges display (secondary) |

---

## 3. ROBINHOOD-STYLE INTERACTION RULES

**The "Intentionality" Doctrine:**
Friction is good when money is moving. Friction is bad when browsing.

1.  **Read/Browse:** Zero friction. Taps open pages instantly.
2.  **Trade execution:** **High Friction.**
    -   Tap "Trade" -> Opens Form.
    -   Tap "Preview" -> Opens Confirmation Modal.
    -   Tap "Execute" (in Modal) -> Commits transaction.
    -   *Never* one-tap trade.
3.  **Destructive Actions (Close Position, Delete):**
    -   Requires **Radix Alert Dialog** (Red).
    -   "Are you sure?" confirmation.

---

## 4. BOTTOM-OF-SCREEN STRATEGY

The "Thumb Zone" is for **DECISIONS**, not Navigation.

-   **✅ ALLOWED:**
    -   Sticky "Buy / Sell" buttons (Trading).
    -   Sticky "Post" button (Community).
    -   Confirmation Toasts.
-   **🚫 BANNED:**
    -   Navigation Tabs.
    -   "Settings" toggles.
    -   Any non-critical action.

**Why?** When a user looks at the screen, their eye scans top-to-bottom. The final "output" of the screen should be at the bottom, ready for their thumb.

---

## 5. GESTURE POLICY

**Strict "No Surprises" Policy.**

-   **Tap:** Primary interaction. 44px min touch target.
-   **Scroll:** Vertical only. Standard friction.
-   **Pull-to-Refresh:** Allowed ONLY on "Live" feeds (Command Center, Community).
-   **❌ SWIPE:** BANNED for navigation. No swipe-to-back (unless browser native), no swipe-between-tabs.
-   **❌ LONG PRESS:** BANNED for core actions. No hidden menus.

---

## 6. VISUAL TONE (IMPLEMENTATION SPECS)

**Theme:** `Dark Mode` / "Void"
**Font:** `Inter` / `Geist Mono` (for numbers)

-   **Spacing:** Grid based on `4px`. Standard padding `16px` (mobile).
-   **Cards:**
    -   Background: `bg-white/5` (Glassmorphism lite).
    -   Border: `border-white/10`.
    -   Radius: `rounded-xl` or `rounded-2xl`.
-   **Typography:**
    -   Headers: `text-lg font-semibold text-white`.
    -   Body: `text-sm text-zinc-400`.
    -   Numbers: `text-base font-mono tracking-tight`.
-   **Buttons:**
    -   Primary: `h-12 bg-emerald-500 text-black font-bold rounded-lg`.
    -   Secondary: `h-12 bg-white/10 text-white font-medium rounded-lg`.
-   **Forms:**
    -   **Dropdowns:** INVALID! Use Full Screen Asset Pickers.
    -   **Inputs:** Native keyboard, auto-focus.

---

## 7. BACK BUTTON CONTRACT (iOS WILL CARE)

| Current State | Back Button Action | Rationale |
| :--- | :--- | :--- |
| **Browsing (Any Page)** | Go back to previous page | Standard navigation expectation. |
| **Swap Input** | Return to Asset Page | User is canceling the intent to swap. |
| **Swap Review** | Return to Swap Input | User wants to edit the amount/token. |
| **Waiting for Wallet** | **DISABLED** | Integrity lock. Must not interrupt signature. |
| **Trade Confirmation** | Return to Portfolio/Asset | Transaction complete context switch. |
| **Modal (Settings)** | Close Modal | "Back" = "Close" for interruptions. |

---

## 8. MOBILE SWAP UX ARCHITECTURE

**Philosophy:** Swaps are High-Stakes Operations. They demand total focus.

-   **Entry Point:** Contextual ONLY. You "Swap" an asset from its details page or from a Signal. There is no generic "Swap Tab".
-   **Isolation:** The Swap UI opens in a full-screen Modal or dedicated Route (`/swap` or `?mode=swap`).
    -   *Crucial:* Global Navigation (Hamburger) is **HIDDEN** during Swap AND Trade execution.
    -   *Reason:* Prevents accidental navigation away from the transaction.
-   **Exit Protocol:**
    -   Tapping "X" (Close) triggers a check.
    -   If inputs are dirty (user typed > 0), show Radix Alert: "Cancel Swap? Progress will be lost."
    -   If inputs are clean, close immediately.

---

## 9. MOBILE SWAP FLOW (STEP-BY-STEP)

**The 5-Step Friction Funnel:**

1.  **Selection (The "What"):**
    -   Asset Picker opens first if not pre-selected.
    -   List is searchable. Tap to select. No swipes.
    -   **Note:** Native Select Dropdowns are BANNED. Use Full Screen Modal Pickers.

2.  **Input (The "How Much"):**
    -   Focus lands on "Amount" field.
    -   Numeric Keypad (Native) active.
    -   **Real-time Feedback:** display "Est. Receive" and "Network Fee" instantly as they type.

3.  **Review (The "Sanity Check"):**
    -   User taps "Review Order" (Bottom CTA).
    -   Keyboard dismisses.
    -   UI shifts to "Quote Mode".
    -   **MANDATORY DISPLAY:**
        -   Token In & Amount
        -   Token Out & Amount
        -   Network Fee (in USD)
        -   Slippage Tolerance (e.g. 0.5%)
        -   Price Impact (if high)
        -   Route Provider (e.g. 0x)

4.  **Confirmation (The "Commit"):**
    -   Button changes to "Confirm Swap" (Solid Green).
    -   **Interaction:** Tap. (Consider "Hold to Swap" for max safety, but Tap is standard if Step 3 exists).
    -   *No one-tap buys.*

5.  **Signature (The "Handover"):**
    -   App shows "Waiting for Wallet..." spinner.
    -   User is taken to Wallet App (if mobile) or Modal (if embedded).
    -   On return: Success or Failure screen.

---

## 10. BOTTOM-OF-SCREEN RULES FOR SWAP

The "Thumb Zone" changes state with the flow.

-   **State A: Typing Input**
    -   Keyboard is visible (occupies bottom 40%).
    -   Sticky Bar *above keyboard* shows "Preview" button (Disabled if 0).

-   **State B: Review Mode**
    -   **Primary CTA:** "Confirm Swap" (Full Width, Emerald).
    -   **Secondary Link:** "Edit Amount" (Text link under button).
    -   **BANNED:** Navigation tabs, Chat bubbles, "Home" button.

---

## 11. FAILURE & EDGE CASE UX (MOBILE)

**Principle:** Calmness in Error. Never Panic.

-   **Wallet Rejected:**
    -   **Visual:** Neutral Toast (Grey/White), *Not* Warning Red.
    -   **Text:** "Transaction declined by wallet."
    -   **Action:** Stay on Review screen. Retry button active.

-   **Slippage Spike:**
    -   **Visual:** Inline Yellow Badge near Price.
    -   **Interaction:** "Review" button resets to "Update Price".
    -   User *must* tap "Update Price" before "Confirm" reappears.

-   **Insufficient Balance:**
    -   **Visual:** Input field border turns red.
    -   **Text:** "Max available: 1.2 ETH" appears below input.
    -   **CTA:** Button becomes "Insufficient Funds" (Disabled).

-   **Network Mismatch:**
    -   **Action:** CTA becomes "Switch Network".
    -   Tapping it triggers `wagmi` switch chain.

---

## 12. SWAP SAFETY & TRUST SIGNALS

**Visual Language of Trust:**

-   **Typography:** All financial figures in `Geist Mono` or `Inter` (tabular nums).
-   **Transparency:**
    -   Fee line item: "Incl. $2.50 network fee".
    -   Provider: "Route: Uniswap V3".
-   **Success State:**
    -   Clean card: "Transaction Submitted".
    -   Details: Hash (truncated), Link to Explorer.
    -   **Action:** "Done" button returns to Asset Page.
    -   *No confetti or gamification.* This is a financial tool, not a game.

---

## 13. IMPLEMENTATION PLAN (REVISED)

### Step 1: Nuclear Option
-   Delete `CardNav.tsx` usage from `app/layout.tsx`.
-   Ensure `Navbar.tsx` is simplified for mobile (Hamburger only).

### Step 2: Component Restructuring
-   Create `components/mobile/MobileHeader.tsx`.
-   Create `components/mobile/MobileMenu.tsx` (using Radix Dialog or Sheet).
-   Refactor `CommandCenter` to stack vertically on mobile (`flex-col`).

### Step 3: Interaction Hardening
-   Install `@radix-ui/react-dialog`.
-   Replace all `window.confirm` or custom modals with Radix.
-   Ensure `Link` components map to the new route structure.

### Step 4: Verification
-   Test on Mobile Viewport (Chrome DevTools).
-   Verify NO horizontal scroll.
-   Verify all touch targets >= 44px.
