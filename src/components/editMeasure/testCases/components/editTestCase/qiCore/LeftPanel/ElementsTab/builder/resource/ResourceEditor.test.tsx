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

describe("ResourceEditor", () => {
  const mockOnCancel = jest.fn();
  it("renders the ResourceEditor correctly", async () => {
    render(
      <QiCoreResourceProvider>
        <ResourceEditor
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
    });
  });
});
