import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { LmsRoutes } from '../../../../core/enums/lms-routes.enum';
import { LanguageService } from '../../../../core/services/language.service';

/** Role keys of the "See it for a role" switcher (Figma Role Switcher). */
type RoleKey =
  | 'sales_executive'
  | 'branch_manager'
  | 'data_analyst'
  | 'hr_specialist';

/** Content shown by the role switcher for one role (Figma content matrix). */
interface RoleContent {
  key: RoleKey;
  nameKey: string;
  /** Shorter chip label used on mobile (Figma 1742:48113 "Sales Exec"). */
  nameShortKey: string;
  qualificationKeys: [string, string];
  courses: [
    { titleKey: string; dateKey: string },
    { titleKey: string; dateKey: string },
  ];
}

/** One FAQ accordion entry. Items without an answer stay collapsed (only the
 * first question has answer copy in the Figma export). */
interface FaqItem {
  questionKey: string;
  /** Mobile uses a shortened question for item 3 (Figma 1742:48414). */
  questionMobileKey?: string;
  answerKey?: string;
  answerMobileKey?: string;
  /** Figma mobile frame 1742:48394 only shows the first 4 items. */
  mobile: boolean;
}

/** Testimonial card in the desktop scattered collage (Figma Testimonials). */
interface TestimonialCard {
  quoteKey?: string;
  nameKey: string;
  jobKey: string;
  initialsKey: string;
  /** Position on the 1440x820 Figma canvas. */
  left: number;
  top: number;
  /** Fixed width for comment cards; rating-only cards hug content. */
  wide: boolean;
  /** Square corner sits on the side facing the canvas edge. */
  tail: 'start' | 'end';
  /** Direction the card slides in from (left half → start, right half → end). */
  from: 'start' | 'end';
  /** Entrance stagger order (reading order, top-left → bottom-right). */
  order: number;
}

/** Mobile testimonial card (Figma 1742:48355 — trimmed 4-card stack). */
interface TestimonialCardMobile {
  quoteKey?: string;
  nameKey: string;
  jobKey: string;
  initialsKey: string;
}

/** A dashed connector line in the role diagram (viewBox coordinates). */
interface Connector {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Video step tab thresholds, in ms of video playback (spec §4b — cumulative
 * currentTime at which steps 2/3/4 activate; re-derive if the cut changes).
 * Timecodes from the current cut: step2 05:13, step3 11:15, step4 17:21. */
const STEP_THRESHOLDS_MS = [0, 5130, 11150, 17210] as const;

/** Duration of the two-line hero typewriter (700ms per line + 100ms gap). */
const TYPE_LINE_MS = 700;
const TYPE_GAP_MS = 100;

/** Delay before the role switcher's one-time auto-intro swap (spec §4c). */
const ROLE_INTRO_DELAY_MS = 600;

/** Outgoing role content fade duration before the incoming role mounts. */
const ROLE_SWAP_OUT_MS = 150;

/** Touch overlay auto-hide delay while the video is playing (spec §4a). */
const OVERLAY_IDLE_HIDE_MS = 2500;

/** Auto-advance interval for the quote-band carousel (spec §2). */
const QUOTE_ROTATE_MS = 6000;

/**
 * NAS LMS landing page — pixel-perfect from Figma desktop 1742:48667 and
 * mobile 1742:48087 (see nas-lms-landing-page-spec.md).
 *
 * Every animation is a one-shot: the hero types once on first viewport entry,
 * scroll-reveal sections fire once via IntersectionObserver (~100px margin),
 * the role switcher plays a single auto-intro swap then becomes click-only,
 * and nothing loops (the Figma prototype's 2.8s repeat is preview-only).
 */
@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('hero') private heroRef?: ElementRef<HTMLElement>;
  @ViewChild('heroLine1') private heroLine1Ref?: ElementRef<HTMLElement>;
  @ViewChild('heroLine2') private heroLine2Ref?: ElementRef<HTMLElement>;
  @ViewChild('quote') private quoteRef?: ElementRef<HTMLElement>;
  @ViewChild('rolePanel') private rolePanelRef?: ElementRef<HTMLElement>;
  @ViewChild('rolePanelMobile') private rolePanelMobileRef?: ElementRef<HTMLElement>;
  @ViewChild('roleDiagram') private roleDiagramRef?: ElementRef<HTMLElement>;
  @ViewChild('roleStackMobile') private roleStackMobileRef?: ElementRef<HTMLElement>;
  @ViewChild('nextStep') private nextStepRef?: ElementRef<HTMLElement>;
  @ViewChild('testimonials') private testimonialsRef?: ElementRef<HTMLElement>;
  @ViewChild('cta') private ctaRef?: ElementRef<HTMLElement>;
  @ViewChild('videoEl') private videoRef?: ElementRef<HTMLVideoElement>;

  private readonly language = inject(LanguageService);

  protected readonly requestDemoRoute = `/${LmsRoutes.RequestDemo}`;

  /**
   * Filename suffix for the Next-Step mockups: Arabic uses pre-localised
   * exports (next-mockup-*-ar.png) so the baked-in UI text reads RTL.
   */
  protected readonly mockupSuffix = computed(() =>
    this.language.isRtl() ? '-ar' : '',
  );

  // ── Quote carousel (§2) ────────────────────────────────────────────
  /** One entry per i18n `feature.landing.quote.items[i]` — drives the dots. */
  protected readonly quoteIndices = [0, 1];
  protected readonly quoteIndex = signal(0);
  /**
   * Single-item collection for the slide `@for`, memoised so it re-creates
   * (and replays the cross-fade) only when the index actually changes — an
   * inline `[quoteIndex()]` literal would rebuild every change-detection pass.
   */
  protected readonly quoteSlides = computed(() => [this.quoteIndex()]);
  /** i18n key prefix of the currently shown quote (fields appended in template). */
  protected readonly quoteKeyBase = computed(
    () => `feature.landing.quote.items.${this.quoteIndex()}`,
  );
  private quoteTimer?: ReturnType<typeof setInterval>;

  // ── Hero typewriter ────────────────────────────────────────────────
  /** idle → typing-1 → typing-2 → done; reduced motion jumps to done. */
  protected readonly heroPhase = signal<
    'idle' | 'typing-1' | 'typing-2' | 'done'
  >('idle');

  // ── Video player (§4a) ─────────────────────────────────────────────
  protected readonly videoSrc = 'NAS_LMS_Video.mp4';
  protected readonly isPlaying = signal(false);
  protected readonly hasStarted = signal(false);
  protected readonly currentTime = signal(0);
  protected readonly duration = signal(0);
  protected readonly isHoveringPlayer = signal(false);
  protected readonly touchOverlayOpen = signal(false);

  /** Overlay: hidden at rest; shows on hover/tap; stays while paused mid-view. */
  protected readonly overlayVisible = computed(
    () =>
      this.isHoveringPlayer() ||
      this.touchOverlayOpen() ||
      (this.hasStarted() && !this.isPlaying()),
  );

  protected readonly progressFraction = computed(() =>
    this.duration() > 0 ? Math.min(this.currentTime() / this.duration(), 1) : 0,
  );

  /** Active step tab index, synced to video playback (spec §4b thresholds). */
  protected readonly activeStep = computed(() => {
    const ms = this.currentTime() * 1000;
    let step = 0;
    for (let i = 0; i < STEP_THRESHOLDS_MS.length; i++) {
      if (ms >= STEP_THRESHOLDS_MS[i]) step = i;
    }
    return step;
  });

  protected readonly stepKeys = [
    'feature.landing.video.step1',
    'feature.landing.video.step2',
    'feature.landing.video.step3',
    'feature.landing.video.step4',
  ];

  // ── Role switcher (§4c) ────────────────────────────────────────────
  protected readonly roles: RoleContent[] = [
    {
      key: 'sales_executive',
      nameKey: 'feature.landing.roles.sales_executive.name',
      nameShortKey: 'feature.landing.roles.sales_executive.name_short',
      qualificationKeys: [
        'feature.landing.roles.sales_executive.q1',
        'feature.landing.roles.sales_executive.q2',
      ],
      courses: [
        {
          titleKey: 'feature.landing.roles.sales_executive.c1_title',
          dateKey: 'feature.landing.roles.sales_executive.c1_date',
        },
        {
          titleKey: 'feature.landing.roles.sales_executive.c2_title',
          dateKey: 'feature.landing.roles.sales_executive.c2_date',
        },
      ],
    },
    {
      key: 'branch_manager',
      nameKey: 'feature.landing.roles.branch_manager.name',
      nameShortKey: 'feature.landing.roles.branch_manager.name_short',
      qualificationKeys: [
        'feature.landing.roles.branch_manager.q1',
        'feature.landing.roles.branch_manager.q2',
      ],
      courses: [
        {
          titleKey: 'feature.landing.roles.branch_manager.c1_title',
          dateKey: 'feature.landing.roles.branch_manager.c1_date',
        },
        {
          titleKey: 'feature.landing.roles.branch_manager.c2_title',
          dateKey: 'feature.landing.roles.branch_manager.c2_date',
        },
      ],
    },
    {
      key: 'data_analyst',
      nameKey: 'feature.landing.roles.data_analyst.name',
      nameShortKey: 'feature.landing.roles.data_analyst.name_short',
      qualificationKeys: [
        'feature.landing.roles.data_analyst.q1',
        'feature.landing.roles.data_analyst.q2',
      ],
      courses: [
        {
          titleKey: 'feature.landing.roles.data_analyst.c1_title',
          dateKey: 'feature.landing.roles.data_analyst.c1_date',
        },
        {
          titleKey: 'feature.landing.roles.data_analyst.c2_title',
          dateKey: 'feature.landing.roles.data_analyst.c2_date',
        },
      ],
    },
    {
      key: 'hr_specialist',
      nameKey: 'feature.landing.roles.hr_specialist.name',
      nameShortKey: 'feature.landing.roles.hr_specialist.name_short',
      qualificationKeys: [
        'feature.landing.roles.hr_specialist.q1',
        'feature.landing.roles.hr_specialist.q2',
      ],
      courses: [
        {
          titleKey: 'feature.landing.roles.hr_specialist.c1_title',
          dateKey: 'feature.landing.roles.hr_specialist.c1_date',
        },
        {
          titleKey: 'feature.landing.roles.hr_specialist.c2_title',
          dateKey: 'feature.landing.roles.hr_specialist.c2_date',
        },
      ],
    },
  ];

  /** Mobile chip order starts with the default Branch Manager (Figma 1742:48203). */
  protected readonly rolesMobile: RoleContent[] = [
    this.roles[1],
    this.roles[0],
    this.roles[2],
    this.roles[3],
  ];

  protected readonly activeRoleKey = signal<RoleKey>('branch_manager');
  /** True during the 150ms outgoing fade before the new role mounts. */
  protected readonly roleLeaving = signal(false);
  /** Suppresses the entrance animation for the very first (static) render. */
  protected readonly roleAnimated = signal(false);

  protected readonly activeRole = computed(
    () =>
      this.roles.find((r) => r.key === this.activeRoleKey()) ?? this.roles[1],
  );

  /**
   * Connector lines for the desktop role diagram, measured live from the DOM
   * so each dashed line bridges exactly from the job/skill node edge to the
   * next node — pill widths change per role, so fixed coordinates can't.
   */
  protected readonly connectors = signal<Connector[]>([]);
  protected readonly connectorsMobile = signal<Connector[]>([]);
  /** Mobile SVG viewBox (the stack size varies with fluid width). */
  protected readonly mobileConnectorBox = signal({ w: 358, h: 320 });

  private roleIntroPlayed = false;
  private roleUserInteracted = false;
  private roleSwapTimer?: ReturnType<typeof setTimeout>;

  // ── Testimonials (§6) ──────────────────────────────────────────────
  protected readonly testimonialCards: TestimonialCard[] = [
    // Figma 1742:49208 — rating only
    {
      nameKey: 'feature.landing.testimonials.employee_name',
      jobKey: 'feature.landing.testimonials.job_title',
      initialsKey: 'feature.landing.testimonials.initials_ma',
      left: 120,
      top: 54,
      wide: false,
      tail: 'start',
      from: 'start',
      order: 0,
    },
    // Figma 1742:49305 — rating only
    {
      nameKey: 'feature.landing.testimonials.employee_name',
      jobKey: 'feature.landing.testimonials.job_title',
      initialsKey: 'feature.landing.testimonials.initials_ma',
      left: 644,
      top: 110,
      wide: false,
      tail: 'end',
      from: 'start',
      order: 1,
    },
    // Figma 1742:49136 — quote 1
    {
      quoteKey: 'feature.landing.testimonials.q1',
      nameKey: 'feature.landing.testimonials.manager_name',
      jobKey: 'feature.landing.testimonials.job_title',
      initialsKey: 'feature.landing.testimonials.initials_ma',
      left: 979,
      top: 185,
      wide: true,
      tail: 'end',
      from: 'end',
      order: 2,
    },
    // Figma 1742:49181 — quote 3
    {
      quoteKey: 'feature.landing.testimonials.q3',
      nameKey: 'feature.landing.testimonials.employee_name',
      jobKey: 'feature.landing.testimonials.job_title',
      initialsKey: 'feature.landing.testimonials.initials_ma',
      left: 24,
      top: 317,
      wide: true,
      tail: 'start',
      from: 'start',
      order: 3,
    },
    // Figma 1742:49255 — quote 5
    {
      quoteKey: 'feature.landing.testimonials.q5',
      nameKey: 'feature.landing.testimonials.employee_name',
      jobKey: 'feature.landing.testimonials.job_title',
      initialsKey: 'feature.landing.testimonials.initials_ma',
      left: 987,
      top: 441,
      wide: true,
      tail: 'end',
      from: 'end',
      order: 4,
    },
    // Figma 1742:49228 — quote 4
    {
      quoteKey: 'feature.landing.testimonials.q4',
      nameKey: 'feature.landing.testimonials.employee_name',
      jobKey: 'feature.landing.testimonials.job_title',
      initialsKey: 'feature.landing.testimonials.initials_ma',
      left: 130,
      top: 544,
      wide: true,
      tail: 'start',
      from: 'start',
      order: 5,
    },
    // Figma 1742:49157 — quote 2
    {
      quoteKey: 'feature.landing.testimonials.q2',
      nameKey: 'feature.landing.testimonials.manager_name',
      jobKey: 'feature.landing.testimonials.job_title',
      initialsKey: 'feature.landing.testimonials.initials_ma',
      left: 673,
      top: 639,
      wide: false,
      tail: 'end',
      from: 'start',
      order: 6,
    },
    // Figma 1742:49282 — rating only
    {
      nameKey: 'feature.landing.testimonials.employee_name',
      jobKey: 'feature.landing.testimonials.job_title',
      initialsKey: 'feature.landing.testimonials.initials_ma',
      left: 1223,
      top: 708,
      wide: false,
      tail: 'end',
      from: 'end',
      order: 7,
    },
  ];

  protected readonly testimonialCardsMobile: TestimonialCardMobile[] = [
    // Figma 1742:48356
    {
      quoteKey: 'feature.landing.testimonials.q1',
      nameKey: 'feature.landing.testimonials.marcus',
      jobKey: 'feature.landing.testimonials.ops_manager',
      initialsKey: 'feature.landing.testimonials.initials_ma',
    },
    // Figma 1754:91303 — rating only
    {
      nameKey: 'feature.landing.testimonials.employee_name',
      jobKey: 'feature.landing.testimonials.tech_lead',
      initialsKey: 'feature.landing.testimonials.initials_el',
    },
    // Figma 1742:48375
    {
      quoteKey: 'feature.landing.testimonials.q4',
      nameKey: 'feature.landing.testimonials.employee_name',
      jobKey: 'feature.landing.testimonials.job_title',
      initialsKey: 'feature.landing.testimonials.initials_el',
    },
    // Figma 1754:91253 — rating only
    {
      nameKey: 'feature.landing.testimonials.emily',
      jobKey: 'feature.landing.testimonials.tech_lead',
      initialsKey: 'feature.landing.testimonials.initials_el',
    },
  ];

  // ── Next Step (§5) ─────────────────────────────────────────────────
  protected readonly nextSteps = [
    {
      titleKey: 'feature.landing.next.book.title',
      descKey: 'feature.landing.next.book.desc',
      descMobileKey: 'feature.landing.next.book.desc_mobile',
    },
    {
      titleKey: 'feature.landing.next.explore.title',
      descKey: 'feature.landing.next.explore.desc',
      descMobileKey: 'feature.landing.next.explore.desc_mobile',
    },
    {
      titleKey: 'feature.landing.next.onboarding.title',
      descKey: 'feature.landing.next.onboarding.desc',
      descMobileKey: 'feature.landing.next.onboarding.desc_mobile',
    },
  ];

  /** Mobile star strips (Figma uses discrete first/mid/last star vectors). */
  protected readonly starSetComment = [
    'star-first',
    'star-mid',
    'star-mid',
    'star-mid',
    'star-last',
  ];
  protected readonly starSetRating = [
    'star-first-alt',
    'star-mid-alt',
    'star-mid-alt',
    'star-mid-alt',
    'star-last-alt',
  ];

  /**
   * Scale factor for the fixed 1440px testimonial collage canvas — the whole
   * composition zooms down on narrower viewports instead of clipping cards.
   */
  protected readonly testimonialZoom = signal(1);

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.testimonialZoom.set(Math.min(1, window.innerWidth / 1440));
    this.measureConnectors();
  }

  /**
   * Recompute the role-diagram connector endpoints from the live node
   * geometry. Runs on init, on resize, and after each role swap (once the
   * incoming nodes have mounted), so lines always join node edge to node edge.
   */
  private measureConnectors(): void {
    this.connectors.set(this.measureDiagram(this.roleDiagramRef?.nativeElement));

    const stack = this.roleStackMobileRef?.nativeElement;
    if (stack) {
      const r = stack.getBoundingClientRect();
      if (r.width > 0) this.mobileConnectorBox.set({ w: r.width, h: r.height });
    }
    this.connectorsMobile.set(this.measureDiagram(stack));
  }

  /**
   * Build the four connectors (job→skill×2, skill→course×2) from a container's
   * child nodes, in the container's own pixel coordinate space.
   */
  private measureDiagram(root: HTMLElement | undefined): Connector[] {
    if (!root) return [];
    const base = root.getBoundingClientRect();
    if (base.width === 0) return [];

    const pick = (sel: string) => {
      const el = root.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        left: r.left - base.left,
        right: r.right - base.left,
        top: r.top - base.top,
        bottom: r.bottom - base.top,
        cx: (r.left + r.right) / 2 - base.left,
        cy: (r.top + r.bottom) / 2 - base.top,
      };
    };

    const job = pick('.roles__job-card, .roles-m__job-card');
    const pillTop = pick('.roles__pill--top, .roles-m__pill:nth-of-type(1)');
    const pillBot = pick('.roles__pill--bottom, .roles-m__pill:nth-of-type(2)');
    const courseTop = pick('.roles__course--top, .roles-m__course:nth-of-type(1)');
    const courseBot = pick('.roles__course--bottom, .roles-m__course:nth-of-type(2)');
    if (!job || !pillTop || !pillBot || !courseTop || !courseBot) return [];

    const isStacked = pillTop.top > job.bottom - 1; // mobile: nodes stack vertically

    if (isStacked) {
      // Mobile: job above, two pills in a row, two cards in a row below.
      return [
        { x1: pillTop.cx, y1: pillTop.bottom, x2: courseTop.cx, y2: courseTop.top },
        { x1: pillBot.cx, y1: pillBot.bottom, x2: courseBot.cx, y2: courseBot.top },
      ];
    }

    // Desktop: job → each skill pill, each skill pill → its course card.
    return [
      { x1: job.right, y1: job.cy, x2: pillTop.left, y2: pillTop.cy },
      { x1: job.right, y1: job.cy, x2: pillBot.left, y2: pillBot.cy },
      { x1: pillTop.right, y1: pillTop.cy, x2: courseTop.left, y2: courseTop.cy },
      { x1: pillBot.right, y1: pillBot.cy, x2: courseBot.left, y2: courseBot.cy },
    ];
  }

  // ── FAQ (§7) ───────────────────────────────────────────────────────
  protected readonly faqItems: FaqItem[] = [
    {
      questionKey: 'feature.landing.faq.q1',
      answerKey: 'feature.landing.faq.a1',
      answerMobileKey: 'feature.landing.faq.a1_mobile',
      mobile: true,
    },
    { questionKey: 'feature.landing.faq.q2', mobile: true },
    {
      questionKey: 'feature.landing.faq.q3',
      questionMobileKey: 'feature.landing.faq.q3_mobile',
      mobile: true,
    },
    { questionKey: 'feature.landing.faq.q4', mobile: false },
    { questionKey: 'feature.landing.faq.q5', mobile: true },
    { questionKey: 'feature.landing.faq.q6', mobile: false },
    { questionKey: 'feature.landing.faq.q7', mobile: false },
    { questionKey: 'feature.landing.faq.q8', mobile: false },
  ];

  /** Index of the expanded FAQ item (first item open by default). */
  protected readonly openFaqIndex = signal<number | null>(0);

  // ── Internals ──────────────────────────────────────────────────────
  private observer?: IntersectionObserver;
  private heroObserver?: IntersectionObserver;
  private roleObserver?: IntersectionObserver;
  private readonly timers: ReturnType<typeof setTimeout>[] = [];
  private overlayIdleTimer?: ReturnType<typeof setTimeout>;

  private readonly reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  ngAfterViewInit(): void {
    this.onWindowResize();
    this.startQuoteRotation();
    // Measure connectors once layout/fonts have settled (the default role is
    // already rendered), then again shortly after in case metrics shifted.
    this.timers.push(setTimeout(() => this.measureConnectors(), 0));
    this.timers.push(setTimeout(() => this.measureConnectors(), 400));
    // Scroll-reveal sections: play once on first entry (~100px margin, spec).
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-live');
            this.observer?.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -100px 0px', threshold: 0 },
    );
    for (const ref of [
      this.quoteRef,
      this.nextStepRef,
      this.testimonialsRef,
      this.ctaRef,
    ]) {
      if (ref) this.observer.observe(ref.nativeElement);
    }

    // Hero typewriter: fires once when the hero first enters view (spec §2).
    if (this.heroRef) {
      this.heroObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            this.heroObserver?.disconnect();
            this.startTypewriter();
          }
        },
        { threshold: 0.2 },
      );
      this.heroObserver.observe(this.heroRef.nativeElement);
    }

    // Role switcher one-time auto-intro (spec §4c): auto-select the next chip
    // (Sales Executive) once, on first scroll-into-view, then click-only.
    // Both layouts are observed — only the visible one can ever intersect.
    this.roleObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          this.roleObserver?.disconnect();
          this.timers.push(
            setTimeout(() => {
              if (!this.roleIntroPlayed && !this.roleUserInteracted) {
                this.roleIntroPlayed = true;
                this.swapRole('sales_executive');
              }
            }, ROLE_INTRO_DELAY_MS),
          );
        }
      },
      { threshold: 0.35 },
    );
    for (const ref of [this.rolePanelRef, this.rolePanelMobileRef]) {
      if (ref) this.roleObserver.observe(ref.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.heroObserver?.disconnect();
    this.roleObserver?.disconnect();
    for (const t of this.timers) clearTimeout(t);
    clearTimeout(this.roleSwapTimer);
    clearTimeout(this.overlayIdleTimer);
    clearInterval(this.quoteTimer);
  }

  // ── Quote carousel ─────────────────────────────────────────────────
  /** Rotate the quote band on a timer; reduced motion keeps it click-only. */
  private startQuoteRotation(): void {
    if (this.reducedMotion) return;
    this.quoteTimer = setInterval(() => {
      this.quoteIndex.update(
        (i) => (i + 1) % this.quoteIndices.length,
      );
    }, QUOTE_ROTATE_MS);
  }

  /** Dot click: jump to a quote and restart the auto-advance timer. */
  protected setQuote(index: number): void {
    if (index === this.quoteIndex()) return;
    this.quoteIndex.set(index);
    clearInterval(this.quoteTimer);
    this.startQuoteRotation();
  }

  // ── Hero ───────────────────────────────────────────────────────────
  private startTypewriter(): void {
    if (this.heroPhase() !== 'idle') return;
    // Reduced motion: skip the wipe, show both lines immediately (spec §2).
    if (this.reducedMotion) {
      this.heroPhase.set('done');
      return;
    }
    // Expose measured line widths so the caret can ride the wipe edge in
    // either language (Arabic line widths differ from the 465/401px English).
    const host = this.heroRef?.nativeElement;
    const w1 = this.heroLine1Ref?.nativeElement.offsetWidth ?? 465;
    const w2 = this.heroLine2Ref?.nativeElement.offsetWidth ?? 401;
    host?.style.setProperty('--type-w1', `${w1}px`);
    host?.style.setProperty('--type-w2', `${w2}px`);

    this.heroPhase.set('typing-1');
    this.timers.push(
      setTimeout(
        () => this.heroPhase.set('typing-2'),
        TYPE_LINE_MS + TYPE_GAP_MS,
      ),
      setTimeout(
        () => this.heroPhase.set('done'),
        (TYPE_LINE_MS + TYPE_GAP_MS) * 2,
      ),
    );
  }

  // ── Video player ───────────────────────────────────────────────────
  protected togglePlay(): void {
    const video = this.videoRef?.nativeElement;
    if (!video) return;
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  }

  protected skip(seconds: number): void {
    const video = this.videoRef?.nativeElement;
    if (!video || !this.duration()) return;
    video.currentTime = Math.min(
      Math.max(video.currentTime + seconds, 0),
      video.duration,
    );
    this.bumpTouchOverlay();
  }

  protected onVideoPlay(): void {
    this.isPlaying.set(true);
    this.hasStarted.set(true);
    this.bumpTouchOverlay();
  }

  protected onVideoPause(): void {
    this.isPlaying.set(false);
  }

  protected onTimeUpdate(): void {
    const video = this.videoRef?.nativeElement;
    if (video) this.currentTime.set(video.currentTime);
  }

  protected onLoadedMetadata(): void {
    const video = this.videoRef?.nativeElement;
    if (video) this.duration.set(video.duration);
  }

  protected onPlayerEnter(): void {
    this.isHoveringPlayer.set(true);
  }

  protected onPlayerLeave(): void {
    this.isHoveringPlayer.set(false);
  }

  /**
   * Clicking the video surface: on hover-capable devices it toggles playback;
   * on touch it toggles the controls overlay instead (spec §4a).
   */
  protected onVideoSurfaceClick(): void {
    const touchOnly =
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: none)').matches;
    if (touchOnly) {
      this.touchOverlayOpen.update((open) => !open);
      this.bumpTouchOverlay();
    } else {
      this.togglePlay();
    }
  }

  private bumpTouchOverlay(): void {
    clearTimeout(this.overlayIdleTimer);
    if (this.touchOverlayOpen()) {
      this.overlayIdleTimer = setTimeout(() => {
        if (this.isPlaying()) this.touchOverlayOpen.set(false);
      }, OVERLAY_IDLE_HIDE_MS);
    }
  }

  protected formatTime(seconds: number): string {
    const total = Math.floor(seconds);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // ── Role switcher ──────────────────────────────────────────────────
  protected onRoleChipClick(key: RoleKey): void {
    this.roleUserInteracted = true;
    this.swapRole(key);
  }

  /** Outgoing content fades 150ms, then the new role mounts and animates in. */
  private swapRole(key: RoleKey): void {
    if (key === this.activeRoleKey() || this.roleLeaving()) return;
    if (this.reducedMotion) {
      this.activeRoleKey.set(key);
      this.timers.push(setTimeout(() => this.measureConnectors(), 0));
      return;
    }
    this.roleAnimated.set(true);
    this.roleLeaving.set(true);
    this.roleSwapTimer = setTimeout(() => {
      this.activeRoleKey.set(key);
      this.roleLeaving.set(false);
      // The incoming pills/cards mount this tick — measure on the next one,
      // once their widths are known, so the connectors join them exactly.
      this.timers.push(setTimeout(() => this.measureConnectors(), 0));
    }, ROLE_SWAP_OUT_MS);
  }

  // ── FAQ ────────────────────────────────────────────────────────────
  protected toggleFaq(index: number): void {
    // Only items with answer copy expand (answers 2–8 are not in the export).
    if (!this.faqItems[index].answerKey) return;
    this.openFaqIndex.update((open) => (open === index ? null : index));
  }
}
