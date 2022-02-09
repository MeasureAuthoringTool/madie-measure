import React, { useEffect, useState } from "react";
import tw, { styled } from "twin.macro";
import useCurrentMeasure from "../editMeasure/useCurrentMeasure";
import { MeasureScoring } from "../../models/MeasureScoring";
import { Select } from "@mui/material";
import { CqlAntlr } from "@madie/cql-antlr-parser/dist/src";
import MeasureDetailsSidebar from "../editMeasure/measureDetails/MeasureDetailsSidebar";
import { Button } from "@madie/madie-components";

const Grid = styled.div(() => [tw`grid grid-cols-4 ml-6 gap-y-4`]);
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

export interface ExpressionDefinition {
  expression?: string;
  expressionClass?: string;
  name?: string;
  start?: object;
  stop?: object;
  text?: string;
}

const MeasureGroups = () => {
  const [selectedScoring, setSelectedScoring] = useState<String>("Cohort");
  const [expressionDefinitions, setExpressionDefintions] = useState<
    Array<ExpressionDefinition>
  >([]);
  const { measure } = useCurrentMeasure();
  useEffect(() => {
    if (measure.cql) {
      const definitions = new CqlAntlr(measure.cql).parse()
        .expressionDefinitions;
      setExpressionDefintions(definitions);
    }
    if (measure.measureScoring) {
      setSelectedScoring(measure.measureScoring);
    }
  }, [measure]);
  // Local state to later populate the left nav and and govern routes based on group ids
  const measureGroups = [{ title: "MEASURE GROUP 1", href: "0011001" }];
  const allOptions = Object.values(MeasureScoring);
  return (
    <Grid>
      <MeasureDetailsSidebar links={measureGroups} />
      <Content>
        <Header>
          <Title>Measure Group 1</Title>
        </Header>
        {/* Form control later should be moved to own component and dynamically rendered by switch based on measure. */}
        <FormControl>
          {/* pull from cql file */}
          <SoftLabel
            id="select-measure-scoring-groups-label"
            htmlFor="select-measure-scoring-groups"
            data-testid="select-measure-scoring-groups-label"
          >
            Scoring Unit:
          </SoftLabel>
          <Select
            native
            labelId="select-measure-scoring-groups-label"
            id="select-measure-scoring-groups"
            data-testid="select-measure-scoring-groups"
            value={selectedScoring}
            onChange={(e) => setSelectedScoring(e.target.value)}
          >
            {allOptions.map((opt, i) => (
              <option
                key={`${opt}-${i}`}
                value={opt}
                data-testid="select-option-scoring-group"
              >
                {opt}
              </option>
            ))}
          </Select>
          <Divider />
          <HeavyLabel
            htmlFor="select-expression-definition-scoring-groups"
            id="select-expression-definition-scoring-groups-label"
            data-testid="select-expression-definition-scoring-label"
          >
            Initial Population 1*
          </HeavyLabel>
          <Row>
            <Col>
              {expressionDefinitions.length > 0 && (
                <Select
                  native
                  defaultValue=""
                  displayEmpty
                  labelId="select-expression-definition-scoring-label"
                  id="select-expression-definition"
                  data-testid="select-expression-definition"
                >
                  {expressionDefinitions.map(({ name }, i) => (
                    <option
                      key={`${name}-${i}`}
                      value={name}
                      data-testid="select-option-expression-definition"
                    >
                      {name.replace(/"/g, "")}
                    </option>
                  ))}
                  <option
                    value={""}
                    disabled
                    data-testid="select-option-expression-default"
                  >
                    Select Definition
                  </option>
                </Select>
              )}
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
  );
};

export default MeasureGroups;
