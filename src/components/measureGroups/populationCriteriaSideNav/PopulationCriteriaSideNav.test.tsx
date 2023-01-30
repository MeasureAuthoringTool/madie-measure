import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import PopulationCriteriaSideNav, {
  PopulationCriteriaSideNavProp,
} from "./PopulationCriteriaSideNav";
import ServiceContext, { ServiceConfig } from "../../../api/ServiceContext";

const groupsBaseUrl = "/measures/" + "testMeasureId" + "/edit/groups";
const measureGroups = [
  {
    title: "Criteria 1",
    href: groupsBaseUrl,
    dataTestId: "leftPanelMeasureInformation-MeasureGroup1",
  },
];
const initialProps: PopulationCriteriaSideNavProp = {
  canEdit: true,
  sideNavLinks: [
    {
      title: "Population Criteria",
      groups: measureGroups,
      dataTestId: "leftPanelMeasurePopulationCriteriaTab",
      id: "sideNavMeasurePopulationCriteria",
    },
    {
      title: "Supplemental Data",
      href: "supplementalDataBaseUrl",
      dataTestId: "leftPanelMeasurePopulationsSupplementalDataTab",
      id: "sideNavMeasurePopulationsSupplementalData",
    },
    {
      title: "Risk Adjustment",
      href: "riskAdjustmentBaseUrl",
      dataTestId: "leftPanelMeasurePopulationsRiskAdjustmentTab",
      id: "sideNavMeasurePopulationsRiskAdjustment",
    },
  ],
  setSideNavLinks: jest.fn().mockImplementation((v) => v),
  measureId: "testMeasureId",
  measureGroupNumber: 3,
  setMeasureGroupNumber: jest.fn().mockImplementation((v) => v),
};

describe("PopulationCriteriaSideNav", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const { getByTestId, getByText, queryByText } = screen;
  const features: ServiceConfig = {
    elmTranslationService: { baseUrl: "" },
    measureService: { baseUrl: "" },
    terminologyService: { baseUrl: "" },
    features: {
      export: false,
      measureVersioning: false,
      populationCriteriaTabs: true,
    },
  };

  const RenderEditMeasureSideBarNav = (props) => {
    return render(
      <MemoryRouter
        initialEntries={[{ pathname: "/measures/testMeasureId/edit/groups" }]}
      >
        <ServiceContext.Provider value={features}>
          <PopulationCriteriaSideNav {...props} />
        </ServiceContext.Provider>
      </MemoryRouter>
    );
  };

  test("Measure's Population Criteria are loaded along with Supplemental Data and Risk Adjustment", async () => {
    await waitFor(() => RenderEditMeasureSideBarNav(initialProps));
    expect(getByText("Criteria 1")).toBeInTheDocument();
    expect(getByText("Add Population Criteria")).toBeInTheDocument();
    expect(getByText("Supplemental Data")).toBeInTheDocument();
    expect(getByText("Risk Adjustment")).toBeInTheDocument();
    const populationCriteria1 = getByTestId(
      "leftPanelMeasureInformation-MeasureGroup1"
    ) as HTMLAnchorElement;
    console.log(populationCriteria1);
    expect(populationCriteria1).toHaveClass("active");
    // expect(populationCriteria1.classList.contains("nav-link active")).toBe(
    //   true
    // );
  });

  test("Measure Group add click when dirty opens up a warning dialog, hitting cancel closes it", async () => {
    RenderEditMeasureSideBarNav(initialProps);
    expect(getByText("Criteria 1")).toBeInTheDocument();

    expect(getByTestId("AddIcon")).toBeInTheDocument();
    const addNewPopulationCriteriaButton = screen.getByTestId(
      "add-measure-group-button"
    ) as HTMLAnchorElement;
    userEvent.click(addNewPopulationCriteriaButton);

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
    expect(getByText("Criteria 1")).toBeInTheDocument();
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
    expect(getByText("Criteria 1")).toBeInTheDocument();
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
    RenderEditMeasureSideBarNav(nonDirtyProps);
    expect(getByText("Criteria 1")).toBeInTheDocument();
    const navButton = getByTestId("leftPanelMeasureInformation-MeasureGroup1");
    expect(navButton).toBeInTheDocument();
    fireEvent.click(navButton);
    expect(queryByText("You have unsaved changes.")).toBe(null);
  });

  test("Population Criteria page navigation between the tabs", async () => {
    RenderEditMeasureSideBarNav(initialProps);
    expect(
      getByTestId("leftPanelMeasurePopulationCriteriaTab")
    ).toBeInTheDocument();
    expect(
      getByTestId("leftPanelMeasurePopulationsSupplementalDataTab")
    ).toBeInTheDocument();
    expect(
      getByTestId("leftPanelMeasurePopulationsRiskAdjustmentTab")
    ).toBeInTheDocument();
    expect(getByText("Criteria 1")).toBeInTheDocument();
    userEvent.click(
      getByTestId("leftPanelMeasurePopulationsSupplementalDataTab")
    );
    expect(getByText("Supplemental Data")).toBeInTheDocument();
  });
});
