import React, { useEffect, useState } from "react";
import tw from "twin.macro";
import useMeasureServiceApi from "../../../../api/useMeasureServiceApi";
import { useFormik } from "formik";
import getInitialValues, { setMeasureMetadata } from "./MeasureMetadataHelper";
import { measureStore, useOktaTokens } from "@madie/madie-util";
import { Divider, Typography } from "@mui/material";
import { MeasureMetadataValidator } from "../../../../validations/MeasureMetadataValidator";
import { Button } from "@madie/madie-design-system/dist/react";
import "./MeasureMetadata.scss";

const Form = tw.form`max-w-xl mt-3 space-y-8`;
const FormContent = tw.div`space-y-8 divide-y divide-gray-200`;
const Header = tw.h3`text-lg leading-6 font-medium text-gray-900`;
const SubHeader = tw.p`mt-1 text-sm text-gray-500`;
const FormField = tw.div`mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6`;
const FormFieldInner = tw.div`sm:col-span-3`;
const FieldLabel = tw.label`block text-sm font-normal text-black`;
const FieldSeparator = tw.div`mt-1`;
const FormButtons = tw.div`pt-5`;
const ButtonWrapper = tw.div`flex justify-start`;
const MessageDiv = tw.div`ml-3 mt-2`;
const MessageText = tw.p`text-sm font-medium`;
const SuccessText = tw(MessageText)`text-green-800`;
const ErrorText = tw(MessageText)`text-red-800`;
const TextArea = tw.textarea`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300! rounded-md!`;

export interface MeasureMetadataProps {
  measureMetadataType?: String;
}

export default function MeasureMetadata(props: MeasureMetadataProps) {
  const { measureMetadataType } = props;
  const typeLower = measureMetadataType.toLowerCase();

  const { updateMeasure } = measureStore;
  const [measure, setMeasure] = useState<any>(measureStore.state);
  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  let measureMetaData = measure?.measureMetaData || {};
  const measureServiceApi = useMeasureServiceApi();
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");
  const { getUserName } = useOktaTokens();
  const userName = getUserName();
  const canEdit = userName === measure?.createdBy;

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      genericField: getInitialValues(measure, typeLower),
      dataType: typeLower,
    },
    validationSchema: MeasureMetadataValidator,
    onSubmit: (values) => {
      submitForm(values.genericField);
    },
  });

  const submitForm = (genericField: string) => {
    measure.measureMetaData = { ...measureMetaData };
    setMeasureMetadata(measure, typeLower, genericField);

    measureServiceApi
      .updateMeasure(measure)
      .then(() => {
        setSuccess(`${measureMetadataType}`);
        updateMeasure(measure);
      })
      .catch((reason) => {
        const message = `Error updating measure "${measure.measureName}"`;
        setError(message + " for " + measureMetadataType);
      });
  };

  return (
    <Form
      onSubmit={formik.handleSubmit}
      data-testid={`measure${measureMetadataType}`}
    >
      <FormContent>
        <div>
          {measureMetadataType === "Steward" && (
            <div>
              <Header>Steward/Author</Header>
              <SubHeader>
                This information will be displayed publicly so be careful what
                you share.
              </SubHeader>
            </div>
          )}
          {measureMetadataType !== "Steward" && (
            <>
              {/* <p style={{ fontFamily: "Rubik", fontSize: 32, fontWeight: 400 }}> */}
              <p className="title">{measureMetadataType}</p>

              <div className="flexend">
                <div className="info">
                  <span className="required">*</span>
                  Indicates required field
                </div>
              </div>

              <Divider />
            </>
          )}
          <FormField>
            <FormFieldInner>
              <FieldLabel htmlFor={`measure-${typeLower}`}>
                {measureMetadataType === "Description" && (
                  <span className="required">*</span>
                )}
                {measureMetadataType}
              </FieldLabel>
              <FieldSeparator>
                {canEdit && (
                  <TextArea
                    className="textarea"
                    name={`measure-${typeLower}`}
                    id={`measure-${typeLower}`}
                    autoComplete={`measure-${typeLower}`}
                    onChange={formik.handleChange}
                    value={formik.values.genericField}
                    placeholder={`${measureMetadataType}`}
                    data-testid={`measure${measureMetadataType}Input`}
                    {...formik.getFieldProps("genericField")}
                  />
                )}
                {!canEdit && formik.values.genericField}

                {formik.touched.genericField && formik.errors.genericField ? (
                  <ErrorText>{formik.errors.genericField}</ErrorText>
                ) : null}
              </FieldSeparator>
            </FormFieldInner>
          </FormField>
        </div>
      </FormContent>
      {canEdit && (
        <FormButtons>
          <ButtonWrapper>
            <Button
              className="qpp-c-button--cyan"
              type="submit"
              data-testid={`measure${measureMetadataType}Save`}
              disabled={!(formik.isValid && formik.dirty)}
              style={{ marginTop: 20 }}
            >
              Save
            </Button>

            <MessageDiv>
              {success && success.includes(`${measureMetadataType}`) && (
                <SuccessText
                  data-testid={`measure${measureMetadataType}Success`}
                >
                  Measure {measureMetadataType} Information Saved Successfully
                </SuccessText>
              )}
              {error && error.includes(`${measureMetadataType}`) && (
                <ErrorText data-testid={`measure${measureMetadataType}Error`}>
                  {error}
                </ErrorText>
              )}
            </MessageDiv>
          </ButtonWrapper>
        </FormButtons>
      )}
    </Form>
  );
}
