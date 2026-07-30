import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { LearningCourse, ProfileTab, SessionAttendance, WeekSession } from '../../models/profile.models';
import { ProfileService } from '../../services/profile.service';

/**
 * Profile right rail. Shows the learner's next/live "Active Session" (derived
 * from the embedded live_session data on active courses) and, while a Current
 * course is open, its "My Attendance" breakdown + certificate-at-risk warning
 * (real per-session attendance from /courses/{id}/sessions). Figma right rail.
 */
@Component({
  selector: 'app-profile-sidebar',
  standalone: true,
  imports: [DatePipe, FormsModule, TranslatePipe],
  templateUrl: './profile-sidebar.component.html',
  styleUrl: './profile-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileSidebarComponent {
  @Input() set courses(value: LearningCourse[]) {
    this._courses.set(value ?? []);
  }
  @Input() set activeCourse(value: LearningCourse | null) {
    this._activeCourse.set(value);
    this.loadSessions(value);
  }
  @Input() set tab(value: ProfileTab) {
    this._tab.set(value);
  }

  private readonly service = inject(ProfileService);
  private readonly translate = inject(TranslateService);

  private readonly _courses = signal<LearningCourse[]>([]);
  private readonly _activeCourse = signal<LearningCourse | null>(null);
  private readonly _tab = signal<ProfileTab>('qualifications');
  protected readonly sessions = signal<SessionAttendance[]>([]);
  protected readonly sessionsLoading = signal(false);

  /* ── Mark as Present (passcode) ─────────────────────────────────────── */
  /** `mobile_attendance.attendance_passcode_length` defaults to 5 digits; the
   *  learner-facing API doesn't expose the configured value ahead of time, so
   *  this mirrors the seeded default. */
  protected readonly PASSCODE_LENGTH = 5;
  protected readonly showPasscode = signal(false);
  protected readonly otpDigits = signal<string[]>(Array(this.PASSCODE_LENGTH).fill(''));
  protected readonly passcode = computed(() => this.otpDigits().join(''));
  protected readonly marking = signal(false);
  protected readonly markError = signal<string | null>(null);
  /** Set locally once the learner marks present, to flip the CTA immediately. */
  protected readonly markedOk = signal(false);

  /** The course whose live/soonest session drives the Active Session card. */
  protected readonly activeSessionCourse = computed(() => {
    const courses = this._courses();
    return courses.find((c) => c.isLive && c.live_session) ?? courses.find((c) => c.live_session) ?? null;
  });

  protected readonly attendanceCourse = computed(() =>
    this._tab() === 'my_learnings' ? this._activeCourse() : null,
  );

  /** Show a neutral placeholder when there's neither a live session nor an
   * open attendance course, so the rail is never blank (matches Figma). */
  protected readonly showPlaceholder = computed(
    () => !this.activeSessionCourse() && !this.attendanceCourse(),
  );

  protected readonly attended = computed(() => this.sessions().filter((s) => s.attended).length);

  /** A future-dated session hasn't happened yet — it isn't "absent" (spec review). */
  protected sessionIsUpcoming(s: SessionAttendance): boolean {
    return !!s.session_date && new Date(s.session_date) > new Date();
  }

  protected readonly atRisk = computed(() => {
    const course = this.attendanceCourse();
    return !!course && course.progress.absences > 0;
  });

  /* ── "This week" time-grid calendar (Figma 841:42118) ──────────────────── */
  protected readonly weekSessions = signal<WeekSession[]>([]);
  protected readonly weekRange = signal<{ start: string; end: string } | null>(null);
  protected readonly todayIso = new Date().toISOString().slice(0, 10);

  /** Row height per hour, matching the 40px slot rows in Figma. */
  protected readonly HOUR_PX = 40;

  /** Viewer timezone label, e.g. "GMT+3" (Figma gutter header). */
  protected readonly gmtLabel = ((): string => {
    const offset = -new Date().getTimezoneOffset() / 60;
    const sign = offset >= 0 ? '+' : '−';
    return `GMT${sign}${Math.abs(offset)}`;
  })();

  /** One column per day across the week range (Figma renders every day, not
   *  only days that have sessions). Falls back to the distinct session days. */
  protected readonly calDays = computed(() => {
    const range = this.weekRange();
    const dates: string[] = [];
    if (range) {
      // Iterate in UTC so date-only strings never shift across a timezone.
      const end = new Date(range.end + 'T00:00:00Z');
      for (let d = new Date(range.start + 'T00:00:00Z'); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
        dates.push(d.toISOString().slice(0, 10));
      }
    } else {
      for (const s of this.weekSessions()) {
        if (!dates.includes(s.session_date)) {
          dates.push(s.session_date);
        }
      }
      dates.sort();
    }
    return dates.map((date) => ({
      date,
      isToday: date === this.todayIso,
      sessions: this.weekSessions().filter((s) => s.session_date === date),
    }));
  });

  /** Vertical hour axis — 9:00–15:00 by default, expanded to cover sessions. */
  protected readonly axis = computed(() => {
    let startMin = 9 * 60;
    let endMin = 15 * 60;
    for (const s of this.weekSessions()) {
      const from = this.parseMinutes(s.time_from);
      const to = this.parseMinutes(s.time_to) ?? (from !== null ? from + 60 : null);
      if (from !== null) {
        startMin = Math.min(startMin, Math.floor(from / 60) * 60);
      }
      if (to !== null) {
        endMin = Math.max(endMin, Math.ceil(to / 60) * 60);
      }
    }
    const startHour = startMin / 60;
    const endHour = endMin / 60;
    const hours: number[] = [];
    for (let h = startHour; h < endHour; h++) {
      hours.push(h);
    }
    return { startHour, hours };
  });

  /** Inline grid-template-columns for the header + body (36px gutter + N days).
   *  Each day column has a 72px floor so event chips stay readable — cramming
   *  a full Mon–Sun week into the ~330px sidebar card squashed them down to a
   *  few illegible pixels. `.cal__body` scrolls horizontally past that floor. */
  protected readonly calColumns = computed(
    () => `36px repeat(${this.calDays().length}, minmax(72px, 1fr))`,
  );

  /** 12-hour label without meridiem to match Figma (e.g. 13 → "1:00"). */
  protected hourLabel(hour: number): string {
    const h = hour % 12 === 0 ? 12 : hour % 12;
    return `${h}:00`;
  }

  protected eventTop(s: WeekSession): number {
    const from = this.parseMinutes(s.time_from) ?? this.axis().startHour * 60;
    return ((from - this.axis().startHour * 60) / 60) * this.HOUR_PX;
  }

  protected eventHeight(s: WeekSession): number {
    const from = this.parseMinutes(s.time_from) ?? this.axis().startHour * 60;
    const to = this.parseMinutes(s.time_to) ?? from + 60;
    return Math.max(24, ((to - from) / 60) * this.HOUR_PX);
  }

  /**
   * Parse a time value into minutes-since-midnight. The API passes
   * `time_from`/`time_to` through as raw MySQL TIME strings — 24-hour,
   * always with seconds (e.g. "09:40:51") — for the client to format itself.
   * Also tolerates a pre-formatted "2:00 PM" in case any other source ever
   * sends one.
   */
  private parseMinutes(value: string | null): number | null {
    if (!value) {
      return null;
    }
    const m = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
    if (!m) {
      return null;
    }
    let hour = Number(m[1]);
    const minute = Number(m[2]);
    const meridiem = m[3]?.toUpperCase();
    if (meridiem === 'PM' && hour < 12) {
      hour += 12;
    }
    if (meridiem === 'AM' && hour === 12) {
      hour = 0;
    }
    return hour * 60 + minute;
  }

  /** "09:40:51" → "9:40" — bare hour:minute, no seconds, no meridiem
   *  (matches the Figma calendar chip style, e.g. "10:00–11:30"). */
  protected formatChipTime(value: string | null): string {
    const mins = this.parseMinutes(value);
    if (mins === null) {
      return value ?? '';
    }
    const hour = Math.floor(mins / 60);
    const minute = mins % 60;
    return `${hour}:${String(minute).padStart(2, '0')}`;
  }

  /** "09:40:51" → "9:40 AM" — for the Active Session card / passcode modal. */
  protected formatMeridiemTime(value: string | null): string {
    const mins = this.parseMinutes(value);
    if (mins === null) {
      return value ?? '';
    }
    const hour24 = Math.floor(mins / 60);
    const minute = mins % 60;
    const meridiem = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    return `${hour12}:${String(minute).padStart(2, '0')} ${meridiem}`;
  }

  constructor() {
    this.service.getWeekSchedule().subscribe({
      next: (res) => {
        if (res.status === 'success' && res.result) {
          this.weekSessions.set(res.result.sessions);
          this.weekRange.set(res.result.range ?? null);
        } else {
          this.weekSessions.set([]);
        }
      },
    });
  }

  /** True once the live session is (or has just been) attended. */
  protected readonly liveAttended = computed(
    () => this.markedOk() || !!this.activeSessionCourse()?.live_session?.attended,
  );

  protected openMarkPresent(): void {
    this.otpDigits.set(Array(this.PASSCODE_LENGTH).fill(''));
    this.markError.set(null);
    this.showPasscode.set(true);
  }

  protected closeMarkPresent(): void {
    this.showPasscode.set(false);
  }

  /** One box changed — keep only its last typed digit, then hop focus to the
   *  next empty box (or blur once the last box is filled). */
  protected onOtpInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const digit = input.value.replace(/\D/g, '').slice(-1);

    const digits = [...this.otpDigits()];
    digits[index] = digit;
    this.otpDigits.set(digits);
    this.markError.set(null);
    input.value = digit;

    if (digit && index < this.PASSCODE_LENGTH - 1) {
      this.focusOtpBox(input, 1);
    }
  }

  /** Backspace on an empty box hops focus back and clears the previous digit,
   *  matching standard OTP-input behaviour. */
  protected onOtpKeydown(index: number, event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Backspace' && !input.value && index > 0) {
      event.preventDefault();
      const digits = [...this.otpDigits()];
      digits[index - 1] = '';
      this.otpDigits.set(digits);
      this.focusOtpBox(input, -1);
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusOtpBox(input, -1);
    } else if (event.key === 'ArrowRight' && index < this.PASSCODE_LENGTH - 1) {
      event.preventDefault();
      this.focusOtpBox(input, 1);
    }
  }

  /** Pasting the full code fills every box at once instead of just the one
   *  under the cursor. */
  protected onOtpPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    const chars = text.replace(/\D/g, '').slice(0, this.PASSCODE_LENGTH).split('');
    if (!chars.length) {
      return;
    }
    event.preventDefault();
    const digits = Array(this.PASSCODE_LENGTH).fill('');
    chars.forEach((c, i) => (digits[i] = c));
    this.otpDigits.set(digits);
    this.markError.set(null);

    const boxes = (event.target as HTMLElement)
      .closest('.otp')
      ?.querySelectorAll<HTMLInputElement>('.otp__box');
    boxes?.[Math.min(chars.length, this.PASSCODE_LENGTH - 1)]?.focus();
  }

  private focusOtpBox(from: HTMLInputElement, dir: 1 | -1): void {
    const box = (dir === 1 ? from.nextElementSibling : from.previousElementSibling) as HTMLInputElement | null;
    box?.focus();
    box?.select();
  }

  protected submitPasscode(): void {
    const course = this.activeSessionCourse();
    const session = course?.live_session;
    const code = this.passcode().trim();
    if (!course || !session || !code || this.marking()) {
      return;
    }
    this.marking.set(true);
    this.markError.set(null);
    this.service.markPresent(course.id, session.id, code).subscribe({
      next: (res) => {
        this.marking.set(false);
        if (res?.status === 'success') {
          this.markedOk.set(true);
          this.showPasscode.set(false);
          this.loadSessions(course); // refresh the attendance list
        } else {
          // Wrong passcode returns HTTP 200 with status:error (mobile parity).
          this.markError.set(res?.message ?? this.translate.instant('feature.profile.sidebar.mark_error'));
        }
      },
      error: (err) => {
        this.marking.set(false);
        this.markError.set(err?.error?.message ?? this.translate.instant('feature.profile.sidebar.mark_error'));
      },
    });
  }

  private loadSessions(course: LearningCourse | null): void {
    if (!course) {
      this.sessions.set([]);
      return;
    }
    this.sessionsLoading.set(true);
    this.service.getSessions(course.id).subscribe({
      next: (res) => {
        this.sessions.set(res.status === 'success' && res.result ? res.result : []);
        this.sessionsLoading.set(false);
      },
      error: () => this.sessionsLoading.set(false),
    });
  }
}
