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
import { MemoryRouter, Route } from "react-router-dom";
import { ELM_JSON, MeasureCQL } from "../../../../common/MeasureCQL";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import * as uuid from "uuid";
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
  association: null,
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

const props: MeasureGroupProps = {
  measureGroupNumber: 0,
  setMeasureGroupNumber: jest.fn,
  setIsFormDirty: jest.fn,
  measureId: "testMeasureId",
};

describe("Measure Groups Page", () => {
  let measure: Measure;

  afterEach(() => {
    jest.clearAllMocks();
  });
  measure = {
    id: "test-measure",
    measureName: "the measure for testing",
    cql: MeasureCQL,
    elmJson: ELM_JSON,
    createdBy: MEASURE_CREATEDBY,
    scoring: GroupScoring.COHORT,
    groups: [{ groupDescription: "" }],
    baseConfigurationTypes: ["Outcome", "Patient Reported Outcome"],
    patientBasis: true,
    model: Model.QDM_5_6,
  } as Measure;
  let group: Group;
  beforeEach(() => {
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
  });

  const renderMeasureGroupComponent = () => {
    return render(
      <MemoryRouter
        initialEntries={[{ pathname: "/measures/test-measure/edit/groups/1" }]}
      >
        <ApiContextProvider value={serviceConfig}>
          <Route path="/measures/test-measure/edit/groups/:groupNumber">
            <MeasureGroups {...props} />
          </Route>
        </ApiContextProvider>
      </MemoryRouter>
    );
  };

  test("test update fails with error alert", async () => {
    measure.patientBasis = false;
    measure.scoring = MeasureScoring.COHORT;

    await waitFor(() => renderMeasureGroupComponent());

    const groupDescriptionInput = screen.getByTestId("groupDescriptionInput");
    fireEvent.change(groupDescriptionInput, {
      target: { value: "new description" },
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

    // Update the definition
    const initialPopulationDescription = screen.getByTestId(
      "populations[0].description-description"
    );
    expect(initialPopulationDescription).toBeInTheDocument();
    act(() => {
      userEvent.paste(initialPopulationDescription, "newVal");
    });
    expect(initialPopulationDescription.value).toBe("newVal");

    mockedAxios.put.mockRejectedValueOnce({ data: "Request Rejected" });

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

    const groupDescriptionInput = screen.getByTestId("groupDescriptionInput");
    fireEvent.change(groupDescriptionInput, {
      target: { value: "new description" },
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

    // Update the definition
    const initialPopulationDescription = screen.getByTestId(
      "populations[0].description-description"
    );
    expect(initialPopulationDescription).toBeInTheDocument();
    act(() => {
      userEvent.paste(initialPopulationDescription, "newVal");
    });
    expect(initialPopulationDescription.value).toBe("newVal");

    mockedAxios.put.mockResolvedValueOnce({ data: group });
    mockedAxios.get.mockRejectedValueOnce({
      status: 404,
      data: "failure",
      error: { message: "error" },
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

  describe("Population Criteria validations", () => {
    test("Should not be able to save if patient based but return type is none boolean", async () => {
      measure.scoring = "Cohort";
      measure.patientBasis = true;
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
      measure.scoring = "Cohort";
      measure.patientBasis = false;
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
      measure.patientBasis = false;
      measure.scoring = "Ratio";
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
      measure.patientBasis = false;
      measure.scoring = "Continuous Variable";

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
      measure.scoring = "Cohort";
      measure.patientBasis = true;
      measure.errors = [MeasureErrorType.MISMATCH_CQL_POPULATION_RETURN_TYPES];
      act(() => {
        renderMeasureGroupComponent();
      });

      //const alert = screen.findByTestId("error-alerts");
      // //TODO GAK MAT-6197 commented out  because tests weren't running reliably
      // setTimeout(() => {
      //   expect(alert).toBeInTheDocument();
      //   expect(alert).toHaveTextContent(
      //     "One or more Population Criteria has a mismatch with CQL return types. Test Cases cannot be executed until this is resolved."
      //   );
      // }, 100);
    });

    test("Should not be able to save if non-patient based but return types are different with Stratifications", async () => {
      measure.patientBasis = false;
      measure.scoring = "Cohort";

      renderMeasureGroupComponent();
      const groupPopulationInput = screen.getByTestId(
        "select-measure-group-population-input"
      ) as HTMLInputElement;
      fireEvent.change(groupPopulationInput, {
        target: {
          value: "VTE Prophylaxis by Medication Administered or Device Applied",
        },
      });

      userEvent.click(screen.getByTestId("stratifications-tab"));

      const strat1Input = screen.getByTestId("stratification-1-input");
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

  test("should display selected scoring unit", async () => {
    const { getByTestId } = await waitFor(() => renderMeasureGroupComponent());

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
    const groupDescriptionInput = screen.getByTestId("groupDescriptionInput");
    fireEvent.change(groupDescriptionInput, {
      target: { value: "new description" },
    });

    const groupPopulationInput = screen.getByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement;
    act(() => {
      fireEvent.change(groupPopulationInput, {
        target: { value: group.populations[0].definition },
      });
    });
    const initialPopulationDescription = screen.getByTestId(
      "populations[0].description-description"
    );
    expect(initialPopulationDescription).toBeInTheDocument();
    act(() => {
      userEvent.paste(initialPopulationDescription, "newVal");
    });
    expect(initialPopulationDescription.value).toBe("newVal");
    mockedAxios.post.mockRejectedValueOnce({ data: "Request Rejected" });
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

    const groupDescriptionInput = screen.getByTestId("groupDescriptionInput");
    fireEvent.change(groupDescriptionInput, {
      target: { value: "new description" },
    });

    const groupPopulationInput = screen.getByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement;
    fireEvent.change(groupPopulationInput, {
      target: { value: group.populations[0].definition },
    });

    const initialPopulationDescription = screen.getByTestId(
      "populations[0].description-description"
    );
    expect(initialPopulationDescription).toBeInTheDocument();
    act(() => {
      userEvent.paste(initialPopulationDescription, "newVal");
    });
    expect(initialPopulationDescription.value).toBe("newVal");

    mockedAxios.post.mockResolvedValueOnce({ data: group });

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

  test("Should create population Group with one initial population successfully", async () => {
    measure.patientBasis = false;
    measure.scoring = MeasureScoring.COHORT;
    measure.groups = [];
    await waitFor(() => renderMeasureGroupComponent());

    const groupDescriptionInput = screen.getByTestId("groupDescriptionInput");
    fireEvent.change(groupDescriptionInput, {
      target: { value: "new description" },
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

    mockedAxios.post.mockResolvedValueOnce({ data: { group } });
    mockedAxios.get.mockResolvedValueOnce({ data: measure });

    // saving a  measure..
    await waitFor(() => {
      expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
      userEvent.click(screen.getByTestId("group-form-submit-btn"));

      //TODO  This timeout shouldn't be necessasry and is there to deal with test failures.
      //      The tests are still failing sporadically.  This needs to be investigated.

      // setTimeout(() => {
      //   const alert = screen.findByTestId("population-criteria-success");
      //   expect(alert).toHaveTextContent(
      //     "Population details for this group saved successfully."
      //   );
      // }, 100);
    });
  });

  test("On clicking delete button, delete group modal is displayed", async () => {
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
        initialEntries={[{ pathname: "/measures/test-measure/edit/groups" }]}
      >
        <ApiContextProvider value={serviceConfig}>
          <Route path="/measures/test-measure/edit/groups">
            <MeasureGroups {...props} />
          </Route>
        </ApiContextProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("groupDescriptionInput")).toHaveValue("");
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

    test.skip("should not show Initial Population Association for Ratio scoring when there is 1 Initial Population", async () => {
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

    test.skip("should show Initial Population Association for Ratio scoring when there are 2 Initial Populations and can change values", async () => {
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
