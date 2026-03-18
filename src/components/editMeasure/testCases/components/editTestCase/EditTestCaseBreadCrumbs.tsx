import React, { useState, useEffect, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { TestCase } from "@madie/madie-models";
import { Select, MenuItem } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { measureStore } from "@madie/madie-util";
import "./EditTestCaseBreadCrumbs.scss";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";

export interface EditTestCaseBreadCrumbsProps {
  measureId: string;
  testCase: TestCase;
  canEdit: boolean;
}

const EditTestCaseBreadCrumbs = (props: EditTestCaseBreadCrumbsProps) => {
  const { testCase, measureId } = props;

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

  const handleMenuItemClick = (index: number) => {
    const newPath = `/measures/${measure.id}/edit/test-cases/${testCases[index].id}`;
    navigate(newPath);
  };

  const getTestCaseDropdownLabel = (
    testCaseString: string,
    testCase: TestCase
  ) => {
    if (props.canEdit && testCase.testCaseLock) {
      return (
        <Box component="span" display="inline-flex" alignItems="center">
          {props.canEdit && testCase.testCaseLock && (
            <Tooltip
              title={
                testCase.testCaseLock?.lockedBy
                  ? `Locked while being edited by ${testCase.testCaseLock.lockedBy}`
                  : "Test Case is locked"
              }
              slotProps={{
                tooltip: {
                  sx: {
                    zIndex: 99,
                    backgroundColor: "#333",
                    "& .MuiTooltip-arrow": {
                      color: "#333",
                    },
                  },
                },
              }}
            >
              <LockOutlinedIcon
                fontSize="small"
                style={{ marginRight: 8 }}
                data-testid="locked-icon"
              />
            </Tooltip>
          )}
          {testCaseString}
        </Box>
      );
    } else {
      return <>{testCaseString}</>;
    }
  };

  return (
    <div id="edit-test-case-bread-crumbs">
      <NavLink
        to={`/measures/${measureId}/edit/test-cases/list-page`}
        className="madie-link"
      >
        Test Cases
      </NavLink>

      <div className="spacer">/</div>

      <Select
        sx={{
          height: "32px",
          borderColor: "transparent",
          "& .Mui-focused": {
            borderColor: "transparent",
          },
          "& .Mui-icon": {
            fontSize: "3px",
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "transparent",
            "& legend": {
              width: 0,
            },
          },
          "& .MuiInputBase-input": {
            fontFamily: "Rubik",
            fontSize: 16,
            fontWeight: 400,
            color: "#515151",
            borderColor: "transparent",
            borderRadius: "3px",
            padding: "9px 14px",
            "&::placeholder": {
              opacity: 0.6,
            },
          },
          "& .MuiSelect-icon": {
            color: "#515151",
            fontSize: "large",
          },
        }}
        IconComponent={ExpandMoreIcon}
        value={testCaseString}
        renderValue={() => getTestCaseDropdownLabel(testCaseString, testCase)}
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
              {getTestCaseDropdownLabel(testCaseString, testCase)}
            </MenuItem>
          );
        })}
      </Select>
    </div>
  );
};

export default EditTestCaseBreadCrumbs;
