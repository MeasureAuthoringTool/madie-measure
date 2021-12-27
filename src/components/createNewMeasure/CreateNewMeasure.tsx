import React, { useState } from "react";
import tw from "twin.macro";
import "styled-components/macro";
import { TextInput, Label, Button, HelperText } from "@madie/madie-components";
import axios from "axios";
import { useFormik } from "formik";
import { useHistory } from "react-router-dom";
import Measure from "../../models/Measure";
import { MeasureSchemaValidator } from "../../models/MeasureSchemaValidator";
import { getServiceConfig, ServiceConfig } from "../config/Config";

const ErrorAlert = tw.div`bg-red-200 rounded-lg py-3 px-3 text-red-900 mb-3`;
const FormRow = tw.div`mt-3`;

const CreateNewMeasure = () => {
  const history = useHistory();
  const [serverError, setServerError] = useState(undefined);

  const formik = useFormik({
    initialValues: {
      measureName: "",
      cqlLibraryName: "",
    } as Measure,
    validationSchema: MeasureSchemaValidator,
    onSubmit: async (values: Measure) => {
      await createMeasure(values);
    },
  });

  async function createMeasure(measure: Measure) {
    const config: ServiceConfig = await getServiceConfig();
    await axios
      .post<Measure>(config?.measureService?.baseUrl + "/measure", measure)
      .then((response) => {
        history.push("/measure");
      })
      .catch((error) => {
        setServerError(error.response.data.message);
      });
  }

  function formikErrorHandler(name: string, isError: boolean) {
    if (formik.touched[name] && formik.errors[name]) {
      return (
        <HelperText
          data-testid={`${name}-helper-text`}
          text={formik.errors[name]}
          isError={isError}
        />
      );
    }
  }

  return (
    <div tw="m-5">
      {serverError && (
        <ErrorAlert data-testid="server-error-alerts" role="alert">
          {serverError}
        </ErrorAlert>
      )}
      <form
        data-testid="create-new-measure-form"
        onSubmit={formik.handleSubmit}
      >
        <FormRow>
          <TextInput
            type="text"
            id="measureName"
            {...formik.getFieldProps("measureName")}
            placeholder="Enter a Measure Name"
            data-testid="measure-name-text-field"
          >
            <Label htmlFor="measureName" text="Measure Name" />
            {formikErrorHandler("measureName", true)}
          </TextInput>
        </FormRow>
        <FormRow>
          <TextInput
            type="text"
            id="cqlLibraryName"
            {...formik.getFieldProps("cqlLibraryName")}
            placeholder="Enter CQL Library Name"
            data-testid="cql-library-name"
          >
            <Label htmlFor="cqlLibraryName" text="Measure CQL Library Name" />
            {formikErrorHandler("cqlLibraryName", true)}
          </TextInput>
        </FormRow>
        <FormRow>
          <Button
            buttonTitle="Create Measure"
            type="submit"
            tw="mr-3"
            data-testid="create-new-measure-save-button"
            disabled={!(formik.isValid && formik.dirty)}
          />
          <Button
            buttonTitle="Cancel"
            type="button"
            variant="white"
            onClick={() => {
              history.push("/measure");
            }}
            data-testid="create-new-measure-cancel-button"
          />
        </FormRow>
      </form>
    </div>
  );
};

export { CreateNewMeasure };
