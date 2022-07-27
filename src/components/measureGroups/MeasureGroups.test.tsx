import * as React from "react";
import {
  act,
  fireEvent,
  getByRole,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { isEqual } from "lodash";
import MeasureGroups, {
  DefaultPopulationSelectorDefinitions,
} from "./MeasureGroups";
import {
  Measure,
  Group,
  GroupScoring,
  MeasureGroupTypes,
} from "@madie/madie-models";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import useCurrentMeasure from "../editMeasure/useCurrentMeasure";
import { MemoryRouter } from "react-router-dom";
import { MeasureCQL } from "../common/MeasureCQL";
import { MeasureContextHolder } from "../editMeasure/MeasureContext";
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
  terminologyService: {
    baseUrl: "terminology-service.com",
  },
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
      groupDescription: "",
      measureGroupTypes: [],
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

  test("On change of group scoring the field definitions are cleared", () => {
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
    expect(populationOption.value).toBe(group.population.initialPopulation);

    fireEvent.change(option, { target: { value: "Ratio" } });
    expect(option.value).toBe("Ratio");
    expect(populationOption.value).toBe("");
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
      population: {
        initialPopulation: "Initial Population",
      },
      scoring: "Cohort",
      groupDescription: "new description",
      measureGroupTypes: ["Patient Reported Outcome"],
      rateAggregation: "",
      improvementNotation: "",
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
  });

  test("Oncliking delete button, delete measure modal is displayed", async () => {
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
      screen.getByTestId("delete-measure-group-modal-delete-btn")
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
      screen.getByTestId("delete-measure-group-modal-delete-btn")
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
    userEvent.click(
      screen.getByTestId("delete-measure-group-modal-delete-btn")
    );

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
      population: {
        initialPopulation: "Initial Population",
      },
      scoring: "Cohort",
      groupDescription: "new description",
      measureGroupTypes: ["Patient Reported Outcome"],
      rateAggregation: "",
      improvementNotation: "",
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
      population: {
        initialPopulation: "Initial Population",
      },
      scoring: "Cohort",
      groupDescription: "new description for group 2",
      measureGroupTypes: ["Patient Reported Outcome"],
      rateAggregation: "",
      improvementNotation: "",
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
  }, 10000);

  test("Should be able to update initial population of a population group", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "testDescription";
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

    group.population.initialPopulation = definitionToUpdate;

    const measureGroupTypeSelect = getByTestId("measure-group-type-dropdown");
    userEvent.click(getByRole(measureGroupTypeSelect, "button"));
    await waitFor(() => {
      userEvent.click(getByText("Patient Reported Outcome"));
    });

    mockedAxios.put.mockResolvedValue({ data: { group } });

    const expectedGroup = {
      id: "7p03-5r29-7O0I",
      population: {
        initialPopulation:
          "VTE Prophylaxis by Medication Administered or Device Applied",
      },
      scoring: "Cohort",
      groupDescription: "testDescription",
      measureGroupTypes: ["Patient Reported Outcome"],
    };
    expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();

    // submit the form
    userEvent.click(screen.getByTestId("group-form-submit-btn"));
    const alert = await screen.findByTestId("success-alerts");
    expect(screen.getByTestId("group-form-submit-btn")).toBeDisabled();
    expect(screen.getByTestId("group-form-discard-btn")).toBeDisabled();

    expect(alert).toHaveTextContent(
      "Population details for this group updated successfully."
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

    expect(screen.getByTestId("group-form-discard-btn")).toBeEnabled();
    userEvent.click(screen.getByTestId("group-form-discard-btn"));

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
  }, 10000);

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
  }, 15000);

  test("Save button is disabled until all required CV populations are entered", async () => {
    renderMeasureGroupComponent();
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
});
