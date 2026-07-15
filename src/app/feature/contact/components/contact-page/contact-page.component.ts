import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { NotificationService } from '../../../../core/services/notification.service';
import { ContactInfo } from '../../models/contact.models';
import { ContactService } from '../../services/contact.service';

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
  private readonly translate = inject(TranslateService);

  protected readonly info = signal<ContactInfo | null>(null);
  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
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
    this.guests.push(
      this.fb.control('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    );
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
        error: () => {
          this.submitting.set(false);
          this.showError();
        },
      });
  }

  private showError(): void {
    this.notify.error(this.translate.instant('common.error_generic'));
  }
}
