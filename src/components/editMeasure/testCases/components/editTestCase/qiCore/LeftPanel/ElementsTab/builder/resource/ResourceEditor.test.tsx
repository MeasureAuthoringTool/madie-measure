import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import ResourceEditor from "./ResourceEditor";
import { QiCoreResourceProvider } from "../../../../../../../util/QiCorePatientProvider";
import mockSelectedResource from "./mockSelectedResource.json";
import mockTopLevelMetaElements from "./mockTopLeveMetaElements.json";

jest.mock("../../../../../../../api/useFhirDefinitionsService", () => {
  return jest.fn(() => ({
    config: {
      serviceConfig: "fakeServiceConfig",
      accessToken: "fakeAccessToken",
      baseUrl: "fakeurl",
    },
    getResources: jest.fn(() => Promise.resolve([])),
    getResourceTree: jest.fn(() => Promise.resolve(mockTopLevelMetaElements)),
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

const mockFormikObj = {
  touched: {},
  errors: {},
  values: {},
  isSubmitting: false,
  setFieldValue: undefined,
  getFieldProps: () => ({}),
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
describe("ResourceEditor", () => {
  const mockOnCancel = jest.fn();
  it("renders the ResourceEditor correctly", async () => {
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
  });
});
