export interface LayoutState {
  sidebarWidth: number;
  listWidth: number;
  sidebarCollapsed: boolean;
  listCollapsed: boolean;
}

export function createDefaultLayout(): LayoutState {
  return {
    sidebarWidth: 280,
    listWidth: 360,
    sidebarCollapsed: false,
    listCollapsed: false
  };
}

export function normalizeLayout(layout: LayoutState): LayoutState {
  return {
    ...layout,
    sidebarWidth: Math.max(220, Math.min(layout.sidebarWidth, 420)),
    listWidth: Math.max(280, Math.min(layout.listWidth, 560))
  };
}
