import React, { useEffect, useRef, useState } from "react";
import { MenuItem, Typography } from "@mui/material";
import { Box } from "@mui/system";
import {
  Button,
  MadieDiscardDialog,
  Select,
  TextField,
  Toast,
} from "@madie/madie-design-system/dist/react";
import {
  measureStore,
  routeHandlerStore,
  useMeasureServiceApi,
} from "@madie/madie-util";
import { MeasureLock } from "@madie/madie-models";
import { useFormik } from "formik";
import useFormikResetOnEvent from "../../../common/useFormikResetOnEvent";
import useFhirDefinitionsServiceApi from "../../testCases/api/useFhirDefinitionsService";
import useTerminologyServiceApi from "../../testCases/api/useTerminologyServiceApi";

const UNITS_OF_TIME = "http://hl7.org/fhir/ValueSet/units-of-time";

interface ReportingTimeProps {
  setErrorMessage: Function;
  measureCanEdit: boolean;
}

interface FormValues {
  frequency: string;
  period: string;
  periodUnit: string;
  timeOfDay: string;
}

const ReportingTime = ({
  setErrorMessage,
  measureCanEdit,
}: ReportingTimeProps) => {
  const [measure, setMeasure] = useState<any>(measureStore.state);
  const [units, setUnits] = useState<{ code: string; display?: string }[]>([]);
  const [unitsError, setUnitsError] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const measureService = useMeasureServiceApi();
  const fhirService = useRef(useFhirDefinitionsServiceApi()).current;
  const terminologyService = useRef(useTerminologyServiceApi()).current;
  const repeat = measure?.measureMetaData?.reportingTiming?.repeat;

  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;
    const loadUnits = async () => {
      try {
        const valueSet = await fhirService.getValueSetDefinition(
          UNITS_OF_TIME,
          measure.model
        );
        let concepts = valueSet?.expansion?.contains || [];
        if (!concepts.length) {
          concepts =
            valueSet?.compose?.include?.flatMap(
              (include) => include.concept || []
            ) || [];
        }
        const urls =
          valueSet?.compose?.include?.flatMap(
            (include) => include.valueSet || []
          ) || [];
        if (!concepts.length && urls.length) {
          const expansions =
            await terminologyService.getValueSetsExpansionForUrls(urls);
          concepts = expansions.flatMap(
            (expansion) => expansion.expansion?.contains || []
          );
        }
        const options = concepts
          .filter((concept) => concept.code)
          .map((concept) => ({ code: concept.code, display: concept.display }));
        if (!options.length) throw new Error("No units available");
        if (active) setUnits(options);
      } catch (error) {
        if (active) setUnitsError(true);
      }
    };
    if (measure?.model) loadUnits();
    return () => {
      active = false;
    };
  }, [measure?.model, fhirService, terminologyService]);

  const formik = useFormik<FormValues>({
    initialValues: {
      frequency: repeat?.frequency?.toString() ?? "",
      period: repeat?.period?.toString() ?? "",
      periodUnit: repeat?.periodUnit ?? "",
      timeOfDay: repeat?.timeOfDay?.[0] ?? "",
    },
    enableReinitialize: true,
    validateOnMount: true,
    validate: (values) => {
      const errors: Partial<Record<keyof FormValues, string>> = {};
      if (
        !/^[1-9]\d*$/.test(values.frequency) ||
        Number(values.frequency) > 2147483647
      )
        errors.frequency = "Enter a positive whole number.";
      if (
        !/^(0|[1-9]\d*)(\.\d+)?$/.test(values.period) ||
        !Number.isFinite(Number(values.period))
      )
        errors.period = "Enter a non-negative decimal value.";
      if (
        !values.periodUnit ||
        !units.some((unit) => unit.code === values.periodUnit)
      )
        errors.periodUnit = "Select a period unit.";
      if (
        values.timeOfDay &&
        !/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d(\.\d+)?$/.test(values.timeOfDay)
      )
        errors.timeOfDay = "Enter a time in hh:mm:ss format.";
      return errors;
    },
    onSubmit: async (values, helpers) => {
      const modifiedMeasure = {
        ...measure,
        measureMetaData: {
          ...measure.measureMetaData,
          reportingTiming: {
            repeat: {
              frequency: Number(values.frequency),
              period: Number(values.period),
              periodUnit: values.periodUnit,
              ...(values.timeOfDay ? { timeOfDay: [values.timeOfDay] } : {}),
            },
          },
        },
      };
      try {
        const response = await measureService.updateMeasure(modifiedMeasure);
        measureStore.updateMeasure(response.data);
        helpers.resetForm({ values });
        setToastOpen(true);
      } catch (error) {
        const message =
          error?.response?.data?.message?.toString() ||
          "Unable to save Reporting Time.";
        if (error?.status === 423 || error?.response?.status === 423) {
          measureStore.updateMeasure({
            ...measure,
            measureLock: {
              lockedBy: message.replace(
                "Unable to update measure. Measure is locked by ",
                ""
              ),
            } as MeasureLock,
          });
          helpers.resetForm();
        }
        setErrorMessage(message);
      }
    },
  });
  useFormikResetOnEvent(formik);
  useEffect(() => {
    routeHandlerStore.updateRouteHandlerState({
      canTravel: !formik.dirty,
      pendingRoute: "",
    });
  }, [formik.dirty]);
  const { validateForm } = formik;
  useEffect(() => {
    validateForm();
  }, [units, validateForm]);

  const fieldError = (name: keyof FormValues) =>
    formik.touched[name] && formik.errors[name];

  return (
    <form
      id="measure-details-form"
      data-testid="reporting-time-form"
      onSubmit={formik.handleSubmit}
      style={{ minHeight: 539 }}
    >
      <div className="content">
        <div className="subTitle">
          <h2>Reporting Time</h2>
          <Typography
            style={{
              fontSize: 14,
              fontWeight: 300,
              fontFamily: "Rubik",
              float: "right",
            }}
          >
            <span style={{ color: "#D92F2F", marginRight: 3 }}>*</span>
            Indicates required field
          </Typography>
        </div>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
            alignItems: "start",
            gap: 3,
            "& .MuiFormHelperText-root.Mui-error": {
              color: "#AE1C1C !important",
            },
          }}
        >
          <TextField
            id="frequency"
            label="Frequency"
            required
            readOnly={!measureCanEdit}
            size="small"
            inputProps={{
              "data-testid": "reporting-frequency",
              inputMode: "numeric",
            }}
            error={!!fieldError("frequency")}
            recommendation={
              fieldError("frequency") || "Enter a positive whole number"
            }
            onKeyDown={(event) => {
              if (event.shiftKey && event.key === "Tab") {
                event.preventDefault();
                document.getElementById("sideNavReportingTime")?.focus();
              }
            }}
            {...formik.getFieldProps("frequency")}
          />
          <TextField
            id="period"
            label="Period"
            required
            readOnly={!measureCanEdit}
            size="small"
            inputProps={{
              "data-testid": "reporting-period",
              inputMode: "decimal",
            }}
            error={!!fieldError("period")}
            recommendation={fieldError("period") || "Enter a decimal value"}
            {...formik.getFieldProps("period")}
          />
          <Select
            id="periodUnit"
            label="Period Unit"
            required
            readOnly={!measureCanEdit}
            size="small"
            inputProps={{ "data-testid": "reporting-period-unit" }}
            value={formik.values.periodUnit}
            onChange={(event) =>
              formik.setFieldValue("periodUnit", event.target.value)
            }
            onBlur={() => formik.setFieldTouched("periodUnit", true)}
            options={units.map((unit) => (
              <MenuItem key={unit.code} value={unit.code}>
                {unit.display || unit.code}
              </MenuItem>
            ))}
          />
          <TextField
            id="timeOfDay"
            label="Time of Day"
            placeholder="hh:mm:ss"
            readOnly={!measureCanEdit}
            size="small"
            inputProps={{ "data-testid": "reporting-time-of-day" }}
            error={!!fieldError("timeOfDay")}
            recommendation={fieldError("timeOfDay")}
            {...formik.getFieldProps("timeOfDay")}
          />
        </Box>
        {unitsError && (
          <p role="alert">
            Unable to load period units. Please try again later.
          </p>
        )}
      </div>
      {measureCanEdit && (
        <div className="form-actions">
          <Button
            variant="outline"
            disabled={!formik.dirty || formik.isSubmitting}
            onClick={() => setDiscardOpen(true)}
            style={{ marginTop: 20, marginRight: 32 }}
          >
            Discard Changes
          </Button>
          <Button
            variant="cyan"
            type="submit"
            disabled={!formik.dirty || !formik.isValid || formik.isSubmitting}
            style={{ marginTop: 20 }}
          >
            Save
          </Button>
        </div>
      )}
      <Toast
        toastKey="reporting-time-toast"
        toastType="success"
        testId="reporting-time-success"
        open={toastOpen}
        message="Reporting Time value saved successfully"
        onClose={() => setToastOpen(false)}
        autoHideDuration={10000}
      />
      <MadieDiscardDialog
        open={discardOpen}
        onContinue={() => {
          formik.resetForm();
          setDiscardOpen(false);
        }}
        onClose={() => setDiscardOpen(false)}
      />
    </form>
  );
};

export default ReportingTime;
