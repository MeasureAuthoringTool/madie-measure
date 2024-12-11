import React, { useState, useEffect, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { TestCase } from "@madie/madie-models";
import Button from "@mui/material/Button";
import { Menu, MenuItem } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { measureStore } from "@madie/madie-util";
import "./EditTestCaseBreadCrumbs.scss";

export interface EditTestCaseBreadCrumbsProps {
  measureId: string;
  testCase: TestCase;
}

const EditTestCaseBreadCrumbs = (props: EditTestCaseBreadCrumbsProps) => {
  const { testCase, measureId } = props;

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [testCases, setTestCases] = React.useState(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [measure, setMeasure] = useState<any>(measureStore.state);

  const generateTestCaseString = useCallback((testCase) => {
    let testCaseString = "";

    if (testCase) {
      testCaseString = testCase?.caseNumber
        ? `Case #${testCase.caseNumber}: `
        : "";
      testCaseString += testCase?.series
        ? `${testCase.series} - ${testCase.title}`
        : `${testCase.title}`;
    }

    return testCaseString;
  }, []);

  let testCaseString = generateTestCaseString(testCase);
  let navigate = useNavigate();

  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (measure && testCaseString) {
      const measureTestCases = measure.testCases
        ?.map((testCase) => {
          return {
            ...testCase,
            testCaseString: generateTestCaseString(testCase),
          };
        })
        .sort((a, b) => b.caseNumber - a.caseNumber);

      setTestCases(measureTestCases);

      const index = measureTestCases?.findIndex(
        (testCase) => testCase.testCaseString === testCaseString
      );
      setSelectedIndex(index);
    }
  }, [measure, testCaseString]);

  const handleIconButtonOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (index: number) => {
    setAnchorEl(null);

    const newPath = `/measures/${measure.id}/edit/test-cases/${testCases[index].id}`;
    navigate(newPath);
  };

  return (
    <div id="edit-test-case-bread-crumbs">
      <NavLink
        data-testid="qdm-test-cases"
        to={`/measures/${measureId}/edit/test-cases/list-page`}
        className="madie-link"
      >
        Test Cases
      </NavLink>
      <div className="spacer">/</div>
      {testCaseString}

      <Button
        aria-label="Navigate test cases button"
        data-testid="navigate-test-cases-btn"
        onClick={handleIconButtonOpen}
      >
        <ExpandMoreIcon style={{ height: 32, width: 32, color: "#333" }} />
      </Button>

      <Menu
        id="test-cases-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {testCases?.map((testCase, index) => {
          const testCaseString = generateTestCaseString(testCase);

          return (
            <MenuItem
              onClick={() => handleMenuItemClick(index)}
              key={testCaseString}
              value={testCaseString}
              selected={index === selectedIndex}
              disabled={index === selectedIndex}
            >
              {testCaseString}
            </MenuItem>
          );
        })}
      </Menu>
    </div>
  );
};

export default EditTestCaseBreadCrumbs;
