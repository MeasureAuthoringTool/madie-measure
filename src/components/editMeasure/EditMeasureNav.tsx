import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  NavLink,
  useLocation,
  useNavigate,
  useMatch,
  useParams,
} from "react-router-dom";
import tw, { styled } from "twin.macro";
import { Tabs, Tab } from "@madie/madie-design-system/dist/react";
import { measureStore } from "@madie/madie-util";
import Joyride, {
  ACTIONS,
  CallBackProps,
  EVENTS,
  STATUS,
  Step,
} from "react-joyride";
import { TooltipRenderProps } from "react-joyride";

interface PropTypes {
  isActive?: boolean;
}

const MyCustomTooltip = ({
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
}: TooltipRenderProps) => {
  return (
    <div
      {...tooltipProps}
      style={{
        padding: 20,
        background: "#222",
        color: "#fff",
        borderRadius: 8,
      }}
    >
      <h4 style={{ marginTop: 0 }}>{step.title}</h4>
      <div>{step.content}</div>
      <div
        style={{
          marginTop: 12,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <button {...backProps}>Back</button>
        <button {...primaryProps}>Next</button>
        <button {...closeProps}>X</button>
      </div>
    </div>
  );
};

const EditMeasureNav = ({ isQDM }) => {
  const [testCaseLength, setTestCaseLength] = useState<any>(null);
  const testCaseLabel =
    testCaseLength === null ? `Test Cases` : `Test Cases (${testCaseLength})`;
  const { pathname } = useLocation();
  let navigate = useNavigate();
  const { measureId } = useParams<{
    measureId: string;
  }>();
  const qdmNavTo = () => {
    isQDM ? `${pathname}/base-configuration` : `${pathname}/groups/1`;
  };
  // we grab the matching pattern after edit, then we only get the part before the next slash.
  const fullMatch = useMatch("/measures/:id/edit/*")?.params?.["*"];
  if (fullMatch === "details" && measureId) {
    navigate(`/measures/${measureId}/edit/details/`);
  }
  const match = useMatch("/measures/:id/edit/*")?.params?.["*"].split("/")[0];

  const [measure, setMeasure] = useState<any>(measureStore.state);
  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (measureId) {
      const testCases = measure?.testCases;
      if (testCases === null) {
        setTestCaseLength(0);
        // when test cases are null, then we set to 0 since they are absent. Otherwise we display 0 before anything shows up
      } else if (testCases?.length >= 0) {
        setTestCaseLength(testCases?.length);
      }
    }
  }, [measureId, measure?.testCases, measure?.testCases?.length]);

  //
  const steps = [
    {
      content: (
        <div>
          <b>Details:</b> The details tab is where users can enter all the meta
          information for the measure.
        </div>
      ),
      placement: "bottom",
      target: "#measure-details-tab",
      disableBeacon: true, // comment out to see a little visual indicator
    },
    {
      content: (
        <div>
          <b>CQL:</b> The CQL tab is where users can enter the measures CQL. It
          contains a free text editor as well as UI builder tabs allowing the
          user to dynamically create the measure CQL.
        </div>
      ),
      placement: "bottom",
      target: "#cql-editor-tab",
    },
    {
      content: (
        <div>
          <b>Population Criteria:</b> This tab is where the populations are set
          up, The user will select measure types, Scoring type, and connect the
          CQL to populations.
        </div>
      ),
      placement: "bottom",
      target: "#groups-tab",
    },
    {
      content: (
        <div>
          <b>Test Cases:</b> This tab is where users will create synthetic
          patients that are designed to test the measures CQL.
        </div>
      ),
      placement: "bottom",
      target: "#patients-tab",
    },
  ];
  const [joyRideState, setJoyRideState] = useState({
    run: false,
    stepIndex: 0,
    steps,
  });

  // uncomment this guy to run the stuff the joyride on load
  // useLayoutEffect(() => {
  //   setJoyRideState((prevState) => ({
  //       ...prevState,
  //       run: true
  //   }))
  // }, [])

  // progrematic stepping example that we can hook into any button click.
  //  Just need to do an additional check to see whether we're currently in a joyride, such as
  // if joyRideState.run === true, then invoke toggleNext step, and add to each button logic click

  const toggleNextStep = (e, v) => {
    console.log("e", e);
    console.log("v", v);
    setJoyRideState((prevState) => {
      // If stepIndex is currently the last step (steps.length - 1),
      // reset to 0 and stop running
      if (prevState.stepIndex >= prevState.steps.length - 1) {
        return {
          ...prevState,
          stepIndex: 0,
          run: false,
        };
      }
      // Otherwise, go to the next step
      return {
        ...prevState,
        stepIndex: prevState.stepIndex + 1,
      };
    });
  };

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, index, status, type } = data;

    if (
      ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND] as string[]).includes(type)
    ) {
      // Update state to advance the tour
      setJoyRideState((prevState) => ({
        ...prevState,
        stepIndex: index + (action === ACTIONS.PREV ? -1 : 1),
      }));
      // setState({ stepIndex: index + (action === ACTIONS.PREV ? -1 : 1) });
    } else if (
      ([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)
    ) {
      // Need to set our running state to false, so we can restart if we click start again.
      // setState({ run: false });
      setJoyRideState((prevState) => ({ ...prevState, run: false }));
    }
  };

  return (
    <div>
      <button
        onClick={() => {
          console.log("joyrideState", joyRideState);
          setJoyRideState((prevState) => ({ ...prevState, run: true }));
        }}
      >
        start joyride
      </button>
      <Joyride
        // @ts-ignore
        steps={joyRideState?.steps}
        stepIndex={joyRideState?.stepIndex}
        continuous
        run={joyRideState?.run}
        scrollToFirstStep
        showSkipButton
        callback={handleJoyrideCallback}
        spotlightClicks // make this truthy to allow clicking through the overlay, effectively forcing user to interract
        // tooltipComponent={MyCustomTooltip} // full override of the component that shows up

        // very mui 5.0 useStyles like feel to a style component. Use this OR just make your own entire reusable component. See above example myCustomTooltip. We should really do that one.
        // styles={{
        // options: {
        //   zIndex: 10000,             // always on top
        //   primaryColor: '#0055aa',   // changes the "Next" button & spotlight
        //   textColor: '#222',         // default text color
        //   backgroundColor: '#fffbe6',// background of the tooltip
        // },

        // main div thing
        // tooltip: {
        //   borderRadius: '12px',      // round corners
        //   fontSize: '14px',
        //   padding: '16px',
        //   boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
        // },

        // title prop
        // tooltipTitle: {
        //   fontWeight: 'bold',
        //   fontSize: '16px',
        //   marginBottom: '8px',
        // },

        // nextButton
        // buttonNext: {
        //   backgroundColor: '#28a745',
        //   color: '#fff',
        //   fontWeight: 'bold',
        // },
        // buttonBack: {
        //   color: '#999',
        //   marginRight: 8,
        // },
        // }}
      />
      <div style={{ marginLeft: "32px" }} id="edit-measure-nav-a">
        <Tabs value={match} type="A" size="standard" onChange={toggleNextStep}>
          <Tab
            value={`details`}
            to="details"
            data-testid="measure-details-tab"
            id="measure-details-tab"
            type="A"
            size="standard"
            label="Details"
            component={NavLink}
          />
          <Tab
            value="cql-editor"
            to={`cql-editor`}
            id="cql-editor-tab"
            data-testid="cql-editor-tab"
            type="A"
            size="standard"
            label="CQL Editor"
            component={NavLink}
          />
          <Tab
            value={isQDM ? `base-configuration` : `groups`}
            to={isQDM ? `base-configuration` : `groups/1`}
            id="groups-tab"
            data-testid="groups-tab"
            type="A"
            size="standard"
            label="Population Criteria"
            component={NavLink}
          />
          <Tab
            value={`test-cases`}
            to={`test-cases/list-page`}
            data-testid="patients-tab"
            id="patients-tab"
            type="A"
            size="standard"
            label={testCaseLabel}
            component={NavLink}
          />
        </Tabs>
      </div>
    </div>
  );
};

export default EditMeasureNav;
