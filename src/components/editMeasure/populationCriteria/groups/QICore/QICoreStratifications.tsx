import React, { useEffect, useState } from "react";
import "twin.macro";
import "styled-components/macro";
import { PopulationType } from "@madie/madie-models";
import { MenuItem as MuiMenuItem } from "@mui/material";
import { Select, DSLink } from "@madie/madie-design-system/dist/react";
import { FieldArray, getIn } from "formik";
import { v4 as uuidv4 } from "uuid";
import * as _ from "lodash";
import TextEditor from "../TextEditor";
import MultipleSelectDropDown from "../../MultipleSelectDropDown";

import "../../../../common/madie-link.scss";

export const deleteToken = "FDE8472A-6095-4292-ABF7-E35AD435F05F";

export const STU4_STRATUM_ASSOCIATION_HELPER_TEXT =
  "This is an optional element. Provision of this association allows a user to target specific populations to stratify within this population criteria." +
  " The default association is to all populations within the population criteria and does not require user to make any selections." +
  " If you desire to stratify all populations within a population criteria, do not provide an association." +
  " If you wish to stratify a subset of populations within this population criteria, provide only the populations that should be stratified." +
  " Refer to the Quality Measure Implementation Guide for more details.";

export const getEmptyStrat = () => ({
  cqlDefinition: "",
  description: "",
  association: null,
  associations: [],
  id: uuidv4(),
});

export const associationSelect = {
  Proportion: [
    PopulationType.INITIAL_POPULATION,
    PopulationType.DENOMINATOR,
    PopulationType.DENOMINATOR_EXCLUSION,
    PopulationType.NUMERATOR,
    PopulationType.NUMERATOR_EXCLUSION,
    PopulationType.DENOMINATOR_EXCEPTION,
  ],
  "Continuous Variable": [
    PopulationType.INITIAL_POPULATION,
    PopulationType.MEASURE_POPULATION,
    PopulationType.MEASURE_POPULATION_EXCLUSION,
  ],
  Cohort: [PopulationType.INITIAL_POPULATION],
  Ratio: [
    PopulationType.INITIAL_POPULATION,
    PopulationType.DENOMINATOR,
    PopulationType.DENOMINATOR_EXCLUSION,
    PopulationType.NUMERATOR,
    PopulationType.NUMERATOR_EXCLUSION,
  ],
};

export interface QICoreStratificationsProps {
  formik: any;
  canEdit: boolean;
  stratificationOptions: React.ReactNode[];
  stratAssociation: any[];
  visibleStrats: number;
  setVisibleStrats: (n: number) => void;
}

const QICoreStratifications = ({
  formik,
  canEdit,
  stratificationOptions,
  stratAssociation,
  visibleStrats,
  setVisibleStrats,
}: QICoreStratificationsProps) => {
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
                      <div tw="lg:col-span-1">
                        <div tw="relative">
                          {formik.values.stratifications.length > 2 &&
                            visibleStrats > 2 && (
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
                            // Modify the logic to do MORE
                            {...formik.getFieldProps(
                              `stratifications[${i}].cqlDefinition`
                            )}
                            onChange={(e) => {
                              if (e.target.value === "") {
                                // we're sending it an empty string so we need to blank the associations as well
                                formik.setValues({
                                  ...formik.values,
                                  stratifications:
                                    formik.values.stratifications.map(
                                      (strat, index) =>
                                        index === i
                                          ? {
                                              ...strat,
                                              cqlDefinition: e.target.value,
                                              associations: [],
                                              association: null,
                                              description: "",
                                            }
                                          : strat
                                    ),
                                });
                              } else {
                                formik.setValues({
                                  ...formik.values,
                                  stratifications:
                                    formik.values.stratifications.map(
                                      (strat, index) =>
                                        index === i
                                          ? {
                                              ...strat,
                                              cqlDefinition: e.target.value,
                                              associations:
                                                Object.values(stratAssociation),
                                            }
                                          : strat
                                    ),
                                });
                              }
                            }}
                            size="small"
                            options={stratificationOptions}
                          />
                        </div>
                        {/*Association Select*/}
                        {/* Given STU update requirements we're going to default all items */}
                        <div tw="pt-4">
                          <MultipleSelectDropDown
                            id={`association-select-${i + 1}`}
                            label={`Association ${i + 1}`}
                            placeHolder={{
                              name: "Select Association",
                              value: null,
                            }}
                            {...formik.getFieldProps(
                              `stratifications[${i}].associations`
                            )}
                            readOnly={!canEdit}
                            options={
                              stratAssociation
                                ? ["Select All"].concat(
                                    Object.values(stratAssociation)
                                  )
                                : []
                            }
                            multipleSelect={true}
                            handleToggleSelectAll={() => {
                              // Are all possible options selected? -> Select None
                              if (
                                _.isEqual(
                                  Object.values(stratAssociation),
                                  formik.getFieldProps(
                                    `stratifications[${i}].associations`
                                  ).value
                                )
                              ) {
                                formik.setFieldValue(
                                  `stratifications[${i}].associations`,
                                  []
                                );
                              } else {
                                // not all selected -> Select ALL
                                formik.setFieldValue(
                                  `stratifications[${i}].associations`,
                                  Object.values(stratAssociation)
                                );
                              }
                            }}
                            onChange={(
                              _event: any,
                              selectedVal: string | null
                            ) => {
                              formik.setFieldValue(
                                `stratifications[${i}].associations`,
                                selectedVal
                              );
                            }}
                            onClose={() =>
                              formik.setFieldTouched(
                                `stratifications[${i}].associations`,
                                true
                              )
                            }
                            tooltipText={STU4_STRATUM_ASSOCIATION_HELPER_TEXT}
                            required={true}
                            error={Boolean(
                              formik?.errors?.stratifications?.[
                                i
                                // @ts-ignore Tech Debt : Figure out how to get red of ts-ignore here
                              ]?.associations
                            )}
                            helperText={
                              formik?.errors?.stratifications?.[
                                i
                                // @ts-ignore Tech Debt : Figure out how to get red of ts-ignore here
                              ]?.associations
                            }
                          />
                        </div>
                      </div>
                      <div tw="lg:col-span-2">
                        <TextEditor
                          readOnly={!canEdit}
                          label={`Stratification ${i + 1} Description`}
                          setFieldValue={formik.setFieldValue}
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
                  arrayHelpers.push(getEmptyStrat());
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

export default QICoreStratifications;
