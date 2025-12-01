import "@testing-library/jest-dom";
import * as React from "react";
import { screen, render, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Route, Routes } from "react-router-dom";
import MeasureDetails from "./MeasureDetails";
import { ApiContextProvider, ServiceConfig } from "../../../api/ServiceContext";
import MeasureInformation from "./measureInformation/MeasureInformation";
import MeasureMetadata from "./measureMetadata/MeasureMetadata";
import { Measure } from "@madie/madie-models";
// @ts-ignore
import {
  measureStore,
  useFeatureFlags,
  MeasureServiceApi,
} from "@madie/madie-util";

const measure = {
  id: "1",
  measureName: "measure",
  cqlLibraryName: "TestLibrary",
  model: "QDM v5.6",
  ecqmTitle: "ecqmTitle",
  measurementPeriodStart: "01/01/2022",
  measurementPeriodEnd: "12/02/2022",
  measureMetaData: {
    steward: {
      id: "id",
      name: "name",
      oid: "oid",
      url: "url",
    },
    developers: [
      {
        id: "id",
        name: "name",
        oid: "oid",
        url: "url",
      },
    ],
    description: "description",
    copyright: "copyright",
    disclaimer: "disclaimer",
    rationale: "rationale",
    purpose: "test purpose",
    guidance: "test",
    clinicalRecommendation: "clinicalRecommendation",
    draft: true,
    references: [
      {
        id: "id",
        referenceText: "referenceText",
        referenceType: "referenceType",
      },
    ],
    endorsements: [
      {
        endorser: "",
        endorserSystemId: null,
        endorsementId: "",
      },
    ],
    definition: "definition",
    experimental: null,
    transmissionFormat: "transmissionFormat",
    measureSetTitle: "measureSetTitle",
    cqlMetaData: {
      codeSystemMap: {},
    },
    measureDefinitions: [
      {
        id: "def1",
        term: "term 1",
        definition: "definition 1",
      },
    ],
  },
} as unknown as Measure;

const incompletedIconMeasure = {
  id: "2",
  model: "QDM v5.6",
  measureMetaData: {
    draft: true,
    references: [],
    endorsements: [
      {
        endorser: "",
        endorserSystemId: null,
        endorsementId: "",
      },
    ],
    experimental: null,
    cqlMetaData: {
      codeSystemMap: {},
    },
  },
} as unknown as Measure;

const mockUseFeatureFlags = jest.fn(() => ({
  Locking: false,
}));

const mockMeasureServiceApi: MeasureServiceApi = {
  unlockMeasure: jest.fn(),
  updateMeasureLock: jest.fn(),
} as unknown as MeasureServiceApi;

jest.mock("./measureInformation/MeasureInformation");
jest.mock("./measureMetadata/MeasureMetadata");
jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
  useDocumentTitle: jest.fn(),
  useFeatureFlags: jest.fn(() => mockUseFeatureFlags()),
  measureStore: {
    updateMeasure: (measure) => measure,
    state: jest.fn().mockImplementation(() => measure),
    initialState: jest.fn().mockImplementation(() => measure),
    subscribe: (set) => {
      return { unsubscribe: () => null };
    },
  },
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
  }),
  routeHandlerStore: {
    subscribe: (set) => {
      set({ canTravel: false, pendingPath: "" });
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: () => null,
    state: { canTravel: false, pendingPath: "" },
    initialState: { canTravel: false, pendingPath: "" },
  },
}));

const MeasureInformationMock = MeasureInformation as jest.Mock<JSX.Element>;
const MeasureMetadataMock = MeasureMetadata as jest.Mock<JSX.Element>;
const setErrorMessage = jest.fn();

MeasureInformationMock.mockImplementation(() => {
  return <div>Mock Measure Info</div>;
});

MeasureMetadataMock.mockImplementation(() => {
  return <div>Mock Measure Metadata</div>;
});

const serviceConfig = {
  measureService: {
    baseUrl: "base.url",
  },
  elmTranslationService: {
    baseUrl: "base.url",
  },
  terminologyService: {
    baseUrl: "base.url",
  },
} as unknown as ServiceConfig;

const { getByText, getByTestId } = screen;

describe("MeasureDetails component", () => {
  it("should render the MeasureInformation component for default URL", () => {
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={[{ pathname: "/foo" }]}>
          <Routes>
            <Route
              path="/foo"
              element={
                <MeasureDetails
                  setErrorMessage={setErrorMessage}
                  isQDM={false}
                  featureFlags={mockUseFeatureFlags()}
                  measureCanEdit={false}
                  measureLockedBy=""
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </ApiContextProvider>
    );
    expect(getByText("Mock Measure Info")).toBeTruthy();
  });

  it("should render the model and measurement component for the URL", () => {
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter
          initialEntries={[{ pathname: "/foo/model&measurement-period" }]}
        >
          <Routes>
            <Route
              path="/foo/*"
              element={
                <MeasureDetails
                  setErrorMessage={setErrorMessage}
                  featureFlags={mockUseFeatureFlags()}
                  isQDM={false}
                  measureCanEdit={false}
                  measureLockedBy=""
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </ApiContextProvider>
    );
    expect(getByTestId("model-measurement-form")).toBeInTheDocument();
  });

  it("should render the MeasureMetadata component for measure-description URL", () => {
    const { getByText, getByTestId } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter
          initialEntries={[{ pathname: "/foo/measure-description" }]}
        >
          <Routes>
            <Route
              path="/foo/*"
              element={
                <MeasureDetails
                  setErrorMessage={setErrorMessage}
                  featureFlags={mockUseFeatureFlags()}
                  isQDM={false}
                  measureCanEdit={false}
                  measureLockedBy=""
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </ApiContextProvider>
    );

    expect(getByText("Mock Measure Metadata")).toBeTruthy();
    expect(getByTestId("leftPanelMeasureInformation")).toBeInTheDocument();
    expect(
      getByTestId("leftPanelModelAndMeasurementPeriod")
    ).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureSteward")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureDescription")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureDisclaimer")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureRationale")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureGuidance")).toBeInTheDocument();
  });

  it("should render the MeasureMetadata component for measure-copyright URL", () => {
    const { getByText, getByTestId } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={[{ pathname: "/foo/measure-copyright" }]}>
          <Routes>
            <Route
              path="/foo/*"
              element={
                <MeasureDetails
                  setErrorMessage={setErrorMessage}
                  featureFlags={mockUseFeatureFlags()}
                  isQDM={false}
                  measureCanEdit={false}
                  measureLockedBy=""
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </ApiContextProvider>
    );

    expect(getByText("Mock Measure Metadata")).toBeTruthy();
    expect(getByTestId("leftPanelMeasureInformation")).toBeInTheDocument();
    expect(
      getByTestId("leftPanelModelAndMeasurementPeriod")
    ).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureSteward")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureDescription")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureDisclaimer")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureRationale")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureGuidance")).toBeInTheDocument();
  });

  it("should render the MeasureMetadata component for measure-disclaimer URL", () => {
    const { getByText, getByTestId } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter
          initialEntries={[{ pathname: "/foo/measure-disclaimer" }]}
        >
          <Routes>
            <Route
              path="/foo/*"
              element={
                <MeasureDetails
                  setErrorMessage={setErrorMessage}
                  featureFlags={mockUseFeatureFlags()}
                  isQDM={false}
                  measureCanEdit={false}
                  measureLockedBy=""
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </ApiContextProvider>
    );

    expect(getByText("Mock Measure Metadata")).toBeTruthy();
    expect(getByTestId("leftPanelMeasureInformation")).toBeInTheDocument();
    expect(
      getByTestId("leftPanelModelAndMeasurementPeriod")
    ).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureSteward")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureDescription")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureDisclaimer")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureRationale")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureGuidance")).toBeInTheDocument();
  });

  it("should render the MeasureRationale component for measure-rationale URL", () => {
    const { getByText, getByTestId } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={[{ pathname: "/foo/measure-rationale" }]}>
          <Routes>
            <Route
              path="/foo/*"
              element={
                <MeasureDetails
                  setErrorMessage={setErrorMessage}
                  featureFlags={mockUseFeatureFlags()}
                  isQDM={false}
                  measureCanEdit={false}
                  measureLockedBy=""
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </ApiContextProvider>
    );

    expect(getByText("Mock Measure Metadata")).toBeTruthy();
    expect(getByTestId("leftPanelMeasureInformation")).toBeInTheDocument();
    expect(
      getByTestId("leftPanelModelAndMeasurementPeriod")
    ).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureSteward")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureDescription")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureDisclaimer")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureRationale")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureGuidance")).toBeInTheDocument();
  });

  it("should render the MeasurePurpose component for measure-purpose URL", () => {
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={[{ pathname: "/foo/measure-purpose" }]}>
          <Routes>
            <Route
              path="/foo/*"
              element={
                <MeasureDetails
                  setErrorMessage={setErrorMessage}
                  featureFlags={mockUseFeatureFlags()}
                  isQDM={false}
                  measureCanEdit={false}
                  measureLockedBy=""
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </ApiContextProvider>
    );

    expect(
      screen.getByTestId("leftPanelModelAndMeasurementPeriod")
    ).toBeInTheDocument();
    expect(screen.getByTestId("leftPanelMeasureSteward")).toBeInTheDocument();
    expect(
      screen.getByTestId("leftPanelMeasureDescription")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("leftPanelMeasureDisclaimer")
    ).toBeInTheDocument();
    expect(screen.getByTestId("leftPanelMeasureRationale")).toBeInTheDocument();
    expect(screen.getByTestId("leftPanelMeasurePurpose")).toBeInTheDocument();
    expect(screen.getByTestId("leftPanelMeasureGuidance")).toBeInTheDocument();
  });

  it("should render the MeasureMetadata component for measure-guidance URL", () => {
    const { getByText, getByTestId } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={[{ pathname: "/foo/measure-guidance" }]}>
          <Routes>
            <Route
              path="/foo/*"
              element={
                <MeasureDetails
                  setErrorMessage={setErrorMessage}
                  featureFlags={mockUseFeatureFlags()}
                  isQDM={false}
                  measureCanEdit={false}
                  measureLockedBy=""
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </ApiContextProvider>
    );

    expect(getByText("Mock Measure Metadata")).toBeTruthy();
    expect(getByTestId("leftPanelMeasureInformation")).toBeInTheDocument();
    expect(
      getByTestId("leftPanelModelAndMeasurementPeriod")
    ).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureSteward")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureDescription")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureDisclaimer")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureRationale")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureGuidance")).toBeInTheDocument();
  });

  it("should render the MeasureMetadata component for measure-definition", () => {
    const { getByTestId } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter
          initialEntries={[{ pathname: "/foo/measure-definition" }]}
        >
          <Routes>
            <Route
              path="/foo/*"
              element={
                <MeasureDetails
                  setErrorMessage={setErrorMessage}
                  featureFlags={mockUseFeatureFlags()}
                  isQDM={true}
                  measureCanEdit={false}
                  measureLockedBy=""
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </ApiContextProvider>
    );
    expect(getByTestId("leftPanelMeasureInformation")).toBeInTheDocument();
    expect(getByTestId("leftPanelQDMMeasureDefinition")).toBeInTheDocument();
  });

  it("should render the MeasureMetadata component for references", () => {
    const { getByTestId } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter
          initialEntries={[{ pathname: "/foo/measure-references" }]}
        >
          <Routes>
            <Route
              path="/foo/*"
              element={
                <MeasureDetails
                  setErrorMessage={setErrorMessage}
                  featureFlags={mockUseFeatureFlags()}
                  isQDM={true}
                  measureCanEdit={false}
                  measureLockedBy=""
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </ApiContextProvider>
    );

    expect(getByTestId("leftPanelMeasureInformation")).toBeInTheDocument();
    expect(getByTestId("leftPanelQDMMeasureDefinition")).toBeInTheDocument();
    expect(getByTestId("measure-references")).toBeInTheDocument();
  });

  it("should not render the component for measure-definitions", () => {
    const { getByTestId, queryByTestId } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={[{ pathname: "/foo" }]}>
          <Routes>
            <Route
              path="/foo/*"
              element={
                <MeasureDetails
                  setErrorMessage={setErrorMessage}
                  featureFlags={mockUseFeatureFlags()}
                  isQDM={true}
                  measureCanEdit={true}
                  measureLockedBy=""
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </ApiContextProvider>
    );

    expect(getByTestId("leftPanelMeasureInformation")).toBeInTheDocument();
    const leftPanelQDMMeasureDefinitions = queryByTestId(
      "leftPanelQDMMeasureDefinitions"
    );
    expect(leftPanelQDMMeasureDefinitions).toBeNull();
    const measureDefinitionTerms = queryByTestId("measure-definitions");
    expect(measureDefinitionTerms).toBeNull();
  });

  it("should render the MeasureMetadata component for measure set", () => {
    const { getByTestId } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={[{ pathname: "/foo" }]}>
          <Routes>
            <Route
              path="/foo/*"
              element={
                <MeasureDetails
                  setErrorMessage={setErrorMessage}
                  featureFlags={mockUseFeatureFlags()}
                  isQDM={true}
                  measureCanEdit={true}
                  measureLockedBy=""
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </ApiContextProvider>
    );

    expect(getByTestId("leftPanelMeasureInformation")).toBeInTheDocument();
    expect(getByTestId("leftPanelMeasureSet")).toBeInTheDocument();
  });

  it("should render measure definitions for qi core measure", () => {
    const { getByTestId, queryByTestId } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={[{ pathname: "/foo" }]}>
          <Routes>
            <Route
              path="/foo/*"
              element={
                <MeasureDetails
                  setErrorMessage={setErrorMessage}
                  featureFlags={mockUseFeatureFlags()}
                  isQDM={false}
                  measureCanEdit={true}
                  measureLockedBy=""
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </ApiContextProvider>
    );

    expect(getByTestId("leftPanelMeasureInformation")).toBeInTheDocument();
    const leftPanelQiCoreMeasureDefinitions = queryByTestId(
      "leftPanelQiCoreMeasureDefinition"
    );
    expect(leftPanelQiCoreMeasureDefinitions).not.toBeNull();
    const measureDefinitionTerms = queryByTestId("measure-definitions");
    expect(measureDefinitionTerms).toBeNull();
  });

  it("should render the tabs in the measure details side nav with completed icons", () => {
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={[{ pathname: "/foo" }]}>
          <Routes>
            <Route
              path="/foo"
              element={
                <MeasureDetails
                  setErrorMessage={setErrorMessage}
                  featureFlags={mockUseFeatureFlags()}
                  isQDM={true}
                  measureCanEdit={true}
                  measureLockedBy=""
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </ApiContextProvider>
    );

    expect(
      getByTestId("measure-details-completed-icon-sideNavMeasureInformation")
    ).toBeInTheDocument();
    expect(
      getByTestId(
        "measure-details-completed-icon-sideNavMeasureModelAndMeasurementPeriod"
      )
    ).toBeInTheDocument();
    expect(
      getByTestId("measure-details-completed-icon-sideNavMeasureSteward")
    ).toBeInTheDocument();
    expect(
      getByTestId("measure-details-completed-icon-sideNavMeasureDescription")
    ).toBeInTheDocument();
    expect(
      getByTestId("measure-details-completed-icon-sideNavMeasureRationale")
    ).toBeInTheDocument();
    expect(
      getByTestId("measure-details-completed-icon-sideNavMeasureGuidance")
    ).toBeInTheDocument();
    expect(
      getByTestId("measure-details-completed-icon-sideNavQDMMeasureDefinition")
    ).toBeInTheDocument();
    expect(
      getByTestId(
        "measure-details-completed-icon-sideNavMeasureClinicalRecommendation"
      )
    ).toBeInTheDocument();
    expect(
      getByTestId("measure-details-completed-icon-sideNavMeasureReferences")
    ).toBeInTheDocument();
    expect(
      getByTestId("measure-details-completed-icon-sideNavMeasureSet")
    ).toBeInTheDocument();
    expect(
      getByTestId("measure-details-completed-icon-sideNavMeasureCopyright")
    ).toBeInTheDocument();
    expect(
      getByTestId("measure-details-completed-icon-sideNavMeasureDisclaimer")
    ).toBeInTheDocument();
  });

  it("should render the tabs in the measure details side nav with incompleted icons", () => {
    measureStore.state.mockImplementationOnce(() => incompletedIconMeasure);

    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={[{ pathname: "/foo" }]}>
          <Routes>
            <Route
              path="/foo"
              element={
                <MeasureDetails
                  setErrorMessage={setErrorMessage}
                  featureFlags={mockUseFeatureFlags()}
                  isQDM={true}
                  measureCanEdit={true}
                  measureLockedBy=""
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </ApiContextProvider>
    );

    expect(
      getByTestId("measure-details-incompleted-icon-sideNavMeasureInformation")
    ).toBeInTheDocument();
    expect(
      getByTestId(
        "measure-details-incompleted-icon-sideNavMeasureModelAndMeasurementPeriod"
      )
    ).toBeInTheDocument();
    expect(
      getByTestId("measure-details-incompleted-icon-sideNavMeasureSteward")
    ).toBeInTheDocument();
    expect(
      getByTestId("measure-details-incompleted-icon-sideNavMeasureDescription")
    ).toBeInTheDocument();
  });

  it("should trigger a call to lock the measure", async () => {
    measureStore.state.mockImplementationOnce(() => incompletedIconMeasure);

    const updateMeasureLock = jest.fn().mockResolvedValueOnce({
      lockedBy: "test-user",
      lockedAt: "2025-08-05T12:00:00Z",
    });
    const unlockMeasure = jest.fn();
    mockMeasureServiceApi.updateMeasureLock = updateMeasureLock;
    mockMeasureServiceApi.unlockMeasure = unlockMeasure;

    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/foo/2"]}>
          <Routes>
            <Route
              path="/foo/:measureId"
              element={
                <MeasureDetails
                  featureFlags={{ Locking: true }}
                  setErrorMessage={setErrorMessage}
                  isQDM={true}
                  measureCanEdit={true}
                  measureLockedBy=""
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </ApiContextProvider>
    );

    await waitFor(() => {
      expect(updateMeasureLock).toHaveBeenCalledTimes(1);
      expect(updateMeasureLock).toHaveBeenCalledWith("2");
    });
  });

  it("should trigger a fail call to lock the measure", async () => {
    measureStore.state.mockImplementationOnce(() => incompletedIconMeasure);

    const updateMeasureLock = jest.fn().mockRejectedValueOnce({
      response: {
        data: {
          lockedBy: "another-user",
          lockedAt: "2025-08-05T12:00:00Z",
        },
      },
    });

    const unlockMeasure = jest.fn();
    mockMeasureServiceApi.updateMeasureLock = updateMeasureLock;
    mockMeasureServiceApi.unlockMeasure = unlockMeasure;

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/measures/testMeasureId"]}>
          <Routes>
            <Route
              path="/measures/:measureId"
              element={
                <MeasureDetails
                  featureFlags={{ Locking: true }}
                  setErrorMessage={setErrorMessage}
                  isQDM={true}
                  measureCanEdit={true}
                  measureLockedBy=""
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </ApiContextProvider>
    );

    await waitFor(() => {
      expect(updateMeasureLock).toHaveBeenCalledWith("testMeasureId");
      expect(errorSpy).toHaveBeenCalled();

      errorSpy.mockRestore();
    });
  });

  it("should render MeasureInformation component with measureLockedByAnotherUser as true", () => {
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={[{ pathname: "/foo" }]}>
          <Routes>
            <Route
              path="/foo"
              element={
                <MeasureDetails
                  setErrorMessage={setErrorMessage}
                  isQDM={false}
                  featureFlags={mockUseFeatureFlags()}
                  measureCanEdit={true}
                  measureLockedBy="another-user"
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </ApiContextProvider>
    );
    expect(getByText("Mock Measure Info")).toBeTruthy();
  });

  it("should render MeasureInformation component with measureLockedByAnotherUser as true", async () => {
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={[{ pathname: "/foo" }]}>
          <Routes>
            <Route
              path="/foo"
              element={
                <MeasureDetails
                  setErrorMessage={setErrorMessage}
                  isQDM={false}
                  featureFlags={{ Locking: true }}
                  measureCanEdit={true}
                  measureLockedBy="another-user"
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </ApiContextProvider>
    );
    expect(getByText("Mock Measure Info")).toBeTruthy();
    expect(getByText("Measure currently In-Use")).toBeTruthy();
    const closeButton = getByTestId("measure-locked-modal-close-button");
    expect(closeButton).toBeTruthy();
    fireEvent.click(closeButton);
    await waitFor(() => {
      expect(
        screen.queryByText("Measure currently In-Use")
      ).not.toBeInTheDocument();
    });
  });
});
