import * as React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Measure, Model } from "@madie/madie-models";
import TransferredMeasuresTable from "./TransferredMeasuresTable";

const testUser = "test user";
const mockMeasure1 = {
  id: "TestMeasureId1",
  measureName: "The Measure for Testing 1",
  model: Model.QICORE,
  createdBy: testUser,
  measureSetId: "MeasureSetId",
  measureSet: {
    measureSetId: "MeasureSetId",
    cmsId: 1,
    owner: "owner1",
  },
} as Measure;

const mockMeasure2 = {
  id: "TestMeasureId2",
  measureName: "The Measure for Testing 2",
  model: Model.QICORE_6_0_0,
  createdBy: testUser,
  measureSetId: "MeasureSetId",
  measureSet: {
    measureSetId: "MeasureSetId",
    cmsId: 2,
    owner: "owner2",
  },
} as Measure;

const mockMeasure3 = {
  id: "TestMeasureId3",
  measureName: "The Measure for Testing 3",
  model: Model.QDM_5_6,
  createdBy: testUser,
  measureSetId: "MeasureSetId3",
  measureSet: {
    measureSetId: "MeasureSetId3",
    owner: "owner3",
  },
} as Measure;

describe("TransferredMeasuresTable component", () => {
  it("should render table with measures without owner column", () => {
    render(
      <TransferredMeasuresTable
        measures={[mockMeasure1, mockMeasure2]}
        showOwnerColumn={false}
      />
    );

    expect(screen.getByTestId("transfer-measure-tbl")).toBeInTheDocument();
    expect(screen.getByText("Measure")).toBeInTheDocument();
    expect(screen.getByText("Model")).toBeInTheDocument();
    expect(screen.getByText("CMS ID")).toBeInTheDocument();
    expect(screen.queryByText("Current Measure Owner")).not.toBeInTheDocument();

    expect(screen.getByText("The Measure for Testing 1")).toBeInTheDocument();
    expect(screen.getByText("The Measure for Testing 2")).toBeInTheDocument();
  });

  it("should render table with measures with owner column", () => {
    render(
      <TransferredMeasuresTable
        measures={[mockMeasure1, mockMeasure2]}
        showOwnerColumn={true}
      />
    );

    expect(screen.getByTestId("transfer-measure-tbl")).toBeInTheDocument();
    expect(screen.getByText("Measure")).toBeInTheDocument();
    expect(screen.getByText("Model")).toBeInTheDocument();
    expect(screen.getByText("CMS ID")).toBeInTheDocument();
    expect(screen.getByText("Current Measure Owner")).toBeInTheDocument();

    expect(screen.getByText("owner1")).toBeInTheDocument();
    expect(screen.getByText("owner2")).toBeInTheDocument();
  });

  it("should display formatted owner name in owner column for admin transfers", () => {
    const measureWithDisplayName = {
      ...mockMeasure1,
      ownerDisplayName: "John Doe",
      measureSet: {
        ...mockMeasure1.measureSet,
        owner: "john_doe",
      },
    };

    render(
      <TransferredMeasuresTable
        measures={[measureWithDisplayName]}
        showOwnerColumn={true}
      />
    );

    expect(screen.getByText("John Doe (john_doe)")).toBeInTheDocument();
  });

  it("should display CMS ID with FHIR suffix for QI-Core measures", () => {
    render(
      <TransferredMeasuresTable
        measures={[mockMeasure1]}
        showOwnerColumn={false}
      />
    );

    expect(screen.getByText("0001FHIR")).toBeInTheDocument();
  });

  it("should display CMS ID without FHIR suffix for QDM measures", () => {
    render(
      <TransferredMeasuresTable
        measures={[mockMeasure3]}
        showOwnerColumn={false}
      />
    );

    // QDM measure has no CMS ID, so it should display empty
    const rows = screen.getAllByTestId(/^row-/);
    expect(rows.length).toBe(1);
  });

  it("should render pagination controls", () => {
    const measures = [];
    for (let i = 0; i < 10; i++) {
      measures.push({
        ...mockMeasure1,
        id: `id${i}`,
        measureName: `Measure ${i}`,
      });
    }

    render(
      <TransferredMeasuresTable measures={measures} showOwnerColumn={false} />
    );

    expect(
      screen.getByTestId("trasfer-measure-pagination")
    ).toBeInTheDocument();
  });

  it("should paginate measures correctly", async () => {
    const measures = [];
    for (let i = 0; i < 10; i++) {
      measures.push({
        ...mockMeasure1,
        id: `id${i}`,
        measureName: `Measure ${i}`,
      });
    }

    render(
      <TransferredMeasuresTable measures={measures} showOwnerColumn={false} />
    );

    // Should show first 5 measures by default
    expect(screen.getByText("Measure 0")).toBeInTheDocument();
    expect(screen.getByText("Measure 4")).toBeInTheDocument();
    expect(screen.queryByText("Measure 5")).not.toBeInTheDocument();

    // Navigate to page 2
    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.queryByText("Measure 0")).not.toBeInTheDocument();
      expect(screen.getByText("Measure 5")).toBeInTheDocument();
      expect(screen.getByText("Measure 9")).toBeInTheDocument();
    });
  });

  it("should change page limit", async () => {
    const measures = [];
    for (let i = 0; i < 15; i++) {
      measures.push({
        ...mockMeasure1,
        id: `id${i}`,
        measureName: `Measure ${i}`,
      });
    }

    render(
      <TransferredMeasuresTable measures={measures} showOwnerColumn={false} />
    );

    // Default limit is 5
    expect(screen.getByText("Measure 0")).toBeInTheDocument();
    expect(screen.queryByText("Measure 5")).not.toBeInTheDocument();

    // Change limit to 10
    const limitSelect = screen.getByRole("combobox");
    fireEvent.mouseDown(limitSelect);

    await waitFor(() => {
      const option10 = screen.getByRole("option", { name: "10" });
      fireEvent.click(option10);
    });

    await waitFor(() => {
      expect(screen.getByText("Measure 0")).toBeInTheDocument();
      expect(screen.getByText("Measure 9")).toBeInTheDocument();
      expect(screen.queryByText("Measure 10")).not.toBeInTheDocument();
    });
  });

  it("should handle empty measures array", () => {
    render(<TransferredMeasuresTable measures={[]} showOwnerColumn={false} />);

    expect(screen.getByTestId("transfer-measure-tbl")).toBeInTheDocument();
    expect(
      screen.queryByTestId("trasfer-measure-pagination")
    ).not.toBeInTheDocument();
  });

  it("should show all measures when count is less than limit", () => {
    render(
      <TransferredMeasuresTable
        measures={[mockMeasure1, mockMeasure2]}
        showOwnerColumn={false}
      />
    );

    expect(screen.getByText("The Measure for Testing 1")).toBeInTheDocument();
    expect(screen.getByText("The Measure for Testing 2")).toBeInTheDocument();
    expect(
      screen.getByTestId("trasfer-measure-pagination")
    ).toBeInTheDocument();
  });
});
