import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../../auth/auth.service';
import { AppLanguage } from '../../enums/language.enum';
import { LmsRoutes } from '../../enums/lms-routes.enum';
import { LanguageService } from '../../services/language.service';

/**
 * Global site header. Interim scaffold: structure + behaviour (nav, language
 * switch, auth-aware actions) are in place; final visuals are refined against
 * the Figma catalogue/login frames.
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
  protected readonly isRtl = this.language.isRtl;
  protected readonly currentLang = this.language.current;

  protected toggleLanguage(): void {
    this.language.toggle();
  }

  protected get otherLanguageLabel(): string {
    return this.currentLang() === AppLanguage.En
      ? 'core.language.ar'
      : 'core.language.en';
  }
}
