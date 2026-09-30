import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { NotificationService } from '../../../../core/services/notification.service';
import {
  EvaluationAnswers,
  EvaluationForm,
  EvaluationQuestion,
} from '../../models/my-learnings.models';
import { MyLearningsService } from '../../services/my-learnings.service';

/** HTTP 409: this learner already evaluated the course. */
const HTTP_CONFLICT = 409;
const HTTP_UNPROCESSABLE = 422;
export const EVALUATION_TEXT_MAX = 2000;

interface NumberedQuestion extends EvaluationQuestion {
  readonly n: number;
  /** 1..scale_max, empty for free text. */
  readonly points: readonly number[];
}

/**
 * Learner Evaluation (Figma 2194:78325 desktop, 2274:132908 scrolling with
 * Submit disabled, 2180:112624 phone).
 *
 * The form is whatever the course's templates ask (GET courses/{id}/evaluate):
 * `five` as 32 px stars, `scale` / `ten` as numbered radios between the
 * question's end labels, `text` as a free-text answer. Progress counts the
 * answered questions; Submit is enabled once every required one is answered
 * (the server checks the same, and the ranges). With several instructors the
 * learner picks the one they are evaluating (not drawn: Figma assumes one).
 *
 * A native <dialog> opened with showModal(): the browser traps focus and
 * closes on Escape; focus goes back to whatever opened it.
 */
@Component({
  selector: 'app-evaluation-dialog',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './evaluation-dialog.component.html',
  styleUrl: './evaluation-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvaluationDialogComponent {
  private readonly api = inject(MyLearningsService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  readonly courseId = input.required<number>();
  /** The form, already fetched by the page (it decides whether to offer the row). */
  readonly form = input.required<EvaluationForm>();
  readonly open = input(false);
  readonly closed = output<void>();
  /** Submitted (or the server says it already was). */
  readonly submitted = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private opener: HTMLElement | null = null;

  protected readonly textMax = EVALUATION_TEXT_MAX;
  protected readonly answers = signal<EvaluationAnswers>({});
  protected readonly instructorId = signal<number | null>(null);
  protected readonly saving = signal(false);
  protected readonly serverError = signal<string | null>(null);
  /** Required questions left unanswered after a Submit attempt are marked. */
  protected readonly tried = signal(false);

  /** The templates with their questions numbered straight through (Figma "1-", "2-", ...). */
  protected readonly groups = computed<{ id: number; name: string; questions: NumberedQuestion[] }[]>(() => {
    let n = 0;
    return this.form().evaluation_categories.map((t) => ({
      id: t.id,
      name: t.name,
      questions: t.questions.map((q) => ({
        ...q,
        n: ++n,
        points: q.type === 'text' || !q.scale_max ? [] : Array.from({ length: q.scale_max }, (_, i) => i + 1),
      })),
    }));
  });

  protected readonly questions = computed<NumberedQuestion[]>(() => this.groups().flatMap((g) => g.questions));

  /** Template names are shown only when the form joins more than one. */
  protected readonly showTemplateNames = computed(() => this.form().evaluation_categories.length > 1);

  protected readonly answered = computed(() => this.questions().filter((q) => this.hasAnswer(q.id)).length);
  protected readonly total = computed(() => this.questions().length);
  protected readonly percent = computed(() => (this.total() ? Math.round((100 * this.answered()) / this.total()) : 0));

  protected readonly missingRequired = computed(() =>
    this.questions().filter((q) => q.is_required && !this.hasAnswer(q.id)).map((q) => q.id),
  );

  protected readonly canSubmit = computed(
    () => !this.saving() && this.total() > 0 && this.missingRequired().length === 0 && this.instructorId() !== null,
  );

  constructor() {
    effect(() => {
      const open = this.open();
      untracked(() => (open ? this.show() : this.hide()));
    });
  }

  protected hasAnswer(id: number): boolean {
    const v = this.answers()[id];
    return typeof v === 'number' || (typeof v === 'string' && v.trim() !== '');
  }

  protected value(id: number): number | string | undefined {
    return this.answers()[id];
  }

  protected choose(id: number, value: number | string): void {
    this.answers.update((a) => ({ ...a, [id]: value }));
    this.serverError.set(null);
  }

  protected isStarOn(id: number, point: number): boolean {
    const v = this.answers()[id];
    return typeof v === 'number' && v >= point;
  }

  /** Required answers still missing, instructor included, for the footer hint. */
  protected readonly leftToAnswer = computed(
    () => this.missingRequired().length + (this.instructorId() === null ? 1 : 0),
  );

  protected answeredIn(questions: readonly NumberedQuestion[]): number {
    return questions.filter((q) => this.hasAnswer(q.id)).length;
  }

  protected length(id: number): number {
    const v = this.answers()[id];
    return typeof v === 'string' ? v.length : 0;
  }

  /** "1, Needs significant improvement" ... "5, Excellent"; the middle points read as their number. */
  protected pointLabel(q: NumberedQuestion, p: number): string {
    if (p === 1) return `${p}, ${q.scale_label_min ?? this.translate.instant('feature.my_learnings.evaluation.label_min')}`;
    if (p === q.points.length) return `${p}, ${q.scale_label_max ?? this.translate.instant('feature.my_learnings.evaluation.label_max')}`;
    return String(p);
  }

  protected isMissing(id: number): boolean {
    return this.tried() && this.missingRequired().includes(id);
  }

  protected onText(id: number, event: Event): void {
    this.choose(id, (event.target as HTMLTextAreaElement).value);
  }

  protected onInstructor(event: Event): void {
    const v = Number((event.target as HTMLSelectElement).value);
    this.instructorId.set(Number.isFinite(v) && v > 0 ? v : null);
  }

  protected cancel(): void {
    if (!this.saving()) this.closed.emit();
  }

  /** Escape (the dialog's own cancel event) goes through the same path. */
  protected onNativeCancel(event: Event): void {
    event.preventDefault();
    this.cancel();
  }

  protected submit(): void {
    this.tried.set(true);
    const instructor = this.instructorId();
    if (!this.canSubmit() || instructor === null) {
      this.focusFirstMissing();
      return;
    }

    // Optional questions left blank are left out; text is trimmed.
    const payload: EvaluationAnswers = {};
    for (const q of this.questions()) {
      const v = this.answers()[q.id];
      if (typeof v === 'number') payload[q.id] = v;
      else if (typeof v === 'string' && v.trim() !== '') payload[q.id] = v.trim();
    }

    this.saving.set(true);
    this.serverError.set(null);
    this.api
      .submitEvaluation(this.courseId(), instructor, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.notify.success(this.translate.instant('feature.my_learnings.evaluation.thanks'));
          this.submitted.emit();
        },
        error: (e: unknown) => {
          this.saving.set(false);
          if (e instanceof HttpErrorResponse && e.status === HTTP_CONFLICT) {
            // Answered meanwhile (another tab or device): the page drops the row.
            this.submitted.emit();
            return;
          }
          if (e instanceof HttpErrorResponse && e.status === HTTP_UNPROCESSABLE) {
            const errors = (e.error?.errors ?? {}) as Record<string, string[]>;
            this.serverError.set(Object.values(errors).flat()[0] ?? this.translate.instant('common.error_generic'));
            return;
          }
          // Other failures were already announced by the error interceptor.
        },
      });
  }

  private show(): void {
    const el = this.dialog().nativeElement;
    if (el.open) return;
    const active = this.document.activeElement;
    this.opener = active instanceof HTMLElement ? active : null;
    this.answers.set({});
    this.tried.set(false);
    this.serverError.set(null);
    const instructors = this.form().instructors;
    this.instructorId.set(instructors.length === 1 ? instructors[0].id : null);
    el.showModal();
  }

  private hide(): void {
    const el = this.dialog().nativeElement;
    if (!el.open) return;
    el.close();
    this.opener?.focus();
    this.opener = null;
  }

  private focusFirstMissing(): void {
    const id = this.instructorId() === null ? 'ev-instructor' : `ev-q-${this.missingRequired()[0]}`;
    this.document.getElementById(id)?.focus();
  }
}
