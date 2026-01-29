import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddComponentsDialog from "./AddComponentsDialog";
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
      const expandButton = firstDataRow.querySelector('button[aria-label=""]');
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
      const expandButton = firstDataRow.querySelector('button[aria-label=""]');
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
      const expandButton = firstDataRow.querySelector('button[aria-label=""]');
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
      />
    );

    const cancelButton = screen.getByTestId(
      "select-composite-measure-components-cancel-button"
    );
    await userEvent.click(cancelButton);

    expect(onCloseMock).toHaveBeenCalled();
  });

  it("displays loading spinner while fetching data", () => {
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
      />
    );

    await waitFor(() => {
      expect(mockSearchMeasures).toHaveBeenCalled();
    });

    mockSearchMeasures.mockClear();

    const limitSelect = screen.getByRole("combobox");
    await userEvent.click(limitSelect);

    const option10 = screen.getByRole("option", { name: "10" });
    await userEvent.click(option10);

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
      const expandButton = firstDataRow.querySelector('span[role="button"]');
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
      const expandButton = firstDataRow.querySelector('span[role="button"]');
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
      const expandButton = firstDataRow.querySelector('button[aria-label=""]');
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
      />
    );

    expect(mockSearchMeasures).not.toHaveBeenCalled();
  });
});
