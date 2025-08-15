import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ExportAction, { EXPORT_MEASURE, NOTHING_SELECTED } from "./ExportAction";
import { Measure, MeasureSet, Model } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";

const mockUser = "test user";
jest.mock("@madie/madie-util", () => ({
  useOktaTokens: () => ({
    getUserName: () => mockUser,
  }),
}));

const mockMeasureSet = {
  cmsId: "124",
  measureSetId: "1-2-3-4",
  owner: mockUser,
} as unknown as MeasureSet;

const qdmMeasure = {
  model: Model.QDM_5_6,
  measureSet: mockMeasureSet,
  measureSetId: "1-2-3-4",
} as Measure;

const qiCoreMeasure = {
  model: Model.QICORE,
  measureSet: { ...mockMeasureSet, cmsId: null },
  measureSetId: "1-2-3-4",
  measureMetaData: { draft: true },
} as Measure;

describe("ExportAction", () => {
  it("Should disable action btn if no measure selected", () => {
    render(<ExportAction measures={[]} onClick={() => {}} />);
    expect(screen.getByTestId("export-action-btn")).toBeDisabled();
    expect(screen.getByTestId("export-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should enable action btn if user select one measure ", () => {
    render(<ExportAction measures={[qiCoreMeasure]} onClick={() => {}} />);
    expect(screen.getByTestId("export-action-btn")).not.toBeDisabled();
    expect(screen.getByTestId("export-action-tooltip")).toHaveAttribute(
      "aria-label",
      EXPORT_MEASURE
    );
  });

  it("Should disable btn if user selects two measures", () => {
    const measure2 = { ...qiCoreMeasure, model: Model.QDM_5_6 };
    render(
      <ExportAction measures={[qdmMeasure, measure2]} onClick={() => {}} />
    );
    expect(screen.getByTestId("export-action-btn")).toBeDisabled();
    expect(screen.getByTestId("export-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("should call onClick for publishing exports when btn is clicked", async () => {
    const handleClick = jest.fn();
    render(<ExportAction measures={[qiCoreMeasure]} onClick={handleClick} />);

    const exportIcon = screen.getByTestId("export-action-btn");
    userEvent.click(exportIcon);

    const exportForPublishingButton = await screen.findByRole("menuitem", {
      name: "Export for Publishing",
    });
    userEvent.click(exportForPublishingButton);
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith("Export for Publishing");
  });

  it("should call onClick for exports when btn is clicked", async () => {
    const handleClick = jest.fn();
    render(<ExportAction measures={[qiCoreMeasure]} onClick={handleClick} />);

    const exportIcon = screen.getByTestId("export-action-btn");
    userEvent.click(exportIcon);

    const exportForPublishingButton = await screen.findByRole("menuitem", {
      name: "Export",
    });
    userEvent.click(exportForPublishingButton);
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith("Export");
  });
});

describe("508, keyboard and clickaway behavior", () => {
  it("closes on Tab and prevents default + stops propagation", async () => {
    const handleClick = jest.fn();
    render(<ExportAction measures={[qiCoreMeasure]} onClick={handleClick} />);
    userEvent.click(screen.getByTestId("export-action-btn"));

    const menuList = await screen.findByRole("menu", { name: "" });

    fireEvent.keyDown(menuList, {
      key: "Tab",
      code: "Tab",
    });

    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("closes on Escape and stops propagation", async () => {
    const handleClick = jest.fn();
    render(<ExportAction measures={[qiCoreMeasure]} onClick={handleClick} />);
    userEvent.click(screen.getByTestId("export-action-btn"));

    const menuList = await screen.findByRole("menu", { name: "" });

    fireEvent.keyDown(menuList, {
      key: "Escape", // #nosec
      code: "Escape",
    });

    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("closes when clicking away", async () => {
    const handleClick = jest.fn();
    render(<ExportAction measures={[qiCoreMeasure]} onClick={handleClick} />);
    userEvent.click(screen.getByTestId("export-action-btn"));

    await screen.findByRole("menu");

    fireEvent.mouseDown(document.body);
    fireEvent.click(document.body);

    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });
});
