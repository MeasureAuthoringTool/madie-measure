import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import ResourceEditor from "./ResourceEditor";
import { QiCoreResourceContext } from "../../../../../../../util/QiCorePatientProvider";
import mockSelectedResource from "./mockSelectedResource.json";
import mockPatientState from "./mockPatientState.json";
import userEvent from "@testing-library/user-event";

jest.mock("../../../../../../../api/useFhirDefinitionsService", () => {
  return jest.fn(() => ({
    config: {
      serviceConfig: "fakeServiceConfig",
      accessToken: "fakeAccessToken",
      baseUrl: "fakeurl",
    },
  }));
});
jest.mock("../../../../../../../api/fhirDefinitionServiceUtilities", () => {
  const actualModule = jest.requireActual(
    "../../../../../../../api/fhirDefinitionServiceUtilities"
  );
  return {
    ...actualModule,
  };
});

const formikValues = {
  ClaimResponse: {
    id: "test2",
    disposition: "test3",
    widget: ["test4", "test5"],
  },
};

const getProps = (label) => {
  if (label === "ClaimResponse.id") {
    return {
      value: "6fb9d817-76c5-4b68-ba06-92c7429e6b5c",
    };
  } else {
    return {
      value: "test1",
    };
  }
};

const resetForm = jest.fn();
const mockFormikObj = {
  touched: {},
  errors: {},
  values: formikValues,
  isSubmitting: false,
  setFieldValue: undefined,
  getFieldProps: getProps,
  dirty: true,
  resetForm,
};

jest.mock("formik", () => ({
  useFormikContext: () => {
    return mockFormikObj;
  },
  getIn: (context: Record<string, unknown>, fieldName: string) => {
    return context[fieldName];
  },
}));

const { getByText, getByRole } = screen;
describe("ResourceEditor", () => {
  const mockOnCancel = jest.fn();
  it("renders the ResourceEditor correctly, can hit dirty check", async () => {
    const setInitialFormikValuesStu6 = jest.fn();
    const setValidationSchema = jest.fn();
    render(
      <QiCoreResourceContext.Provider
        value={{ state: mockPatientState, dispatch: jest.fn() }}
      >
        <ResourceEditor
          selectedResourceID="6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
          setValidationSchema={setValidationSchema}
          setInitialFormikValuesStu6={setInitialFormikValuesStu6}
          selectedResource={mockSelectedResource}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText("ClaimResponse.id")).toBeInTheDocument();
      const stringInput = screen.getByTestId(
        "string-field-input-ClaimResponse.id"
      );
      expect(stringInput).toBeInTheDocument();
      expect(setValidationSchema).toHaveBeenCalled();
      expect(setInitialFormikValuesStu6).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(
        screen.getByTestId("string-field-input-ClaimResponse.id").value
      ).toBe("6fb9d817-76c5-4b68-ba06-92c7429e6b5c");
    });
    const dispositionButton = screen.getByRole("tab", { name: "disposition" });

    expect(dispositionButton).toBeInTheDocument();
    userEvent.click(dispositionButton);
    const discardDialog = await getByRole("dialog", {
      name: "Discard Changes?",
    });
    expect(discardDialog).toBeInTheDocument();
    // close
    const closeButton = screen.getByRole("button", { name: /close/i });
    userEvent.click(closeButton);
    await waitFor(() => {
      expect(closeButton).not.toBeInTheDocument();
    });
    userEvent.click(dispositionButton);
    await waitFor(() => {
      expect(getByText("Discard Changes?")).toBeInTheDocument();
    });
    // on continue
    userEvent.click(getByText("Yes, Discard All Changes"));
    await waitFor(() => {
      expect(closeButton).not.toBeInTheDocument();
      expect(resetForm).toHaveBeenCalled();
    });
  });
  it("renders the action center for a 0-1 cardinality element, opens when clicked", async () => {
    const setInitialFormikValuesStu6 = jest.fn();
    const setValidationSchema = jest.fn();
    render(
      <QiCoreResourceContext.Provider
        value={{ state: mockPatientState, dispatch: jest.fn() }}
      >
        <ResourceEditor
          selectedResourceID="6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
          setValidationSchema={setValidationSchema}
          setInitialFormikValuesStu6={setInitialFormikValuesStu6}
          selectedResource={mockSelectedResource}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText("ClaimResponse.id")).toBeInTheDocument();

      const stringInput = screen.getByTestId(
        "string-field-input-ClaimResponse.id"
      );
      expect(stringInput).toBeInTheDocument();
      expect(setValidationSchema).toHaveBeenCalled();
      expect(setInitialFormikValuesStu6).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(
        screen.getByTestId("string-field-input-ClaimResponse.id").value
      ).toBe("6fb9d817-76c5-4b68-ba06-92c7429e6b5c");
    });
    const dispositionButton = screen.getByRole("tab", { name: "disposition" });

    expect(dispositionButton).toBeInTheDocument();
    screen.debug();
    const actionCenter = screen.getByTestId(
      "elements-action-center-actual-icon"
    );
    expect(actionCenter).toBeInTheDocument();
    userEvent.click(actionCenter);
    await waitFor(() => {
      expect(screen.queryByTestId("elements-copy")).not.toBeInTheDocument;
      expect(screen.queryByTestId("elements-add")).not.toBeInTheDocument;
      expect(screen.getByTestId("elements-delete")).toBeInTheDocument;
    });
    userEvent.click(actionCenter);
    expect(screen.getByTestId("elements-delete")).not.toBeInTheDocument;
  });

  it("renders the action center for a 0-* cardinality element, opens when clicked", async () => {
    const setInitialFormikValuesStu6 = jest.fn();
    const setValidationSchema = jest.fn();
    render(
      <QiCoreResourceContext.Provider
        value={{ state: mockPatientState, dispatch: jest.fn() }}
      >
        <ResourceEditor
          selectedResourceID="6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
          setValidationSchema={setValidationSchema}
          setInitialFormikValuesStu6={setInitialFormikValuesStu6}
          selectedResource={mockSelectedResource}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText("ClaimResponse.id")).toBeInTheDocument();

      const stringInput = screen.getByTestId(
        "string-field-input-ClaimResponse.id"
      );

      expect(stringInput).toBeInTheDocument();
      expect(setValidationSchema).toHaveBeenCalled();
      expect(setInitialFormikValuesStu6).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(
        screen.getByTestId("string-field-input-ClaimResponse.id").value
      ).toBe("6fb9d817-76c5-4b68-ba06-92c7429e6b5c");
    });

    const widgetButton = screen.getByRole("tab", { name: "widget" });
    expect(widgetButton).toBeInTheDocument();

    act(() => {
      userEvent.click(widgetButton);
    });

    const actionCenter = screen.getByTestId(
      "elements-action-center-actual-icon"
    );
    expect(actionCenter).toBeInTheDocument();
    userEvent.click(actionCenter);

    await waitFor(() => {
      expect(screen.queryByTestId("elements-copy")).toBeInTheDocument;
      expect(screen.queryByTestId("elements-add")).toBeInTheDocument;
      expect(screen.getByTestId("elements-delete")).toBeInTheDocument;
    });
  });
});
