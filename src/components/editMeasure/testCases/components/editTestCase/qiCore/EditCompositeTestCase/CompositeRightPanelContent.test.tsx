import * as React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Formik, Form } from "formik";

import CompositeRightPanelContent from "./CompositeRightPanelContent";

type RenderOpts = {
  rightPanelActiveTab?: "actual" | "details";
  testCaseCanEdit?: boolean;
  alert?: any;
  seriesState?: any;
  initialTouched?: any;
  initialErrors?: any;
  compositeScoresByGroup?: any[];
};

function renderWithFormik({
  rightPanelActiveTab = "actual",
  testCaseCanEdit = true,
  alert = null,
  seriesState = { series: ["Series A", "Series B"] },
  initialTouched = {},
  initialErrors = {},
  compositeScoresByGroup = [],
}: RenderOpts = {}) {
  const setRightPanelActiveTab = jest.fn();
  const setAlert = jest.fn();

  const utils = render(
    <Formik
      initialValues={{
        title: "My Title",
        description: "My Description",
        series: "Series A",
      }}
      initialTouched={initialTouched}
      initialErrors={initialErrors}
      onSubmit={() => {}}
    >
      <Form>
        <CompositeRightPanelContent
          rightPanelActiveTab={rightPanelActiveTab}
          setRightPanelActiveTab={setRightPanelActiveTab}
          testCaseCanEdit={testCaseCanEdit}
          alert={alert}
          setAlert={setAlert}
          seriesState={seriesState}
          compositeScoresByGroup={compositeScoresByGroup}
        />
      </Form>
    </Formik>
  );

  return { ...utils, setRightPanelActiveTab, setAlert };
}

describe("CompositeRightPanelContent (no module mocks)", () => {
  it("renders dashes on the actual tab when no execution results are available", () => {
    renderWithFormik({
      rightPanelActiveTab: "actual",
      compositeScoresByGroup: [
        { groupId: "1", displayId: "Group_1", scores: {} },
      ],
    });

    expect(
      screen.getByTestId("composite-denominator-score-Group_1")
    ).toHaveTextContent("Denominator Score: -");
    expect(
      screen.getByTestId("composite-numerator-score-Group_1")
    ).toHaveTextContent("Numerator Score: -");
    expect(
      screen.getByTestId("composite-composite-score-Group_1")
    ).toHaveTextContent("Composite Score: -");
  });

  it("renders parsed execution results on the actual tab in denominator, numerator, composite order", () => {
    renderWithFormik({
      rightPanelActiveTab: "actual",
      compositeScoresByGroup: [
        {
          groupId: "1",
          displayId: "Group_1",
          scores: {
            denominatorScore: 4,
            numeratorScore: 2,
            compositeScore: 50,
          },
        },
      ],
    });

    expect(
      screen.getByTestId("composite-denominator-score-Group_1")
    ).toHaveTextContent("Denominator Score: 4");
    expect(
      screen.getByTestId("composite-numerator-score-Group_1")
    ).toHaveTextContent("Numerator Score: 2");
    expect(
      screen.getByTestId("composite-composite-score-Group_1")
    ).toHaveTextContent("Composite Score: 50%");
  });

  it("renders a display id heading for each group when multiple groups are present", () => {
    renderWithFormik({
      rightPanelActiveTab: "actual",
      compositeScoresByGroup: [
        {
          groupId: "1",
          displayId: "Group_1",
          scores: {
            denominatorScore: 4,
            numeratorScore: 2,
            compositeScore: 50,
          },
        },
        {
          groupId: "2",
          displayId: "Group_2",
          scores: {
            denominatorScore: 8,
            numeratorScore: 6,
            compositeScore: 75,
          },
        },
      ],
    });

    // headings only render when there is more than one group
    expect(screen.getByText("Group_1")).toBeInTheDocument();
    expect(screen.getByText("Group_2")).toBeInTheDocument();

    expect(
      screen.getByTestId("composite-composite-score-Group_2")
    ).toHaveTextContent("Composite Score: 75%");
  });

  it("falls back to displayId for the key and renders dashes when a group has no groupId or scores", () => {
    renderWithFormik({
      rightPanelActiveTab: "actual",
      compositeScoresByGroup: [{ displayId: "Group_1" }],
    });

    // no heading because there is a single group
    expect(screen.queryByText("Group_1")).not.toBeInTheDocument();
    expect(
      screen.getByTestId("composite-denominator-score-Group_1")
    ).toHaveTextContent("Denominator Score: -");
    expect(
      screen.getByTestId("composite-numerator-score-Group_1")
    ).toHaveTextContent("Numerator Score: -");
    expect(
      screen.getByTestId("composite-composite-score-Group_1")
    ).toHaveTextContent("Composite Score: -");
  });

  it("updates formik series field when a series option is selected on the details tab", async () => {
    renderWithFormik({ rightPanelActiveTab: "details" });

    const seriesInput = screen
      .getByTestId("test-case-series")
      .querySelector("input") as HTMLInputElement;

    userEvent.click(seriesInput);
    const list = await screen.findByRole("listbox");
    const options = within(list).getAllByRole("option");
    userEvent.click(options[1]);

    await screen.findByTestId("test-case-series");
    expect(seriesInput).toHaveValue("Series B");
  });

  it("renders details tab content (title/description inputs) when rightPanelActiveTab='details'", () => {
    renderWithFormik({ rightPanelActiveTab: "details" });

    expect(screen.getByTestId("test-case-title")).toBeInTheDocument();
    expect(screen.getByTestId("test-case-description")).toBeInTheDocument();

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
  });

  it("sets inputs to readOnly when testCaseCanEdit=false", () => {
    renderWithFormik({
      rightPanelActiveTab: "details",
      testCaseCanEdit: false,
    });

    const tcTitle = document.getElementById("test-case-title");
    expect(tcTitle).toHaveAttribute("readonly");
  });

  it("does not set inputs to readOnly when testCaseCanEdit=true", () => {
    renderWithFormik({ rightPanelActiveTab: "details", testCaseCanEdit: true });

    const titleInput = screen.getByTestId("test-case-title");
    const descInput = screen.getByTestId("test-case-description");

    expect(titleInput).not.toHaveAttribute("readonly");
    expect(descInput).not.toHaveAttribute("readonly");
  });

  it("renders alert when provided and clicking close calls setAlert(null)", () => {
    const { setAlert } = renderWithFormik({
      rightPanelActiveTab: "details",
      alert: { status: "error", message: "Something went wrong" },
    });

    expect(screen.getByTestId("create-test-case-alert")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("close-create-test-case-alert"));
    expect(setAlert).toHaveBeenCalledWith(null);
  });

  it("shows helper text when field is touched and has a formik error (formikErrorHandler returns error string)", () => {
    renderWithFormik({
      rightPanelActiveTab: "details",
      initialTouched: { title: true },
      initialErrors: { title: "Title is required" },
    });

    expect(screen.getByText("Title is required")).toBeInTheDocument();
  });

  it("shows helper text for a touched description error", () => {
    renderWithFormik({
      rightPanelActiveTab: "details",
      initialTouched: { description: true },
      initialErrors: { description: "Description is invalid" },
    });

    expect(screen.getByText("Description is invalid")).toBeInTheDocument();
  });

  it("defaults compositeScoresByGroup to an empty list when the prop is omitted", () => {
    render(
      <Formik
        initialValues={{ title: "", description: "", series: "" }}
        onSubmit={() => {}}
      >
        <Form>
          <CompositeRightPanelContent
            rightPanelActiveTab="actual"
            setRightPanelActiveTab={jest.fn()}
            testCaseCanEdit={true}
            alert={null}
            setAlert={jest.fn()}
            seriesState={{ series: [] }}
          />
        </Form>
      </Formik>
    );

    const actual = screen.getByTestId("composite-actual");
    expect(actual).toBeInTheDocument();
    expect(actual).toBeEmptyDOMElement();
  });
});
