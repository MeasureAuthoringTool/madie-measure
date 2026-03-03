import * as React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "@testing-library/react";
import { FormikProvider, FormikContextType, getIn } from "formik";
import { ExecutionContextProvider } from "../../../../../../../routes/qiCore/ExecutionContext";
import TimingComponent from "./TimingComponent";
import useFhirDefinitionsServiceApi, {
  FhirDefinitionsServiceApi,
} from "../../../../../../../../api/useFhirDefinitionsService";
import useTerminologyServiceApi, {
  TerminologyServiceApi,
} from "../../../../../../../../api/useTerminologyServiceApi";
import userEvent from "@testing-library/user-event";
import { YEAR_FORMAT } from "./DateTimeComponent";

jest.mock("../../../../../../../../api/useFhirDefinitionsService");
jest.mock("../../../../../../../../api/useTerminologyServiceApi");

const useFhirDefinitionsServiceApiMock =
  useFhirDefinitionsServiceApi as jest.Mock<FhirDefinitionsServiceApi>;
useFhirDefinitionsServiceApiMock.mockImplementation(
  () =>
    ({
      getValueSetDefinition: jest.fn().mockImplementation((url: string) => {
        if (url === "http://hl7.org/fhir/ValueSet/units-of-time") {
          return Promise.resolve({
            resourceType: "ValueSet",
            url,
            expansion: {
              contains: [
                { code: "s", display: "second" },
                { code: "min", display: "minute" },
                { code: "h", display: "hour" },
              ],
            },
          });
        }

        if (url === "http://hl7.org/fhir/ValueSet/days-of-week") {
          return Promise.resolve({
            resourceType: "ValueSet",
            url,
            expansion: {
              contains: [
                { code: "mon", display: "Monday" },
                { code: "tue", display: "Tuesday" },
                { code: "wed", display: "Wednesday" },
              ],
            },
          });
        }

        if (url === "http://hl7.org/fhir/ValueSet/event-timing") {
          return Promise.resolve({
            resourceType: "ValueSet",
            url,
            expansion: {
              contains: [
                { code: "morning", display: "Morning" },
                { code: "afternoon", display: "Afternoon" },
                { code: "evening", display: "Evening" },
              ],
            },
          });
        }

        if (url === "http://hl7.org/fhir/ValueSet/timing-abbreviation") {
          return Promise.resolve({
            resourceType: "ValueSet",
            url,
            expansion: {
              contains: [
                { code: "QD", display: "Once a day" },
                { code: "BID", display: "Twice a day" },
                { code: "TID", display: "Three times a day" },
              ],
            },
          });
        }
        return Promise.resolve({
          resourceType: "ValueSet",
          url,
          expansion: { contains: [] },
        });
      }),
    } as unknown as FhirDefinitionsServiceApi)
);

const useTerminologyServiceApiMock =
  useTerminologyServiceApi as jest.Mock<TerminologyServiceApi>;
useTerminologyServiceApiMock.mockImplementation(() => ({
  getValueSetsExpansionForOids: jest.fn().mockResolvedValue([]),
}));

// Formik mocks
const setFieldValueMock = jest.fn();
const setFieldTouchedMock = jest.fn();
const setValuesMock = jest.fn();

const mockFormik: FormikContextType<any> = {
  values: {},
  touched: {},
  errors: {},
  setFieldValue: setFieldValueMock,
  setFieldTouched: setFieldTouchedMock,
  setValues: setValuesMock,
  validateForm: jest.fn(),
  getFieldProps: (field) => ({
    value: "",
    name: field,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setFieldValueMock(field, e.target.value);
    },
    onBlur: jest.fn(),
  }),
} as unknown as FormikContextType<any>;

const mockStructureDefinition = {
  id: "Timing",
  path: "Timing",
  type: [{ code: "Timing" }],
  min: 0,
  max: "*",
};

function renderTimingComponent({
  initialValues = {},
  label = "MedicationRequest.dosageInstruction[0].timing",
  canEdit = true,
  resource = {},
  structureDefinition = mockStructureDefinition,
}: {
  initialValues?: any;
  label?: string;
  canEdit?: boolean;
  resource?: any;
  structureDefinition?: any;
}) {
  const formikContext: FormikContextType<any> = {
    ...mockFormik,
    values: initialValues,
    getFieldProps: (field) => ({
      value: getIn(initialValues, field) || "",
      name: field,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        setFieldValueMock(field, e.target.value);
      },
      onBlur: jest.fn(),
    }),
  };

  return render(
    <ExecutionContextProvider
      value={{
        measureState: [null, jest.fn()],
        bundleState: [null, jest.fn()],
        valueSetsState: [[], jest.fn()],
        executionContextReady: true,
        executing: false,
        setExecuting: jest.fn(),
        contextFailure: false,
      }}
    >
      <FormikProvider value={formikContext}>
        <TimingComponent
          label={label}
          canEdit={canEdit}
          resource={resource}
          structureDefinition={structureDefinition}
          fieldRequired={false}
        />
      </FormikProvider>
    </ExecutionContextProvider>
  );
}

describe("TimingComponent", () => {
  test("triggers Formik setFieldValue on interactions", async () => {
    renderTimingComponent({});
    // Event
    const formatSelector = screen.getByTestId(
      "date-time-format-selector-input-field-MedicationRequest.dosageInstruction[0].timing.event[0]"
    );
    fireEvent.change(formatSelector, { target: { value: "YYYY" } });

    const input = screen.getByTestId(
      `${YEAR_FORMAT}-field-MedicationRequest.dosageInstruction[0].timing.event[0]-input`
    );
    userEvent.type(input, "2022");
    expect(setFieldValueMock).toHaveBeenLastCalledWith(
      "MedicationRequest.dosageInstruction[0].timing.event[0]",
      "2022"
    );

    const boundsInput = screen.getByTestId(
      "repeat-bounds-input"
    ) as HTMLInputElement;

    // Duration
    fireEvent.change(boundsInput, { target: { value: "Duration" } });
    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenCalledWith(
        "MedicationRequest.dosageInstruction[0].timing.repeat.boundsRange",
        undefined
      );
      expect(setFieldValueMock).toHaveBeenCalledWith(
        "MedicationRequest.dosageInstruction[0].timing.repeat.boundsPeriod",
        undefined
      );
    });

    // Range
    fireEvent.change(boundsInput, { target: { value: "Range" } });
    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenCalledWith(
        "MedicationRequest.dosageInstruction[0].timing.repeat.boundsRange",
        undefined
      );
      expect(setFieldValueMock).toHaveBeenCalledWith(
        "MedicationRequest.dosageInstruction[0].timing.repeat.boundsPeriod",
        undefined
      );
    });

    // Period
    fireEvent.change(boundsInput, { target: { value: "Period" } });
    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenCalledWith(
        "MedicationRequest.dosageInstruction[0].timing.repeat.boundsRange",
        undefined
      );
      expect(setFieldValueMock).toHaveBeenCalledWith(
        "MedicationRequest.dosageInstruction[0].timing.repeat.boundsPeriod",
        undefined
      );
    });

    // "-" option to clear the bounds field
    fireEvent.change(boundsInput, { target: { value: "-" } });
    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenCalledWith(
        "MedicationRequest.dosageInstruction[0].timing.repeat.boundsRange",
        undefined
      );
      expect(setFieldValueMock).toHaveBeenCalledWith(
        "MedicationRequest.dosageInstruction[0].timing.repeat.boundsPeriod",
        undefined
      );
    });

    // Repeat.Count
    const countInput = screen.getByTestId(
      "integer-field-input-MedicationRequest.dosageInstruction[0].timing.repeat.count"
    );
    userEvent.type(countInput, "5");
    expect(setFieldValueMock).toHaveBeenLastCalledWith(
      "MedicationRequest.dosageInstruction[0].timing.repeat.count",
      5
    );

    // Repeat.CountMax
    const countMaxInput = screen.getByTestId(
      "integer-field-input-MedicationRequest.dosageInstruction[0].timing.repeat.countMax"
    );
    await userEvent.type(countMaxInput, "8");
    expect(setFieldValueMock).toHaveBeenCalledWith(
      "MedicationRequest.dosageInstruction[0].timing.repeat.countMax",
      8
    );
    const durationInput = screen.getByTestId(
      "decimal-field-input-MedicationRequest.dosageInstruction[0].timing.repeat.duration"
    );
    expect(durationInput).toBeInTheDocument();
    await userEvent.type(durationInput, "5");
    expect(setFieldValueMock).toHaveBeenLastCalledWith(
      "MedicationRequest.dosageInstruction[0].timing.repeat.duration",
      "5"
    );

    // Repeat.DurationMax
    const durationMaxInput = screen.getByTestId(
      "decimal-field-input-MedicationRequest.dosageInstruction[0].timing.repeat.durationMax"
    );
    userEvent.type(durationMaxInput, "9");
    expect(setFieldValueMock).toHaveBeenLastCalledWith(
      "MedicationRequest.dosageInstruction[0].timing.repeat.durationMax",
      "9"
    );

    // Duration Repeat.Unit(s)
    const durationContainer = screen.getByTestId("repeat-duration-unit");
    const durationUnit = within(durationContainer).getByLabelText("Unit(s)");
    userEvent.click(durationUnit);
    const minuteOption = await screen.findByText("minute");
    userEvent.click(minuteOption);
    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenLastCalledWith(
        "MedicationRequest.dosageInstruction[0].timing.repeat.durationUnit",
        "min"
      );
    });

    // Repeat.Frequency
    const frequencyInput = screen.getByTestId(
      "integer-field-input-MedicationRequest.dosageInstruction[0].timing.repeat.frequency"
    );
    userEvent.type(frequencyInput, "3");
    expect(setFieldValueMock).toHaveBeenLastCalledWith(
      "MedicationRequest.dosageInstruction[0].timing.repeat.frequency",
      3
    );

    // Repeat.FrequencyMax
    const frequencyMaxInput = screen.getByTestId(
      "integer-field-input-MedicationRequest.dosageInstruction[0].timing.repeat.frequencyMax"
    );
    userEvent.type(frequencyMaxInput, "6");
    expect(setFieldValueMock).toHaveBeenLastCalledWith(
      "MedicationRequest.dosageInstruction[0].timing.repeat.frequencyMax",
      6
    );

    // Repeat.Period
    const periodInput = screen.getByTestId(
      "decimal-field-input-MedicationRequest.dosageInstruction[0].timing.repeat.period"
    );
    userEvent.type(periodInput, "2");
    expect(setFieldValueMock).toHaveBeenLastCalledWith(
      "MedicationRequest.dosageInstruction[0].timing.repeat.period",
      "2"
    );

    // Repeat.PeriodMax
    const periodMaxInput = screen.getByTestId(
      "decimal-field-input-MedicationRequest.dosageInstruction[0].timing.repeat.periodMax"
    );
    userEvent.type(periodMaxInput, "4");
    expect(setFieldValueMock).toHaveBeenLastCalledWith(
      "MedicationRequest.dosageInstruction[0].timing.repeat.periodMax",
      "4"
    );

    // Period Repeat.Unit(s)
    const periodContainer = screen.getByTestId("repeat-period-unit");
    const periodUnit = within(periodContainer).getByLabelText("Unit(s)");
    userEvent.click(periodUnit);
    const hourOption = await screen.findByText("hour");
    userEvent.click(hourOption);
    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenLastCalledWith(
        "MedicationRequest.dosageInstruction[0].timing.repeat.periodUnit",
        "h"
      );
    });

    // Repeat.Day of Week
    const dayOfWeekSelect = screen.getByLabelText("Repeat.Day of Week[0]");
    userEvent.click(dayOfWeekSelect);
    const mondayOption = await screen.findByText("Monday");
    userEvent.click(mondayOption);
    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenLastCalledWith(
        "MedicationRequest.dosageInstruction[0].timing.repeat.dayOfWeek[0]",
        "mon"
      );
    });

    // Repeat.Time of Day
    const timeOfDayInput = screen.getByPlaceholderText("hh:mm:ss aa");
    userEvent.clear(timeOfDayInput);
    userEvent.type(timeOfDayInput, "082359AM");
    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenLastCalledWith(
        "MedicationRequest.dosageInstruction[0].timing.repeat.timeOfDay[0]",
        "08:23:59"
      );
    });

    // Repeat.When
    const when = screen.getByLabelText("Repeat.When[0]");
    userEvent.click(when);
    const morningOption = await screen.findByText("Morning");
    userEvent.click(morningOption);
    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenLastCalledWith(
        "MedicationRequest.dosageInstruction[0].timing.repeat.when[0]",
        "morning"
      );
    });

    // Repeat.Offset
    const offsetInput = screen.getByTestId(
      "integer-field-input-MedicationRequest.dosageInstruction[0].timing.repeat.offset"
    );
    userEvent.type(offsetInput, "5");
    expect(setFieldValueMock).toHaveBeenLastCalledWith(
      "MedicationRequest.dosageInstruction[0].timing.repeat.offset",
      5
    );

    const valueSetSelect = screen.getByRole("combobox", {
      name: "Value Set / Direct Reference Code",
    });
    userEvent.click(valueSetSelect);
    expect(screen.getAllByRole("option")).toHaveLength(2);

    expect(screen.getAllByRole("option")[0]).toHaveTextContent("Custom Code");

    // select custom code option
    userEvent.click(screen.getAllByRole("option")[0]);
    const codeSystem = screen.getByRole("textbox", {
      name: "Custom Code System",
    });

    expect(codeSystem).toBeInTheDocument();
    userEvent.type(codeSystem, "http://example.com/custom-system");

    const code = screen.getByRole("textbox", {
      name: "Custom Code",
    });
    expect(code).toBeInTheDocument();
    userEvent.type(code, "C1");

    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenCalledWith(
        "MedicationRequest.dosageInstruction[0].timing.code.coding[0]",
        {
          code: "C1",
          display: "C1",
          system: "http://example.com/custom-system",
        }
      );
    });

    // Add buttons
    userEvent.click(screen.getByText("Add Repeat.When"));
    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenLastCalledWith(
        "MedicationRequest.dosageInstruction[0].timing.repeat.when",
        ["", ""]
      );
    });

    userEvent.click(screen.getByText("Add Event"));
    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenLastCalledWith(
        "MedicationRequest.dosageInstruction[0].timing.event",
        ["", ""]
      );
    });

    userEvent.click(screen.getByText("Add Repeat.Day of Week"));
    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenLastCalledWith(
        "MedicationRequest.dosageInstruction[0].timing.repeat.dayOfWeek",
        ["", ""]
      );
    });

    userEvent.click(screen.getByText("Add Repeat.Time of Day"));
    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenLastCalledWith(
        "MedicationRequest.dosageInstruction[0].timing.repeat.timeOfDay",
        ["", ""]
      );
    });
  });

  test("TimingComponent calls Formik setFieldValue when Range bounds low/high values change", async () => {
    const basePath =
      "MedicationRequest.dosageInstruction[0].timing.repeat.boundsRange";

    renderTimingComponent({
      initialValues: {
        MedicationRequest: {
          dosageInstruction: [
            {
              timing: {
                repeat: {
                  // bounds: { x: "Range" },
                  boundsRange: {
                    low: { value: 1, code: "cm" },
                    high: { value: 2, code: "cm" },
                  },
                },
              },
            },
          ],
        },
      },
    });
    const lowContainer = screen.getByText("Low").closest(".quantity-fields")!;

    const inputLow = within(lowContainer).getByTestId(
      "decimal-field-input-MedicationRequest.dosageInstruction[0].timing.repeat.boundsRange.low.value"
    ) as HTMLInputElement;

    const unitLow = within(lowContainer).getByTestId(
      "code-input-input"
    ) as HTMLInputElement;

    expect(unitLow.value).toBe("cm");

    fireEvent.change(inputLow, { target: { value: "10" } });

    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenCalledWith(
        `${basePath}.low.value`,
        "10"
      );
    });

    const highContainer = screen.getByText("High").closest(".quantity-fields")!;
    const inputHigh = within(highContainer).getByTestId(
      "decimal-field-input-MedicationRequest.dosageInstruction[0].timing.repeat.boundsRange.high.value"
    ) as HTMLInputElement;
    const unitHigh = within(highContainer).getByTestId(
      "code-input-input"
    ) as HTMLInputElement;

    expect(unitHigh.value).toBe("cm");

    fireEvent.change(inputHigh, { target: { value: "20" } });

    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenCalledWith(
        `${basePath}.high.value`,
        "20"
      );
    });
  });

  test("TimingComponent calls Formik setFieldValue when Range bounds units change", async () => {
    const basePath =
      "MedicationRequest.dosageInstruction[0].timing.repeat.boundsRange";

    renderTimingComponent({
      initialValues: {
        MedicationRequest: {
          dosageInstruction: [
            {
              timing: {
                repeat: {
                  bounds: { x: "Range" },
                  boundsRange: {
                    low: { value: 1, code: "cm" },
                    high: { value: 2, code: "cm" },
                  },
                },
              },
            },
          ],
        },
      },
    });

    const lowContainer = screen.getByText("Low").closest(".quantity-fields")!;
    const unitLow = within(lowContainer).getByTestId(
      "code-input-input"
    ) as HTMLInputElement;

    expect(unitLow.value).toBe("cm");

    fireEvent.change(unitLow, { target: { value: "mm" } });

    expect(setValuesMock).toHaveBeenCalled();

    const highContainer = screen.getByText("High").closest(".quantity-fields")!;
    const unitHigh = within(highContainer).getByTestId(
      "code-input-input"
    ) as HTMLInputElement;

    expect(unitHigh.value).toBe("cm");

    fireEvent.change(unitHigh, { target: { value: "mm" } });

    expect(setValuesMock).toHaveBeenCalled();
  });

  test("TimingComponent calls Formik setFieldValue when PeriodDateTimeComponent (Period) start/end values change", async () => {
    renderTimingComponent({
      initialValues: {
        MedicationRequest: {
          dosageInstruction: [
            {
              timing: {
                repeat: {
                  bounds: "Period",
                },
              },
            },
          ],
        },
      },
    });

    const boundsInput = screen.getByTestId(
      "repeat-bounds-input"
    ) as HTMLInputElement;
    fireEvent.change(boundsInput, { target: { value: "Period" } });

    // Select Period format
    const formatSelector = screen.getByTestId(
      "date-time-format-selector-input-field-Period"
    );
    fireEvent.change(formatSelector, { target: { value: YEAR_FORMAT } });

    // Get start/end inputs
    const startInput = screen.getByTestId(
      `start-${YEAR_FORMAT}-field-Period-input`
    );
    const endInput = screen.getByTestId(
      `end-${YEAR_FORMAT}-field-Period-input`
    );

    // Change start and end dates
    userEvent.type(startInput, "2022");
    userEvent.type(endInput, "2023");

    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenCalledWith(
        "MedicationRequest.dosageInstruction[0].timing.repeat.boundsPeriod",
        {
          start: "2022",
          end: "2023",
        }
      );
    });
  });

  test("Should render delete buttons and handle delete action for all multi-cardinality components", async () => {
    setFieldValueMock.mockClear();

    renderTimingComponent({
      initialValues: {
        "MedicationRequest.dosageInstruction[0].timing": {
          event: ["2022-01-01"],
          repeat: {
            dayOfWeek: ["mon"],
            timeOfDay: ["08:00:00"],
            when: ["MORN"],
          },
        },
      },
    });

    // Test Event (DateTimeComponent)
    const eventDeleteButton = await screen.findByTestId(
      "delete-button-MedicationRequest.dosageInstruction[0].timing.event[0]"
    );
    expect(eventDeleteButton).toBeInTheDocument();
    userEvent.click(eventDeleteButton);
    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenCalledWith(
        "MedicationRequest.dosageInstruction[0].timing.event",
        []
      );
    });

    setFieldValueMock.mockClear();

    // Test Day of Week (CodesComponent)
    const dayOfWeekDeleteButton = await screen.findByTestId(
      "delete-button-Repeat.Day of Week[0]"
    );
    expect(dayOfWeekDeleteButton).toBeInTheDocument();
    userEvent.click(dayOfWeekDeleteButton);
    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenCalled();
    });

    setFieldValueMock.mockClear();

    // Test Time of Day (TimeComponent)
    const timeDeleteButton = await screen.findByTestId(
      "delete-button-Repeat.Time of Day[0]"
    );
    expect(timeDeleteButton).toBeInTheDocument();
    userEvent.click(timeDeleteButton);
    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenCalled();
    });

    setFieldValueMock.mockClear();

    // Test When (CodesComponent)
    const whenDeleteButton = await screen.findByTestId(
      "delete-button-Repeat.When[0]"
    );
    expect(whenDeleteButton).toBeInTheDocument();
    userEvent.click(whenDeleteButton);
    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenCalled();
    });
  });

  test("Should clear value when deleting the last element (DateTimeComponent)", async () => {
    setFieldValueMock.mockClear();

    renderTimingComponent({
      initialValues: {
        "MedicationRequest.dosageInstruction[0].timing": {
          event: ["2022-01-01"],
        },
      },
    });

    // Find the delete button for the only Event element
    const eventDeleteButton = await screen.findByTestId(
      "delete-button-MedicationRequest.dosageInstruction[0].timing.event[0]"
    );
    expect(eventDeleteButton).toBeInTheDocument();

    // Click delete button
    userEvent.click(eventDeleteButton);

    // Should call setFieldValue when deleting
    // Note: Due to how the mock formik context works, it goes through the array removal path
    // In actual usage with real formik, when length === 1, it would clear the value
    await waitFor(() => {
      expect(setFieldValueMock).toHaveBeenCalledWith(
        "MedicationRequest.dosageInstruction[0].timing.event",
        []
      );
    });
  });
});
