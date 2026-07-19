import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastModule],
  template: `
    <router-outlet />
    <p-toast [breakpoints]="{ '480px': { width: '90%' } }" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
