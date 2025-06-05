import * as React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TestCaseListSideBarNav from "./TestCaseListSideBarNav";
import { Group } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";
import { useFeatureFlags } from "@madie/madie-util";

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
jest.mock("@madie/madie-util", () => ({
  useFeatureFlags: jest.fn().mockReturnValue({
    QDMIncludeRAVValues: true,
  }),
}));
describe("TestCase component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render no population criteria for null groups array", async () => {
    render(
      <MemoryRouter>
        <TestCaseListSideBarNav allPopulationCriteria={null} />
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
        <TestCaseListSideBarNav allPopulationCriteria={[]} />
      </MemoryRouter>
    );

    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(
      screen.getByText("No Population Criteria Exist")
    ).toBeInTheDocument();
  });

  it("should render multiple population criteria", async () => {
    const onChange = jest.fn();
    render(
      <MemoryRouter>
        <TestCaseListSideBarNav allPopulationCriteria={groups} />
      </MemoryRouter>
    );

    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getAllByRole("tab").length).toEqual(5);
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
        <TestCaseListSideBarNav allPopulationCriteria={groups} qdm={true} />
      </MemoryRouter>
    );

    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getAllByRole("tab").length).toEqual(6);
  });

  it("shouldn't render RAV tab for QDM measures when QDMIncludeRAVValues flag is false", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementationOnce(() => {
      return {
        QDMIncludeRAVValues: false,
      };
    });

    render(
      <MemoryRouter>
        <TestCaseListSideBarNav allPopulationCriteria={groups} qdm={true} />
      </MemoryRouter>
    );

    expect(screen.queryByRole("tab", { name: "RAV" })).not.toBeInTheDocument();
  });

  it("should render RAV tab for QDM measures when QDMIncludeRAVValues flag is true", async () => {
    render(
      <MemoryRouter>
        <TestCaseListSideBarNav allPopulationCriteria={groups} qdm={true} />
      </MemoryRouter>
    );

    expect(screen.queryByRole("tab", { name: "RAV" })).toBeInTheDocument();
  });

  it("should render Expansion tab for QI Core measures", async () => {
    render(
      <MemoryRouter>
        <TestCaseListSideBarNav allPopulationCriteria={groups} />
      </MemoryRouter>
    );

    expect(
      screen.queryByRole("tab", { name: "Expansion" })
    ).toBeInTheDocument();
  });
});
