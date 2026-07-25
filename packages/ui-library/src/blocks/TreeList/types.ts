export interface TreeNode {
  id: string;
  label: string;
  tooltip?: string;
  isSubheading?: boolean;
  completed?: boolean;
  children?: TreeNode[];
}

export interface TreeListLabels {
  /** aria-label for the root nav element. */
  ariaLabel?: string;
}

export const DEFAULT_TREE_LIST_LABELS: Required<TreeListLabels> = {
  ariaLabel: "Content menu",
};

export interface TreeListConfig {
  labels?: TreeListLabels;
}

export interface TreeListProps {
  tree: TreeNode[];
  selectedId: string | null;
  activeGroup: string;
  onSelectItem: (id: string) => void;
  onSelectGroup: (group: string) => void;
  config?: TreeListConfig;
}
