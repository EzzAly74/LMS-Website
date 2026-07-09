import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../../../core/auth/auth.service';
import { LmsRoutes } from '../../../../core/enums/lms-routes.enum';

const HTTP_UNAUTHORIZED = 401;
const HTTP_UNPROCESSABLE = 422;

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  protected readonly loading = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly showPassword = signal(false);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.serverError.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.status === 'success') {
          void this.router.navigateByUrl(this.returnUrl());
        }
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.serverError.set(this.mapError(error));
      },
    });
  }

  private mapError(error: HttpErrorResponse): string {
    if (error.status === HTTP_UNAUTHORIZED) {
      return this.translate.instant('feature.auth.login.invalid_credentials');
    }
    if (error.status === HTTP_UNPROCESSABLE) {
      return (
        error.error?.message ?? this.translate.instant('common.error_generic')
      );
    }
    return this.translate.instant('common.error_generic');
  }

  private returnUrl(): string {
    return (
      this.route.snapshot.queryParamMap.get('returnUrl') ??
      `/${LmsRoutes.Catalogue}`
    );
  }
}
