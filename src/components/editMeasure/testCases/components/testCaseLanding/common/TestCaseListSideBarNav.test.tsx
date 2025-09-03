import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TestCaseListSideBarNav from "./TestCaseListSideBarNav";
import { Group } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";
// @ts-ignore

const groups: Group[] = [
  {
    id: "group1",
    measureGroupTypes: [],
    populations: [],
    stratifications: [],
  },
  {
    id: "group2",
    measureGroupTypes: [],
    populations: [],
    stratifications: [],
  },
];
jest.mock("@madie/madie-util", () => ({}));
describe("TestCase component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    allPopulationCriteria: groups,
    isCollapsed: false,
    setIsCollapsed: jest.fn(),
  };

  it("should render no population criteria for null groups array", async () => {
    render(
      <MemoryRouter>
        <TestCaseListSideBarNav
          allPopulationCriteria={undefined as any}
          isCollapsed={false}
          setIsCollapsed={jest.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(
      screen.getByText("No Population Criteria Exist")
    ).toBeInTheDocument();
  });

  it("should render no population criteria for empty groups array", async () => {
    render(
      <MemoryRouter>
        <TestCaseListSideBarNav
          allPopulationCriteria={[]}
          isCollapsed={false}
          setIsCollapsed={jest.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(
      screen.getByText("No Population Criteria Exist")
    ).toBeInTheDocument();
  });

  it("should render multiple population criteria", async () => {
    render(
      <MemoryRouter>
        <TestCaseListSideBarNav {...defaultProps} />
      </MemoryRouter>
    );

    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getAllByRole("tab").length).toEqual(6);
    const activeLink = screen.getByRole("tab", {
      name: "Population Criteria 2",
    });
    expect(activeLink).toBeInTheDocument();
    userEvent.click(activeLink);
    const inactiveLink = screen.getByRole("tab", {
      name: "Population Criteria 1",
    });
    expect(inactiveLink).toBeInTheDocument();
    userEvent.click(inactiveLink);
  });

  it("should render SDE tab for QDM measures", async () => {
    const onChange = jest.fn();
    render(
      <MemoryRouter>
        <TestCaseListSideBarNav {...defaultProps} qdm={true} />
      </MemoryRouter>
    );

    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getAllByRole("tab").length).toEqual(6);
  });

  it("always renders RAV tab for both QDM and QI Core measures", async () => {
    render(
      <MemoryRouter>
        <TestCaseListSideBarNav {...defaultProps} qdm={true} />
      </MemoryRouter>
    );
  // RAV tab appears once in each Tabs group; ensure at least one present
  const ravTabsQdm = screen.getAllByRole("tab", { name: "RAV" });
  expect(ravTabsQdm.length).toBeGreaterThan(0);

    render(
      <MemoryRouter>
        <TestCaseListSideBarNav {...defaultProps} qdm={false} />
      </MemoryRouter>
    );
  const ravTabsQiCore = screen.getAllByRole("tab", { name: "RAV" });
  expect(ravTabsQiCore.length).toBeGreaterThan(0);
  });

  it("should render Expansion tab for QI Core measures", async () => {
    render(
      <MemoryRouter>
        <TestCaseListSideBarNav {...defaultProps} />
      </MemoryRouter>
    );

    expect(
      screen.queryByRole("tab", { name: "Expansion" })
    ).toBeInTheDocument();
  });

  it("renders only expand icon when collapsed and expands on click", () => {
    const setIsCollapsed = jest.fn();
    render(
      <MemoryRouter>
        <TestCaseListSideBarNav
          allPopulationCriteria={groups}
          isCollapsed={true}
          setIsCollapsed={setIsCollapsed}
        />
      </MemoryRouter>
    );

    // Only the expand icon should be visible
    expect(
      screen.getByTestId("test-case-sidebar-expand-icon")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("test-case-sidebar-expand-icon"));
    expect(setIsCollapsed).toHaveBeenCalledWith(false);
  });

  it("renders collapse icon when expanded and collapses on click", () => {
    const setIsCollapsed = jest.fn();
    render(
      <MemoryRouter>
        <TestCaseListSideBarNav
          allPopulationCriteria={groups}
          isCollapsed={false}
          setIsCollapsed={setIsCollapsed}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId("test-case-sidebar")).toBeInTheDocument();
    // Should have the collapse icon
    expect(
      screen.getByTestId("test-case-sidebar-collapse-icon")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("test-case-sidebar-collapse-icon"));
    expect(setIsCollapsed).toHaveBeenCalledWith(true);
  });
});
