import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../../auth/auth.service';
import { LmsRoutes } from '../../enums/lms-routes.enum';
import { LanguageService } from '../../services/language.service';
import { NotificationBellComponent } from '../../../shared/components/notification-bell/notification-bell.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';

/**
 * Global site header — a floating rounded nav island (per Figma node
 * 933:46986 desktop / 963:49776 mobile). Guest and logged-in desktop states,
 * plus a collapsed mobile header with a slide-out nav drawer, are all built
 * here; auth state controls which items render.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    NotificationBellComponent,
    AvatarComponent,
    ClickOutsideDirective,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  protected readonly language = inject(LanguageService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly routes = LmsRoutes;
  protected readonly isProfileMenuOpen = signal(false);
  protected readonly isMobileMenuOpen = signal(false);

  protected toggleLanguage(): void {
    this.language.toggle();
  }

  protected toggleProfileMenu(): void {
    this.isProfileMenuOpen.update((open) => !open);
  }

  protected closeProfileMenu(): void {
    this.isProfileMenuOpen.set(false);
  }

  protected toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((open) => !open);
  }

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  protected logout(): void {
    this.closeProfileMenu();
    this.closeMobileMenu();
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl(`/${this.routes.Catalogue}`),
      error: () => this.router.navigateByUrl(`/${this.routes.Catalogue}`),
    });
  }
}
