import React from "react";
import { useParams } from "react-router-dom";
import tw from "twin.macro";
import { TextInput, Label, Button } from "@madie/madie-components";

interface inputParams {
  id: string
}

export default function EditMeasure() {
  const { id } = useParams<inputParams>();

  return <div tw="w-1/4 mx-auto my-8">Edit a measure {id}</div>;
}
