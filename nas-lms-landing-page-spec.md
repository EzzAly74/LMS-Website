# NAS LMS — Landing Page Dev Spec

**Figma source:** `https://www.figma.com/design/JnNkT9eeYmRiDOuapW4RKf/LMS?node-id=1716-25904`
File key `JnNkT9eeYmRiDOuapW4RKf`, root frame `1716:25904` ("nas-lms-landing-page"), 1440×5847.

This doc covers page structure, verbatim copy, and — per section — how to implement the motion. The Figma file has real prototype keyframes baked in (Framer-Motion-style, exported via `get_motion_context`); where useful those are translated into production-appropriate animation specs below, following [Emil Kowalski's animation guidelines](https://animations.dev) (easing, duration, transform/opacity-only, reduced-motion).

**Important:** the Figma prototype loops every element on a single 2.8s `repeat: Infinity` timeline — that's a Figma preview convenience, **not** the intended production behavior. **Nothing on this page should loop.** Every animation below is translated into a **one-shot** trigger — the hero types out once when the page/hero enters view, the testimonial cards animate in once when that section enters view, and so on. No continuous/ambient loops anywhere, including the quote carousel and the CTA background shapes.

---

## Global tokens

| Type | Values |
|---|---|
| Fonts | **Fira Sans** (Regular/Medium/SemiBold/Bold) — UI & body copy. **Source Serif Pro** (Italic/SemiBold Italic/Bold Italic) — pull-quote & testimonials. **Inter Bold** — numeric badges (step circles, avatar initials). |
| Type scale | 2XS 12/14.4, XS 14/16.8, S 16/19.2, M 18/21.6, XL 24/28.8, 2XL 32/38.8 (px, size/line-height). Hero/testimonials/CTA headlines use one-off 52–64px display sizes. |
| Colors | `primary/1000 #0c2427` (near-black teal — dark panels, footer, CTA) · `primary/700 #26787b` (brand teal — buttons, active chips) · `primary/500 #4cb4b5` · `additionally/500 #69c8e6` · `additionally/700 #58a7bf` · `essential/additionally #75deff` (bright cyan — accent text on dark bg) · neutrals `#8c8c8c`, `#e6e7e8`, `#f5f5f5`, `#171819` · page bg `#fffbf7`. |
| Base transition | `200ms cubic-bezier(0.23, 1, 0.32, 1)` (strong ease-out) for UI feedback; see per-section specs for exceptions. |

**Global animation rules (apply everywhere unless noted):**
- Animate only `transform` and `opacity` — never `width`/`height`/`left`/`top` directly (use `scaleX`/measured-height tricks instead).
- Keep UI micro-interactions ≤ 300ms; buttons press to `scale(0.97)`; never animate an enter from `scale(0)` — floor at `scale(0.95)`.
- All scroll-reveal entrances: `viewport={{ once: true, margin: "-100px" }}` (or equivalent IntersectionObserver, ~100px threshold) — fire once, never on every scroll pass, and never repeat/loop after firing.
- No looping/auto-repeating animation anywhere on the page — every section's motion plays once on entering the viewport (or once on page load for the hero) and then stays at rest.
- Respect `prefers-reduced-motion`: content entrances fall back to opacity-only (no translate/scale).

---

## 1. Header / Nav
Sticky, 68px, rounded 8px, drop shadow.

- Logo (NAS), nav links: **Catalogue · My Learnings · Who we are · Blogs**
- Two icon buttons (36px circular, bordered `#e6e7e8`); one carries a notification badge (cyan `#4cb4b5`, white border) showing **"3"**
- Profile avatar: teal circle, initials **"SA"**
- CTA button: **"Request a Demo"** (dark pill)

**Animation**
- Nav link hover: color transition 150ms ease-out.
- Notification badge: if count changes, pop with `scale 0.8→1.05→1` (~200ms, back-out easing) — don't loop or pulse continuously.
- Profile menu (if it opens a dropdown): 150–200ms, opacity + `scale(0.95→1)`, `transform-origin: top right`.

---

## 2. Hero
- **Typewriter headline** — two clipped lines that type in **once**, the first time the hero enters view:
  - "Learn anything and" (`#0c2427`, 54px Bold)
  - "master your role" (`#26787b`, 54px Bold)
- Subhead: *"Not a catalogue. A map. Built from your job title, pointing straight to the competences and courses that get you where you're going."*
- Button: **"Request a Demo Now"** + arrow-right icon
- Decorative illustration, right side

**Animation** — plays exactly once, on first entering the viewport (in practice this is on initial page load, since the hero is above the fold — implement it as a viewport-entry trigger, not a load event, so it stays correct if the hero is ever moved or lazy-mounted). It must not replay on subsequent scrolls back into view.
- Typewriter: reveal each line via a clip-path/width wipe, left→right, ~600–800ms per line, linear timing (typing should feel mechanical, not eased). Run a blinking caret (opacity step, ~530ms interval) only while typing is in progress; remove/hide it once both lines finish — it should not keep blinking indefinitely.
- On type-complete: subhead → button fade up (`opacity 0→1`, `translateY 12px→0`), staggered ~80ms apart, 250ms ease-out each. This fires once, right after typing, and does not repeat.
- Reduced motion: skip the typing wipe, show both lines immediately; keep the simple opacity fade-up for subhead/button.

---

## 3. Quote banner
Dark rounded panel (`primary/1000`, radius 64px).

- *"An investment in knowledge pays the **best interest**."* ("best interest" — Bold Italic, cyan `#75deff`)
- Attribution: **Benjamin Franklin**
- Carousel dots below → confirms this is one slide of a rotating quote set (only one slide's copy exists in the export — get remaining quotes from content team)

**Animation**
- No autoplay/looping — this is a manually-navigated carousel. Slide changes only on explicit user action (clicking a dot, or arrow controls if added).
- On slide change: crossfade text `opacity` 300–400ms, ease-out.
- Dot indicator: active-state color transition 150ms.
- On first entering the viewport: the visible slide fades/slides in once (same treatment as other section entrances), then stays put until the user navigates.

---

## 4. "How We Differ"

**Eyebrow/heading:** "How we differ" → **"One system, two connected views"** → *"A role or qualification set on the admin dashboard flows straight through to the courses each employee sees — automatically."*

### 4a. Video player
1120×630px, rounded 24px, gradient control-bar overlay.
- Title **"LMS Demo"** / subtitle **"Take a sneak peak"**, timestamp **"00:13 / 00:25"**
- Progress bar (two-layer: full-time track + fill)
- Controls: Play, ‑15s, +15s

**Animation**
- **Controls overlay is hidden by default.** The title ("LMS Demo"), subtitle ("Take a sneak peak"), timestamp, progress bar, and play/‑15s/+15s controls (the gradient/black overlay) only appear **on hover** (desktop) / **on tap** (touch). At rest, just the video frame/poster shows — no overlay.
  - Reveal: overlay `opacity 0→1`, ~150–200ms ease-out, on `mouseenter`.
  - Hide: `opacity 1→0`, ~150ms, on `mouseleave` — **except** keep the overlay visible whenever the video is paused (don't hide controls out from under a paused video). Only auto-hide while actively playing and the pointer isn't over the player.
  - Touch/mobile: tap toggles the overlay (no hover available); auto-hide after ~2–3s of inactivity while playing, same as the desktop mouseleave behavior.
- Play/pause icon: cross-fade/morph 150ms, no bounce.
- Progress fill: drive with `scaleX` (transform-origin left) each frame, not `width`, for perf.
- Skip buttons: press feedback `scale(0.97)`, 100ms down / 150ms up (asymmetric).

### 4b. 4-step tab strip (synced to video playback)
1. **Admin sets the role** (active by default, from `0ms`)
2. **System maps qualifications** — active from **`8130ms`**
3. **Instructor creates course** — active from **`14430ms`** (8130ms + 6300ms)
4. **Employee gets the course** — active from **`21130ms`** (14430ms + 6700ms), through to video end

Given values were "step 2 after 8130ms, step 3 after 6300ms, step 4 after 6700ms" — read as each step's own duration (time spent active before the next one triggers), not as four independent offsets from `0`, since 6300ms/6700ms are smaller than 8130ms and steps must fire in order. That gives the cumulative `currentTime` thresholds above. **Please confirm this reading against the final video cut** before wiring the thresholds — if the video's total runtime changes, these numbers need re-deriving from the new cut.

**Animation**
- Active indicator = a top-border underline; animate its position with `translateX` (not `left`), 200ms ease-out, as video `currentTime` crosses each step's threshold.
- Text/border color transition 200ms ease-out alongside.

### 4c. Role-switcher panel ("Define roles, build capabilities & grow your team")
- Role chips: **Branch Manager (active by default) · Sales Executive · Data Analyst · HR Specialist**
- Center "Job Title" card crossfades its value between roles
- Skill pills (connected by animated lines) — 2 qualifications per role
- Course cards, badge **"COURSE · EARNS QUALIFICATION"** — 2 courses per role

**Content matrix — what each chip shows on click:**

| Role | Qualification 1 | Qualification 2 | Course 1 | Course 2 |
|---|---|---|---|---|
| **Branch Manager** | Team leadership | Risk and compliance | "Leading high-trust teams" — Next · Wed 16 Jul | "Branch risk essentials" — Next · Thu 24 Jul |
| **Sales Executive** | Consultative selling | CRM proficiency | "Winning enterprise deals" — Next · Tue 14 Jul | "Salesforce for sales teams" — Next · Mon 20 Jul |
| **Data Analyst** | Data visualization | SQL for analysts | "Turning data into decisions" — Next · Wed 15 Jul | "Advanced SQL for analysts" — Next · Fri 18 Jul |
| **HR Specialist** | Employee relations | HR compliance | "Building strong employee relations" — Next · Tue 21 Jul | "HR compliance essentials" — Next · Thu 23 Jul |

**Responsive (mobile, node `1742:48113`):** same stacked-card layout, same click-triggered animation as desktop — chips row, job-title card, 2 skill pills, 2 course cards, all vertically stacked instead of side-by-side. Confirmed only 3 chips fit in the visible row at 390px width (Branch Manager, Sales Exec, Data Analyst) — HR Specialist chip needs a horizontal-scroll affordance on the chip row or a wrap-to-second-line treatment; flag to design which is intended.

**Recommendation — trigger this on click, not autoplay.** The Figma prototype animates this as a 2.8s auto-looping demo, but it's gated behind explicit chip buttons in the design — treat chip selection as the trigger, not a background loop; auto-swapping content next to clickable controls fights user intent.

**One-time auto-intro:** the first time this section enters the viewport, automatically trigger a single click on the **next** role chip (i.e. Branch Manager is shown by default, so auto-select Sales Executive) to play the swap animation once and show the user the panel is interactive. This fires **once per page load, on scroll-into-view** — not on a timer, not repeating, and it must not fire again if the user scrolls away and back. After this one auto-triggered swap, all further changes are click-only, same as everything else on the page.

**Animation** (feel translated from the Figma keyframes into a one-shot, click-triggered sequence, total ~500–700ms):
- Job-title label: `opacity` crossfade, 200ms.
- Skill pills: enter with `opacity 0→1`, `scale 0.88→1`, `translateX -20px→0`, staggered ~100ms apart, ease-out with a slight overshoot (`cubic-bezier(0.34, 1.56, 0.64, 1)` — matches the Figma "back" easing, reads as a natural pop).
- Connector lines: draw in via `scaleX 0→1` (transform-origin at the source node), same overshoot easing.
- Small dot/ellipse on each pill: brief overshoot scale (`0→1.4→1`, ~250ms) — a spring-style "landed" pulse, not a repeating pulse.
- Course cards: crossfade + scale (`0.92→1`) + slight `translateX`, second card staggered ~120ms after the first.
- Outgoing role's elements: fade out first (150ms) before the incoming ones animate in, to avoid overlap-jank.

---

## 5. "Next Step"
Centered H2 **"Next Step"**, vertical 3-step list with connecting line, screenshot mockups on the right.

1. **Book a demo** — *"Book a demo with our workforce consultants. We'll set you up a meeting to suit your team's needs."*
2. **Explore the system** — *"See the system in action to understand how it can empower your team, unlock employee potential, and elevate performance across the board."*
3. **Dedicated onboarding** — *"Get a fully tailored, ready-to-use system. A dedicated consultant will handle all your data entry and configuration for you."*

**Animation**
- Scroll reveal (once, ~100px viewport margin): each step fades + `translateY 16px→0`, staggered 100ms.
- Device mockup images: fade + slight `translateX` from their off-canvas side, same trigger.

---

## 6. "Proven By Actual Users" — Testimonials
Dark panel, eyebrow **"Testimonials"** (cyan), headline **"Proven By" / "Actual Users"** (64px).

Verbatim quotes captured:
1. *"We stopped hand-assigning courses. Set the role once, and every employee sees exactly the path their qualifications require."* — Manager name, Job Title
2. *"The perfect blend of theory and practice"* — Manager name, Job Title
3. *"The perfect blend of theory and practice—I finally feel confident in my new skillset"* — Manager name, Job Title
4. *"This course was a total game-changer, breaking down complex topics into actionable steps that helped me succeed immediately"* — Employee's name, Job Title
5. *"I walked away with practical, real-world skills that I started applying to my work the very next day"* — Employee's name, Job Title
6–8. Star rating + avatar + name only (no quote text in the export — confirm with content whether these need copy or the layout is intentionally mixed)

Cards sit in a scattered/collage layout in Figma (not a grid), each with a translucent white-10% card, 5-star image, teal avatar circle with initials, name, and job title.

**Animation** — the Figma data literally gives each card its own distinct off-screen origin (some from the left, some from the right, some from above/below), converging to place with ease-out. Translate that into a **one-shot scroll-reveal**, not a loop:
- Headline lines ("Proven By" / "Actual Users"): `translateY 24px→0` + fade, 250ms ease-out.
- Each testimonial card: fade + `translate` in from its own direction (reuse the relative direction implied by its position in the collage — left cards slide from left, right cards from right, etc.), 300–400ms, ease-out (`cubic-bezier(0.23, 1, 0.32, 1)`).
- Stagger cards ~60–100ms apart in roughly the order they appear left-to-right/top-to-bottom.
- Reduced motion: opacity-only fade, no translate.

**Content flag:** "Manager name" / "Employee's name" are placeholder strings, not final copy — confirm real names/roles/photos before ship.

**Responsive (mobile/tablet):** same one-shot scroll-reveal animation as desktop (fade + directional translate, staggered), but the layout shows only **4–5 cards**, not the full set. Card selection order:
1. **Priority 1 — has a written comment** (quotes #1–5 above) over rating-only cards (#6–8).
2. Within that, prefer the **highest star ratings** (5★ before 4★); only include cards rated **4–5 stars** — don't surface anything below 4 stars in the trimmed mobile set.
3. If 4–5 comment-bearing, 4–5★ cards exist, the rating-only cards (#6–8) shouldn't be needed at all for mobile — only fall back to them if fewer than 4 qualifying comment cards are available.

---

## 7. FAQ
Eyebrow **"We're here to help"**, H2 **"Frequently Asked Questions"**, 8-item accordion (first item open by default).

1. **[open by default]** "What should I expect during my demo call?" → *"During your demo call, our team will walk you through the key features of Lattice, tailored to your organization's needs. We'll answer any questions you have and discuss how Lattice can help you achieve your HR goals."*
2. "What integrations do you offer?"
3. "Does the contract include dedicated human support?"
4. "Can I purchase Performance or OKRs and Goals separately?"
5. "Is there a minimum spend?"
6. "In what currency will I be billed?"
7. "Is the contract billed monthly, quarterly, or annually?"
8. "Are there additional fees for implementation or change management?"

Footer line: *"Have a question we didn't answer?"* + **"Contact Us"** link.

**Content flag:** the open answer says **"Lattice"** twice — leftover template copy, must be corrected to NAS LMS before ship.

**Animation**
- Expand/collapse: animate height via a measured-height technique (e.g. grid-template-rows `0fr → 1fr`, or measure `scrollHeight`) — never animate raw `height: auto`.
- Icon: `+` → `−` via 45° rotation of one bar (200ms ease-out), not a swap/crossfade.
- Revealed answer content: fade + `translateY 4px→0`, ~150ms, slightly after the height transition starts.
- Reduced motion: keep the height transition (it's functional, not decorative) but drop the icon rotation flourish if desired — this is a judgment call, functional accordion motion is fine to keep per "don't remove all motion" guidance.

---

## 8. Closing CTA
Dark panel with layered decorative shapes (diamond, circles, rectangle) floating behind the copy.

- Eyebrow: **"Get started"**
- Headline: **"Go beyond generic catalogues. Get NAS LMS."**
- Button: **"Book a Demo"**

**Animation**
- Decorative shapes: no looping/drift — fade + settle into position **once** when the section enters the viewport (`opacity 0→1`, small `translate`/`rotate` settle, ~300–400ms, staggered slightly per shape), then stay static. Do not keep them animating in the background.
- Headline/button: standard scroll-reveal fade + `translateY`, same trigger, same as other sections.
- Reduced motion: opacity-only fade for the shapes, no translate/rotate.

---

## 9. Footer
Logo, nav (**Catalogue · Who we are · Contact Us**), newsletter block (**"Get the freshest courses from us"**, email input, **"Subscribe"** button), bottom bar (**Terms & Conditions · Privacy Policy**, copyright line).

**Content flag:** copyright line currently reads **"Design with love © TanahAirStudio 2020. All right reserved"** — template boilerplate, replace with the real NAS copyright line. Also confirm "Who we're" isn't a typo for "Who we are."

**Animation**
- Standard link hover/focus states, 150ms.
- Subscribe button: press `scale(0.97)`.
- Email input: focus ring transition 150ms.

---

## Open items for content/design before dev sign-off
- [ ] Confirm remaining quote-carousel slides (only 1 of N present in export)
- [ ] Real testimonial names/roles/photos (currently "Manager name" / "Employee's name" placeholders)
- [ ] Fix FAQ answer #1: "Lattice" → NAS LMS
- [ ] Fix footer copyright line (currently "TanahAirStudio 2020")
- [ ] Confirm testimonial cards 6–8 need quote copy or are intentionally quote-less
- [ ] Confirm "Who we're" footer label
