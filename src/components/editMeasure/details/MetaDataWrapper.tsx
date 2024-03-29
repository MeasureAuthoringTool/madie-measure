import React from "react";
import { Button } from "@madie/madie-design-system/dist/react";
import { Typography } from "@mui/material";

const MetaDataWrapper = ({
  header,
  canEdit,
  // content to wrap
  children,
  // form stuff
  dirty,
  isValid,
  handleSubmit,
  onCancel,
}) => {
  return (
    <form
      id="measure-details-form"
      onSubmit={handleSubmit}
      data-testid={`measure-${header}`}
      style={{ minHeight: 539 }}
    >
      <div className="content">
        <div className="subTitle">
          <h2>{header}</h2>
          <div>
            <Typography
              style={{ fontSize: 14, fontWeight: 300, fontFamily: "Rubik" }}
            >
              <span style={{ color: "#D92F2F", marginRight: 3 }}>*</span>
              Indicates required field
            </Typography>
          </div>
        </div>
        {children}
      </div>
      <div className="form-actions">
        <Button
          variant="outline"
          disabled={!dirty || !canEdit}
          data-testid="cancel-button"
          onClick={onCancel}
          style={{ marginTop: 20, float: "right", marginRight: 32 }}
        >
          Discard Changes
        </Button>
        <Button
          disabled={!(isValid && dirty) || !canEdit}
          type="submit"
          variant="cyan"
          data-testid={`measure-${header}-save`}
          style={{ marginTop: 20, float: "right" }}
        >
          Save
        </Button>
      </div>
    </form>
  );
};

export default MetaDataWrapper;
