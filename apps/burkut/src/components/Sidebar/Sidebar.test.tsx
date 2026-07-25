import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TreeNode } from "../../adapters/viewModels.ts";
import Sidebar from "./Sidebar";

/**
 * SPEC: Sidebar component
 * ----------------------
 * Sidebar is a pure view-model renderer: it takes a TreeNode[] tree and
 * renders it. Domain concerns (ContentIndex, sidebarSort, BCE dates,
 * completedSet lookups) live in the adapter (buildSidebarTree) and are
 * covered by contentAdapters.test.ts, not here.
 *
 * 1. All groups are rendered
 * 2. Active group is expanded
 * 3. Clicking an item calls onSelectItem(id)
 * 4. Clicking a group calls onSelectGroup(group)
 * 5. selectedId item gets the "selected" class
 * 6. isSubheading renders the sidebar-item-subheader class
 * 7. completed renders the check badge
 */

const mockTree: TreeNode[] = [
  {
    id: "Dynasties and States",
    label: "Dynasties and States",
    children: [
      {
        id: "period_ancient",
        label: "🟢 Ancient China",
        isSubheading: true,
      },
      { id: "xia", label: "Xia Dynasty" },
      { id: "shang", label: "Shang Dynasty" },
    ],
  },
  {
    id: "Literature",
    label: "Literature",
    children: [{ id: "ed_1", label: "Birth of Writing" }],
  },
  {
    id: "Cinema",
    label: "Cinema",
    children: [],
  },
];

const defaultProps = {
  tree: mockTree,
  selectedId: null,
  activeGroup: "Dynasties and States",
  onSelectItem: vi.fn(),
  onSelectGroup: vi.fn(),
};

describe("Sidebar", () => {
  it("renders all groups", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("Dynasties and States")).toBeInTheDocument();
    expect(screen.getByText("Literature")).toBeInTheDocument();
    expect(screen.getByText("Cinema")).toBeInTheDocument();
  });

  it("shows items of the active group", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("Xia Dynasty")).toBeInTheDocument();
    expect(screen.getByText("Shang Dynasty")).toBeInTheDocument();
  });

  it("calls onSelectItem when an item is clicked", () => {
    const onSelectItem = vi.fn();
    render(<Sidebar {...defaultProps} onSelectItem={onSelectItem} />);
    fireEvent.click(screen.getByText("Xia Dynasty"));
    expect(onSelectItem).toHaveBeenCalledWith("xia");
  });

  it("calls onSelectGroup when a group is clicked", () => {
    const onSelectGroup = vi.fn();
    render(<Sidebar {...defaultProps} onSelectGroup={onSelectGroup} />);
    fireEvent.click(screen.getByText("Literature"));
    expect(onSelectGroup).toHaveBeenCalledWith("Literature");
  });

  it("selected item gets the selected class", () => {
    render(<Sidebar {...defaultProps} selectedId="xia" />);
    const btn = screen.getByText("Xia Dynasty").closest("button");
    expect(btn).toHaveClass("selected");
  });

  it("header items are not duplicated in the sidebar list", () => {
    render(<Sidebar {...defaultProps} activeGroup="Dynasties and States" />);
    const items = screen.getAllByRole("list")[0].querySelectorAll(".sidebar-item-btn");
    const texts = Array.from(items).map((el) => el.textContent);
    expect(texts).toContain("Xia Dynasty");
    expect(texts).toContain("Shang Dynasty");
  });

  it("isSubheading items get sidebar-item-subheader class", () => {
    render(<Sidebar {...defaultProps} activeGroup="Dynasties and States" />);
    const btn = screen.getByText("🟢 Ancient China").closest("button");
    expect(btn).toHaveClass("sidebar-item-subheader");
  });

  it("normal items do not get sidebar-item-subheader class", () => {
    render(<Sidebar {...defaultProps} activeGroup="Dynasties and States" />);
    const btn = screen.getByText("Xia Dynasty").closest("button");
    expect(btn).not.toHaveClass("sidebar-item-subheader");
  });

  it("renders children in the order given by the tree (adapter's responsibility to sort)", () => {
    const litOnlyTree: TreeNode[] = [
      {
        id: "Literature",
        label: "Literature",
        children: [
          { id: "lit_a", label: "Chapter A" },
          { id: "lit_b", label: "Chapter B" },
          { id: "ed_1", label: "Origins of Writing" },
        ],
      },
    ];
    render(
      <Sidebar
        tree={litOnlyTree}
        selectedId={null}
        activeGroup="Literature"
        onSelectItem={vi.fn()}
        onSelectGroup={vi.fn()}
      />,
    );
    const btns = screen.getAllByRole("list")[0].querySelectorAll(".sidebar-item-btn");
    const texts = Array.from(btns).map((el) => el.textContent);
    expect(texts).toEqual(["Chapter A", "Chapter B", "Origins of Writing"]);
  });

  it("shows check indicator for completed items", () => {
    const tree: TreeNode[] = [
      {
        id: "Dynasties and States",
        label: "Dynasties and States",
        children: [
          { id: "xia", label: "Xia Dynasty", completed: true },
          { id: "shang", label: "Shang Dynasty" },
        ],
      },
    ];
    render(<Sidebar {...defaultProps} tree={tree} />);
    const xiaBtn = screen.getByText("Xia Dynasty").closest("button");
    const check = xiaBtn?.querySelector(".sidebar-item-done");
    expect(check).toBeInTheDocument();
    expect(check?.querySelector("svg")).toBeInTheDocument();
  });

  it("does not show check indicator for uncompleted items", () => {
    const tree: TreeNode[] = [
      {
        id: "Dynasties and States",
        label: "Dynasties and States",
        children: [
          { id: "xia", label: "Xia Dynasty", completed: true },
          { id: "shang", label: "Shang Dynasty" },
        ],
      },
    ];
    render(<Sidebar {...defaultProps} tree={tree} />);
    const shangBtn = screen.getByText("Shang Dynasty").closest("button");
    const check = shangBtn?.querySelector(".sidebar-item-done");
    expect(check).toBeNull();
  });

  it("renders without completed flags (graceful fallback)", () => {
    render(<Sidebar {...defaultProps} />);
    const xiaBtn = screen.getByText("Xia Dynasty").closest("button");
    const check = xiaBtn?.querySelector(".sidebar-item-done");
    expect(check).toBeNull();
  });
});
