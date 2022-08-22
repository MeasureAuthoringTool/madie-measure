import React from "react";
import "styled-components/macro";
import MeasureObservationDetails from "./MeasureObservationDetails";
import {
  MeasureObservation,
  MeasureScoring,
  PopulationType,
} from "@madie/madie-models";
import { Grid as GridLayout } from "@mui/material";
import { v4 as uuidv4 } from "uuid";
import { useFormikContext } from "formik";
import * as _ from "lodash";
import { DSLink } from "@madie/madie-design-system/dist/react";

const MeasureGroupObservation = ({ scoring, population, elmJson }) => {
  const formik = useFormikContext<any>();
  let observationName = "";
  let label = `Observation`;
  let criteriaReference = null;
  let style = {};
  let measureObservation = null;
  let required = false;

  if (
    scoring === MeasureScoring.RATIO &&
    [PopulationType.NUMERATOR, PopulationType.DENOMINATOR].includes(
      population?.name
    )
  ) {
    label = `${population.name} ${label}`;
    observationName = population.name;
    criteriaReference = population.id;
    style = { marginLeft: 40, marginTop: 24 };
    measureObservation = formik.values.measureObservations?.find(
      (mo) => mo.criteriaReference === population.id
    );
  } else if (
    scoring === MeasureScoring.CONTINUOUS_VARIABLE &&
    _.isNil(population?.name) &&
    formik.values.measureObservations?.[0]
  ) {
    observationName = "cv-obs";
    measureObservation = formik.values.measureObservations?.[0];
    required = true;
    style = { marginLeft: 8, marginTop: 24 };
  } else {
    return null;
  }

  return measureObservation ? (
    <div style={style}>
      <MeasureObservationDetails
        label={label}
        required={required}
        name={observationName}
        elmJson={elmJson}
        measureObservation={measureObservation}
        onChange={(nextObservation) => {
          const updatedObservations = [
            ...formik.values.measureObservations.filter(
              (mo) => mo.id !== nextObservation.id
            ),
            nextObservation,
          ];
          formik.setFieldValue("measureObservations", updatedObservations);
        }}
        onRemove={(removedObservation) => {
          const updatedObservations = [
            ...formik.values.measureObservations.filter(
              (mo) => mo.id !== removedObservation.id
            ),
          ];
          formik.setFieldValue("measureObservations", updatedObservations);
        }}
      />
    </div>
  ) : (
    <span style={style}>
      <DSLink
        href=""
        onClick={(e) => {
          e.preventDefault();
          const newObs = {
            id: uuidv4(),
            criteriaReference,
          };
          const updatedObservations: MeasureObservation[] = formik.values
            .measureObservations
            ? [...formik.values.measureObservations, newObs]
            : [newObs];
          formik.setFieldValue("measureObservations", updatedObservations);
        }}
        data-testid={`add-measure-observation-${observationName}`}
      >
        + Add Observation
      </DSLink>
    </span>
  );
};

export default MeasureGroupObservation;
