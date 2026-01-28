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
    const mockSearchMeasures = jest.fn().mockResolvedValue({
      content: [],
      totalPages: 0,
      totalElements: 0,
      numberOfElements: 0,
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
    const mockSearchMeasures = jest.fn().mockResolvedValue({
      content: [],
      totalPages: 0,
      totalElements: 0,
      numberOfElements: 0,
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
    const mockSearchMeasures = jest.fn().mockResolvedValue({
      content: [],
      totalPages: 0,
      totalElements: 0,
      numberOfElements: 0,
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
});
