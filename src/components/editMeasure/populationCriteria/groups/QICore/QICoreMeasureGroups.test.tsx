import * as React from "react";
import {
  act,
  fireEvent,
  getByRole,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

import { isEqual } from "lodash";
import MeasureGroups, { MeasureGroupProps } from "./QICoreMeasureGroups";
import {
  AggregateFunctionType,
  Group,
  GroupScoring,
  Measure,
  MeasureErrorType,
  MeasureGroupTypes,
  PopulationType,
} from "@madie/madie-models";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../../api/ServiceContext";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ELM_JSON, MeasureCQL } from "../../../../common/MeasureCQL";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import * as uuid from "uuid";
import { getPopulationsForScoring } from "../../PopulationHelper";
import * as _ from "lodash";
import { measureStore, checkUserCanEdit } from "@madie/madie-util";
import { InitialPopulationAssociationType } from "../groupPopulations/GroupPopulation";
// fix error about window.scrollto
global.scrollTo = jest.fn();

jest.mock("uuid", () => ({
  v4: jest.fn(),
}));

jest.setTimeout(40000);

const serviceConfig: ServiceConfig = {
  measureService: {
    baseUrl: "example-service-url",
  },
  elmTranslationService: {
    baseUrl: "test-elm-service",
  },
  terminologyService: {
    baseUrl: "terminology-service.com",
  },
};

const getEmptyStrat = () => ({
  cqlDefinition: "",
  description: "",
  association: PopulationType.INITIAL_POPULATION,
  id: "",
});

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const MEASURE_CREATEDBY = "testuser@example.com"; //#nosec
jest.mock("@madie/madie-util", () => ({
  useDocumentTitle: jest.fn(),
  measureStore: {
    updateMeasure: (measure) => measure,
    state: jest.fn().mockImplementation(() => null),
    initialState: jest.fn().mockImplementation(() => null),
    subscribe: () => {
      return { unsubscribe: () => null };
    },
  },
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
  }),
  checkUserCanEdit: jest.fn(() => {
    return true;
  }),
  routeHandlerStore: {
    subscribe: () => {
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: () => null,
    state: { canTravel: false, pendingPath: "" },
    initialState: { canTravel: false, pendingPath: "" },
  },
}));

const populationBasisValues: string[] = [
  "boolean",
  "Encounter",
  "Medication Administration",
  "test-data-1",
  "test-data-2",
];
mockedAxios.get.mockResolvedValue({ data: populationBasisValues });

const props: MeasureGroupProps = {
  measureGroupNumber: 0,
  setMeasureGroupNumber: jest.fn,
  setIsFormDirty: jest.fn,
  measureId: "testMeasureId",
};

describe("Measure Groups Page", () => {
  let measure: Measure;
  let group: Group;

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    measure = {
      id: "test-measure",
      measureName: "the measure for testing",
      cql: MeasureCQL,
      elmJson: ELM_JSON,
      createdBy: MEASURE_CREATEDBY,
    } as Measure;
    measureStore.state.mockImplementationOnce(() => measure);
    group = {
      id: null,
      scoring: "Cohort",
      populations: [
        {
          id: "id-1",
          name: PopulationType.INITIAL_POPULATION,
          definition: "Initial Population",
          description: "",
        },
      ],
      groupDescription: "",
      measureGroupTypes: [],
      populationBasis: "boolean",
      scoringUnit: "",
    };

    const mockUuid = require("uuid") as { v4: jest.Mock<string, []> };
    mockUuid.v4
      .mockReset()
      .mockImplementationOnce(() => "uuid-1")
      .mockImplementationOnce(() => "uuid-2")
      .mockImplementationOnce(() => "uuid-3")
      .mockImplementationOnce(() => "uuid-4")
      .mockImplementationOnce(() => "uuid-5")
      .mockImplementationOnce(() => "uuid-6")
      .mockImplementationOnce(() => "uuid-7")
      .mockImplementationOnce(() => "uuid-8")
      .mockImplementationOnce(() => "uuid-9");
  });

  const renderMeasureGroupComponent = () => {
    return render(
      <MemoryRouter
        initialEntries={[{ pathname: "/measures/test-measure/edit/groups/1" }]}
      >
        <ApiContextProvider value={serviceConfig}>
          <Routes>
            <Route
              path="/measures/test-measure/edit/groups/:groupNumber"
              element={<MeasureGroups {...props} />}
            ></Route>
          </Routes>
        </ApiContextProvider>
      </MemoryRouter>
    );
  };

  const changePopulationBasis = async (value: string) => {
    let populationBasis;
    await waitFor(() => {
      populationBasis = screen.getByTestId("populationBasis");
    });
    const populationBasisAutoComplete =
      within(populationBasis).getByRole("combobox");
    populationBasis.focus();
    fireEvent.change(populationBasisAutoComplete, {
      target: { value: value },
    });
    fireEvent.keyDown(populationBasis, { key: "ArrowDown" });
    fireEvent.keyDown(populationBasis, { key: "Enter" });
    expect(populationBasisAutoComplete).toHaveValue(value);
  };

  test("Measure Group Scoring renders to correct options length, and defaults to empty string", async () => {
    renderMeasureGroupComponent();
    const scoringSelectInput = screen.getByTestId(
      "scoring-select-input"
    ) as HTMLInputElement;
    expect(scoringSelectInput.value).toBe("");
    // options will be rendered only after clicking the select,
    const scoringSelect = screen.getByTestId("scoring-select");
    userEvent.click(getByRole(scoringSelect, "button"));
    const optionsList = await screen.findAllByTestId(/group-scoring-option/i);
    expect(optionsList).toHaveLength(4);
  });

  // Todo Need to fix this test case
  test.skip("MeasureGroups renders a list of definitions based on parsed CQL", async () => {
    renderMeasureGroupComponent();

    // Test that each Scoring selection displays the correct population filters
    await act(async () => {
      for await (let value of Object.values(GroupScoring)) {
        // select a scoring
        const scoringSelect = screen.getByTestId("scoring-select");
        userEvent.click(getByRole(scoringSelect, "button"));
        await waitFor(() => {
          userEvent.click(screen.getByText(value));
        });

        // Check that the appropriate filter labels are rendered as expected
        let filterLabelArrayIntended = getPopulationsForScoring(value).reduce(
          (filters, option) => {
            let isRequired = "*";
            if (option.optional?.length) {
              if (
                option.optional?.includes(value) ||
                option.optional[0] === "*"
              ) {
                isRequired = "";
              }
            }
            filters.push(`${_.startCase(option.name)}${isRequired}`);
            return filters;
          },
          []
        );

        const scoringSelectInput = screen.getByTestId(
          "scoring-select-input"
        ) as HTMLInputElement;

        // Check what is actually rendered
        if (!scoringSelectInput.value) {
          let filterLabelArrayActual = screen
            .getAllByTestId("select-measure-group-population-label")
            .map((labelEl, id) => {
              return labelEl.textContent;
            });
          expect(
            isEqual(filterLabelArrayIntended, filterLabelArrayActual)
          ).toBe(true);
        }
      }
    });

    const cqlDefinitionsAsOptions = await screen.findAllByTestId(
      "select-measure-group-population-input"
    );
    for await (let def of cqlDefinitionsAsOptions) {
      let options = def.getElementsByTagName("option");
      expect(options.length).toBe(11);
      expect(def[0].textContent).toBe("SDE Ethnicity");
    }
  }, 30000);

  test("On change of group scoring the field definitions are cleared", async () => {
    group.id = "";
    measure.groups = [group];
    measure.cqlErrors = true;
    await waitFor(() => renderMeasureGroupComponent());
    // verifies if the scoring value is population from group object
    const scoringSelectInput = screen.getByTestId(
      "scoring-select-input"
    ) as HTMLInputElement;
    expect(scoringSelectInput.value).toBe(group.scoring);

    const cqlHasErrorsMessage = screen.getByTestId(
      "error-alerts"
    ) as HTMLInputElement;
    expect(cqlHasErrorsMessage).toBeInTheDocument();

    // verifies if the population has a selected option from group object
    const groupPopulationInput = screen.getByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement;
    expect(groupPopulationInput.value).toBe(group.populations[0].definition);

    // Change the scoring value
    fireEvent.change(scoringSelectInput, {
      target: { value: "Ratio" },
    });
    expect(scoringSelectInput.value).toBe("Ratio");

    // verifies that the selected population definitions are cleared
    await waitFor(() => expect(groupPopulationInput.value).toBe(""));
  });

  test("Should create population Group with one initial population successfully", async () => {
    const populationBasis = "Encounter";
    await waitFor(() => renderMeasureGroupComponent());
    await changePopulationBasis(populationBasis);

    const groupDescriptionInput = screen.getByTestId("groupDescriptionInput");
    fireEvent.change(groupDescriptionInput, {
      target: { value: "new description" },
    });

    // select a scoring
    const scoringSelect = screen.getByTestId("scoring-select");
    userEvent.click(getByRole(scoringSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText("Cohort"));
    });

    // Select Initial population from dropdown
    const groupPopulationInput = screen.getByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement;
    fireEvent.change(groupPopulationInput, {
      target: { value: group.populations[0].definition },
    });

    // Update the definition
    const initialPopulationDescription = screen.getByTestId(
      "populations[0].description-description"
    );
    expect(initialPopulationDescription).toBeInTheDocument();
    act(() => {
      userEvent.paste(initialPopulationDescription, "newVal");
    });
    expect(initialPopulationDescription.value).toBe("newVal");
    // Select measure group type
    const measureGroupTypeSelect = screen.getByTestId(
      "measure-group-type-dropdown"
    );
    userEvent.click(getByRole(measureGroupTypeSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText("Patient Reported Outcome"));
    });

    expect(screen.getByTestId("group-form-delete-btn")).toBeInTheDocument();
    expect(screen.getByTestId("group-form-delete-btn")).toBeDisabled();

    mockedAxios.post.mockResolvedValue({ data: { group } });

    // submit the form
    await expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
    userEvent.click(screen.getByTestId("group-form-submit-btn"));

    const alert = await screen.findByTestId("population-criteria-success");

    expect(alert).toHaveTextContent(
      "Population details for this group saved successfully."
    );
    expect(mockedAxios.post.mock.calls[0][0]).toBe(
      "example-service-url/measures/test-measure/groups"
    );
    expect(mockedAxios.post.mock.calls[0][1].groupDescription).toBe(
      "new description"
    );
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "example-service-url/measures/test-measure/groups",
      expect.anything(),
      expect.anything()
    );
  });

  test("OnClicking delete button, delete group modal is displayed", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "testDescription";
    measure.groups = [group];
    await waitFor(() => renderMeasureGroupComponent());

    expect(screen.getByTestId("title").textContent).toBe(
      "Population Criteria 1"
    );

    expect(screen.getByTestId("group-form-delete-btn")).toBeInTheDocument();
    expect(screen.getByTestId("group-form-delete-btn")).toBeEnabled();

    userEvent.click(screen.getByTestId("group-form-delete-btn"));

    expect(
      screen.getByTestId("delete-measure-group-modal-cancel-btn")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("delete-measure-group-modal-agree-btn")
    ).toBeInTheDocument();

    userEvent.click(
      screen.getByTestId("delete-measure-group-modal-cancel-btn")
    );
    expect(screen.getByTestId("groupDescriptionInput")).toHaveValue(
      "testDescription"
    );
  });

  test("On clicking delete button, measure group should be deleted", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "testDescription";
    measure.groups = [group];
    const { rerender } = renderMeasureGroupComponent();

    expect(screen.getByTestId("title").textContent).toBe(
      "Population Criteria 1"
    );

    expect(screen.getByTestId("group-form-delete-btn")).toBeInTheDocument();
    expect(screen.getByTestId("group-form-delete-btn")).toBeEnabled();

    userEvent.click(screen.getByTestId("group-form-delete-btn"));

    expect(
      screen.getByTestId("delete-measure-group-modal-cancel-btn")
    ).toBeInTheDocument();

    expect(
      screen.getByTestId("delete-measure-group-modal-agree-btn")
    ).toBeInTheDocument();

    const expectedConfig = {
      headers: {
        Authorization: `Bearer test.jwt`,
      },
    };

    const updatedMeasure = {
      id: "test-measure",
      measureName: "the measure for testing",
      cql: MeasureCQL,
      createdBy: MEASURE_CREATEDBY,
      groups: [],
    };
    mockedAxios.delete.mockResolvedValue({ data: updatedMeasure });
    userEvent.click(screen.getByTestId("delete-measure-group-modal-agree-btn"));

    expect(mockedAxios.delete).toHaveBeenCalledWith(
      `example-service-url/measures/test-measure/groups/7p03-5r29-7O0I`,
      expectedConfig
    );

    measure.groups = updatedMeasure.groups;
    rerender(
      <MemoryRouter
        initialEntries={[{ pathname: "/measures/test-measure/edit/groups/" }]}
      >
        <ApiContextProvider value={serviceConfig}>
          <Routes>
            <Route
              path="/measures/test-measure/edit/groups/:groupNumber"
              element={<MeasureGroups {...props} />}
            ></Route>
          </Routes>
        </ApiContextProvider>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByTestId("groupDescriptionInput")).toHaveValue("");
      userEvent.click(screen.getByTestId("reporting-tab"));
      expect(screen.getByTestId("rateAggregationText")).toHaveValue("");
      expect(screen.getByTestId("group-form-delete-btn")).toBeDisabled();
    });
  });

  test("Navigating between the tabs in measure groups page", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "Description Text";
    group.rateAggregation = "Rate Aggregation Text";
    group.improvementNotation = "Increased score indicates improvement";
    measure.groups = [group];
    await waitFor(() => renderMeasureGroupComponent());

    expect(screen.getByTestId("populations-tab")).toBeInTheDocument();

    expect(
      screen.getByTestId("measure-group-type-dropdown")
    ).toBeInTheDocument();
    expect(screen.getByTestId("title").textContent).toBe(
      "Population Criteria 1"
    );

    userEvent.click(screen.getByTestId("reporting-tab"));

    expect(screen.getByTestId("rateAggregationText")).toHaveValue(
      "Rate Aggregation Text"
    );
    const improvementNotationInput = screen.getByTestId(
      "improvement-notation-input"
    ) as HTMLInputElement;
    expect(improvementNotationInput.value).toBe(
      "Increased score indicates improvement"
    );
    expect(screen.getByTestId("group-form-delete-btn")).toBeEnabled();
  });

  test("should display error for CQL return type mismatch on load", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "Description Text";
    group.rateAggregation = "Rate Aggregation Text";
    group.improvementNotation = "Increased score indicates improvement";
    measure.groups = [group];
    measure.errors = [MeasureErrorType.MISMATCH_CQL_POPULATION_RETURN_TYPES];
    renderMeasureGroupComponent();

    expect(await screen.findByTestId("populations-tab")).toBeInTheDocument();

    expect(
      screen.getByTestId("measure-group-type-dropdown")
    ).toBeInTheDocument();
    expect(screen.getByTestId("title").textContent).toBe(
      "Population Criteria 1"
    );

    userEvent.click(screen.getByTestId("reporting-tab"));

    expect(
      await screen.findByText(
        "One or more Population Criteria has a mismatch with CQL return types. Test Cases cannot be executed until this is resolved."
      )
    ).toBeInTheDocument();
  });

  test("Should be able to save multiple groups  ", async () => {
    const populationBasis = "Encounter";
    const { rerender } = renderMeasureGroupComponent();
    await changePopulationBasis(populationBasis);

    // select a scoring
    const scoringSelect = screen.getByTestId("scoring-select");
    userEvent.click(getByRole(scoringSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText("Cohort"));
    });

    // select initial population from dropdown
    const groupPopulationInput = screen.getByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement;
    fireEvent.change(groupPopulationInput, {
      target: { value: "Initial Population" },
    });
    expect(groupPopulationInput.value).toBe("Initial Population");

    const groupDescriptionInput = screen.getByTestId("groupDescriptionInput");
    fireEvent.change(groupDescriptionInput, {
      target: { value: "new description" },
    });

    // Selects a measure group type
    const measureGroupTypeSelect = screen.getByTestId(
      "measure-group-type-dropdown"
    );
    userEvent.click(getByRole(measureGroupTypeSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText("Patient Reported Outcome"));
    });

    // after selecting measure group type, need to collapse the dropdown
    fireEvent.click(screen.getByRole("presentation").firstChild);

    mockedAxios.post.mockResolvedValue({
      data: {
        ...group,
        id: "group1-id",
        measureGroupTypes: [MeasureGroupTypes.PATIENT_REPORTED_OUTCOME],
      },
    });

    expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
    userEvent.click(screen.getByTestId("group-form-submit-btn"));

    const alert = await screen.findByTestId("population-criteria-success");
    expect(alert).toBeInTheDocument();

    expect(alert).toHaveTextContent(
      "Population details for this group saved successfully."
    );
    expect(mockedAxios.post.mock.calls[0][0]).toBe(
      "example-service-url/measures/test-measure/groups"
    );
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "example-service-url/measures/test-measure/groups",
      expect.anything(),
      expect.anything()
    );
    expect(screen.getByTestId("title").textContent).toBe(
      "Population Criteria 1"
    );
    rerender(
      <MemoryRouter
        initialEntries={[{ pathname: "/measures/test-measure/edit/groups/" }]}
      >
        <ApiContextProvider value={serviceConfig}>
          <Routes>
            <Route
              path="/measures/test-measure/edit/groups/:groupNumber"
              element={
                <MeasureGroups
                  setIsFormDirty={jest.fn}
                  measureGroupNumber={1}
                  setMeasureGroupNumber={jest.fn}
                />
              }
            ></Route>
          </Routes>
        </ApiContextProvider>
      </MemoryRouter>
    );

    await changePopulationBasis(populationBasis);
    // Change and verifies the scoring value to Cohort
    const scoringSelect2 = screen.getByTestId("scoring-select");
    userEvent.click(getByRole(scoringSelect2, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText("Cohort"));
    });

    // select initial population from dropdown
    const groupPopulationInput2 = screen.getByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement;
    fireEvent.change(groupPopulationInput2, {
      target: { value: "Initial Population" },
    });
    expect(groupPopulationInput2.value).toBe("Initial Population");

    const groupDescriptionInput2 = screen.getByTestId("groupDescriptionInput");
    fireEvent.change(groupDescriptionInput2, {
      target: { value: "new description for group 2" },
    });

    const measureGroupTypeSelect2 = screen.getByTestId(
      "measure-group-type-dropdown"
    );
    userEvent.click(getByRole(measureGroupTypeSelect2, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText("Patient Reported Outcome"));
    });

    // after selecting measure group type, need to collapse the dropdown
    fireEvent.click(screen.getByRole("presentation").firstChild);

    mockedAxios.post.mockResolvedValue({
      data: {
        ...group,
        id: "group2-id",
        measureGroupTypes: [MeasureGroupTypes.PATIENT_REPORTED_OUTCOME],
      },
    });

    expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
    userEvent.click(screen.getByTestId("group-form-submit-btn"));

    const alert1 = await screen.findByTestId("population-criteria-success");

    expect(alert1).toHaveTextContent(
      "Population details for this group saved successfully."
    );
    expect(mockedAxios.post).toHaveBeenNthCalledWith(
      1,
      "example-service-url/measures/test-measure/groups",
      expect.anything(),
      expect.anything()
    );
    expect(screen.getByTestId("title").textContent).toBe(
      "Population Criteria 2"
    );
  });

  test("Should be able to update initial population of a population group", async () => {
    const populationBasis = "MedicationAdministration";
    group.id = "7p03-5r29-7O0I";
    group.scoringUnit = "testScoringUnit";
    group.populationBasis = populationBasis;
    measure.groups = [group];
    const { getByTestId, getByText } = renderMeasureGroupComponent();
    // initial population before update
    const groupPopulationInput = screen.getByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement;
    expect(groupPopulationInput.value).toBe("Initial Population");

    const definitionToUpdate =
      "VTE Prophylaxis by Medication Administered or Device Applied";
    // update initial population from dropdown
    fireEvent.change(groupPopulationInput, {
      target: { value: definitionToUpdate },
    });
    expect(groupPopulationInput.value).toBe(definitionToUpdate);

    group.populations[0].definition = definitionToUpdate;

    const measureGroupTypeSelect = getByTestId("measure-group-type-dropdown");
    userEvent.click(getByRole(measureGroupTypeSelect, "button"));
    await waitFor(() => {
      userEvent.click(getByText("Patient Reported Outcome"));
    });

    mockedAxios.put.mockResolvedValue({ data: { group } });

    const expectedGroup = {
      id: "7p03-5r29-7O0I",
      populations: [
        {
          id: "id-1",
          name: PopulationType.INITIAL_POPULATION,
          definition:
            "VTE Prophylaxis by Medication Administered or Device Applied",
          description: "",
          associationType: undefined,
        },
      ],
      measureObservations: null,
      scoring: "Cohort",
      groupDescription: "",
      measureGroupTypes: ["Patient Reported Outcome"],
      populationBasis: populationBasis,
      scoringUnit: "testScoringUnit",
      improvementNotation: "",
    };
    expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();

    // submit the form
    userEvent.click(screen.getByTestId("group-form-submit-btn"));
    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        "example-service-url/measures/test-measure/groups",
        expectedGroup,
        expect.anything()
      );
    });
    const alert = await screen.findByTestId("population-criteria-success");
    expect(screen.getByTestId("group-form-submit-btn")).toBeDisabled();
    expect(screen.getByTestId("group-form-discard-btn")).toBeDisabled();

    expect(alert).toHaveTextContent(
      "Population details for this group updated successfully."
    );
  });

  test("displaying a measure update warning modal while updating population basis for a measure group", async () => {
    const newGroup = {
      id: "group-1",
      scoring: "Cohort",
      populations: [
        {
          id: "id-1",
          name: PopulationType.INITIAL_POPULATION,
          definition: "Initial Population",
        },
      ],
      groupDescription: "",
      measureGroupTypes: [MeasureGroupTypes.PATIENT_REPORTED_OUTCOME],
      populationBasis: "boolean",
      scoringUnit: "",
    };
    measure.groups = [newGroup];

    await waitFor(() => renderMeasureGroupComponent());
    const popBasisSelect = screen.getByRole("combobox", {
      name: "Population Basis",
    }) as HTMLInputElement;
    expect(popBasisSelect.value).toBe("boolean");
    expect(screen.getByTestId("group-form-submit-btn")).toBeDisabled();

    await changePopulationBasis("Encounter");
    expect(popBasisSelect.value).toBe("Encounter");

    const definitionToUpdate =
      "Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions";
    // update initial population from dropdown
    const groupPopulationInput = screen.getByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement;
    fireEvent.change(groupPopulationInput, {
      target: { value: definitionToUpdate },
    });

    await waitFor(() => {
      expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
    });

    mockedAxios.put.mockResolvedValue({
      data: {
        id: "group-1",
        scoring: "Cohort",
        populations: [
          {
            id: "id-1",
            name: PopulationType.INITIAL_POPULATION,
            definition:
              "Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions",
          },
        ],
        groupDescription: "",
        measureGroupTypes: [MeasureGroupTypes.PATIENT_REPORTED_OUTCOME],
        populationBasis: "Encounter",
        scoringUnit: "",
      },
    });
    userEvent.click(screen.getByTestId("group-form-submit-btn"));

    userEvent.click(screen.getByTestId("group-form-submit-btn"));
    await waitFor(() => {}, { timeout: 5000 });

    await waitFor(() => {
      expect(
        screen.getByTestId("update-measure-group-pop-basis-dialog")
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByTestId("update-measure-group-pop-basis-modal-agree-btn")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("update-measure-group-pop-basis-modal-cancel-btn")
      );
    });
  });

  test("displaying a measure update warning modal while updating measure scoring and updating measure scoring for a measure group", async () => {
    const populationBasis = "MedicationAdministration";
    const newGroup = {
      id: "7p03-5r29-7O0I",
      scoring: "Continuous Variable",
      populations: [
        {
          id: "id-1",
          name: PopulationType.INITIAL_POPULATION,
          definition: "Initial Population",
        },
        {
          id: "id-2",
          name: PopulationType.MEASURE_POPULATION,
          definition: "Measure Population",
        },
      ],
      groupDescription: "testDescription",
      stratifications: [],
      measureGroupTypes: [MeasureGroupTypes.PATIENT_REPORTED_OUTCOME],
      rateAggregation: "",
      improvementNotation: "",
      populationBasis: populationBasis,
    };
    measure.groups = [newGroup];

    await waitFor(() => renderMeasureGroupComponent());
    const scoringSelectInput = screen.getByTestId(
      "scoring-select-input"
    ) as HTMLInputElement;
    expect(scoringSelectInput.value).toBe("Continuous Variable");
    fireEvent.change(scoringSelectInput, {
      target: { value: "Cohort" },
    });
    expect(scoringSelectInput.value).toBe("Cohort");

    const definitionToUpdate =
      "VTE Prophylaxis by Medication Administered or Device Applied";
    // update initial population from dropdown
    const groupPopulationInput = screen.getByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement;
    fireEvent.change(groupPopulationInput, {
      target: { value: definitionToUpdate },
    });
    expect(groupPopulationInput.value).toBe(definitionToUpdate);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save" })).toBeEnabled()
    );

    mockedAxios.put.mockResolvedValue({ data: { newGroup } });

    const expectedGroup = {
      id: "7p03-5r29-7O0I",
      populations: [
        {
          id: "uuid-3",
          name: PopulationType.INITIAL_POPULATION,
          definition:
            "VTE Prophylaxis by Medication Administered or Device Applied",
          description: "",
          associationType: undefined,
        },
      ],
      measureObservations: null,
      scoring: "Cohort",
      scoringUnit: "",
      groupDescription: "testDescription",
      measureGroupTypes: ["Patient Reported Outcome"],
      rateAggregation: "",
      improvementNotation: "",
      stratifications: [],
      populationBasis: populationBasis,
    };

    expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();

    userEvent.click(screen.getByTestId("group-form-submit-btn"));

    await waitFor(() => {
      expect(
        screen.getByTestId("update-measure-group-scoring-modal-agree-btn")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("update-measure-group-scoring-modal-cancel-btn")
      );
    });

    userEvent.click(
      screen.getByTestId("update-measure-group-scoring-modal-agree-btn")
    );

    expect(mockedAxios.put).toHaveBeenCalledWith(
      "example-service-url/measures/test-measure/groups",
      expectedGroup,
      expect.anything()
    );
  });

  test("On clicking discard button,should be able to discard the changes", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "testDescription";
    group.rateAggregation = "Rate Aggregation Text";
    group.improvementNotation = "Increased score indicates improvement";
    measure.groups = [group];

    await waitFor(() => renderMeasureGroupComponent());

    // verify is the scoring type is Cohort
    const scoringSelectInput = screen.getByTestId(
      "scoring-select-input"
    ) as HTMLInputElement;
    expect(scoringSelectInput.value).toBe("Cohort");

    // verify is the initial population is already set from group object
    const initialPopulationInput = screen.getByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement;
    expect(initialPopulationInput.value).toBe(group.populations[0].definition);

    // update initial population from dropdown
    const definitionToUpdate =
      "VTE Prophylaxis by Medication Administered or Device Applied";
    const initialPopulationSelect = screen.getByTestId(
      "population-select-initial-population"
    );
    userEvent.click(getByRole(initialPopulationSelect, "button"));
    userEvent.click(screen.getByText(definitionToUpdate));
    expect(initialPopulationInput.value).toBe(definitionToUpdate);

    // update data in Reporting tab
    userEvent.click(screen.getByTestId("reporting-tab"));
    const rateAggregationInput = screen.getByTestId("rateAggregationText");
    fireEvent.change(rateAggregationInput, {
      target: { value: "New rate aggregation text" },
    });

    // Discard changed / test onClose
    expect(screen.getByTestId("group-form-discard-btn")).toBeEnabled();
    userEvent.click(screen.getByTestId("group-form-discard-btn"));
    const discardDialog = await screen.getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();
    const cancelButton = await screen.getByTestId(
      "discard-dialog-cancel-button"
    );
    expect(cancelButton).toBeInTheDocument();
    fireEvent.click(cancelButton);
    await waitFor(
      () => {
        expect(
          screen.queryByText("You have unsaved changes.")
        ).not.toBeVisible();
        expect(screen.getByTestId("group-form-discard-btn")).toBeEnabled();
        userEvent.click(screen.getByTestId("group-form-discard-btn"));
        expect(cancelButton).toBeInTheDocument();
        fireEvent.click(cancelButton);
        const continueButton = screen.getByTestId(
          "discard-dialog-continue-button"
        );
        expect(continueButton).toBeInTheDocument();
        fireEvent.click(continueButton);
      },
      { timeout: 10000 }
    );

    expect(screen.getByTestId("rateAggregationText")).toHaveValue(
      group.rateAggregation
    );

    // navigate to population and verify initial population is reverted to value from group object
    userEvent.click(screen.getByTestId("populations-tab"));
    expect(
      (
        (await screen.getByTestId(
          "select-measure-group-population-input"
        )) as HTMLInputElement
      ).value
    ).toBe(group.populations[0].definition);
    expect(await screen.getByTestId("group-form-discard-btn")).toBeDisabled();
  });

  test("Should report an error if server fails to create population Group", async () => {
    renderMeasureGroupComponent();
    await changePopulationBasis("Encounter");
    // select a scoring
    const scoringSelect = screen.getByTestId("scoring-select");
    userEvent.click(getByRole(scoringSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText("Cohort"));
    });

    // Select Initial population from dropdown
    const groupPopulationInput = screen.getByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement;
    fireEvent.change(groupPopulationInput, {
      target: { value: group.populations[0].definition },
    });

    // Select a measure group type
    const measureGroupTypeSelect = screen.getByTestId(
      "measure-group-type-dropdown"
    );
    userEvent.click(getByRole(measureGroupTypeSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText("Patient Reported Outcome"));
    });

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

  test("Should report an error if the update population Group fails", async () => {
    group.id = "7p03-5r29-7O0I";
    group.measureGroupTypes = [MeasureGroupTypes.PROCESS];
    group.populationBasis = "MedicationAdministration";
    measure.groups = [group];
    renderMeasureGroupComponent();

    // update initial population from dropdown
    const definitionToUpdate =
      "VTE Prophylaxis by Medication Administered or Device Applied";
    const groupPopulationInput = screen.getByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement;
    fireEvent.change(groupPopulationInput, {
      target: { value: definitionToUpdate },
    });
    expect(groupPopulationInput.value).toBe(definitionToUpdate);

    mockedAxios.put.mockRejectedValue({
      data: {
        error: "500error",
      },
    });

    // submit the form
    userEvent.click(screen.getByTestId("group-form-submit-btn"));
    const alert = await screen.findByTestId("error-alerts");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent("Failed to update the group.");
  });

  test("Should report an error if the update population Group fails due to group validation error", async () => {
    group.id = "7p03-5r29-7O0I";
    group.measureGroupTypes = [MeasureGroupTypes.PROCESS];
    group.populationBasis = "MedicationAdministration";
    measure.groups = [group];
    renderMeasureGroupComponent();

    // update initial population from dropdown
    const definitionToUpdate =
      "VTE Prophylaxis by Medication Administered or Device Applied";
    const groupPopulationInput = screen.getByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement;
    fireEvent.change(groupPopulationInput, {
      target: { value: definitionToUpdate },
    });
    expect(groupPopulationInput.value).toBe(definitionToUpdate);

    mockedAxios.put.mockRejectedValue({
      response: {
        status: 400,
        data: {
          error: "400error",
          validationErrors: {
            group: "Populations do not match Scoring",
          },
        },
      },
    });

    // submit the form
    userEvent.click(screen.getByTestId("group-form-submit-btn"));
    const alert = await screen.findByTestId("error-alerts");
    expect(alert).toHaveTextContent(
      "Missing required populations for selected scoring type."
    );
  });

  test("Form displays message next to save button about required populations", async () => {
    await waitFor(() => renderMeasureGroupComponent());
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(
      screen.getByText("You must set all required Populations.")
    ).toBeInTheDocument();
  });

  test("Save button is disabled until all required Cohort populations are entered", async () => {
    renderMeasureGroupComponent();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    await changePopulationBasis("Encounter");
    // select a scoring
    const scoringSelect = screen.getByTestId("scoring-select");
    userEvent.click(getByRole(scoringSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText("Cohort"));
    });
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    // Select Initial population from dropdown
    const groupPopulationInput = screen.getByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement;
    fireEvent.change(groupPopulationInput, {
      target: { value: group.populations[0].definition },
    });
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    // Select a measure group type
    const measureGroupTypeSelect = screen.getByTestId(
      "measure-group-type-dropdown"
    );
    userEvent.click(getByRole(measureGroupTypeSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText("Patient Reported Outcome"));
    });

    expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
  });

  test("Save button is disabled until all required Proportion populations are entered", async () => {
    renderMeasureGroupComponent();
    await changePopulationBasis("Encounter");

    // Select the scoring value to Proportion
    const scoringSelect = screen.getByTestId("scoring-select");
    userEvent.click(getByRole(scoringSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText(GroupScoring.PROPORTION));
    });
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    const allPopulationsInputs = screen.getAllByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement[];
    // setting initial population
    fireEvent.change(allPopulationsInputs[0], {
      target: {
        value:
          "Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions",
      },
    });
    // setting denominator
    fireEvent.change(allPopulationsInputs[1], {
      target: { value: "Denominator" },
    });

    // Required population numerator is still not selected
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    fireEvent.change(allPopulationsInputs[3], {
      target: { value: "Numerator" },
    });
    // Select a measure group type
    const measureGroupTypeSelect = screen.getByTestId(
      "measure-group-type-dropdown"
    );
    userEvent.click(getByRole(measureGroupTypeSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText("Patient Reported Outcome"));
    });
    expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
  });

  test("Save button is disabled until all required Ratio populations are entered", async () => {
    renderMeasureGroupComponent();
    await changePopulationBasis("Encounter");

    // Select the scoring value to RATIO
    const scoringSelect = screen.getByTestId("scoring-select");
    userEvent.click(getByRole(scoringSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText(GroupScoring.RATIO));
    });
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    const allPopulationsInputs = screen.getAllByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement[];

    // setting initial population
    fireEvent.change(allPopulationsInputs[0], {
      target: {
        value:
          "Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions",
      },
    });

    // setting Denominator
    fireEvent.change(allPopulationsInputs[1], {
      target: {
        value: "Denominator",
      },
    });

    // Required population numerator is still not selected
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(
      screen.getByText("You must set all required Populations.")
    ).toBeInTheDocument();

    // setting Numerator
    fireEvent.change(allPopulationsInputs[3], {
      target: { value: "Numerator" },
    });

    const measureGroupTypeSelect = screen.getByTestId(
      "measure-group-type-dropdown"
    );
    userEvent.click(getByRole(measureGroupTypeSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText("Patient Reported Outcome"));
    });

    expect(screen.getByTestId("group-form-submit-btn")).not.toBeDisabled();
  });

  test("Save button is disabled until all required CV populations are entered", async () => {
    renderMeasureGroupComponent();
    await changePopulationBasis("Encounter");

    // Select scoring to CONTINUOUS_VARIABLE
    const scoringSelect = screen.getByTestId("scoring-select");
    userEvent.click(getByRole(scoringSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText(GroupScoring.CONTINUOUS_VARIABLE));
    });
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    const allPopulationsInputs = screen.getAllByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement[];

    // setting initial population
    fireEvent.change(allPopulationsInputs[0], {
      target: {
        value: "Initial Population",
      },
    });

    // Setting measure population
    fireEvent.change(allPopulationsInputs[1], {
      target: {
        value: "Denominator",
      },
    });
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    // Setting Observation value
    const observationSelect = screen.getByTestId(
      "select-measure-observation-cv-obs"
    );
    userEvent.click(getByRole(observationSelect, "button"));
    const observationOptions = await screen.findAllByRole("option");
    expect(observationOptions).toHaveLength(1);
    userEvent.click(screen.getByText("fun"));

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    // Setting Aggregate value
    const aggregateSelect = screen.getByTestId(
      "select-measure-observation-aggregate-cv-obs"
    );
    userEvent.click(getByRole(aggregateSelect, "button"));
    const aggregateOptions = await screen.findAllByRole("option");
    expect(aggregateOptions).toHaveLength(6);
    userEvent.click(screen.getByText("Count"));

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    // Setting measure group type
    const measureGroupTypeSelect = screen.getByTestId(
      "measure-group-type-dropdown"
    );
    userEvent.click(getByRole(measureGroupTypeSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText("Patient Reported Outcome"));
    });

    expect(screen.getByTestId("group-form-submit-btn")).not.toBeDisabled();
  });

  test("should display default select for scoring unit", async () => {
    const { getByTestId } = await waitFor(() => renderMeasureGroupComponent());
    const scoringUnitLabel = getByTestId("scoring-unit-text-input");
    expect(scoringUnitLabel).toBeInTheDocument();
  });

  test("Should display error message when updating group", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "testDescription";
    group.populationBasis = "Encounter";
    measure.groups = [group];
    const { getByTestId, getByText } = renderMeasureGroupComponent();

    const measureGroupTypeSelect = getByTestId("measure-group-type-dropdown");
    await act(async () => {
      userEvent.click(getByRole(measureGroupTypeSelect, "button"));
      await waitFor(() => {
        userEvent.click(getByText("Patient Reported Outcome"));
      });
    });

    mockedAxios.put.mockResolvedValue({ data: null });

    expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
    await act(async () => {
      userEvent.click(screen.getByTestId("group-form-submit-btn"));
    });
    await waitFor(() =>
      expect(screen.getByText("Error updating group")).toBeInTheDocument()
    );
  });

  test("Should display error message when adding group", async () => {
    measure.groups = [];
    renderMeasureGroupComponent();
    await changePopulationBasis("Encounter");
    // select a scoring
    const scoringSelect = screen.getByTestId("scoring-select");
    userEvent.click(getByRole(scoringSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText("Cohort"));
    });

    // Select Initial population from dropdown
    const groupPopulationInput = screen.getByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement;
    fireEvent.change(groupPopulationInput, {
      target: { value: "Initial Population" },
    });

    const measureGroupTypeSelect = screen.getByTestId(
      "measure-group-type-dropdown"
    );
    userEvent.click(getByRole(measureGroupTypeSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText("Patient Reported Outcome"));
    });

    mockedAxios.put.mockResolvedValue({ data: null });

    expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
    await act(async () => {
      userEvent.click(screen.getByTestId("group-form-submit-btn"));
    });
    await waitFor(() =>
      expect(
        screen.getByText("Failed to create the group.")
      ).toBeInTheDocument()
    );
  });

  test("Add/remove second IP for ratio group", async () => {
    await waitFor(() => renderMeasureGroupComponent());

    // select Ratio scoring
    const scoringSelect = screen.getByTestId("scoring-select");
    userEvent.click(getByRole(scoringSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText("Ratio"));
    });

    // initial population available for ratio scoring
    expect(
      screen.getByTestId("population-select-initial-population")
    ).toBeInTheDocument();

    const addIpLink = screen.getByRole("link", {
      name: "+ Add Initial Population",
    });
    // add second ip
    expect(addIpLink).toBeInTheDocument();
    userEvent.click(addIpLink);

    // verify  IP1 and IP2 visible
    expect(
      screen.getByTestId("population-select-initial-population-1")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("population-select-initial-population-2")
    ).toBeInTheDocument();

    // delete the IP2
    const removeIpLink = screen.getByRole("link", { name: /Remove/ });
    expect(removeIpLink).toBeInTheDocument();
    userEvent.click(removeIpLink);

    // IP is back
    expect(
      screen.getByTestId("population-select-initial-population")
    ).toBeInTheDocument();

    // no more IP1 & IP2 in the document
    expect(screen.queryByTestId("population-select-initial-population-1")).toBe(
      null
    );
    expect(screen.queryByTestId("population-select-initial-population-2")).toBe(
      null
    );
  });

  test("Stratifications Should Not Have Remove Button if there are only two", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "Description Text";
    group.rateAggregation = "Rate Aggregation Text";
    group.improvementNotation = "Increased score indicates improvement";
    group.stratifications = [
      { ...getEmptyStrat(), id: "id-1" },
      { ...getEmptyStrat(), id: "id-2" },
    ];
    measure.groups = [group];
    renderMeasureGroupComponent();
    userEvent.click(screen.getByTestId("stratifications-tab"));
    const removeButton = screen.queryByTestId("remove-strat-button");
    await waitFor(() => expect(removeButton).not.toBeInTheDocument());
  });

  test("Stratifications should have remove button if there are more than two", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "Description Text";
    group.rateAggregation = "Rate Aggregation Text";
    group.improvementNotation = "Increased score indicates improvement";
    group.stratifications = [
      { ...getEmptyStrat(), id: "id-1" },
      { ...getEmptyStrat(), id: "id-2" },
      { ...getEmptyStrat(), id: "id-3" },
    ];
    measure.groups = [group];
    renderMeasureGroupComponent();
    expect(screen.getByTestId("stratifications-tab")).toBeInTheDocument();
    userEvent.click(screen.getByTestId("stratifications-tab"));
    const removeButton = screen.getAllByTestId("remove-strat-button")[0];
    await waitFor(() => expect(removeButton).toBeInTheDocument());
  });

  test("Stratifications should no longer have remove button the stratifications are reduced to two", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "Description Text";
    group.rateAggregation = "Rate Aggregation Text";
    group.improvementNotation = "Increased score indicates improvement";
    group.stratifications = [
      { ...getEmptyStrat(), id: "id-1" },
      { ...getEmptyStrat(), id: "id-2" },
      { ...getEmptyStrat(), id: "id-3" },
    ];
    measure.groups = [group];
    renderMeasureGroupComponent();
    expect(screen.getByTestId("stratifications-tab")).toBeInTheDocument();
    userEvent.click(screen.getByTestId("stratifications-tab"));
    const removeButton = screen.getAllByTestId("remove-strat-button")[0];
    expect(removeButton).toBeInTheDocument();
    userEvent.click(removeButton);
    const removeButton2 = screen.queryByTestId("remove-strat-button");
    await waitFor(() => expect(removeButton2).not.toBeInTheDocument());
  });

  test("Stratifications should show add button if total increased to >2", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "Description Text";
    group.rateAggregation = "Rate Aggregation Text";
    group.improvementNotation = "Increased score indicates improvement";
    group.stratifications = [
      { ...getEmptyStrat(), id: "id-1" },
      { ...getEmptyStrat(), id: "id-2" },
    ];
    measure.groups = [group];
    const { queryByTestId } = renderMeasureGroupComponent();
    userEvent.click(screen.getByTestId("stratifications-tab"));
    const removeButton = queryByTestId("remove-strat-button");
    expect(removeButton).not.toBeInTheDocument();
    const addButton = queryByTestId("add-strat-button");
    userEvent.click(addButton);
    const removeButton2 = screen.getAllByTestId("remove-strat-button")[0];
    await waitFor(() => expect(removeButton2).toBeInTheDocument());
  });

  test("If stratification is empty, auto populate two empty stratifications", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "Description Text";
    group.rateAggregation = "Rate Aggregation Text";
    group.improvementNotation = "Increased score indicates improvement";
    group.stratifications = [];
    measure.groups = [group];
    renderMeasureGroupComponent();
    userEvent.click(screen.getByTestId("stratifications-tab"));
    await waitFor(() => {
      expect(group.stratifications.length == 2);
    });
    expect(group.stratifications[0]).toEqual({
      ...getEmptyStrat(),
      id: "uuid-3",
      association: PopulationType.INITIAL_POPULATION,
    });
  });

  test("Stratification definitions return type validation to match population basis", async () => {
    group.id = "7p03-5r29-7O0I";
    group.stratifications = [
      { ...getEmptyStrat(), id: "id-1" },
      { ...getEmptyStrat(), id: "id-2" },
    ];
    measure.groups = [group];
    const errorMessage =
      "The selected definition does not align with the Population Basis field selection of boolean";
    renderMeasureGroupComponent();
    // switch to stratification tab
    userEvent.click(screen.getByTestId("stratifications-tab"));
    // select Initial population from dropdown for start 1
    const strat1 = screen.getByTestId(
      "stratification-1-input"
    ) as HTMLInputElement;
    fireEvent.change(strat1, {
      target: { value: "Initial Population" },
    });
    // no error because population basis matches with cql define return type
    expect(screen.queryByText(errorMessage)).toBeNull();

    // update population basis to not match cql define return type
    await changePopulationBasis("boolean");
    // error shown
    expect(screen.queryByText(errorMessage)).not.toBeNull();
    // update population basis to match cql define return type
    await changePopulationBasis("Encounter");
    // no error shown
    await waitFor(() => {
      expect(screen.queryByText(errorMessage)).toBeNull();
    });
  });

  test("measure observation should not render for cohort", async () => {
    renderMeasureGroupComponent();
    // select Cohort scoring
    const scoringSelect = screen.getByTestId("scoring-select");
    userEvent.click(getByRole(scoringSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText("Cohort"));
    });

    expect(
      screen.queryByRole("link", {
        name: "+ Add Observation",
      })
    ).not.toBeInTheDocument();
  });

  test("measure observation should not render for proportion", async () => {
    renderMeasureGroupComponent();
    // select Proportion scoring
    const scoringSelect = screen.getByTestId("scoring-select");
    userEvent.click(getByRole(scoringSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText("Proportion"));
    });

    expect(
      screen.getAllByTestId("select-measure-group-population-input")
    ).toHaveLength(6);

    expect(
      screen.queryByRole("link", {
        name: "+ Add Observation",
      })
    ).not.toBeInTheDocument();

    expect(screen.queryByText("Observation")).not.toBeInTheDocument();
  });

  test("measure observation should render for CV group", async () => {
    renderMeasureGroupComponent();

    const scoringSelect = screen.getByTestId("scoring-select");
    userEvent.click(getByRole(scoringSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText(GroupScoring.CONTINUOUS_VARIABLE));
    });

    expect(
      screen.getAllByTestId("select-measure-group-population-input")
    ).toHaveLength(3);

    expect(
      screen.getByTestId("select-measure-observation-cv-obs")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("select-measure-observation-aggregate-cv-obs")
    ).toBeInTheDocument();
  });

  test("measure observation should render existing for continuous variable", async () => {
    group.scoring = "Continuous Variable";
    group.measureObservations = [
      {
        id: "uuid-1",
        definition: "fun",
        aggregateMethod: AggregateFunctionType.COUNT,
        criteriaReference: "id-3",
      },
    ];

    group.populations = [
      {
        id: "id-1",
        name: PopulationType.INITIAL_POPULATION,
        definition: "Initial Population",
      },
      {
        id: "id-2",
        name: PopulationType.MEASURE_POPULATION,
        definition: "MeasurePopulationExclusion",
      },
      {
        id: "id-3",
        name: PopulationType.MEASURE_POPULATION_EXCLUSION,
        definition: "MeasurePopulation",
      },
    ];

    measure.groups = [group];
    await waitFor(() => renderMeasureGroupComponent());

    const observationInput = screen.getByTestId(
      "measure-observation-cv-obs-input"
    ) as HTMLInputElement;
    expect(observationInput.value).toBe("fun");

    const aggregateFuncInput = screen.getByTestId(
      "measure-observation-aggregate-cv-obs-input"
    ) as HTMLInputElement;
    expect(aggregateFuncInput.value).toEqual("Count");
  });

  test("measure observation should render existing for ratio group", async () => {
    group.scoring = "Ratio";
    group.measureObservations = [
      {
        id: "uuid-1",
        definition: "fun",
        aggregateMethod: AggregateFunctionType.AVERAGE,
        criteriaReference: "id-3",
      },
    ];
    group.populations = [
      {
        id: "id-1",
        name: PopulationType.INITIAL_POPULATION,
        definition: "Initial Population",
      },
      {
        id: "id-2",
        name: PopulationType.DENOMINATOR,
        definition: "Denominator",
      },
      {
        id: "id-3",
        name: PopulationType.NUMERATOR,
        definition: "Numerator",
      },
    ];
    measure.groups = [group];
    await waitFor(() => renderMeasureGroupComponent());

    const numeratorObservationInput = screen.getByTestId(
      "measure-observation-numerator-input"
    ) as HTMLInputElement;
    expect(numeratorObservationInput).toHaveValue("fun");

    const numeratorAggregateFunctionInput = screen.getByTestId(
      "measure-observation-aggregate-numerator-input"
    ) as HTMLInputElement;
    expect(numeratorAggregateFunctionInput.value).toEqual("Average");
  });

  test("measure observation should be included in persisted output for continuous variable", async () => {
    renderMeasureGroupComponent();
    await changePopulationBasis("Encounter");

    // Select scoring to CONTINUOUS_VARIABLE
    const scoringSelect = screen.getByTestId("scoring-select");
    userEvent.click(getByRole(scoringSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText(GroupScoring.CONTINUOUS_VARIABLE));
    });

    const allPopulationsInputs = screen.getAllByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement[];

    // setting initial population
    fireEvent.change(allPopulationsInputs[0], {
      target: {
        value: "Initial Population",
      },
    });

    // Setting measure population
    fireEvent.change(allPopulationsInputs[1], {
      target: {
        value: "Denominator",
      },
    });

    // Setting Observation value
    const observationSelect = screen.getByTestId(
      "select-measure-observation-cv-obs"
    );
    userEvent.click(getByRole(observationSelect, "button"));
    const observationOptions = await screen.findAllByRole("option");
    expect(observationOptions).toHaveLength(1);
    userEvent.click(screen.getByText("fun"));

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    // Setting Aggregate value
    const aggregateSelect = screen.getByTestId(
      "select-measure-observation-aggregate-cv-obs"
    );
    userEvent.click(getByRole(aggregateSelect, "button"));
    const aggregateOptions = await screen.findAllByRole("option");
    expect(aggregateOptions).toHaveLength(6);
    userEvent.click(screen.getByText("Count"));

    // Setting measure group type
    const measureGroupTypeSelect = screen.getByTestId(
      "measure-group-type-dropdown"
    );
    userEvent.click(getByRole(measureGroupTypeSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText("Patient Reported Outcome"));
    });

    mockedAxios.post.mockResolvedValue({
      data: {
        ...group,
        id: "group1-id",
        measureGroupTypes: [MeasureGroupTypes.PATIENT_REPORTED_OUTCOME],
        measureObservations: [
          {
            id: "uuid-1",
            definition: "fun",
            aggregateMethod: AggregateFunctionType.COUNT,
          },
        ],
      },
    });

    expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
    userEvent.click(screen.getByTestId("group-form-submit-btn"));

    const alert = await screen.findByTestId("population-criteria-success");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(
      "Population details for this group saved successfully."
    );

    expect(mockedAxios.post.mock.calls[0][0]).toBe(
      "example-service-url/measures/test-measure/groups"
    );
    expect(mockedAxios.post.mock.calls[0][1].groupDescription).toBe("");
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "example-service-url/measures/test-measure/groups",
      expect.anything(),
      expect.anything()
    );
  });

  test("measure observation should be included in persisted output for ratio", async () => {
    renderMeasureGroupComponent();
    await changePopulationBasis("Encounter");
    // Select scoring to Ratio
    const scoringSelect = screen.getByTestId("scoring-select");
    userEvent.click(getByRole(scoringSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText(GroupScoring.RATIO));
    });

    const measureGroupTypeDropdown = screen.getByTestId(
      "measure-group-type-dropdown"
    );
    userEvent.click(await getByRole(measureGroupTypeDropdown, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText("Outcome"));
    });
    // after selecting measure group type, need to collapse the dropdown
    fireEvent.click(screen.getByRole("presentation").firstChild);

    const allPopulationsInputs = screen.getAllByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement[];

    // setting initial population
    fireEvent.change(allPopulationsInputs[0], {
      target: {
        value: "Initial Population",
      },
    });

    // Setting Denominator
    fireEvent.change(allPopulationsInputs[1], {
      target: {
        value: "Denominator",
      },
    });

    // Setting Numerator
    fireEvent.change(allPopulationsInputs[3], {
      target: {
        value: "Numerator",
      },
    });

    const addObservationLink = screen.getAllByRole("link", {
      name: /add observation/i,
    });
    expect(addObservationLink).toHaveLength(2);
    userEvent.click(addObservationLink[1]);

    // Setting numerator observation value
    const observationSelect = await screen.getByTestId(
      "select-measure-observation-numerator"
    );
    userEvent.click(getByRole(observationSelect, "button"));
    userEvent.click(screen.getByText("fun"));

    // Setting numerator aggregate value
    const aggregateSelect = screen.getByTestId(
      "select-measure-observation-aggregate-numerator"
    );
    userEvent.click(getByRole(aggregateSelect, "button"));
    userEvent.click(screen.getByText(AggregateFunctionType.MAXIMUM));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled()
    );

    mockedAxios.post.mockResolvedValue({
      data: {
        ...group,
        id: "group1-id",
        scoring: "Ratio",
        measureGroupTypes: [MeasureGroupTypes.OUTCOME],
        measureObservations: [
          {
            id: "uuid-1",
            definition: "fun",
            aggregateMethod: AggregateFunctionType.MAXIMUM,
          },
        ],
      },
    });

    expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
    userEvent.click(screen.getByTestId("group-form-submit-btn"));

    const alert = await screen.findByTestId("population-criteria-success");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(
      "Population details for this group saved successfully."
    );

    expect(mockedAxios.post.mock.calls[0][0]).toBe(
      "example-service-url/measures/test-measure/groups"
    );
    expect(mockedAxios.post.mock.calls[0][1].groupDescription).toBe("");
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "example-service-url/measures/test-measure/groups",
      expect.anything(),
      expect.anything()
    );
  }, 50000);

  test("should not show Initial Population Association for Ratio scoring when there is 1 Initial Population", async () => {
    const group1: Group = {
      id: "1",
      scoring: "Ratio",
      populations: [
        {
          id: "id-1",
          name: PopulationType.INITIAL_POPULATION,
          definition: "Initial Population",
          associationType: InitialPopulationAssociationType.NUMERATOR,
        },
      ],
      groupDescription: "",
      measureGroupTypes: [MeasureGroupTypes.PROCESS],
      populationBasis: "boolean",
      scoringUnit: "",
    };
    measure.groups = [group1];
    renderMeasureGroupComponent();

    // verify  IP1 association type radio group is not visible
    const association1 = screen.queryByTestId(
      "measure-group-initial-population-association-id-1"
    );
    await waitFor(() => expect(association1).not.toBeInTheDocument());
  });

  test("should show Initial Population Association for Ratio scoring when there are 2 Initial Populations and can change values", async () => {
    const group1: Group = {
      id: "1",
      scoring: "Ratio",
      populations: [
        {
          id: "id-1",
          name: PopulationType.INITIAL_POPULATION,
          definition: "Initial Population",
        },
        {
          id: "id-2",
          name: PopulationType.INITIAL_POPULATION,
          definition: "Initial Population",
        },
      ],
      groupDescription: "",
      measureGroupTypes: [MeasureGroupTypes.PROCESS],
      populationBasis: "boolean",
      scoringUnit: "",
    };
    measure.groups = [group1];
    renderMeasureGroupComponent();

    const association1 = screen.getByTestId(
      "measure-group-initial-population-association-id-1"
    );
    expect(association1).toBeInTheDocument();
    const ip1DenomAssociation = screen.getByTestId(
      "Initial Population 1-Denominator"
    );
    const ip1NumerAssociation = screen.getByTestId(
      "Initial Population 1-Numerator"
    );
    expect(ip1DenomAssociation).toHaveAttribute("checked", "");
    expect(ip1NumerAssociation).not.toHaveAttribute("checked", "");
    expect((ip1DenomAssociation as HTMLInputElement).checked).toEqual(true);
    expect((ip1NumerAssociation as HTMLInputElement).checked).toEqual(false);

    fireEvent.click(ip1NumerAssociation);
    await waitFor(() => {
      expect((ip1NumerAssociation as HTMLInputElement).checked).toEqual(true);
      expect((ip1DenomAssociation as HTMLInputElement).checked).toEqual(false);
    });

    // delete the IP2
    const removeIpLink = screen.getByRole("link", { name: /Remove/ });
    expect(removeIpLink).toBeInTheDocument();
    userEvent.click(removeIpLink);
    expect(association1).not.toBeInTheDocument();

    // add second IP
    const addIpLink = screen.getByRole("link", {
      name: "+ Add Initial Population",
    });

    expect(addIpLink).toBeInTheDocument();
    act(() => {
      userEvent.click(addIpLink);
    });
    await waitFor(() => {
      expect((ip1DenomAssociation as HTMLInputElement).checked).toEqual(false);
      expect((ip1NumerAssociation as HTMLInputElement).checked).toEqual(true);
    });
  });

  test("Measure Group Scoring should not render options if user is not the measure owner", async () => {
    (checkUserCanEdit as jest.Mock).mockImplementation(() => false);
    await waitFor(() => renderMeasureGroupComponent());
    const scoringSelectInput = screen.getByTestId("scoring-select-input");
    expect(scoringSelectInput).toBeDisabled();
  });

  test("Measure Group Description should not render input field if user is not the measure owner", async () => {
    (checkUserCanEdit as jest.Mock).mockImplementation(() => false);
    const { queryByTestId } = await waitFor(() =>
      renderMeasureGroupComponent()
    );
    const inputField = queryByTestId("groupDescriptionInput");
    expect(inputField).toBeDisabled();
  });

  test("Measure Group Save button should not render if user is not the measure owner", async () => {
    (checkUserCanEdit as jest.Mock).mockImplementation(() => false);
    const { queryByTestId } = await waitFor(() =>
      renderMeasureGroupComponent()
    );
    const saveButton = queryByTestId("group-form-submit-btn");
    expect(saveButton).not.toBeInTheDocument();
  });
});
