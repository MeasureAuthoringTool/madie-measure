import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import ResourceEditor from "./ResourceEditor";
import { QiCoreResourceProvider } from "../../../../../../../util/QiCorePatientProvider";
import mockSelectedResource from "./mockSelectedResource.json";
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
const resetForm = jest.fn();
const mockFormikObj = {
  touched: {},
  errors: {},
  values: {},
  isSubmitting: false,
  setFieldValue: undefined,
  getFieldProps: () => ({}),
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

beforeEach(() => {
  mockFormikObj.touched = {};
  mockFormikObj.errors = {};
  mockFormikObj.values = {};
  mockFormikObj.isSubmitting = false;
  mockFormikObj.setFieldValue = undefined;
});
const { getByText, getByRole } = screen;
describe("ResourceEditor", () => {
  const mockOnCancel = jest.fn();
  it("renders the ResourceEditor correctly, can hit dirty check", async () => {
    const setInitialFormikValuesStu6 = jest.fn();
    const setValidationSchema = jest.fn();
    render(
      <QiCoreResourceProvider>
        <ResourceEditor
          setValidationSchema={setValidationSchema}
          setInitialFormikValuesStu6={setInitialFormikValuesStu6}
          selectedResource={mockSelectedResource}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("ClaimResponse.id")).toBeInTheDocument();
      const stringInput = screen.getByTestId(
        "string-field-input-ClaimResponse.id"
      );
      expect(stringInput).toBeInTheDocument();
      expect(stringInput.value).toBe("6fb9d817-76c5-4b68-ba06-92c7429e6b5c");
      expect(setValidationSchema).toHaveBeenCalled();
      expect(setInitialFormikValuesStu6).toHaveBeenCalled();
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
});
