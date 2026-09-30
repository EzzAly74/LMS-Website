import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToasterComponent } from './shared/components/toaster/toaster.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToasterComponent],
  template: `
    <router-outlet />
    <!-- The only toast outlet (D-072); pages call NotificationService. -->
    <app-toaster />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
