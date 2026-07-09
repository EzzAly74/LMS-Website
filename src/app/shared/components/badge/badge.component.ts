import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type BadgeTone = 'level' | 'delivery';

/**
 * Small pill used for course level (Beginner/Intermediate/Professional) and
 * delivery mode (Online/Offline/Hybrid). Tone drives the visual treatment;
 * callers pass an already-translated label and an optional PrimeIcon class.
 */
@Component({
  selector: 'app-badge',
  standalone: true,
  template: `
    <span class="badge badge--{{ tone }}">
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
}
