import React from "react";
import MetaDataWrapper from "./MetaDataWrapper";
import { Button } from "@madie/madie-design-system/dist/react";
import { Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import "./QDMMeasureDefinitions.scss";

const QDMMeasureDefinitions = () => {
  return (
    <div
      id="measure-details-form"
      data-testid={`measure-definition-terms`}
      style={{ minHeight: 539 }}
    >
      <div className="content">
        <div className="subTitle">
          <h2>Definition Terms</h2>
          <div>
            <Typography
              style={{ fontSize: 14, fontWeight: 300, fontFamily: "Rubik" }}
            >
              <span style={{ color: "#D92F2F", marginRight: 3 }}>*</span>
              Indicates required field
            </Typography>
          </div>
        </div>
        <div id="qdm-measure-definitions">
          <div className="top-row">
            <Button
              id="create-definition"
              variant="outline-filled"
              className="page-header-action-button"
              data-testid="create-definition-button"
            >
              <AddIcon className="page-header-action-icon" />
              Add Term
            </Button>
          </div>
          <table className="definition-table">
            <thead>
              <tr>
                <th scope="col" className="col-header">
                  Term
                </th>
                <th scope="col" className="col-header">
                  Definition
                </th>
                <th scope="col" className="col-header"></th>
              </tr>
            </thead>
            <tbody>
              <p>
                There are currently no definitions. Click the (Add Term) button
                above to add one.
              </p>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QDMMeasureDefinitions;
