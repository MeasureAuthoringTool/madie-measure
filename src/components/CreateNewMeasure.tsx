import React from "react";
import tw from "twin.macro";
import { TextInput, Label, Button } from "@madie/madie-components";
import { useHistory } from "react-router-dom";

export default function CreateNewMeasure() {
  const history = useHistory();

  return (
    <div tw="w-1/4 mx-auto my-8">
      <TextInput
        type="text"
        id="measureName"
        name="measureName"
        placeholder="Enter a Measure Name"
        data-testid="measure-name-text-field"
      >
        <Label htmlFor="measureName" text="Measure Name" />
      </TextInput>
      <Button
        buttonTitle="Create Measure"
        type="button"
        tw="inline-flex items-center mt-4 mr-4 px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={() => history.push("/measure/create")}
        data-testid="create-new-measure-save-button"
      />
      <Button
        buttonTitle="Cancel"
        type="button"
        tw="inline-flex items-center mt-4 mr-4 px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={() => history.push("/")}
        data-testid="create-new-measure-cancel-button"
      />
    </div>
  );
}
