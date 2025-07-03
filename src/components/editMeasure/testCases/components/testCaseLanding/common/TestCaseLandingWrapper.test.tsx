import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TestCaseLandingWrapper from "./TestCaseLandingWrapper";
import { MemoryRouter } from "react-router-dom";

jest.mock("@madie/madie-util", () => ({
  measureStore: {
    state: {
      groups: [
        {
          id: "group1",
          populations: [],
        },
      ],
    },
    subscribe: () => {
      return { unsubscribe: () => null };
    },
  },
  useFeatureFlags: jest.fn().mockReturnValue({
    QDMIncludeRAVValues: true,
    QICoreIncludeRAVValues: true,
  }),
}));

describe("TestCaseLandingWrapper", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("renders sidebar and passes props, children are present", () => {
    render(
      <MemoryRouter>
        <TestCaseLandingWrapper qdm={true}>
          <div>TestCaseLandingWrapper child</div>
        </TestCaseLandingWrapper>
      </MemoryRouter>
    );
    expect(screen.getByTestId("test-case-sidebar")).toBeInTheDocument();
    expect(
      screen.getByText("TestCaseLandingWrapper child")
    ).toBeInTheDocument();
    expect(screen.getAllByRole("tab").length).toBeGreaterThan(0);
  });

  it("toggles collapsed/expanded state and localStorage updates", () => {
    render(
      <MemoryRouter>
        <TestCaseLandingWrapper>
          <div>TestCaseLandingWrapper child</div>
        </TestCaseLandingWrapper>
      </MemoryRouter>
    );
    // Start expanded by default
    expect(localStorage.getItem("testCaseSidebarCollapsed")).toBe("false");

    // Collapse sidebar using sidebar's collapse icon
    const collapseIcon = screen.getByTestId("test-case-sidebar-collapse-icon");
    fireEvent.click(collapseIcon);
    // Expect localStorage key of testCaseSidebarCollapsed to be "true"
    expect(localStorage.getItem("testCaseSidebarCollapsed")).toBe("true");

    // Now the expand icon should be present
    const expandIcon = screen.getByTestId("test-case-sidebar-expand-icon");
    fireEvent.click(expandIcon);
    // Expect localStorage key of testCaseSidebarCollapsed to be set back to "false"
    expect(localStorage.getItem("testCaseSidebarCollapsed")).toBe("false");
  });
});
