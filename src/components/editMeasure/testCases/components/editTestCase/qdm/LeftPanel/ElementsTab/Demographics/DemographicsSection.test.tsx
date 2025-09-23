import * as React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DemographicsSection, {
  DEMOGRAPHICS_WARNING_MESSAGE,
} from "./DemographicsSection";
import { FormikProvider, FormikContextType } from "formik";
import {
  PatientActionType,
  useQdmPatient,
} from "../../../../../../util/QdmPatientContext";
import { QdmExecutionContextProvider } from "../../../../../routes/qdm/QdmExecutionContext";
import { demographicValueSets } from "../../../../../../__mocks__/demographicValueSets";
import {
  QDMPatient,
  PatientCharacteristicEthnicity,
  PatientCharacteristicExpired,
  DataElementCode,
  PatientCharacteristicRace,
  PatientCharacteristicSex,
} from "cqm-models";
import { Measure } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";

const emptyPatient = new QDMPatient();
jest.mock("../../../../../../util/QdmPatientContext", () => ({
  useQdmPatient: jest.fn(),
  PatientActionType: jest.requireActual(
    "../../../../../../util/QdmPatientContext"
  ).PatientActionType,
}));

const testCaseJson = {
  qdmVersion: "5.6",
  dataElements: [],
  _id: "64b979eacfaef90000434099",
  birthDatetime: "2023-01-31T19:16:21.063+00:00",
};

//@ts-ignore
const mockFormik: FormikContextType<any> = {
  values: {
    json: JSON.stringify(testCaseJson),
  },
  setFieldValue: jest.fn(),
};
const mockUseQdmPatientDispatch = jest.fn();
const handleWarnings = jest.fn();

const cqmMeasure = {
  source_data_criteria: [
    { qdmStatus: "race", codeListId: "2.16.840.1.114222.4.11.836" },
    { qdmStatus: "ethnicity", codeListId: "2.16.840.1.114222.4.11.837" },
    { qdmStatus: "gender", codeListId: "2.16.840.1.113762.1.4.1021.121" },
  ],
  value_sets: demographicValueSets,
};

describe("DemographicsSection", () => {
  beforeEach(() => {
    mockUseQdmPatientDispatch.mockClear();
    handleWarnings.mockClear();

    (useQdmPatient as jest.Mock).mockImplementation(() => ({
      state: { patient: emptyPatient },
      dispatch: mockUseQdmPatientDispatch,
    }));
  });

  const renderDemographicsSection = () => {
    render(
      <QdmExecutionContextProvider
        value={{
          measureState: [{} as Measure, jest.fn()],
          cqmMeasureState: [cqmMeasure, jest.fn()],
          executionContextReady: true,
          setExecutionContextReady: jest.fn(),
          executing: false,
          setExecuting: jest.fn(),
          contextFailure: false,
        }}
      >
        <FormikProvider value={mockFormik}>
          <DemographicsSection
            handleTestCaseWarnings={handleWarnings}
            canEdit={true}
          />
        </FormikProvider>
      </QdmExecutionContextProvider>
    );
  };

  it("should handle birth date time change", async () => {
    renderDemographicsSection();

    expect(screen.getByText("Date of Birth")).toBeInTheDocument();

    const birthdateTimeInputs = screen.getAllByLabelText(
      "Date of Birth"
    ) as HTMLInputElement[];
    expect(birthdateTimeInputs.length).toBe(1);

    fireEvent.change(birthdateTimeInputs[0], {
      target: { value: "08/02/2023 11:00 AM" },
    });
    expect(birthdateTimeInputs[0].value).toBe("08/02/2023 11:00 AM");
    await waitFor(() => {
      expect(mockUseQdmPatientDispatch).toHaveBeenLastCalledWith({
        type: PatientActionType.SET_BIRTHDATETIME,
        payload: expect.anything(),
      });
    });
  });

  it("should handle expired date time change", async () => {
    renderDemographicsSection();

    expect(screen.getByText("Living Status")).toBeInTheDocument();
    const livingStatusInput = screen.getByTestId(
      "demographics-living-status-input"
    ) as HTMLInputElement;
    expect(livingStatusInput).toBeInTheDocument();
    expect(livingStatusInput.value).toBe("Living");

    fireEvent.change(livingStatusInput, {
      target: { value: "Expired" },
    });
    expect(livingStatusInput.value).toBe("Expired");

    expect(screen.getByText("Date/Time Expiration")).toBeInTheDocument();

    const dateTimeExpiration = screen.getAllByLabelText(
      "Date/Time Expiration"
    ) as HTMLInputElement[];
    expect(dateTimeExpiration.length).toBe(1);
    // start date
    fireEvent.change(dateTimeExpiration[0], {
      target: { value: "08/02/2023 07:49 AM" },
    });

    expect(dateTimeExpiration[0].value).toBe("08/02/2023 07:49 AM");
  });

  it("should handle Living Status change", () => {
    renderDemographicsSection();

    expect(screen.getByText("Living Status")).toBeInTheDocument();
    const livingStatusInput = screen.getByTestId(
      "demographics-living-status-input"
    ) as HTMLInputElement;
    expect(livingStatusInput).toBeInTheDocument();
    expect(livingStatusInput.value).toBe("Living");

    fireEvent.change(livingStatusInput, {
      target: { value: "Expired" },
    });
    expect(livingStatusInput.value).toBe("Expired");

    fireEvent.change(livingStatusInput, {
      target: { value: "Living" },
    });
    expect(livingStatusInput.value).toBe("Living");
  });

  it("should handle Ethnicity change", () => {
    const qdmPatient = new QDMPatient();
    const ethnicityElement = new PatientCharacteristicEthnicity();
    const newCode: DataElementCode = {
      code: "2135-2",
      display: "Hispanic or Latino",
      version: "1.2",
      system: "2.16.840.1.113883.6.238",
    };
    ethnicityElement.dataElementCodes = [newCode];
    qdmPatient.dataElements.push(ethnicityElement);
    (useQdmPatient as jest.Mock).mockImplementation(() => ({
      state: { patient: qdmPatient },
      dispatch: mockUseQdmPatientDispatch,
    }));
    renderDemographicsSection();

    expect(screen.getByText("Ethnicity")).toBeInTheDocument();
    const ethnicitySelect = screen.getAllByRole("combobox")[3];
    expect(ethnicitySelect).toHaveTextContent("Hispanic or Latino");
    // change the ethnicity option
    userEvent.click(ethnicitySelect);
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    userEvent.click(options[2]);
    expect(ethnicitySelect).toHaveTextContent("Not Hispanic or Latino");
  });

  it("should render expired on load", async () => {
    const qdmPatient = new QDMPatient();
    const expiredElement = new PatientCharacteristicExpired();
    expiredElement.dataElementCodes = [];
    qdmPatient.dataElements.push(expiredElement);
    (useQdmPatient as jest.Mock).mockImplementation(() => ({
      state: { patient: qdmPatient },
      dispatch: mockUseQdmPatientDispatch,
    }));
    renderDemographicsSection();

    expect(screen.getByText("Living Status")).toBeInTheDocument();
    const livingStatusInput = screen.getByTestId(
      "demographics-living-status-input"
    ) as HTMLInputElement;
    expect(livingStatusInput).toBeInTheDocument();
    expect(livingStatusInput.value).toBe("Expired");

    fireEvent.change(livingStatusInput, {
      target: { value: "Living" },
    });
    expect(livingStatusInput.value).toBe("Living");
    await waitFor(() => {
      expect(mockUseQdmPatientDispatch).toHaveBeenCalledWith({
        type: PatientActionType.REMOVE_DATA_ELEMENT,
        payload: expect.anything(),
      });
    });
  });

  it("should handle Race change", () => {
    const qdmPatient = new QDMPatient();
    const raceElement = new PatientCharacteristicRace();
    const newCode: DataElementCode = {
      code: "1002-5",
      display: "American Indian or Alaska Native",
      version: undefined,
      system: "2.16.840.1.113883.6.238",
    };
    raceElement.dataElementCodes = [newCode];
    qdmPatient.dataElements.push(raceElement);
    (useQdmPatient as jest.Mock).mockImplementation(() => ({
      state: { patient: qdmPatient },
      dispatch: mockUseQdmPatientDispatch,
    }));
    renderDemographicsSection();

    expect(screen.getByText("Race")).toBeInTheDocument();
    const raceSelector = screen.getAllByRole("combobox")[1];
    expect(raceSelector).toHaveTextContent("American Indian or Alaska Native");
    // change race option
    userEvent.click(raceSelector);
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(4);
    userEvent.click(options[2]);
    expect(raceSelector).toHaveTextContent("Asian");
  });

  it("should handle Gender change", () => {
    const qdmPatient = new QDMPatient();
    const genderElement = new PatientCharacteristicSex();
    const newCode: DataElementCode = {
      system: "2.16.840.1.113883.6.96",
      version: "2024-09",
      code: "248152002",
      display: "Female (finding)",
    };

    genderElement.dataElementCodes = [newCode];
    qdmPatient.dataElements.push(genderElement);
    (useQdmPatient as jest.Mock).mockImplementation(() => ({
      state: { patient: qdmPatient },
      dispatch: mockUseQdmPatientDispatch,
    }));
    renderDemographicsSection();

    expect(screen.getByText("Sex")).toBeInTheDocument();
    const genderSelector = screen.getAllByRole("combobox")[2];
    expect(genderSelector).toHaveTextContent("Female (finding)");
    // change gender option
    userEvent.click(genderSelector);
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    userEvent.click(options[2]);
    expect(genderSelector).toHaveTextContent("Male (finding)");
  });

  it("should clear Race selection when selecting dash option (no selection)", () => {
    const qdmPatient = new QDMPatient();
    const raceElement = new PatientCharacteristicRace();
    const newCode: DataElementCode = {
      code: "1002-5",
      display: "American Indian or Alaska Native",
      version: undefined,
      system: "2.16.840.1.113883.6.238",
    };
    raceElement.dataElementCodes = [newCode];
    qdmPatient.dataElements.push(raceElement);
    (useQdmPatient as jest.Mock).mockImplementation(() => ({
      state: { patient: qdmPatient },
      dispatch: mockUseQdmPatientDispatch,
    }));
    renderDemographicsSection();

    const raceInput = screen.getByTestId(
      "demographics-race-input"
    ) as HTMLInputElement;
    expect(raceInput.value).toBe("American Indian or Alaska Native");

    fireEvent.change(raceInput, { target: { value: "" } });

    expect(raceInput.value).toBe("");
    expect(mockUseQdmPatientDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: PatientActionType.REMOVE_DATA_ELEMENT })
    );
  });

  it("should clear Gender selection when selecting dash option (no selection)", () => {
    const qdmPatient = new QDMPatient();
    const genderElement = new PatientCharacteristicSex();
    genderElement.dataElementCodes = [
      { code: "F", display: "Female", system: "2.16.840.1.113883.5.1" },
    ];
    qdmPatient.dataElements.push(genderElement);
    (useQdmPatient as jest.Mock).mockImplementation(() => ({
      state: { patient: qdmPatient },
      dispatch: mockUseQdmPatientDispatch,
    }));
    renderDemographicsSection();

    const genderInput = screen.getByTestId(
      "demographics-gender-input"
    ) as HTMLInputElement;
    expect(genderInput.value).toBe("Female");

    fireEvent.change(genderInput, { target: { value: "" } });

    expect(genderInput.value).toBe("");
    expect(mockUseQdmPatientDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: PatientActionType.REMOVE_DATA_ELEMENT })
    );
  });

  it("should clear Ethnicity selection when selecting dash option (no selection)", () => {
    const qdmPatient = new QDMPatient();
    const ethnicityElement = new PatientCharacteristicEthnicity();
    ethnicityElement.dataElementCodes = [
      {
        code: "2135-2",
        display: "Hispanic or Latino",
        system: "2.16.840.1.113883.6.238",
      },
    ];
    qdmPatient.dataElements.push(ethnicityElement);
    (useQdmPatient as jest.Mock).mockImplementation(() => ({
      state: { patient: qdmPatient },
      dispatch: mockUseQdmPatientDispatch,
    }));
    renderDemographicsSection();

    const ethnicityInput = screen.getByTestId(
      "demographics-ethnicity-input"
    ) as HTMLInputElement;
    expect(ethnicityInput.value).toBe("Hispanic or Latino");

    fireEvent.change(ethnicityInput, { target: { value: "" } });

    expect(ethnicityInput.value).toBe("");
    expect(mockUseQdmPatientDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: PatientActionType.REMOVE_DATA_ELEMENT })
    );
  });

  it("calls handleTestCaseWarnings with warning for invalid Race", async () => {
    const qdmPatient = new QDMPatient();
    const raceElement = new PatientCharacteristicRace();
    raceElement.dataElementCodes = [
      {
        code: "9999-9",
        display: "Invalid Race",
        system: "2.16.840.1.113883.6.238",
      },
    ];
    qdmPatient.dataElements.push(raceElement);

    (useQdmPatient as jest.Mock).mockImplementation(() => ({
      state: { patient: qdmPatient },
      dispatch: mockUseQdmPatientDispatch,
    }));

    renderDemographicsSection();

    await waitFor(() => {
      expect(handleWarnings).toHaveBeenCalledWith(DEMOGRAPHICS_WARNING_MESSAGE);
    });
  });

  it("calls handleTestCaseWarnings with null for valid Race", async () => {
    const qdmPatient = new QDMPatient();
    const raceElement = new PatientCharacteristicRace();
    raceElement.dataElementCodes = [
      {
        code: "1002-5",
        display: "American Indian or Alaska Native",
        system: "2.16.840.1.113883.6.238",
      },
    ];
    qdmPatient.dataElements.push(raceElement);

    (useQdmPatient as jest.Mock).mockImplementation(() => ({
      state: { patient: qdmPatient },
      dispatch: mockUseQdmPatientDispatch,
    }));

    renderDemographicsSection();

    await waitFor(() => {
      expect(handleWarnings).toHaveBeenCalledWith(null);
    });
  });

  it("calls handleTestCaseWarnings with warning for invalid Gender", async () => {
    const qdmPatient = new QDMPatient();
    const genderElement = new PatientCharacteristicSex();
    genderElement.dataElementCodes = [
      {
        code: "999",
        display: "Invalid Gender",
        system: "2.16.840.1.113883.6.96",
      },
    ];
    qdmPatient.dataElements.push(genderElement);

    (useQdmPatient as jest.Mock).mockImplementation(() => ({
      state: { patient: qdmPatient },
      dispatch: mockUseQdmPatientDispatch,
    }));

    renderDemographicsSection();

    await waitFor(() => {
      expect(handleWarnings).toHaveBeenCalledWith(DEMOGRAPHICS_WARNING_MESSAGE);
    });
  });

  it("calls handleTestCaseWarnings with null for valid Gender", async () => {
    const qdmPatient = new QDMPatient();
    const genderElement = new PatientCharacteristicSex();
    genderElement.dataElementCodes = [
      {
        code: "248152002",
        display: "Female (finding)",
        system: "2.16.840.1.113883.6.96",
        version: "2024-09",
      },
    ];
    qdmPatient.dataElements.push(genderElement);

    (useQdmPatient as jest.Mock).mockImplementation(() => ({
      state: { patient: qdmPatient },
      dispatch: mockUseQdmPatientDispatch,
    }));

    renderDemographicsSection();

    await waitFor(() => {
      expect(handleWarnings).toHaveBeenCalledWith(null);
    });
  });

  it("calls handleTestCaseWarnings with warning for invalid Ethnicity", async () => {
    const qdmPatient = new QDMPatient();
    const ethnicityElement = new PatientCharacteristicEthnicity();
    ethnicityElement.dataElementCodes = [
      {
        code: "9999-9",
        display: "Invalid Ethnicity",
        system: "2.16.840.1.113883.6.238",
      },
    ];
    qdmPatient.dataElements.push(ethnicityElement);

    (useQdmPatient as jest.Mock).mockImplementation(() => ({
      state: { patient: qdmPatient },
      dispatch: mockUseQdmPatientDispatch,
    }));

    renderDemographicsSection();

    await waitFor(() => {
      expect(handleWarnings).toHaveBeenCalledWith(DEMOGRAPHICS_WARNING_MESSAGE);
    });
  });

  it("calls handleTestCaseWarnings with null for valid Ethnicity", async () => {
    const qdmPatient = new QDMPatient();
    const ethnicityElement = new PatientCharacteristicEthnicity();
    ethnicityElement.dataElementCodes = [
      {
        code: "2135-2",
        display: "Hispanic or Latino",
        system: "2.16.840.1.113883.6.238",
      },
    ];
    qdmPatient.dataElements.push(ethnicityElement);

    (useQdmPatient as jest.Mock).mockImplementation(() => ({
      state: { patient: qdmPatient },
      dispatch: mockUseQdmPatientDispatch,
    }));

    renderDemographicsSection();

    await waitFor(() => {
      expect(handleWarnings).toHaveBeenCalledWith(null);
    });
  });
});
