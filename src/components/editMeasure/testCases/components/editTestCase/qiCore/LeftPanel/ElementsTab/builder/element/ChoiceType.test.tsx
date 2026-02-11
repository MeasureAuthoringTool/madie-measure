import * as React from "react";
import { render, screen, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik } from "formik";
import ChoiceType from "./ChoiceType";
import { upperFirst } from "lodash";

// Mock dependencies
jest.mock("./TypeEditor", () => (props: any) => (
  <div data-testid="type-editor">TypeEditor {props.label}</div>
));

const getChildDef = (overrides = {}) => ({
  id: "Observation.component[0].value[x]",
  path: "Observation.component[0].value[x]",
  min: 0,
  max: "1",
  type: [{ code: "string" }, { code: "boolean" }, { code: "integer" }],
  ...overrides,
});

const getFormikValues = (type: string = "boolean", value: any = undefined) => ({
  Observation: { component: [{ [`value${upperFirst(type)}`]: value }] },
});

const renderWithFormik = (props: any, formikValues: any = {}) =>
  render(
    <Formik initialValues={formikValues} onSubmit={jest.fn()}>
      <ChoiceType {...props} />
    </Formik>
  );

describe("ChoiceType", () => {
  beforeAll(() => {
    // Suppress Material-UI warnings in test output
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("renders select with choice type options", async () => {
    renderWithFormik(
      {
        childDef: getChildDef(),
        label: "Observation.component[0]",
        canEdit: true,
      },
      getFormikValues()
    );

    const select = await screen.findByRole("combobox");
    act(async () => {
      userEvent.click(select);
    });

    const listbox = screen.getByRole("listbox");
    expect(within(listbox).getByText("String")).toBeInTheDocument();
    expect(within(listbox).getByText("Boolean")).toBeInTheDocument();
    expect(within(listbox).getByText("Integer")).toBeInTheDocument();
  });

  it("initializes with first type when no value exists", async () => {
    renderWithFormik(
      {
        childDef: getChildDef(),
        label: "Observation.component[0].value[x]",
        canEdit: true,
      },
      {}
    );

    expect(screen.getByRole("combobox")).toHaveTextContent("String");
    expect(screen.getByTestId("type-editor")).toHaveTextContent(
      "TypeEditor Observation.component[0].valueString"
    );
  });

  it("selects correct type based on existing formik value", async () => {
    await act(async () => {
      renderWithFormik(
        {
          childDef: getChildDef(),
          label: "Observation.component[0].value[x]",
          canEdit: true,
        },
        getFormikValues("boolean", true)
      );
    });

    expect(screen.getByRole("combobox")).toHaveTextContent("Boolean");
    expect(screen.getByTestId("type-editor")).toHaveTextContent(
      "TypeEditor Observation.component[0].valueBoolean"
    );
  });

  it("changes type and updates formik values accordingly", async () => {
    renderWithFormik(
      {
        childDef: getChildDef(),
        label: "Observation.component[0].value[x]",
        canEdit: true,
      },
      getFormikValues("boolean", true)
    );

    const select = screen.getByRole("combobox");
    await act(async () => {
      await userEvent.click(select);
    });

    const listbox = screen.getByRole("listbox");
    const stringType = within(listbox).getByText("String");
    await act(async () => {
      await userEvent.click(stringType);
    });

    expect(screen.getByRole("combobox")).toHaveTextContent("String");
    expect(screen.getByTestId("type-editor")).toHaveTextContent(
      "TypeEditor Observation.component[0].valueString"
    );
  });

  // this test fails often when not in isolation. Need to use async waits since the data is changing.
  it("disables select when canEdit is false", async () => {
    renderWithFormik(
      {
        childDef: getChildDef(),
        label: "Observation.component[0].value[x]",
        canEdit: false,
      },
      getFormikValues()
    );

    // When canEdit is false, the select is rendered as a readonly textarea
    const select = await screen.findByTestId(
      "choice-type-Observation.component[0].valueBoolean"
    );
    expect(select).toHaveAttribute("readonly");
  });
});
