import React from "react";
import { InitialPopulationAssociationType } from "./GroupPopulation";
import { GroupScoring, PopulationType } from "@madie/madie-models";
import { DSLink } from "@madie/madie-design-system/dist/react";
import tw, { styled } from "twin.macro";
import { v4 as uuidv4 } from "uuid";
import * as _ from "lodash";
import { findPopulations } from "../PopulationHelper";
import "styled-components/macro";
import "../../common/madie-link.scss";

import {
  findIndex,
  getInitialPopulationSize,
  isPopulationRemovable,
  showAddPopulationLink,
  correctPopulationLabel,
  getAssociationType,
} from "../PopulationHelperFunctions";

const FieldSeparator = tw.div`mt-1`;
const SoftLabel = styled.label`
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  color: rgba(66, 75, 90, 0.7);
`;

// needs access to fieldName
const AddRemovePopulation = ({
  field,
  scoring,
  index,
  population,
  populations,
  setAssociationChanged,
  canEdit,
  // callbacks
  insertCallback,
  removeCallback,
  replaceCallback,
}) => {
  const label = correctPopulationLabel(populations, population, index);
  population.associationType = getAssociationType(label, scoring, population);

  const isRemovable = isPopulationRemovable(scoring, populations, index);
  const initialPopulationSize = getInitialPopulationSize(scoring, populations);

  const removePopulation = (evt) => {
    evt.preventDefault();
    removeCallback();
  };

  const changeAssociationCallback = () => {
    if (scoring === GroupScoring.RATIO) {
      const ips = findPopulations(
        populations,
        PopulationType.INITIAL_POPULATION
      );
      if (ips && ips.length === 2) {
        ips.forEach((ip) => {
          if (ip.id !== population.id) {
            if (
              population.associationType ===
              InitialPopulationAssociationType.DENOMINATOR
            ) {
              ip.associationType = InitialPopulationAssociationType.NUMERATOR;
            } else if (
              population.associationType ===
              InitialPopulationAssociationType.NUMERATOR
            ) {
              ip.associationType = InitialPopulationAssociationType.DENOMINATOR;
            }
            const index = findIndex(ip, populations);
            replaceCallback(index, ip);
            setAssociationChanged(true);
          }
        });
      } else {
        replaceCallback(index, population);
      }
    }
  };
  const changeAssociation = (event: React.ChangeEvent<HTMLInputElement>) => {
    population.associationType = (event.target as HTMLInputElement).value;
    changeAssociationCallback();
  };

  const addPopulation = (insertCallback, scoring, population, index) => {
    //scoring and population
    // check scoring, population type and then invoke insert on index
    let secondAssociation = undefined;
    if (scoring === GroupScoring.RATIO) {
      const ip = populations[index];
      if (
        ip?.associationType === InitialPopulationAssociationType.DENOMINATOR
      ) {
        secondAssociation = InitialPopulationAssociationType.NUMERATOR;
      } else if (
        ip?.associationType === InitialPopulationAssociationType.NUMERATOR
      ) {
        secondAssociation = InitialPopulationAssociationType.DENOMINATOR;
      }
    }
    insertCallback(index + 1, {
      id: uuidv4(),
      name: population.name,
      definition: "",
      associationType: secondAssociation,
    });
  };

  const doShowAddPopulationLink = showAddPopulationLink(
    scoring,
    populations,
    population
  );
  return (
    <div>
      {doShowAddPopulationLink && canEdit && (
        <div className="add-population-button add">
          <DSLink
            className="madie-link add"
            data-testid={`add_${field.name}`}
            onClick={(evt) => {
              evt.preventDefault();
              addPopulation(insertCallback, scoring, population, index);
            }}
          >
            + Add {label}
          </DSLink>
        </div>
      )}
      {isRemovable && canEdit && (
        <div className="add-population-button add">
          <DSLink
            className="madie-link remove"
            data-testid={`remove_${field.name}`}
            onClick={(evt) => {
              evt.preventDefault();
              removePopulation(evt);
            }}
          >
            Remove{" "}
          </DSLink>
        </div>
      )}
      {initialPopulationSize === 2 &&
        label.includes("Initial Population") &&
        scoring === "Ratio" && (
          <div
            data-testid={`measure-group-initial-population-association-${population.id}`}
            style={{ marginTop: 35 }}
          >
            <FieldSeparator style={{ marginLeft: 30 }}>
              <div data-testid={`${label}`}>
                <SoftLabel>Association</SoftLabel>
              </div>
              <div
                style={{
                  marginLeft: 15,
                  fontSize: 16,
                  fontFamily: "Rubik",
                }}
              >
                <input
                  type="radio"
                  value={InitialPopulationAssociationType.DENOMINATOR}
                  checked={
                    population.associationType ===
                    InitialPopulationAssociationType.DENOMINATOR
                  }
                  disabled={!canEdit || label.includes("Initial Population 2")}
                  onChange={changeAssociation}
                  data-testid={`${label}-${InitialPopulationAssociationType.DENOMINATOR}`}
                />
                &nbsp;
                {InitialPopulationAssociationType.DENOMINATOR}
              </div>
              <div
                style={{
                  marginLeft: 15,
                  fontSize: 16,
                  fontFamily: "Rubik",
                }}
              >
                <input
                  type="radio"
                  value={InitialPopulationAssociationType.NUMERATOR}
                  checked={
                    population.associationType ===
                    InitialPopulationAssociationType.NUMERATOR
                  }
                  disabled={!canEdit || label.includes("Initial Population 2")}
                  onChange={changeAssociation}
                  data-testid={`${label}-${InitialPopulationAssociationType.NUMERATOR}`}
                />
                &nbsp;
                {InitialPopulationAssociationType.NUMERATOR}
              </div>
            </FieldSeparator>
          </div>
        )}
    </div>
  );
};

export default AddRemovePopulation;
