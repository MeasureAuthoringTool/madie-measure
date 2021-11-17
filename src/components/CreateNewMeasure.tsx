import React from "react";
import tw from "twin.macro";
import { TextInput, Label, Button, HelperText } from "@madie/madie-components";
import axios from "axios";
import { Measure } from "../models/Measure";
import { useFormik } from "formik";
import * as Yup from "yup";

const measureServiceUrl = "http://localhost:8080";

const CreateNewMeasure = () => {
  const formik = useFormik({
    initialValues: {
      measureName: "",
    },
    validationSchema: Yup.object({
      measureName: Yup.string()
        .max(500, "A measure name cannot be more than 500 characters.")
        .required("A measure name is required.")
        .matches(/[a-zA-Z]/, "A measure name must contain at least one letter.")
        .matches(
          /^((?!_).)*$/,
          "Measure Name must not contain '_' (underscores)."
        ),
    }),
    onSubmit: async (values: Measure) => {
      await createMeasure(values);
    },
  });

  async function createMeasure(measure: Measure) {
    await axios
      .post<Measure>(measureServiceUrl + "/measure", measure)
      .then((response) => {
        // window.location.href = "/measure";
        alert("Added Measures " + response.data.measureName);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.log(err);
      });
  }
  function formikErrorHandler(name: string, isError: boolean) {
    if (formik.touched[name] && formik.errors[name]) {
      return (
        <HelperText
          data-testid={"helper-text"}
          text={formik.errors[name]}
          isError={isError}
        />
      );
    }
  }

  return (
    <div tw="w-1/4 mx-auto my-8">
      <form
        data-testid="create-new-measure-form"
        onSubmit={formik.handleSubmit}
      >
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
        <Button
          buttonTitle="Create Measure"
          type="submit"
          tw="inline-flex items-center mt-4 mr-4 px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          data-testid="create-new-measure-save-button"
        />
        <Button
          buttonTitle="Cancel"
          type="button"
          tw="inline-flex items-center mt-4 mr-4 px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => (window.location.href = "/measure")}
          data-testid="create-new-measure-cancel-button"
        />
      </form>
    </div>
  );
};

export { CreateNewMeasure };
