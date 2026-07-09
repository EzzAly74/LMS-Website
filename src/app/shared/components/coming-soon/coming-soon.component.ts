import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/** Business-neutral placeholder for routes whose content is not yet designed. */
@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="coming-soon">
      <h1 class="coming-soon__title">{{ titleKey | translate }}</h1>
      <p class="coming-soon__text">{{ 'common.coming_soon' | translate }}</p>
    </div>
  `,
  styles: `
    @use 'mixins' as *;

    .coming-soon {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-15xs);
      padding: var(--spacing-12xl) var(--spacing-3xs);
      text-align: center;

      &__title {
        @include typography('large-heading', 'bold');
        color: var(--color-essential-secondary);
      }

      &__text {
        @include typography('body', 'regular');
        color: var(--color-neutral-750);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComingSoonComponent {
  @Input({ required: true }) titleKey!: string;
}
