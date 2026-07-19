import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export interface ToggleOption {
  value: string;
  /** Already-translated label. */
  label: string;
  count?: number;
}

/** Segmented control (e.g. "Tailored for Me" / "Explore All"). Two-way [(value)]. */
@Component({
  selector: 'app-toggle-tabs',
  standalone: true,
  template: `
    <div class="toggle-tabs" role="tablist">
      @for (option of options; track option.value) {
        <button
          type="button"
          role="tab"
          class="toggle-tabs__tab"
          [class.is-active]="option.value === value"
          [attr.aria-selected]="option.value === value"
          (click)="select(option.value)"
        >
          {{ option.label }}
          @if (option.count !== undefined) {
            <span class="toggle-tabs__count">{{ option.count }}</span>
          }
        </button>
      }
    </div>
  `,
  styleUrl: './toggle-tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleTabsComponent {
  @Input({ required: true }) options: ToggleOption[] = [];
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  protected select(value: string): void {
    if (value !== this.value) {
      this.valueChange.emit(value);
    }
  }
}
