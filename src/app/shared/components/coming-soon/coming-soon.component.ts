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
  styleUrl: './coming-soon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComingSoonComponent {
  @Input({ required: true }) titleKey!: string;
}
