import { Injectable, OnDestroy, effect, inject } from '@angular/core';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { TokenStorageService } from '../auth/token-storage.service';

/**
 * Single Reverb/Echo connection for the learner website, rebuilt whenever
 * the auth user changes (login → connect with the stored Bearer token;
 * logout → disconnect). Backed by the same `identity.{type}.{id}` /
 * `conversation.{id}` private channels the backend authorizes in
 * `routes/channels.php` — see `MessageService::broadcastMessage()`.
 */
@Injectable({ providedIn: 'root' })
export class EchoService implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly tokenStorage = inject(TokenStorageService);
  private echo: Echo<'reverb'> | null = null;

  constructor() {
    effect(() => {
      const user = this.auth.user();
      this.teardown();
      const token = this.tokenStorage.get();
      if (user && token) this.echo = this.buildConnection(token);
    });
  }

  /** Subscribe to a private channel by its bare name (no `private-` prefix). */
  channel(name: string) {
    return this.echo?.private(name) ?? null;
  }

  leave(name: string): void {
    this.echo?.leave(name);
  }

  ngOnDestroy(): void {
    this.teardown();
  }

  private buildConnection(token: string): Echo<'reverb'> {
    const apiOrigin = environment.apiBaseUrl.replace(/\/api\/v1\/?$/, '');

    return new Echo({
      broadcaster: 'reverb',
      key: environment.reverb.key,
      wsHost: environment.reverb.host,
      wsPort: environment.reverb.port,
      wssPort: environment.reverb.port,
      forceTLS: environment.reverb.scheme === 'https' || environment.reverb.scheme === 'wss',
      enabledTransports: ['ws', 'wss'],
      authEndpoint: `${apiOrigin}/api/broadcasting/auth`,
      auth: { headers: { Authorization: `Bearer ${token}` } },
      Pusher,
    });
  }

  private teardown(): void {
    this.echo?.disconnect();
    this.echo = null;
  }
}
