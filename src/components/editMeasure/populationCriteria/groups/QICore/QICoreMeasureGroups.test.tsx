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
import { getPopulationsForScoring } from "../../PopulationHelper";
import * as _ from "lodash";
// @ts-ignore
import {
  measureStore,
  MeasureServiceApi,
  useFeatureFlags,
} from "@madie/madie-util";
import { InitialPopulationAssociationType } from "../groupPopulations/GroupPopulation";
// fix error about window.scrollto
global.scrollTo = jest.fn();

jest.mock("uuid", () => ({
  v4: jest.fn(),
}));

jest.setTimeout(40000);

const serviceConfig = {
  measureService: {
    baseUrl: "example-service-url",
  },
  qdmElmTranslationService: {
    baseUrl: "qdm-test-elm-service",
  },
  fhirElmTranslationService: {
    baseUrl: "fhir-test-elm-service",
  },
  terminologyService: {
    baseUrl: "terminology-service.com",
  },
} as ServiceConfig;

const getEmptyStrat = () => ({
  cqlDefinition: "",
  description: "",
  association: null,
  associations: [],
  id: "",
});

const MEASURE_CREATEDBY = "testuser@example.com"; //#nosec
const populationBasisValues: string[] = [
  "boolean",
  "Encounter",
  "Medication Administration",
  "test-data-1",
  "test-data-2",
];
const outerScopeMeasure: Measure = {
  id: "test-measure",
  measureName: "the measure for testing",
  cql: MeasureCQL,
  elmJson: ELM_JSON,
  createdBy: MEASURE_CREATEDBY,
} as Measure;
const outerScopeGroup: Group = {
  id: "df675##7p03-5r29-7O0I",
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
  scoringPrecision: "",
} as unknown as Group;
const mockMeasureServiceApi: MeasureServiceApi = {
  updateMeasure: jest.fn(),
  updateGroup: jest.fn().mockResolvedValue(outerScopeGroup),
  createGroup: jest.fn().mockResolvedValue(outerScopeGroup),
  fetchMeasure: jest.fn().mockResolvedValue(outerScopeMeasure),
  deleteMeasureGroup: jest.fn().mockResolvedValue(outerScopeMeasure),
  unlockMeasure: jest.fn(),
  updateMeasureLock: jest.fn(),
  getReturnTypesForAllCqlFunctions: jest.fn(),
  getReturnTypesForAllCqlDefinitions: jest.fn(),
  getAllPopulationBasisOptions: jest
    .fn()
    .mockResolvedValue(populationBasisValues),
} as unknown as MeasureServiceApi;

jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
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
  useFeatureFlags: jest.fn(() => ({})),
  routeHandlerStore: {
    subscribe: () => {
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: () => null,
    state: { canTravel: false, pendingPath: "" },
    initialState: { canTravel: false, pendingPath: "" },
  },
}));

const props: MeasureGroupProps = {
  measureGroupNumber: 0,
  setMeasureGroupNumber: jest.fn,
  setIsFormDirty: jest.fn,
  measureId: "testMeasureId",
  setAlertMessage: jest.fn,
  checkTestCasesLockStatus: jest.fn().mockResolvedValue(false),
  isTestCaseLocked: true,
  measureCanEdit: false,
};
const customProps: MeasureGroupProps = {
  ...props,
  isTestCaseLocked: false,
  measureCanEdit: true,
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
      measureMetaData: { composite: false },
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
      scoringPrecision: "",
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

  const renderMeasureGroupComponent = (customProps = props) => {
    const mergedProps = { ...props, ...customProps };
    return render(
      <MemoryRouter
        initialEntries={[{ pathname: "/measures/test-measure/edit/groups/1" }]}
      >
        <ApiContextProvider value={serviceConfig}>
          <Routes>
            <Route
              path="/measures/test-measure/edit/groups/:groupNumber"
              element={<MeasureGroups {...mergedProps} />}
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

  describe("Regular non-composite measure tests", () => {
    test("Measure Group Scoring renders to correct options length, and defaults to empty string", async () => {
      renderMeasureGroupComponent(customProps);
      const scoringSelectInput = screen.getByTestId(
        "scoring-select-input"
      ) as HTMLInputElement;
      expect(scoringSelectInput.value).toBe("");
      // options will be rendered only after clicking the select,
      const scoringSelect = screen.getByTestId("scoring-select");
      userEvent.click(getByRole(scoringSelect, "combobox"));
      const optionsList = await screen.findAllByTestId(/group-scoring-option/i);
      expect(optionsList).toHaveLength(4);
    });

    // Todo Need to fix this test case
    test.skip("MeasureGroups renders a list of definitions based on parsed CQL", async () => {
      renderMeasureGroupComponent(customProps);

      // Test that each Scoring selection displays the correct population filters
      await act(async () => {
        for await (let value of Object.values(GroupScoring)) {
          // select a scoring
          const scoringSelect = screen.getByTestId("scoring-select");
          userEvent.click(getByRole(scoringSelect, "combobox"));
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

      await waitFor(() => renderMeasureGroupComponent(customProps));
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
      await waitFor(() => expect(groupPopulationInput.value).toBe(""));
    });

    test("Should create population Group with one initial population successfully", async () => {
      const populationBasis = "Encounter";
      await waitFor(() => renderMeasureGroupComponent(customProps));
      await changePopulationBasis(populationBasis);

      const descriptionEditor = screen.getByTestId(
        "group-description-rich-text-editor"
      );
      expect(descriptionEditor).toBeInTheDocument();

      const editableContent = within(descriptionEditor).getByRole("textbox");
      expect(editableContent).toHaveAttribute("contenteditable", "true");

      await act(async () => {
        fireEvent.focus(editableContent);
        fireEvent.input(editableContent, {
          target: { innerHTML: "new description" },
        });
        fireEvent.blur(editableContent);
      });

      // Wait for debounced update to take effect (250ms delay from TextEditor component)
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });

      // select a scoring
      const scoringSelect = screen.getByTestId("scoring-select");
      userEvent.click(getByRole(scoringSelect, "combobox"));
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
      const descriptionEditor1 = screen.getByTestId(
        "populations-0-description-rich-text-editor"
      );
      expect(descriptionEditor1).toBeInTheDocument();

      const editableContent1 = within(descriptionEditor1).getByRole("textbox");
      expect(editableContent1).toHaveAttribute("contenteditable", "true");

      await act(async () => {
        fireEvent.focus(editableContent1);
        editableContent1.innerHTML = "newVal";
        fireEvent.input(editableContent1, {
          target: { innerHTML: "newVal" },
        });
        fireEvent.blur(editableContent1);
      });

      // Wait for debounced update to take effect (250ms delay from TextEditor component)
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });
      expect(editableContent1).toHaveTextContent("newVal");

      // Select measure group type
      const measureGroupTypeSelect = screen.getByTestId(
        "measure-group-type-dropdown"
      );
      userEvent.click(getByRole(measureGroupTypeSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(screen.getByText("Patient Reported Outcome"));
      });

      expect(screen.getByTestId("group-form-delete-btn")).toBeInTheDocument();
      expect(screen.getByTestId("group-form-delete-btn")).toBeDisabled();

      userEvent.click(screen.getByTestId("reporting-tab"));

      const improvementNotationSelect = screen.getByTestId(
        "improvement-notation-select"
      ) as HTMLInputElement;

      userEvent.click(await getByRole(improvementNotationSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(
          screen.getByText("Increased score indicates improvement")
        );
      });

      // submit the form
      await expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
      userEvent.click(screen.getByTestId("group-form-submit-btn"));

      const alert = await screen.findByTestId("population-criteria-success");

      expect(alert).toHaveTextContent(
        "Population details for this group saved successfully."
      );
    });

    test("OnClicking delete button, delete group modal is displayed", async () => {
      group.id = "7p03-5r29-7O0I";
      group.groupDescription = "testDescription";
      measure.groups = [group];
      await waitFor(() => renderMeasureGroupComponent(customProps));

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

      const descriptionEditor = screen.getByTestId(
        "group-description-rich-text-editor"
      );
      expect(descriptionEditor).toBeInTheDocument();
      expect(descriptionEditor).toHaveTextContent("testDescription");
    });

    test("On clicking delete button, measure group should be deleted", async () => {
      group.id = "7p03-5r29-7O0I";
      group.groupDescription = "testDescription";
      measure.groups = [group];
      const { rerender } = renderMeasureGroupComponent(customProps);

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
      userEvent.click(
        screen.getByTestId("delete-measure-group-modal-agree-btn")
      );
    });

    test("Display error when unable to delete group", async () => {
      mockMeasureServiceApi.deleteMeasureGroup = jest
        .fn()
        .mockRejectedValueOnce({
          status: 400,
          message: "oof",
        });
      const setAlertMessageMock = jest.fn();
      const propsWithMock = {
        ...customProps,
        setAlertMessage: setAlertMessageMock,
      };
      group.id = "7p03-5r29-7O0I";
      group.groupDescription = "testDescription";
      measure.groups = [group];

      renderMeasureGroupComponent(propsWithMock);

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
        screen.getByTestId("delete-measure-group-modal-agree-btn")
      );

      await waitFor(() => {
        expect(setAlertMessageMock).toHaveBeenCalled();
      });

      expect(setAlertMessageMock).toHaveBeenCalledWith({
        type: "error",
        message: "oof",
        canClose: false,
      });
    });

    test("Display error when deleting a locked measure group if any Test Case is Locked by another user", async () => {
      mockMeasureServiceApi.deleteMeasureGroup = jest
        .fn()
        .mockRejectedValueOnce({
          status: 423,
          message: "locked",
        });
      const setAlertMessageMock = jest.fn();
      const propsWithMock = {
        ...customProps,
        setAlertMessage: setAlertMessageMock,
      };

      group.id = "7p03-5r29-7O0I";
      group.groupDescription = "testDescription";
      measure.groups = [group];
      const { rerender } = renderMeasureGroupComponent(propsWithMock);

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
        screen.getByTestId("delete-measure-group-modal-agree-btn")
      );

      await waitFor(() => {
        expect(setAlertMessageMock).toHaveBeenCalledWith({
          type: "error",
          message:
            "The Population Criteria cannot be deleted because changes to the Population Criteria will update test cases and one or more test cases are locked by another user.",
          canClose: false,
        });
      });
    });

    test("Navigating between the tabs in measure groups page", async () => {
      group.id = "7p03-5r29-7O0I";
      group.groupDescription = "Description Text";
      group.rateAggregation = "Rate Aggregation Text";
      group.improvementNotation = "Increased score indicates improvement";
      group.improvementNotationDescription = "Large";
      measure.groups = [group];
      await waitFor(() => renderMeasureGroupComponent(customProps));

      expect(screen.getByTestId("populations-tab")).toBeInTheDocument();

      expect(
        screen.getByTestId("measure-group-type-dropdown")
      ).toBeInTheDocument();
      expect(screen.getByTestId("title").textContent).toBe(
        "Population Criteria 1"
      );

      userEvent.click(screen.getByTestId("reporting-tab"));

      const improvementNotationInput = screen.getByTestId(
        "improvement-notation-input"
      ) as HTMLInputElement;
      expect(improvementNotationInput.value).toBe(
        "Increased score indicates improvement"
      );
      expect(screen.getByTestId("group-form-delete-btn")).toBeEnabled();
    });

    test("Should be able to save multiple groups  ", async () => {
      const populationBasis = "Encounter";
      const { rerender } = renderMeasureGroupComponent(customProps);
      await changePopulationBasis(populationBasis);

      // select a scoring
      const scoringSelect = screen.getByTestId("scoring-select");
      userEvent.click(getByRole(scoringSelect, "combobox"));
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

      const descriptionEditor = screen.getByTestId(
        "group-description-rich-text-editor"
      );
      expect(descriptionEditor).toBeInTheDocument();

      const editableContent = within(descriptionEditor).getByRole("textbox");
      expect(editableContent).toHaveAttribute("contenteditable", "true");

      await act(async () => {
        fireEvent.focus(editableContent);
        editableContent.innerHTML = "new description";
        fireEvent.input(editableContent, {
          target: { innerHTML: "new description" },
        });
        fireEvent.blur(editableContent);
      });

      // Wait for debounced update to take effect (250ms delay from TextEditor component)
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });

      // Selects a measure group type
      const measureGroupTypeSelect = screen.getByTestId(
        "measure-group-type-dropdown"
      );
      userEvent.click(getByRole(measureGroupTypeSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(screen.getByText("Patient Reported Outcome"));
      });

      // after selecting measure group type, need to collapse the dropdown
      fireEvent.click(screen.getByRole("presentation").firstChild);

      userEvent.click(screen.getByTestId("reporting-tab"));

      const improvementNotationSelect = screen.getByTestId(
        "improvement-notation-select"
      ) as HTMLInputElement;

      userEvent.click(await getByRole(improvementNotationSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(
          screen.getByText("Increased score indicates improvement")
        );
      });

      expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
      userEvent.click(screen.getByTestId("group-form-submit-btn"));

      const alert = await screen.findByTestId("population-criteria-success");
      expect(alert).toBeInTheDocument();

      expect(alert).toHaveTextContent(
        "Population details for this group saved successfully."
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
                    setAlertMessage={jest.fn}
                    isTestCaseLocked={false}
                    checkTestCasesLockStatus={jest
                      .fn()
                      .mockResolvedValue(false)}
                    measureCanEdit={true}
                    alertMessage=""
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
      userEvent.click(getByRole(scoringSelect2, "combobox"));
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

      const descriptionEditor1 = screen.getByTestId(
        "group-description-rich-text-editor"
      );
      expect(descriptionEditor1).toBeInTheDocument();

      const editableContent1 = within(descriptionEditor1).getByRole("textbox");
      expect(editableContent1).toHaveAttribute("contenteditable", "true");

      await act(async () => {
        fireEvent.focus(editableContent1);
        fireEvent.input(editableContent1, {
          target: { innerHTML: "new description for group 2" },
        });
        fireEvent.blur(editableContent1);
      });

      // Wait for debounced update to take effect (250ms delay from TextEditor component)
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });

      const measureGroupTypeSelect2 = screen.getByTestId(
        "measure-group-type-dropdown"
      );
      userEvent.click(getByRole(measureGroupTypeSelect2, "combobox"));
      await waitFor(() => {
        userEvent.click(screen.getByText("Patient Reported Outcome"));
      });

      // after selecting measure group type, need to collapse the dropdown
      fireEvent.click(screen.getByRole("presentation").firstChild);

      userEvent.click(screen.getByTestId("reporting-tab"));

      const improvementNotationSelect2 = screen.getByTestId(
        "improvement-notation-select"
      ) as HTMLInputElement;

      userEvent.click(await getByRole(improvementNotationSelect2, "combobox"));
      await waitFor(() => {
        userEvent.click(
          screen.getByText("Increased score indicates improvement")
        );
      });

      expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
      userEvent.click(screen.getByTestId("group-form-submit-btn"));

      const alert1 = await screen.findByTestId("population-criteria-success");

      expect(alert1).toHaveTextContent(
        "Population details for this group saved successfully."
      );

      expect(screen.getByTestId("title").textContent).toBe(
        "Population Criteria 2"
      );
    });

    test("Should be able to update initial population of a population group", async () => {
      const populationBasis = "MedicationAdministration";
      group.id = "7p03-5r29-7O0I";
      group.scoringUnit = "testScoringUnit";
      group.scoringPrecision = "2";
      group.populationBasis = populationBasis;
      measure.groups = [group];
      const { getByTestId, getByText } =
        renderMeasureGroupComponent(customProps);
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
      userEvent.click(getByRole(measureGroupTypeSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(getByText("Patient Reported Outcome"));
      });

      const expectedGroup = {
        id: "7p03-5r29-7O0I",
        displayId: "Group_1",
        populations: [
          {
            id: "id-1",
            name: PopulationType.INITIAL_POPULATION,
            definition:
              "VTE Prophylaxis by Medication Administered or Device Applied",
            description: "",
            displayId: "InitialPopulation_1",
            associationType: undefined,
          },
        ],
        rateAggregation: "",
        measureObservations: null,
        scoring: "Cohort",
        groupDescription: "",
        measureGroupTypes: ["Patient Reported Outcome"],
        populationBasis: populationBasis,
        scoringUnit: "testScoringUnit",
        scoringPrecision: "2",
        improvementNotation: "Increased score indicates improvement",
        improvementNotationDescription: "",
      };

      userEvent.click(screen.getByTestId("reporting-tab"));

      const improvementNotationSelect = screen.getByTestId(
        "improvement-notation-select"
      ) as HTMLInputElement;

      userEvent.click(await getByRole(improvementNotationSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(
          screen.getByText("Increased score indicates improvement")
        );
      });

      expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();

      // submit the form
      userEvent.click(screen.getByTestId("group-form-submit-btn"));

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
        scoringPrecision: "",
      };
      measure.groups = [newGroup];

      await waitFor(() => renderMeasureGroupComponent(customProps));
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

      userEvent.click(screen.getByTestId("reporting-tab"));

      const improvementNotationSelect = screen.getByTestId(
        "improvement-notation-select"
      ) as HTMLInputElement;

      userEvent.click(await getByRole(improvementNotationSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(
          screen.getByText("Increased score indicates improvement")
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
      });

      // data: {
      //   id: "group-1",
      //   scoring: "Cohort",
      //   populations: [
      //     {
      //       id: "id-1",
      //       name: PopulationType.INITIAL_POPULATION,
      //       definition:
      //         "Encounter With Age Range and Without VTE Diagnosis or Obstetrical Conditions",
      //     },
      //   ],
      //   groupDescription: "",
      //   measureGroupTypes: [MeasureGroupTypes.PATIENT_REPORTED_OUTCOME],
      //   populationBasis: "Encounter",
      //   scoringUnit: "",
      //   scoringPrecision: "",
      // },

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
            displayId: "InitialPopulation_1",
          },
          {
            id: "id-2",
            name: PopulationType.MEASURE_POPULATION,
            definition: "Measure Population",
            displayId: "MeasurePopulation_1",
          },
        ],
        groupDescription: "<p>testDescription</p>",
        stratifications: [],
        measureGroupTypes: [MeasureGroupTypes.PATIENT_REPORTED_OUTCOME],
        rateAggregation: "",
        improvementNotation: "",
        populationBasis: populationBasis,
      };
      measure.groups = [newGroup];

      await waitFor(() => renderMeasureGroupComponent(customProps));
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

      userEvent.click(screen.getByTestId("reporting-tab"));

      const improvementNotationSelect = screen.getByTestId(
        "improvement-notation-select"
      ) as HTMLInputElement;

      userEvent.click(await getByRole(improvementNotationSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(
          screen.getByText("Increased score indicates improvement")
        );
      });

      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Save" })).toBeEnabled()
      );

      const expectedGroup = {
        id: "7p03-5r29-7O0I",
        displayId: "Group_1",
        populations: [
          {
            id: "uuid-3",
            name: PopulationType.INITIAL_POPULATION,
            definition:
              "VTE Prophylaxis by Medication Administered or Device Applied",
            description: "",
            associationType: undefined,
            displayId: "InitialPopulation_1",
          },
        ],
        measureObservations: null,
        scoring: "Cohort",
        scoringUnit: "",
        groupDescription: "<p>testDescription</p>",
        measureGroupTypes: ["Patient Reported Outcome"],
        rateAggregation: "",
        improvementNotation: "Increased score indicates improvement",
        improvementNotationDescription: "",
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
    });

    test.skip("On clicking discard button,should be able to discard the changes", async () => {
      group.id = "7p03-5r29-7O0I";
      group.groupDescription = "testDescription";
      group.rateAggregation = "Rate Aggregation Text";
      group.improvementNotation = "Increased score indicates improvement";
      measure.groups = [group];

      await waitFor(() => renderMeasureGroupComponent(customProps));

      // verify is the scoring type is Cohort
      const scoringSelectInput = screen.getByTestId(
        "scoring-select-input"
      ) as HTMLInputElement;
      expect(scoringSelectInput.value).toBe("Cohort");

      // verify is the initial population is already set from group object
      const initialPopulationInput = screen.getByTestId(
        "select-measure-group-population-input"
      ) as HTMLInputElement;
      expect(initialPopulationInput.value).toBe(
        group.populations[0].definition
      );

      // update initial population from dropdown
      const definitionToUpdate =
        "VTE Prophylaxis by Medication Administered or Device Applied";
      const initialPopulationSelect = screen.getByTestId(
        "population-select-initial-population"
      );
      userEvent.click(getByRole(initialPopulationSelect, "combobox"));
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

    test("Should not display a success toast if server fails to create population Group", async () => {
      renderMeasureGroupComponent(customProps);
      await changePopulationBasis("Encounter");
      // select a scoring
      const scoringSelect = screen.getByTestId("scoring-select");
      userEvent.click(getByRole(scoringSelect, "combobox"));
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
      userEvent.click(getByRole(measureGroupTypeSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(screen.getByText("Patient Reported Outcome"));
      });

      userEvent.click(screen.getByTestId("reporting-tab"));

      const improvementNotationSelect = screen.getByTestId(
        "improvement-notation-select"
      ) as HTMLInputElement;

      userEvent.click(await getByRole(improvementNotationSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(
          screen.getByText("Increased score indicates improvement")
        );
      });

      // submit the form
      userEvent.click(screen.getByTestId("group-form-submit-btn"));
      expect(screen.queryByTestId("population-criteria-success")).toBeNull();
    });

    test("Should not display a success toast if the update population Group fails", async () => {
      group.id = "7p03-5r29-7O0I";
      group.measureGroupTypes = [MeasureGroupTypes.PROCESS];
      group.populationBasis = "MedicationAdministration";
      measure.groups = [group];
      renderMeasureGroupComponent(customProps);

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

      userEvent.click(screen.getByTestId("reporting-tab"));

      const improvementNotationSelect = screen.getByTestId(
        "improvement-notation-select"
      ) as HTMLInputElement;

      userEvent.click(await getByRole(improvementNotationSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(
          screen.getByText("Increased score indicates improvement")
        );
      });

      // submit the form
      userEvent.click(screen.getByTestId("group-form-submit-btn"));
      expect(screen.queryByTestId("population-criteria-success")).toBeNull();
    });

    test("Should display 423 error when measure is locked", async () => {
      mockMeasureServiceApi.updateGroup = jest.fn().mockRejectedValueOnce({
        status: 423,
        message: "Unable to update measure. Measure is locked by another user.",
      });
      group.id = "7p03-5r29-7O0I";
      group.measureGroupTypes = [MeasureGroupTypes.PROCESS];
      group.populationBasis = "MedicationAdministration";
      measure.groups = [group];

      const props: MeasureGroupProps = {
        measureGroupNumber: 0,
        setMeasureGroupNumber: jest.fn,
        setIsFormDirty: jest.fn,
        measureId: "testMeasureId",
        setAlertMessage: jest.fn,
        checkTestCasesLockStatus: jest.fn().mockResolvedValueOnce(false),
        isTestCaseLocked: true,
        measureCanEdit: false,
      } as unknown as MeasureGroupProps;
      const customProps: MeasureGroupProps = {
        ...props,
        isTestCaseLocked: false,
        measureCanEdit: true,
      };
      renderMeasureGroupComponent(customProps);

      const definitionToUpdate =
        "VTE Prophylaxis by Medication Administered or Device Applied";
      const groupPopulationInput = screen.getByTestId(
        "select-measure-group-population-input"
      ) as HTMLInputElement;
      fireEvent.change(groupPopulationInput, {
        target: { value: definitionToUpdate },
      });
      expect(groupPopulationInput.value).toBe(definitionToUpdate);

      userEvent.click(screen.getByTestId("reporting-tab"));

      const improvementNotationSelect = screen.getByTestId(
        "improvement-notation-select"
      ) as HTMLInputElement;

      userEvent.click(await getByRole(improvementNotationSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(
          screen.getByText("Increased score indicates improvement")
        );
      });

      userEvent.click(screen.getByTestId("group-form-submit-btn"));
      expect(screen.queryByTestId("population-criteria-success")).toBeNull();
    });

    test("Should not display a success toast if the update population Group fails due to group validation error", async () => {
      group.id = "7p03-5r29-7O0I";
      group.measureGroupTypes = [MeasureGroupTypes.PROCESS];
      group.populationBasis = "MedicationAdministration";
      measure.groups = [group];
      renderMeasureGroupComponent(customProps);

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

      userEvent.click(screen.getByTestId("reporting-tab"));

      const improvementNotationSelect = screen.getByTestId(
        "improvement-notation-select"
      ) as HTMLInputElement;

      userEvent.click(await getByRole(improvementNotationSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(
          screen.getByText("Increased score indicates improvement")
        );
      });

      // submit the form
      userEvent.click(screen.getByTestId("group-form-submit-btn"));
      expect(screen.queryByTestId("population-criteria-success")).toBeNull();
    });

    test("Form displays message next to save button about required populations", async () => {
      await waitFor(() => renderMeasureGroupComponent(customProps));
      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
      expect(
        screen.getByText("You must set all required Populations.")
      ).toBeInTheDocument();
    });

    test("Save button is disabled until all required Cohort populations are entered", async () => {
      renderMeasureGroupComponent(customProps);
      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
      await changePopulationBasis("Encounter");
      // select a scoring
      const scoringSelect = screen.getByTestId("scoring-select");
      userEvent.click(getByRole(scoringSelect, "combobox"));
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
      userEvent.click(getByRole(measureGroupTypeSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(screen.getByText("Patient Reported Outcome"));
      });

      userEvent.click(screen.getByTestId("reporting-tab"));

      const improvementNotationSelect = screen.getByTestId(
        "improvement-notation-select"
      ) as HTMLInputElement;

      userEvent.click(await getByRole(improvementNotationSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(
          screen.getByText("Increased score indicates improvement")
        );
      });

      expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
    });

    test.skip("Save button is disabled until all required Proportion populations are entered", async () => {
      renderMeasureGroupComponent(customProps);
      await changePopulationBasis("Encounter");

      // Select the scoring value to Proportion
      const scoringSelect = screen.getByTestId("scoring-select");
      userEvent.click(getByRole(scoringSelect, "combobox"));
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
      userEvent.click(getByRole(measureGroupTypeSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(screen.getByText("Patient Reported Outcome"));
      });
      expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
    });

    it.skip("Save button is disabled until all required Ratio populations are entered", async () => {
      renderMeasureGroupComponent(customProps);
      await changePopulationBasis("Encounter");

      // Select the scoring value to RATIO
      const scoringSelect = screen.getByTestId("scoring-select");
      userEvent.click(getByRole(scoringSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(screen.getByText(GroupScoring.RATIO));
      });
      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

      const allPopulationsInputs = screen.getAllByTestId(
        "select-measure-group-population-input"
      ) as HTMLInputElement[];

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
      userEvent.click(getByRole(measureGroupTypeSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(screen.getByText("Patient Reported Outcome"));
      });

      expect(screen.getByTestId("group-form-submit-btn")).not.toBeDisabled();
    });

    test("Save button is disabled until all required CV populations are entered", async () => {
      renderMeasureGroupComponent(customProps);
      await changePopulationBasis("Encounter");

      // Select scoring to CONTINUOUS_VARIABLE
      const scoringSelect = screen.getByTestId("scoring-select");
      userEvent.click(getByRole(scoringSelect, "combobox"));
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
      userEvent.click(getByRole(observationSelect, "combobox"));
      const observationOptions = await screen.findAllByRole("option");
      expect(observationOptions).toHaveLength(1);
      userEvent.click(screen.getByText("fun"));

      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

      // Setting Aggregate value
      const aggregateSelect = screen.getByTestId(
        "select-measure-observation-aggregate-cv-obs"
      );
      userEvent.click(getByRole(aggregateSelect, "combobox"));
      const aggregateOptions = await screen.findAllByRole("option");
      expect(aggregateOptions).toHaveLength(6);
      userEvent.click(screen.getByText("Count"));

      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

      // Setting measure group type
      const measureGroupTypeSelect = screen.getByTestId(
        "measure-group-type-dropdown"
      );
      userEvent.click(getByRole(measureGroupTypeSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(screen.getByText("Patient Reported Outcome"));
      });

      userEvent.click(screen.getByTestId("reporting-tab"));

      const improvementNotationSelect = screen.getByTestId(
        "improvement-notation-select"
      ) as HTMLInputElement;

      userEvent.click(await getByRole(improvementNotationSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(
          screen.getByText("Increased score indicates improvement")
        );
      });

      expect(screen.getByTestId("group-form-submit-btn")).not.toBeDisabled();
    });

    test("should display default select for scoring unit", async () => {
      const { getByTestId } = await waitFor(() =>
        renderMeasureGroupComponent(customProps)
      );
      const scoringUnitLabel = getByTestId("scoring-unit-text-input");
      expect(scoringUnitLabel).toBeInTheDocument();
    });

    test("Should not display a success toast when updating group and response returns back no group", async () => {
      mockMeasureServiceApi.updateGroup = jest.fn().mockResolvedValue(null);
      group.id = "7p03-5r29-7O0I";
      group.groupDescription = "testDescription";
      group.populationBasis = "Encounter";
      measure.groups = [group];
      const { getByTestId, getByText } =
        renderMeasureGroupComponent(customProps);

      const measureGroupTypeSelect = getByTestId("measure-group-type-dropdown");
      await act(async () => {
        userEvent.click(getByRole(measureGroupTypeSelect, "combobox"));
        await waitFor(() => {
          userEvent.click(getByText("Patient Reported Outcome"));
        });
      });

      userEvent.click(screen.getByTestId("reporting-tab"));

      const improvementNotationSelect = screen.getByTestId(
        "improvement-notation-select"
      ) as HTMLInputElement;

      userEvent.click(await getByRole(improvementNotationSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(
          screen.getByText("Increased score indicates improvement")
        );
      });

      expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
      await act(async () => {
        userEvent.click(screen.getByTestId("group-form-submit-btn"));
      });
      expect(screen.queryByTestId("population-criteria-success")).toBeNull();
    });

    test("Should not display a success toast when adding group and response returns back no group", async () => {
      mockMeasureServiceApi.createGroup = jest.fn().mockResolvedValue(null);
      measure.groups = [];
      renderMeasureGroupComponent(customProps);
      await changePopulationBasis("Encounter");
      // select a scoring
      const scoringSelect = screen.getByTestId("scoring-select");
      userEvent.click(getByRole(scoringSelect, "combobox"));
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
      userEvent.click(getByRole(measureGroupTypeSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(screen.getByText("Patient Reported Outcome"));
      });

      userEvent.click(screen.getByTestId("reporting-tab"));

      const improvementNotationSelect = screen.getByTestId(
        "improvement-notation-select"
      ) as HTMLInputElement;

      userEvent.click(await getByRole(improvementNotationSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(
          screen.getByText("Increased score indicates improvement")
        );
      });

      expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
      await act(async () => {
        userEvent.click(screen.getByTestId("group-form-submit-btn"));
      });
      expect(screen.queryByTestId("population-criteria-success")).toBeNull();
    });

    test("Add/remove second IP for ratio group", async () => {
      await waitFor(() => renderMeasureGroupComponent(customProps));

      // select Ratio scoring
      const scoringSelect = screen.getByTestId("scoring-select");
      userEvent.click(getByRole(scoringSelect, "combobox"));
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
      expect(
        screen.queryByTestId("population-select-initial-population-1")
      ).toBe(null);
      expect(
        screen.queryByTestId("population-select-initial-population-2")
      ).toBe(null);
    });

    test("measure observation should not render for cohort", async () => {
      renderMeasureGroupComponent(customProps);
      // select Cohort scoring
      const scoringSelect = screen.getByTestId("scoring-select");
      userEvent.click(getByRole(scoringSelect, "combobox"));
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
      renderMeasureGroupComponent(customProps);
      // select Proportion scoring
      const scoringSelect = screen.getByTestId("scoring-select");
      userEvent.click(getByRole(scoringSelect, "combobox"));
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
      renderMeasureGroupComponent(customProps);

      const scoringSelect = screen.getByTestId("scoring-select");
      userEvent.click(getByRole(scoringSelect, "combobox"));
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
      await waitFor(() => renderMeasureGroupComponent(customProps));

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
      await waitFor(() => renderMeasureGroupComponent(customProps));

      const numeratorObservationInput = screen.getByTestId(
        "measure-observation-numerator-input"
      ) as HTMLInputElement;
      expect(numeratorObservationInput).toHaveValue("fun");

      const numeratorAggregateFunctionInput = screen.getByTestId(
        "measure-observation-aggregate-numerator-input"
      ) as HTMLInputElement;
      expect(numeratorAggregateFunctionInput.value).toEqual("Average");
    });

    //TODO Fix skip GAK MAT-9176
    test.skip("measure observation should be included in persisted output for continuous variable", async () => {
      renderMeasureGroupComponent(customProps);
      await changePopulationBasis("Encounter");

      // Select scoring to CONTINUOUS_VARIABLE
      const scoringSelect = screen.getByTestId("scoring-select");
      userEvent.click(getByRole(scoringSelect, "combobox"));
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
      userEvent.click(getByRole(observationSelect, "combobox"));
      const observationOptions = await screen.findAllByRole("option");
      expect(observationOptions).toHaveLength(1);
      userEvent.click(screen.getByText("fun"));

      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

      // Setting Aggregate value
      const aggregateSelect = screen.getByTestId(
        "select-measure-observation-aggregate-cv-obs"
      );
      userEvent.click(getByRole(aggregateSelect, "combobox"));
      const aggregateOptions = await screen.findAllByRole("option");
      expect(aggregateOptions).toHaveLength(6);
      userEvent.click(screen.getByText("Count"));

      // Setting measure group type
      const measureGroupTypeSelect = screen.getByTestId(
        "measure-group-type-dropdown"
      );
      userEvent.click(getByRole(measureGroupTypeSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(screen.getByText("Patient Reported Outcome"));
      });

      // data: {
      //   ...group,
      //   id: "group1-id",
      //   measureGroupTypes: [MeasureGroupTypes.PATIENT_REPORTED_OUTCOME],
      //   measureObservations: [
      //     {
      //       id: "uuid-1",
      //       definition: "fun",
      //       aggregateMethod: AggregateFunctionType.COUNT,
      //     },
      //   ],
      // },

      userEvent.click(screen.getByTestId("reporting-tab"));

      const improvementNotationSelect = screen.getByTestId(
        "improvement-notation-select"
      ) as HTMLInputElement;

      userEvent.click(await getByRole(improvementNotationSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(
          screen.getByText("Increased score indicates improvement")
        );
      });

      expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
      userEvent.click(screen.getByTestId("group-form-submit-btn"));

      const alert = await screen.findByTestId("population-criteria-success");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(
        "Population details for this group saved successfully."
      );
    });

    //TODO Fix skip GAK MAT-9176
    test.skip("measure observation should be included in persisted output for ratio", async () => {
      renderMeasureGroupComponent(customProps);
      await changePopulationBasis("Encounter");
      // Select scoring to Ratio
      const scoringSelect = screen.getByTestId("scoring-select");
      userEvent.click(getByRole(scoringSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(screen.getByText(GroupScoring.RATIO));
      });

      const measureGroupTypeDropdown = screen.getByTestId(
        "measure-group-type-dropdown"
      );
      userEvent.click(await getByRole(measureGroupTypeDropdown, "combobox"));
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
      userEvent.click(getByRole(observationSelect, "combobox"));
      userEvent.click(screen.getByText("fun"));

      // Setting numerator aggregate value
      const aggregateSelect = screen.getByTestId(
        "select-measure-observation-aggregate-numerator"
      );
      userEvent.click(getByRole(aggregateSelect, "combobox"));
      userEvent.click(screen.getByText(AggregateFunctionType.MAXIMUM));

      userEvent.click(screen.getByTestId("reporting-tab"));

      const improvementNotationSelect = screen.getByTestId(
        "improvement-notation-select"
      ) as HTMLInputElement;

      userEvent.click(await getByRole(improvementNotationSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(
          screen.getByText("Increased score indicates improvement")
        );
      });

      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled()
      );

      // data: {
      //   ...group,
      //   id: "group1-id",
      //   scoring: "Ratio",
      //   measureGroupTypes: [MeasureGroupTypes.OUTCOME],
      //   measureObservations: [
      //     {
      //       id: "uuid-1",
      //       definition: "fun",
      //       aggregateMethod: AggregateFunctionType.MAXIMUM,
      //     },
      //   ],
      // },

      expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
      userEvent.click(screen.getByTestId("group-form-submit-btn"));

      const alert = await screen.findByTestId("population-criteria-success");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(
        "Population details for this group saved successfully."
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
        scoringPrecision: "",
      };
      measure.groups = [group1];
      renderMeasureGroupComponent(customProps);

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
        scoringPrecision: "",
      };
      measure.groups = [group1];
      renderMeasureGroupComponent(customProps);

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
        expect((ip1DenomAssociation as HTMLInputElement).checked).toEqual(
          false
        );
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
        expect((ip1DenomAssociation as HTMLInputElement).checked).toEqual(
          false
        );
        expect((ip1NumerAssociation as HTMLInputElement).checked).toEqual(true);
      });
    });

    test("render Measure group properties in readonly mode if user is not the measure owner", async () => {
      await waitFor(() =>
        renderMeasureGroupComponent({ ...customProps, measureCanEdit: false })
      );
      const descriptionEditor = screen.getByTestId(
        "group-description-rich-text-editor"
      );
      expect(descriptionEditor).toBeInTheDocument();
      const scoringSelectInput = screen.getByRole("textbox", {
        name: "Scoring",
      });
      expect(scoringSelectInput).toHaveAttribute("readonly");
      expect(scoringSelectInput).toHaveValue("-");
      const measureType = screen.getByRole("textbox", { name: "Measure Type" });
      expect(measureType).toHaveAttribute("readonly");
      expect(measureType).toHaveValue("-");
      const saveButton = screen.queryByTestId("group-form-submit-btn");
      expect(saveButton).not.toBeInTheDocument();
    });

    test("should allow Ratio measures to select stratifications", async () => {
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
        scoringPrecision: "",
      };
      measure.groups = [group1];
      renderMeasureGroupComponent(customProps);

      const stratTab = screen.getByTestId("stratifications-tab");
      expect(stratTab).toBeInTheDocument();
      userEvent.click(stratTab);

      expect(screen.getByTestId("stratification-1-input")).toBeInTheDocument();
    });

    test("should fail Ratio measures with multiple IPs when selecting multiple stratification associations", async () => {
      const errorMessage =
        "Ratio measures with two IPs must have one population for associations";
      const group1: Group = {
        id: "1",
        scoring: "Ratio",
        populations: [
          {
            id: "id-1",
            name: PopulationType.INITIAL_POPULATION,
            definition: "Initial Population",
            associationType: InitialPopulationAssociationType.DENOMINATOR,
          },
          {
            id: "id-2",
            name: PopulationType.INITIAL_POPULATION,
            definition: "Initial Population 2",
            associationType: InitialPopulationAssociationType.NUMERATOR,
          },
        ],
        groupDescription: "",
        measureGroupTypes: [MeasureGroupTypes.PROCESS],
        populationBasis: "boolean",
        scoringUnit: "",
        scoringPrecision: "",
        stratifications: [
          {
            id: "strat1",
            cqlDefinition: "Initial Population",
            associations: [
              PopulationType.INITIAL_POPULATION,
              PopulationType.DENOMINATOR,
              PopulationType.NUMERATOR,
            ],
          },
        ],
      };
      measure.groups = [group1];
      renderMeasureGroupComponent(customProps);

      const stratTab = screen.getByTestId("stratifications-tab");
      expect(stratTab).toBeInTheDocument();
      userEvent.click(stratTab);

      expect(screen.getByTestId("stratification-1-input")).toBeInTheDocument();

      await waitFor(() => {
        expect(
          screen.getByTestId("association-select-1-helper-text")
        ).toBeInTheDocument();
        expect(screen.queryByText(errorMessage)).toBeInTheDocument();
      });
    });

    test("should pass when Ratio measures with multiple IPs when selecting single stratification associations", async () => {
      const errorMessage =
        "Ratio measures with two IPs must have one population for associations";
      const group1: Group = {
        id: "1",
        scoring: "Ratio",
        populations: [
          {
            id: "id-1",
            name: PopulationType.INITIAL_POPULATION,
            definition: "Initial Population",
            associationType: InitialPopulationAssociationType.DENOMINATOR,
          },
          {
            id: "id-2",
            name: PopulationType.INITIAL_POPULATION,
            definition: "Initial Population 2",
            associationType: InitialPopulationAssociationType.NUMERATOR,
          },
        ],
        groupDescription: "",
        measureGroupTypes: [MeasureGroupTypes.PROCESS],
        populationBasis: "boolean",
        scoringUnit: "",
        scoringPrecision: "",
        stratifications: [
          {
            id: "strat1",
            cqlDefinition: "Initial Population",
            associations: [PopulationType.INITIAL_POPULATION],
          },
        ],
      };
      measure.groups = [group1];
      renderMeasureGroupComponent(customProps);

      const stratTab = screen.getByTestId("stratifications-tab");
      expect(stratTab).toBeInTheDocument();
      userEvent.click(stratTab);

      expect(screen.getByTestId("stratification-1-input")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
      });
    });

    test("should pass when Ratio measures with single IP when selecting one or many stratification associations", async () => {
      const errorMessage =
        "Ratio measures with two IPs must have one population for associations";
      const group1: Group = {
        id: "1",
        scoring: "Ratio",
        populations: [
          {
            id: "id-1",
            name: PopulationType.INITIAL_POPULATION,
            definition: "Initial Population",
            associationType: InitialPopulationAssociationType.DENOMINATOR,
          },
        ],
        groupDescription: "",
        measureGroupTypes: [MeasureGroupTypes.PROCESS],
        populationBasis: "boolean",
        scoringUnit: "",
        scoringPrecision: "",
        stratifications: [
          {
            id: "strat1",
            cqlDefinition: "Initial Population",
            associations: [
              PopulationType.INITIAL_POPULATION,
              PopulationType.DENOMINATOR,
              PopulationType.NUMERATOR,
            ],
          },
        ],
      };
      measure.groups = [group1];
      renderMeasureGroupComponent(customProps);

      const stratTab = screen.getByTestId("stratifications-tab");
      expect(stratTab).toBeInTheDocument();
      userEvent.click(stratTab);

      expect(screen.getByTestId("stratification-1-input")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
      });
    });

    test("render Measure group properties in readonly mode if a testcase is locked", async () => {
      renderMeasureGroupComponent({ ...customProps, isTestCaseLocked: true });
      const descriptionEditor = screen.getByTestId(
        "group-description-rich-text-editor"
      );
      expect(descriptionEditor).toBeInTheDocument();
      await waitFor(() => {
        expect(
          screen.getByRole("textbox", {
            name: "Scoring",
          })
        ).toBeInTheDocument();
      });
      const scoringSelectInput = screen.getByRole("textbox", {
        name: "Scoring",
      });
      expect(scoringSelectInput).toHaveAttribute("readonly");
      expect(scoringSelectInput).toHaveValue("-");
      const measureType = screen.getByRole("textbox", { name: "Measure Type" });
      expect(measureType).toHaveAttribute("readonly");
      expect(measureType).toHaveValue("-");
      const saveButton = screen.queryByTestId("group-form-submit-btn");
      expect(saveButton).not.toBeInTheDocument();
    });

    test("render Measure group properties if a testcase is unlocked", async () => {
      renderMeasureGroupComponent(customProps);
      const descriptionEditor = screen.getByTestId(
        "group-description-rich-text-editor"
      );
      expect(descriptionEditor).toBeInTheDocument();
      await waitFor(() => {
        expect(
          screen.getByRole("combobox", {
            name: "Scoring",
          })
        ).toBeInTheDocument();
      });
      const scoringSelectInput = screen.getByRole("combobox", {
        name: "Scoring",
      });
      expect(scoringSelectInput).not.toHaveAttribute("readonly");
      const measureType = screen.getByTestId("measure-group-type-input");
      expect(measureType).not.toHaveAttribute("readonly");
      const saveButton = screen.queryByTestId("group-form-submit-btn");
      expect(saveButton).toBeInTheDocument();
    });

    test("displays error alert when test cases are locked and locking feature is enabled", async () => {
      const checkTestCasesLockStatusMock = jest.fn().mockResolvedValue(true);

      renderMeasureGroupComponent({
        ...customProps,
        checkTestCasesLockStatus: checkTestCasesLockStatusMock,
      });

      await changePopulationBasis("Encounter");

      // select a scoring
      const scoringSelect = screen.getByTestId("scoring-select");
      userEvent.click(getByRole(scoringSelect, "combobox"));
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

      // Select measure group type
      const measureGroupTypeSelect = screen.getByTestId(
        "measure-group-type-dropdown"
      );
      userEvent.click(getByRole(measureGroupTypeSelect, "combobox"));
      await waitFor(() => {
        userEvent.click(screen.getByText("Patient Reported Outcome"));
      });

      // submit the form
      await expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
      userEvent.click(screen.getByTestId("group-form-submit-btn"));

      // Verify error toast appears
      await waitFor(() => {
        const errorToast = screen.getByTestId("population-criteria-error");
        expect(errorToast).toBeInTheDocument();
        expect(errorToast).toHaveTextContent(
          "This measure cannot be saved because changes to the Population Criteria will update test cases and one or more test cases are locked by another user."
        );
      });
    });
  });

  describe("Composite measure tests", () => {
    test("should render Composite Measure Group page", async () => {
      measure.measureMetaData.composite = true;
      renderMeasureGroupComponent(customProps);

      // Components tab is present and selected
      const componentTab = screen.getByRole("tab", {
        name: "Components",
      });
      expect(componentTab).toBeInTheDocument();
      expect(componentTab).toHaveAttribute("aria-selected", "true");
      expect(screen.getByTestId("composite-component")).toBeInTheDocument();
      expect(screen.getByTestId("composite-scoring")).toBeInTheDocument();

      // populations tab is not present
      const populationTab = screen.queryByRole("tab", {
        name: "Populations",
      });
      expect(populationTab).not.toBeInTheDocument();
    });

    test("should display Composite scoring as readonly and not allow changing when measure is composite", async () => {
      measure.measureMetaData.composite = true;
      renderMeasureGroupComponent(customProps);

      // Verify scoring is displayed as a readonly textarea showing "Composite"
      const scoringSelect = screen.getByTestId("scoring-select");
      expect(scoringSelect).toBeInTheDocument();
      expect(scoringSelect.tagName.toLowerCase()).toBe("textarea");
      expect(scoringSelect).toHaveAttribute("readonly");
      expect(scoringSelect).toHaveTextContent("Composite");
      const compositeOption = screen.queryByTestId(
        "group-scoring-option-COMPOSITE"
      );
      const cohortOption = screen.queryByTestId("group-scoring-option-COHORT");
      expect(compositeOption).not.toBeInTheDocument();
      expect(cohortOption).not.toBeInTheDocument();
    });

    test("should hide Stratifications tab for composite measures", async () => {
      measure.measureMetaData.composite = true;
      renderMeasureGroupComponent(customProps);

      // Components tab should be present
      const componentTab = screen.getByRole("tab", {
        name: "Components",
      });
      expect(componentTab).toBeInTheDocument();

      // Reporting tab should be present
      const reportingTab = screen.getByRole("tab", {
        name: /Reporting/i,
      });
      expect(reportingTab).toBeInTheDocument();

      // Stratifications tab should NOT be present
      const stratificationsTab = screen.queryByTestId("stratifications-tab");
      expect(stratificationsTab).not.toBeInTheDocument();
    });

    test("should show Stratifications tab for non-composite measures", async () => {
      measure.measureMetaData.composite = false;
      renderMeasureGroupComponent(customProps);

      // Populations tab should be present
      const populationsTab = screen.getByRole("tab", {
        name: /Populations/i,
      });
      expect(populationsTab).toBeInTheDocument();

      // Reporting tab should be present
      const reportingTab = screen.getByRole("tab", {
        name: /Reporting/i,
      });
      expect(reportingTab).toBeInTheDocument();

      // Stratifications tab should be present
      const stratificationsTab = screen.queryByTestId("stratifications-tab");
      expect(stratificationsTab).toBeInTheDocument();
    });
  });
});
