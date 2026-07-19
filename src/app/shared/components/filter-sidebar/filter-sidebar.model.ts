/** How a filter section's options are selected. */
export type FilterSectionType = 'checkbox' | 'chip' | 'radio';

export interface FilterOption {
  value: string;
  /** Already-translated label. */
  label: string;
  /** Result count for this option under the currently applied filters. Omit for chip sections (no counts in the design). */
  count?: number;
}

export interface FilterSection {
  key: string;
  /** Already-translated section label (e.g. "Type", "Level"). */
  label: string;
  /** PrimeIcon class, e.g. "pi-layer". */
  icon: string;
  type: FilterSectionType;
  expanded: boolean;
  options: FilterOption[];
}

export interface FilterSidebarConfig {
  sections: FilterSection[];
}

/** sectionKey -> selected option values. Radio sections hold at most one value. */
export type FilterSelection = Record<string, string[]>;
