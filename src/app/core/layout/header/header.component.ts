import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../../auth/auth.service';
import { LmsRoutes } from '../../enums/lms-routes.enum';
import { LanguageService } from '../../services/language.service';

/**
 * Global site header — a floating rounded nav island (per the Figma frames).
 * Guest state is final; the logged-in state (avatar, notifications bell) is
 * refined against the catalogue frames when those are built.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private readonly language = inject(LanguageService);
  protected readonly auth = inject(AuthService);

  protected readonly routes = LmsRoutes;

  protected toggleLanguage(): void {
    this.language.toggle();
  }
}
