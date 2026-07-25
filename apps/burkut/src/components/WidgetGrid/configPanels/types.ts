import type { WidgetConfig, WidgetInstance } from "../../../shared/types.ts";

/** Props shared by all widget configuration panels. */
export interface WidgetConfigPanelProps {
  instance: WidgetInstance;
  onUpdate: (config: Partial<WidgetConfig>) => void;
  onClose: () => void;
}
