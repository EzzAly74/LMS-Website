import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

/**
 * App-wide toast messages (success/error/info/warn). This is distinct from the
 * in-app notification bell/panel, which is a feature-owned surface.
 * Backed by PrimeNG MessageService; rendered by the global <p-toast>.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly messages = inject(MessageService);
  private readonly defaultLife = 4000;

  success(detail: string, summary?: string): void {
    this.messages.add({ severity: 'success', summary, detail, life: this.defaultLife });
  }

  error(detail: string, summary?: string): void {
    this.messages.add({ severity: 'error', summary, detail, life: this.defaultLife });
  }

  info(detail: string, summary?: string): void {
    this.messages.add({ severity: 'info', summary, detail, life: this.defaultLife });
  }

  warn(detail: string, summary?: string): void {
    this.messages.add({ severity: 'warn', summary, detail, life: this.defaultLife });
  }

  clear(): void {
    this.messages.clear();
  }
}
