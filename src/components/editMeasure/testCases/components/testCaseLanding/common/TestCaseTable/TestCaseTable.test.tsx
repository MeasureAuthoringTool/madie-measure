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
import { useFeatureFlags, checkUserCanEdit } from "@madie/madie-util";
import userEvent from "@testing-library/user-event";
import { within } from "@testing-library/dom";

const testCase = {
  id: "ID",
  title: "TEST IPP",
  description: "TEST DESCRIPTION",
  series: "TEST SERIES",
  lastModifiedAt: "2024-09-06T15:15:14.382Z",
  executionStatus: "pass",
  caseNumber: 1,
  action: { createdBeforeVersioning: true },
  validationStatus: "Valid",
} as unknown as TestCase;

const testCaseFail = {
  id: "ID1",
  title: "TEST IPP1",
  description: "TEST DESCRIPTION1",
  series: "TEST SERIES1",
  lastModifiedAt: "2024-09-06T15:16:14.382Z",
  executionStatus: "fail",
  caseNumber: null,
  validationStatus: "Invalid JSON",
} as unknown as TestCase;

const testCaseNA = {
  id: "ID2",
  title: "TEST IPP2",
  description: "TEST DESCRIPTION2",
  series: "TEST SERIES2",
  lastModifiedAt: "2024-09-06T15:17:14.382Z",
  executionStatus: "NA",
  caseNumber: null,
  validationStatus: "Not Complete",
} as unknown as TestCase;

const testCaseInvalid = {
  id: "ID3",
  title: "TEST IPP3",
  description: "TEST DESCRIPTION3",
  series: "TEST SERIES3",
  lastModifiedAt: "2022-03-01T14:18:14.382Z",
  executionStatus: "Invalid",
  caseNumber: null,
  validationStatus: "Invalid",
} as unknown as TestCase;

const testCaseValidating = {
  id: "ID4",
  title: "TEST IPP4",
  description: "TEST DESCRIPTION4",
  series: "TEST SERIES4",
  lastModifiedAt: "2024-09-06T15:15:14.382Z",
  executionStatus: "pass",
  caseNumber: 1,
  action: { createdBeforeVersioning: true },
  validationStatus: "Validating",
} as unknown as TestCase;

const testCases = [
  testCase,
  testCaseFail,
  testCaseNA,
  testCaseInvalid,
  testCaseValidating,
];

const measures = [
  {
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
  },
  {
    id: "IDIDID1",
    measureHumanReadableId: null,
    ecqmTitle: "ecqmTitleeee",
    measureSetId: "1",
    cqlLibraryName: "QiCore1",
    version: "0.0.000",
    state: "NEW",
    measureName: "new measure - A",
    cql: null,
    createdAt: null,
    createdBy: "testuser",
    lastModifiedAt: "2023-05-01T14:18:14.382Z",
    lastModifiedBy: null,
    model: Model.QDM_5_6,
    active: true,
    measureMetaData: {
      draft: false,
    },
    measureSet: {
      cmsId: "cmsId1",
    },
  },
  {
    id: "IDIDID2",
    measureHumanReadableId: null,
    ecqmTitle: "ecqmTitleeee",
    measureSetId: "2",
    cqlLibraryName: "QiCore2",
    version: "0.0.000",
    state: "NEW",
    measureName: "new measure - B",
    cql: null,
    createdAt: null,
    createdBy: "testuser",
    lastModifiedAt: "2023-05-01T14:18:14.382Z",
    lastModifiedBy: null,
    model: Model.QDM_5_6,
    active: true,
    measureMetaData: {
      draft: true,
    },
    measureSet: {
      cmsId: "cmsId2",
    },
  },
  {
    id: "IDIDID3",
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
    model: "QI-Core v6.0.0",
    acls: [{ userId: "othertestuser@example.com", roles: ["SHARED_WITH"] }],
  },
] as unknown as Measure[];

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
    EditTestsOnVersionedMeasures: false,
  })),
  checkUserCanEdit: jest.fn().mockImplementation(() => true),
}));

const mockPush = jest.fn();
jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom") as any),
  useNavigate: () => mockPush,
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
    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();
    const setSelectedTestCasesMock = jest.fn();

    renderWithTestCase(
      testCases,
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      measures[0],
      setSelectedTestCasesMock
    );

    const rows = await screen.findByTestId(`test-case-row-0`);
    const columns = rows.querySelectorAll("td");
    expect(columns[2]).toHaveTextContent("Pass");
    expect(columns[3]).toHaveTextContent(testCase.series);
    expect(columns[4]).toHaveTextContent(testCase.title);
    expect(columns[5]).toHaveTextContent(testCase.description);
    expect(columns[6]).toHaveTextContent("09/06/202415:15:14 (UTC)");

    const buttons = await screen.findAllByRole("button");
    expect(buttons).toHaveLength(12);
    expect(buttons[8]).toHaveTextContent("View");
  });

  it("should render test case table with case numbers", async () => {
    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();
    const setSelectedTestCasesMock = jest.fn();

    renderWithTestCase(
      testCases,
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      measures[0],
      setSelectedTestCasesMock
    );

    const rows = await screen.findByTestId(`test-case-row-0`);
    const columns = rows.querySelectorAll("td");
    expect(columns[1]).toHaveTextContent("1");
    expect(columns[2]).toHaveTextContent("Pass");
    expect(columns[3]).toHaveTextContent(testCase.series);
    expect(columns[4]).toHaveTextContent(testCase.title);
    expect(columns[5]).toHaveTextContent(testCase.description);
    expect(columns[6]).toHaveTextContent("09/06/202415:15:14 (UTC)");

    const buttons = await screen.findAllByRole("button");
    expect(buttons).toHaveLength(12);
  });

  it.skip("should render test case table with checkboxes when flag is set", async () => {
    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();
    const setSelectedTestCasesMock = jest.fn();

    renderWithTestCase(
      testCases,
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      measures[0],
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
    expect(buttons).toHaveLength(11);
  });

  it("should render test case view for non-owners and no delete option", async () => {
    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();
    const setSelectedTestCasesMock = jest.fn();

    renderWithTestCase(
      testCases,
      false,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      measures[0],
      setSelectedTestCasesMock
    );

    const rows = await screen.findByTestId(`test-case-row-0`);
    const columns = rows.querySelectorAll("td");
    expect(columns[1]).toHaveTextContent("1");
    expect(columns[2]).toHaveTextContent("Pass");
    expect(columns[3]).toHaveTextContent(testCase.series);
    expect(columns[4]).toHaveTextContent(testCase.title);
    expect(columns[5]).toHaveTextContent(testCase.description);
    expect(columns[6]).toHaveTextContent("09/06/202415:15:14 (UTC)");

    const buttons = await screen.findAllByRole("button");
    expect(buttons).toHaveLength(12);
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

  it("should display View button if the user does not have edit access to the measure and navigate to test case onClick", async () => {
    checkUserCanEdit.mockImplementation(() => false);

    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();
    const setSelectedTestCasesMock = jest.fn();

    renderWithTestCase(
      testCases,
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      measures[1],
      setSelectedTestCasesMock
    );

    await waitFor(() => {
      const actionButton = screen.getByTestId(
        `view-edit-test-case-button-${testCases[0].id}`
      );

      expect(actionButton).toBeInTheDocument();
      expect(actionButton).toHaveTextContent("View");

      userEvent.click(actionButton);

      expect(mockPush).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("../ID", { relative: "path" });
    });
  });

  it("should display Edit button if the user has edit access to the measure and is a draft and navigate to test case onClick", async () => {
    checkUserCanEdit.mockImplementation(() => true);

    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();
    const setSelectedTestCasesMock = jest.fn();

    renderWithTestCase(
      testCases,
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      measures[2],
      setSelectedTestCasesMock
    );

    await waitFor(() => {
      const actionButton = screen.getByTestId(
        `view-edit-test-case-button-${testCases[0].id}`
      );

      expect(actionButton).toBeInTheDocument();
      expect(actionButton).toHaveTextContent("Edit");

      userEvent.click(actionButton);

      expect(mockPush).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("../ID", { relative: "path" });
    });
  });

  it("should display View button if the EditTestsOnVersionedMeasures feature flag is true and the user does not have edit access to the measure and navigate to test case onClick", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      EditTestsOnVersionedMeasures: true,
    }));

    checkUserCanEdit.mockImplementation(() => false);

    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();
    const setSelectedTestCasesMock = jest.fn();

    renderWithTestCase(
      testCases,
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      measures[2],
      setSelectedTestCasesMock
    );

    await waitFor(() => {
      const actionButton = screen.getByTestId(
        `view-edit-test-case-button-${testCases[0].id}`
      );

      expect(actionButton).toBeInTheDocument();
      expect(actionButton).toHaveTextContent("View");

      userEvent.click(actionButton);

      expect(mockPush).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("../ID", { relative: "path" });
    });
  });

  it("should display Edit button if the EditTestsOnVersionedMeasures feature flag is true and the user has edit access to the measure and it's a draft and navigate to test case onClick", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      EditTestsOnVersionedMeasures: true,
    }));

    checkUserCanEdit.mockImplementation(() => true);

    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();
    const setSelectedTestCasesMock = jest.fn();

    renderWithTestCase(
      testCases,
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      measures[2],
      setSelectedTestCasesMock
    );

    await waitFor(() => {
      const actionButton = screen.getByTestId(
        `view-edit-test-case-button-${testCases[0].id}`
      );

      expect(actionButton).toBeInTheDocument();
      expect(actionButton).toHaveTextContent("Edit");

      userEvent.click(actionButton);

      expect(mockPush).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("../ID", { relative: "path" });
    });
  });

  it("should display Edit button if the EditTestsOnVersionedMeasures feature flag is true and the user has edit access to the measure and is not a draft and navigate to test case onClick", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      EditTestsOnVersionedMeasures: true,
    }));

    checkUserCanEdit.mockImplementation(() => true);

    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();
    const setSelectedTestCasesMock = jest.fn();

    renderWithTestCase(
      testCases,
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      measures[2],
      setSelectedTestCasesMock
    );

    await waitFor(() => {
      const actionButton = screen.getByTestId(
        `view-edit-test-case-button-${testCases[0].id}`
      );

      expect(actionButton).toBeInTheDocument();
      expect(actionButton).toHaveTextContent("Edit");

      userEvent.click(actionButton);

      expect(mockPush).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("../ID", { relative: "path" });
    });
  });

  it("should not display FiberManualRecord icon when the EditTestsOnVersionedMeasures feature flag is false", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      EditTestsOnVersionedMeasures: false,
    }));

    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();
    const setSelectedTestCasesMock = jest.fn();

    renderWithTestCase(
      [testCase],
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      measures[1],
      setSelectedTestCasesMock
    );

    await waitFor(() => {
      expect(
        screen.queryByTestId(
          `test-case-fiber-manual-record-icon-${testCases[0].id}`
        )
      ).not.toBeInTheDocument();
    });
  });

  it("should not display FiberManualRecord icon when draft is false", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      EditTestsOnVersionedMeasures: true,
    }));

    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();
    const setSelectedTestCasesMock = jest.fn();

    renderWithTestCase(
      [testCase],
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      measures[2],
      setSelectedTestCasesMock
    );

    await waitFor(() => {
      expect(
        screen.queryByTestId(
          `test-case-fiber-manual-record-icon-${testCases[0].id}`
        )
      ).not.toBeInTheDocument();
    });
  });

  it("should not display FiberManualRecord icon when the test case was created or modified before the measure was last versioned", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      EditTestsOnVersionedMeasures: true,
    }));

    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();
    const setSelectedTestCasesMock = jest.fn();

    renderWithTestCase(
      [testCaseFail],
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      measures[1],
      setSelectedTestCasesMock
    );

    await waitFor(() => {
      expect(
        screen.queryByTestId(
          `test-case-fiber-manual-record-icon-${testCases[0].id}`
        )
      ).not.toBeInTheDocument();
    });
  });

  it("should display FiberManualRecord icon when the EditTestsOnVersionedMeasures feature flag is true, draft is false, and the test case was created or modified after the measure was last versioned", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      EditTestsOnVersionedMeasures: true,
    }));

    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();
    const setSelectedTestCasesMock = jest.fn();

    renderWithTestCase(
      [testCase],
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      measures[1],
      setSelectedTestCasesMock
    );

    await waitFor(() => {
      expect(
        screen.getByTestId(
          `test-case-fiber-manual-record-icon-${testCases[0].id}`
        )
      ).toBeInTheDocument();
    });
  });

  it("should render test case table with validation status for qiCore6 and be sortable", async () => {
    const deleteTestCase = jest.fn();
    const exportTestCase = jest.fn();
    const onCloneTestCase = jest.fn();
    const setSelectedTestCasesMock = jest.fn();

    renderWithTestCase(
      testCases,
      true,
      deleteTestCase,
      exportTestCase,
      onCloneTestCase,
      measures[3],
      setSelectedTestCasesMock
    );

    const rows = await screen.findByTestId(`test-case-row-0`);
    const columns = rows.querySelectorAll("td");
    expect(columns[1]).toHaveTextContent("1");
    expect(columns[2]).toHaveTextContent("Pass");
    expect(columns[3]).toHaveTextContent("Valid");
    expect(columns[4]).toHaveTextContent(testCase.series);
    expect(columns[5]).toHaveTextContent(testCase.title);
    expect(columns[6]).toHaveTextContent(testCase.description);
    expect(columns[7]).toHaveTextContent("09/06/202415:15:14 (UTC)");

    const buttons = await screen.findAllByRole("button");
    expect(buttons).toHaveLength(13);

    expect(buttons[2].textContent).toBe("Validation");
    fireEvent.click(buttons[2]);
  });
});
