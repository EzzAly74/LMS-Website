import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { map, startWith } from 'rxjs';

import { LmsRoutes } from '../../../../core/enums/lms-routes.enum';
import { NotificationService } from '../../../../core/services/notification.service';
import { ExternalTrainingRequest } from '../../models/profile.models';
import { ExternalTrainingService } from '../../services/external-training.service';

type LoadState = 'loading' | 'ready' | 'error' | 'not-found' | 'decided';
type Field = 'title' | 'provider' | 'start_date' | 'end_date' | 'hours' | 'cost' | 'certificate';

/** Mirrors ExternalTrainingRequestForm - UX only, the API decides. */
export const MAX_TEXT = 191;
export const MAX_BYTES = 10 * 1024 * 1024;
const TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const EXTENSIONS = /\.(pdf|jpe?g|png)$/i;

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** End on or after start, and not in the future: it is training already done. */
function datesValid(group: AbstractControl): ValidationErrors | null {
  const start = group.get('start_date')?.value as string;
  const end = group.get('end_date')?.value as string;
  if (!start || !end) return null;
  if (end < start) return { endBeforeStart: true };
  if (end > today()) return { endInFuture: true };
  return null;
}

function halfSteps(c: AbstractControl): ValidationErrors | null {
  const v = Number(c.value);
  return c.value === '' || c.value === null || Number.isInteger(v * 2) ? null : { step: true };
}

/**
 * Add / Edit External Training - Figma 2201:83481 (desktop), 2221:92592
 * (mobile); rules decided by the human 2026-09-26 (D-057).
 *
 * Creates a request, or edits one that is still pending. The certificate is
 * required on create and optional on edit (the one uploaded stays). A decided
 * request cannot be edited: the page says so instead of showing the form.
 */
@Component({
  selector: 'app-external-training-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './external-training-form.component.html',
  styleUrl: './external-training-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExternalTrainingFormComponent {
  private readonly service = inject(ExternalTrainingService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  /** Route param on the edit route (withComponentInputBinding); absent on "new". */
  readonly id = input<string | undefined>(undefined);

  protected readonly profileLink = `/${LmsRoutes.Profile}`;
  protected readonly maxText = MAX_TEXT;
  protected readonly today = today();

  protected readonly form = this.fb.group(
    {
      title: ['', [Validators.required, Validators.maxLength(MAX_TEXT)]],
      provider: ['', [Validators.required, Validators.maxLength(MAX_TEXT)]],
      start_date: ['', [Validators.required]],
      end_date: ['', [Validators.required]],
      hours: ['', [Validators.required, Validators.min(0.5), Validators.max(2000), halfSteps]],
      cost: ['', [Validators.min(0), Validators.max(9999999.99)]],
    },
    { validators: datesValid },
  );
  private readonly formValid = toSignal(
    this.form.statusChanges.pipe(startWith(this.form.status), map((s) => s === 'VALID')),
    { initialValue: false },
  );

  protected readonly state = signal<LoadState>('ready');
  protected readonly existing = signal<ExternalTrainingRequest | null>(null);
  protected readonly file = signal<File | null>(null);
  protected readonly fileError = signal<string | null>(null);
  protected readonly serverErrors = signal<Partial<Record<Field, string>>>({});
  protected readonly saving = signal(false);

  protected readonly editing = computed(() => this.id() !== undefined);
  protected readonly hasCertificate = computed(() => this.file() !== null || this.existing() !== null);
  protected readonly canSubmit = computed(
    () => this.state() === 'ready' && this.formValid() && this.hasCertificate() && !this.fileError() && !this.saving(),
  );

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id));
    }, { allowSignalWrites: true });
  }

  protected load(id = this.id()): void {
    if (id === undefined) {
      this.state.set('ready');
      return;
    }
    const n = Number(id);
    if (!Number.isInteger(n) || n < 1) {
      this.state.set('not-found');
      return;
    }
    this.state.set('loading');
    this.service.get(n).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (r) => {
        this.existing.set(r);
        if (r.status !== 'pending') {
          this.state.set('decided');
          return;
        }
        this.form.reset({
          title: r.title,
          provider: r.provider,
          start_date: r.start_date,
          end_date: r.end_date,
          hours: String(r.hours),
          cost: r.cost === null ? '' : String(r.cost),
        });
        this.state.set('ready');
      },
      error: (e: unknown) => this.state.set(e instanceof HttpErrorResponse && e.status === 404 ? 'not-found' : 'error'),
    });
  }

  protected invalid(name: Exclude<Field, 'certificate'>): boolean {
    const c = this.form.controls[name];
    const cross =
      (name === 'end_date' && (this.form.hasError('endBeforeStart') || this.form.hasError('endInFuture')) && c.touched);
    return (c.invalid && c.touched) || cross || !!this.serverErrors()[name];
  }

  protected errorKey(name: Exclude<Field, 'certificate'>): string {
    const c = this.form.controls[name];
    if (c.hasError('required')) return 'feature.external_training.errors.required';
    if (c.hasError('maxlength')) return 'feature.external_training.errors.too_long';
    if (c.hasError('step')) return 'feature.external_training.errors.hours_step';
    if (c.hasError('min') || c.hasError('max')) return name === 'hours'
      ? 'feature.external_training.errors.hours_range'
      : 'feature.external_training.errors.cost_range';
    if (this.form.hasError('endBeforeStart')) return 'feature.external_training.errors.end_before_start';
    if (this.form.hasError('endInFuture')) return 'feature.external_training.errors.end_in_future';
    return 'feature.external_training.errors.required';
  }

  protected clearServer(name: Field): void {
    if (!this.serverErrors()[name]) return;
    const { [name]: _gone, ...rest } = this.serverErrors();
    this.serverErrors.set(rest);
  }

  protected onFile(input: HTMLInputElement): void {
    const f = input.files?.[0] ?? null;
    input.value = '';
    this.clearServer('certificate');
    if (!f) return;
    if (!(TYPES.includes(f.type) || EXTENSIONS.test(f.name))) {
      this.file.set(null);
      this.fileError.set(this.translate.instant('feature.external_training.errors.file_type'));
      return;
    }
    if (f.size > MAX_BYTES) {
      this.file.set(null);
      this.fileError.set(this.translate.instant('feature.external_training.errors.file_size'));
      return;
    }
    this.fileError.set(null);
    this.file.set(f);
  }

  protected removeFile(): void {
    this.file.set(null);
    this.fileError.set(null);
  }

  protected size(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (!this.canSubmit()) return;
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.serverErrors.set({});
    const existing = this.existing();
    this.service
      .save(
        {
          title: v.title.trim(),
          provider: v.provider.trim(),
          start_date: v.start_date,
          end_date: v.end_date,
          hours: Number(v.hours),
          cost: v.cost === '' ? null : Number(v.cost),
        },
        this.file(),
        existing?.id,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.notify.success(this.translate.instant(existing ? 'feature.external_training.updated' : 'feature.external_training.submitted'));
          void this.router.navigateByUrl(this.profileLink);
        },
        error: (e: unknown) => {
          this.saving.set(false);
          this.showError(e);
        },
      });
  }

  private showError(e: unknown): void {
    if (e instanceof HttpErrorResponse && e.status === 422) {
      const errors = (e.error?.errors ?? {}) as Record<string, string[]>;
      const mapped: Partial<Record<Field, string>> = {};
      for (const key of ['title', 'provider', 'start_date', 'end_date', 'hours', 'cost', 'certificate'] as const) {
        if (errors[key]?.[0]) mapped[key] = errors[key][0];
      }
      this.serverErrors.set(mapped);
      const other = errors['request']?.[0];
      if (other) this.notify.error(other);
      if (!Object.keys(mapped).length && !other) this.notify.error(this.translate.instant('feature.external_training.save_failed'));
      return;
    }
    this.notify.error(this.translate.instant('feature.external_training.save_failed'));
  }
}
