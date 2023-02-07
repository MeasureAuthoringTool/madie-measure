import React from "react";
import { Button } from "@madie/madie-design-system/dist/react";

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
    >
      <div className="content">
        <div className="subTitle">
          <h2>{header}</h2>
        </div>
        {children}
      </div>
      {canEdit && (
        <div className="form-actions">
          <Button
            variant="outline"
            disabled={!dirty}
            data-testid="cancel-button"
            onClick={onCancel}
            style={{ marginTop: 20, float: "right", marginRight: 32 }}
          >
            Discard Changes
          </Button>
          <Button
            disabled={!(isValid && dirty)}
            type="submit"
            variant="cyan"
            data-testid={`measure-${header}-save`}
            style={{ marginTop: 20, float: "right" }}
          >
            Save
          </Button>
        </div>
      )}
    </form>
  );
};

export default MetaDataWrapper;
