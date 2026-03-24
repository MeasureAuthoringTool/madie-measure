import React, { useEffect, useState } from "react";
import "twin.macro";
import "styled-components/macro";
import { MenuItem as MuiMenuItem } from "@mui/material";
import { Select, DSLink } from "@madie/madie-design-system/dist/react";
import { FieldArray, getIn } from "formik";
import { v4 as uuidv4 } from "uuid";
import TextEditor from "../TextEditor";

import "../../../../common/madie-link.scss";

const deleteToken = "FDE8472A-6095-4292-ABF7-E35AD435F05F";

const getEmptyStratLocal = () => ({
  cqlDefinition: "",
  description: "",
  association: null,
  id: uuidv4(),
});

export interface QDMStratificationsProps {
  formik: any;
  canEdit: boolean;
  stratificationOptions: React.ReactNode[];
  visibleStrats: number;
  setVisibleStrats: (n: number) => void;
}

const QDMStratifications = ({
  formik,
  canEdit,
  stratificationOptions,
  visibleStrats,
  setVisibleStrats,
}: QDMStratificationsProps) => {
  const [addStratClicked, setAddStratClicked] = useState(false);

  useEffect(() => {
    if (addStratClicked && visibleStrats > 2) {
      document
        .getElementById(`Stratification-select-${visibleStrats}`)
        ?.focus();
      setAddStratClicked(false);
    }
  }, [visibleStrats]);

  return (
    <FieldArray
      name="stratifications"
      render={(arrayHelpers) => (
        <div>
          {formik.values.stratifications &&
            formik.values.stratifications.map(
              (strat, i) =>
                formik.values.stratifications[i].description !==
                  deleteToken && (
                  <div key={i} tw="mt-6">
                    <div tw="grid lg:grid-cols-4 gap-4">
                      <div tw="lg:col-span-2">
                        <div tw="relative">
                          {formik.values.stratifications.length > 2 && (
                            <DSLink
                              className="madie-link"
                              sx={{
                                position: "absolute",
                                left: "117px",
                                zIndex: "1",
                                textDecoration: "none",
                              }}
                              component="button"
                              underline="always"
                              onClick={(e) => {
                                e.preventDefault();
                                arrayHelpers.remove(i);
                                setVisibleStrats(visibleStrats - 1);
                              }}
                              variant="body2"
                              data-testid="remove-strat-button"
                            >
                              Remove
                            </DSLink>
                          )}

                          <Select
                            readOnly={!canEdit}
                            placeHolder={{
                              name: "Select Definition",
                              value: "",
                            }}
                            label={`Stratification ${i + 1}`}
                            id={`Stratification-select-${i + 1}`}
                            aria-describedby={`Stratification-select-${
                              i + 1
                            }-helper-text`}
                            error={Boolean(
                              getIn(
                                formik.errors,
                                `stratifications[${i}].cqlDefinition`
                              )
                            )}
                            helperText={getIn(
                              formik.errors,
                              `stratifications[${i}].cqlDefinition`
                            )}
                            inputProps={{
                              "data-testid": `stratification-${i + 1}-input`,
                            }}
                            {...formik.getFieldProps(
                              `stratifications[${i}].cqlDefinition`
                            )}
                            size="small"
                            options={stratificationOptions}
                          />
                        </div>
                      </div>
                      <div tw="lg:col-span-2">
                        <TextEditor
                          label={`Stratification ${i + 1} Description`}
                          setFieldValue={formik.setFieldValue}
                          readOnly={!canEdit}
                          {...formik.getFieldProps(
                            `stratifications[${i}].description`
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )
            )}
          {canEdit ? (
            <div tw="pt-4">
              <DSLink
                className="madie-link"
                sx={{
                  color: "#0073C8",
                  padding: "14px 0 14px 0",
                }}
                data-testid="add-strat-button"
                onClick={(e) => {
                  e.preventDefault();
                  setVisibleStrats(visibleStrats + 1);
                  arrayHelpers.push(getEmptyStratLocal());
                  setAddStratClicked(true);
                }}
              >
                + Add Stratification
              </DSLink>
            </div>
          ) : (
            <div tw="p-4"></div>
          )}
        </div>
      )}
    />
  );
};

export default QDMStratifications;
