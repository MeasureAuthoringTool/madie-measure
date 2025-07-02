import React from "react";
import {
  render,
  fireEvent,
  screen,
  waitFor,
  within,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik } from "formik";
import ChoiceType from "./ChoiceType";
//import { extractNameWithoutIndex } from "../../../../../../../api/fhirDefinitionServiceUtilities";

// Mock dependencies
jest.mock("./TypeEditor", () => (props: any) => (
  <div data-testid="type-editor">Widget {props.label}</div>
));

// Minimal mock type for ElementDefinition
type ElementDefinition = { id?: string };
const mockExtract = jest.fn();

jest.mock("../../../../../../../api/fhirDefinitionServiceUtilities", () => ({
  extractNameWithoutIndex: jest.fn((childDef, _a, _b) => {
    mockExtract();
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
  it("renders label and select with options", async () => {
    renderWithFormik(
      {
        childDef: getChildDef(),
        label: "Patient.deceased[x]",
        canEdit: true,
      },
      getFormikValues()
    );
    expect(screen.getByText("Patient.deceased[x]")).toBeInTheDocument();
    const choiceTypeSelect = screen.getByTestId("choice-type");
    expect(choiceTypeSelect).toBeInTheDocument();
    fireEvent.mouseDown(choiceTypeSelect);

    const booleanSelection = screen.getByText("Boolean");
    userEvent.click(booleanSelection);
    const booleanOption = await screen.getByTestId("boolean-option");
    const stringOption = await screen.getByTestId("string-option");
    expect(booleanOption).toBeInTheDocument();
    expect(stringOption).toBeInTheDocument();
    act(() => {
      fireEvent.click(booleanOption);
      fireEvent.click(stringOption);
    });

    expect(mockExtract).toHaveBeenCalledTimes(1);
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
