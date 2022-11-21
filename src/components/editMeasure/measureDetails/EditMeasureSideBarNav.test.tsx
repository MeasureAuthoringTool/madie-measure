import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test } from "@jest/globals";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import EditMeasureSideBarNav, {
  EditMeasureSideBarNavProps,
} from "./EditMeasureSideBarNav";

describe("EditMeasureSideBarNav", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const initialProps: EditMeasureSideBarNavProps = {
    canEdit: true,
    dirty: true,
    links: [
      {
        id: "test",
        scoring: "Cohort",
        populations: [
          {
            id: "fakeid",
            name: "initialPopulation",
            definition: "Denominator",
            associationType: null,
          },
        ],
        measureObservations: null,
        groupDescription: "test",
        improvementNotation: "",
        rateAggregation: "",
        measureGroupTypes: ["Patient Reported Outcome"],
        scoringUnit: {
          label: "Number",
          value: {
            code: "number",
          },
        },
        stratifications: [],
        populationBasis: null,
        title: "Population Criteria 1",
        href: "/measures/62e305056d85987a43a6060c/edit/measure-groups",
        dataTestId: "leftPanelMeasureInformation-MeasureGroup1",
      },
      {
        id: "test1",
        scoring: "Cohort",
        populations: [
          {
            id: "fakeid1",
            name: "initialPopulation",
            definition: "Denominator",
            associationType: null,
          },
        ],
        measureObservations: null,
        groupDescription: "test",
        improvementNotation: "",
        rateAggregation: "",
        measureGroupTypes: ["Patient Reported Outcome"],
        scoringUnit: {
          label: "Number",
          value: {
            code: "number",
          },
        },
        stratifications: [],
        populationBasis: null,
        title: "Population Criteria 1",
        href: "/measures/62e305056d85987a43a6060c/edit/measure-groups",
        dataTestId: "leftPanelMeasureInformation-MeasureGroup1",
      },
    ],
    measureGroupNumber: 3,
    setMeasureGroupNumber: jest.fn().mockImplementation((v) => v),
    setSuccessMessage: jest.fn().mockImplementation((v) => v),
    measure: {
      id: "6307c7f9d294b54360b7d014",
      measureHumanReadableId: "",
      measureSetId: "",
      version: 1,
      revisionNumber: 1,
      state: "",
      cqlLibraryName: "C44",
      measureName: "TestMeasure99",
      active: true,
      cqlErrors: false,
      cql: "null",
      elmJson: "null",
      eCqmTitle: "",
      testCases: [],
      groups: undefined,
      createdAt: "2022-08-25T19:05:29.261Z",
      createdBy: "fakeuser",
      lastModifiedAt: "2022-08-25T19:05:29.261Z",
      lastModifiedBy: "fakeuser",
      measurementPeriodStart: new Date("2099-01-22T08:00:00.000+00:00"),
      measurementPeriodEnd: new Date("2099-01-23T08:00:00.000+00:00"),
      model: "",
    },
  };
  const { getByTestId, getByText, queryByText } = screen;
  const RenderEditMeasureSideBarNav = (props) => {
    return render(
      <MemoryRouter
        initialEntries={[{ pathname: "/measures/test-measure/edit/groups" }]}
      >
        <EditMeasureSideBarNav {...props} />
      </MemoryRouter>
    );
  };

  test("Measure Group add click when dirty opens up a warning dialog, hitting cancel closes it", async () => {
    await waitFor(() => RenderEditMeasureSideBarNav(initialProps));
    expect(getByText("Population Criteria 1")).toBeInTheDocument();

    const addButton = getByTestId("AddIcon");
    expect(addButton).toBeInTheDocument();
    userEvent.click(getByTestId("add-measure-group-button"));

    const discardDialog = await getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();
    const cancelButton = await screen.getByTestId(
      "discard-dialog-cancel-button"
    );
    expect(queryByText("You have unsaved changes.")).toBeVisible();
    expect(cancelButton).toBeInTheDocument();
    fireEvent.click(cancelButton);
    await waitFor(() => {
      expect(queryByText("You have unsaved changes.")).not.toBeVisible();
    });
  });

  test("Measure Group nav click when dirty opens up a warning dialog, hitting cancel closes it", async () => {
    await waitFor(() => RenderEditMeasureSideBarNav(initialProps));
    expect(getByText("Population Criteria 1")).toBeInTheDocument();
    const navButton = getByTestId("leftPanelMeasureInformation-MeasureGroup1");
    expect(navButton).toBeInTheDocument();
    fireEvent.click(navButton);
    const discardDialog = await getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();
    const cancelButton = await screen.getByTestId(
      "discard-dialog-cancel-button"
    );
    expect(queryByText("You have unsaved changes.")).toBeVisible();
    expect(cancelButton).toBeInTheDocument();
    fireEvent.click(cancelButton);
    await waitFor(() => {
      expect(queryByText("You have unsaved changes.")).not.toBeVisible();
    });
  });

  test("Measure Group nav click when dirty opens up a warning dialog, hitting continue closes it", async () => {
    await waitFor(() => RenderEditMeasureSideBarNav(initialProps));
    expect(getByText("Population Criteria 1")).toBeInTheDocument();
    const navButton = getByTestId("leftPanelMeasureInformation-MeasureGroup1");
    expect(navButton).toBeInTheDocument();
    fireEvent.click(navButton);
    const discardDialog = await getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();
    const continueButton = await screen.getByTestId(
      "discard-dialog-continue-button"
    );
    expect(queryByText("You have unsaved changes.")).toBeVisible();
    expect(continueButton).toBeInTheDocument();
    fireEvent.click(continueButton);
    await waitFor(() => {
      expect(queryByText("You have unsaved changes.")).not.toBeVisible();
    });
  });

  test("Measure navigation click without dirty does not render a dialog", async () => {
    const nonDirtyProps = { ...initialProps, dirty: false };
    await waitFor(() => RenderEditMeasureSideBarNav(nonDirtyProps));
    expect(getByText("Population Criteria 1")).toBeInTheDocument();
    const navButton = getByTestId("leftPanelMeasureInformation-MeasureGroup1");
    expect(navButton).toBeInTheDocument();
    fireEvent.click(navButton);
    expect(queryByText("You have unsaved changes.")).toBe(null);
  });
});
