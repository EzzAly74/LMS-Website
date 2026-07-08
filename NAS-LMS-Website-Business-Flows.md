# NAS LMS — Learner Website: Business Decisions & Confirmed Rules

**Status:** Awaiting user confirmation before building  
**Date:** July 2026 (updated)  
**Role context:** Product Designer Lead + LMS Specialist review session

---

## 1. What We Are Building

The NAS LMS Learner Website is a browser-based learning surface for NAS employees. It is one of three surfaces in the NAS LMS ecosystem (Dashboard for admins/instructors, Learner Website for employees on desktop/browser, Mobile App for employees on the go).

It uses the **NAS Design System** tokens exclusively — no hardcoded values.

---

## 2. Surfaces Overview

| Surface | Audience | Purpose |
|---|---|---|
| Dashboard | Admin, Instructor, Super Admin | Course creation, management, grading, reporting — reference only, not built here |
| Learner Website | Employees (browser) | Course discovery, active learning, assessments, certification, messaging |
| Mobile App | Employees (iOS + Android) | Enrolment, attendance passcode, progress overview, certificates |

All three surfaces share the same learning records. Actions taken on one surface are immediately reflected on the others.

---

## 3. Navigation Shell

- **Pattern:** Top navigation bar (standard website style)
- **Language switcher:** EN / AR dropdown in the top nav bar

### Confirmed nav bar items (left → right)

| Item | Visible when | Notes |
|---|---|---|
| Catalogue | Always | Public catalogue on landing, full catalogue once logged in |
| My Learnings | Logged in only | Direct entry point to the learning hub — see Section 5.2. Hidden/disabled state for logged-out visitors |
| Who We Are | Always | Public company/platform info. *Page content not yet designed — placeholder page for now* |
| Blogs | Always | Public content, SEO surface. *Page content not yet designed — placeholder page for now* |
| Language (EN/AR) | Always | Dropdown, not a page |
| Notifications (bell icon) | Logged in only | Badge with unread count — see Section 9 |
| Login | Logged out only | Replaced by profile avatar/menu once logged in. **Logout is not a nav bar item** — it lives as an action inside the Profile avatar menu (alongside Settings, etc.), never swapped into the top-level bar |
| Request a Demo | **Always** — logged in and logged out | Persistent CTA, does not disappear after login. Treated as a button, not a text link, per Fitts's Law (largest, highest-contrast target in the bar since it's the conversion goal) |

> **Note:** *Who We Are* and *Blogs* stay visible in the nav bar. Their page content is not yet designed, so both link to a placeholder ("coming soon") page for now.

### Heuristics applied
- **Consistency and standards** — nav pattern matches the parent HR app shell so the LMS never feels like a separate product
- **Recognition over recall** — persistent nav means the learner never has to remember where things live
- **Flexibility and efficiency of use** — "My Learnings" as a direct nav item lets returning employees skip Profile entirely and jump straight to active work (frequent task, shortest path — Fitts's Law)
- **User control and freedom** — logout tucked inside the Profile menu (rather than a top-level nav swap) keeps the bar stable and puts the destructive/session-ending action one deliberate click away from the everyday nav, rather than sitting where "Login" used to be

### Risk flagged
- Only **one** item swaps on login: Login → Avatar/Profile menu. Everything else in the bar (including Request a Demo) stays fixed. This must be a clean state swap, not a layout shift — test for **visibility of system status** (is it obvious the person is now logged in?) and avoid content jumping on login transition
- Keeping "Request a Demo" visible after login is an intentional deviation from typical logged-in-app patterns (most products hide top-of-funnel CTAs once a person converts) — confirm this is meant for cases where an existing employee's manager/HR contact might also be a prospect for expanding the platform elsewhere in the company; otherwise it risks cluttering the bar for a user who has no reason to ever click it again

---

## 4. Landing Page (Non-Logged-In State) — *Not yet designed*

Removed from this document — including the Hero, Personalization Statement, "How We Differ" video section, Testimonials, FAQs, and Contact Us — pending design. Re-add once designed.

---

## 5. Screen: Profile

**Purpose:** "Who am I, what qualifications does my role require, and where do I stand on everything I'm learning?"

Profile is the employee's personal home inside the platform (landed on immediately after login) and is also the **secondary entry point** to the LMS from within the parent HR app (primary entry is the Services section — see the UX framework's app hierarchy). Profile has two areas:

- **5.1 Qualifications** — role requirements and the courses tied to each
- **5.2 My Learnings** — everything the employee is actively working through, has finished, or has coming up

### 5.1 Qualifications

**What it shows**
- Profile photo (pulled from the employee's NAS app profile image)
- Employee ID number
- Job title
- List of qualifications required for their role

**Each qualification expands to show its related courses, grouped by state:**

| State | Meaning | What's shown |
|---|---|---|
| **Certified** | Employee already holds a certificate for a course tied to this qualification | Course name, certificate earned date, link to certificate (opens in My Learnings → Completed) |
| **Active** | Employee is currently enrolled in a course tied to this qualification | Course name, progress snapshot, link to My Learnings → Current |
| **Available to enrol** | Employee has not enrolled, but an open cohort exists right now | Course name, next cohort start date, **Enrol Now** CTA |
| **Not currently available** | Employee has not enrolled, and no open cohort exists | Course name, status label only — no CTA (matches existing "No open courses" rule) |

This replaces the old flat four-status list (Earned / In progress / Not started / No open courses) with the same underlying states, now expressed as **courses grouped under each qualification** rather than a single qualification-level status — because a qualification can have more than one course path, and the employee needs to see all of them, not just one collapsed state.

### Rules (carried over, confirmed)
- No pre-LMS qualifications. All qualifications are earned through this platform only — no external import
- Prerequisite blocking is NOT enforced in V1. All open cohort courses are freely enrollable
- If no cohort is open for a course: show "Not currently available" status label only — no enrol CTA

#### Heuristics applied
- **Recognition over recall** — grouping courses under the qualification they serve means the employee never has to remember which course maps to which requirement
- **Match between system and real world** — mirrors how HR/managers already think about role requirements (qualification-first), not how a course catalogue is organized (course-first)

#### Risk flagged
- Four course states per qualification, potentially several qualifications per employee, is a lot of information density. **Progressive disclosure** is required here: qualifications load collapsed by default, showing only the qualification name + a compact status summary (e.g., "2 certified · 1 active · 1 available"); expanding reveals the individual course cards.

---

### 5.2 My Learnings

**Purpose:** "What am I working on, what's coming up, and what have I completed — and can I act on it right now without leaving this screen?"

Reachable from Profile (as a tab) and directly from the top nav bar (Section 3) — same screen, two entry points, per the confirmed nav.

**Three filters:** Upcoming / Current / Completed. Each shows the course name and its status. (Full behavioral detail per state — progress bars, module tracking, certificate logic, rating prompts — is documented in Section 7, which this filter set maps directly onto: Upcoming = 7.1, Current = 7.2–7.3, Completed = 7.6.)

**Right-hand rail (persistent across all three filters):**
- **Attendance action widget:**
  - If the current course's live session has started → **"Mark Present"** CTA (same trigger and passcode behaviour as Section 7.4)
  - If no session is currently live → **"Next session: [date, time]"** — the upcoming session for the employee's active course(s)
- **Mini calendar (this week):** compact 7-day view showing any sessions scheduled this week across all the employee's enrolled courses. Tapping a day/session jumps to that course's detail

#### View Details flow (from Current)

Clicking **View Details** on a course under Current opens the course's learning workspace:
- **Sessions list** — all sessions for this course's cohort, with dates and completion/attendance state per session
- **Achieved content** — what the employee has completed so far within this course (mirrors the module tracker from Section 7.2)
- **Continue My Learning** — primary CTA that resumes at the next incomplete module, quiz, or assignment (the "playlist," see below)
- **Right rail on this screen:** attendance summary for this course + the certificate status alert ("On track" / "At risk" / "Blocked" / "Earned" — same logic as Section 7.5)

**The "playlist":** within a course's detail, content, quizzes, and assignments are presented as a single ordered playlist (not three separate lists the employee has to reconcile manually) — video/PDF/article modules, quiz cards, and assignment cards appear in the sequence the instructor defined, each with its own completion state per Section 7.3 and 7.6. "Continue My Learning" always resumes at the first incomplete item in this playlist.

#### Heuristics applied
- **Visibility of system status** — Mark Present / Next session widget always shows the employee's real-time state without needing to open the course
- **Recognition over recall** — mini calendar surfaces "what's happening this week" without the employee having to check each course individually
- **Flexibility and efficiency of use** — two entry points (Profile tab, direct nav item) let frequent users skip a step; Fitts's Law applies to "Mark Present" specifically, since it's the single most time-sensitive action on the screen and should be sized/positioned accordingly (large, fixed position in the rail, not buried in a menu)
- **Consistency and standards** — playlist ordering and completion iconography must match exactly between My Learnings and the View Details screen — same visual language, no re-learning

#### Risk flagged
- Packing filters + right rail (attendance widget + mini calendar) onto one screen risks **aesthetic and minimalist design** violations on smaller viewports. Right rail should collapse below the main list on narrower widths rather than compress in place, and RTL must mirror the entire layout (right rail moves to the left in Arabic, not just its text)
- "Mark Present" and "Next session" occupying the same widget slot must be an unambiguous state swap — flag for **visibility of system status** testing so a learner can't mistake "next session" text for an inactive present button

---

## 6. Screen: Course Catalogue

**Purpose:** "What courses are available for me to enrol in?"

### What it shows
- All active courses with an open cohort (no open cohort = not shown)
- Search by: course title, qualification tag, or category
- Filter chips by category

### Category rules
- Categories are created and assigned by the admin in the dashboard — not hardcoded
- Courses do NOT require a category — a course can exist with no category assigned
- Filter options must include: all defined categories + **"Uncategorised"** as an explicit filter option
- Filters also include: qualifications assigned to the logged-in employee's job title

### Course card shows
- Title
- Qualification tags (overflow pill for 3+)
- Aggregate rating (from all previous cohort ratings)
- Next cohort start date
- Delivery type: Online / Offline / Blended / External Link

### Course detail page shows
- Title and full description
- Cohort start and end dates
- Number of sessions
- Instructor name
- Delivery type
- Qualifications this course earns
- Module list — names and session count only (content not visible before enrolment)

### Enrolment CTA states
| State | CTA label |
|---|---|
| Open cohort, seats available | Enrol Now |
| Enrolment window closed | Enrolment Closed — Notify me for next cohort |
| Already enrolled | Enrolled ✓ |

### "Notify me for next cohort" behaviour
When an employee taps this CTA:
- Their interest is saved to their learner profile
- When the admin opens enrollment for the next cohort of this course in the dashboard, a notification is automatically sent to all employees who registered intent
- The notification reads: "[Course name] is now open for enrollment. Enrol now."
- No confirmation screen is needed after tapping — a brief toast ("We'll notify you when the next cohort opens") is sufficient

---

## 7. Screen: My Learnings — Detailed Behaviour

**Purpose:** "What am I working on, what's coming up, and what have I completed?"

> This section is the full behavioral spec behind the My Learnings screen introduced in Section 5.2 (Upcoming/Current/Completed filters, right-hand rail, View Details flow). Section 5.2 is the entry-point summary; this section is the detail reference for product and design.

This is the most important screen. Organised into three tabs/states.

### 7.1 Upcoming
- Courses enrolled whose cohort start date has not passed
- Shows: course name, start date, countdown ("Starts in X days")
- Content is locked until start date

### 7.2 Current
Each current course shows:
- **Progress bar** — percentage of modules completed (video, PDF, article, external link) out of total modules in the course. This is module completion progress only — separate from certificate requirements.
- **Certificate status indicator** — a separate tag/label below the progress bar showing: "Certificate: On track / At risk / Earned / Blocked." This is driven by the certificate configuration set in the dashboard.
- **Module tracker** — each module listed with status: Completed / Not started / In progress
- **Quiz and assignment cards** — one per assessment item, status: Not started / In progress / Submitted / Graded
- **Rating prompt** — appears as soon as the course start date has passed, remains visible until the employee submits a rating (intentional — captures mid-course sentiment, not just post-completion)
- **Mark Present CTA** — appears ONLY when the instructor has started a live session on the dashboard for this specific course. Disappears as soon as the session ends or the passcode is used

### 7.3 Module completion tracking

| Module type | Completion signal |
|---|---|
| Video | Tracked automatically where reliable completion tracking is available. Where not: prompt appears — "Did you complete this video?" (Yes / No). Confirming Yes advances the tracker. |
| PDF / Article | Same prompt: "Did you read this article?" (Yes / No) |
| External link | Employee clicks "Mark as complete" manually after visiting the URL. No proof upload required. |

This mirrors how LinkedIn handles external job applications — ask, don't assume.

### 7.4 Live session attendance
- Instructor starts a session on dashboard → passcode auto-generated → push notification sent to all enrolled learners
- "Mark Present" CTA appears simultaneously on the course card (website) and the mobile app
- Employee enters the passcode on either surface — whichever they have open
- Attendance recorded once regardless of which surface was used
- Instructor's dashboard updates in real time

### 7.5 Certificate logic
Certificate is generated automatically when all required course items are complete AND the configured thresholds are met. Configuration is set per course on the admin dashboard. Three modes:

| Mode | Rule |
|---|---|
| Attendance only | Employee must meet the attendance threshold across all live sessions |
| Score only | Employee must achieve a minimum score across all graded assessments and quizzes |
| Attendance and score | Both thresholds must be met |

**Progress bar** shows module completion progress (independent of certificate mode).  
**Certificate status tag** shows whether the employee is on track for the certificate based on the configured mode.

When a certificate is generated: a notification fires, the certificate appears in the Completed tab, available for PDF download.

When a certificate is blocked, a specific message is shown:
- "You did not meet the required attendance threshold for this course."
- "Your score did not meet the minimum required for this course."
- "You did not meet the required attendance and score thresholds for this course."

All blocked states also show: **"Your instructor can unlock a retake."**

There is no standalone Certificates page. Certificates are accessed from the Completed tab of My Learnings, attached to the relevant course card.

### 7.6 Completed
- Shows: completion date, final score (if applicable), certificate status
- Certificate earned: Download button (PDF)
- Certificate blocked: Specific reason message + retake message

### 7.7 Course rating

| Emoji | Label | Comment required? |
|---|---|---|
| 😄 | Very satisfied | Optional |
| 🙂 | Satisfied | Optional |
| 😐 | Neutral | Mandatory |
| 😕 | Unsatisfied | Mandatory |
| 😞 | Not satisfied at all | Mandatory |

Rating appears from course start date and stays until submitted.

---

## 8. Screen: Inbox

**Purpose:** "Communicate with my instructor or admin without switching platforms."

### Layout
- Left panel: contact list
- Right panel: message thread
- Text only — no attachments, no file sharing

### Who the employee can message
- **Instructors:** any instructor of a course they are enrolled in (upcoming, current, or completed). Thread remains open for 1 month after course end. After that: read-only. Label shown: "Messaging closed — course ended [date]."
- **Admins and Super Admins:** all admins are visible in the contact list and can be messaged at any time

### Contact list
- Search bar to filter contacts by name
- Filter: All / Instructors / Admins / Super Admins
- Admin contacts are distinguished by a badge (role label)
- Employee can initiate — they do not need to wait for the other party

### Conversation rules
- Admin-initiated messages appear in the employee's inbox
- If a course changes instructor between cohorts: old thread is readable history, new cohort thread is separate
- After 1 month from course end: instructor thread becomes read-only, input field hidden, status label shown

---

## 9. Screen: Notifications

**Purpose:** "See what's changed without checking every screen manually."

- Badge on nav icon shows count of unread notifications
- A notification is marked read only when the employee taps it directly — not on page open
- Notifications are delivered to both website and mobile app simultaneously

### Confirmed notification triggers
| Event | Message |
|---|---|
| New inbox message | "[Name] sent you a message" |
| Certificate generated | "Your certificate for [Course] is ready. Download it now." |
| Certificate blocked | "You didn't receive your certificate for [Course] because [specific reason]." |
| Assignment graded | "Your assignment for [Course] has been graded. Score: [X]." |
| Live session started | "[Course] session is now live. Enter your attendance code." |
| Next cohort open (subscribed) | "[Course] is now open for enrollment. Enrol now." |

---

## 10. Assessment System

Quizzes and assignments share the same four question types.

### Question types

**Multiple choice (MCQ)**
- 2–5 options, exactly one correct
- Tapping selects. Submit button confirms.
- Immediate feedback on submission (correct answer shown, including when wrong)
- Score: full points correct / 0 wrong / no partial marks

**Yes / No**
- Two large equal-width tap targets: Yes / No (or True / False — set by instructor)
- Tapping both selects AND submits — no separate confirm step
- Immediate feedback
- Score: full or 0

**Short answer**
- Open text field, 500-character limit
- On submission: locked, "Pending grade" status shown
- Instructor grades manually on dashboard, adds optional written feedback
- When instructor publishes grade: notification sent to employee, score and feedback shown alongside original answer
- Only question type without automatic grading — only one that creates a grading task for the instructor

**Reorder (sequence)**
- Shuffled list, employee arranges into correct order using up/down arrow buttons (no drag-and-drop — accessibility and mobile parity reason)
- Score is **proportional**: total question score ÷ number of items = score per correctly placed item
  - Example: 10-point question with 5 items = 2 points per correctly placed item
  - Getting 4/5 correct = 8 points
- On submission: each item shows whether it was correctly placed

### Quiz timer *(Product dependency — see Section 12)*
- Timer is optional, set per quiz by the instructor on the dashboard
- When enabled: countdown shown prominently during the quiz
- Warning shown at 2 minutes remaining
- On timeout: **auto-submit with score for already-answered questions, 0 for unanswered ones**

### Quiz state on disconnection *(Product dependency — see Section 12)*
- Quiz progress is saved after each question is answered
- If the learner closes the browser and returns, they resume at the last unanswered question
- If a timer is active, it continues from where it left off

### Score calculation
- Auto-graded questions: score calculated and shown immediately on results page
- Results page shows: total score, pass/fail status, per-question breakdown with correct answers
- Short answer: shown as "Pending" in results until instructor grades
- Short answer grade contributes to total score once published

---

## 11. Cross-Platform Behaviour

| Behaviour | Rule |
|---|---|
| Enrolment sync | Enrol on app = immediately enrolled on website, and vice versa |
| Progress sync | Module completed on website = immediately reflected on app, no manual refresh |
| Attendance sync | Passcode entered on either surface = attendance recorded once, reflected everywhere |
| Certificate sync | Certificate generated = available on website (download) and visible on app simultaneously |
| Notification delivery | Delivered to both surfaces. If both are open, notification appears on both |

---

## 12. Cross-Surface Product Dependencies — To Be Added / Confirmed

These are items identified during the learner website design that require matching admin/instructor workflows. They must be confirmed with the dashboard owner so the learner experience works as intended.

### GAP 1 — Quiz timer configuration
**Missing:** The quiz creation form on the dashboard has no timer field.  
**Required:** Optional timer field per quiz (minutes). When set, the learner website displays a countdown. On timeout, auto-submit fires.  
**Impact:** The learner quiz timer cannot be offered until instructors have a way to set it.

### GAP 2 — Quiz state persistence (resume mid-session)
**Missing:** The current quiz flow only retains the final submission, not per-question progress.  
**Required:** Each learner's quiz attempt must retain the answer to each question as it is submitted, so the learner can reconnect and resume from the last unanswered question.  
**Impact:** Without this, a disconnected learner loses all progress and must restart. Bad experience, especially for long quizzes.

### GAP 3 — Instructor session scheduling (conflict detection)
**Missing:** The dashboard has no structured scheduling experience for instructors. Instructors currently define sessions without specifying exact date/time slots, making conflict warnings impossible.  
**Required:**  
- Instructors must input specific date + time + duration for each live session when creating a cohort
- The LMS must compare each enrolled learner's sessions across all courses
- If a conflict is detected: show the instructor a soft warning — *"X enrolled learners have a session conflict with [Other Course] at this time. You can proceed or reschedule."* (not a hard block)
- Session schedule must also be visible in the mobile app so employees can plan  
**Impact:** Without scheduled sessions, the Schedule page (V2) also cannot be offered. This is a foundational planning gap.

### GAP 4 — "Notify me for next cohort" intent storage
**Missing:** No confirmed workflow exists for remembering which learners want to be notified when a course's next cohort opens.  
**Required:** When a learner taps "Notify me for next cohort," their interest is saved for that course. When the admin opens enrollment for a new cohort, a notification is sent to all interested learners.  
**Impact:** The "Notify me" CTA on the website becomes a dead end without this confirmed workflow.

---

## 13. V1 Scope — What We Are Building

| Screen | Status |
|---|---|
| Profile — identity + qualifications | V1 |
| Course Catalogue | V1 |
| Profile — Qualifications + My Learnings (Upcoming / Current / Completed) | V1 |
| Inbox | V1 |
| Notifications | V1 |
| Assessment system (MCQ, Yes/No, Short Answer, Reorder) | V1 |

---

## 14. V2 Backlog — Explicitly Out of Scope

| Feature | Reason deferred |
|---|---|
| Public landing page (non-logged-in), incl. Contact Us | Not yet designed |
| Who We Are | Not yet designed |
| Blogs | Not yet designed |
| Schedule page | Blocked by dashboard GAP 3 — individual session dates not yet confirmed |
| Prerequisite blocking / RPL flow | Learner-facing block and exception submission UI not yet designed |
| AI learning agent | Product, UX, and operational feasibility review required |
| Manager view (mobile app) | Separate surface, planned for V2 |
| Extended question types (match pairs, hotspot, fill-in-blank, scenario) | Out of phase scope |

---

## 15. UX Non-Negotiables

- **WCAG 2.1 AA** on all screens — contrast, focus rings, screen reader labels, no color-only indicators
- **Minimum 44×44px** touch target on all interactive elements
- **RTL (Arabic) is first-class** — every screen element must support RTL from day one, not be added later. Layout direction, text alignment, icons, and progress bar direction all flip. Font switches to Almarai. Sizes and line-heights do not change.
- **Fira Sans** for all English content. **Almarai** for all Arabic content. Never mixed within a text block.
- **No hardcoded values** — every color, spacing, radius, and typography value uses NAS Design System tokens

---

*Awaiting user confirmation before proceeding to skill creation and design.*
