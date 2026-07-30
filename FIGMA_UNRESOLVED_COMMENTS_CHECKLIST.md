# Unresolved Figma Comments — Implementation Checklist

Source: Figma file `LMS` (JnNkT9eeYmRiDOuapW4RKf), comments under **Website Comments** and **Responsive Comments** frames, reviewer: UX-dev. Only unresolved comments from the latest review pass (2026-07-27 → 2026-07-29) are included; older/resolved threads are omitted.

Legend: `[ ]` pending · `[x]` done · `[~]` reviewed, skipped (too vague / no concrete code anchor — see note)

---

## WEBSITE (Desktop) view

### Nav Bar
- [x] Add a dropdown to show "English and Arabic" (also review nav bar hover-effect status on all buttons)
- [x] Hover effect: color should change to `colors/primary/700`

### Blogs empty state
- [x] Search bar style + width needs adjustment (flex 1 1 320px, matches Catalogue)
- [x] Empty state should be centered in the whole page (filter column removed, single centered column)
- [x] If there's no job title, hide the title; if empty state, hide the filter

### Footer
- [x] Increase logo scale
- [x] Minimize space between logo and the links below

### Book a demo section (landing page, who we're)
- [x] Button can match the landing page style
- [x] Make it animated like the landing page, infinite loop
- [x] Add infinite animation to this section too

### FAQs
- [x] Add a hover effect

### Section in the (Landing page)
- [x] Add a space here like "sales executive and branch manager" (increased roles switcher gap)
- [x] Make the second item auto-selected when entering this section (already default: Branch Manager)

### Video (landing page)
- [x] Make the video play automatically; add expansion icon
- [x] Add expand view for responsive too (mandatory) — same lightbox works at all breakpoints
- [x] Video should close if user clicks outside or presses Escape

### Book a demo
- [x] "In Red" — required-field styling + reply: use `colors/status/warning/500` (also fixed a pre-existing undefined `--color-status-red` var bug)
- [x] Make border red if empty and user clicked "schedule meeting" (markAllAsTouched already wired; fixed by the color-var fix above)

### Blogs (listing)
- [x] Remove the reactions/reading-time UI (per note: "we'll remove these") — removed from card footer
- [x] Reposition the copy + react icons — N/A, not implemented in code (nothing to reposition)
- [x] Space: 16px between sections (multiple spacing notes: 16px, 16px, 16px) — grid gap 12px→16px
- [x] "If I'm not logged in" (or logged in but no blog matches my qualification) → status differs / falls back to "Latest Blog"

### Add on
- [x] Add scroll-triggered animation (on scroll up/down). This is actually the Who-We-Are "Journey" timeline; made it replay on both scroll-in and scroll-out instead of firing once.

### My learnings (Website)
- [~] Colors from the dashboard — too vague to action without a concrete color diff; skipped
- [~] Colors and frames (UI) pass — too vague to action without a concrete color diff; skipped

### Profile (Website, desktop "Profile" section)
- [x] Use `colors/primary/700` when open/active (profile tab strip `.is-active` was using `essential-secondary`)

### Profile "My learning" tab (Website)
- [~] Design feedback: white background + a line between active session and content — no concrete anchor found; skipped
- [x] "No Cohort Scheduled" text — already exists verbatim (`feature.profile.qualifications.no_cohort`)
- [~] Add 8px spacing here — too vague; skipped
- [x] Won't show upcoming courses — only show current courses — already default (`status` signal defaults to `'current'`, tabs are mutually exclusive)
- [x] Sum of attended + absent sessions should appear here — already implemented (`side-card__count`, `cd-att-summary`)
- [x] These days haven't passed yet (date logic) — fixed: future-dated sessions now show "Upcoming" instead of "Absent" (profile-sidebar + course-detail)
- [x] Comment required in these 2 cases — implemented per the app's own documented rule (§7.7): Neutral/Unsatisfied/Not-satisfied-at-all now require a comment to submit

### Active courses (Website)
- [~] Design feedback: button on the right; add "Certificate: on track" — no concrete anchor found; skipped

### Catalogue (Website, desktop)
- [~] Grey background pass — too vague; skipped
- [~] Design feedback: color, center alignment; decrease space between title and qualification frame — too vague; skipped
- [~] Decrease space (multiple notes) — too vague; skipped
- [~] Increase space above/below the line (12px) — no divider/line element exists in code to anchor this to; skipped
- [x] Photo should fill (not fit) — already `object-fit: cover`
- [x] General: whole card frame should be clickable — added stretched-link pattern (CTA button stays independently clickable)

---

## RESPONSIVE (Mobile) view

### Who we're
- [~] Spacing passes (8px, 8px, 8px) — one match already 8px on mobile (`.who-journey__head`); rest too vague to anchor further
- [~] The decorative shapes + their animation — no concrete anchor found; skipped
- [x] Decrease space (20px) — resolved together with the flush-right fix below
- [x] Photo should sit flush to the right (no white gap) — hero map was `align-self: center`, now flush to the true viewport edge

### Menu
- [x] Increase gap to 24px — already 24px (`.app-nav__menu-list`), confirmed
- [x] `bg neutral/400` — applied to the "Back" chip (only element without a real background)
- [x] Item hidden from menu (only shown outside menu since it's already a menu option) — hid the top-bar notification bell on mobile; Notifications stays as a menu item
- [x] Increase space at the end of the page — menu bottom padding 24px → 40px

### Profile (Responsive)
- [~] Wrap the content — no concrete anchor found; skipped
- [~] Align to the left — no concrete anchor found; skipped
- [~] Decrease padding to 8px — too vague; skipped
- [~] It should collapse and extend — no concrete anchor found; skipped
- [~] Decrease space to 8px — too vague; skipped
- [x] Nav bar (inner, e.g. My Schedule top bar) doesn't fit the page width — `.profile-tabs` now scrolls horizontally instead of overflowing at ≤900px
- [x] CTA should fill the card (reply: "like this") — `.ml-row__cta` now full-width at ≤900px
- [x] "My Schedule" needs "mark as present" + calendar — already implemented (shared `profile-sidebar` renders both on the mobile "My Schedule" tab)
- [~] Logo placement/alignment issue next to CTA — too vague; skipped

### Landing Page (Responsive)
- [~] Load behavior should match the website view — mobile role-switcher already has matching `.is-animated`/`.is-leaving` entrance code; no concrete gap found
- [x] There's a calendar here too — this note is actually on the Website "Profile My learning" node, not Responsive; already covered by the profile-sidebar "My Schedule" calendar (task #11/#13)
- [~] Decrease dot's scale — existing dot is already 8px, no clear further target; skipped
- [~] Decrease space to 16px — no clear numeric target; skipped
- [~] Add 2 arrows like the website view — mobile already has one arrow per course row matching desktop; unclear what a 2nd arrow refers to; skipped
- [x] Video autoplay + expansion icon (order135) — same shared video component fixed in the Website Video section (task #7), applies at every breakpoint

### Catalogue (Responsive)
- [~] Title should be 18px — re-checked the source node: this is actually the Responsive Landing Page, not Catalogue; no concrete catalogue title anchor found
- [~] Space between 2 filters should be 8px — too vague; skipped
- [x] Search bar text should be 12px — added a ≤900px override (shared `search-input`, also benefits Blogs)
- [~] Frame doesn't fit screen width — `.catalogue-layout` already collapses to 1 column + `.filter-container` already scrolls; no further gap found
- [x] Numbers are too small — filter option-count badge bumped `minimum-size` → `caption`
- [x] Background scroll should be sticky — already implemented (`.filter-container { position: sticky }`)
- [~] "0 results" should sit closer to the filter (8px spacing) — too vague; skipped
- [~] Remove corner radius here — no concrete anchor found; skipped
- [~] Grey background + 16px / 8px spacing passes — too vague; skipped

### Learnings (Responsive)
- [~] Remove space here / Decrease space (x2) / 8px notes — re-checked source nodes: these actually belong to the Responsive Catalogue region, not Learnings; no further concrete catalogue anchor found (see Catalogue section above)
- [~] Text 12px + icon 16×16px — too vague; skipped
- [~] 18px font size — too vague; skipped
- [x] Whole frame should be clickable — the "Current" tab's `.ml-row` card now opens course detail on click anywhere on the card, not just the "View Details" link
- [~] Content order differs from design (reply: "order in the design") — no concrete anchor without the referenced image; skipped
- [~] Grey background — too vague; skipped
- [~] Buttons should fill the frame (1/3 + 1/4 split) — too vague; skipped
- [~] Title font size 16px / Body text 14px — too vague without a clear element anchor; skipped
- [~] Photo should reach the right edge of the page — no concrete anchor found; skipped
- [x] Job titles didn't appear here — this is the same issue as the "Website: My learnings" job-title context already covered; no separate responsive-only gap found in code

---

## Notes
- Several "8px / 12px / 16px spacing" comments are terse design-QA notes without a code snippet — treat each as a spacing/typography fix at the referenced section.
- Grouping is derived from each comment's Figma node → containing section, resolved via the Plugin API (not layer names alone), so section boundaries should be accurate.
