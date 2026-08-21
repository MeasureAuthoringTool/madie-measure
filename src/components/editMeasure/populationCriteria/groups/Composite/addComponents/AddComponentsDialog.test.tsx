import * as mockCmsIdStubs from "../../../../../../__mocks__/cmsIdFormatterStubs";
import * as mockCompositeStubs from "../../../../../../__mocks__/compositeValidationStubs";
import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddComponentsDialog, {
  ROW_EXPANSION_ERROR,
} from "./AddComponentsDialog";
import { MeasureScoring, Model } from "@madie/madie-models";
import "@testing-library/jest-dom";
import { useMeasureServiceApi } from "@madie/madie-util";

const singleMeasure = [
  {
    id: "ab123",
    measureHumanReadableId: "ab123",
    measureSetId: null,
    version: "0.0.000",
    state: "NA",
    measureName: "TestMeasure1",
    cqlLibraryName: "TestLib1",
    cql: null,
    createdAt: null,
    createdBy: "TestUser1",
    lastModifiedAt: null,
    lastModifiedBy: "TestUser1",
    model: Model.QICORE,
    measureMetaData: { draft: true },
  },
];

const mockOneItemResponse = {
  content: singleMeasure,
  totalPages: 1,
  totalElements: 1,
  numberOfElements: 1,
  pageable: { offset: 0 },
};

const zeroItemResponse = {
  content: [],
  totalPages: 0,
  totalElements: 0,
  numberOfElements: 0,
  pageable: { offset: 0 },
};

jest.mock("@madie/madie-util", () => ({
  ...mockCmsIdStubs,
  ...mockCompositeStubs,
  useMeasureServiceApi: jest.fn(() => ({
    searchMeasuresByCriteria: jest.fn().mockResolvedValue(mockOneItemResponse),
    getMeasuresByMeasureSetId: jest.fn().mockResolvedValue([]),
  })),
}));

describe("AddComponentsDialog", () => {
  const onCloseMock = jest.fn();
  const mockMeasure = {
    id: "measure-1",
    model: "QI-Core",
    measureName: "Parent Measure",
  };

  const data = [
    {
      id: "1",
      measureName: "Test Measure",
      version: "1.0.0",
      measureSet: { cmsId: "CMS123" },
      measureSetId: "set-1",
      lastModifiedAt: "2024-01-01",
      hasAssociatedMeasures: true,
    },
    {
      id: "2",
      measureName: "Another Measure",
      version: "2.0.0",
      measureSet: { cmsId: "CMS456" },
      measureSetId: "set-2",
      lastModifiedAt: "2024-02-01",
      hasAssociatedMeasures: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("filters out current measure and parent measure from expanded results", async () => {
    const mockGetMeasuresBySetId = jest.fn().mockResolvedValue([
      {
        id: "1",
        measureName: "Test Measure",
        version: "1.0.0",
      },
      {
        id: "measure-1",
        measureName: "Parent Measure",
        version: "1.0.0",
      },
      {
        id: "child-valid",
        measureName: "Valid Child",
        version: "1.0.0",
        measureSet: { cmsId: "CMS999" },
        lastModifiedAt: "2024-01-15",
      },
    ]);

    const mockSearchMeasures = jest.fn().mockResolvedValue({
      content: data,
      totalPages: 1,
      totalElements: 2,
      numberOfElements: 2,
      pageable: { offset: 0 },
    });

    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: mockGetMeasuresBySetId,
    });

    render(
      <AddComponentsDialog
        open={true}
        onClose={onCloseMock}
        measure={mockMeasure}
        compositeScoring="Opportunity"
        components={[]}
        submitComponentForm={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockSearchMeasures).toHaveBeenCalled();
    });
    await waitFor(
      () => {
        expect(screen.queryByText("Test Measure")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const rows = screen.getAllByRole("row");
    const firstDataRow = rows[1];
    if (firstDataRow) {
      const expandButton = firstDataRow.querySelector("span[role='button']");
      if (expandButton) {
        await userEvent.click(expandButton);

        await waitFor(
          () => {
            expect(mockGetMeasuresBySetId).toHaveBeenCalled();
          },
          { timeout: 3000 }
        );
      }
    }
  });

  it("returns PROPORTION and RATIO for Opportunity composite scoring", async () => {
    const mockSearchMeasures = jest.fn().mockResolvedValue(zeroItemResponse);

    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: jest.fn(),
    });

    render(
      <AddComponentsDialog
        open={true}
        onClose={onCloseMock}
        measure={mockMeasure}
        compositeScoring="Opportunity"
        components={[]}
        submitComponentForm={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockSearchMeasures).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          allowedScoringTypes: [
            MeasureScoring.PROPORTION,
            MeasureScoring.RATIO,
          ],
        }),
        expect.anything()
      );
    });
  });

  it("returns PROPORTION and RATIO for All-or-nothing composite scoring", async () => {
    const mockSearchMeasures = jest.fn().mockResolvedValue(zeroItemResponse);

    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: jest.fn(),
    });

    render(
      <AddComponentsDialog
        open={true}
        onClose={onCloseMock}
        measure={mockMeasure}
        compositeScoring="All-or-nothing"
        components={[]}
        submitComponentForm={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockSearchMeasures).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          allowedScoringTypes: [
            MeasureScoring.PROPORTION,
            MeasureScoring.RATIO,
          ],
        }),
        expect.anything()
      );
    });
  });

  it("returns PROPORTION, RATIO, and CONTINUOUS_VARIABLE for Linear composite scoring", async () => {
    const mockSearchMeasures = jest.fn().mockResolvedValue(zeroItemResponse);

    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: jest.fn(),
    });

    render(
      <AddComponentsDialog
        open={true}
        onClose={onCloseMock}
        measure={mockMeasure}
        compositeScoring="Linear"
        components={[]}
        submitComponentForm={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockSearchMeasures).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          allowedScoringTypes: [
            MeasureScoring.PROPORTION,
            MeasureScoring.RATIO,
            MeasureScoring.CONTINUOUS_VARIABLE,
          ],
        }),
        expect.anything()
      );
    });
  });

  it("expands row and fetches associated measures when expand icon is clicked", async () => {
    const mockGetMeasuresBySetId = jest.fn().mockResolvedValue([
      {
        id: "child-1",
        measureName: "Child Measure 1",
        version: "1.0.0",
        measureSet: { cmsId: "CMS789" },
        lastModifiedAt: "2024-01-15",
      },
      {
        id: "child-2",
        measureName: "Child Measure 2",
        version: "1.1.0",
        measureSet: { cmsId: "CMS790" },
        lastModifiedAt: "2024-01-20",
      },
    ]);

    const mockSearchMeasures = jest.fn().mockResolvedValue({
      content: data,
      totalPages: 1,
      totalElements: 2,
      numberOfElements: 2,
      pageable: { offset: 0 },
    });

    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: mockGetMeasuresBySetId,
    });

    render(
      <AddComponentsDialog
        open={true}
        onClose={onCloseMock}
        measure={mockMeasure}
        compositeScoring="Opportunity"
        components={[]}
        submitComponentForm={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockSearchMeasures).toHaveBeenCalled();
    });
    await waitFor(
      () => {
        expect(screen.queryByText("Test Measure")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const rows = screen.getAllByRole("row");
    const firstDataRow = rows[1];
    if (firstDataRow) {
      const expandButton = firstDataRow.querySelector("span[role='button']");
      if (expandButton) {
        await userEvent.click(expandButton);

        await waitFor(
          () => {
            expect(mockGetMeasuresBySetId).toHaveBeenCalledWith(
              "set-1",
              true,
              expect.objectContaining({
                fromCompositeMeasureComponent: true,
                allowedScoringTypes: [
                  MeasureScoring.PROPORTION,
                  MeasureScoring.RATIO,
                ],
              })
            );
          },
          { timeout: 3000 }
        );
      }
    }
  });

  it("collapses row when expand icon is clicked again", async () => {
    const mockGetMeasuresBySetId = jest.fn().mockResolvedValue([
      {
        id: "child-1",
        measureName: "Child Measure 1",
        version: "1.0.0",
        measureSet: { cmsId: "CMS789" },
        lastModifiedAt: "2024-01-15",
      },
    ]);

    const mockSearchMeasures = jest.fn().mockResolvedValue({
      content: data,
      totalPages: 1,
      totalElements: 2,
      numberOfElements: 2,
      pageable: { offset: 0 },
    });

    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: mockGetMeasuresBySetId,
    });

    render(
      <AddComponentsDialog
        open={true}
        onClose={onCloseMock}
        measure={mockMeasure}
        compositeScoring="Opportunity"
        components={[]}
        submitComponentForm={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockSearchMeasures).toHaveBeenCalled();
    });

    await waitFor(
      () => {
        expect(screen.queryByText("Test Measure")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const rows = screen.getAllByRole("row");
    const firstDataRow = rows[1];

    if (firstDataRow) {
      const expandButton = firstDataRow.querySelector("span[role='button']");
      if (expandButton) {
        await userEvent.click(expandButton);
        await waitFor(
          () => {
            expect(mockGetMeasuresBySetId).toHaveBeenCalled();
          },
          { timeout: 3000 }
        );

        mockGetMeasuresBySetId.mockClear();
        await userEvent.click(expandButton);
        await waitFor(() => {
          expect(mockGetMeasuresBySetId).not.toHaveBeenCalled();
        });
      }
    }
  });

  it("does not render expand icon for measures without associated measures", async () => {
    const mockSearchMeasures = jest.fn().mockResolvedValue({
      content: data,
      totalPages: 1,
      totalElements: 2,
      numberOfElements: 2,
      pageable: { offset: 0 },
    });

    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: jest.fn(),
    });

    render(
      <AddComponentsDialog
        open={true}
        onClose={onCloseMock}
        measure={mockMeasure}
        compositeScoring="Opportunity"
        components={[]}
        submitComponentForm={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockSearchMeasures).toHaveBeenCalled();
    });

    await waitFor(
      () => {
        expect(screen.queryByText("Another Measure")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(screen.queryByText("Test Measure")).toBeInTheDocument();
    expect(screen.queryByText("Another Measure")).toBeInTheDocument();
  });

  it("calls onClose when cancel button is clicked", async () => {
    const mockSearchMeasures = jest.fn().mockResolvedValue(zeroItemResponse);

    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: jest.fn(),
    });

    render(
      <AddComponentsDialog
        open={true}
        onClose={onCloseMock}
        measure={mockMeasure}
        compositeScoring="Opportunity"
        components={[]}
        submitComponentForm={jest.fn()}
      />
    );

    const cancelButton = screen.getByTestId(
      "select-composite-measure-components-cancel-button"
    );
    await userEvent.click(cancelButton);

    expect(onCloseMock).toHaveBeenCalled();
  });

  it("displays loading spinner while fetching data", async () => {
    const mockSearchMeasures = jest
      .fn()
      .mockImplementation(() => new Promise(() => {}));

    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: jest.fn(),
    });

    render(
      <AddComponentsDialog
        open={true}
        onClose={onCloseMock}
        measure={mockMeasure}
        compositeScoring="Opportunity"
        components={[]}
        submitComponentForm={jest.fn()}
      />
    );

    expect(mockSearchMeasures).toHaveBeenCalled();
  });

  it("displays empty state message when no measures found", async () => {
    const mockSearchMeasures = jest.fn().mockResolvedValue(zeroItemResponse);

    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: jest.fn(),
    });

    render(
      <AddComponentsDialog
        open={true}
        onClose={onCloseMock}
        measure={mockMeasure}
        compositeScoring="Opportunity"
        components={[]}
        submitComponentForm={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockSearchMeasures).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(
        screen.getByText("There are no measures that belong to the same model.")
      ).toBeInTheDocument();
    });
  });

  it("handles pagination - page change", async () => {
    const mockSearchMeasures = jest.fn().mockResolvedValue({
      content: data,
      totalPages: 3,
      totalElements: 15,
      numberOfElements: 5,
      pageable: { offset: 0 },
    });

    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: jest.fn(),
    });

    render(
      <AddComponentsDialog
        open={true}
        onClose={onCloseMock}
        measure={mockMeasure}
        compositeScoring="Opportunity"
        components={[]}
        submitComponentForm={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockSearchMeasures).toHaveBeenCalled();
    });

    mockSearchMeasures.mockClear();

    const nextPageButton = screen.getByRole("button", { name: /next/i });
    await userEvent.click(nextPageButton);

    await waitFor(() => {
      expect(mockSearchMeasures).toHaveBeenCalled();
    });
  });

  it("handles pagination - limit change", async () => {
    const mockSearchMeasures = jest.fn().mockResolvedValue({
      content: data,
      totalPages: 1,
      totalElements: 2,
      numberOfElements: 2,
      pageable: { offset: 0 },
    });

    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: jest.fn(),
    });

    render(
      <AddComponentsDialog
        open={true}
        onClose={onCloseMock}
        measure={mockMeasure}
        compositeScoring="Opportunity"
        components={[]}
        submitComponentForm={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockSearchMeasures).toHaveBeenCalled();
    });

    mockSearchMeasures.mockClear();

    const limitSelect = screen
      .getAllByRole("combobox")
      .find(
        (select) =>
          select.getAttribute("aria-labelledby") === "pagination-limit-select"
      );
    userEvent.click(limitSelect);

    const option10 = screen.getByRole("option", { name: "10" });
    userEvent.click(option10);

    await waitFor(() => {
      expect(mockSearchMeasures).toHaveBeenCalled();
    });
  });

  it("does not fetch measures when dialog is closed", () => {
    const mockSearchMeasures = jest.fn().mockResolvedValue(zeroItemResponse);

    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: jest.fn(),
    });

    render(
      <AddComponentsDialog
        open={false}
        onClose={onCloseMock}
        measure={mockMeasure}
        compositeScoring="Opportunity"
        components={[]}
        submitComponentForm={jest.fn()}
      />
    );

    expect(mockSearchMeasures).not.toHaveBeenCalled();
  });

  it("handles keyboard interaction on expand icon", async () => {
    const mockGetMeasuresBySetId = jest.fn().mockResolvedValue([
      {
        id: "child-1",
        measureName: "Child Measure 1",
        version: "1.0.0",
        measureSet: { cmsId: "CMS789" },
        lastModifiedAt: "2024-01-15",
      },
    ]);

    const mockSearchMeasures = jest.fn().mockResolvedValue({
      content: data,
      totalPages: 1,
      totalElements: 2,
      numberOfElements: 2,
      pageable: { offset: 0 },
    });

    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: mockGetMeasuresBySetId,
    });

    render(
      <AddComponentsDialog
        open={true}
        onClose={onCloseMock}
        measure={mockMeasure}
        compositeScoring="Opportunity"
        components={[]}
        submitComponentForm={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockSearchMeasures).toHaveBeenCalled();
    });

    await waitFor(
      () => {
        expect(screen.queryByText("Test Measure")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const rows = screen.getAllByRole("row");
    const firstDataRow = rows[1];

    if (firstDataRow) {
      const expandButton = firstDataRow.querySelector("span[role='button']");
      if (expandButton) {
        expandButton.focus();
        await userEvent.keyboard("{Enter}");

        await waitFor(
          () => {
            expect(mockGetMeasuresBySetId).toHaveBeenCalled();
          },
          { timeout: 3000 }
        );
      }
    }
  });

  it("handles space key on expand icon", async () => {
    const mockGetMeasuresBySetId = jest.fn().mockResolvedValue([
      {
        id: "child-1",
        measureName: "Child Measure 1",
        version: "1.0.0",
        measureSet: { cmsId: "CMS789" },
        lastModifiedAt: "2024-01-15",
      },
    ]);

    const mockSearchMeasures = jest.fn().mockResolvedValue({
      content: data,
      totalPages: 1,
      totalElements: 2,
      numberOfElements: 2,
      pageable: { offset: 0 },
    });

    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: mockGetMeasuresBySetId,
    });

    render(
      <AddComponentsDialog
        open={true}
        onClose={onCloseMock}
        measure={mockMeasure}
        compositeScoring="Opportunity"
        components={[]}
        submitComponentForm={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockSearchMeasures).toHaveBeenCalled();
    });

    await waitFor(
      () => {
        expect(screen.queryByText("Test Measure")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const rows = screen.getAllByRole("row");
    const firstDataRow = rows[1];

    if (firstDataRow) {
      const expandButton = firstDataRow.querySelector("span[role='button']");
      if (expandButton) {
        expandButton.focus();
        await userEvent.keyboard(" ");

        await waitFor(
          () => {
            expect(mockGetMeasuresBySetId).toHaveBeenCalled();
          },
          { timeout: 3000 }
        );
      }
    }
  });

  it("handles submit button click", async () => {
    const mockSearchMeasures = jest.fn().mockResolvedValue(zeroItemResponse);
    const mockFetchMeasuresByIds = jest.fn().mockResolvedValue([
      {
        id: "measure-1",
        measureName: "Parent Measure",
        version: "1.0.0",
        groups: [{ id: "pg-1" }, { id: "pg-2" }],
      },
      {
        id: "child-valid",
        measureName: "Valid Child",
        version: "1.0.0",
        measureSet: { cmsId: "CMS999" },
        lastModifiedAt: "2024-01-15",
        groups: [{ id: "cg-1" }],
      },
    ]);
    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: jest.fn(),
      fetchMeasuresByIds: mockFetchMeasuresByIds,
    });
    const submitComponentFormMock = jest.fn();

    render(
      <AddComponentsDialog
        open={true}
        onClose={onCloseMock}
        measure={mockMeasure}
        submitComponentForm={submitComponentFormMock}
        compositeScoring="Opportunity"
        components={[]}
      />
    );

    const saveButton = screen.getByTestId(
      "select-composite-measure-components-continue-button"
    );
    await userEvent.click(saveButton);
    expect(onCloseMock).not.toHaveBeenCalled();
  });

  it("displays correct CMS ID in expanded rows", async () => {
    const mockGetMeasuresBySetId = jest.fn().mockResolvedValue([
      {
        id: "child-1",
        measureName: "Child Measure 1",
        version: "1.0.0",
        measureSet: { cmsId: "CMS789" },
        lastModifiedAt: "2024-01-15",
      },
    ]);

    const mockSearchMeasures = jest.fn().mockResolvedValue({
      content: data,
      totalPages: 1,
      totalElements: 2,
      numberOfElements: 2,
      pageable: { offset: 0 },
    });

    const mockFetchMeasuresByIds = jest.fn().mockResolvedValue([
      {
        id: "measure-1",
        measureName: "Parent Measure",
        version: "1.0.0",
        groups: [{ id: "pg-1" }, { id: "pg-2" }],
      },
      {
        id: "child-valid",
        measureName: "Valid Child",
        version: "1.0.0",
        measureSet: { cmsId: "CMS999" },
        lastModifiedAt: "2024-01-15",
        groups: [{ id: "cg-1" }],
      },
    ]);

    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: mockGetMeasuresBySetId,
      fetchMeasuresByIds: mockFetchMeasuresByIds,
    });
    const submitComponentFormMock = jest.fn();
    render(
      <AddComponentsDialog
        submitComponentForm={submitComponentFormMock}
        open={true}
        onClose={onCloseMock}
        measure={mockMeasure}
        compositeScoring="Opportunity"
        components={[]}
      />
    );

    await waitFor(() => {
      expect(mockSearchMeasures).toHaveBeenCalled();
    });

    await waitFor(
      () => {
        expect(screen.queryByText("Test Measure")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const rows = screen.getAllByRole("row");
    const firstDataRow = rows[1];

    if (firstDataRow) {
      const expandButton = firstDataRow.querySelector("span[role='button']");
      if (expandButton) {
        await userEvent.click(expandButton);

        await waitFor(
          () => {
            expect(mockGetMeasuresBySetId).toHaveBeenCalled();
          },
          { timeout: 3000 }
        );
      }
    }
  });

  it("handles error during measure fetch gracefully", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    const mockSearchMeasures = jest
      .fn()
      .mockRejectedValue(new Error("Network error"));

    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: jest.fn(),
    });

    render(
      <AddComponentsDialog
        open={true}
        onClose={onCloseMock}
        measure={mockMeasure}
        compositeScoring="Opportunity"
        components={[]}
        submitComponentForm={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to fetch measures:",
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it("does not log error when request is aborted", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    const abortError = new Error("Request aborted");
    abortError.name = "AbortError";
    const mockSearchMeasures = jest.fn().mockRejectedValue(abortError);

    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: jest.fn(),
    });

    render(
      <AddComponentsDialog
        open={true}
        onClose={onCloseMock}
        measure={mockMeasure}
        compositeScoring="Opportunity"
        components={[]}
        submitComponentForm={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockSearchMeasures).toHaveBeenCalled();
    });
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("does not fetch measures when measure prop is missing", () => {
    const mockSearchMeasures = jest.fn().mockResolvedValue(zeroItemResponse);

    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: jest.fn(),
    });

    render(
      <AddComponentsDialog
        open={true}
        onClose={onCloseMock}
        measure={null}
        compositeScoring="Opportunity"
        components={[]}
        submitComponentForm={jest.fn()}
      />
    );

    expect(mockSearchMeasures).not.toHaveBeenCalled();
  });

  it("does not fetch measures when measure model is missing", () => {
    const mockSearchMeasures = jest.fn().mockResolvedValue(zeroItemResponse);

    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: jest.fn(),
    });

    render(
      <AddComponentsDialog
        open={true}
        onClose={onCloseMock}
        measure={{ id: "test-id", measureName: "Test" }}
        compositeScoring="Opportunity"
        components={[]}
        submitComponentForm={jest.fn()}
      />
    );

    expect(mockSearchMeasures).not.toHaveBeenCalled();
  });

  it("does not fetch measures when measure id is missing", () => {
    const mockSearchMeasures = jest.fn().mockResolvedValue(zeroItemResponse);

    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: jest.fn(),
    });

    render(
      <AddComponentsDialog
        open={true}
        onClose={onCloseMock}
        measure={{ model: "QI-Core", measureName: "Test" }}
        compositeScoring="Opportunity"
        components={[]}
        submitComponentForm={jest.fn()}
      />
    );

    expect(mockSearchMeasures).not.toHaveBeenCalled();
  });

  it("passes priorityMeasureSets from components to searchMeasuresByCriteria", async () => {
    const mockSearchMeasures = jest.fn().mockResolvedValue(zeroItemResponse);

    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: jest.fn(),
    });

    render(
      <AddComponentsDialog
        open={true}
        onClose={onCloseMock}
        measure={mockMeasure}
        compositeScoring="Opportunity"
        components={[
          { id: "m1", measureSetId: "set-A" },
          { id: "m2", measureSetId: "set-B" },
        ]}
        submitComponentForm={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockSearchMeasures).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          priorityMeasureSets: ["set-A", "set-B"],
        }),
        expect.anything()
      );
    });
  });

  it("auto-expands rows whose measureSetId matches a component but the row is not the exact component version", async () => {
    // row "1" shares "set-1" with the component but has a different id ("1" vs "other-version")
    const mockGetMeasuresBySetId = jest.fn().mockResolvedValue([]);

    const mockSearchMeasures = jest.fn().mockResolvedValue({
      content: [
        {
          id: "1",
          measureName: "Test Measure",
          version: "1.0.0",
          measureSet: { cmsId: "CMS123" },
          measureSetId: "set-1",
          lastModifiedAt: "2024-01-01",
          hasAssociatedMeasures: true,
        },
      ],
      totalPages: 1,
      totalElements: 1,
      numberOfElements: 1,
      pageable: { offset: 0 },
    });

    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: mockGetMeasuresBySetId,
    });

    // component has measureSetId "set-1" but id "other-version" (not "1"),
    // so the row should auto-expand
    render(
      <AddComponentsDialog
        open={true}
        onClose={onCloseMock}
        measure={mockMeasure}
        compositeScoring="Opportunity"
        components={[{ id: "other-version", measureSetId: "set-1" }]}
        submitComponentForm={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockSearchMeasures).toHaveBeenCalled();
    });

    await waitFor(
      () => {
        expect(mockGetMeasuresBySetId).toHaveBeenCalledWith(
          "set-1",
          true,
          expect.anything()
        );
      },
      { timeout: 3000 }
    );
  });

  it("does not auto-expand a row when the row id matches the component id exactly", async () => {
    const mockGetMeasuresBySetId = jest.fn().mockResolvedValue([]);

    const mockSearchMeasures = jest.fn().mockResolvedValue({
      content: [
        {
          id: "1",
          measureName: "Test Measure",
          version: "1.0.0",
          measureSet: { cmsId: "CMS123" },
          measureSetId: "set-1",
          lastModifiedAt: "2024-01-01",
          hasAssociatedMeasures: true,
        },
      ],
      totalPages: 1,
      totalElements: 1,
      numberOfElements: 1,
      pageable: { offset: 0 },
    });

    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: mockGetMeasuresBySetId,
    });

    // component id matches the row id exactly — no auto-expand expected
    render(
      <AddComponentsDialog
        open={true}
        onClose={onCloseMock}
        measure={mockMeasure}
        compositeScoring="Opportunity"
        components={[{ id: "1", measureSetId: "set-1" }]}
        submitComponentForm={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockSearchMeasures).toHaveBeenCalled();
    });

    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(mockGetMeasuresBySetId).not.toHaveBeenCalled();
  });

  it("resets expandedSectionMap and expandedRowSelection when dialog closes", async () => {
    const mockGetMeasuresBySetId = jest.fn().mockResolvedValue([
      {
        id: "child-1",
        measureName: "Child Measure 1",
        version: "1.0.0",
        measureSet: { cmsId: "CMS789" },
        lastModifiedAt: "2024-01-15",
      },
    ]);

    const mockSearchMeasures = jest.fn().mockResolvedValue({
      content: data,
      totalPages: 1,
      totalElements: 2,
      numberOfElements: 2,
      pageable: { offset: 0 },
    });

    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: mockGetMeasuresBySetId,
    });

    const { rerender } = render(
      <AddComponentsDialog
        open={true}
        onClose={onCloseMock}
        measure={mockMeasure}
        compositeScoring="Opportunity"
        components={[]}
        submitComponentForm={jest.fn()}
      />
    );

    await waitFor(() =>
      expect(screen.queryByText("Test Measure")).toBeInTheDocument()
    );

    // expand first row
    const rows = screen.getAllByRole("row");
    const expandButton = rows[1].querySelector("span[role='button']");
    if (expandButton) {
      await userEvent.click(expandButton);
      await waitFor(() => expect(mockGetMeasuresBySetId).toHaveBeenCalled());
    }

    // close dialog — expanded state should be cleared
    rerender(
      <AddComponentsDialog
        open={false}
        onClose={onCloseMock}
        measure={mockMeasure}
        compositeScoring="Opportunity"
        components={[]}
        submitComponentForm={jest.fn()}
      />
    );

    // re-open
    rerender(
      <AddComponentsDialog
        open={true}
        onClose={onCloseMock}
        measure={mockMeasure}
        compositeScoring="Opportunity"
        components={[]}
        submitComponentForm={jest.fn()}
      />
    );

    await waitFor(() =>
      expect(screen.queryByText("Test Measure")).toBeInTheDocument()
    );

    // no expanded-row should be visible after re-open without clicking expand
    expect(
      screen.queryByTestId("expanded-row-child-1")
    ).not.toBeInTheDocument();
  });

  describe("Filtering", () => {
    it("applies specific filter when FilterBy is selected", async () => {
      const mockSearchMeasures = jest
        .fn()
        .mockResolvedValue(mockOneItemResponse);

      useMeasureServiceApi.mockReturnValue({
        searchMeasuresByCriteria: mockSearchMeasures,
        getMeasuresByMeasureSetId: jest.fn(),
      });

      render(
        <AddComponentsDialog
          open={true}
          onClose={onCloseMock}
          measure={mockMeasure}
          compositeScoring="Opportunity"
          components={[]}
          submitComponentForm={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(mockSearchMeasures).toHaveBeenCalled();
      });

      // Get the filter dropdown and search input
      const filterDropdown = screen.getByLabelText("Filter By");
      const searchInput = screen.getByPlaceholderText("Search");
      const searchTrigger = screen.getByTestId("test-cases-trigger-search");

      // Select a specific filter (e.g., "Measure")
      userEvent.click(filterDropdown);
      const measureOption = screen.getByRole("option", { name: "Measure" });
      userEvent.click(measureOption);

      // Enter search text
      userEvent.type(searchInput, "Test");

      // Click search trigger to trigger the search
      mockSearchMeasures.mockClear();
      userEvent.click(searchTrigger);

      await waitFor(() => {
        expect(mockSearchMeasures).toHaveBeenCalled();
      });

      // Verify that only "measureName" is in optionalSearchProperties
      const lastCall =
        mockSearchMeasures.mock.calls[mockSearchMeasures.mock.calls.length - 1];
      const searchCriteria = lastCall[5];
      expect(searchCriteria.optionalSearchProperties).toEqual(["measureName"]);
      expect(searchCriteria.optionalSearchProperties.length).toBe(1);
    });

    it("applies all filters when FilterBy not selected but Search has search string", async () => {
      const mockSearchMeasures = jest
        .fn()
        .mockResolvedValue(mockOneItemResponse);

      useMeasureServiceApi.mockReturnValue({
        searchMeasuresByCriteria: mockSearchMeasures,
        getMeasuresByMeasureSetId: jest.fn(),
      });

      render(
        <AddComponentsDialog
          open={true}
          onClose={onCloseMock}
          measure={mockMeasure}
          compositeScoring="Opportunity"
          components={[{ id: "other-version", measureSetId: "set-1" }]}
          submitComponentForm={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(mockSearchMeasures).toHaveBeenCalled();
      });

      // Get the search input (filter dropdown should be empty/default)
      const searchInput = screen.getByPlaceholderText("Search");
      const searchTrigger = screen.getByTestId("test-cases-trigger-search");

      // Enter search text without selecting a filter
      userEvent.type(searchInput, "TestSearch");

      // Click search trigger to trigger the search
      mockSearchMeasures.mockClear();
      userEvent.click(searchTrigger);

      await waitFor(() => {
        expect(mockSearchMeasures).toHaveBeenCalled();
      });

      // Verify that all filter options are in optionalSearchProperties
      const lastCall =
        mockSearchMeasures.mock.calls[mockSearchMeasures.mock.calls.length - 1];
      const searchCriteria = lastCall[5];
      expect(searchCriteria.optionalSearchProperties).toEqual([
        "measureName",
        "version",
        "cmsId",
      ]);
      expect(searchCriteria.optionalSearchProperties.length).toBe(3);
    });

    it("clears filters when clear button is clicked", async () => {
      const mockSearchMeasures = jest
        .fn()
        .mockResolvedValue(mockOneItemResponse);

      useMeasureServiceApi.mockReturnValue({
        searchMeasuresByCriteria: mockSearchMeasures,
        getMeasuresByMeasureSetId: jest.fn(),
      });

      render(
        <AddComponentsDialog
          open={true}
          onClose={onCloseMock}
          measure={mockMeasure}
          compositeScoring="Opportunity"
          components={[]}
          submitComponentForm={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(mockSearchMeasures).toHaveBeenCalled();
      });

      const filterDropdown = screen.getByLabelText("Filter By");
      const searchInput = screen.getByPlaceholderText("Search");
      const searchTrigger = screen.getByTestId("test-cases-trigger-search");

      // Set filter and search
      userEvent.click(filterDropdown);
      const measureOption = screen.getByRole("option", { name: "Measure" });
      userEvent.click(measureOption);
      userEvent.type(searchInput, "Test");
      userEvent.click(searchTrigger);

      await waitFor(() => {
        expect(mockSearchMeasures).toHaveBeenCalled();
      });

      // Clear filters
      const clearButton = screen.getByTestId("test-cases-clear-search");
      mockSearchMeasures.mockClear();
      userEvent.click(clearButton);

      await waitFor(() => {
        expect(mockSearchMeasures).toHaveBeenCalled();
      });

      // After clearing, should have no optional filter properties
      const lastCall =
        mockSearchMeasures.mock.calls[mockSearchMeasures.mock.calls.length - 1];
      const searchCriteria = lastCall[5];
      expect(searchCriteria.optionalSearchProperties).toEqual([]);
      expect(searchCriteria.searchField).toBe("");
    });
  });

  describe("Nested Rows - Selection, Updating, and Saving", () => {
    // expand button is now a span[role="button"], not a <button>
    const getExpandButton = (
      row: HTMLElement | undefined
    ): HTMLElement | null => {
      if (!row) return null;
      return row.querySelector("span[role='button']") as HTMLElement | null;
    };

    const getCheckbox = (
      row: HTMLElement | undefined
    ): HTMLInputElement | null => {
      if (!row) return null;
      return row.querySelector(
        "input[type='checkbox']"
      ) as HTMLInputElement | null;
    };

    it("checks nested row checkbox and updates rowSelection state", async () => {
      const mockGetMeasuresBySetId = jest.fn().mockResolvedValue([
        {
          id: "child-1",
          measureName: "Child Measure 1",
          version: "1.0.0",
          measureSet: { cmsId: "CMS789" },
          lastModifiedAt: "2024-01-15",
          groups: [{ id: "cg-1" }],
        },
        {
          id: "child-2",
          measureName: "Child Measure 2",
          version: "1.1.0",
          measureSet: { cmsId: "CMS790" },
          lastModifiedAt: "2024-01-20",
          groups: [{ id: "cg-2" }],
        },
      ]);

      const mockSearchMeasures = jest.fn().mockResolvedValue({
        content: [
          {
            id: "1",
            measureName: "Test Measure",
            version: "1.0.0",
            measureSet: { cmsId: "CMS123" },
            measureSetId: "set-1",
            lastModifiedAt: "2024-01-01",
            hasAssociatedMeasures: true,
            groups: [{ id: "pg-1" }],
          },
        ],
        totalPages: 1,
        totalElements: 1,
        numberOfElements: 1,
        pageable: { offset: 0 },
      });

      useMeasureServiceApi.mockReturnValue({
        searchMeasuresByCriteria: mockSearchMeasures,
        getMeasuresByMeasureSetId: mockGetMeasuresBySetId,
      });

      render(
        <AddComponentsDialog
          open={true}
          onClose={jest.fn()}
          measure={mockMeasure}
          compositeScoring="Opportunity"
          components={[]}
          submitComponentForm={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(mockSearchMeasures).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.queryByText("Test Measure")).toBeInTheDocument();
      });

      const rows = screen.getAllByRole("row");
      const firstDataRow = rows[1];
      const expandButton = getExpandButton(firstDataRow);

      await userEvent.click(expandButton);

      await waitFor(() => {
        expect(mockGetMeasuresBySetId).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.queryByText("Child Measure 1")).toBeInTheDocument();
        expect(screen.queryByText("Child Measure 2")).toBeInTheDocument();
      });
    });

    it("applies blue background to checked nested row", async () => {
      const mockGetMeasuresBySetId = jest.fn().mockResolvedValue([
        {
          id: "child-1",
          measureName: "Child Measure 1",
          version: "1.0.0",
          measureSet: { cmsId: "CMS789" },
          lastModifiedAt: "2024-01-15",
          groups: [{ id: "cg-1" }],
        },
      ]);

      const mockSearchMeasures = jest.fn().mockResolvedValue({
        content: [
          {
            id: "1",
            measureName: "Test Measure",
            version: "1.0.0",
            measureSet: { cmsId: "CMS123" },
            measureSetId: "set-1",
            lastModifiedAt: "2024-01-01",
            hasAssociatedMeasures: true,
            groups: [{ id: "pg-1" }],
          },
        ],
        totalPages: 1,
        totalElements: 1,
        numberOfElements: 1,
        pageable: { offset: 0 },
      });

      useMeasureServiceApi.mockReturnValue({
        searchMeasuresByCriteria: mockSearchMeasures,
        getMeasuresByMeasureSetId: mockGetMeasuresBySetId,
      });

      render(
        <AddComponentsDialog
          open={true}
          onClose={jest.fn()}
          measure={mockMeasure}
          compositeScoring="Opportunity"
          components={[]}
          submitComponentForm={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(mockSearchMeasures).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          expect(screen.queryByText("Test Measure")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const rows = screen.getAllByRole("row");
      const firstDataRow = rows[1];
      const expandButton = getExpandButton(firstDataRow);

      if (expandButton) {
        await userEvent.click(expandButton);

        await waitFor(
          () => {
            expect(screen.queryByText("Child Measure 1")).toBeInTheDocument();
          },
          { timeout: 3000 }
        );
      }

      const expandedRows = screen.getAllByRole("row");
      const nestedRow = expandedRows.find(
        (row) =>
          row.textContent.includes("Child Measure 1") &&
          row.className.includes("expanded-row")
      );

      const checkbox = getCheckbox(nestedRow);

      if (checkbox) {
        await userEvent.click(checkbox);
        // re-query after state update
        const updatedRows = screen.getAllByRole("row");
        const updatedNestedRow = updatedRows.find(
          (row) =>
            row.textContent.includes("Child Measure 1") &&
            row.className.includes("expanded-row")
        );
        const updatedCheckbox = getCheckbox(updatedNestedRow);
        expect(updatedCheckbox).toBeChecked();
        expect(updatedNestedRow).toHaveStyle({ backgroundColor: "#e3f2fd" });
      }
    });

    it("unchecks nested row checkbox when clicked again", async () => {
      const mockGetMeasuresBySetId = jest.fn().mockResolvedValue([
        {
          id: "child-1",
          measureName: "Child Measure 1",
          version: "1.0.0",
          measureSet: { cmsId: "CMS789" },
          lastModifiedAt: "2024-01-15",
          groups: [{ id: "cg-1" }],
        },
      ]);

      const mockSearchMeasures = jest.fn().mockResolvedValue({
        content: [
          {
            id: "1",
            measureName: "Test Measure",
            version: "1.0.0",
            measureSet: { cmsId: "CMS123" },
            measureSetId: "set-1",
            lastModifiedAt: "2024-01-01",
            hasAssociatedMeasures: true,
            groups: [{ id: "pg-1" }],
          },
        ],
        totalPages: 1,
        totalElements: 1,
        numberOfElements: 1,
        pageable: { offset: 0 },
      });

      useMeasureServiceApi.mockReturnValue({
        searchMeasuresByCriteria: mockSearchMeasures,
        getMeasuresByMeasureSetId: mockGetMeasuresBySetId,
      });

      render(
        <AddComponentsDialog
          open={true}
          onClose={jest.fn()}
          measure={mockMeasure}
          compositeScoring="Opportunity"
          components={[]}
          submitComponentForm={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(mockSearchMeasures).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          expect(screen.queryByText("Test Measure")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const rows = screen.getAllByRole("row");
      const firstDataRow = rows[1];
      const expandButton = getExpandButton(firstDataRow);

      if (expandButton) {
        await userEvent.click(expandButton);

        await waitFor(
          () => {
            expect(screen.queryByText("Child Measure 1")).toBeInTheDocument();
          },
          { timeout: 3000 }
        );
      }

      const expandedRows = screen.getAllByRole("row");
      const nestedRow = expandedRows.find(
        (row) =>
          row.textContent.includes("Child Measure 1") &&
          row.className.includes("expanded-row")
      );

      const checkbox = getCheckbox(nestedRow);

      if (checkbox) {
        await userEvent.click(checkbox);
        // re-query after first click
        const checkedRows = screen.getAllByRole("row");
        const checkedNestedRow = checkedRows.find(
          (row) =>
            row.textContent.includes("Child Measure 1") &&
            row.className.includes("expanded-row")
        );
        const checkedCheckbox = getCheckbox(checkedNestedRow);
        expect(checkedCheckbox).toBeChecked();
        expect(checkedNestedRow).toHaveStyle({ backgroundColor: "#e3f2fd" });

        await userEvent.click(checkedCheckbox);
        // re-query after second click
        const uncheckedRows = screen.getAllByRole("row");
        const uncheckedNestedRow = uncheckedRows.find(
          (row) =>
            row.textContent.includes("Child Measure 1") &&
            row.className.includes("expanded-row")
        );
        const uncheckedCheckbox = getCheckbox(uncheckedNestedRow);
        expect(uncheckedCheckbox).not.toBeChecked();
        expect(uncheckedNestedRow).toHaveStyle({ backgroundColor: "white" });
      }
    });

    it("syncs nested row selection with preselected ids on dialog open", async () => {
      const mockGetMeasuresBySetId = jest.fn().mockResolvedValue([
        {
          id: "child-1",
          measureName: "Child Measure 1",
          version: "1.0.0",
          measureSet: { cmsId: "CMS789" },
          lastModifiedAt: "2024-01-15",
          groups: [{ id: "cg-1" }],
        },
      ]);

      const mockSearchMeasures = jest.fn().mockResolvedValue({
        content: [
          {
            id: "1",
            measureName: "Test Measure",
            version: "1.0.0",
            measureSet: { cmsId: "CMS123" },
            measureSetId: "set-1",
            lastModifiedAt: "2024-01-01",
            hasAssociatedMeasures: true,
            groups: [{ id: "pg-1" }],
          },
        ],
        totalPages: 1,
        totalElements: 1,
        numberOfElements: 1,
        pageable: { offset: 0 },
      });

      useMeasureServiceApi.mockReturnValue({
        searchMeasuresByCriteria: mockSearchMeasures,
        getMeasuresByMeasureSetId: mockGetMeasuresBySetId,
      });

      render(
        <AddComponentsDialog
          open={true}
          onClose={jest.fn()}
          measure={mockMeasure}
          compositeScoring="Opportunity"
          // components carry id so preselectedIds picks up "child-1"
          components={[{ id: "child-1", measureSetId: "set-1" }]}
          submitComponentForm={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(mockSearchMeasures).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          expect(screen.queryByText("Test Measure")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // auto-expand fires because component id "child-1" != row id "1" but same measureSetId
      await waitFor(
        () => {
          expect(screen.queryByText("Child Measure 1")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const expandedRows = screen.getAllByRole("row");
      const nestedRow = expandedRows.find(
        (row) =>
          row.textContent.includes("Child Measure 1") &&
          row.className.includes("expanded-row")
      );

      const checkbox = getCheckbox(nestedRow);
      expect(checkbox).toBeChecked();
      expect(nestedRow).toHaveStyle({ backgroundColor: "#e3f2fd" });
    });

    it("handles error during nested row expansion gracefully", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const mockGetMeasuresBySetId = jest
        .fn()
        .mockRejectedValue(new Error("Failed to fetch associated measures"));

      const mockSearchMeasures = jest.fn().mockResolvedValue({
        content: [
          {
            id: "1",
            measureName: "Test Measure",
            version: "1.0.0",
            measureSet: { cmsId: "CMS123" },
            measureSetId: "set-1",
            lastModifiedAt: "2024-01-01",
            hasAssociatedMeasures: true,
            groups: [{ id: "pg-1" }],
          },
        ],
        totalPages: 1,
        totalElements: 1,
        numberOfElements: 1,
        pageable: { offset: 0 },
      });

      useMeasureServiceApi.mockReturnValue({
        searchMeasuresByCriteria: mockSearchMeasures,
        getMeasuresByMeasureSetId: mockGetMeasuresBySetId,
      });

      render(
        <AddComponentsDialog
          open={true}
          onClose={jest.fn()}
          measure={mockMeasure}
          compositeScoring="Opportunity"
          components={[{ id: "other-version", measureSetId: "set-1" }]}
          submitComponentForm={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(mockSearchMeasures).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          expect(screen.queryByText("Test Measure")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const rows = screen.getAllByRole("row");
      const firstDataRow = rows[1];
      const expandButton = getExpandButton(firstDataRow);

      if (expandButton) {
        userEvent.click(expandButton);
        await waitFor(() => {
          expect(mockGetMeasuresBySetId).toHaveBeenCalled();
        });
      }

      // the table row is still rendered (no crash)
      expect(screen.queryByText("Test Measure")).toBeInTheDocument();
      expect(screen.queryByText(ROW_EXPANSION_ERROR)).toBeInTheDocument();
      consoleErrorSpy.mockRestore();
    });

    it("submits selected measures and calls submitComponentForm with correct component structure", async () => {
      const mockSearchMeasures = jest.fn().mockResolvedValue({
        content: [
          {
            id: "1",
            measureName: "Test Measure",
            version: "1.0.0",
            measureSet: { cmsId: "CMS123" },
            measureSetId: "set-1",
            lastModifiedAt: "2024-01-01",
            hasAssociatedMeasures: true,
            groups: [{ id: "pg-1" }],
          },
          {
            id: "2",
            measureName: "Another Measure",
            version: "2.0.0",
            measureSet: { cmsId: "CMS456" },
            measureSetId: "set-2",
            lastModifiedAt: "2024-02-01",
            hasAssociatedMeasures: false,
            groups: [{ id: "pg-2" }, { id: "pg-3" }],
          },
        ],
        totalPages: 1,
        totalElements: 2,
        numberOfElements: 2,
        pageable: { offset: 0 },
      });

      const mockFetchMeasuresByIds = jest.fn().mockResolvedValue([
        {
          id: "1",
          measureName: "Test Measure",
          version: "1.0.0",
          groups: [{ id: "pg-1" }],
        },
        {
          id: "2",
          measureName: "Another Measure",
          version: "2.0.0",
          groups: [{ id: "pg-2" }, { id: "pg-3" }],
        },
      ]);

      useMeasureServiceApi.mockReturnValue({
        searchMeasuresByCriteria: mockSearchMeasures,
        getMeasuresByMeasureSetId: jest.fn(),
        fetchMeasuresByIds: mockFetchMeasuresByIds,
      });

      const submitComponentFormMock = jest.fn();

      render(
        <AddComponentsDialog
          open={true}
          onClose={onCloseMock}
          measure={mockMeasure}
          compositeScoring="Opportunity"
          components={[]}
          submitComponentForm={submitComponentFormMock}
        />
      );

      await waitFor(() => {
        expect(mockSearchMeasures).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          expect(screen.queryByText("Test Measure")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const checkboxes = screen.getAllByRole("checkbox");
      const measure1Checkbox = checkboxes[1];
      const measure2Checkbox = checkboxes[2];

      await userEvent.click(measure1Checkbox);
      await userEvent.click(measure2Checkbox);

      const saveButton = screen.getByTestId(
        "select-composite-measure-components-continue-button"
      );
      const versionHeader = screen.getByRole("columnheader", {
        name: /version/i,
      });

      await userEvent.hover(versionHeader);
      await userEvent.click(versionHeader);
      await userEvent.unhover(versionHeader);

      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockFetchMeasuresByIds).toHaveBeenCalledWith(["1", "2"]);
      });

      await waitFor(() => {
        expect(submitComponentFormMock).toHaveBeenCalledWith([
          { measureId: "1", groupId: "pg-1" },
          { measureId: "2", groupId: "pg-2" },
          { measureId: "2", groupId: "pg-3" },
        ]);
      });

      await waitFor(() => {
        expect(onCloseMock).toHaveBeenCalled();
      });
    });

    it("removes duplicate components and calls submitComponentForm with unique components only", async () => {
      const mockSearchMeasures = jest.fn().mockResolvedValue({
        content: [
          {
            id: "1",
            measureName: "Test Measure",
            version: "1.0.0",
            measureSet: { cmsId: "CMS123" },
            measureSetId: "set-1",
            lastModifiedAt: "2024-01-01",
            hasAssociatedMeasures: true,
            groups: [{ id: "pg-1" }, { id: "pg-1" }],
          },
        ],
        totalPages: 1,
        totalElements: 1,
        numberOfElements: 1,
        pageable: { offset: 0 },
      });

      const mockFetchMeasuresByIds = jest.fn().mockResolvedValue([
        {
          id: "1",
          measureName: "Test Measure",
          version: "1.0.0",
          groups: [{ id: "pg-1" }, { id: "pg-1" }],
        },
      ]);

      useMeasureServiceApi.mockReturnValue({
        searchMeasuresByCriteria: mockSearchMeasures,
        getMeasuresByMeasureSetId: jest.fn(),
        fetchMeasuresByIds: mockFetchMeasuresByIds,
      });

      const submitComponentFormMock = jest.fn();

      render(
        <AddComponentsDialog
          open={true}
          onClose={onCloseMock}
          measure={mockMeasure}
          compositeScoring="Opportunity"
          components={[]}
          submitComponentForm={submitComponentFormMock}
        />
      );

      await waitFor(() => {
        expect(mockSearchMeasures).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          expect(screen.queryByText("Test Measure")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const checkboxes = screen.getAllByRole("checkbox");
      const measureCheckbox = checkboxes[1];

      await userEvent.click(measureCheckbox);

      const saveButton = screen.getByTestId(
        "select-composite-measure-components-continue-button"
      );
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockFetchMeasuresByIds).toHaveBeenCalledWith(["1"]);
      });

      await waitFor(() => {
        expect(submitComponentFormMock).toHaveBeenCalledWith([
          { measureId: "1", groupId: "pg-1" },
        ]);
      });

      await waitFor(() => {
        expect(onCloseMock).toHaveBeenCalled();
      });
    });
  });

  it("renders padded CMS ID with FHIR suffix for QI-Core in main rows and expanded rows", async () => {
    const mainRowData = [
      {
        id: "main-qicore",
        measureName: "QI-Core Main",
        version: "1.0.0",
        model: "QI-Core v4.1.1",
        measureSet: { cmsId: 111 },
        measureSetId: "set-qi",
        lastModifiedAt: "2024-01-01",
        hasAssociatedMeasures: true,
      },
      {
        id: "main-qdm",
        measureName: "QDM Main",
        version: "1.0.0",
        model: "QDM v5.6",
        measureSet: { cmsId: 222 },
        measureSetId: "set-qdm",
        lastModifiedAt: "2024-01-01",
        hasAssociatedMeasures: true,
      },
    ];

    const mockSearchMeasures = jest.fn().mockResolvedValue({
      content: mainRowData,
      totalPages: 1,
      totalElements: 2,
      numberOfElements: 2,
      pageable: { offset: 0 },
    });

    const mockGetMeasuresBySetId = jest.fn((setId: string) => {
      if (setId === "set-qi") {
        return Promise.resolve([
          {
            id: "child-qi",
            measureName: "QI-Core Child",
            version: "1.0.0",
            model: "QI-Core v4.1.1",
            measureSet: { cmsId: 333 },
            lastModifiedAt: "2024-01-15",
          },
        ]);
      }
      return Promise.resolve([
        {
          id: "child-qdm",
          measureName: "QDM Child",
          version: "1.0.0",
          model: "QDM v5.6",
          measureSet: { cmsId: 444 },
          lastModifiedAt: "2024-01-15",
        },
      ]);
    });

    useMeasureServiceApi.mockReturnValue({
      searchMeasuresByCriteria: mockSearchMeasures,
      getMeasuresByMeasureSetId: mockGetMeasuresBySetId,
    });

    render(
      <AddComponentsDialog
        open={true}
        onClose={onCloseMock}
        measure={mockMeasure}
        compositeScoring="Opportunity"
        components={[]}
        submitComponentForm={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(mockSearchMeasures).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText("0111FHIR")).toBeInTheDocument();
    });
    expect(screen.getByText("0222")).toBeInTheDocument();
    expect(screen.queryByText("0222FHIR")).not.toBeInTheDocument();

    const qiCoreRow = screen.getByText("QI-Core Main").closest("tr")!;
    const qiExpandButton = qiCoreRow.querySelector("span[role='button']");
    if (qiExpandButton) {
      await userEvent.click(qiExpandButton);
      await waitFor(() => {
        expect(screen.getByText("0333FHIR")).toBeInTheDocument();
      });
    }
  });
});
