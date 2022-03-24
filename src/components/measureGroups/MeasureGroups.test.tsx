import * as React from "react";
import { render, screen, act, within, fireEvent } from "@testing-library/react";
import { isEqual } from "lodash";
import MeasureGroups, {
  DefaultPopulationSelectorDefinitions,
} from "./MeasureGroups";
import { MEASURE_SCORING_KEYS } from "../../models/MeasureScoring";
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
        denominator: "",
        denominatorException: "",
        denominatorExclusion: "",
        numerator: "",
        numeratorExclusion: "",
        measurePopulation: "",
        measurePopulationExclusion: "",
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

  test("MeasureGroups renders a list of definitions based on parsed CQL", async () => {
    renderMeasureGroupComponent();

    // Test that each Scoring Unit selection displays the correct population filters
    await act(async () => {
      for await (let [value, key] of MEASURE_SCORING_KEYS) {
        // Change the selection value
        userEvent.selectOptions(screen.getByTestId("scoring-unit-select"), [
          screen.getByText(value),
        ]);
        let optionEl = screen.getByRole("option", { name: value });
        expect(optionEl.selected).toBe(true);

        // Check that the appropriate filter labels are rendered as expected
        let filterLabelArrayIntended =
          DefaultPopulationSelectorDefinitions.reduce((filters, option) => {
            if (option.hidden?.includes(value)) return filters;
            let isRequired = "*";
            if (option.optional?.length) {
              if (
                option.optional?.includes(value) ||
                option.optional[0] === "*"
              ) {
                isRequired = "";
              }
            }
            filters.push(`${option.label}${isRequired}`);
            return filters;
          }, []);

        // Check what is actually rendered
        let filterLabelArrayActual = screen
          .getAllByTestId("select-measure-group-population-label")
          .map((labelEl, id) => {
            return labelEl.textContent;
          });
        expect(isEqual(filterLabelArrayIntended, filterLabelArrayActual)).toBe(
          true
        );
      }
    });

    const definitions = await screen.findAllByTestId(
      "select-measure-group-population"
    );
    for await (let def of definitions) {
      let options = def.getElementsByTagName("option");
      expect(options.length).toBe(11);
      expect(def[0].textContent).toBe("SDE Ethnicity");
    }
  });

  test("On change of group scoring the field definitions are cleared", () => {
    group.id = "";
    measure.groups = [group];
    renderMeasureGroupComponent();
    userEvent.selectOptions(
      screen.getByTestId("scoring-unit-select"),
      screen.getByRole("option", { name: "Cohort" })
    );
    expect(screen.getByRole("option", { name: "Cohort" }).selected).toBe(true);
    const option = screen.getByTestId("scoring-unit-select");

    const populationOption = screen.getAllByTestId(
      "select-measure-group-population"
    )[0];
    expect(populationOption.value).toBe(group.population.initialPopulation);

    fireEvent.change(option, { target: { value: "Ratio" } });
    expect(option.value).toBe("Ratio");
    expect(populationOption.value).toBe("");
  });

  test("Should create population Group with one initial population successfully", async () => {
    renderMeasureGroupComponent();
    // select initial population from dropdown
    userEvent.selectOptions(
      screen.getByTestId("select-measure-group-population"),
      "Initial Population"
    );
    expect(
      screen.getByRole("option", { name: "Initial Population" }).selected
    ).toBe(true);

    mockedAxios.post.mockResolvedValue({ data: { group } });

    // submit the form
    userEvent.click(screen.getByTestId("group-form-submit-btn"));
    const alert = await screen.findByTestId("success-alerts");

    const expectedGroup = {
      id: null,
      population: {
        initialPopulation: "Initial Population",
      },
      scoring: "Cohort",
    };

    expect(alert).toHaveTextContent(
      "Population details for this group saved successfully."
    );
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "example-service-url/measures/test-measure/groups/",
      expectedGroup,
      expect.anything()
    );
  });

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
  //     screen.getByTestId("select-measure-group-population"),
  //     screen.getByText(definitionToUpdate)
  //   );

  //   expect(
  //     screen.getByRole("option", {
  //       name: definitionToUpdate,
  //     }).selected
  //   ).toBe(true);

  //   group.population.initialPopulation = definitionToUpdate;

  //   mockedAxios.put.mockResolvedValue({ data: { group } });

  //   const expectedGroup = {
  //     id: "7p03-5r29-7O0I",
  //     population: {
  //       initialPopulation:
  //         "VTE Prophylaxis by Medication Administered or Device Applied",
  //     },
  //     scoring: "Cohort",
  //   };

  //   // submit the form
  //   userEvent.click(screen.getByTestId("group-form-submit-btn"));
  //   const alert = await screen.findByTestId("success-alerts");

  //   //const alert = await screen.findByTestId("warning-alerts");
  //   //expect(alert).toBeInTheDocument();

  //   expect(alert).toHaveTextContent(
  //     "Population details for this group updated successfully."
  //   );
  //   expect(mockedAxios.put).toHaveBeenCalledWith(
  //     "example-service-url/measures/test-measure/groups/",
  //     expectedGroup,
  //     expect.anything()
  //   );
  // });

  test("Should report an error if create population Group fails", async () => {
    renderMeasureGroupComponent();
    // select initial population from dropdown
    userEvent.selectOptions(
      screen.getByTestId("select-measure-group-population"),
      ["Initial Population"]
    );

    expect(
      screen.getByRole("option", { name: "Initial Population" }).selected
    ).toBe(true);

    mockedAxios.post.mockRejectedValue({
      data: {
        error: "500error",
      },
    });

    // submit the form
    userEvent.click(screen.getByTestId("group-form-submit-btn"));
    const alert = await screen.findByTestId("error-alerts");
    expect(alert).toHaveTextContent("Failed to create the group.");
  });

  // test("Should report an error if the update population Group fails", async () => {
  //   group.id = "7p03-5r29-7O0I";
  //   measure.groups = [group];
  //   renderMeasureGroupComponent();
  //   // update initial population from dropdown
  //   const definitionToUpdate =
  //     "VTE Prophylaxis by Medication Administered or Device Applied";
  //   userEvent.selectOptions(
  //     screen.getByTestId("select-measure-group-population"),
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
