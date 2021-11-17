import React from "react";
import { useParams } from "react-router-dom";
import tw from "twin.macro";
import { TextInput, Label, Button } from "@madie/madie-components";

export default function EditMeasure() {
  const { id } = useParams();

  return <div tw="w-1/4 mx-auto my-8">Edit a measure {id}</div>;
}
