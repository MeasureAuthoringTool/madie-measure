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
  Measure,
  Group,
  GroupScoring,
  MeasureGroupTypes,
  PopulationType,
} from "@madie/madie-models";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import useCurrentMeasure from "../editMeasure/useCurrentMeasure";
import { MemoryRouter } from "react-router-dom";
import { MeasureCQL } from "../common/MeasureCQL";
import { MeasureContextHolder } from "../editMeasure/MeasureContext";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { getPopulationsForScoring } from "./PopulationHelper";
import * as _ from "lodash";

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
  terminologyService: {
    baseUrl: "terminology-service.com",
  },
};

const EmptyStrat = {
  cqlDefinition: "",
  description: "",
  association: "",
  id: "",
};

const DeleteStrat = {
  cqlDefinition: "delete",
  description: "delete",
  association: "delete",
  id: "",
};

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const MEASURE_CREATEDBY = "testuser@example.com"; //#nosec
jest.mock("@madie/madie-util", () => ({
  measureStore: {
    updateMeasure: (measure) => measure,
  },
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
    getUserName: () => MEASURE_CREATEDBY,
  }),
}));

const populationBasisValues: string[] = [
  "Boolean",
  "test-data-1",
  "test-data-2",
];
mockedAxios.get.mockResolvedValue({ data: { populationBasisValues } });

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
      measureName: "the measure for testing",
      cql: MeasureCQL,
      createdBy: MEASURE_CREATEDBY,
    } as Measure;
    measureContextHolder = {
      measure,
      setMeasure: jest.fn(),
    };
    useCurrentMeasureMock.mockImplementation(() => measureContextHolder);

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

  test("Measure Group Scoring renders to correct options length, and defaults to Select", async () => {
    const { getAllByTestId } = renderMeasureGroupComponent();
    const optionList = getAllByTestId("scoring-unit-option");
    expect(optionList).toHaveLength(5);
    expect(optionList[0].textContent).toBe("Select");
  });

  test("Measure Group Scoring should not render options if user is not the measure owner", async () => {
    measure.createdBy = "AnotherUser@example.com";
    const { queryAllByTestId } = renderMeasureGroupComponent();
    const optionList = queryAllByTestId("scoring-unit-option");
    expect(optionList).toHaveLength(0);
  });

  test("MeasureGroups renders a list of definitions based on parsed CQL", async () => {
    renderMeasureGroupComponent();

    // Test that each Scoring Unit selection displays the correct population filters
    await act(async () => {
      for await (let value of Object.values(GroupScoring)) {
        // Change the selection value
        userEvent.selectOptions(screen.getByTestId("scoring-unit-select"), [
          screen.getByText(value),
        ]);
        let optionEl = screen.getByRole("option", {
          name: value,
        }) as HTMLOptionElement;
        expect(optionEl.selected).toBe(true);

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

        // Check what is actually rendered
        if (optionEl.text !== "Select") {
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

    const definitions = await screen.findAllByTestId(
      "select-measure-group-population"
    );
    for await (let def of definitions) {
      let options = def.getElementsByTagName("option");
      expect(options.length).toBe(11);
      expect(def[0].textContent).toBe("SDE Ethnicity");
    }
  });

  test("On change of group scoring the field definitions are cleared", async () => {
    group.id = "";
    group.scoring = "Cohort";
    measure.groups = [group];
    renderMeasureGroupComponent();
    expect(
      (screen.getByRole("option", { name: "Cohort" }) as HTMLOptionElement)
        .selected
    ).toBe(true);
    const scoringUnitOption = screen.getByTestId(
      "scoring-unit-select"
    ) as HTMLOptionElement;

    const populationOption = screen.getAllByTestId(
      "select-measure-group-population"
    )[0] as HTMLOptionElement;
    expect(populationOption.value).toBe(group.populations[0].definition);

    fireEvent.change(scoringUnitOption, { target: { value: "Ratio" } });
    expect(scoringUnitOption.value).toBe("Ratio");
    await waitFor(() => {
      const selectedPopulationOption = screen.getAllByTestId(
        "select-measure-group-population"
      )[0] as HTMLOptionElement;
      expect(selectedPopulationOption.value).toBe("");
    });
  });

  test("onKeyPress prevents default and selected scoring does not change", async () => {
    group.id = "";
    group.scoring = "Cohort";
    measure.groups = [group];
    renderMeasureGroupComponent();
    expect(
      (screen.getByRole("option", { name: "Cohort" }) as HTMLOptionElement)
        .selected
    ).toBe(true);
    const option = screen.getByTestId(
      "scoring-unit-select"
    ) as HTMLOptionElement;

    const populationOption = screen.getAllByTestId(
      "select-measure-group-population"
    )[0] as HTMLOptionElement;
    expect(populationOption.value).toBe(group.populations[0].definition);

    await act(async () => {
      fireEvent.change(option, { target: { value: "Ratio" } });
    });
    expect(option.value).toBe("Ratio");
    expect(populationOption.value).toBe("");

    act(() => {
      fireEvent.keyPress(option, { key: "Enter", code: 13, charCode: 13 });
    });
    expect(option.value).toBe("Ratio");
  });

  test("Should create population Group with one initial population successfully", async () => {
    const { getByTestId, getByText } = renderMeasureGroupComponent();
    userEvent.selectOptions(
      screen.getByTestId("scoring-unit-select"),
      "Cohort"
    );
    // select initial population from dropdown
    userEvent.selectOptions(
      screen.getByTestId("select-measure-group-population"),
      "Initial Population"
    );
    expect(
      (
        screen.getByRole("option", {
          name: "Initial Population",
        }) as HTMLOptionElement
      ).selected
    ).toBe(true);

    const input = getByTestId("groupDescriptionInput");
    fireEvent.change(input, {
      target: { value: "new description" },
    });

    const measureGroupTypeSelect = getByTestId("measure-group-type-dropdown");
    userEvent.click(getByRole(measureGroupTypeSelect, "button"));
    await waitFor(() => {
      userEvent.click(getByText("Patient Reported Outcome"));
    });

    expect(screen.getByTestId("group-form-delete-btn")).toBeInTheDocument();
    expect(screen.getByTestId("group-form-delete-btn")).toBeDisabled();

    mockedAxios.post.mockResolvedValue({ data: { group } });

    // submit the form
    expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
    userEvent.click(screen.getByTestId("group-form-submit-btn"));

    const alert = await screen.findByTestId("success-alerts");

    const expectedGroup = {
      id: null,
      populations: [
        {
          id: "",
          name: PopulationType.INITIAL_POPULATION,
          definition: "Initial Population",
        },
      ],
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
    const { getByTestId } = renderMeasureGroupComponent();
    userEvent.selectOptions(
      screen.getByTestId("scoring-unit-select"),
      "Cohort"
    );
    // select initial population from dropdown
    userEvent.selectOptions(
      screen.getByTestId("select-measure-group-population"),
      "Initial Population"
    );
    expect(
      (
        screen.getByRole("option", {
          name: "Initial Population",
        }) as HTMLOptionElement
      ).selected
    ).toBe(true);

    const input = getByTestId("groupDescriptionInput");
    fireEvent.change(input, {
      target: { value: "new description" },
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

    expect(
      (screen.getByRole("option", { name: "Cohort" }) as HTMLOptionElement)
        .selected
    ).toBe(true);

    expect(
      (
        screen.getByRole("option", {
          name: "Initial Population",
        }) as HTMLOptionElement
      ).selected
    ).toBe(true);

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

  test("Oncliking delete button, measure group should be deleted", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "testDescription";
    measure.groups = [group];
    const { rerender } = renderMeasureGroupComponent();

    expect(
      (screen.getByRole("option", { name: "Cohort" }) as HTMLOptionElement)
        .selected
    ).toBe(true);

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
      (screen.getByRole("option", { name: "Cohort" }) as HTMLOptionElement)
        .selected
    ).toBe(true);
    expect(
      screen.getByTestId("measure-group-type-dropdown")
    ).toBeInTheDocument();
    expect(screen.getByText("MEASURE GROUP 1")).toBeInTheDocument();

    userEvent.click(screen.getByTestId("reporting-tab"));

    expect(screen.getByTestId("rateAggregationText")).toHaveValue(
      "Rate Aggregation Text"
    );
    expect(
      (
        screen.getByRole("option", {
          name: "Increased score indicates improvement",
        }) as HTMLOptionElement
      ).selected
    ).toBe(true);
    expect(screen.getByTestId("group-form-delete-btn")).toBeEnabled();
  });

  test("Should be able to save multiple groups  ", async () => {
    renderMeasureGroupComponent();

    // measure group type
    const measureGroupTypeSelect = screen.getByTestId(
      "measure-group-type-dropdown"
    );
    userEvent.click(getByRole(measureGroupTypeSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText("Patient Reported Outcome"));
    });
    // after selecting measure group type, need to collapse the dropdown
    fireEvent.click(screen.getByRole("presentation").firstChild);

    // scoring type select
    userEvent.selectOptions(
      screen.getByTestId("scoring-unit-select"),
      "Cohort"
    );

    // select initial population from dropdown
    userEvent.selectOptions(
      screen.getByTestId("select-measure-group-population"),
      "Initial Population"
    );

    expect(
      (
        screen.getByRole("option", {
          name: "Initial Population",
        }) as HTMLOptionElement
      ).selected
    ).toBe(true);

    const input = screen.getByTestId("groupDescriptionInput");
    fireEvent.change(input, {
      target: { value: "new description" },
    });

    mockedAxios.post.mockResolvedValue({ data: { group } });

    expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
    userEvent.click(screen.getByTestId("group-form-submit-btn"));

    const alert = await screen.findByTestId("success-alerts");

    const expectedGroup = {
      id: null,
      populations: [
        {
          id: "",
          name: PopulationType.INITIAL_POPULATION,
          definition: "Initial Population",
        },
      ],
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

    expect(screen.getByText("MEASURE GROUP 1")).toBeInTheDocument();
    expect(
      screen.getByTestId("leftPanelMeasureInformation-MeasureGroup1")
    ).toBeInTheDocument();

    //adding measure group 2

    expect(screen.getByTestId("add-measure-group-button")).toBeInTheDocument();
    expect(screen.getByTestId("AddIcon")).toBeInTheDocument();

    userEvent.click(screen.getByTestId("add-measure-group-button"));

    userEvent.selectOptions(
      screen.getByTestId("scoring-unit-select"),
      "Cohort"
    );
    // select initial population from dropdown
    userEvent.selectOptions(
      screen.getByTestId("select-measure-group-population"),
      "Initial Population"
    );
    expect(
      (
        screen.getByRole("option", {
          name: "Initial Population",
        }) as HTMLOptionElement
      ).selected
    ).toBe(true);

    const newMeasureInput = screen.getByTestId("groupDescriptionInput");
    fireEvent.change(newMeasureInput, {
      target: { value: "new description for group 2" },
    });

    const measureGroupTypeSelect2 = screen.getByTestId(
      "measure-group-type-dropdown"
    );
    userEvent.click(await getByRole(measureGroupTypeSelect2, "button"));

    await waitFor(() => {
      userEvent.click(screen.getByText("Patient Reported Outcome"));
    });

    // after selecting measure group type, need to collapse the dropdown
    fireEvent.click(screen.getByRole("presentation").firstChild);

    mockedAxios.post.mockResolvedValue({ data: { group } });

    expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
    userEvent.click(screen.getByTestId("group-form-submit-btn"));

    const alert1 = await screen.findByTestId("success-alerts");
    const expectedGroup2 = {
      id: null,
      populations: [
        {
          id: "",
          name: PopulationType.INITIAL_POPULATION,
          definition: "Initial Population",
        },
      ],
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
    expect(mockedAxios.post).toHaveBeenCalledWith(
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
    expect(
      (
        screen.getByRole("option", {
          name: "Initial Population",
        }) as HTMLOptionElement
      ).selected
    ).toBe(true);

    const definitionToUpdate =
      "VTE Prophylaxis by Medication Administered or Device Applied";
    // update initial population from dropdown
    userEvent.selectOptions(
      screen.getByTestId("select-measure-group-population"),
      screen.getByText(definitionToUpdate)
    );

    expect(
      (
        screen.getByRole("option", {
          name: definitionToUpdate,
        }) as HTMLOptionElement
      ).selected
    ).toBe(true);

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
        },
      ],
      scoring: "Cohort",
      groupDescription: "",
      measureGroupTypes: ["Patient Reported Outcome"],
      populationBasis: "Boolean",
      scoringUnit: "testScoringUnit",
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
    expect(
      (
        screen.getByRole("option", {
          name: "Continuous Variable",
        }) as HTMLOptionElement
      ).selected
    ).toBe(true);

    userEvent.selectOptions(
      screen.getByTestId("scoring-unit-select"),
      "Cohort"
    );

    expect(
      (screen.getByRole("option", { name: "Cohort" }) as HTMLOptionElement)
        .selected
    ).toBe(true);

    const definitionToUpdate =
      "VTE Prophylaxis by Medication Administered or Device Applied";
    userEvent.selectOptions(
      screen.getByTestId("select-measure-group-population"),
      screen.getByText(definitionToUpdate)
    );
    expect(
      (
        screen.getByRole("option", {
          name: definitionToUpdate,
        }) as HTMLOptionElement
      ).selected
    ).toBe(true);

    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();

    mockedAxios.put.mockResolvedValue({ data: { newGroup } });

    const expectedGroup = {
      id: "7p03-5r29-7O0I",
      populations: [
        {
          id: "",
          name: PopulationType.INITIAL_POPULATION,
          definition:
            "VTE Prophylaxis by Medication Administered or Device Applied",
        },
      ],
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

  test("Onclicking discard button,should be able to discard the changes", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "testDescription";
    group.rateAggregation = "Rate Aggregation Text";
    group.improvementNotation = "Increased score indicates improvement";
    measure.groups = [group];
    renderMeasureGroupComponent();
    expect(
      (screen.getByRole("option", { name: "Cohort" }) as HTMLOptionElement)
        .selected
    ).toBe(true);
    expect(
      (
        screen.getByRole("option", {
          name: "Initial Population",
        }) as HTMLOptionElement
      ).selected
    ).toBe(true);
    const definitionToUpdate =
      "VTE Prophylaxis by Medication Administered or Device Applied";
    // update initial population from dropdown
    userEvent.selectOptions(
      screen.getByTestId("select-measure-group-population"),
      screen.getByText(definitionToUpdate)
    );
    expect(
      (
        screen.getByRole("option", {
          name: definitionToUpdate,
        }) as HTMLOptionElement
      ).selected
    ).toBe(true);
    userEvent.click(screen.getByTestId("reporting-tab"));
    const input = screen.getByTestId("rateAggregationText");
    fireEvent.change(input, {
      target: { value: "New rate aggregation text" },
    });
    expect(screen.getByTestId("group-form-discard-btn")).toBeEnabled();
    userEvent.click(screen.getByTestId("group-form-discard-btn"));
    expect(screen.getByTestId("rateAggregationText")).toHaveValue(
      "Rate Aggregation Text"
    );
    userEvent.click(screen.getByTestId("populations-tab"));
    expect(
      (
        screen.getByRole("option", {
          name: "Initial Population",
        }) as HTMLOptionElement
      ).selected
    ).toBe(true);
    expect(screen.getByTestId("group-form-discard-btn")).toBeDisabled();
  });

  test("Should report an error if create population Group fails", async () => {
    const { getByTestId, getByText } = renderMeasureGroupComponent();
    userEvent.selectOptions(
      screen.getByTestId("scoring-unit-select"),
      "Cohort"
    );
    // select initial population from dropdown
    userEvent.selectOptions(
      screen.getByTestId("select-measure-group-population"),
      ["Initial Population"]
    );

    expect(
      (
        screen.getByRole("option", {
          name: "Initial Population",
        }) as HTMLOptionElement
      ).selected
    ).toBe(true);

    const measureGroupTypeSelect = getByTestId("measure-group-type-dropdown");
    userEvent.click(getByRole(measureGroupTypeSelect, "button"));
    await waitFor(() => {
      userEvent.click(getByText("Patient Reported Outcome"));
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
    group.populationBasis = "Boolean";
    measure.groups = [group];
    renderMeasureGroupComponent();
    // update initial population from dropdown
    const definitionToUpdate =
      "VTE Prophylaxis by Medication Administered or Device Applied";
    userEvent.selectOptions(
      screen.getByTestId("select-measure-group-population"),
      screen.getByText(definitionToUpdate)
    );

    expect(
      (
        screen.getByRole("option", {
          name: definitionToUpdate,
        }) as HTMLOptionElement
      ).selected
    ).toBe(true);

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
    group.populationBasis = "Boolean";
    measure.groups = [group];
    renderMeasureGroupComponent();
    // update initial population from dropdown
    const definitionToUpdate =
      "VTE Prophylaxis by Medication Administered or Device Applied";
    userEvent.selectOptions(
      screen.getByTestId("select-measure-group-population"),
      screen.getByText(definitionToUpdate)
    );

    expect(
      (
        screen.getByRole("option", {
          name: definitionToUpdate,
        }) as HTMLOptionElement
      ).selected
    ).toBe(true);

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
    expect(alert).toBeInTheDocument();
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
    userEvent.selectOptions(
      screen.getByTestId("scoring-unit-select"),
      "Cohort"
    );
    userEvent.selectOptions(
      screen.getByTestId("select-measure-group-population"),
      "Initial Population"
    );
    const option = screen.getByRole("option", {
      name: "Initial Population",
    }) as HTMLOptionElement;
    expect(option.selected).toBe(true);
    expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();
  });

  test("Save button is disabled until all required Proportion populations are entered", async () => {
    renderMeasureGroupComponent();
    userEvent.selectOptions(
      screen.getByTestId("scoring-unit-select"),
      "Proportion"
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    await waitFor(() => {
      expect(screen.getAllByRole("option", { name: "SDE Payer" })).toHaveLength(
        6
      );
    });
    userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Initial Population *" }),
      "Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions"
    );
    userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Denominator *" }),
      "Denominator"
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
    );
    expect(
      screen.getByText("You must set all required Populations.")
    ).toBeInTheDocument();
    userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Numerator *" }),
      "Numerator"
    );
    const measureGroupTypeSelect = screen.getByTestId(
      "measure-group-type-dropdown"
    );
    userEvent.click(getByRole(measureGroupTypeSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText("Patient Reported Outcome"));
    });
    await waitFor(() =>
      expect(screen.getByTestId("group-form-submit-btn")).not.toBeDisabled()
    );
  });

  test("Save button is disabled until all required Ratio populations are entered", async () => {
    renderMeasureGroupComponent();
    userEvent.selectOptions(screen.getByTestId("scoring-unit-select"), "Ratio");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    await waitFor(() => {
      expect(screen.getAllByRole("option", { name: "SDE Payer" })).toHaveLength(
        5
      );
    });
    userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Initial Population *" }),
      "Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions"
    );
    userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Denominator *" }),
      "Denominator"
    );
    userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Denominator Exclusion" }),
      "Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions"
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
    );
    expect(
      screen.getByText("You must set all required Populations.")
    ).toBeInTheDocument();
    userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Numerator *" }),
      "Numerator"
    );
    expect(
      screen.getByRole("combobox", { name: "Initial Population *" })
    ).toHaveValue(
      "Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions"
    );
    expect(screen.getByRole("combobox", { name: "Denominator *" })).toHaveValue(
      "Denominator"
    );
    expect(screen.getByRole("combobox", { name: "Numerator *" })).toHaveValue(
      "Numerator"
    );
    const measureGroupTypeSelect = screen.getByTestId(
      "measure-group-type-dropdown"
    );
    userEvent.click(getByRole(measureGroupTypeSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText("Patient Reported Outcome"));
    });
    await waitFor(() =>
      expect(screen.getByTestId("group-form-submit-btn")).not.toBeDisabled()
    );
  });

  test("Save button is disabled until all required CV populations are entered", async () => {
    renderMeasureGroupComponent();
    const measureGroupTypeDropdown = screen.getByTestId(
      "measure-group-type-dropdown"
    );
    userEvent.click(await getByRole(measureGroupTypeDropdown, "button"));

    await waitFor(() => {
      userEvent.click(screen.getByText("Patient Reported Outcome"));
    });

    // after selecting measure group type, need to collapse the dropdown
    fireEvent.click(screen.getByRole("presentation").firstChild);

    userEvent.selectOptions(
      screen.getByTestId("scoring-unit-select"),
      "Continuous Variable"
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    await waitFor(() => {
      expect(screen.getAllByRole("option", { name: "SDE Payer" })).toHaveLength(
        3
      );
    });
    userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Initial Population *" }),
      "Initial Population"
    );
    userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Measure Population *" }),
      "Denominator"
    );
    expect(
      screen.getByRole("combobox", { name: "Initial Population *" })
    ).toHaveValue("Initial Population");
    expect(
      screen.getByRole("combobox", { name: "Measure Population *" })
    ).toHaveValue("Denominator");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled()
    );
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
    expect(screen.getByText("New group description")).toBeInTheDocument();

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
    expect(screen.getByText("Error updating group")).toBeInTheDocument();
  });

  test("Should display error message when adding group", async () => {
    measure.groups = [];
    renderMeasureGroupComponent();
    expect(screen.getByText("Measure Group 1")).toBeInTheDocument();

    const groupDescriptionInput = screen.getByTestId("groupDescriptionInput");
    expect(groupDescriptionInput).toBeTruthy();
    await act(async () => {
      fireEvent.change(groupDescriptionInput, {
        target: { value: "New group description" },
      });
    });
    expect(screen.getByText("New group description")).toBeInTheDocument();

    const measureGroupTypeSelect = screen.getByTestId(
      "measure-group-type-dropdown"
    );
    userEvent.click(getByRole(measureGroupTypeSelect, "button"));
    await waitFor(() => {
      userEvent.click(screen.getByText("Patient Reported Outcome"));
    });

    const groupScoringSelect = screen.getByTestId("scoring-unit-select");
    await act(async () => {
      fireEvent.change(groupScoringSelect, {
        target: { value: "Cohort" },
      });
    });

    const populationSelect = screen.getByTestId(
      "select-measure-group-population"
    );
    await act(async () => {
      fireEvent.change(populationSelect, {
        target: { value: "SDE Race" },
      });
    });

    mockedAxios.put.mockResolvedValue({ data: null });

    expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
    await act(async () => {
      userEvent.click(screen.getByTestId("group-form-submit-btn"));
    });
    expect(screen.getByText("Failed to create the group.")).toBeInTheDocument();
  });

  test("Add/remove second IP for ratio group", () => {
    renderMeasureGroupComponent();
    userEvent.selectOptions(screen.getByTestId("scoring-unit-select"), "Ratio");
    // initial population available for ratio scoring
    expect(
      screen.getByRole("combobox", {
        name: "Initial Population *",
      })
    ).toBeInTheDocument();

    const addIpLink = screen.getByRole("link", {
      name: "+ Add Initial Population",
    });
    // add second ip
    expect(addIpLink).toBeInTheDocument();
    userEvent.click(addIpLink);

    // verify  IP1 and IP2 visible
    expect(
      screen.getByRole("combobox", {
        name: "Initial Population 1 *",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", {
        name: "Initial Population 2 *",
      })
    ).toBeInTheDocument();

    // delete the IP2
    const removeIpLink = screen.getByRole("link", { name: /Remove/ });
    expect(removeIpLink).toBeInTheDocument();
    userEvent.click(removeIpLink);

    // IP is back
    expect(
      screen.getByRole("combobox", {
        name: "Initial Population *",
      })
    ).toBeInTheDocument();

    // no more IP1 & IP2 in the document
    expect(
      screen.queryByRole("combobox", {
        name: "Initial Population 1 *",
      })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", {
        name: "Initial Population 2 *",
      })
    ).not.toBeInTheDocument();
  });
  test("Stratifications Should Not Have Remove Button if there are only two", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "Description Text";
    group.rateAggregation = "Rate Aggregation Text";
    group.improvementNotation = "Increased score indicates improvement";
    group.stratifications = [EmptyStrat, EmptyStrat];
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
    group.stratifications = [EmptyStrat, EmptyStrat, EmptyStrat];
    measure.groups = [group];
    const { queryByTestId } = renderMeasureGroupComponent();
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
    group.stratifications = [EmptyStrat, EmptyStrat, EmptyStrat];
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
    group.stratifications = [EmptyStrat, EmptyStrat];
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
});
