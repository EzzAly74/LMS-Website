import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ComingSoonComponent } from '../../../../shared/components/coming-soon/coming-soon.component';

@Component({
  selector: 'app-blogs-page',
  standalone: true,
  imports: [ComingSoonComponent],
  template: `<app-coming-soon titleKey="core.nav.blogs" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogsPageComponent {}
