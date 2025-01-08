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
  setSelectedTestCases = jest.fn(),
  setSorting = undefined,
  selectedTestCases,
  deleteDialogModalOpen = false,
  setDeleteDialogModalOpen = jest.fn()
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
        setSelectedTestCases={setSelectedTestCases}
        selectedTestCases={selectedTestCases}
        deleteDialogModalOpen={deleteDialogModalOpen}
        setDeleteDialogModalOpen={setDeleteDialogModalOpen}
      />
    </MemoryRouter>
  );
};

describe("TestCase component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render test case population table and show available actions for owners and shared owners", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      TestCaseListButtons: false,
    }));

    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();
    const setSelectedTestCasesMock = jest.fn(); // Mock setSelectedTestCases

    renderWithTestCase(
      testCases,
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      defaultMeasure,
      setSelectedTestCasesMock
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
    expect(buttons[8]).toHaveTextContent("Select");
    fireEvent.click(buttons[8]);
    expect(screen.getByText("edit")).toBeInTheDocument();
    expect(screen.getByText("export transaction bundle")).toBeInTheDocument();
    expect(screen.getByText("export collection bundle")).toBeInTheDocument();
    expect(screen.getByText("delete")).toBeInTheDocument();
    expect(screen.getByText("Shift Test Case dates")).toBeInTheDocument();

    // const deleteButton = screen.getByText("delete");
    // fireEvent.click(deleteButton);

    // expect(screen.getByText("Delete Test Case")).toBeInTheDocument();
    // expect(screen.getByText("Cancel")).toBeInTheDocument();
    // expect(screen.getByText("Yes, Delete")).toBeInTheDocument();

    // fireEvent.click(screen.getByText("Cancel"));
    // await waitFor(() => {
    //   const submitButton = screen.queryByText("Yes, Delete");
    //   expect(submitButton).not.toBeInTheDocument();
    // });
  });

  it("should render test case table with case numbers", async () => {
    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();
    const setSelectedTestCasesMock = jest.fn(); // Mock setSelectedTestCases

    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      TestCaseListButtons: false,
    }));

    renderWithTestCase(
      testCases,
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      defaultMeasure,
      setSelectedTestCasesMock
    );

    const rows = await screen.findByTestId(`test-case-row-0`);
    const columns = rows.querySelectorAll("td");
    expect(columns[0]).toHaveTextContent("1");
    expect(columns[1]).toHaveTextContent("Pass");
    expect(columns[2]).toHaveTextContent(testCase.series);
    expect(columns[3]).toHaveTextContent(testCase.title);
    expect(columns[4]).toHaveTextContent(testCase.description);
    expect(columns[5]).toHaveTextContent(convertDate(testCase.lastModifiedAt));

    const buttons = await screen.findAllByRole("button");
    expect(buttons).toHaveLength(11);
  });

  it.skip("should render test case table with checkboxes when flag is set", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      TestCaseListButtons: true,
    }));
    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();
    const setSelectedTestCasesMock = jest.fn(); // Mock setSelectedTestCases

    renderWithTestCase(
      testCases,
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      defaultMeasure,
      setSelectedTestCasesMock
    );

    const rows = await screen.findByTestId(`test-case-row-0`);
    const columns = rows.querySelectorAll("td");
    // const checkbox = screen
    //   .getByTestId("test-case-title-0_select")
    //   .querySelector('input[type="checkbox"]');
    // expect(checkbox).toBeInTheDocument();
    // expect(checkbox).not.toHaveAttribute("checked");
    expect(columns[2]).toHaveTextContent("1");
    expect(columns[3]).toHaveTextContent("Pass");
    expect(columns[4]).toHaveTextContent(testCase.series);
    expect(columns[5]).toHaveTextContent(testCase.title);
    expect(columns[6]).toHaveTextContent(testCase.description);
    expect(columns[7]).toHaveTextContent(convertDate(testCase.lastModifiedAt));

    const buttons = await screen.findAllByRole("button");
    expect(buttons).toHaveLength(12);
  });

  it("should render test case view for non-owners and no delete option", async () => {
    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();
    const setSelectedTestCasesMock = jest.fn(); // Mock setSelectedTestCases

    renderWithTestCase(
      testCases,
      false,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      defaultMeasure,
      setSelectedTestCasesMock
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
    expect(buttons[6]).toHaveTextContent("Action");
    fireEvent.click(buttons[6]);
    expect(screen.queryByText("edit")).not.toBeInTheDocument();
    expect(
      screen.queryByText("export transaction bundle")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("export collection bundle")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("delete")).not.toBeInTheDocument();
    expect(screen.queryByText("Shift Test Case dates")).not.toBeInTheDocument();
  });

  it("clone test case", async () => {
    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();
    const setSelectedTestCasesMock = jest.fn(); // Mock setSelectedTestCases

    renderWithTestCase(
      testCases,
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      defaultMeasure,
      setSelectedTestCasesMock
    );

    const buttons = await screen.findAllByRole("button");
    expect(buttons).toHaveLength(11);
    expect(buttons[7]).toHaveTextContent("Select");
    fireEvent.click(buttons[7]);

    const cloneBtn = screen.getAllByTestId("clone-test-case-btn-ID");
    expect(cloneBtn.length).toBe(2);

    userEvent.click(cloneBtn[0]);

    expect(onCloneTestCase).toHaveBeenCalled();
    expect(setSelectedTestCasesMock).toHaveBeenCalled();
  });

  describe("Merge Safe", () => {
    it("should show the delete confirmation dialog when delete button is clicked", async () => {
      const deleteTestCase = jest.fn();
      const exportTestCase = jest.fn();
      const onCloneTestCase = jest.fn();
      const setSelectedTestCasesMock = jest.fn();

      let deleteDialogModalOpen = false;

      const { rerender } = renderWithTestCase(
        testCases,
        true,
        deleteTestCase,
        exportTestCase,
        onCloneTestCase,
        defaultMeasure,
        setSelectedTestCasesMock,
        undefined,
        [],
        deleteDialogModalOpen,
        (value) => {
          deleteDialogModalOpen = value;
        }
      );

      const selectButton = await screen.findByTestId("select-action-ID");
      expect(selectButton).toBeInTheDocument();

      fireEvent.click(selectButton);

      const deleteButton = await screen.findByText("delete");
      expect(deleteButton).toBeInTheDocument();

      fireEvent.click(deleteButton);

      expect(deleteDialogModalOpen).toBe(true);

      rerender(
        <MemoryRouter>
          <TestCaseTable
            sorting={[]}
            setSorting={undefined}
            testCases={testCases}
            canEdit={true}
            deleteTestCase={deleteTestCase}
            exportTestCase={exportTestCase}
            onCloneTestCase={onCloneTestCase}
            measure={defaultMeasure}
            setSelectedTestCases={setSelectedTestCasesMock}
            selectedTestCases={[]}
            deleteDialogModalOpen={true}
            setDeleteDialogModalOpen={(value) => {
              deleteDialogModalOpen = value;
            }}
          />
        </MemoryRouter>
      );

      const deleteDialog = screen.getByText("Delete Test Case");
      expect(deleteDialog).toBeInTheDocument();

      const cancelButton = screen.getByText("Cancel");
      const confirmButton = screen.getByText("Yes, Delete");

      expect(cancelButton).toBeInTheDocument();
      expect(confirmButton).toBeInTheDocument();

      fireEvent.click(confirmButton);
      expect(deleteTestCase).toHaveBeenCalled();
    });
  });
});
