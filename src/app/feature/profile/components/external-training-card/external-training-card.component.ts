import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { LmsRoutes } from '../../../../core/enums/lms-routes.enum';
import { LanguageService } from '../../../../core/services/language.service';
import { reloadOnLanguageChange } from '../../../../core/utils/reload-on-language-change';
import { NotificationService } from '../../../../core/services/notification.service';
import { ExternalTrainingRequest } from '../../models/profile.models';
import { ExternalTrainingService } from '../../services/external-training.service';

type LoadState = 'loading' | 'ready' | 'error';

/**
 * "Add External Training" card on the profile's right rail (Figma 2201:83915
 * empty, 2201:84534 with a pending request; D-057).
 *
 * Lists the learner's requests with their status. A pending one can be edited
 * or withdrawn (withdraw asks first); a rejected one shows the reason the
 * reviewer gave. The button opens the Add External Training form.
 */
@Component({
  selector: 'app-external-training-card',
  standalone: true,
  imports: [DatePipe, RouterLink, TranslatePipe],
  templateUrl: './external-training-card.component.html',
  styleUrl: './external-training-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExternalTrainingCardComponent implements OnInit {
  private readonly service = inject(ExternalTrainingService);
  private readonly notify = inject(NotificationService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly locale = inject(LanguageService).current;

  protected readonly base = `/${LmsRoutes.Profile}/external-training`;
  protected readonly state = signal<LoadState>('loading');
  protected readonly requests = signal<ExternalTrainingRequest[]>([]);
  /** The request whose withdraw is waiting for a yes / no. */
  protected readonly confirming = signal<number | null>(null);
  protected readonly withdrawing = signal<number | null>(null);

  constructor() {
    // The qualification / course names on a decided request are localized.
    reloadOnLanguageChange(() => this.load());
  }

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.service.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (rows) => {
        this.requests.set(rows);
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }

  protected withdraw(r: ExternalTrainingRequest): void {
    this.withdrawing.set(r.id);
    this.service.withdraw(r.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.withdrawing.set(null);
        this.confirming.set(null);
        this.requests.update((rows) => rows.filter((x) => x.id !== r.id));
        this.notify.success(this.translate.instant('feature.external_training.withdrawn'));
      },
      error: () => {
        this.withdrawing.set(null);
        this.confirming.set(null);
        this.notify.error(this.translate.instant('feature.external_training.withdraw_failed'));
        this.load();
      },
    });
  }
}
