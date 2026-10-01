import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';

export type ToastSeverity = 'success' | 'info' | 'warn' | 'error';

export interface ToastOptions {
  /** i18n key or text; defaults to the severity's title ("Done", "Something went wrong"). */
  readonly title?: string;
  /** Interpolation params for the message and title keys. */
  readonly params?: Record<string, unknown>;
  /** Milliseconds on screen; defaults per severity (errors stay longest). */
  readonly life?: number;
  /** Stays until dismissed. */
  readonly sticky?: boolean;
}

/** How long each kind of toast stays: long enough to read, errors longest. */
export const TOAST_LIFE: Readonly<Record<ToastSeverity, number>> = {
  success: 4000,
  info: 5000,
  warn: 6000,
  error: 7000,
};

/** A second problem toast this soon after one is the same failure reported twice. */
const PROBLEM_WINDOW_MS = 1500;

/**
 * App-wide toast messages (D-072) - the only way to show one. This is distinct
 * from the in-app notification bell/panel, which is a feature-owned surface.
 * Rendered by the single <app-toaster> in the root component.
 *
 * Messages and titles are i18n keys or text that is already translated (such
 * as a server message; an unknown key translates to itself). Every toast gets
 * its severity's title and life unless the caller gives one:
 *
 *   notify.success('feature.blogs.link_copied');
 *   notify.error(serverMessage);
 *   notify.success('feature.catalogue.enrol.success', 'feature.catalogue.enrol.success_title');
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);

  /** `options` may be just the title (key or text). */
  success(message: string, options?: string | ToastOptions): void { this.show('success', message, options); }
  error(message: string, options?: string | ToastOptions): void { this.show('error', message, options); }
  info(message: string, options?: string | ToastOptions): void { this.show('info', message, options); }
  warn(message: string, options?: string | ToastOptions): void { this.show('warn', message, options); }

  clear(): void {
    this.messages.clear();
  }

  /** When the last problem (warn / error) toast was shown. */
  private lastProblemAt = 0;

  /**
   * One failure, one toast: the error interceptor reports a failed request
   * first, and a page's own handler for the same failure a moment later would
   * stack a second one. A problem toast within PROBLEM_WINDOW_MS of another is
   * that echo and is dropped (same rule as the Dashboard, D-072).
   */
  private isEcho(severity: ToastSeverity): boolean {
    if (severity !== 'warn' && severity !== 'error') return false;
    const now = Date.now();
    const echo = now - this.lastProblemAt < PROBLEM_WINDOW_MS;
    if (!echo) this.lastProblemAt = now;
    return echo;
  }

  private show(severity: ToastSeverity, message: string, options?: string | ToastOptions): void {
    if (this.isEcho(severity)) return;
    const o: ToastOptions = typeof options === 'string' ? { title: options } : (options ?? {});
    this.messages.add({
      severity,
      summary: this.text(o.title || `core.toast.${severity}`, o.params),
      detail: this.text(message, o.params),
      life: o.life ?? TOAST_LIFE[severity],
      sticky: o.sticky,
    });
  }

  private text(keyOrText: string, params?: Record<string, unknown>): string {
    return keyOrText ? this.translate.instant(keyOrText, params) : '';
  }
}
