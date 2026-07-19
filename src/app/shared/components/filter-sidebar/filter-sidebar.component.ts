import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { FilterOption, FilterSection, FilterSelection, FilterSidebarConfig } from './filter-sidebar.model';

/**
 * Catalogue filter sidebar (Type/Level/Duration checkboxes with counts, Job Role
 * chips, Sort By as a single-select). Renders as a collapsible-section panel on
 * desktop/tablet and as a horizontal trigger-chip row + bottom sheet on mobile,
 * per the Figma web (node 828:43785) and mobile (node 963:48258) frames.
 *
 * Sort By is modelled as a `radio` section (single choice) even though the
 * Figma mock reuses the checkbox glyph for it — a multi-select-looking sort
 * control is a real usability bug in the source design, not a visual detail,
 * so this renders it as a radio while keeping every spacing/color token identical.
 */
@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './filter-sidebar.component.html',
  styleUrl: './filter-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterSidebarComponent {
  @Input({ required: true }) config!: FilterSidebarConfig;
  @Input() selected: FilterSelection = {};
  @Input() resultsCount = 0;
  @Output() selectedChange = new EventEmitter<FilterSelection>();
  @Output() clearAll = new EventEmitter<void>();

  protected readonly expandedKeys = signal<Set<string>>(new Set());
  protected readonly mobileSheetSection = signal<FilterSection | null>(null);
  protected draftValues: string[] = [];

  private initialised = false;

  ngOnChanges(): void {
    if (!this.initialised && this.config) {
      this.expandedKeys.set(new Set(this.config.sections.filter((s) => s.expanded).map((s) => s.key)));
      this.initialised = true;
    }
  }

  protected isExpanded(section: FilterSection): boolean {
    return this.expandedKeys().has(section.key);
  }

  protected toggleSection(section: FilterSection): void {
    const next = new Set(this.expandedKeys());
    if (next.has(section.key)) {
      next.delete(section.key);
    } else {
      next.add(section.key);
    }
    this.expandedKeys.set(next);
  }

  protected valuesFor(sectionKey: string): string[] {
    return this.selected[sectionKey] ?? [];
  }

  protected isChecked(sectionKey: string, value: string): boolean {
    return this.valuesFor(sectionKey).includes(value);
  }

  protected selectedCountFor(sectionKey: string): number {
    return this.valuesFor(sectionKey).length;
  }

  protected toggleOption(section: FilterSection, option: FilterOption): void {
    const current = this.valuesFor(section.key);
    let next: string[];

    if (section.type === 'radio') {
      next = current.includes(option.value) ? [] : [option.value];
    } else if (current.includes(option.value)) {
      next = current.filter((v) => v !== option.value);
    } else {
      next = [...current, option.value];
    }

    this.selectedChange.emit({ ...this.selected, [section.key]: next });
  }

  protected onClearAll(): void {
    this.clearAll.emit();
  }

  protected openMobileSheet(section: FilterSection): void {
    this.draftValues = [...this.valuesFor(section.key)];
    this.mobileSheetSection.set(section);
  }

  protected closeMobileSheet(): void {
    this.mobileSheetSection.set(null);
  }

  protected isDraftChecked(value: string): boolean {
    return this.draftValues.includes(value);
  }

  protected toggleDraftOption(section: FilterSection, option: FilterOption): void {
    if (section.type === 'radio') {
      this.draftValues = this.draftValues.includes(option.value) ? [] : [option.value];
      return;
    }
    this.draftValues = this.isDraftChecked(option.value)
      ? this.draftValues.filter((v) => v !== option.value)
      : [...this.draftValues, option.value];
  }

  protected applyMobileSheet(): void {
    const section = this.mobileSheetSection();
    if (section) {
      this.selectedChange.emit({ ...this.selected, [section.key]: this.draftValues });
    }
    this.closeMobileSheet();
  }
}
