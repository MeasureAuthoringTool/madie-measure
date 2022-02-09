import "@testing-library/jest-dom/extend-expect";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required
import * as React from "react";
import { render, screen } from "@testing-library/react";
import MeasureGroups from "./MeasureGroups";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import useCurrentMeasure from "../editMeasure/useCurrentMeasure";
import { MemoryRouter } from "react-router-dom";
import { MeasureCQL } from "../common/MeasureCQL";
import { expect } from "@jest/globals";

jest.mock("../editMeasure/useCurrentMeasure");
jest.mock("../../api/useMeasureServiceApi");

const useCurrentMeasureMock =
  useCurrentMeasure as jest.Mock<MeasureContextHolder>;

const serviceConfig: ServiceConfig = {
  measureService: {
    baseUrl: "example-service-url",
  },
  elmTranslationService: {
    baseUrl: "test-elm-service",
  },
};

describe("Measure Groups Page", () => {
  let measure: Measure;
  let measureContextHolder: MeasureContextHolder;
  afterEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    measure = {
      id: "test measure",
      measureName: "the measure for testing",
      cql: MeasureCQL,
    } as Measure;
    measureContextHolder = {
      measure,
      setMeasure: jest.fn(),
    };
    useCurrentMeasureMock.mockImplementation(() => measureContextHolder);
  });

  test("Page still renders in absence of provided context", async () => {
    const { getByTestId } = render(
      <MemoryRouter initialEntries={[{ pathname: "/" }]}>
        <MeasureGroups />
      </MemoryRouter>
    );
    expect(
      getByTestId("select-measure-scoring-groups-label")
    ).toBeInTheDocument();
    expect(getByTestId("select-measure-scoring-groups")).toBeInTheDocument();
    expect(
      getByTestId("select-expression-definition-scoring-label")
    ).toBeInTheDocument();
    expect(getByTestId("select-expression-definition")).toBeInTheDocument();
  });
  test("MeasureGroups renders to correct options length, and defaults to Cohort", async () => {
    const { getAllByTestId } = render(
      <MemoryRouter initialEntries={[{ pathname: "/" }]}>
        <ApiContextProvider value={serviceConfig}>
          <MeasureGroups />
        </ApiContextProvider>
      </MemoryRouter>
    );
    const optionList = getAllByTestId("select-option-scoring-group");
    expect(optionList).toHaveLength(4);
    expect(optionList[0].textContent).toBe("Cohort");
  });
  test("MeasureGroups renders a list of definitions based on parsed CQL", async () => {
    const { getAllByTestId, container } = render(
      <MemoryRouter initialEntries={[{ pathname: "/" }]}>
        <ApiContextProvider value={serviceConfig}>
          <MeasureGroups />
        </ApiContextProvider>
      </MemoryRouter>
    );
    const definitions = await screen.findAllByTestId(
      "select-option-expression-definition"
    );
    expect(definitions).toHaveLength(10);
    expect(definitions[0].textContent).toBe("SDE Ethnicity");
  });
});
