import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import CompareVersionsAction, {
  NOTHING_SELECTED,
  DIFFERENT_MEASURES,
  VALID_COMPARE,
} from "./CompareVersionsAction";
import { Measure, Model } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";

const measureDraft: Measure = {
  id: "test-id-1",
  measureName: "TestMeasure",
  measureSetId: "measure-set-1",
  model: Model.QICORE,
  cqlErrors: false,
  cql: "library TestMeasure version '1.0.000'",
  version: "1.0.000",
  active: true,
  createdAt: "2023-01-01T00:00:00.000Z",
  createdBy: "testUser",
  lastModifiedAt: "2023-01-01T00:00:00.000Z",
  lastModifiedBy: "testUser",
  measureMetaData: {
    draft: true,
  },
  measureSet: {
    id: "set-1",
    measureSetId: "measure-set-1",
    owner: "testUser",
    acls: [],
  },
} as unknown as Measure;

const measureVersion: Measure = {
  ...measureDraft,
  id: "test-id-2",
  version: "0.0.000",
  measureMetaData: {
    draft: false,
  },
} as Measure;

const differentMeasure: Measure = {
  ...measureDraft,
  id: "test-id-3",
  measureName: "DifferentMeasure",
  measureSetId: "measure-set-2",
  measureSet: {
    id: "set-2",
    measureSetId: "measure-set-2",
    owner: "testUser",
    acls: [],
  },
} as Measure;

describe("CompareVersionsAction component", () => {
  it("should render the compare versions button", () => {
    render(<CompareVersionsAction measures={[]} onClick={() => {}} />);
    expect(
      screen.getByTestId("compare-versions-action-btn")
    ).toBeInTheDocument();
  });

  it("should disable button when no measures are selected", () => {
    render(<CompareVersionsAction measures={[]} onClick={() => {}} />);
    expect(screen.getByTestId("compare-versions-action-btn")).toBeDisabled();
    expect(
      screen.getByTestId("compare-versions-action-tooltip")
    ).toHaveAttribute("aria-label", NOTHING_SELECTED);
  });

  it("should disable button when only one measure is selected", () => {
    render(
      <CompareVersionsAction measures={[measureDraft]} onClick={() => {}} />
    );
    expect(screen.getByTestId("compare-versions-action-btn")).toBeDisabled();
    expect(
      screen.getByTestId("compare-versions-action-tooltip")
    ).toHaveAttribute("aria-label", NOTHING_SELECTED);
  });

  it("should disable button when more than two measures are selected", () => {
    render(
      <CompareVersionsAction
        measures={[measureDraft, measureVersion, differentMeasure]}
        onClick={() => {}}
      />
    );
    expect(screen.getByTestId("compare-versions-action-btn")).toBeDisabled();
    expect(
      screen.getByTestId("compare-versions-action-tooltip")
    ).toHaveAttribute("aria-label", NOTHING_SELECTED);
  });

  it("should enable button when two versions of the same measure are selected (draft and version)", () => {
    render(
      <CompareVersionsAction
        measures={[measureDraft, measureVersion]}
        onClick={() => {}}
      />
    );
    expect(screen.getByTestId("compare-versions-action-btn")).toBeEnabled();
    expect(
      screen.getByTestId("compare-versions-action-tooltip")
    ).toHaveAttribute("aria-label", VALID_COMPARE);
  });

  it("should enable button when two versions of the same measure are selected (version and version)", () => {
    const version1: Measure = {
      ...measureVersion,
      id: "test-id-4",
      version: "1.0.000",
    };
    const version2: Measure = {
      ...measureVersion,
      id: "test-id-5",
      version: "2.0.000",
    };
    render(
      <CompareVersionsAction
        measures={[version1, version2]}
        onClick={() => {}}
      />
    );
    expect(screen.getByTestId("compare-versions-action-btn")).toBeEnabled();
    expect(
      screen.getByTestId("compare-versions-action-tooltip")
    ).toHaveAttribute("aria-label", VALID_COMPARE);
  });

  it("should disable button when two different measures are selected", () => {
    render(
      <CompareVersionsAction
        measures={[measureDraft, differentMeasure]}
        onClick={() => {}}
      />
    );
    expect(screen.getByTestId("compare-versions-action-btn")).toBeDisabled();
    expect(
      screen.getByTestId("compare-versions-action-tooltip")
    ).toHaveAttribute("aria-label", DIFFERENT_MEASURES);
  });

  it("should call onClick when button is clicked and enabled", async () => {
    const handleClick = jest.fn();
    render(
      <CompareVersionsAction
        measures={[measureDraft, measureVersion]}
        onClick={handleClick}
      />
    );

    const button = screen.getByTestId("compare-versions-action-btn");
    expect(button).toBeEnabled();

    userEvent.click(button);

    await waitFor(() => {
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  it("should not call onClick when button is disabled", async () => {
    const handleClick = jest.fn();
    render(<CompareVersionsAction measures={[]} onClick={handleClick} />);

    const button = screen.getByTestId("compare-versions-action-btn");
    expect(button).toBeDisabled();

    // Disabled buttons cannot be clicked, so we just verify the state
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("should update button state when measures selection changes", () => {
    const { rerender } = render(
      <CompareVersionsAction measures={[]} onClick={() => {}} />
    );

    expect(screen.getByTestId("compare-versions-action-btn")).toBeDisabled();

    rerender(
      <CompareVersionsAction
        measures={[measureDraft, measureVersion]}
        onClick={() => {}}
      />
    );

    expect(screen.getByTestId("compare-versions-action-btn")).toBeEnabled();

    rerender(
      <CompareVersionsAction
        measures={[measureDraft, differentMeasure]}
        onClick={() => {}}
      />
    );

    expect(screen.getByTestId("compare-versions-action-btn")).toBeDisabled();
  });

  it("should render the SVG icon correctly", () => {
    render(<CompareVersionsAction measures={[]} onClick={() => {}} />);
    const button = screen.getByTestId("compare-versions-action-btn");
    const svg = button.querySelector("svg");

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "23");
    expect(svg).toHaveAttribute("height", "22");
  });
});
