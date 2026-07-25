import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TreeList } from "./TreeList.tsx";
import type { TreeNode } from "./types.ts";

const mockTree: TreeNode[] = [
  {
    id: "Dynasties and States",
    label: "Dynasties and States",
    children: [
      { id: "period_ancient", label: "🟢 Ancient China", isSubheading: true },
      { id: "xia", label: "Xia Dynasty" },
      { id: "shang", label: "Shang Dynasty" },
    ],
  },
  {
    id: "Literature",
    label: "Literature",
    children: [{ id: "ed_1", label: "Birth of Writing" }],
  },
  { id: "Cinema", label: "Cinema", children: [] },
];

const defaultProps = {
  tree: mockTree,
  selectedId: null,
  activeGroup: "Dynasties and States",
  onSelectItem: vi.fn(),
  onSelectGroup: vi.fn(),
};

describe("TreeList", () => {
  it("renders all groups and the active group's items", () => {
    render(<TreeList {...defaultProps} />);
    expect(screen.getByText("Dynasties and States")).toBeInTheDocument();
    expect(screen.getByText("Literature")).toBeInTheDocument();
    expect(screen.getByText("Cinema")).toBeInTheDocument();
    expect(screen.getByText("Xia Dynasty")).toBeInTheDocument();
    expect(screen.getByText("Shang Dynasty")).toBeInTheDocument();
  });

  it("calls item and group callbacks", () => {
    const onSelectItem = vi.fn();
    const onSelectGroup = vi.fn();
    render(
      <TreeList {...defaultProps} onSelectItem={onSelectItem} onSelectGroup={onSelectGroup} />,
    );
    fireEvent.click(screen.getByText("Xia Dynasty"));
    fireEvent.click(screen.getByText("Literature"));
    expect(onSelectItem).toHaveBeenCalledWith("xia");
    expect(onSelectGroup).toHaveBeenCalledWith("Literature");
  });

  it("applies selected and subheading classes", () => {
    render(<TreeList {...defaultProps} selectedId="xia" />);
    expect(screen.getByText("Xia Dynasty").closest("button")).toHaveClass("selected");
    expect(screen.getByText("🟢 Ancient China").closest("button")).toHaveClass(
      "sidebar-item-subheader",
    );
    expect(screen.getByText("Xia Dynasty").closest("button")).not.toHaveClass(
      "sidebar-item-subheader",
    );
  });

  it("preserves tree child order", () => {
    render(
      <TreeList
        tree={[
          {
            id: "Literature",
            label: "Literature",
            children: [
              { id: "a", label: "Chapter A" },
              { id: "b", label: "Chapter B" },
              { id: "c", label: "Origins of Writing" },
            ],
          },
        ]}
        selectedId={null}
        activeGroup="Literature"
        onSelectItem={vi.fn()}
        onSelectGroup={vi.fn()}
      />,
    );
    const buttons = screen.getAllByRole("list")[0].querySelectorAll(".sidebar-item-btn");
    expect(Array.from(buttons).map((button) => button.textContent)).toEqual([
      "Chapter A",
      "Chapter B",
      "Origins of Writing",
    ]);
  });

  it("renders completion indicators only for completed nodes", () => {
    render(
      <TreeList
        {...defaultProps}
        tree={[
          {
            id: "group",
            label: "Group",
            children: [
              { id: "done", label: "Done", completed: true },
              { id: "pending", label: "Pending" },
            ],
          },
        ]}
        activeGroup="group"
      />,
    );
    expect(
      screen.getByText("Done").closest("button")?.querySelector(".sidebar-item-done"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Pending").closest("button")?.querySelector(".sidebar-item-done"),
    ).toBeNull();
  });

  it("uses the configurable navigation label", () => {
    render(<TreeList {...defaultProps} config={{ labels: { ariaLabel: "Library contents" } }} />);
    expect(screen.getByRole("navigation", { name: "Library contents" })).toBeInTheDocument();
  });
});
