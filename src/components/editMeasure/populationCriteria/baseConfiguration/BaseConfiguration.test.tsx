import * as React from "react";
import {
  render,
  fireEvent,
  waitFor,
  screen,
  within,
} from "@testing-library/react";
import { act } from "react-dom/test-utils";
import BaseConfiguration from "./BaseConfiguration";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../../api/useMeasureServiceApi";
import { Measure } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";

const mockHistoryPush = jest.fn();

jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom") as any),
  useNavigate: () => mockHistoryPush,
}));
jest.mock("../../../../api/useMeasureServiceApi");
const measure = {
  id: "test measure",
  measureName: "the measure for testing",
  cqlLibraryName: "TestCqlLibraryName",
  ecqmTitle: "ecqmTitle",
  measurementPeriodStart: "01/01/2022",
  measurementPeriodEnd: "12/02/2022",
  createdBy: "john doe",
  measureSetId: "testMeasureId",
  acls: [{ userId: "othertestuser@example.com", roles: ["SHARED_WITH"] }], //#nosec
} as unknown as Measure;

jest.mock("@madie/madie-editor", () => ({
  synchingEditorCqlContent: jest.fn().mockResolvedValue("modified cql"),
  parseContent: jest.fn(() => []),
  validateContent: jest.fn().mockResolvedValue({
    errors: [],
    translation: { library: "NewLibName" },
  }),
}));

jest.mock("@madie/madie-util", () => ({
  useOktaTokens: jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  })),
  useKeyPress: jest.fn(() => false),
  measureStore: {
    updateMeasure: jest.fn(),
    state: measure,
    initialState: jest.fn(),
    subscribe: () => {
      return { unsubscribe: () => null };
    },
  },
  routeHandlerStore: {
    subscribe: (set) => {
      set();
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: () => null,
    state: { canTravel: true, pendingPath: "" },
    initialState: { canTravel: true, pendingPath: "" },
  },

  checkUserCanEdit: jest.fn(() => {
    return true;
  }),
}));

const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;

let serviceApiMock: MeasureServiceApi;

describe("Base Configuration component", () => {
  const {
    getByTestId,
    findByTestId,
    findAllByTestId,
    getByText,
    getByLabelText,
  } = screen;

  test("Measure Group Scoring renders to correct options length, and defaults to empty string", async () => {
    render(<BaseConfiguration />);

    const scoringSelectInput = getByTestId(
      "scoring-select-input"
    ) as HTMLInputElement;
    expect(scoringSelectInput.value).toBe("");

    // options will be rendered only after clicking the select,
    const scoringSelect = getByTestId("scoring-select");
    const scoringSelectDropdown = within(scoringSelect).getByRole(
      "combobox"
    ) as HTMLInputElement;
    userEvent.click(scoringSelectDropdown);

    const optionsList = await findAllByTestId(/scoring-option/i);
    expect(optionsList).toHaveLength(4);
  });

  test("Change of Measure Group Scoring enables Discard button and click Discard resets the form", async () => {
    render(<BaseConfiguration />);

    const scoringSelectInput = getByTestId(
      "scoring-select-input"
    ) as HTMLInputElement;

    const scoringSelect = getByTestId("scoring-select");
    const scoringSelectDropdown = within(scoringSelect).getByRole(
      "combobox"
    ) as HTMLInputElement;
    userEvent.click(scoringSelectDropdown);

    // Change the scoring value
    fireEvent.change(scoringSelectInput, {
      target: { value: "Cohort" },
    });
    expect(scoringSelectInput.value).toBe("Cohort");

    const cancelButton = getByTestId("cancel-button");
    expect(cancelButton).toBeInTheDocument();
    await waitFor(() => expect(cancelButton).toBeEnabled());
    act(() => {
      fireEvent.click(cancelButton);
    });

    const discardDialog = await getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();
    const continueButton = await getByTestId("discard-dialog-continue-button");
    expect(continueButton).toBeInTheDocument();
    fireEvent.click(continueButton);
    await waitFor(() => {
      expect(scoringSelectInput.value).toBe("");
    });
  });

  test("Discard change then click Keep Working", async () => {
    render(<BaseConfiguration />);

    const scoringSelectInput = getByTestId(
      "scoring-select-input"
    ) as HTMLInputElement;

    const scoringSelect = getByTestId("scoring-select");
    const scoringSelectDropdown = within(scoringSelect).getByRole(
      "combobox"
    ) as HTMLInputElement;
    userEvent.click(scoringSelectDropdown);

    fireEvent.change(scoringSelectInput, {
      target: { value: "Cohort" },
    });
    expect(scoringSelectInput.value).toBe("Cohort");

    const cancelButton = getByTestId("cancel-button");
    expect(cancelButton).toBeInTheDocument();
    await waitFor(() => expect(cancelButton).toBeEnabled());
    act(() => {
      fireEvent.click(cancelButton);
    });

    const discardDialog = await getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();
    const discardCancelButton = await getByTestId(
      "discard-dialog-cancel-button"
    );
    expect(discardCancelButton).toBeInTheDocument();
    fireEvent.click(discardCancelButton);
    await waitFor(() => {
      expect(scoringSelectInput.value).toBe("Cohort");
    });
  });

  test("Changes to Base Configuration enables Save button and saving successfully displays success message", async () => {
    serviceApiMock = {
      updateMeasure: jest.fn().mockResolvedValueOnce({ status: 200 }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);

    render(<BaseConfiguration />);

    const scoringSelectInput = getByTestId(
      "scoring-select-input"
    ) as HTMLInputElement;

    const scoringSelect = getByTestId("scoring-select");
    const scoringSelectDropdown = within(scoringSelect).getByRole(
      "combobox"
    ) as HTMLInputElement;
    userEvent.click(scoringSelectDropdown);

    fireEvent.change(scoringSelectInput, {
      target: { value: "Cohort" },
    });
    expect(scoringSelectInput.value).toBe("Cohort");

    const baseConfigurationTypesSelect = getByTestId(
      "base-configuration-types-dropdown"
    );
    expect(baseConfigurationTypesSelect).toBeInTheDocument();
    const baseConfigurationTypesButton = within(
      baseConfigurationTypesSelect
    ).getByTitle("Open");

    userEvent.click(baseConfigurationTypesButton);
    expect(getByText("Structure")).toBeInTheDocument();
    userEvent.click(getByText("Structure"));

    // setting patient basis to true
    userEvent.click(getByLabelText("Yes"));

    const saveButton = getByTestId("measure-Base Configuration-save");
    expect(saveButton).toBeInTheDocument();
    await waitFor(() => expect(saveButton).toBeEnabled());
    fireEvent.click(saveButton);
    await waitFor(() =>
      expect(serviceApiMock.updateMeasure).toBeCalledWith({
        ...measure,
        scoring: "Cohort",
        baseConfigurationTypes: ["Structure"],
        patientBasis: true,
      })
    );

    expect(
      await getByText("Measure Base Configuration Updated Successfully")
    ).toBeInTheDocument();

    const toastCloseButton = await findByTestId("close-error-button");
    expect(toastCloseButton).toBeInTheDocument();
    fireEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });
  });

  test("Save measure scoring with failure will display error message", async () => {
    serviceApiMock = {
      updateMeasure: jest.fn().mockRejectedValueOnce({
        status: 500,
        response: { data: { message: "update failed" } },
      }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);

    render(<BaseConfiguration />);

    const scoringSelectInput = getByTestId(
      "scoring-select-input"
    ) as HTMLInputElement;

    const scoringSelect = getByTestId("scoring-select");
    const scoringSelectDropdown = within(scoringSelect).getByRole(
      "combobox"
    ) as HTMLInputElement;
    userEvent.click(scoringSelectDropdown);

    fireEvent.change(scoringSelectInput, {
      target: { value: "Cohort" },
    });
    expect(scoringSelectInput.value).toBe("Cohort");

    const baseConfigurationTypesSelect = getByTestId(
      "base-configuration-types-dropdown"
    );
    expect(baseConfigurationTypesSelect).toBeInTheDocument();
    const baseConfigurationTypesButton = within(
      baseConfigurationTypesSelect
    ).getByTitle("Open");

    userEvent.click(baseConfigurationTypesButton);

    expect(getByText("Structure")).toBeInTheDocument();
    const target = getByText("Structure");

    userEvent.click(target);

    // setting patient basis to false
    userEvent.click(getByLabelText("No"));

    const saveButton = getByTestId("measure-Base Configuration-save");
    expect(saveButton).toBeInTheDocument();
    await waitFor(() => expect(saveButton).toBeEnabled());
    fireEvent.click(saveButton);
    await waitFor(() =>
      expect(serviceApiMock.updateMeasure).toBeCalledWith({
        ...measure,
        scoring: "Cohort",
        baseConfigurationTypes: ["Structure"],
        patientBasis: false,
      })
    );

    expect(
      await getByText(
        "Error updating Measure Base Configuration: update failed"
      )
    ).toBeInTheDocument();
    const toastCloseButton = await findByTestId("close-error-button");
    expect(toastCloseButton).toBeInTheDocument();
    fireEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });
  });

  test("change measure scoring will prompt warning dialog", async () => {
    serviceApiMock = {
      updateMeasure: jest.fn().mockResolvedValueOnce({ status: 200 }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);

    render(<BaseConfiguration />);

    const scoringSelectInput = getByTestId(
      "scoring-select-input"
    ) as HTMLInputElement;

    const scoringSelect = getByTestId("scoring-select");
    const scoringSelectDropdown = within(scoringSelect).getByRole(
      "combobox"
    ) as HTMLInputElement;
    userEvent.click(scoringSelectDropdown);

    fireEvent.change(scoringSelectInput, {
      target: { value: "Cohort" },
    });
    expect(scoringSelectInput.value).toBe("Cohort");

    const baseConfigurationTypesSelect = getByTestId(
      "base-configuration-types-dropdown"
    );
    expect(baseConfigurationTypesSelect).toBeInTheDocument();
    const baseConfigurationTypesButton = within(
      baseConfigurationTypesSelect
    ).getByTitle("Open");

    userEvent.click(baseConfigurationTypesButton);
    expect(getByText("Structure")).toBeInTheDocument();
    userEvent.click(getByText("Structure"));

    userEvent.click(getByLabelText("Yes"));

    const saveButton = getByTestId("measure-Base Configuration-save");
    expect(saveButton).toBeInTheDocument();
    await waitFor(() => expect(saveButton).toBeEnabled());
    fireEvent.click(saveButton);
    await waitFor(() =>
      expect(serviceApiMock.updateMeasure).toBeCalledWith({
        ...measure,
        scoring: "Cohort",
        baseConfigurationTypes: ["Structure"],
        patientBasis: true,
      })
    );

    expect(
      await getByText("Measure Base Configuration Updated Successfully")
    ).toBeInTheDocument();

    const toastCloseButton = await findByTestId("close-error-button");
    expect(toastCloseButton).toBeInTheDocument();
    fireEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });

    userEvent.click(scoringSelectDropdown);
    fireEvent.change(scoringSelectInput, {
      target: { value: "Ratio" },
    });
    expect(scoringSelectInput.value).toBe("Ratio");

    await waitFor(() => expect(saveButton).toBeEnabled());
    fireEvent.click(saveButton);

    await waitFor(() => {
      const changeScoringDialog = getByTestId(
        "update-measure-group-scoring-dialog"
      );
      expect(changeScoringDialog).toBeInTheDocument();
      expect(getByText("Change Scoring?")).toBeInTheDocument();
      const changeScoringModalCloseButton = getByTestId(
        "update-measure-group-scoring-modal-cancel-btn"
      );
      expect(changeScoringModalCloseButton).toBeInTheDocument();
      const changeScoringModalSaveButton = getByTestId(
        "update-measure-group-scoring-modal-agree-btn"
      );
      expect(changeScoringModalSaveButton).toBeInTheDocument();
    });
  });

  //RangeError: Maximum call stack size exceeded - error only happens with npm test -- --coverage
  //temp skip
  test.skip("click on change scoring warning dialog close button will close the dialog", async () => {
    serviceApiMock = {
      updateMeasure: jest.fn().mockResolvedValueOnce({ status: 200 }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);

    render(<BaseConfiguration />);

    const scoringSelectInput = getByTestId(
      "scoring-select-input"
    ) as HTMLInputElement;

    const scoringSelect = getByTestId("scoring-select");
    const scoringSelectDropdown = within(scoringSelect).getByRole(
      "combobox"
    ) as HTMLInputElement;
    userEvent.click(scoringSelectDropdown);

    fireEvent.change(scoringSelectInput, {
      target: { value: "Cohort" },
    });
    expect(scoringSelectInput.value).toBe("Cohort");

    const baseConfigurationTypesSelect = getByTestId(
      "base-configuration-types-dropdown"
    );
    expect(baseConfigurationTypesSelect).toBeInTheDocument();
    const baseConfigurationTypesButton = within(
      baseConfigurationTypesSelect
    ).getByTitle("Open");

    userEvent.click(baseConfigurationTypesButton);
    expect(getByText("Structure")).toBeInTheDocument();
    userEvent.click(getByText("Structure"));

    userEvent.click(getByLabelText("Yes"));

    const saveButton = getByTestId("measure-Base Configuration-save");
    expect(saveButton).toBeInTheDocument();
    await waitFor(() => expect(saveButton).toBeEnabled());
    fireEvent.click(saveButton);
    await waitFor(() =>
      expect(serviceApiMock.updateMeasure).toBeCalledWith({
        ...measure,
        scoring: "Cohort",
        baseConfigurationTypes: ["Structure"],
        patientBasis: true,
      })
    );

    expect(
      await getByText("Measure Base Configuration Updated Successfully")
    ).toBeInTheDocument();

    const toastCloseButton = await findByTestId("close-error-button");
    expect(toastCloseButton).toBeInTheDocument();
    fireEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });

    userEvent.click(scoringSelectDropdown);
    fireEvent.change(scoringSelectInput, {
      target: { value: "Ratio" },
    });
    expect(scoringSelectInput.value).toBe("Ratio");

    await waitFor(() => expect(saveButton).toBeEnabled());
    fireEvent.click(saveButton);

    await waitFor(() => {
      const changeScoringDialog = getByTestId(
        "update-measure-group-scoring-dialog"
      );
      expect(changeScoringDialog).toBeInTheDocument();
      expect(getByText("Change Scoring?")).toBeInTheDocument();
      const changeScoringModalCloseButton = getByTestId(
        "update-measure-group-scoring-modal-cancel-btn"
      );
      expect(changeScoringModalCloseButton).toBeInTheDocument();
      const changeScoringModalSaveButton = getByTestId(
        "update-measure-group-scoring-modal-agree-btn"
      );
      expect(changeScoringModalSaveButton).toBeInTheDocument();

      userEvent.click(changeScoringModalCloseButton);
      expect(changeScoringDialog).not.toBeInTheDocument();
    });
  });

  test("change measure patient basis will prompt warning dialog", async () => {
    serviceApiMock = {
      updateMeasure: jest.fn().mockResolvedValueOnce({ status: 200 }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);

    render(<BaseConfiguration />);

    const scoringSelectInput = getByTestId(
      "scoring-select-input"
    ) as HTMLInputElement;

    const scoringSelect = getByTestId("scoring-select");
    const scoringSelectDropdown = within(scoringSelect).getByRole(
      "combobox"
    ) as HTMLInputElement;
    userEvent.click(scoringSelectDropdown);

    fireEvent.change(scoringSelectInput, {
      target: { value: "Cohort" },
    });
    expect(scoringSelectInput.value).toBe("Cohort");

    const baseConfigurationTypesSelect = getByTestId(
      "base-configuration-types-dropdown"
    );
    expect(baseConfigurationTypesSelect).toBeInTheDocument();
    const baseConfigurationTypesButton = within(
      baseConfigurationTypesSelect
    ).getByTitle("Open");

    userEvent.click(baseConfigurationTypesButton);
    expect(getByText("Structure")).toBeInTheDocument();
    userEvent.click(getByText("Structure"));

    userEvent.click(getByLabelText("Yes"));

    const saveButton = getByTestId("measure-Base Configuration-save");
    expect(saveButton).toBeInTheDocument();
    await waitFor(() => expect(saveButton).toBeEnabled());
    fireEvent.click(saveButton);
    await waitFor(() =>
      expect(serviceApiMock.updateMeasure).toBeCalledWith({
        ...measure,
        scoring: "Cohort",
        baseConfigurationTypes: ["Structure"],
        patientBasis: true,
      })
    );

    expect(
      await getByText("Measure Base Configuration Updated Successfully")
    ).toBeInTheDocument();

    const toastCloseButton = await findByTestId("close-error-button");
    expect(toastCloseButton).toBeInTheDocument();
    fireEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });

    userEvent.click(getByLabelText("No"));

    expect(saveButton).toBeEnabled();
    fireEvent.click(saveButton);

    await waitFor(() => {
      const changePatientBasisDialog = getByTestId(
        "update-measure-group-patient-basis-dialog"
      );
      expect(changePatientBasisDialog).toBeInTheDocument();
      expect(getByText("Change Patient Basis?")).toBeInTheDocument();
      const changePatientBasisModalCloseButton = getByTestId(
        "update-measure-group-patient-basis-modal-cancel-btn"
      );
      expect(changePatientBasisModalCloseButton).toBeInTheDocument();
      const changePatientBasisModalSaveButton = getByTestId(
        "update-measure-group-patient-basis-modal-agree-btn"
      );
      expect(changePatientBasisModalSaveButton).toBeInTheDocument();
    });
  });
});
