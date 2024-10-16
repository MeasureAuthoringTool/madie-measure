import React from "react";
import "twin.macro";
import "styled-components/macro";
import MeasureObservationDetails from "./MeasureObservationDetails";
import {
  MeasureObservation,
  MeasureScoring,
  PopulationType,
} from "@madie/madie-models";
import { v4 as uuidv4 } from "uuid";
import { useFormikContext } from "formik";
import * as _ from "lodash";
import { DSLink } from "@madie/madie-design-system/dist/react";
import "../../../../common/madie-link.scss";

const MeasureGroupObservation = ({
  scoring,
  population,
  elmJson,
  canEdit,
  linkMeasureObservationDisplay,
  errors,
}) => {
  const formik = useFormikContext<any>();
  let observationName = "";
  let label = `Observation`;
  let criteriaReference = null;
  let style = {};
  let measureObservation = null;
  let required = false;
  let ratio = false;
  if (
    scoring === MeasureScoring.RATIO &&
    linkMeasureObservationDisplay &&
    [PopulationType.NUMERATOR, PopulationType.DENOMINATOR].includes(
      population?.name
    )
  ) {
    label = `${population.name} ${label}`;
    observationName = population.name;
    criteriaReference = population.id;
    measureObservation = formik.values.measureObservations?.find(
      (mo) => mo.criteriaReference === population.id
    );
    required = true;
    ratio = true;
  } else if (
    scoring === MeasureScoring.CONTINUOUS_VARIABLE &&
    [PopulationType.MEASURE_POPULATION].includes(population?.name) &&
    formik.values.measureObservations?.[0] &&
    _.isNil(linkMeasureObservationDisplay)
  ) {
    observationName = "cv-obs";
    criteriaReference = population.id;
    formik.values.measureObservations[0].criteriaReference = population?.id;
    measureObservation = formik.values.measureObservations?.[0];
    required = true;
  } else {
    return null;
  }

  let index = formik.values.measureObservations?.indexOf(measureObservation);
  const error = index >= 0 ? formik.errors?.measureObservations?.[index] : null;
  // we either return measureObservation, or the means to create one at the moment.
  // We want three cases, MO, add, none
  return measureObservation ? (
    <MeasureObservationDetails
      canEdit={canEdit}
      label={label}
      errors={error ? error : ""}
      required={required}
      ratio={ratio}
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
  ) : (
    <div className="add-population-button add">
      {canEdit && (
        <DSLink
          className="madie-link add"
          style={{ textDecoration: "none" }}
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
      )}
    </div>
  );
};

export default MeasureGroupObservation;
