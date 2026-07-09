import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Star rating display: filled/outline stars driven by the score, plus the
 * numeric average and (optionally) the review count. Business-neutral.
 */
@Component({
  selector: 'app-rating-stars',
  standalone: true,
  template: `
    <span class="rating">
      <span class="rating__stars" [attr.aria-label]="score.toFixed(1) + ' out of 5'">
        @for (filled of stars; track $index) {
          <i class="pi" [class.pi-star-fill]="filled" [class.pi-star]="!filled"></i>
        }
      </span>
      <span class="rating__score">{{ score.toFixed(1) }}</span>
      @if (count > 0) {
        <span class="rating__count">({{ count }})</span>
      }
    </span>
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
