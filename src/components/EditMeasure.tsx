import * as React from "react";
import { useParams } from "react-router-dom";
import tw from "twin.macro";
import "styled-components/macro";

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

const sendGetRequest = async (id: string): Promise<Measure> => {
  try {
    const resp = await axios.get("http://localhost:8081/measure/${id}/edit");
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
    const result = Promise.resolve(sendGetRequest(id));
    result.then(function (value) {
      setMeasure(value);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div tw="px-4 " data-testid="measure-name-edit">  
      Measure:
      <InlineEdit
        text={measure.name}
        onSetText={(text) => setMeasure({ ...measure, name: text })}
      />
    </div>
  );
}
