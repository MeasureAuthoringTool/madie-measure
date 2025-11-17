import React, { useState, useEffect } from "react";
import { DataElement } from "cqm-models";
import * as _ from "lodash";
import { Tooltip } from "@mui/material";

const CodesRow = ({ code }) => {
  return (
    <div className="codes-row">
      <Tooltip
        title={`Code System Version: ${code.version ?? "not available"}`}
      >
        <span>{`${code.system}: ${code.code}`}</span>
      </Tooltip>
    </div>
  );
};

// we care about the codes
const DataTypeCell = (props: { element: DataElement; codeSystemMap: any }) => {
  const { element, codeSystemMap = {} } = props;
  let codes = null;
  if (element && element.get) {
    codes = element?.get("dataElementCodes");
  }
  const [codeList, setCodeList] = useState([]);

  //  if we've got a codesystem lookup, we'll map the name
  useEffect(() => {
    if (codes) {
      setCodeList(
        codes.map((code) => {
          if (codeSystemMap[code.system]) {
            return {
              system: codeSystemMap[code.system].name,
              code: code.code,
              version: codeSystemMap[code.system].version,
            };
          }
          return {
            system: code.system,
            code: code.code,
            version: code.version?.replace(/urn:hl7:version:/g, ""),
          };
        })
      );
    }
  }, [codeSystemMap, codes]);

  return (
    <div className="data-type-container">
      <div className="header">
        <span>{`${_.capitalize(element?.qdmCategory)}, `}</span>
        <span>
          {element?.qdmStatus
            ? _.capitalize(element?.qdmStatus)
            : _.capitalize(element?.qdmTitle)}
        </span>
      </div>
      <div className="element-type">
        {element?.description &&
          element.description.substring(element.qdmTitle.length + 2)}
      </div>
      {codeList.map((code) => (
        <CodesRow code={code} />
      ))}{" "}
    </div>
  );
};

export default DataTypeCell;
