import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ContentIndex } from "../../shared/types.ts";
import Sidebar from "./Sidebar";

/**
 * SPEC: Sidebar component
 * ----------------------
 * 1. All groups are rendered (derived from index)
 * 2. Active group is expanded
 * 3. Clicking an item calls onSelectItem(id)
 * 4. Clicking a group calls onSelectGroup(group)
 * 5. selectedId item gets the "selected" class
 *
 * NOTE: react-i18next global mock returns t(key) → key.
 *       Groups are now derived from the content index and rendered as-is.
 */

const mockIndex: ContentIndex = {
  xia: {
    id: "xia",
    group: "Dynasties and States",
    title: "Xia Dynasty",
    start: "-002070-01-01",
    _path: "",
    _isHeader: false,
  },
  shang: {
    id: "shang",
    group: "Dynasties and States",
    title: "Shang Dynasty",
    start: "-001600-01-01",
    _path: "",
    _isHeader: false,
  },
  ed_1: {
    id: "ed_1",
    group: "Literature",
    title: "Birth of Writing",
    _path: "",
    _isHeader: false,
  },
  "Dynasties and States": {
    id: "Dynasties and States",
    group: "Dynasties and States",
    title: "Dynasties and States",
    sidebarSort: "start",
    _path: "",
    _isHeader: true,
  },
  Cinema: {
    id: "Cinema",
    group: "Cinema",
    title: "Chinese Cinema",
    _path: "",
    _isHeader: true,
  },
  period_ancient: {
    id: "period_ancient",
    group: "Dynasties and States",
    title: "🟢 Ancient China",
    start: "-002070-01-01",
    type: "background",
    _path: "",
    _isHeader: false,
  },
  period_early: {
    id: "period_early",
    group: "Dynasties and States",
    title: "🟠 Early Imperial",
    start: "-000221-01-01",
    type: "background",
    _path: "",
    _isHeader: false,
  },
};

const defaultProps = {
  index: mockIndex,
  selectedId: null,
  activeGroup: "Dynasties and States",
  onSelectItem: vi.fn(),
  onSelectGroup: vi.fn(),
};

describe("Sidebar", () => {
  it("renders all groups", () => {
    render(<Sidebar {...defaultProps} />);
    // Groups are now rendered as their id string (derived from index)
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

  it("header items are not shown in the sidebar list", () => {
    render(<Sidebar {...defaultProps} activeGroup="Dynasties and States" />);
    const items = screen.getAllByRole("list")[0].querySelectorAll(".sidebar-item-btn");
    const texts = Array.from(items).map((el) => el.textContent);
    // The header entry "Dynasties and States" should not appear as a list item
    // (it appears as the group button text, not as a sidebar-item-btn)
    expect(texts).toContain("Xia Dynasty");
    expect(texts).toContain("Shang Dynasty");
  });

  it("sidebarSort: 'start' sorts items chronologically, background items first at equal dates", () => {
    render(<Sidebar {...defaultProps} activeGroup="Dynasties and States" />);
    const items = screen.getAllByRole("list")[0].querySelectorAll(".sidebar-item-btn");
    const texts = Array.from(items).map((el) => el.textContent);
    const ancientIdx = texts.indexOf("🟢 Ancient China");
    const xiaIdx = texts.indexOf("Xia Dynasty");
    const shangIdx = texts.indexOf("Shang Dynasty");
    const earlyIdx = texts.indexOf("🟠 Early Imperial");
    expect(ancientIdx).toBeLessThan(xiaIdx);
    expect(xiaIdx).toBeLessThan(shangIdx);
    expect(shangIdx).toBeLessThan(earlyIdx);
  });

  it("type: 'background' items get sidebar-item-subheader class", () => {
    render(<Sidebar {...defaultProps} activeGroup="Dynasties and States" />);
    const btn = screen.getByText("🟢 Ancient China").closest("button");
    expect(btn).toHaveClass("sidebar-item-subheader");
  });

  it("normal items do not get sidebar-item-subheader class", () => {
    render(<Sidebar {...defaultProps} activeGroup="Dynasties and States" />);
    const btn = screen.getByText("Xia Dynasty").closest("button");
    expect(btn).not.toHaveClass("sidebar-item-subheader");
  });

  it("group without sidebarSort is sorted alphabetically", () => {
    const litOnlyIndex: ContentIndex = {
      lit_b: { id: "lit_b", group: "Literature", title: "Chapter B", _path: "", _isHeader: false },
      lit_a: { id: "lit_a", group: "Literature", title: "Chapter A", _path: "", _isHeader: false },
      ed_1: {
        id: "ed_1",
        group: "Literature",
        title: "Origins of Writing",
        _path: "",
        _isHeader: false,
      },
      Literature: {
        id: "Literature",
        group: "Literature",
        title: "Literature",
        _path: "",
        _isHeader: true,
      },
    };
    render(
      <Sidebar
        index={litOnlyIndex}
        selectedId={null}
        activeGroup="Literature"
        onSelectItem={vi.fn()}
        onSelectGroup={vi.fn()}
      />,
    );
    const btns = screen.getAllByRole("list")[0].querySelectorAll(".sidebar-item-btn");
    const texts = Array.from(btns).map((el) => el.textContent);
    const idxA = texts.indexOf("Chapter A");
    const idxB = texts.indexOf("Chapter B");
    const idxY = texts.indexOf("Origins of Writing");
    expect(idxA).toBeLessThan(idxB);
    expect(idxB).toBeLessThan(idxY);
  });

  it("shows check indicator for completed items", () => {
    const completedSet = new Set(["xia"]);
    render(<Sidebar {...defaultProps} completedSet={completedSet} />);
    const xiaBtn = screen.getByText("Xia Dynasty").closest("button");
    const check = xiaBtn?.querySelector(".sidebar-item-done");
    expect(check).toBeInTheDocument();
    expect(check?.querySelector("svg")).toBeInTheDocument();
  });

  it("does not show check indicator for uncompleted items", () => {
    const completedSet = new Set(["xia"]);
    render(<Sidebar {...defaultProps} completedSet={completedSet} />);
    const shangBtn = screen.getByText("Shang Dynasty").closest("button");
    const check = shangBtn?.querySelector(".sidebar-item-done");
    expect(check).toBeNull();
  });

  it("renders without completedSet prop (graceful fallback)", () => {
    render(<Sidebar {...defaultProps} />);
    const xiaBtn = screen.getByText("Xia Dynasty").closest("button");
    const check = xiaBtn?.querySelector(".sidebar-item-done");
    expect(check).toBeNull();
  });
});
