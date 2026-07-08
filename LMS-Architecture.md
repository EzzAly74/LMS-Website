# LMS Learner Website — Front-End Architecture Reference

This file is the working reference for creating any feature in this Angular LMS learner-facing website, built from scratch. This is a **public/learner product experience** — a course catalogue, course pages, personal progress ("My Learnings"), assignments, quizzes, profile, notifications, and content pages (blogs, who-we-are) — **not** an admin/back-office CRUD dashboard. There is no data-table/grid-management surface anywhere in this app; every list a learner sees (courses, assignments, quizzes, certificates) renders as cards, not table rows.

Before building a screen, check here first for folder ownership rules, reusable components, services, directives, libraries, API behavior, and the standard catalogue/card/detail patterns.

## Purpose

Build every screen from a shared set of visual and structural primitives, defined once and reused everywhere, matching the approved Figma design system.

- Put business code inside the feature that owns it.
- Use `shared` only for reusable, business-neutral UI/utilities used by more than one feature.
- Use `core` only for application-wide infrastructure (header, footer, auth, notifications plumbing).
- Every list of things a learner browses (courses, assignments, quizzes, certificates, blog posts) is a **card grid**, not a data table. Build one card grid pattern and one filter-sidebar pattern, then reuse them everywhere instead of letting each feature invent its own.
- Match spacing, radii, colors, and type styles from Figma using design tokens — don't eyeball values.

## Project Shape

```text
src/app/
  core/
  feature/
  shared/
  app.routes.ts
  app.config.ts
```

### `core`

Use `core` for application infrastructure:

- auth, guards, and interceptors (route guarding for `My Learnings`, `Profile`, `Assignments`, `Quizzes`)
- global layout: `app-header` (logo, nav, language switch, notifications bell, avatar/profile menu, "Request a Demo" CTA) and `app-footer` (logo, nav links, newsletter signup, legal links)
- route constants and app-wide enums
- global services such as API, notification/toast, title, and lookups
- global interfaces and response models

Examples:

```text
src/app/core/auth/
src/app/core/layout/
  header/
  footer/
src/app/core/enums/
src/app/core/services/
src/app/core/models/
src/app/core/interface/
```

Do not put feature business rules in `core`.

### `feature`

Use `feature` for real business domains and screens. Each feature owns its routes, components, services, models, config, and feature-only helpers.

Preferred shape:

```text
src/app/feature/catalogue/
  components/
    catalogue-page/
    course-detail-page/
  config/
  models/
  services/
  catalogue.routes.ts
```

Learner-facing features that follow this same shape: `catalogue`, `course-detail`, `my-learnings`, `assignments`, `quizzes`, `profile`, `notifications`, `blogs`, `who-we-are`, `auth`.

Keep a component inside the feature when only that feature uses it (e.g. the quiz timer belongs in `quizzes`, not `shared`).

Keep feature API services under the feature `services/` folder. Component folders own presentation code; feature services own backend calls and endpoint conventions.

Every feature must import its Angular, PrimeNG, and shared dependencies directly. Do not introduce a global barrel/shared-imports module that features depend on implicitly.

### `shared`

Use `shared` for reusable UI, directives, pipes, validators, models, and services that are business-neutral and used by more than one feature — most importantly the visual primitives listed below (`app-course-card`, `app-badge`, `app-rating-stars`, etc.), since almost every feature renders some form of card grid.

Before adding to `shared`, ask:

- Is it used by more than one feature?
- Is it business-neutral (a card, a badge, a rating display — not "enrollment logic")?
- Does it avoid depending on one feature service/model?

If not, keep it in the feature.

## Global Layout

`app-header` and `app-footer` live in `core/layout` and wrap every route via a shell/layout component. They are not rebuilt per page.

Header contains, left to right: logo, primary nav (`Catalogue`, `My Learnings`, `Who we are`, `Blogs`), language switcher, notifications bell (`app-notification-bell` with unread-count badge), avatar/profile menu, and a primary CTA button (e.g. "Request a Demo").

Footer contains: logo, secondary nav links, a newsletter signup form (email input + Subscribe button), and legal links (Terms & Conditions, Privacy Policy).

Auth state controls which header items render (e.g. avatar/notifications only when logged in). Keep that logic in `core/auth`, not duplicated per page.

## Page Header Pattern

Each top-level page (Catalogue, My Learnings, Assignments, Quizzes, Profile) owns a simple page header block instead of an admin-style toolbar: a page title, optional description/subtext, and page-level controls relevant to that page (search bar, view toggle, sort). There is no shared "actions" toolbar component carried over from admin patterns — page-level controls are defined per feature because they differ meaningfully page to page (search + toggle on Catalogue, tabs on My Learnings, filters on Assignments).

```html
<div class="page-header">
  <h1 class="page-header__title">{{ 'feature.catalogue.title' | translate }}</h1>
  <app-search-input [placeholder]="'feature.catalogue.search_ph' | translate" (search)="onSearch($event)"></app-search-input>
  <app-toggle-tabs [options]="viewOptions" [(value)]="selectedView"></app-toggle-tabs>
</div>
```

## Catalogue / Card Grid Pattern

Any feature screen that lists browsable items (course catalogue, my learnings, assignments, quizzes, blog posts) uses the same grid structure — a filter sidebar plus a responsive card grid. This is the direct replacement for what would be a "list page with a table" in an admin app; here it is always cards.

```html
<div class="catalogue-layout">
  <aside class="filter-container">
    <app-filter-sidebar [filterConfig]="filterConfig" [resultsCount]="totalRecords()" (filterChange)="onFilterChange($event)" (clearAll)="onClearAllFilters()"> </app-filter-sidebar>
  </aside>

  <section class="grid-container">
    <div class="grid-container__meta">
      <span>{{ totalRecords() }} {{ 'feature.catalogue.results' | translate }}</span>
    </div>

    <div class="card-grid" *ngIf="!loading(); else skeletonGrid">
      <app-course-card *ngFor="let course of items()" [course]="course" (enrol)="onEnrol(course)"> </app-course-card>
    </div>

    <ng-template #skeletonGrid>
      <app-card-skeleton *ngFor="let i of skeletonPlaceholders"></app-card-skeleton>
    </ng-template>

    <app-empty-state *ngIf="!loading() && items().length === 0" [config]="emptyState"></app-empty-state>

    <app-load-more *ngIf="hasMore()" [loading]="loadingMore()" (loadMore)="onLoadMore()"> </app-load-more>
  </section>
</div>
```

Do not build a `p-table`/data-grid anywhere in this app for learner-facing content. If a screen ever needs tabular data (e.g. a detailed grade breakdown), render it as a lightweight read-only HTML table styled to match the design system, not a data-management grid component — this app has no row selection, no inline row editing, and no bulk row actions.

Use these layout classes exactly:

```html
<div class="catalogue-layout">
  <aside class="filter-container">...</aside>
  <section class="grid-container">...</section>
</div>
```

Pagination for card grids is "Load more" or infinite scroll by default, matching a browsing experience, not numbered table pagination. Use numbered pagination only where the feature explicitly calls for it (e.g. a long paginated blog archive).

## Filter Sidebar Pattern

`app-filter-sidebar` is the shared component for the collapsible filter panel seen on the Catalogue page (`Type`, `Level`, `Duration`, `Job Role`, `Sort By`, with a `Clear all` action and per-option counts).

```ts
filterConfig: FilterSidebarConfig = {
  sections: [
    {
      key: "type",
      label: "feature.catalogue.filters.type",
      type: "checkbox",
      expanded: true,
      options: [
        { value: "online", label: "feature.catalogue.filters.online", count: 4 },
        { value: "offline", label: "feature.catalogue.filters.offline", count: 1 },
        { value: "hybrid", label: "feature.catalogue.filters.hybrid", count: 2 },
      ],
    },
    { key: "level", label: "feature.catalogue.filters.level", type: "checkbox", expanded: false, options: [] },
    { key: "duration", label: "feature.catalogue.filters.duration", type: "checkbox", expanded: false, options: [] },
    { key: "jobRole", label: "feature.catalogue.filters.job_role", type: "checkbox", expanded: false, options: [] },
    { key: "sortBy", label: "feature.catalogue.filters.sort_by", type: "radio", expanded: false, options: [] },
  ],
};
```

The parent page owns `filterConfig`, the resolved dropdown/option data, the final query payload, and reload behavior — `app-filter-sidebar` only renders sections and emits selected values, the same ownership split used for every parent/reusable-component pair in this app.

Sync selected filters to query params so a filtered catalogue view is shareable/bookmarkable and survives a refresh.

## Course Card Component

`app-course-card` is the single source of truth for how a course is presented anywhere in the app (catalogue grid, my-learnings grid, related-courses rail, search results).

Required inputs, matching the design: `levelBadge` (Beginner/Intermediate/Professional), `deliveryBadge` (Online/Offline/Hybrid), `image`, `title`, `instructor` (avatar + name), `rating` (score + review count), `tags` (chips), `startDate`, `duration`, and a primary CTA (`Enrol Now`, or `Continue`/`Resume` on My Learnings, or `Review` on completed items — the label is a config input, not a hardcoded string per feature).

```html
<app-course-card [course]="course" [ctaLabel]="'feature.catalogue.actions.enrol' | translate" (ctaClick)="onEnrol(course)"></app-course-card>
```

Do not fork `app-course-card` per feature. If My Learnings needs a progress bar the catalogue card doesn't, add an optional `[progress]` input rather than building a second card component — one card, configurable by inputs.

## Reusable Components

These are the foundational visual primitives to build first, since nearly every feature depends on them.

### Layout And Structure

- `app-header`, `app-footer`: global layout, owned by `core`.
- `app-page-header`: page title + subtext block used at the top of feature pages.
- `app-empty-state`: no-results/empty illustration + message + optional action.
- `app-card-skeleton`: loading skeleton matching the course-card shape.
- `app-load-more`: "load more" control with loading state, used instead of table pagination.

### Catalogue And Content Display

- `app-course-card`: the shared card described above.
- `app-filter-sidebar`: collapsible filter sections with counts, checkboxes/radio, and clear-all.
- `app-search-input`: debounced search box used in page headers.
- `app-toggle-tabs`: segmented control (e.g. "Tailored for Me" / "Explore All").
- `app-badge`: small pill for level (`Beginner`/`Intermediate`/`Professional`) and delivery mode (`Online`/`Offline`/`Hybrid`); color comes from a status/level code, not hardcoded per usage.
- `app-rating-stars`: star rating display with numeric score and review count.
- `app-tag`: skill/topic chip (e.g. `Leadership & Management`, `Data Literacy`).
- `app-avatar`: initials or image avatar, used for instructors and the profile menu.
- `app-progress-bar`, `app-progress-ring`: linear/circular progress for My Learnings and lesson completion.

### Button, Dialog, And Notification Components

- `app-buttons-generator`: shared button renderer using `ButtonConfig`, for repeated action groups (Enrol, Continue, Download Certificate).
- `app-confirm-dialog-host`, `app-center-dialog-content`, `app-confirmation-dialog`: reusable confirmation dialogs (e.g. confirm quiz submission, confirm leaving an in-progress quiz).
- `app-notification-bell`: header bell with unread-count badge, opens `app-notification-panel`.
- `app-custom-toast`, `app-global-toast`: toast display.

### Form And Input Components

- `app-form-error`: reusable validation error display.
- `app-required-field`: required field marker.
- `our-custom-dropdown`, `our-custom-multi-select`: project dropdown wrappers (used inside filter sidebar and profile forms).
- `time-picker`, `days-calender`: used where a schedule/date needs picking (e.g. live session booking).
- `app-upload-file`: file upload (assignment submissions, profile avatar).
- `app-newsletter-signup`: the footer email-capture form.

Use these input wrappers before creating a new input component.

Only add a component to `shared` once a second feature needs it. Build the first version inside the owning feature, then promote it once reuse is confirmed.

## Shared Directives, Pipes, Validators, And Services

### Directives

- `[trimInput]`: trims input values.
- `[appInlineSvg]`: renders inline SVG content.
- `[appClickOutside]`: detects clicks outside an element (closes the profile menu, notification panel, filter dropdowns).

### Pipes

- `duration`: formats course/quiz duration (e.g. "2 weeks", "45 min").
- `relativeDate`: formats notification/activity timestamps (e.g. "2 hours ago").

### Validators

- `timeRangeValidator`: shared time range validation (e.g. live session scheduling).
- Email/required validators for the newsletter and profile forms use Angular's built-ins; add a shared custom validator only once a rule is needed in more than one form.

### Utilities

- `removeNullFilterProperties`: immutable shared filter cleanup, used before catalogue/assignment/quiz list API calls.

### Shared Services

- `ConfirmDialogService`: shared confirmation dialog orchestration.
- `NavigationHistoryService`: central back-navigation behavior (e.g. "back to catalogue" from a course detail page).

### Core Services

- `ApiService`: typed HTTP wrapper; appends `culture` query parameter automatically.
- `NotificationService`: app-wide success/error/toast messages, distinct from the in-app notification bell/panel (learner activity notifications), which has its own feature-owned service.
- `LookupsService`: shared lookup/dropdown APIs (categories, levels, job roles, durations).
- `BrowserTitleService`: browser title from route data.

## Signals For Page State

Use Angular signals for page state read directly by templates:

```ts
items = signal<Course[]>([]);
totalRecords = signal(0);
loading = signal(true);
loadingMore = signal(false);
hasMore = signal(true);
```

Pass evaluated signal values in templates:

```html
[loading]="loading()" [hasMore]="hasMore()"
```

Do not pass signal objects directly:

```html
<!-- Avoid -->
[loading]="loading"
```

Configuration objects can stay as normal properties: `filterConfig`, `emptyState`, `viewOptions`, `tags`.

## Course Detail, My Learnings, Assignments, And Quizzes Patterns

### Course Detail Page

Hero section (image, title, level/delivery badges, instructor, rating, sticky Enrol CTA) followed by tabbed content (`Overview`, `Curriculum`, `Instructor`, `Reviews`) and a related-courses rail using `app-course-card`. Keep tab content as separate feature-owned components rather than one large template.

### My Learnings

Segmented view (`In Progress`, `Completed`, `Saved`) using `app-toggle-tabs`, rendering the same `card-grid` pattern with `app-course-card` configured with a `[progress]` input and a `Continue`/`Review` CTA instead of `Enrol Now`.

### Assignments And Quizzes

Assignment and quiz lists use the same card-grid pattern (due date, status badge, points/score) rather than a table. A quiz-taking screen is its own feature-owned flow (question stepper, timer, submit confirmation via `app-confirmation-dialog`) — it does not reuse the catalogue card/grid components since it's a task flow, not a browsing screen.

### Profile

Tabbed layout (`Personal Info`, `Certificates`, `Settings`). Certificates render as cards (`app-course-card`-adjacent but not the same component, since a certificate isn't enrollable — build `app-certificate-card` once this screen is built, reusing `app-badge`/`app-avatar` primitives).

## Forms

Use Angular reactive forms.

For feature forms:

- keep form creation close to the feature
- extract dialog/step forms into feature-owned form components; the parent page owns API calls, dialog state, and any list refresh
- use shared validators such as `timeRangeValidator`
- show errors with `app-form-error`
- mark required labels with `app-required-field`
- use shared input wrappers before creating new ones
- wrap each field block with the `our-field` class so spacing and theme behavior stay consistent

```html
<div class="our-field">
  <label for="email">{{ 'feature.footer.newsletter.email_label' | translate }}</label>
  <input id="email" type="email" formControlName="email" [placeholder]="'feature.footer.newsletter.email_ph' | translate" />
  <app-form-error [control]="form.controls.email"></app-form-error>
</div>
```

Quiz forms are a special case: build the question `FormArray` per attempt, never pre-render more questions than the current attempt has, and lock the form (disable controls) once submitted or once the timer expires. Assignment submission forms use `app-upload-file` and should validate file type/size client-side before calling the API.

## API Pattern And Error Handling

Feature services call backend APIs through `ApiService`.

Success and error toast messages are handled globally by the HTTP interceptors. Do not duplicate generic success/error notifications in feature components or services. Feature code should only show its own message when there is a feature-specific UI requirement the interceptors can't cover (e.g. "Quiz submitted — view your score").

Service responsibilities: own endpoint paths, call `ApiService`, keep request/response types explicit, return typed observables.

Component responsibilities: call feature services, manage UI state, adapt filter/form inputs to API payloads, handle success behavior and navigation.

### Backend Error With HTTP 200

An API call can return HTTP status `200` while the response body contains an error. If `response.statusCode >= 400`, treat it as a backend error even though the HTTP method succeeded.

```ts
this.catalogueService.getCourses(payload).subscribe({
  next: (res) => {
    if (res.statusCode >= 400) {
      return;
    }
    this.items.set(res.data.items);
    this.totalRecords.set(res.data.totalCount);
  },
  error: () => {
    this.loading.set(false);
  },
});
```

Also treat `success === false` as an error. Use existing response wrappers such as `GlobalResponse` where available. Do not invent a new wrapper shape per feature.

## Styling And UI Libraries

This project uses Angular 17, PrimeNG 17, PrimeFlex, and PrimeIcons as underlying primitives — but the visible product surface (cards, badges, buttons, filter sidebar) is a custom design system matching Figma, not default PrimeNG theming.

Use PrimeNG for behavior-heavy primitives where a custom build would be wasted effort:

- checkboxes/radios (inside the filter sidebar)
- calendars/date pickers
- dialogs (confirmation flows)
- tooltips
- toasts
- skeleton loaders (as a base for `app-card-skeleton`)

Style every PrimeNG primitive to match the design tokens below rather than using default PrimeNG visuals — badges, buttons, cards, and the filter sidebar are custom components built on top, not out-of-the-box PrimeNG components.

Use PrimeFlex utility classes for spacing, flex layout, and responsive utilities when they fit.

```html
<div class="flex align-items-center justify-content-between gap-2">...</div>
```

Use project SCSS variables from:

```text
src/styles/_variables.scss
```

Define this token file from Figma (colors, radii, spacing, type scale) before building the first component. Do not add raw static design values for colors, spacing, radii, font sizes, or shadows in component SCSS. Do not add default/fallback values in `var()` calls. Add a new token only when the value is reusable and belongs to the design system.

```scss
.course-card {
  border-radius: var(--Border-Radius-M);
  background: var(--Colors-Grey-0);
  box-shadow: var(--Shadow-Card);
}
```

Write SCSS classes nested under the owning component/block class:

```scss
.course-card {
  display: flex;
  flex-direction: column;

  &__badge {
    position: absolute;
  }

  &--enrolled {
    border-color: var(--Colors-Essential-Tertiary);
  }
}
```

For SCSS sizing, do not use CSS `min()`/`max()` functions. Avoid `min-width`, `max-width`, `min-height`, and `max-height`; use flexible/grid layout first. Keep min/max constraints only where necessary for usability (e.g. a fixed-height card image, a scrollable notification panel).

## Installed Libraries

Baseline runtime libraries for this project:

- Angular packages: `@angular/core`, `@angular/common`, `@angular/forms`, `@angular/router`, `@angular/animations`, `@angular/cdk`
- UI: `primeng`, `primeflex`, `primeicons`
- i18n: `@ngx-translate/core`, `@ngx-translate/http-loader`
- Reactive utilities: `rxjs`
- Auth/token helpers: `jwt-decode`

Add only when a specific feature needs it (do not install speculatively):

- A video-player library, once lesson video playback is scoped.
- `chart.js`, only if a progress/analytics visualization is scoped for My Learnings.
- A calendar library beyond PrimeNG's, only if live-session scheduling needs a full calendar view.
- `file-saver`, only if certificate/PDF download is scoped.

Do not add admin-oriented libraries this app doesn't need (spreadsheet export/import tooling, rich-text authoring editors) — those belong to a content-management surface, not this learner site.

Do not add a new library when PrimeNG, Angular CDK, or an existing shared component already covers the need.

## Translation Rules

All visible strings must be translated from the first screen built.

```html
{{ 'feature.catalogue.title' | translate }} [placeholder]="'feature.catalogue.search_ph' | translate"
```

Rules:

- Do not hardcode visible English or Arabic in components.
- Add keys to both `src/assets/i18n/en.json` and `src/assets/i18n/ar.json`.
- Store TypeScript labels (badge text, CTA labels passed into `app-course-card`) as translation keys, translated at the point of render.
- Use nested route-owned namespaces per feature: `feature -> route -> filters/card/detail/form/empty`.
- Do not add new generic top-level English labels for a route when a route-owned translation key can express the same visible text.
- This app supports RTL (Arabic) — verify card, badge, and filter-sidebar layouts mirror correctly rather than assuming LTR-only spacing.

## Naming

Use learner-facing domain language consistently across routes, services, and files.

Examples:

- `catalogue`
- `course-detail`
- `my-learnings`
- `assignments`
- `assignment-submission`
- `quizzes`
- `quiz-attempt`
- `profile`
- `certificates`
- `notifications`

Pick the final domain term before building a feature and keep it consistent everywhere. Do not mix synonyms for the same concept (e.g. don't have both "learning-path" and "course-track" naming the same thing).

## Adding A New Feature

Checklist:

1. Create `src/app/feature/my-learnings/` (or the relevant feature name).
2. Add `my-learnings.routes.ts`.
3. Add screens under `components/`.
4. Add feature API services under `services/`.
5. Add feature models under `models/`.
6. Wire the feature from the parent route using lazy loading.
7. Add route constants to `LmsRoutes` when needed.
8. Add nav entries with translation keys if the feature is top-level.
9. Add translations to both language files.
10. Reuse `app-course-card`, `app-filter-sidebar`, `app-page-header`, and other shared primitives before building new ones.
11. Use the card-grid pattern for any browsable list — never a data table.
12. Check all API success handlers for `statusCode >= 400`.

## Do Not Do This

- Do not build a data table/grid for any learner-facing list — courses, assignments, quizzes, and certificates are always cards.
- Do not create a second course-card-like component per feature; extend `app-course-card` with inputs instead.
- Do not carry over admin-dashboard patterns (bulk row selection, floating action bars, column settings, CSV export) into this app unless a specific feature genuinely needs them.
- Do not hardcode badge/level colors per usage — drive them from a status/level code through `app-badge`.
- Do not hardcode user-facing strings.
- Do not put feature-specific components into `shared`.
- Do not define feature route tables in `app.routes.ts`.
- Do not pass signal references to inputs that expect values.
- Do not ignore `statusCode >= 400` just because the HTTP status is `200`.
- Do not install export/import or rich-text-authoring libraries speculatively — this is a consumption surface, not an authoring one.

## Verification Before Finishing

Run TypeScript verification after architecture-affecting or feature changes:

```bash
npx.cmd tsc -p tsconfig.app.json --noEmit
```

Search for accidental data-table usage (a strong signal a screen drifted toward an admin pattern):

```bash
rg "p-table" src/app/feature
```

Run the architecture inventory after layout, routing, or shared-component changes:

```bash
npm.cmd run architecture:audit
```

The audit should report any direct PrimeNG table usage, duplicated card-like components, and cross-feature imports that should move into `shared` or the owning feature.
