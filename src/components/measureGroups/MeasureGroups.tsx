import React, { useEffect, useState } from "react";
import tw, { styled } from "twin.macro";
import useCurrentMeasure from "../editMeasure/useCurrentMeasure";
import { MeasureScoring } from "../../models/MeasureScoring";
import { Select, Alert } from "@mui/material";
import { CqlAntlr } from "@madie/cql-antlr-parser/dist/src";
import MeasureDetailsSidebar from "../editMeasure/measureDetails/MeasureDetailsSidebar";
import { Button } from "@madie/madie-components";
import { useFormik, getIn } from "formik";
import { Group } from "../../models/Measure";
import useMeasureServiceApi from "../../api/useMeasureServiceApi";

const Grid = styled.div(() => [tw`grid grid-cols-4 ml-1 gap-y-4`]);
const Content = styled.div(() => [tw`col-span-3`]);
const Header = styled.section`
  background-color: #f2f5f7;
  padding: 40px;
  border-bottom: solid 1px rgba(80, 93, 104, 0.2);
`;
const Title = styled.h1`
  font-size: 18px;
  color: #424b5a;
`;
const FormControl = styled.section(() => [tw`mb-3`, `margin: 25px 40px;`]);
const SoftLabel = styled.label`
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  color: rgba(66, 75, 90, 0.7);
`;
const HeavyLabel = styled.label`
  color: #505d68;
  font-weight: 500;
`;
const Row = styled.section`
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  align-items: center;
  margin-top: 14px;
`;
const Col = styled.article`
  display: flex;
  flex-direction: column;
`;
const Divider = styled.div`
  width: 100%;
  margin: 37px 0px 52px 0px;
  border-bottom: solid 1px rgba(80, 93, 104, 0.2);
`;
const SubTitle = styled.p`
  color: #505d68;
  font-size: 11px;
  margin-top: 20px;
  max-width: 405px;
`;
const SpacerContainer = styled.span`
  margin-left: 45px;
`;
const ButtonSpacer = styled.span`
  margin-left: 15px;
`;

const GroupFooter = tw(Grid)`border-t border-b`;
const GroupActions = styled.div(() => [tw`col-span-1 border-r p-1`]);
const PopulationActions = styled.div(() => [
  "background-color: #f2f5f7;",
  tw`col-span-3 p-1 pl-6`,
]);

export interface ExpressionDefinition {
  expression?: string;
  expressionClass?: string;
  name?: string;
  start?: object;
  stop?: object;
  text?: string;
}

const MeasureGroups = () => {
  const [expressionDefinitions, setExpressionDefinitions] = useState<
    Array<ExpressionDefinition>
  >([]);
  const { measure } = useCurrentMeasure();
  const measureServiceApi = useMeasureServiceApi();
  const [genericErrorMessage, setGenericErrorMessage] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();
  // TODO: hardcoded index 0 as only one group is there.
  // TODO: group will be coming from props when we separate this into separate component
  const group = measure.groups && measure.groups[0];
  const defaultScoring = group?.scoring || measure?.measureScoring || "Cohort";

  const formik = useFormik({
    initialValues: {
      id: group?.id || null,
      scoring: defaultScoring,
      population: {
        initialPopulation: group?.population?.initialPopulation || "",
      },
    } as Group,
    onSubmit: (group: Group) => {
      submitForm(group);
    },
  });

  useEffect(() => {
    if (measure.cql) {
      const definitions = new CqlAntlr(measure.cql).parse()
        .expressionDefinitions;
      setExpressionDefinitions(definitions);
    }
  }, [measure]);

  const submitForm = (group: Group) => {
    if (group.id) {
      measureServiceApi
        .updateGroup(group, measure.id)
        .then((g: Group) =>
          setSuccessMessage(
            "Population details for this group updated successfully."
          )
        )
        .catch((error) => {
          setGenericErrorMessage(error.message);
        });
    } else {
      measureServiceApi
        .createGroup(group, measure.id)
        .then((g: Group) =>
          setSuccessMessage(
            "Population details for this group saved successfully."
          )
        )
        .catch((error) => {
          setGenericErrorMessage(error.message);
        });
    }
  };
  // Local state to later populate the left nav and and govern routes based on group ids
  const measureGroups = [
    {
      title: "MEASURE GROUP 1",
      href: "0011001",
      dataTestId: "leftPanelMeasureInformation",
    },
  ];
  const allOptions = Object.values(MeasureScoring);
  return (
    <form onSubmit={formik.handleSubmit}>
      <Grid>
        <MeasureDetailsSidebar links={measureGroups} />
        <Content>
          <Header>
            <Title>Measure Group 1</Title>
          </Header>
          {genericErrorMessage && (
            <Alert
              data-testid="error-alerts"
              role="alert"
              severity="error"
              onClose={() => setGenericErrorMessage(undefined)}
            >
              {genericErrorMessage}
            </Alert>
          )}
          {successMessage && (
            <Alert
              data-testid="success-alerts"
              role="alert"
              severity="success"
              onClose={() => setSuccessMessage(undefined)}
            >
              {successMessage}
            </Alert>
          )}
          {/* Form control later should be moved to own component and dynamically rendered by switch based on measure. */}
          <FormControl>
            {/* pull from cql file */}
            <SoftLabel htmlFor="scoring-unit-select">Scoring Unit:</SoftLabel>
            <Select
              native
              id="scoring-unit-select"
              inputProps={{
                "data-testid": "scoring-unit-select",
              }}
              name="scoring"
              value={formik.values.scoring}
              onChange={formik.handleChange}
            >
              {allOptions.map((opt, i) => (
                <option
                  key={`${opt}-${i}`}
                  value={opt}
                  data-testid="scoring-unit-option"
                >
                  {opt}
                </option>
              ))}
            </Select>
            <Divider />
            <HeavyLabel htmlFor="ipp-expression-select">
              Initial Population 1*
            </HeavyLabel>
            <Row>
              <Col>
                <Select
                  native
                  displayEmpty
                  id="ipp-expression-select"
                  inputProps={{
                    "data-testid": "ipp-expression-select",
                  }}
                  name="population.initialPopulation"
                  onChange={formik.handleChange}
                  value={getIn(formik.values, "population.initialPopulation")}
                >
                  {expressionDefinitions.map(({ name }, i) => (
                    <option
                      key={`${name}-${i}`}
                      value={name.replace(/"/g, "")}
                      data-testid="ipp-expression-option"
                    >
                      {name.replace(/"/g, "")}
                    </option>
                  ))}
                  <option
                    value={""}
                    disabled
                    data-testid="ipp-expression-option-default"
                  >
                    Select Definition
                  </option>
                </Select>
              </Col>
              <SpacerContainer>
                <ButtonSpacer>
                  <Button buttonTitle="View" variant="white" />
                </ButtonSpacer>
                <ButtonSpacer>
                  <Button buttonTitle="Delete" variant="white" />
                </ButtonSpacer>
              </SpacerContainer>
            </Row>
            <SubTitle>
              Caution: Removing or invalidating a population will cause any
              package groupings containing that population to be cleared on the
              Measure Packager.
            </SubTitle>
          </FormControl>
        </Content>
      </Grid>
      <GroupFooter>
        <GroupActions />
        <PopulationActions>
          <ButtonSpacer>
            <Button
              style={{ background: "#424B5A" }}
              type="submit"
              buttonTitle="Save"
              data-testid="group-form-submit-btn"
            />
          </ButtonSpacer>
          <ButtonSpacer>
            <Button type="button" buttonTitle="Cancel" variant="white" />
          </ButtonSpacer>
        </PopulationActions>
      </GroupFooter>
    </form>
  );
};

export default MeasureGroups;
