import * as React from "react";
import { render, screen } from "@testing-library/react";
import MeasureGroups from "./MeasureGroups";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import useCurrentMeasure from "../editMeasure/useCurrentMeasure";
import { MemoryRouter } from "react-router-dom";
import { MeasureCQL } from "../common/MeasureCQL";
import { MeasureContextHolder } from "../editMeasure/MeasureContext";
import Measure, { Group } from "../../models/Measure";
import userEvent from "@testing-library/user-event";
import axios from "axios";

jest.mock("../editMeasure/useCurrentMeasure");

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

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("../../hooks/useOktaTokens", () =>
  jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  }))
);

describe("Measure Groups Page", () => {
  let measure: Measure;
  let group: Group;
  let measureContextHolder: MeasureContextHolder;
  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    measure = {
      id: "test-measure",
      measureScoring: "Cohort",
      measureName: "the measure for testing",
      cql: MeasureCQL,
    } as Measure;
    measureContextHolder = {
      measure,
      setMeasure: jest.fn(),
    };
    useCurrentMeasureMock.mockImplementation(() => measureContextHolder);

    group = {
      id: null,
      scoring: "Cohort",
      population: {
        initialPopulation: "Initial Population",
      },
    };
  });

  const renderMeasureGroupComponent = () => {
    return render(
      <MemoryRouter initialEntries={[{ pathname: "/" }]}>
        <ApiContextProvider value={serviceConfig}>
          <MeasureGroups />
        </ApiContextProvider>
      </MemoryRouter>
    );
  };

  test("MeasureGroups renders to correct options length, and defaults to Cohort", async () => {
    const { getAllByTestId } = renderMeasureGroupComponent();
    const optionList = getAllByTestId("scoring-unit-option");
    expect(optionList).toHaveLength(4);
    expect(optionList[0].textContent).toBe("Cohort");
  });

  // test("MeasureGroups renders a list of definitions based on parsed CQL", async () => {
  //   renderMeasureGroupComponent();
  //   const definitions = await screen.findAllByTestId("ipp-expression-option");
  //   expect(definitions).toHaveLength(10);
  //   expect(definitions[0].textContent).toBe("SDE Ethnicity");
  // });

  // test("Should create population Group with one initial population successfully", async () => {
  //   renderMeasureGroupComponent();
  //   // select initial population from dropdown
  //   userEvent.selectOptions(
  //     screen.getByTestId("ipp-expression-select"),
  //     screen.getByText("Initial Population")
  //   );
  //   expect(
  //     screen.getByRole("option", { name: "Initial Population" }).selected
  //   ).toBe(true);

  //   mockedAxios.post.mockResolvedValue({ data: { group } });

  //   // submit the form
  //   userEvent.click(screen.getByTestId("group-form-submit-btn"));
  //   const alert = await screen.findByTestId("success-alerts");

  //   expect(alert).toHaveTextContent(
  //     "Population details for this group saved successfully."
  //   );
  //   expect(mockedAxios.post).toHaveBeenCalledWith(
  //     "example-service-url/measures/test-measure/groups/",
  //     group,
  //     expect.anything()
  //   );
  // });

  // test("Should be able to update initial population of a population group", async () => {
  //   group.id = "7p03-5r29-7O0I";
  //   measure.groups = [group];
  //   renderMeasureGroupComponent();

  //   // initial population before update
  //   expect(
  //     screen.getByRole("option", {
  //       name: "Initial Population",
  //     }).selected
  //   ).toBe(true);

  //   const definitionToUpdate =
  //     "VTE Prophylaxis by Medication Administered or Device Applied";
  //   // update initial population from dropdown
  //   userEvent.selectOptions(
  //     screen.getByTestId("ipp-expression-select"),
  //     screen.getByText(definitionToUpdate)
  //   );

  //   expect(
  //     screen.getByRole("option", {
  //       name: definitionToUpdate,
  //     }).selected
  //   ).toBe(true);

  //   group.population.initialPopulation = definitionToUpdate;

  //   mockedAxios.put.mockResolvedValue({ data: { group } });

  //   // submit the form
  //   userEvent.click(screen.getByTestId("group-form-submit-btn"));
  //   const alert = await screen.findByTestId("success-alerts");

  //   expect(alert).toHaveTextContent(
  //     "Population details for this group updated successfully."
  //   );
  //   expect(mockedAxios.put).toHaveBeenCalledWith(
  //     "example-service-url/measures/test-measure/groups/",
  //     group,
  //     expect.anything()
  //   );
  // });

  // test("Should report an error if create population Group fails", async () => {
  //   renderMeasureGroupComponent();
  //   // select initial population from dropdown
  //   userEvent.selectOptions(
  //     screen.getByTestId("ipp-expression-select"),
  //     screen.getByText("Initial Population")
  //   );

  //   expect(
  //     screen.getByRole("option", { name: "Initial Population" }).selected
  //   ).toBe(true);

  //   mockedAxios.post.mockRejectedValue({
  //     data: {
  //       error: "500error",
  //     },
  //   });

  //   // submit the form
  //   userEvent.click(screen.getByTestId("group-form-submit-btn"));
  //   const alert = await screen.findByTestId("error-alerts");
  //   expect(alert).toHaveTextContent("Failed to create the group.");
  // });

  // test("Should report an error if the update population Group fails", async () => {
  //   group.id = "7p03-5r29-7O0I";
  //   measure.groups = [group];
  //   renderMeasureGroupComponent();
  //   // update initial population from dropdown
  //   const definitionToUpdate =
  //     "VTE Prophylaxis by Medication Administered or Device Applied";
  //   userEvent.selectOptions(
  //     screen.getByTestId("ipp-expression-select"),
  //     screen.getByText(definitionToUpdate)
  //   );

  //   expect(
  //     screen.getByRole("option", { name: definitionToUpdate }).selected
  //   ).toBe(true);

  //   mockedAxios.put.mockRejectedValue({
  //     data: {
  //       error: "500error",
  //     },
  //   });

  //   // submit the form
  //   userEvent.click(screen.getByTestId("group-form-submit-btn"));
  //   const alert = await screen.findByTestId("error-alerts");
  //   expect(alert).toBeInTheDocument();
  //   expect(alert).toHaveTextContent("Failed to update the group.");
  // });
});
