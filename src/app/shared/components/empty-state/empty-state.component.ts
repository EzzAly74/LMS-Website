import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export interface EmptyStateConfig {
  /** PrimeIcon class, e.g. 'pi-search'. */
  icon: string;
  /** Already-translated title. */
  title: string;
  /** Already-translated message. */
  message?: string;
  /** Already-translated action label; omit to hide the action button. */
  actionLabel?: string;
}

/** No-results / empty illustration with a message and optional action. */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty-state">
      <i class="empty-state__icon pi {{ config.icon }}"></i>
      <h2 class="empty-state__title">{{ config.title }}</h2>
      @if (config.message) {
        <p class="empty-state__message">{{ config.message }}</p>
      }
      @if (config.actionLabel) {
        <button type="button" class="empty-state__action" (click)="action.emit()">
          {{ config.actionLabel }}
        </button>
      }
    </div>
  `,
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  @Input({ required: true }) config!: EmptyStateConfig;
  @Output() action = new EventEmitter<void>();
}
