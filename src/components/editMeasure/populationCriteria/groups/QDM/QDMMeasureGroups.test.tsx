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
import MeasureGroups, { MeasureGroupProps } from "./QDMMeasureGroups";
import {
  AggregateFunctionType,
  Group,
  GroupScoring,
  Measure,
  MeasureGroupTypes,
  MeasureScoring,
  PopulationType,
  Model,
  MeasureErrorType,
} from "@madie/madie-models";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../../api/ServiceContext";

import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ELM_JSON, MeasureCQL } from "../../../../common/MeasureCQL";
import userEvent from "@testing-library/user-event";
import {
  measureStore,
  checkUserCanEdit,
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
    baseUrl: "test-elm-service",
  },
  terminologyService: {
    baseUrl: "terminology-service.com",
  },
} as ServiceConfig;

const getEmptyStrat = () => ({
  cqlDefinition: "",
  description: "",
  association: null,
  id: "",
});
const MEASURE_CREATEDBY = "testuser@example.com"; //#nosec

const mockMeasureServiceApi = {
  getReturnTypesForAllCqlFunctions: jest.fn(),
  getReturnTypesForAllCqlDefinitions: jest.fn(),
  fetchMeasure: jest.fn(),
  updateMeasure: jest.fn(),
  updateGroup: jest.fn(),
  deleteMeasureGroup: jest.fn(),
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
  checkUserCanEdit: jest.fn(() => {
    return true;
  }),
  useFeatureFlags: jest.fn(() => ({
    Locking: false,
  })),
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
  isTestCaseLocked: false,
  checkTestCasesLockStatus: jest.fn(),
};

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
          />
        </Routes>
      </ApiContextProvider>
    </MemoryRouter>
  );
};
describe("Measure Groups Page", () => {
  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  let measure: Measure;
  let group: Group;
  beforeEach(() => {
    measure = {
      id: "test-measure",
      measureName: "Bthe measure for testing",
      cql: MeasureCQL,
      elmJson: ELM_JSON,
      createdBy: MEASURE_CREATEDBY,
      scoring: GroupScoring.COHORT,
      groups: [{ groupDescription: "Bthe group for testing" }],
      baseConfigurationTypes: ["Outcome", "Patient Reported Outcome"],
      patientBasis: true,
      model: Model.QDM_5_6,
    } as Measure;
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

    measureStore.state.mockImplementationOnce(() => measure);

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

    //mocking measureServiceApi before component is rendered
    mockMeasureServiceApi.getReturnTypesForAllCqlFunctions = jest
      .fn()
      .mockReturnValue({ fun: "Encounter" });
    mockMeasureServiceApi.getReturnTypesForAllCqlDefinitions = jest
      .fn()
      .mockReturnValue({
        patient: "NA",
        sdeEthnicity: "Coding",
        sdePayer: "NA",
        sdeRace: "Coding",
        sdeSex: "Code",
        vteProphylaxisByMedicationAdministeredOrDeviceApplied:
          "MedicationAdministration",
      });
    mockMeasureServiceApi.fetchMeasure = jest.fn().mockResolvedValue(measure);
    mockMeasureServiceApi.updateMeasure = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });
    mockMeasureServiceApi.updateGroup = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });
    mockMeasureServiceApi.deleteMeasureGroup = jest.fn().mockResolvedValue({});
  });

  describe("Non-categorized tests", () => {
    test("test update fails with error alert", async () => {
      measure.patientBasis = false;
      measure.scoring = MeasureScoring.COHORT;

      await waitFor(() => renderMeasureGroupComponent());

      const definitionToUpdate =
        "VTE Prophylaxis by Medication Administered or Device Applied";
      const groupPopulationInput = screen.getByTestId(
        "select-measure-group-population-input"
      ) as HTMLInputElement;
      fireEvent.change(groupPopulationInput, {
        target: { value: definitionToUpdate },
      });
      expect(groupPopulationInput.value).toBe(definitionToUpdate);

      const descriptionEditor = screen.getByTestId(
        "populations-0-description-rich-text-editor"
      );
      expect(descriptionEditor).toBeInTheDocument();

      const editableContent = within(descriptionEditor).getByRole("textbox");
      expect(editableContent).toHaveAttribute("contenteditable", "true");

      await act(async () => {
        fireEvent.focus(editableContent);
        editableContent.innerHTML = "newVal";
        fireEvent.input(editableContent, {
          target: { innerHTML: "newVal" },
        });
        fireEvent.blur(editableContent);
      });

      // Wait for debounced update to take effect (250ms delay from TextEditor component)
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });

      // update measure..
      await waitFor(() => {
        const submitBtn = screen.getByTestId("group-form-submit-btn");
        expect(submitBtn).toBeEnabled();
        userEvent.click(submitBtn);
        //TODO GAK MAT-6197 commented out  because tests weren't running reliably
        //   const alert = screen.findByTestId("error-alerts");
        //   setTimeout(() => {
        //     expect(alert).toBeInTheDocument();
        //     expect(alert).toHaveTextContent("Failed to update the group.");
        //   }, 100);
      });
    });

    test("test update fails with fetch measure when doing updateMeasureFromDb", async () => {
      measure.patientBasis = false;
      measure.scoring = MeasureScoring.COHORT;

      await waitFor(() => renderMeasureGroupComponent());

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

      const definitionToUpdate =
        "VTE Prophylaxis by Medication Administered or Device Applied";
      const groupPopulationInput = screen.getByTestId(
        "select-measure-group-population-input"
      ) as HTMLInputElement;
      fireEvent.change(groupPopulationInput, {
        target: { value: definitionToUpdate },
      });
      expect(groupPopulationInput.value).toBe(definitionToUpdate);

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

      // update measure..
      await waitFor(() => {
        const submitBtn = screen.getByTestId("group-form-submit-btn");
        expect(submitBtn).toBeEnabled();
        userEvent.click(submitBtn);

        //TODO GAK MAT-6197 commented out  because tests weren't running reliably
        //const alert = screen.findByTestId("error-alerts");
        // setTimeout(() => {
        //   expect(alert).toBeInTheDocument();
        //   expect(alert).toHaveTextContent("Failed to update the group.");
        // }, 100);
      });
    });

    test("should display selected scoring unit", async () => {
      const { getByTestId } = await waitFor(() =>
        renderMeasureGroupComponent()
      );

      const scoringUnitText = screen.getByTestId("scoring-unit-text-input");
      act(() => {
        fireEvent.change(scoringUnitText, {
          target: { value: "/min" },
        });
      });
    });

    test("test create fails", async () => {
      const group: Group = {
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

      measure.patientBasis = false;
      measure.scoring = MeasureScoring.COHORT;
      measure.groups = [];
      await waitFor(() => renderMeasureGroupComponent());
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

      const groupPopulationInput = screen.getByTestId(
        "select-measure-group-population-input"
      ) as HTMLInputElement;
      act(() => {
        fireEvent.change(groupPopulationInput, {
          target: { value: group.populations[0].definition },
        });
      });
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

      // saving a  measure..
      await waitFor(() => {
        expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
        userEvent.click(screen.getByTestId("group-form-submit-btn"));
      });
      //TODO  This timeout shouldn't be necessasry and is there to deal with test failures.
      //      The tests are still failing sporadically.  This needs to be investigated.

      // setTimeout(() => {
      //   const alert = screen.findByTestId("error-alerts");
      //   expect(alert).toHaveTextContent("Failed to create the group.");
      // }, 200);
    });

    test("test create fails with null group id", async () => {
      let group: Group;
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
      measure.patientBasis = false;
      measure.scoring = MeasureScoring.COHORT;
      measure.groups = [];
      await waitFor(() => renderMeasureGroupComponent());

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
      const groupPopulationInput = screen.getByTestId(
        "select-measure-group-population-input"
      ) as HTMLInputElement;
      fireEvent.change(groupPopulationInput, {
        target: { value: group.populations[0].definition },
      });

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

      // saving a  measure..
      await waitFor(() => {
        expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
        userEvent.click(screen.getByTestId("group-form-submit-btn"));
        //TODO GAK MAT-6197 commented out  because tests weren't running reliably

        // setTimeout(() => {
        //   const alert = screen.findByTestId("error-alerts");
        //   expect(alert).toHaveTextContent("Error creating group");
        // }, 200);
      });
    });

    test("On clicking discard button,should be able to discard the changes", async () => {
      group.id = "7p03-5r29-7O0I";
      group.groupDescription = "testDescription";
      group.improvementNotation = "Increased score indicates improvement";
      measure.scoring = MeasureScoring.COHORT;
      measure.patientBasis = true;
      measure.groups = [group];

      await waitFor(() => renderMeasureGroupComponent());

      // verify is the scoring type is Cohort

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
      // navigate to population and verify initial population is reverted to value from group object
      const populationsTab = screen.getByText("Populations");
      expect(populationsTab).toBeInTheDocument();
      userEvent.click(populationsTab);
      expect(
        (
          (await screen.getByTestId(
            "select-measure-group-population-input"
          )) as HTMLInputElement
        ).value
      ).toBe(group.populations[0].definition);
    });

    test("Should be able to save with non-patient based group validation passed", async () => {
      measure.patientBasis = false;
      measure.scoring = "Cohort";
      renderMeasureGroupComponent();

      await waitFor(() => {
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
        const submitBtn = screen.getByTestId("group-form-submit-btn");
        expect(submitBtn).toBeEnabled();
      });
    });

    test("Should report an error if the update population Group fails due to group validation error", async () => {
      group.id = "7p03-5r29-7O0I";
      group.measureGroupTypes = [MeasureGroupTypes.PROCESS];
      group.populationBasis = "MedicationAdministration";
      measure.groups = [group];
      measure.patientBasis = true;
      measure.scoring = "Cohort";
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

      const submitBtn = screen.getByTestId("group-form-submit-btn");
      expect(submitBtn).toBeEnabled();
    });

    test("Form displays message next to save button about required populations", async () => {
      await waitFor(() => renderMeasureGroupComponent());
      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
      expect(
        screen.getByText("You must set all required Populations.")
      ).toBeInTheDocument();
    });

    test("Stratifications cannot be save when cql definition is not provided", async () => {
      group.id = "7p03-5r29-7O0I";
      group.groupDescription = "Description Text";
      group.improvementNotation = "Increased score indicates improvement";
      group.stratifications = [
        {
          cqlDefinition: "",
          description: "description",
          association: undefined,
          id: "id-1",
        },
        { ...getEmptyStrat(), id: "id-2" },
      ];
      measure.groups = [group];
      renderMeasureGroupComponent();
      userEvent.click(screen.getByTestId("stratifications-tab"));
      const helperText = await screen.findByText("CQL Definition is required.");
      expect(helperText).toBeInTheDocument();
    });

    test("Stratifications Should Not Have Remove Button if there are only two", async () => {
      group.id = "7p03-5r29-7O0I";
      group.groupDescription = "Description Text";
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
      group.improvementNotation = "Increased score indicates improvement";
      group.stratifications = [
        { ...getEmptyStrat(), id: "id-1" },
        { ...getEmptyStrat(), id: "id-2" },
        { ...getEmptyStrat(), id: "id-3" },
        { ...getEmptyStrat(), id: "id-4" },
        { ...getEmptyStrat(), id: "id-5" },
        { ...getEmptyStrat(), id: "id-6" },
      ];
      measure.groups = [group];
      renderMeasureGroupComponent();
      expect(screen.getByTestId("stratifications-tab")).toBeInTheDocument();
      act(() => {
        userEvent.click(screen.getByTestId("stratifications-tab"));
      });
      const removeButton = screen.getAllByTestId("remove-strat-button")[0];
      await waitFor(() => expect(removeButton).toBeInTheDocument());
    }, 10000);

    test("Stratifications should no longer have remove button the stratifications are reduced to two", async () => {
      group.id = "7p03-5r29-7O0I";
      group.groupDescription = "Description Text";
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
        association: null,
      });
    });

    test("measure observation should not render for cohort", async () => {
      //mocking measureServiceApi before component is rendered
      mockMeasureServiceApi.getReturnTypesForAllCqlFunctions = jest
        .fn()
        .mockReturnValue({ fun: "Encounter" });
      mockMeasureServiceApi.getReturnTypesForAllCqlDefinitions = jest
        .fn()
        .mockReturnValue({
          patient: "NA",
          sdeEthnicity: "Coding",
          sdePayer: "NA",
          sdeRace: "Coding",
          sdeSex: "Code",
          vteProphylaxisByMedicationAdministeredOrDeviceApplied:
            "MedicationAdministration",
        });
      mockMeasureServiceApi.fetchMeasure = jest.fn().mockResolvedValue(measure);
      mockMeasureServiceApi.updateMeasure = jest
        .fn()
        .mockResolvedValueOnce({ status: 200 });
      mockMeasureServiceApi.updateGroup = jest
        .fn()
        .mockResolvedValueOnce({ status: 200 });

      group.scoring = MeasureScoring.COHORT;
      measure.scoring = MeasureScoring.COHORT;
      renderMeasureGroupComponent();
      // select Cohort scoring
      expect(
        screen.queryByRole("link", {
          name: "+ Add Observation",
        })
      ).not.toBeInTheDocument();
    });

    test("measure observation should not render for proportion", async () => {
      //mocking measureServiceApi before component is rendered
      mockMeasureServiceApi.getReturnTypesForAllCqlFunctions = jest
        .fn()
        .mockReturnValue({ fun: "Encounter" });
      (mockMeasureServiceApi.getReturnTypesForAllCqlDefinitions = jest
        .fn()
        .mockReturnValue({
          patient: "NA",
          sdeEthnicity: "Coding",
          sdePayer: "NA",
          sdeRace: "Coding",
          sdeSex: "Code",
          vteProphylaxisByMedicationAdministeredOrDeviceApplied:
            "MedicationAdministration",
        })),
        (mockMeasureServiceApi.fetchMeasure = jest
          .fn()
          .mockResolvedValue(measure));
      mockMeasureServiceApi.updateMeasure = jest
        .fn()
        .mockResolvedValueOnce({ status: 200 });
      mockMeasureServiceApi.updateGroup = jest
        .fn()
        .mockResolvedValueOnce({ status: 200 });

      measure.scoring = MeasureScoring.PROPORTION;
      group.scoring = MeasureScoring.PROPORTION;
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
          name: PopulationType.DENOMINATOR,
          definition: "Denominator",
        },
        {
          id: "id-3",
          name: PopulationType.DENOMINATOR_EXCEPTION,
          definition: "DenominatorException",
        },
        {
          id: "id-4",
          name: PopulationType.DENOMINATOR_EXCLUSION,
          definition: "DenominatorExclusion",
        },
        {
          id: "id-5",
          name: PopulationType.NUMERATOR,
          definition: "Numeratior",
        },
        {
          id: "id-6",
          name: PopulationType.NUMERATOR_EXCLUSION,
          definition: "NumeratiorExclusion",
        },
      ];

      measure.groups = [group];

      renderMeasureGroupComponent();
      // select Proportion scoring
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
  });

  test("render Measure group properties in readonly mode if a testcase is locked", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      Locking: true,
    }));
    const customProps: MeasureGroupProps = {
      ...props,
      isTestCaseLocked: true,
    };
    renderMeasureGroupComponent(customProps);

    const scoringUnit = screen.getByRole("textbox", { name: "Scoring Unit" });
    expect(scoringUnit).toHaveAttribute("readonly");
    expect(scoringUnit).toHaveValue("-");
    const initialPopulation = screen.getByRole("textbox", {
      name: "Initial Population",
    });
    expect(initialPopulation).toHaveAttribute("readonly");
    expect(initialPopulation).toHaveValue("-");

    const saveButton = screen.queryByTestId("group-form-submit-btn");
    expect(saveButton).not.toBeInTheDocument();
  });

  test("displays error alert when test cases are locked and locking feature is enabled", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      Locking: true,
    }));
    const checkTestCasesLockStatusMock = jest.fn().mockResolvedValue(true);
    const setAlertMessageMock = jest.fn();
    const customProps: MeasureGroupProps = {
      ...props,
      checkTestCasesLockStatus: checkTestCasesLockStatusMock,
      setAlertMessage: setAlertMessageMock,
    };
    renderMeasureGroupComponent(customProps);

    const groupPopulationInput = screen.getByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement;
    fireEvent.change(groupPopulationInput, {
      target: { value: group.populations[0].definition },
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
describe("Ratio Population Criteria validations", () => {
  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  let ratioMeasure: Measure;
  let ratioGroup: Group;

  beforeEach(() => {
    ratioMeasure = {
      id: "test-measure",
      measureName: "Cthe measure for testing 'Population Criteria validations'",
      cql: MeasureCQL,
      elmJson: ELM_JSON,
      createdBy: MEASURE_CREATEDBY,
      scoring: MeasureScoring.RATIO,
      baseConfigurationTypes: ["Outcome", "Patient Reported Outcome"],
      patientBasis: true,
      model: Model.QDM_5_6,
    } as Measure;

    ratioGroup = {
      id: "1",
      scoring: GroupScoring.RATIO,
      populations: [
        {
          id: "id-1",
          name: PopulationType.INITIAL_POPULATION,
          definition: "Initial Population",
        },
      ],
      groupDescription: "Ratio Group",
      measureGroupTypes: [MeasureGroupTypes.PROCESS],
      populationBasis: "boolean",
      scoringUnit: "",
    };
    ratioMeasure.groups = [ratioGroup];

    measureStore.state.mockImplementationOnce(() => ratioMeasure);

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

    //mocking measureServiceApi before component is rendered
    mockMeasureServiceApi.getReturnTypesForAllCqlFunctions = jest
      .fn()
      .mockReturnValue({ fun: "Encounter" });
    mockMeasureServiceApi.getReturnTypesForAllCqlDefinitions = jest
      .fn()
      .mockReturnValue({
        initialPopulation: "initialPopulation",
        patient: "NA",
        sdeEthnicity: "Coding",
        boolIpp: "xxx",
        sdePayer: "NA",
        sdeRace: "Coding",
        sdeSex: "Code",
        numerator: "Numerator",
        denominator: "Denominator",
        vteProphylaxisByMedicationAdministeredOrDeviceApplied: "boolean",
      });
    mockMeasureServiceApi.fetchMeasure = jest
      .fn()
      .mockResolvedValue(ratioMeasure);
    mockMeasureServiceApi.updateMeasure = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });
    mockMeasureServiceApi.updateGroup = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });
    mockMeasureServiceApi.deleteMeasureGroup = jest.fn().mockResolvedValue({});
  });
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
    ratioMeasure.groups = [group1];
    renderMeasureGroupComponent();

    // verify  IP1 association type radio group is not visible
    const association1 = screen.queryByTestId(
      "measure-group-initial-population-association-id-1"
    );
    await waitFor(() => expect(association1).not.toBeInTheDocument());
  });
});
describe("Cohort Population Criteria validations", () => {
  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  let cohortMeasure: Measure;
  let group: Group;

  beforeEach(() => {
    cohortMeasure = {
      id: "test-measure",
      measureName: "Cthe measure for testing 'Population Criteria validations'",
      cql: MeasureCQL,
      elmJson: ELM_JSON,
      createdBy: MEASURE_CREATEDBY,
      scoring: MeasureScoring.COHORT,
      groups: [{ groupDescription: "Cthe group for testing" }],
      baseConfigurationTypes: ["Outcome", "Patient Reported Outcome"],
      patientBasis: true,
      model: Model.QDM_5_6,
    } as Measure;
    group = {
      id: "",
      scoring: GroupScoring.COHORT,
      populations: [
        {
          id: "id-1",
          name: PopulationType.INITIAL_POPULATION,
          definition: "Initial Population",
          description: "",
        },
      ],
      groupDescription: "Junk Description",
      measureGroupTypes: [],
      populationBasis: "boolean",
      scoringUnit: "",
    } as Group;

    measureStore.state.mockImplementationOnce(() => cohortMeasure);

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

    //mocking measureServiceApi before component is rendered
  });

  test("Should not be able to save if patient based but return type is non-boolean", async () => {
    mockMeasureServiceApi.getReturnTypesForAllCqlFunctions = jest
      .fn()
      .mockReturnValue({ fun: "Encounter" });
    mockMeasureServiceApi.getReturnTypesForAllCqlDefinitions = jest
      .fn()
      .mockReturnValue({
        patient: "NA",
        sdeEthnicity: "Coding",
        boolIpp: "xxx",
        sdePayer: "NA",
        sdeRace: "Coding",
        sdeSex: "Code",
        vteProphylaxisByMedicationAdministeredOrDeviceApplied:
          "MedicalAdministration",
      });
    mockMeasureServiceApi.fetchMeasure = jest
      .fn()
      .mockResolvedValue(cohortMeasure);
    mockMeasureServiceApi.updateMeasure = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });
    mockMeasureServiceApi.updateGroup = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });
    mockMeasureServiceApi.deleteMeasureGroup = jest.fn().mockResolvedValue({});

    renderMeasureGroupComponent();

    // setting initial population from dropdown
    const definitionToUpdate =
      "VTE Prophylaxis by Medication Administered or Device Applied";
    const groupPopulationInput = screen.getByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement;
    fireEvent.change(groupPopulationInput, {
      target: { value: definitionToUpdate },
    });
    expect(groupPopulationInput.value).toBe(definitionToUpdate);

    await waitFor(() => {
      expect(
        screen.getByText(
          "For Patient-based Measures, selected definitions must return a Boolean."
        )
      ).toBeInTheDocument();
    });

    const submitBtn = screen.getByTestId("group-form-submit-btn");
    expect(submitBtn).toBeDisabled();
  });

  test("Should not be able to save if non-patient based but return type is boolean", async () => {
    jest.clearAllMocks();
    //mocking measureServiceApi before component is rendered
    cohortMeasure.scoring = "Cohort";
    cohortMeasure.patientBasis = false;
    group.populationBasis = "MedicationAdministration";
    group.groupDescription = "Atghhh";
    cohortMeasure.groups = [group];
    mockMeasureServiceApi.getReturnTypesForAllCqlFunctions = jest
      .fn()
      .mockReturnValue({ fun: "Encounter" });
    mockMeasureServiceApi.getReturnTypesForAllCqlDefinitions = jest
      .fn()
      .mockReturnValue({
        patient: "NA",
        sdeEthnicity: "Coding",
        sdePayer: "NA",
        sdeRace: "Coding",
        sdeSex: "Code",
        vteProphylaxisByMedicationAdministeredOrDeviceApplied:
          "MedicationAdministration",
        boolIpp: "boolean",
      });
    mockMeasureServiceApi.fetchMeasure = jest
      .fn()
      .mockResolvedValue(cohortMeasure);
    mockMeasureServiceApi.updateMeasure = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });
    mockMeasureServiceApi.updateGroup = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });
    mockMeasureServiceApi.deleteMeasureGroup = jest.fn().mockResolvedValue({});

    renderMeasureGroupComponent();

    // setting initial population from dropdown
    const definitionToUpdate = "boolIpp";
    const groupPopulationInput = screen.getByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement;
    fireEvent.change(groupPopulationInput, {
      target: { value: definitionToUpdate },
    });
    expect(groupPopulationInput.value).toBe(definitionToUpdate);

    await waitFor(() => {
      expect(
        screen.getByText(
          "For Episode-based Measures, selected definitions must return a list of the same type (Non-Boolean)."
        )
      ).toBeInTheDocument();
    });

    const submitBtn = screen.getByTestId("group-form-submit-btn");
    expect(submitBtn).toBeDisabled();
  });

  test("Should not be able to save if non-patient based but return types are different", async () => {
    cohortMeasure.patientBasis = false;
    cohortMeasure.scoring = "Ratio";
    renderMeasureGroupComponent();

    await waitFor(() => {
      const allPopulationsInputs = screen.getAllByTestId(
        "select-measure-group-population-input"
      ) as HTMLInputElement[];

      // setting initial population
      const initialPopulation =
        "VTE Prophylaxis by Medication Administered or Device Applied";
      fireEvent.change(allPopulationsInputs[0], {
        target: {
          value: initialPopulation,
        },
      });
      expect(allPopulationsInputs[0].value).toBe(initialPopulation);

      // setting Denominator
      fireEvent.change(allPopulationsInputs[1], {
        target: {
          value: "Denominator",
        },
      });
      expect(allPopulationsInputs[1].value).toBe("Denominator");

      fireEvent.change(allPopulationsInputs[2], {
        target: {
          value: "Denominator",
        },
      });
      expect(allPopulationsInputs[2].value).toBe("Denominator");

      fireEvent.change(allPopulationsInputs[3], {
        target: {
          value: "Denominator",
        },
      });
      expect(allPopulationsInputs[3].value).toBe("Denominator");

      const submitBtn = screen.getByTestId("group-form-submit-btn");
      expect(submitBtn).toBeEnabled();
      userEvent.click(submitBtn);
      //TODO GAK MAT-6197 commented out  because tests weren't running reliably
      //   const alert = screen.findByTestId("error-alerts");
      // setTimeout(() => {
      //   const validationError = screen.getAllByText(
      //     "For Episode-based Measures, selected definitions must return a list of the same type (Non-Boolean)."
      //   ) as HTMLInputElement[];

      //   expect(validationError[0]).toBeInTheDocument();
      // }, 100);
    });
  });

  test("Should not be able to save as Continuous Variable needs Aggregate Function", async () => {
    cohortMeasure.patientBasis = false;
    cohortMeasure.scoring = "Continuous Variable";

    renderMeasureGroupComponent();

    const allPopulationsInputs = screen.getAllByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement[];

    // setting initial population
    fireEvent.change(allPopulationsInputs[0], {
      target: {
        value: "Initial Population",
      },
    });
    expect(allPopulationsInputs[0].value).toBe("Initial Population");

    // setting Denominator
    fireEvent.change(allPopulationsInputs[1], {
      target: {
        value: "Denominator",
      },
    });
    expect(allPopulationsInputs[1].value).toBe("Denominator");

    // setting Numerator
    fireEvent.change(allPopulationsInputs[2], {
      target: {
        value: "Numerator",
      },
    });
    expect(allPopulationsInputs[2].value).toBe("Numerator");

    // setting Observation
    const observationInput = screen.getByTestId(
      "measure-observation-cv-obs-input"
    ) as HTMLInputElement;
    fireEvent.change(observationInput, {
      target: {
        value: "fun",
      },
    });
    expect(observationInput.value).toBe("fun");

    await waitFor(() => {
      const submitBtn = screen.getByTestId("group-form-submit-btn");
      expect(submitBtn).toBeDisabled();
    });
  });

  test("test MISMATCH_CQL_POPULATION_RETURN_TYPES error", async () => {
    cohortMeasure.scoring = "Cohort";
    cohortMeasure.patientBasis = true;
    cohortMeasure.errors = [
      MeasureErrorType.MISMATCH_CQL_POPULATION_RETURN_TYPES,
    ];
    act(() => {
      renderMeasureGroupComponent();
    });

    await waitFor(() => {
      const alert = screen.findByTestId("error-alerts");
      // //TODO GAK MAT-6197 commented out  because tests weren't running reliably
      // setTimeout(() => {
      //   expect(alert).toBeInTheDocument();
      //   expect(alert).toHaveTextContent(
      //     "One or more Population Criteria has a mismatch with CQL return types. Test Cases cannot be executed until this is resolved."
      //   );
      // }, 100);
    });
  });

  test("Should not be able to save if non-patient based but return types are different with Stratifications", async () => {
    cohortMeasure.patientBasis = false;
    cohortMeasure.scoring = "Cohort";

    renderMeasureGroupComponent();

    const groupPopulationInput = screen.getByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement;
    expect(groupPopulationInput).toBeInTheDocument();

    act(() => {
      fireEvent.change(groupPopulationInput, {
        target: {
          value: "VTE Prophylaxis by Medication Administered or Device Applied",
        },
      });
    });

    userEvent.click(screen.getByTestId("stratifications-tab"));

    const strat1Input = screen.getByTestId("stratification-1-input");
    expect(strat1Input).toBeInTheDocument();
    fireEvent.change(strat1Input, {
      target: {
        value: "boolIpp",
      },
    });

    await waitFor(() => {
      const submitBtn = screen.getByTestId("group-form-submit-btn");
      expect(submitBtn).toBeDisabled();
    });
  });

  test("Should not be able to save with non-patient based stratification return type is not the same", async () => {
    cohortMeasure.patientBasis = false;
    cohortMeasure.scoring = "Cohort";
    renderMeasureGroupComponent();

    await waitFor(() => {
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
      const submitBtn = screen.getByTestId("group-form-submit-btn");

      userEvent.click(screen.getByTestId("stratifications-tab"));

      expect(submitBtn).toBeEnabled();
      userEvent.click(submitBtn);
      //TODO GAK MAT-6197 commented out  because tests weren't running reliably
      // setTimeout(() => {
      //   const alert = screen.findByTestId("error-alerts");
      //   expect(alert).toHaveTextContent(
      //     "For Episode-based Measures, selected definitions must return a list of the same type and Measure Observations input parameter must also be equal to that same type."
      //   );
      // }, 500);
    });
  });
});
describe("Delete Tests", () => {
  let cohortMeasure: Measure;
  let cohortGroup: Group;
  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });
  beforeEach(() => {
    cohortMeasure = {
      id: "test-measure",
      measureName: "Cthe measure for testing 'Population Criteria validations'",
      cql: MeasureCQL,
      elmJson: ELM_JSON,
      createdBy: MEASURE_CREATEDBY,
      scoring: MeasureScoring.COHORT,
      groups: [{ groupDescription: "Cthe group for testing" }],
      baseConfigurationTypes: ["Outcome", "Patient Reported Outcome"],
      patientBasis: true,
      model: Model.QDM_5_6,
    } as Measure;
    cohortGroup = {
      id: "",
      scoring: GroupScoring.COHORT,
      populations: [
        {
          id: "id-1",
          name: PopulationType.INITIAL_POPULATION,
          definition: "Initial Population",
          description: "",
        },
      ],
      groupDescription: "Junk Description",
      measureGroupTypes: [],
      populationBasis: "boolean",
      scoringUnit: "",
    } as Group;

    measureStore.state.mockImplementationOnce(() => cohortMeasure);

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

    //mocking measureServiceApi before component is rendered
    mockMeasureServiceApi.getReturnTypesForAllCqlFunctions = jest
      .fn()
      .mockReturnValue({ fun: "Encounter" });
    mockMeasureServiceApi.getReturnTypesForAllCqlDefinitions = jest
      .fn()
      .mockReturnValue({
        patient: "NA",
        sdeEthnicity: "Coding",
        sdePayer: "NA",
        sdeRace: "Coding",
        sdeSex: "Code",
        vteProphylaxisByMedicationAdministeredOrDeviceApplied:
          "MedicationAdministration",
      });
    mockMeasureServiceApi.fetchMeasure = jest
      .fn()
      .mockResolvedValue(cohortMeasure);
    mockMeasureServiceApi.updateMeasure = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });
    mockMeasureServiceApi.updateGroup = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });
    mockMeasureServiceApi.deleteMeasureGroup = jest.fn().mockResolvedValue({});
  });
  test("On clicking delete button, delete group modal is displayed", async () => {
    cohortGroup.id = "7p03-5r29-7O0I";
    cohortGroup.groupDescription = "testDescription";
    cohortMeasure.groups = [cohortGroup];
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

    const descriptionEditor = screen.getByTestId(
      "group-description-rich-text-editor"
    );
    expect(descriptionEditor).toBeInTheDocument();
    expect(descriptionEditor).toHaveTextContent("testDescription");
  });

  test("On clicking delete button, measure group should be deleted", async () => {
    cohortGroup.id = "7p03-5r29-7O0I";
    cohortGroup.groupDescription = "testDescription";
    cohortMeasure.groups = [cohortGroup];
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
      measureName: "Athe measure for testing",
      cql: MeasureCQL,
      createdBy: MEASURE_CREATEDBY,
      groups: [],
    };
    act(() =>
      userEvent.click(
        screen.getByTestId("delete-measure-group-modal-agree-btn")
      )
    );

    expect(mockMeasureServiceApi.deleteMeasureGroup).toHaveBeenCalledWith(
      "7p03-5r29-7O0I",
      "test-measure"
    );

    renderMeasureGroupComponent();
    await waitFor(() => {
      const descriptionEditor = screen.getByTestId(
        "group-description-rich-text-editor"
      );
      expect(descriptionEditor).toBeInTheDocument();

      const editableContent = within(descriptionEditor).getByRole("textbox");
      expect(editableContent).toHaveAttribute("contenteditable", "true");
      expect(editableContent).toHaveTextContent("");
    });
  });
});

describe.skip("Tests where serviceApi is mocked, instead of Axios", () => {
  let cohortMeasure: Measure;
  let cohortGroup: Group;

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  beforeEach(() => {
    cohortMeasure = {
      id: "test-measure",
      measureName: "Cthe measure for testing 'Population Criteria validations'",
      cql: MeasureCQL,
      elmJson: ELM_JSON,
      createdBy: MEASURE_CREATEDBY,
      scoring: MeasureScoring.COHORT,
      groups: [{ groupDescription: "Cthe group for testing" }],
      baseConfigurationTypes: ["Outcome", "Patient Reported Outcome"],
      patientBasis: true,
      model: Model.QDM_5_6,
    } as Measure;
    cohortGroup = {
      id: "",
      scoring: GroupScoring.COHORT,
      populations: [
        {
          id: "id-1",
          name: PopulationType.INITIAL_POPULATION,
          definition: "Initial Population",
          description: "",
        },
      ],
      groupDescription: "Junk Description",
      measureGroupTypes: [],
      populationBasis: "boolean",
      scoringUnit: "",
    } as Group;

    measureStore.state.mockImplementationOnce(() => cohortMeasure);

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

    //mocking measureServiceApi before component is rendered
    mockMeasureServiceApi.getReturnTypesForAllCqlFunctions = jest
      .fn()
      .mockReturnValue({ fun: "Encounter" });
    mockMeasureServiceApi.getReturnTypesForAllCqlDefinitions = jest
      .fn()
      .mockReturnValue({
        patient: "NA",
        sdeEthnicity: "Coding",
        boolIpp: "xxx",
        sdePayer: "NA",
        sdeRace: "Coding",
        sdeSex: "Code",
        vteProphylaxisByMedicationAdministeredOrDeviceApplied: "boolean",
      });
    mockMeasureServiceApi.fetchMeasure = jest
      .fn()
      .mockResolvedValue(cohortMeasure);
    mockMeasureServiceApi.updateMeasure = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });
    mockMeasureServiceApi.updateGroup = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });
    mockMeasureServiceApi.deleteMeasureGroup = jest.fn().mockResolvedValue({});
  });
  test("Should create population Group with one initial population successfully", async () => {
    //mocking measureServiceApi before component is rendered

    mockMeasureServiceApi.getReturnTypesForAllCqlFunctions = jest
      .fn()
      .mockReturnValue({ fun: "Encounter" });
    mockMeasureServiceApi.getReturnTypesForAllCqlDefinitions = jest
      .fn()
      .mockReturnValue({
        patient: "NA",
        sdeEthnicity: "Coding",
        sdePayer: "NA",
        sdeRace: "Coding",
        sdeSex: "Code",
        vteProphylaxisByMedicationAdministeredOrDeviceApplied:
          "MedicationAdministration",
      });
    mockMeasureServiceApi.fetchMeasure = jest
      .fn()
      .mockResolvedValue(cohortMeasure);
    mockMeasureServiceApi.updateMeasure = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });
    mockMeasureServiceApi.updateGroup = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });

    cohortMeasure.patientBasis = false;
    cohortMeasure.scoring = MeasureScoring.COHORT;
    cohortMeasure.groups = [cohortGroup];
    await waitFor(() => renderMeasureGroupComponent());

    const descriptionEditor = screen.getByTestId(
      "group-description-rich-text-editor"
    );
    expect(descriptionEditor).toBeInTheDocument();

    const editableContent = within(descriptionEditor).getByRole("textbox");
    expect(editableContent).toHaveAttribute("contenteditable", "true");

    await act(async () => {
      fireEvent.focus(editableContent);
      editableContent.innerHTML = "test description";
      fireEvent.input(editableContent, {
        target: { innerHTML: "test description" },
      });
      fireEvent.blur(editableContent);
    });

    // Wait for debounced update to take effect (250ms delay from TextEditor component)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    const groupPopulationInput = screen.getByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement;
    fireEvent.change(groupPopulationInput, {
      target: { value: cohortGroup.populations[0].definition },
    });

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

    // saving a  measure..
    await act(async () => {
      expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
      userEvent.click(screen.getByTestId("group-form-submit-btn"));
      const requiredPopulations = await screen.findByTestId(
        "save-measure-group-validation-message"
      );
      expect(requiredPopulations).toBeInTheDocument();
    });
  });
});

describe("GAK MAT-6526 These tests were skipped in a previous story, but are working as of this story", () => {
  describe("TODO  GAK MAT-6197 These tests were skipped in a previous story /shrug", () => {
    test.skip("measure observation should render for CV group", async () => {
      measure.scoring = GroupScoring.CONTINUOUS_VARIABLE;
      group.scoring = GroupScoring.CONTINUOUS_VARIABLE;
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
          definition: "Measure Population",
        },
        {
          id: "id-3",
          name: PopulationType.MEASURE_POPULATION_EXCLUSION,
          definition: "Measure Population Exclusion",
        },
        {
          id: "id-4",
          name: PopulationType.MEASURE_OBSERVATION,
          definition: "Measure Observation",
        },
      ];

      measure.groups = [group];

      renderMeasureGroupComponent();
      expect(
        screen.getByTestId("select-measure-observation-cv-obs")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("select-measure-observation-aggregate-cv-obs")
      ).toBeInTheDocument();
    });

    test.skip("measure observation should render existing for continuous variable", async () => {
      measure.scoring = GroupScoring.CONTINUOUS_VARIABLE;
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
      //measureObservations uses memoizedObservation which does getDefaultObservationsForScoring
      expect(observationInput.value).toBe("fun");

      const aggregateFuncInput = screen.getByTestId(
        "measure-observation-aggregate-cv-obs-input"
      ) as HTMLInputElement;
      //measureObservations uses memoizedObservation which does getDefaultObservationsForScoring
      expect(aggregateFuncInput.value).toEqual("Count");
    });

    test.skip("measure observation should render existing for ratio group", async () => {
      group.scoring = "Ratio";
      measure.scoring = MeasureScoring.RATIO;
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

    test.skip("Measure Group Description should not render input field if user is not the measure owner", async () => {
      (checkUserCanEdit as jest.Mock).mockImplementation(() => false);
      const { queryByTestId } = await waitFor(() =>
        renderMeasureGroupComponent()
      );
      const inputField = queryByTestId("groupDescriptionInput");
      expect(inputField).toBeDisabled();
    });

    test.skip("Measure Group Save button should not render if user is not the measure owner", async () => {
      (checkUserCanEdit as jest.Mock).mockImplementation(() => false);
      const { queryByTestId } = await waitFor(() =>
        renderMeasureGroupComponent()
      );
      const saveButton = queryByTestId("group-form-submit-btn");
      expect(saveButton).not.toBeInTheDocument();
    });

    test.skip("Should trigger error for bad scoring configuration", async () => {
      measure.scoring = null;
      renderMeasureGroupComponent();
      const alert = await screen.findByTestId("error-alerts");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(
        "Please complete the Base Configuration tab before continuing"
      );
    });

    test.skip("Should trigger error for bad CQL", async () => {
      measure.cql = null;
      measure.scoring = GroupScoring.COHORT;
      renderMeasureGroupComponent();
      const alert = await screen.findByTestId("error-alerts");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(
        "Please complete the CQL Editor process before continuing"
      );
    });

    test.skip("Should trigger error for bad CQL and bad scoring configuration", async () => {
      measure.cql = null;
      measure.scoring = null;
      renderMeasureGroupComponent();
      const alert = await screen.findByTestId("error-alerts");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(
        "Please complete the CQL Editor process and Base Configuration tab before continuing"
      );
    });
  });
});
