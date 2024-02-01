import "@testing-library/jest-dom";
import * as React from "react";
import { getByTestId, queryByTestId, render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Route } from "react-router-dom";
import MeasureDetails from "./MeasureDetails";
import { ApiContextProvider, ServiceConfig } from "../../../api/ServiceContext";
import MeasureInformation from "./measureInformation/MeasureInformation";
import MeasureMetadata from "./measureMetadata/MeasureMetadata";
import { useFeatureFlags } from "@madie/madie-util";

jest.mock("./measureInformation/MeasureInformation");
jest.mock("./measureMetadata/MeasureMetadata");
jest.mock("@madie/madie-util", () => ({
  useDocumentTitle: jest.fn(),
  measureStore: {
    updateMeasure: (measure) => measure,
    state: jest.fn().mockImplementation(() => null),
    initialState: jest.fn().mockImplementation(() => null),
    subscribe: (set) => {
      return { unsubscribe: () => null };
    },
  },
  useFeatureFlags: jest.fn(),
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
  }),
  checkUserCanEdit: jest.fn(() => {
    return true;
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

const serviceConfig: ServiceConfig = {
  measureService: {
    baseUrl: "base.url",
  },
  elmTranslationService: {
    baseUrl: "base.url",
  },
  terminologyService: {
    baseUrl: "base.url",
  },
};

beforeEach(() => {
  useFeatureFlags.mockReturnValue({
    qdmMeasureDefinitions: true,
    qdmMeasureReferences: true,
  });
});

describe("MeasureDetails component", () => {
  it("should render the MeasureInformation component for default URL", () => {
    const { getByText } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={[{ pathname: "/foo" }]}>
          <Route path="/foo">
            <MeasureDetails setErrorMessage={setErrorMessage} isQDM={false} />
          </Route>
        </MemoryRouter>
      </ApiContextProvider>
    );
    expect(getByText("Mock Measure Info")).toBeTruthy();
  });

  it("should render the model and measurement component for the URL", () => {
    const { getByTestId } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter
          initialEntries={[{ pathname: "/foo/model&measurement-period" }]}
        >
          <Route path="/foo">
            <MeasureDetails setErrorMessage={setErrorMessage} isQDM={false} />
          </Route>
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
          <Route path="/foo">
            <MeasureDetails setErrorMessage={setErrorMessage} isQDM={false} />
          </Route>
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
          <Route path="/foo">
            <MeasureDetails setErrorMessage={setErrorMessage} isQDM={false} />
          </Route>
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
          <Route path="/foo">
            <MeasureDetails setErrorMessage={setErrorMessage} isQDM={false} />
          </Route>
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
          <Route path="/foo">
            <MeasureDetails setErrorMessage={setErrorMessage} isQDM={false} />
          </Route>
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

  it("should render the MeasureMetadata component for measure-guidance URL", () => {
    const { getByText, getByTestId } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={[{ pathname: "/foo/measure-guidance" }]}>
          <Route path="/foo">
            <MeasureDetails setErrorMessage={setErrorMessage} isQDM={false} />
          </Route>
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

  it("should render the MeasureMetadata component for measure-definitions", () => {
    const { getByTestId } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter
          initialEntries={[{ pathname: "/foo/measure-definitions" }]}
        >
          <Route path="/foo">
            <MeasureDetails setErrorMessage={setErrorMessage} isQDM={true} />
          </Route>
        </MemoryRouter>
      </ApiContextProvider>
    );

    expect(getByTestId("leftPanelMeasureInformation")).toBeInTheDocument();
    expect(getByTestId("leftPanelQDMMeasureDefinitions")).toBeInTheDocument();
    expect(getByTestId("measure-definition-terms")).toBeInTheDocument();
  });

  it("should render the MeasureMetadata component for references", () => {
    const { getByTestId } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter
          initialEntries={[{ pathname: "/foo/measure-references" }]}
        >
          <Route path="/foo">
            <MeasureDetails setErrorMessage={setErrorMessage} isQDM={true} />
          </Route>
        </MemoryRouter>
      </ApiContextProvider>
    );

    expect(getByTestId("leftPanelMeasureInformation")).toBeInTheDocument();
    expect(getByTestId("leftPanelQDMMeasureDefinitions")).toBeInTheDocument();
    expect(getByTestId("measure-references")).toBeInTheDocument();
  });

  it("should not render the component for measure-definitions", () => {
    useFeatureFlags.mockReturnValue({ qdmMeasureDefinitions: false });
    const { getByTestId, queryByTestId } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={[{ pathname: "/foo" }]}>
          <Route path="/foo">
            <MeasureDetails setErrorMessage={setErrorMessage} isQDM={true} />
          </Route>
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
});
