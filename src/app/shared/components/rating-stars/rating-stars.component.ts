import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Star rating display: filled/outline stars driven by the score, plus the
 * numeric average and (optionally) the review count. Business-neutral.
 * With no ratings it says so instead of five empty stars and "0.0".
 */
@Component({
  selector: 'app-rating-stars',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    @if (count === 0) {
      <span class="rating rating--none">{{ 'shared.no_ratings' | translate }}</span>
    } @else {
    <span class="rating">
      <span class="rating__stars" [attr.aria-label]="score.toFixed(1) + ' out of 5'">
        @for (filled of stars; track $index) {
          <i class="pi" [class.pi-star-fill]="filled" [class.pi-star]="!filled" aria-hidden="true"></i>
        }
      </span>
      <span class="rating__score">{{ score.toFixed(1) }}</span>
      @if (count > 0) {
        <span class="rating__count">({{ count }})</span>
      }
    </span>
    }
  `,
  styleUrl: './rating-stars.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatingStarsComponent {
  @Input({ required: true }) score = 0;
  @Input() count = 0;

  protected get stars(): boolean[] {
    const rounded = Math.round(this.score ?? 0);
    return Array.from({ length: 5 }, (_, i) => i < rounded);
  }
}
