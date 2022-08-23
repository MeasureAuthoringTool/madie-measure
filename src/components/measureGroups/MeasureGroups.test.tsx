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
import MeasureGroups from "./MeasureGroups";
import {
  AggregateFunctionType,
  Group,
  GroupScoring,
  Measure,
  MeasureGroupTypes,
  PopulationType,
} from "@madie/madie-models";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import { MemoryRouter } from "react-router-dom";
import { ELM_JSON, MeasureCQL } from "../common/MeasureCQL";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import * as uuid from "uuid";
import { getPopulationsForScoring } from "./PopulationHelper";
import * as _ from "lodash";
import { measureStore } from "@madie/madie-util";
import { InitialPopulationAssociationType } from "./GroupPopulation";

// fix error about window.scrollto
global.scrollTo = jest.fn();

jest.mock("uuid", () => ({
  v4: jest.fn(),
}));

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

const emptyStrat = {
  cqlDefinition: "",
  description: "",
  association: "",
  id: "",
};

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const MEASURE_CREATEDBY = "testuser@example.com"; //#nosec
jest.mock("@madie/madie-util", () => ({
  measureStore: {
    updateMeasure: (measure) => measure,
    state: jest.fn().mockImplementation(() => null),
    initialState: jest.fn().mockImplementation(() => null),
    subscribe: (set) => {
      return { unsubscribe: () => null };
    },
  },
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
    getUserName: () => MEASURE_CREATEDBY,
  }),
  routeHandlerStore: {
    subscribe: (set) => {
      // set(measure)
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: () => null,
    state: { canTravel: false, pendingPath: "" },
    initialState: { canTravel: false, pendingPath: "" },
  },
}));

const populationBasisValues: string[] = [
  "Boolean",
  "test-data-1",
  "test-data-2",
];
mockedAxios.get.mockResolvedValue({ data: populationBasisValues });

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
        },
      ],
      groupDescription: "",
      measureGroupTypes: [],
      populationBasis: "Boolean",
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
        initialEntries={[{ pathname: "/measures/test-measure/edit/groups" }]}
      >
        <ApiContextProvider value={serviceConfig}>
          <MeasureGroups />
        </ApiContextProvider>
      </MemoryRouter>
    );
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

  test("Measure Group Scoring should not render options if user is not the measure owner", async () => {
    measure.createdBy = "AnotherUser@example.com";
    const { queryAllByTestId } = renderMeasureGroupComponent();
    const optionList = queryAllByTestId("scoring-select");
    expect(optionList).toHaveLength(0);
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
    renderMeasureGroupComponent();
    // verifies if the scoring value is population from group object
    const scoringSelectInput = screen.getByTestId(
      "scoring-select-input"
    ) as HTMLInputElement;
    expect(scoringSelectInput.value).toBe(group.scoring);

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
    await expect(groupPopulationInput.value).toBe("");
  });

  test("Should create population Group with one initial population successfully", async () => {
    renderMeasureGroupComponent();

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

    const alert = await screen.findByTestId("success-alerts");

    const expectedGroup = {
      id: null,
      populations: [
        {
          id: "uuid-1",
          name: PopulationType.INITIAL_POPULATION,
          definition: "Initial Population",
          associationType: undefined,
        },
      ],
      measureObservations: null,
      scoring: "Cohort",
      groupDescription: "new description",
      stratifications: [],
      measureGroupTypes: ["Patient Reported Outcome"],
      scoringUnit: "",
      rateAggregation: "",
      improvementNotation: "",
      populationBasis: "Boolean",
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

  test("Should create multiple group tabs on clicking add measure group ", async () => {
    renderMeasureGroupComponent();

    const groupDescriptionInput = screen.getByTestId("groupDescriptionInput");
    fireEvent.change(groupDescriptionInput, {
      target: { value: "new description" },
    });

    // select a scoring
    const scoringSelectInput = screen.getByTestId("scoring-select");
    userEvent.click(getByRole(scoringSelectInput, "button"));
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

    mockedAxios.post.mockResolvedValue({ data: { group } });

    expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
    userEvent.click(screen.getByTestId("group-form-submit-btn"));

    expect(screen.getByTestId("add-measure-group-button")).toBeInTheDocument();
    expect(screen.getByTestId("AddIcon")).toBeInTheDocument();

    userEvent.click(screen.getByTestId("add-measure-group-button"));

    expect(screen.getByText("MEASURE GROUP 2")).toBeInTheDocument();
    expect(
      screen.getByTestId("leftPanelMeasureInformation-MeasureGroup2")
    ).toBeInTheDocument();

    const measureGroup1Link = screen.getByTestId(
      "leftPanelMeasureInformation-MeasureGroup1"
    );
    expect(measureGroup1Link).toBeInTheDocument();
    userEvent.click(measureGroup1Link);
    const measureGroupTitle = screen.getByText("Measure Group 1");
    expect(measureGroupTitle).toBeInTheDocument();
  });

  test("OnClicking delete button, delete group modal is displayed", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "testDescription";
    measure.groups = [group];
    renderMeasureGroupComponent();

    expect(screen.getByText("MEASURE GROUP 1")).toBeInTheDocument();
    expect(
      screen.getByTestId("leftPanelMeasureInformation-MeasureGroup1")
    ).toBeInTheDocument();

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

    expect(screen.getByText("MEASURE GROUP 1")).toBeInTheDocument();

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
      <MemoryRouter initialEntries={[{ pathname: "/" }]}>
        <ApiContextProvider value={serviceConfig}>
          <MeasureGroups />
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
    renderMeasureGroupComponent();

    expect(screen.getByTestId("populations-tab")).toBeInTheDocument();

    expect(
      screen.getByTestId("measure-group-type-dropdown")
    ).toBeInTheDocument();
    expect(screen.getByText("MEASURE GROUP 1")).toBeInTheDocument();

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

  test("Should be able to save multiple groups  ", async () => {
    renderMeasureGroupComponent();

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

    const alert = await screen.findByTestId("success-alerts");
    expect(alert).toBeInTheDocument();

    const expectedGroup = {
      id: null,
      populations: [
        {
          id: "uuid-1",
          name: PopulationType.INITIAL_POPULATION,
          definition: "Initial Population",
        },
      ],
      measureObservations: null,
      scoring: "Cohort",
      groupDescription: "new description",
      stratifications: [],
      measureGroupTypes: ["Patient Reported Outcome"],
      scoringUnit: "",
      rateAggregation: "",
      improvementNotation: "",
      populationBasis: "Boolean",
    };

    expect(alert).toHaveTextContent(
      "Population details for this group saved successfully."
    );
    expect(mockedAxios.post).toHaveBeenNthCalledWith(
      1,
      "example-service-url/measures/test-measure/groups/",
      expectedGroup,
      expect.anything()
    );

    expect(screen.getByText("MEASURE GROUP 1")).toBeInTheDocument();
    expect(
      screen.getByTestId("leftPanelMeasureInformation-MeasureGroup1")
    ).toBeInTheDocument();

    // clear alert to reset for assertion after group 2 addition
    userEvent.click(within(alert).getByTestId("CloseIcon"));
    expect(screen.queryByTestId("success-alerts")).not.toBeInTheDocument();

    //adding measure group 2

    expect(screen.getByTestId("add-measure-group-button")).toBeInTheDocument();
    expect(screen.getByTestId("AddIcon")).toBeInTheDocument();

    userEvent.click(screen.getByTestId("add-measure-group-button"));

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

    // Change and verifies the scoring value to Cohort
    const scoringSelectInput = screen.getByTestId(
      "scoring-select-input"
    ) as HTMLInputElement;
    fireEvent.change(scoringSelectInput, {
      target: { value: "Cohort" },
    });
    expect(scoringSelectInput.value).toBe("Cohort");

    // select initial population from dropdown
    const groupPopulationInput2 = screen.getByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement;
    fireEvent.change(groupPopulationInput2, {
      target: { value: "Initial Population" },
    });
    expect(groupPopulationInput2.value).toBe("Initial Population");

    mockedAxios.post.mockResolvedValue({
      data: {
        ...group,
        id: "group2-id",
        groupDescription: "new description for group 2",
        measureGroupTypes: [MeasureGroupTypes.PATIENT_REPORTED_OUTCOME],
      },
    });

    expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
    userEvent.click(screen.getByTestId("group-form-submit-btn"));

    const alert1 = await screen.findByTestId("success-alerts");
    const expectedGroup2 = {
      id: null,
      populations: [
        {
          id: "uuid-2",
          name: PopulationType.INITIAL_POPULATION,
          definition: "Initial Population",
        },
      ],
      measureObservations: null,
      scoring: "Cohort",
      groupDescription: "new description for group 2",
      measureGroupTypes: ["Patient Reported Outcome"],
      scoringUnit: "",
      rateAggregation: "",
      improvementNotation: "",
      populationBasis: "Boolean",
      stratifications: [],
    };

    expect(alert1).toHaveTextContent(
      "Population details for this group saved successfully."
    );
    expect(mockedAxios.post).toHaveBeenNthCalledWith(
      2,
      "example-service-url/measures/test-measure/groups/",
      expectedGroup2,
      expect.anything()
    );

    expect(screen.getByText("MEASURE GROUP 2")).toBeInTheDocument();
    expect(
      screen.getByTestId("leftPanelMeasureInformation-MeasureGroup2")
    ).toBeInTheDocument();
  });

  test("Should be able to update initial population of a population group", async () => {
    group.id = "7p03-5r29-7O0I";
    group.scoringUnit = "testScoringUnit";
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
          associationType: undefined,
        },
      ],
      measureObservations: null,
      scoring: "Cohort",
      groupDescription: "",
      measureGroupTypes: ["Patient Reported Outcome"],
      populationBasis: "Boolean",
      scoringUnit: "testScoringUnit",
      improvementNotation: "",
    };
    expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();

    // submit the form
    userEvent.click(screen.getByTestId("group-form-submit-btn"));
    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        "example-service-url/measures/test-measure/groups/",
        expectedGroup,
        expect.anything()
      );
    });
    const alert = await screen.findByTestId("success-alerts");
    expect(screen.getByTestId("group-form-submit-btn")).toBeDisabled();
    expect(screen.getByTestId("group-form-discard-btn")).toBeDisabled();

    expect(alert).toHaveTextContent(
      "Population details for this group updated successfully."
    );
  });

  test("displaying a measure update warning modal while updating measure scoring and updating measure scoring for a measure group", async () => {
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
      populationBasis: "Boolean",
    };
    measure.groups = [newGroup];

    renderMeasureGroupComponent();
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

    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();

    mockedAxios.put.mockResolvedValue({ data: { newGroup } });

    const expectedGroup = {
      id: "7p03-5r29-7O0I",
      populations: [
        {
          id: "uuid-1",
          name: PopulationType.INITIAL_POPULATION,
          definition:
            "VTE Prophylaxis by Medication Administered or Device Applied",
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
      populationBasis: "Boolean",
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
      "example-service-url/measures/test-measure/groups/",
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
    renderMeasureGroupComponent();
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

    // Discard changed
    expect(screen.getByTestId("group-form-discard-btn")).toBeEnabled();
    userEvent.click(screen.getByTestId("group-form-discard-btn"));

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
      "Failed to update the group. Missing required populations for selected scoring type."
    );
  });

  test("Form displays message next to save button about required populations", () => {
    renderMeasureGroupComponent();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(
      screen.getByText("You must set all required Populations.")
    ).toBeInTheDocument();
  });

  test("Save button is disabled until all required Cohort populations are entered", async () => {
    renderMeasureGroupComponent();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

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

    fireEvent.change(allPopulationsInputs[4], {
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
    expect(aggregateOptions).toHaveLength(11);
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

  test("Measure Group Description should not render input field if user is not the measure owner", async () => {
    measure.createdBy = "AnotherUser@example.com";
    const { queryByTestId } = renderMeasureGroupComponent();
    const inputField = queryByTestId("groupDescriptionInput");
    expect(inputField).not.toBeInTheDocument();
  });

  test("Measure Group Save button should not render if user is not the measure owner", async () => {
    measure.createdBy = "AnotherUser@example.com";
    const { queryByTestId } = renderMeasureGroupComponent();
    const saveButton = queryByTestId("group-form-submit-btn");
    expect(saveButton).not.toBeInTheDocument();
  });

  test("should display default select for scoring unit", async () => {
    const { getByTestId } = renderMeasureGroupComponent();
    const scoringUnit = getByTestId("measure-group-scoring-unit");
    expect(scoringUnit.textContent).toBe("Scoring UnitUCUM Code or Name");
  });

  test("should display selected scoring unit", async () => {
    const { getByTestId } = renderMeasureGroupComponent();

    const scoringUnit = getByTestId("measure-group-scoring-unit");
    expect(scoringUnit.textContent).toBe("Scoring UnitUCUM Code or Name");

    const scoringUnitInput = within(scoringUnit).getByRole("combobox");
    expect(scoringUnitInput.getAttribute("value")).toBe("");

    fireEvent.change(scoringUnitInput, {
      target: { value: "cm" },
    });
    expect(scoringUnitInput.getAttribute("value")).toBe("cm");
  });

  test("Add new group and click Discard button should discard the changes", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "testDescription";
    measure.groups = [group];
    renderMeasureGroupComponent();
    expect(screen.getByText("Measure Group 1")).toBeInTheDocument();

    const addButton = screen.getByTestId("AddIcon");
    expect(addButton).toBeInTheDocument();
    await act(async () => {
      userEvent.click(addButton);
    });
    expect(screen.getByText("Measure Group 2")).toBeInTheDocument();

    const groupDescriptionInput = screen.getByTestId("groupDescriptionInput");
    expect(groupDescriptionInput).toBeTruthy();
    await act(async () => {
      fireEvent.change(groupDescriptionInput, {
        target: { value: "New group description" },
      });
    });
    await waitFor(
      () =>
        expect(screen.getByText("New group description")).toBeInTheDocument(),
      { timeout: 10000 }
    );

    const discardButton = screen.getByTestId("group-form-discard-btn");
    expect(discardButton).toBeEnabled();
    await act(async () => {
      userEvent.click(discardButton);
    });
    expect(screen.queryByText("New group description")).not.toBeInTheDocument();
  });

  test("Should display error message when updating group", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "testDescription";
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
      target: { value: "SDE Race" },
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
    renderMeasureGroupComponent();

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
    group.stratifications = [emptyStrat, emptyStrat];
    measure.groups = [group];
    const { queryByTestId } = renderMeasureGroupComponent();
    userEvent.click(screen.getByTestId("stratifications-tab"));
    const removebutton = queryByTestId("remove-strat-button");
    expect(removebutton).not.toBeInTheDocument();
  });

  test("Stratifications should have remove button if there are more than two", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "Description Text";
    group.rateAggregation = "Rate Aggregation Text";
    group.improvementNotation = "Increased score indicates improvement";
    group.stratifications = [emptyStrat, emptyStrat, emptyStrat];
    measure.groups = [group];
    renderMeasureGroupComponent();
    expect(screen.getByTestId("stratifications-tab")).toBeInTheDocument();
    userEvent.click(screen.getByTestId("stratifications-tab"));
    const removebutton = screen.getAllByTestId("remove-strat-button")[0];
    expect(removebutton).toBeInTheDocument();
  });

  test("Stratifications should no longer have remove button the stratifications are reduced to two", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "Description Text";
    group.rateAggregation = "Rate Aggregation Text";
    group.improvementNotation = "Increased score indicates improvement";
    group.stratifications = [emptyStrat, emptyStrat, emptyStrat];
    measure.groups = [group];
    const { queryByTestId } = renderMeasureGroupComponent();
    expect(screen.getByTestId("stratifications-tab")).toBeInTheDocument();
    userEvent.click(screen.getByTestId("stratifications-tab"));
    const removebutton = screen.getAllByTestId("remove-strat-button")[0];
    expect(removebutton).toBeInTheDocument();
    userEvent.click(removebutton);
    const removebutton2 = queryByTestId("remove-strat-button");
    expect(removebutton2).not.toBeInTheDocument();
  });

  test("Stratifications should show add button if total increased to >2", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "Description Text";
    group.rateAggregation = "Rate Aggregation Text";
    group.improvementNotation = "Increased score indicates improvement";
    group.stratifications = [emptyStrat, emptyStrat];
    measure.groups = [group];
    const { queryByTestId } = renderMeasureGroupComponent();
    userEvent.click(screen.getByTestId("stratifications-tab"));
    const removebutton = queryByTestId("remove-strat-button");
    expect(removebutton).not.toBeInTheDocument();
    const addbutton = queryByTestId("add-strat-button");
    userEvent.click(addbutton);
    const removebutton2 = screen.getAllByTestId("remove-strat-button")[0];
    expect(removebutton2).toBeInTheDocument();
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
    expect(group.stratifications.length == 2);
    expect(group.stratifications[0] === emptyStrat);
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

    await waitFor(() =>
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "example-service-url/populationBasisValues",
        expect.anything()
      )
    );

    expect(
      await screen.findByTestId("population-basis-combo-box")
    ).toBeInTheDocument();

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

    await waitFor(() =>
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "example-service-url/populationBasisValues",
        expect.anything()
      )
    );

    expect(
      await screen.findByTestId("population-basis-combo-box")
    ).toBeInTheDocument();

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
      },
    ];
    measure.groups = [group];
    renderMeasureGroupComponent();

    await waitFor(() =>
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "example-service-url/populationBasisValues",
        expect.anything()
      )
    );

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
    renderMeasureGroupComponent();

    await waitFor(() =>
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "example-service-url/populationBasisValues",
        expect.anything()
      )
    );

    const numeratorObservationInput = screen.getByTestId(
      "measure-observation-numerator-input"
    ) as HTMLInputElement;
    expect(numeratorObservationInput).toHaveValue("fun");

    const numeratorAggregateFunctionInput = screen.getByTestId(
      "measure-observation-aggregate-numerator-input"
    ) as HTMLInputElement;
    expect(numeratorAggregateFunctionInput).toBeInTheDocument();
    expect(numeratorAggregateFunctionInput.value).toEqual("Average");
  });

  test("measure observation should be included in persisted output for continuous variable", async () => {
    renderMeasureGroupComponent();

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
    expect(aggregateOptions).toHaveLength(11);
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

    const alert = await screen.findByTestId("success-alerts");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(
      "Population details for this group saved successfully."
    );
    const expectedGroup = {
      id: null,
      populations: [
        {
          id: "uuid-2",
          name: PopulationType.INITIAL_POPULATION,
          definition: "Initial Population",
          associationType: undefined,
        },
        {
          id: "uuid-3",
          name: PopulationType.MEASURE_POPULATION,
          definition: "Denominator",
          associationType: undefined,
        },
        {
          id: "uuid-4",
          name: PopulationType.MEASURE_POPULATION_EXCLUSION,
          definition: "",
          associationType: undefined,
          optional: ["Continuous Variable"],
        },
      ],
      measureObservations: [
        {
          id: "uuid-1",
          definition: "fun",
          aggregateMethod: AggregateFunctionType.COUNT,
          criteriaReference: null,
        },
      ],
      scoring: "Continuous Variable",
      groupDescription: "",
      stratifications: [],
      measureGroupTypes: ["Patient Reported Outcome"],
      scoringUnit: "",
      rateAggregation: "",
      improvementNotation: "",
      populationBasis: "Boolean",
    };
    expect(mockedAxios.post).toHaveBeenNthCalledWith(
      1,
      "example-service-url/measures/test-measure/groups/",
      expectedGroup,
      expect.anything()
    );
  });

  test("measure observation should be included in persisted output for ratio", async () => {
    renderMeasureGroupComponent();

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

    const alert = await screen.findByTestId("success-alerts");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(
      "Population details for this group saved successfully."
    );
    const expectedGroup = {
      id: null,
      populations: [
        {
          id: "uuid-1",
          name: PopulationType.INITIAL_POPULATION,
          definition: "Initial Population",
          // TODO: look into why this is the case - is this a bug?
          associationType: InitialPopulationAssociationType.DENOMINATOR,
        },
        {
          id: "uuid-2",
          name: PopulationType.DENOMINATOR,
          definition: "Denominator",
          associationType: undefined,
        },
        {
          id: "uuid-3",
          name: PopulationType.DENOMINATOR_EXCLUSION,
          definition: "",
          associationType: undefined,
          optional: ["*"],
        },
        {
          id: "uuid-4",
          name: PopulationType.NUMERATOR,
          definition: "Numerator",
          associationType: undefined,
        },
        {
          id: "uuid-5",
          name: PopulationType.NUMERATOR_EXCLUSION,
          definition: "",
          associationType: undefined,
          optional: ["Proportion", "Ratio"],
        },
      ],
      measureObservations: [
        {
          id: "uuid-6",
          definition: "fun",
          aggregateMethod: AggregateFunctionType.MAXIMUM,
          criteriaReference: "uuid-4",
        },
      ],
      scoring: "Ratio",
      groupDescription: "",
      stratifications: [],
      measureGroupTypes: ["Outcome"],
      scoringUnit: "",
      rateAggregation: "",
      improvementNotation: "",
      populationBasis: "Boolean",
    };
    expect(mockedAxios.post).toHaveBeenNthCalledWith(
      1,
      "example-service-url/measures/test-measure/groups/",
      expectedGroup,
      expect.anything()
    );
  }, 30000);
});
