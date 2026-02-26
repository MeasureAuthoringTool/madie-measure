import * as React from "react";
import "@testing-library/jest-dom";
import { describe, expect } from "@jest/globals";
import { MemoryRouter, useNavigate } from "react-router-dom";
import EditTestCaseBreadCrumbs from "./EditTestCaseBreadCrumbs";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
// @ts-ignore
import { measureStore } from "@madie/madie-util";
import { Measure, TestCase } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";

jest.mock("@madie/madie-util", () => ({
  useIsAdminTransferEnabled: () => false,
  useDocumentTitle: jest.fn(),
  useOktaTokens: jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  })),
  checkUserCanEdit: jest.fn(),
  useFeatureFlags: () => ({}),
  measureStore: {
    updateMeasure: jest.fn((measure) => measure),
    state: jest.fn().mockImplementation(() => null),
    initialState: jest.fn().mockImplementation(() => null),
    subscribe: () => {
      return { unsubscribe: () => null };
    },
  },
  routeHandlerStore: {
    subscribe: () => {
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: jest.fn((routeObj) => routeObj),
    state: { canTravel: false, pendingPath: "" },
    initialState: { canTravel: false, pendingPath: "" },
  },
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

const mockNavigate = jest.fn();

const testCases = [
  {
    caseNumber: 1,
    description: "Test case 1",
    id: "1",
    json: "{}",
    series: "Group1",
    title: "Title1",
    validResource: true,
  },
  {
    caseNumber: 2,
    description: "Test case 2",
    id: "2",
    json: "{}",
    series: "Group1",
    title: "Title2",
    validResource: true,
  },
  {
    caseNumber: 3,
    description: "Test case 3",
    id: "3",
    json: "{}",
    series: "Group2",
    title: "Title3",
    validResource: true,
  },
] as TestCase[];

const measure = {
  id: "123",
  createdBy: "testuser@example.com",
  model: "QDM v5.6",
  testCases: testCases,
} as Measure;

describe("EditTestCaseBreadCrumbs", () => {
  beforeEach(() => {
    measureStore.state.mockImplementation(() => measure);
    useNavigate.mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    cleanup();
  });

  it("should render the select component and display the locked icon", async () => {
    render(
      <MemoryRouter>
        <EditTestCaseBreadCrumbs
          testCase={
            {
              title: "Case #1: Group1 - Title1",
              series: "",
              createdAt: "",
              createdBy: "",
              description: "",
              testCaseLock: { lockedBy: "user1" },
            } as TestCase
          }
          measureId="unknown"
          lockingEnabled={true}
          canEdit={true}
        />
      </MemoryRouter>
    );

    const selectElement = screen.getByRole("combobox");
    expect(selectElement).toBeInTheDocument();
    const tooltipIcon = screen.getByTestId("locked-icon");
    expect(tooltipIcon).toBeInTheDocument();
    userEvent.hover(tooltipIcon);
    await waitFor(() => {
      expect(
        screen.getByText("Locked while being edited by user1")
      ).toBeInTheDocument();
    });
  });

  it("should display the correct test case in the dropdown", async () => {
    render(
      <MemoryRouter>
        <EditTestCaseBreadCrumbs
          testCase={
            {
              title: "Case #1: Group1 - Title1",
              series: "",
              createdAt: "",
              createdBy: "",
              description: "",
            } as unknown as TestCase
          }
          measureId="unknown"
          lockingEnabled={false}
          canEdit={false}
        />
      </MemoryRouter>
    );

    const selectElement = await screen.findByRole("combobox");
    expect(selectElement).toHaveTextContent("Case #1: Group1 - Title1");
  });

  it("should open the dropdown on click", async () => {
    render(
      <MemoryRouter>
        <EditTestCaseBreadCrumbs
          testCase={
            {
              title: "Case #1: Group1 - Title1",
              series: "",
              createdAt: "",
              createdBy: "",
              description: "",
            } as unknown as TestCase
          }
          measureId="unknown"
          lockingEnabled={false}
          canEdit={true}
        />
      </MemoryRouter>
    );

    const selectElement = await screen.findByRole("combobox");

    userEvent.click(selectElement);

    const menuItem1 = screen.getByRole("option", {
      name: "Case #3: Group2 - Title3",
    });
    const menuItem2 = screen.getByRole("option", {
      name: "Case #2: Group1 - Title2",
    });
    const menuItem3 = screen.getByRole("option", {
      name: "Case #1: Group1 - Title1",
    });

    screen.debug();

    expect(menuItem1).toBeInTheDocument();
    expect(menuItem2).toBeInTheDocument();
    expect(menuItem3).toBeInTheDocument();
  });

  it("should navigate to the url of the selected test case", async () => {
    render(
      <MemoryRouter>
        <EditTestCaseBreadCrumbs
          testCase={
            {
              title: "Case #1: Group1 - Title1",
              series: "",
              createdAt: "",
              createdBy: "",
              description: "",
            } as unknown as TestCase
          }
          measureId="unknown"
          lockingEnabled={false}
          canEdit={true}
        />
      </MemoryRouter>
    );

    const selectElement = await screen.findByRole("combobox");

    userEvent.click(selectElement);

    userEvent.click(
      screen.getByRole("option", { name: "Case #3: Group2 - Title3" })
    );

    expect(mockNavigate).toBeCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(
      "/measures/123/edit/test-cases/3"
    );
  });

  it("should render the select component and display default locked tooltip", async () => {
    render(
      <MemoryRouter>
        <EditTestCaseBreadCrumbs
          testCase={
            {
              title: "Case #1: Group1 - Title1",
              series: "",
              createdAt: "",
              createdBy: "",
              description: "",
              testCaseLock: {},
            } as TestCase
          }
          measureId="unknown"
          lockingEnabled={true}
          canEdit={true}
        />
      </MemoryRouter>
    );

    const selectElement = screen.getByRole("combobox");
    expect(selectElement).toBeInTheDocument();
    const tooltipIcon = screen.getByTestId("locked-icon");
    expect(tooltipIcon).toBeInTheDocument();
    userEvent.hover(tooltipIcon);
    await waitFor(() => {
      expect(screen.getByText("Test Case is locked")).toBeInTheDocument();
    });
  });
});
