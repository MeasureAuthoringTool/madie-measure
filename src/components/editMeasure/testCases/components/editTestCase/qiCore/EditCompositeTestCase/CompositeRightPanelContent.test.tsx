import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
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
};

function renderWithFormik({
  rightPanelActiveTab = "actual",
  testCaseCanEdit = true,
  alert = null,
  seriesState = { series: ["Series A", "Series B"] },
  initialTouched = {},
  initialErrors = {},
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
        />
      </Form>
    </Formik>
  );

  return { ...utils, setRightPanelActiveTab, setAlert };
}

describe("CompositeRightPanelContent (no module mocks)", () => {
  it("renders actual tab content when rightPanelActiveTab='actual'", () => {
    renderWithFormik({ rightPanelActiveTab: "actual" });

    expect(
      screen.getByText("Composite actual results in progress...")
    ).toBeInTheDocument();
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
});
