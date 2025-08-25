import * as React from "react";
import { render, screen } from "@testing-library/react";
import { Measure, MeasureSet, Model } from "@madie/madie-models";
import HistoryAction, {
  NOTHING_SELECTED,
  VALID_HISTORY_MEASURE,
} from "./HistoryAction";
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
} as unknown as Measure;

describe("HistoryAction", () => {
  it("Should disable history action btn if no measure selected", () => {
    render(<HistoryAction measures={[]} onClick={() => {}} />);
    expect(screen.getByTestId("history-action-btn")).toBeDisabled();
    expect(screen.getByTestId("history-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should enable history action btn if user selects one measure", () => {
    render(<HistoryAction measures={[qiCoreMeasure]} onClick={() => {}} />);
    expect(screen.getByTestId("history-action-btn")).not.toBeDisabled();
    expect(screen.getByTestId("history-action-tooltip")).toHaveAttribute(
      "aria-label",
      VALID_HISTORY_MEASURE
    );
  });

  it("Should disable history action btn if user selects multiple measures", () => {
    const measure2 = { ...qiCoreMeasure, model: Model.QDM_5_6 };
    render(
      <HistoryAction measures={[qdmMeasure, measure2]} onClick={() => {}} />
    );
    expect(screen.getByTestId("history-action-btn")).toBeDisabled();
    expect(screen.getByTestId("history-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should call onClick when the history action btn is clicked", async () => {
    const onClick = jest.fn();
    render(<HistoryAction measures={[qiCoreMeasure]} onClick={onClick} />);
    const historyButton = screen.getByTestId("history-action-btn");

    expect(historyButton).not.toBeDisabled();
    expect(screen.getByTestId("history-action-tooltip")).toHaveAttribute(
      "aria-label",
      VALID_HISTORY_MEASURE
    );

    userEvent.click(historyButton);
    expect(onClick).toHaveBeenCalled();
  });
});
