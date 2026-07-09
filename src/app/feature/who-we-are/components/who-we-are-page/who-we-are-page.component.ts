import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ComingSoonComponent } from '../../../../shared/components/coming-soon/coming-soon.component';

@Component({
  selector: 'app-who-we-are-page',
  standalone: true,
  imports: [ComingSoonComponent],
  template: `<app-coming-soon titleKey="core.nav.who_we_are" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhoWeArePageComponent {}
