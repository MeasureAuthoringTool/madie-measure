import React from "react";
import AddIcon from "@mui/icons-material/add";
import { Fade } from "@mui/material";
import "./pageHeader.scss";
/*
Different states

*/
type Props = {
  name: string;
  openCreate: Function;
};
const PageHeader = ({ name, openCreate }: Props & any) => {
  return (
    <div className="measures-page-header">
      <div>
        <div className="left-col">
          {/* this can be modified to take react components later. */}
          <h1> Measures </h1>
          <h4>
            {" "}
            Welcome,{" "}
            <Fade in={name !== ""}>
              <span>{name}</span>
            </Fade>
          </h4>
        </div>
        <div className="right-col">
          <button
            className="new-measure"
            data-testid="create-new-measure-button"
            onClick={openCreate}
          >
            <AddIcon className="add-icon" fontSize="small" />
            <div>New Measure</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
