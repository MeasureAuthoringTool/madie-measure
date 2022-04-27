import React, { useState } from "react";
import tw from "twin.macro";
import useCurrentMeasure from "../../useCurrentMeasure";
import useMeasureServiceApi from "../../../../api/useMeasureServiceApi";
import { useFormik } from "formik";
import getInitialValues, { setMeasureMetadata } from "./MeasureMetadataHelper";
import useOktaTokens from "../../../../hooks/useOktaTokens";

const Form = tw.form`max-w-xl mt-3 space-y-8 divide-y divide-gray-200`;
const FormContent = tw.div`space-y-8 divide-y divide-gray-200`;
const Header = tw.h3`text-lg leading-6 font-medium text-gray-900`;
const SubHeader = tw.p`mt-1 text-sm text-gray-500`;
const FormField = tw.div`mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6`;
const FormFieldInner = tw.div`sm:col-span-3`;
const FieldLabel = tw.label`block text-sm font-medium text-gray-700`;
const FieldSeparator = tw.div`mt-1`;
const FieldInput = tw.input`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300! rounded-md!`;
const FormButtons = tw.div`pt-5`;
const ButtonWrapper = tw.div`flex justify-start`;
const SubmitButton = tw.button` inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`;
const MessageDiv = tw.div`ml-3 mt-2`;
const MessageText = tw.p`text-sm font-medium`;
const SuccessText = tw(MessageText)`text-green-800`;
const ErrorText = tw(MessageText)`text-red-800`;

export interface MeasureMetadataProps {
  measureMetadataType?: String;
}

export default function MeasureMetadata(props: MeasureMetadataProps) {
  const { measureMetadataType } = props;
  const typeLower = measureMetadataType.toLowerCase();

  const { measure } = useCurrentMeasure();
  let { measureMetaData } = measure;
  measureMetaData = measureMetaData || {};
  const measureServiceApi = useMeasureServiceApi();
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");
  const { getUserName } = useOktaTokens();
  const userName = getUserName();
  const canEdit = userName === measure.createdBy;

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: { genericField: getInitialValues(measure, typeLower) },
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
          <FormField>
            <FormFieldInner>
              <FieldLabel htmlFor={`measure-${typeLower}`}>
                {measureMetadataType}
              </FieldLabel>
              <FieldSeparator>
                {canEdit && (
                  <FieldInput
                    type="text"
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
              </FieldSeparator>
            </FormFieldInner>
          </FormField>
        </div>
      </FormContent>
      {canEdit && (
        <FormButtons>
          <ButtonWrapper>
            <SubmitButton
              type="submit"
              data-testid={`measure${measureMetadataType}Save`}
              disabled={!(formik.isValid && formik.dirty)}
            >
              Save
            </SubmitButton>
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
