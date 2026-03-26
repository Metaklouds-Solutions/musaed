export interface UnifiedFilterOption {
  value: string;
  label: string;
}

export interface UnifiedFilterField {
  id: string;
  label: string;
  value: string;
  options: UnifiedFilterOption[];
}

export interface UnifiedFilterTab {
  value: string;
  label: string;
}

export interface UnifiedSavedView {
  id: string;
  name: string;
}

export interface UnifiedFilterState {
  query: string;
  chips: Record<string, string>;
  dateFrom?: string;
  dateTo?: string;
  savedViewId?: string;
}

export interface UnifiedFilterConfig {
  tabs?: UnifiedFilterTab[];
  fields?: UnifiedFilterField[];
  searchPlaceholder?: string;
}
