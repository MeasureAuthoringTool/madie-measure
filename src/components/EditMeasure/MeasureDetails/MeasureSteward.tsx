import React, { useState } from "react";
import tw from "twin.macro";
import useMeasureServiceApi from "../../../api/useMeasureServiceApi";
import useCurrentMeasure from "../useCurrentMeasure";

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

export default function MeasureSteward() {
  const measureServiceApi = useMeasureServiceApi();
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { measure } = useCurrentMeasure();
  let { measureMetaData } = measure;
  measureMetaData = measureMetaData || {};

  const [measureSteward, setMeasureSteward] = useState(
    measureMetaData.measureSteward
  );

  function onStewardChange(e: React.ChangeEvent<HTMLInputElement>) {
    setMeasureSteward(e.target.value);
  }

  function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    measure.measureMetaData = { ...measureMetaData };
    measure.measureMetaData.measureSteward = measureSteward;

    measureServiceApi
      .updateMeasure(measure)
      .then(() => {
        setSuccess(true);
      })
      .catch((reason) => {
        const message = `Error updating measure "${measure.measureName}"`;
        console.error(message);
        console.error(reason);
        setError(message);
      });
  }

  return (
    <Form onSubmit={onFormSubmit} data-testid="measureSteward">
      <FormContent>
        <div>
          <div>
            <Header>Steward/Author</Header>
            <SubHeader>
              This information will be displayed publicly so be careful what you
              share.
            </SubHeader>
          </div>

          <FormField>
            <FormFieldInner>
              <FieldLabel htmlFor="measure-steward">Measure Steward</FieldLabel>
              <FieldSeparator>
                <FieldInput
                  value={measureSteward}
                  type="text"
                  name="measure-steward"
                  id="measure-steward"
                  autoComplete="given-name"
                  required
                  onChange={onStewardChange}
                  placeholder="Measure Steward Name"
                  data-testid="measureStewardInput"
                />
              </FieldSeparator>
            </FormFieldInner>
          </FormField>
        </div>
      </FormContent>

      <FormButtons>
        <ButtonWrapper>
          <SubmitButton type="submit" data-testid="measureStewardSave">
            Save
          </SubmitButton>
          <MessageDiv>
            {success && (
              <SuccessText data-testid="measureStewardSuccess">
                Measure Steward Information Saved Successfully
              </SuccessText>
            )}
            {error && (
              <ErrorText data-testid="measureStewardError">{error}</ErrorText>
            )}
          </MessageDiv>
        </ButtonWrapper>
      </FormButtons>
    </Form>
  );
}
