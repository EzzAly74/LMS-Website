import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnInit, afterNextRender, inject, signal } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { NotificationService } from '../../../../core/services/notification.service';
import { ContactInfo } from '../../models/contact.models';
import { ContactService } from '../../services/contact.service';

/** Guests the server accepts (ContactRequestRequest::MAX_GUESTS). */
const MAX_GUESTS = 5;

/**
 * An address the server will mail: `Validators.email` accepts `name@domain`,
 * which the server (email:rfc,filter) refuses, so the form showed nothing and
 * the send failed (NEW2B-5867). The domain needs a dot.
 */
function mailableEmail(control: AbstractControl<string | null>): ValidationErrors | null {
  const v = (control.value ?? '').trim();
  return v === '' || /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(v) ? null : { email: true };
}

type Field = 'name' | 'email' | 'phone' | 'job_title' | 'company_name';
const FIELDS: readonly Field[] = ['name', 'email', 'phone', 'job_title', 'company_name'];

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly contact = inject(ContactService);
  private readonly notify = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly injector = inject(Injector);
  protected readonly MAX_GUESTS = MAX_GUESTS;

  protected readonly info = signal<ContactInfo | null>(null);
  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, mailableEmail, Validators.maxLength(255)]],
    guests: this.fb.array<FormControl<string>>([]),
    phone: ['', [Validators.maxLength(50)]],
    job_title: ['', [Validators.required, Validators.maxLength(255)]],
    company_name: ['', [Validators.required, Validators.maxLength(255)]],
  });

  get guests(): FormArray<FormControl<string>> {
    return this.form.controls.guests;
  }

  ngOnInit(): void {
    this.contact.getInfo().subscribe({
      next: (res) => {
        if (res.status === 'success' && res.result) this.info.set(res.result);
      },
    });
  }

  protected addGuest(): void {
    if (this.guests.length >= MAX_GUESTS) return;
    this.guests.push(
      this.fb.control('', { nonNullable: true, validators: [Validators.required, mailableEmail, Validators.maxLength(255)] }),
    );
    // Focus the new field: at the limit the Add guests button that had focus is removed.
    const id = `c-guest-${this.guests.length - 1}`;
    afterNextRender(() => document.getElementById(id)?.focus(), { injector: this.injector });
  }

  protected removeGuest(index: number): void {
    this.guests.removeAt(index);
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.submitting.set(true);
    const v = this.form.getRawValue();
    const guests = (v.guests ?? []).map((g) => g.trim()).filter(Boolean);

    this.contact
      .submit({
        name: v.name!.trim(),
        email: v.email!.trim(),
        phone: v.phone?.trim() || null,
        job_title: v.job_title!.trim(),
        company_name: v.company_name!.trim(),
        guests: guests.length ? guests : undefined,
      })
      .subscribe({
        next: (res) => {
          this.submitting.set(false);
          if (res.status === 'success') {
            this.submitted.set(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            this.showError();
          }
        },
        error: (e: unknown) => {
          this.submitting.set(false);
          this.showServerErrors(e, guests);
        },
      });
  }

  /** The server's own message on the field it names; other failures are toasted by the error interceptor. */
  private showServerErrors(e: unknown, sentGuests: string[]): void {
    if (!(e instanceof HttpErrorResponse) || e.status !== 422) return;
    const errors = (e.error?.errors ?? {}) as Record<string, string[] | undefined>;
    let shown = false;
    for (const key of FIELDS) {
      const message = errors[key]?.[0];
      if (message) { this.form.controls[key].setErrors({ server: message }); shown = true; }
    }
    // guests.N is the N-th address sent: blanks were dropped before sending.
    sentGuests.forEach((address, i) => {
      const message = errors[`guests.${i}`]?.[0];
      const control = this.guests.controls.find((c) => c.value.trim() === address);
      if (message && control) { control.setErrors({ server: message }); control.markAsTouched(); shown = true; }
    });
    if (!shown) this.showError();
    this.cdr.markForCheck();
  }

  /** The message under a field: the server's words when it sent some. */
  protected errorKey(control: AbstractControl): string {
    if (control.hasError('server')) return control.getError('server') as string;
    return control.hasError('required') ? 'feature.contact.errors.required' : 'feature.contact.errors.email';
  }

  private showError(): void {
    this.notify.error('common.error_generic');
  }
}
