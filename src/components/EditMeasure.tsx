import React from "react";
import { useParams } from "react-router-dom";
import tw from "twin.macro";
import { TextInput, Label, Button } from "@madie/madie-components";

import MeasureLanding from "./MeasureLanding";
import axios from "axios";
import InlineEdit from "./InlineEdit";

const { useState, useEffect } = React;

interface MeasureParam {
  id: string;
}

interface Measure {
  id: string;
  name: string;
}

const sendGetRequest = async (): Promise<Measure> => {
  try {
    const resp = await axios.get("http://localhost:8081/dummy");
    return await resp.data;
  } catch (err) {
    // Handle Error Here
    console.error(err);
  }
};

export default function EditMeasure() {
  const { id } = useParams<MeasureParam>();
  const [measure, setMeasure] = useState<Measure>({ id: "", name: "" });

  useEffect(() => {
    const result = Promise.resolve(sendGetRequest());
    result.then(function (value) {
      setMeasure(value);
    });
  }, []);

  return (
    <div tw="px-4 ">
      Measure:
      <InlineEdit
        text={measure.name}
        onSetText={(text) => setMeasure({ ...measure, name: text })}
      />
    </div>
  );
}
