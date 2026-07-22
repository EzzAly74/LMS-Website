import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AppLanguage } from '../../enums/language.enum';
import { AuthService } from '../../auth/auth.service';
import { LmsRoutes } from '../../enums/lms-routes.enum';
import { LanguageService } from '../../services/language.service';
import { NotificationBellComponent } from '../../../shared/components/notification-bell/notification-bell.component';
import { NotificationInboxService } from '../../services/notification-inbox.service';
import { NotificationPanelComponent } from '../../../shared/components/notification-panel/notification-panel.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';

/**
 * Global site header — a floating rounded nav island (per Figma node
 * 933:46986 desktop / 963:49776 mobile). On mobile the burger opens a
 * full-screen menu (Figma 963:50056 / 963:50706) — a page takeover, not a
 * drawer — with a Languages accordion and a Notification row that swaps in the
 * full-screen notifications panel (Figma 963:50814). Auth state controls which
 * items render.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    NotificationBellComponent,
    NotificationPanelComponent,
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
  protected readonly inbox = inject(NotificationInboxService);

  protected readonly routes = LmsRoutes;
  protected readonly languages = [AppLanguage.En, AppLanguage.Ar];
  protected readonly isProfileMenuOpen = signal(false);
  protected readonly isMobileMenuOpen = signal(false);
  /** Mobile menu: Languages accordion expanded (Figma chevron state). */
  protected readonly isLangExpanded = signal(false);
  /** Mobile menu: the full-screen notifications view is showing. */
  protected readonly isMobileNotifOpen = signal(false);

  protected toggleLanguage(): void {
    this.language.toggle();
  }

  protected setLanguage(lang: AppLanguage): void {
    this.language.use(lang);
    this.isLangExpanded.set(false);
  }

  protected toggleLangExpanded(): void {
    this.isLangExpanded.update((open) => !open);
  }

  protected toggleProfileMenu(): void {
    this.isProfileMenuOpen.update((open) => !open);
  }

  protected closeProfileMenu(): void {
    this.isProfileMenuOpen.set(false);
  }

  protected toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((open) => {
      const next = !open;
      if (!next) this.resetMobileMenu();
      return next;
    });
  }

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
    this.resetMobileMenu();
  }

  private resetMobileMenu(): void {
    this.isLangExpanded.set(false);
    this.isMobileNotifOpen.set(false);
  }

  protected openMobileNotifications(): void {
    this.inbox.loadFirstPage();
    this.isMobileNotifOpen.set(true);
  }

  protected closeMobileNotifications(): void {
    this.isMobileNotifOpen.set(false);
  }

  protected logout(): void {
    this.closeProfileMenu();
    this.closeMobileMenu();
    // Always return to the public home page after signing out.
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: () => this.router.navigateByUrl('/'),
    });
  }
}
