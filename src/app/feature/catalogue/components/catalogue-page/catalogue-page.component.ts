import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Course catalogue. Placeholder shell — the filter-sidebar + card-grid pattern
 * is built next, pixel-perfect from the Figma catalogue frames.
 */
@Component({
  selector: 'app-catalogue-page',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="catalogue-page">
      <h1>{{ 'core.nav.catalogue' | translate }}</h1>
    </div>
  `,
  styles: `
    .catalogue-page {
      padding: var(--spacing-3xs);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CataloguePageComponent {}
