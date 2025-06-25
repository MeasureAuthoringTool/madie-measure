import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { Formik } from "formik";
import ChoiceType from "./ChoiceType";

// Mock dependencies
jest.mock("./TypeEditor", () => (props: any) => (
  <div data-testid="type-editor">{props.label}</div>
));
jest.mock("../../../../../../../api/fhirDefinitionServiceUtilities", () => ({
  extractNameWithoutIndex: jest.fn((childDef, _a, _b) => {
    // Simulate extracting the name without index
    if (childDef && childDef.id) {
      return childDef.id.replace(/\[x\]$/, "");
    }
    return "";
  }),
}));

const getChildDef = (overrides = {}) => ({
  id: "Patient.deceased[x]",
  type: [{ code: "boolean" }, { code: "dateTime" }, { code: "string" }],
  ...overrides,
});

const getFormikValues = (value: any = undefined) => ({
  Patient: {
    deceasedBoolean: value,
  },
});

const renderWithFormik = (props: any, formikValues: any = {}) =>
  render(
    <Formik initialValues={formikValues} onSubmit={jest.fn()}>
      <ChoiceType {...props} />
    </Formik>
  );

describe("ChoiceType", () => {
  it("renders label and select with options", () => {
    renderWithFormik(
      {
        childDef: getChildDef(),
        label: "Patient.deceased[x]",
        canEdit: true,
      },
      getFormikValues()
    );
    expect(screen.getByText("Patient.deceased[x]")).toBeInTheDocument();
    expect(screen.getByTestId("choice-type")).toBeInTheDocument();
    expect(screen.getByTestId("choice-type-input")).toBeInTheDocument();
  });

  it("selects the correct type based on formik values", () => {
    renderWithFormik(
      {
        childDef: getChildDef(),
        label: "Patient.deceased[x]",
        canEdit: true,
      },
      {
        Patient: {
          deceasedBoolean: true,
        },
      }
    );
  });

  it("does not render TypeEditor if no type is selected", () => {
    renderWithFormik(
      {
        childDef: getChildDef({ type: [] }),
        label: "Patient.deceased[x]",
        canEdit: true,
      },
      getFormikValues()
    );
    expect(screen.queryByTestId("type-editor")).not.toBeInTheDocument();
  });
});
