import React from "react";
import tw, { css } from "twin.macro";
import { TextInput, Label, Button, HelperText } from "@madie/madie-components";
import axios from "axios";
import { CreateNewMeasureModel } from "../../models/CreateNewMeasureModel";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useHistory } from "react-router-dom";
import { getServiceConfig, ServiceConfig } from "../config/Config";

const CreateNewMeasure = () => {
  const history = useHistory();

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
    onSubmit: async (values: CreateNewMeasureModel) => {
      await createMeasure(values);
    },
  });

  async function createMeasure(measure: CreateNewMeasureModel) {
    const config: ServiceConfig = await getServiceConfig();
    await axios
      .post<CreateNewMeasureModel>(
        config?.measureService?.baseUrl + "/measure",
        measure
      )
      .then((response) => {
        history.push("/measure");
      })
      .catch((err) => {
        // replace this with a banner ?
        // eslint-disable-next-line no-console
        console.log(
          "Internal Error occurred, Please contact administration ->",
          err
        );
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
        <div tw="mt-4">
          <Button
            buttonTitle="Create Measure"
            type="submit"
            tw="mr-4"
            data-testid="create-new-measure-save-button"
            disabled={!(formik.isValid && formik.dirty)}
          />
          <Button
            buttonTitle="Cancel"
            tw="mr-4"
            type="button"
            onClick={() => {
              history.push("/measure");
            }}
            data-testid="create-new-measure-cancel-button"
          />
        </div>
      </form>
    </div>
  );
};

export { CreateNewMeasure };
