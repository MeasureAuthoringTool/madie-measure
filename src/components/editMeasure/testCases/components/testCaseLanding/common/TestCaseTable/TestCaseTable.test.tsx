import * as React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TestCaseTable, { convertDate } from "./TestCaseTable";
import {
  Measure,
  MeasureScoring,
  PopulationType,
  TestCase,
  Model,
} from "@madie/madie-models";
// @ts-ignore
import { useFeatureFlags } from "@madie/madie-util";
import userEvent from "@testing-library/user-event";

const testCase = {
  id: "ID",
  title: "TEST IPP",
  description: "TEST DESCRIPTION",
  series: "TEST SERIES",
  lastModifiedAt: "2024-09-06T15:15:14.382Z",
  executionStatus: "pass",
  caseNumber: 1,
} as unknown as TestCase;
const testCaseFail = {
  id: "ID1",
  title: "TEST IPP1",
  description: "TEST DESCRIPTION1",
  series: "TEST SERIES1",
  lastModifiedAt: "2024-09-06T15:16:14.382Z",
  executionStatus: "fail",
  caseNumber: null,
} as unknown as TestCase;
const testCaseNA = {
  id: "ID2",
  title: "TEST IPP2",
  description: "TEST DESCRIPTION2",
  series: "TEST SERIES2",
  lastModifiedAt: "2024-09-06T15:17:14.382Z",
  executionStatus: "NA",
  caseNumber: null,
} as unknown as TestCase;

const testCaseInvalid = {
  id: "ID3",
  title: "TEST IPP3",
  description: "TEST DESCRIPTION3",
  series: "TEST SERIES3",
  lastModifiedAt: "2024-09-06T15:18:14.382Z",
  executionStatus: "Invalid",
  caseNumber: null,
} as unknown as TestCase;

const testCases = [testCase, testCaseFail, testCaseNA, testCaseInvalid];

const defaultMeasure = {
  id: "m1234",
  measureScoring: MeasureScoring.COHORT,
  createdBy: "testuser",
  groups: [
    {
      groupId: "Group1_ID",
      scoring: "Cohort",
      populations: [
        {
          id: "id-1",
          name: PopulationType.INITIAL_POPULATION,
          definition: "Pop1",
        },
      ],
      stratifications: [
        {
          id: "strat-id-1",
        },
      ],
    },
  ],
  model: "QI-Core v4.1.1",
  acls: [{ userId: "othertestuser@example.com", roles: ["SHARED_WITH"] }],
} as unknown as Measure;

let mockApplyDefaults = false;
jest.mock("@madie/madie-util", () => ({
  useFeatureFlags: jest.fn().mockImplementation(() => ({
    applyDefaults: mockApplyDefaults,
    TestCaseListButtons: false,
  })),
}));

const renderWithTestCase = (
  testCases,
  canEdit,
  deleteTestCase,
  exportTestCase,
  onCloneTestCase,
  measure,
  setSorting = undefined
) => {
  return render(
    <MemoryRouter>
      <TestCaseTable
        sorting={[]}
        setSorting={setSorting}
        testCases={testCases}
        canEdit={canEdit}
        deleteTestCase={deleteTestCase}
        exportTestCase={exportTestCase}
        onCloneTestCase={onCloneTestCase}
        measure={measure}
      />
    </MemoryRouter>
  );
};

describe("TestCase component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render test case population table and show available actions for owners and shared owners", async () => {
    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();

    renderWithTestCase(
      testCases,
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      defaultMeasure
    );

    const rows = await screen.findByTestId(`test-case-row-0`);
    const columns = rows.querySelectorAll("td");
    expect(columns[1]).toHaveTextContent("Pass");
    expect(columns[2]).toHaveTextContent(testCase.series);
    expect(columns[3]).toHaveTextContent(testCase.title);
    expect(columns[4]).toHaveTextContent(testCase.description);
    expect(columns[5]).toHaveTextContent(convertDate(testCase.lastModifiedAt));

    const buttons = await screen.findAllByRole("button");
    expect(buttons).toHaveLength(11);
    expect(buttons[7]).toHaveTextContent("Select");
    fireEvent.click(buttons[7]);
    expect(screen.getByText("edit")).toBeInTheDocument();
    expect(screen.getByText("export transaction bundle")).toBeInTheDocument();
    expect(screen.getByText("export collection bundle")).toBeInTheDocument();
    expect(screen.getByText("delete")).toBeInTheDocument();
    expect(screen.getByText("Shift Test Case dates")).toBeInTheDocument();

    const deleteButton = screen.getByText("delete");
    fireEvent.click(deleteButton);

    expect(screen.getByText("Delete Test Case")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Yes, Delete")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cancel"));
    await waitFor(() => {
      const submitButton = screen.queryByText("Yes, Delete");
      expect(submitButton).not.toBeInTheDocument();
    });
  });

  it("should render test case table with case numbers when flag is set", async () => {
    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();

    renderWithTestCase(
      testCases,
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      defaultMeasure
    );

    const rows = await screen.findByTestId(`test-case-row-0`);
    const columns = rows.querySelectorAll("td");
    console.log("columns", columns);
    expect(columns[0]).toHaveTextContent("1");
    expect(columns[1]).toHaveTextContent("Pass");
    expect(columns[2]).toHaveTextContent(testCase.series);
    expect(columns[3]).toHaveTextContent(testCase.title);
    expect(columns[4]).toHaveTextContent(testCase.description);
    expect(columns[5]).toHaveTextContent(convertDate(testCase.lastModifiedAt));

    const buttons = await screen.findAllByRole("button");
    expect(buttons).toHaveLength(11);
  });

  it("should render test case table with checkboxes when flag is set", async () => {
    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      TestCaseListButtons: true,
    }));

    renderWithTestCase(
      testCases,
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      defaultMeasure
    );

    const rows = await screen.findByTestId(`test-case-row-0`);
    const columns = rows.querySelectorAll("td");
    const checkbox = screen
      .getByTestId("test-case-title-0_select")
      .querySelector('input[type="checkbox"]');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toHaveAttribute("checked");
    expect(columns[1]).toHaveTextContent("1");
    expect(columns[2]).toHaveTextContent("Pass");
    expect(columns[3]).toHaveTextContent(testCase.series);
    expect(columns[4]).toHaveTextContent(testCase.title);
    expect(columns[5]).toHaveTextContent(testCase.description);
    expect(columns[6]).toHaveTextContent(convertDate(testCase.lastModifiedAt));

    const buttons = await screen.findAllByRole("button");
    expect(buttons).toHaveLength(12);
  });

  it("should render test case population table with sorting when button clicked", async () => {
    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();
    const sortingFn = jest.fn();
    renderWithTestCase(
      testCases,
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      defaultMeasure,
      sortingFn
    );

    const rows = await screen.findByTestId(`test-case-row-0`);
    const columns = rows.querySelectorAll("td");
    expect(columns[2]).toHaveTextContent("Pass");
    expect(columns[3]).toHaveTextContent(testCase.series);
    expect(columns[4]).toHaveTextContent(testCase.title);
    expect(columns[5]).toHaveTextContent(testCase.description);
    expect(columns[6]).toHaveTextContent(convertDate(testCase.lastModifiedAt));

    const row2 = await screen.findByTestId(`test-case-row-1`);
    const column2 = row2.querySelectorAll("td");
    expect(column2[2]).toHaveTextContent("Fail");
    expect(column2[3]).toHaveTextContent(testCaseFail.series);
    expect(column2[4]).toHaveTextContent(testCaseFail.title);
    expect(column2[5]).toHaveTextContent(testCaseFail.description);
    expect(column2[6]).toHaveTextContent(
      convertDate(testCaseFail.lastModifiedAt)
    );

    const buttons = await screen.findAllByRole("button");
    expect(buttons).toHaveLength(12);
    expect(buttons[6]).toHaveTextContent("Last Saved");
    const lastSavedButton = screen.getByRole("button", { name: /last saved/i });
    expect(lastSavedButton).toHaveAttribute("title", "Sort descending");

    expect(columns[6]).toHaveTextContent(convertDate(testCase.lastModifiedAt));
    fireEvent.click(lastSavedButton);
    await waitFor(() => {
      expect(sortingFn).toHaveBeenCalled();
    });
  });

  it("should render test case view for non owners and no delete option", async () => {
    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();

    renderWithTestCase(
      testCases,
      false,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      defaultMeasure
    );
    const rows = await screen.findByTestId(`test-case-row-0`);
    const columns = rows.querySelectorAll("td");
    expect(columns[2]).toHaveTextContent("Pass");
    expect(columns[3]).toHaveTextContent(testCase.series);
    expect(columns[4]).toHaveTextContent(testCase.title);
    expect(columns[5]).toHaveTextContent(testCase.description);

    const buttons = await screen.findAllByRole("button");
    expect(buttons).toHaveLength(12);
    expect(buttons[8]).toHaveTextContent("Select");
    fireEvent.click(buttons[8]);
    expect(screen.getByText("view")).toBeInTheDocument();
  });

  it("triggers handle close with escape key", async () => {
    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();

    renderWithTestCase(
      testCases,
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      defaultMeasure
    );

    const buttons = await screen.findAllByRole("button");
    expect(buttons).toHaveLength(12);
    expect(buttons[8]).toHaveTextContent("Select");
    fireEvent.click(buttons[8]);

    expect(screen.getByText("edit")).toBeInTheDocument();

    fireEvent.keyDown(screen.getByText(/edit/i), {
      key: "Escape",
      code: "Escape",
      keyCode: 27,
      charCode: 27,
    });
  });

  it("should trigger export test case", async () => {
    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();

    renderWithTestCase(
      testCases,
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      defaultMeasure
    );

    const rows = await screen.findByTestId(`test-case-row-0`);
    const columns = rows.querySelectorAll("td");
    expect(columns[2]).toHaveTextContent("Pass");
    expect(columns[3]).toHaveTextContent(testCase.series);
    expect(columns[4]).toHaveTextContent(testCase.title);
    expect(columns[5]).toHaveTextContent(testCase.description);

    const buttons = await screen.findAllByRole("button");
    expect(buttons).toHaveLength(12);
    expect(buttons[8]).toHaveTextContent("Select");
    fireEvent.click(buttons[8]);
    expect(screen.getByText("edit")).toBeInTheDocument();
    expect(screen.getByText("export transaction bundle")).toBeInTheDocument();

    const exportButton = screen.getByText("export transaction bundle");
    fireEvent.click(exportButton);
    expect(exportTestCase).toHaveBeenCalled();
  });

  it("should display ShiftDatesDialog", async () => {
    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();

    renderWithTestCase(
      testCases,
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      defaultMeasure
    );

    const buttons = await screen.findAllByRole("button");
    expect(buttons).toHaveLength(12);
    expect(buttons[8]).toHaveTextContent("Select");
    fireEvent.click(buttons[8]);
    expect(screen.getByText("edit")).toBeInTheDocument();
    expect(screen.getByText("export transaction bundle")).toBeInTheDocument();
    expect(screen.getByText("export collection bundle")).toBeInTheDocument();
    expect(screen.getByText("delete")).toBeInTheDocument();
    const shiftDatesBtn = screen.getByText("Shift Test Case dates");
    expect(shiftDatesBtn).toBeInTheDocument();

    userEvent.click(shiftDatesBtn);

    const shiftDatesDiaglog = screen.getByTestId("shift-dates-dialog");
    expect(shiftDatesDiaglog).toBeInTheDocument();

    const currentTCGroup = screen.getByTestId(
      "current-testcase-series"
    ) as HTMLInputElement;
    expect(currentTCGroup).toBeInTheDocument();
    expect(currentTCGroup.value).toBe("TEST SERIES");

    const currentTCTitle = screen.getByTestId(
      "current-testcase-title"
    ) as HTMLInputElement;
    expect(currentTCTitle).toBeInTheDocument();
    expect(currentTCTitle.value).toBe("TEST IPP");
  });

  it("should not display Shift Test Case dates button", async () => {
    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();

    renderWithTestCase(
      testCases,
      false,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      defaultMeasure
    );

    const buttons = await screen.findAllByRole("button");
    expect(buttons).toHaveLength(12);
    expect(buttons[8]).toHaveTextContent("Select");
    fireEvent.click(buttons[8]);
    expect(screen.getByText("view")).toBeInTheDocument();
    const shiftDatesBtn = screen.queryByText("Shift Test Case dates");
    expect(shiftDatesBtn).not.toBeInTheDocument();
  });

  it("export collection bundle called", async () => {
    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();

    renderWithTestCase(
      testCases,
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      defaultMeasure
    );

    const buttons = await screen.findAllByRole("button");
    expect(buttons).toHaveLength(12);
    expect(buttons[8]).toHaveTextContent("Select");
    fireEvent.click(buttons[8]);
    expect(screen.getByText("edit")).toBeInTheDocument();
    const exportBtn = screen.getByText("export collection bundle");
    expect(exportBtn).toBeInTheDocument();

    userEvent.click(exportBtn);

    expect(exportTestCase).toHaveBeenCalled();
  });

  it("export test case for QDM called", async () => {
    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();

    defaultMeasure.model = Model.QDM_5_6;
    renderWithTestCase(
      testCases,
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      defaultMeasure
    );

    const buttons = await screen.findAllByRole("button");
    expect(buttons).toHaveLength(12);
    expect(buttons[8]).toHaveTextContent("Select");
    fireEvent.click(buttons[8]);

    const exportBtn = screen.getByTestId("export-test-case-ID");
    expect(exportBtn).toBeInTheDocument();

    userEvent.click(exportBtn);

    expect(exportTestCase).toHaveBeenCalled();
  });

  it("clone test case", async () => {
    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();

    renderWithTestCase(
      testCases,
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      defaultMeasure
    );

    const buttons = await screen.findAllByRole("button");
    expect(buttons).toHaveLength(12);
    expect(buttons[8]).toHaveTextContent("Select");
    fireEvent.click(buttons[8]);

    const cloneBtn = screen.getAllByTestId("clone-test-case-btn-ID");
    expect(cloneBtn.length).toBe(1);

    userEvent.click(cloneBtn[0]);

    expect(onCloneTestCase).toHaveBeenCalled();
  });
});
