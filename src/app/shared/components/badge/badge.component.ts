import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type BadgeTone = 'level' | 'delivery' | 'certificate';

/** Only meaningful when `tone` is 'certificate' — drives the color treatment. */
export type CertificateBadgeStatus = 'earned' | 'on_track' | 'at_risk' | 'blocked';

/**
 * Small pill used for course level (Beginner/Intermediate/Professional),
 * delivery mode (Online/Offline/Hybrid), and certificate progress status
 * (On track/At risk/Blocked/Earned). Tone drives the visual treatment;
 * callers pass an already-translated label and an optional PrimeIcon class.
 */
@Component({
  selector: 'app-badge',
  standalone: true,
  template: `
    <span
      class="badge badge--{{ tone }}"
      [class.badge--certificate-on_track]="tone === 'certificate' && (status === 'on_track' || status === 'earned')"
      [class.badge--certificate-at_risk]="tone === 'certificate' && status === 'at_risk'"
      [class.badge--certificate-blocked]="tone === 'certificate' && status === 'blocked'"
    >
      @if (icon) {
        <i class="badge__icon pi {{ icon }}"></i>
      }
      <span class="badge__label">{{ label }}</span>
    </span>
  `,
  styleUrl: './badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  @Input({ required: true }) label!: string;
  @Input() tone: BadgeTone = 'level';
  @Input() icon?: string;
  @Input() status?: CertificateBadgeStatus;
}
