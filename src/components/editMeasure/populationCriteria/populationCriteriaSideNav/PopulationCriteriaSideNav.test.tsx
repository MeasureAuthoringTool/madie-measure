import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import PopulationCriteriaSideNav, {
  PopulationCriteriaSideNavProp,
} from "./PopulationCriteriaSideNav";
import ServiceContext, { ServiceConfig } from "../../../../api/ServiceContext";

const mockHistoryPush = jest.fn();

jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom") as any),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

jest.mock("@madie/madie-util", () => ({
  useFeatureFlags: () => ({
    populationCriteriaTabs: true,
  }),
}));

const groupsBaseUrl = "/measures/" + "testMeasureId" + "/edit/groups";
const measureGroups = [
  {
    title: "Criteria 1",
    href: groupsBaseUrl,
    dataTestId: "leftPanelMeasureInformation-MeasureGroup1",
  },
  {
    title: "Criteria 2",
    href: groupsBaseUrl,
    dataTestId: "leftPanelMeasureInformation-MeasureGroup2",
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
      href: "/measures/testMeasureId/edit/supplemental-data",
      dataTestId: "leftPanelMeasurePopulationsSupplementalDataTab",
      id: "sideNavMeasurePopulationsSupplementalData",
    },
    {
      title: "Risk Adjustment",
      href: "/measures/testMeasureId/edit/risk-adjustment",
      dataTestId: "leftPanelMeasurePopulationsRiskAdjustmentTab",
      id: "sideNavMeasurePopulationsRiskAdjustment",
    },
  ],
  setSideNavLinks: jest.fn().mockImplementation((v) => v),
  measureId: "testMeasureId",
  measureGroupNumber: 0,
  setMeasureGroupNumber: jest.fn().mockImplementation((v) => v),
  isFormDirty: false,
};

describe("PopulationCriteriaSideNav", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const serviceConfig: ServiceConfig = {
    elmTranslationService: { baseUrl: "" },
    measureService: { baseUrl: "" },
    terminologyService: { baseUrl: "" },
  };

  const RenderPopulationCriteriaSideNav = (props) => {
    return render(
      <MemoryRouter
        initialEntries={[{ pathname: "/measures/testMeasureId/edit/groups" }]}
      >
        <ServiceContext.Provider value={serviceConfig}>
          <PopulationCriteriaSideNav {...props} />
        </ServiceContext.Provider>
      </MemoryRouter>
    );
  };

  it("Should load Population Criteria page along with Supplemental Data and Risk Adjustment", () => {
    RenderPopulationCriteriaSideNav(initialProps);
    expect(
      screen.getByRole("button", {
        name: /Population Criteria/i,
      })
    ).toBeInTheDocument();
    const criteria1 = screen.getByRole("tab", {
      name: /Criteria 1/i,
    });
    expect(criteria1).toBeInTheDocument();
    // Initially state -> Criteria 1 will be active
    expect(criteria1).toHaveAttribute("aria-selected", "true");

    expect(
      screen.getByRole("tab", {
        name: /supplemental data/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", {
        name: /risk adjustment/i,
      })
    ).toBeInTheDocument();
  });

  it("Should collapse Population criteria tab", () => {
    RenderPopulationCriteriaSideNav(initialProps);
    const populationCriteriaCollapsableButton = screen.getByRole("button", {
      name: /Population Criteria/i,
    });
    const criteria1 = screen.queryByRole("tab", {
      name: /Criteria 1/i,
    });
    expect(criteria1).toBeInTheDocument();
    userEvent.click(populationCriteriaCollapsableButton);
    expect(criteria1).not.toBeInTheDocument();
  });

  it("should navigate to different Criteria, if the form is not dirty", async () => {
    const { rerender } = RenderPopulationCriteriaSideNav(initialProps);
    const criteria1 = screen.queryByRole("tab", {
      name: /Criteria 1/i,
    });
    expect(criteria1).toBeInTheDocument();
    expect(criteria1).toHaveAttribute("aria-selected", "true");
    const criteria2 = screen.queryByRole("tab", {
      name: /Criteria 2/i,
    });
    expect(criteria2).toBeInTheDocument();
    expect(criteria2).toHaveAttribute("aria-selected", "false");

    userEvent.click(criteria2);

    const reRenderProps = { ...initialProps, measureGroupNumber: 1 };
    rerender(
      <MemoryRouter
        initialEntries={[{ pathname: "/measures/testMeasureId/edit/groups" }]}
      >
        <ServiceContext.Provider value={serviceConfig}>
          <PopulationCriteriaSideNav {...reRenderProps} />
        </ServiceContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      const criteria2 = screen.getByRole("tab", {
        name: /Criteria 2/i,
      });
      expect(criteria2).toHaveAttribute("aria-selected", "true");
    });

    // navigate to Supplemental Data Elements
    const supplementalDataNavButton = screen.getByRole("button", {
      name: /supplemental data/i,
    });
    userEvent.click(supplementalDataNavButton);

    expect(mockHistoryPush).toHaveBeenCalledWith(
      "/measures/testMeasureId/edit/supplemental-data"
    );
  });

  test("Measure Group add click when dirty opens up a warning dialog, hitting cancel closes it", () => {
    RenderPopulationCriteriaSideNav({ ...initialProps, isFormDirty: true });
    const criteria1 = screen.queryByRole("tab", {
      name: /Criteria 1/i,
    });
    expect(criteria1).toBeInTheDocument();
    expect(criteria1).toHaveAttribute("aria-selected", "true");

    expect(screen.getByTestId("AddIcon")).toBeInTheDocument();
    const addNewPopulationCriteriaLink = screen.getByRole("link", {
      name: "Add Population Criteria",
    });
    userEvent.click(addNewPopulationCriteriaLink);

    const discardDialog = screen.getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();
    expect(discardDialog).toHaveTextContent("You have unsaved changes.");
    expect(discardDialog).toHaveTextContent(
      "Are you sure you want to discard your changes?"
    );
    const cancelButton = screen.getByRole("button", {
      name: "No, Keep Working",
    });
    expect(cancelButton).toBeInTheDocument();
    userEvent.click(cancelButton);

    // verifies user is not navigated
    expect(criteria1).toHaveAttribute("aria-selected", "true");
  });

  test("Measure Group add click when dirty opens up a warning dialog, hitting continue closes it and navigates", async () => {
    const { rerender } = RenderPopulationCriteriaSideNav({
      ...initialProps,
      isFormDirty: true,
    });
    const criteria1 = screen.queryByRole("tab", {
      name: /Criteria 1/i,
    });
    expect(criteria1).toBeInTheDocument();
    expect(criteria1).toHaveAttribute("aria-selected", "true");

    expect(screen.getByTestId("AddIcon")).toBeInTheDocument();
    const addNewPopulationCriteriaLink = screen.getByRole("link", {
      name: "Add Population Criteria",
    });
    userEvent.click(addNewPopulationCriteriaLink);

    const discardDialog = screen.getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();
    const continueButton = screen.getByRole("button", {
      name: "Yes, Discard All Changes",
    });
    userEvent.click(continueButton);

    /*
      Onclick of continueButton, state of measureGroupNumber is updated, which is maintained by parent component.
      work around -> rerendering the PopulationCriteriaSideNav component with a new measureGroupNumber
    */
    const newMeasureGroupLink = {
      title: `Criteria 2`,
      href: groupsBaseUrl,
      dataTestId: `leftPanelMeasureInformation-MeasureGroup2`,
    };
    measureGroups.push(newMeasureGroupLink);
    // initialProps.sideNavLinks[0].groups = measureGroups;
    const reRenderProps = { ...initialProps, measureGroupNumber: 2 };
    rerender(
      <MemoryRouter
        initialEntries={[{ pathname: "/measures/testMeasureId/edit/groups" }]}
      >
        <ServiceContext.Provider value={serviceConfig}>
          <PopulationCriteriaSideNav {...reRenderProps} />
        </ServiceContext.Provider>
      </MemoryRouter>
    );

    await waitFor(() => {
      const criteria3 = screen.getByRole("tab", {
        name: /Criteria 3/i,
      });
      expect(criteria3).toHaveAttribute("aria-selected", "true");
    });
  });

  it("should not display discard dialog, when form is dirty and navigating to same Criteria", () => {
    RenderPopulationCriteriaSideNav(initialProps);
    const criteria1 = screen.queryByRole("tab", {
      name: /Criteria 1/i,
    });
    expect(criteria1).toBeInTheDocument();
    expect(criteria1).toHaveAttribute("aria-selected", "true");

    userEvent.click(criteria1);

    expect(criteria1).toHaveAttribute("aria-selected", "true");
    const discardDialog = screen.queryByTestId("discard-dialog");
    expect(discardDialog).toBeNull();
  });

  test("Measure Group nav click when dirty opens up a warning dialog, hitting cancel closes it", () => {
    RenderPopulationCriteriaSideNav({ ...initialProps, isFormDirty: true });
    const criteria1 = screen.queryByRole("tab", {
      name: /Criteria 1/i,
    });
    expect(criteria1).toBeInTheDocument();
    expect(criteria1).toHaveAttribute("aria-selected", "true");

    const criteria2 = screen.queryByRole("tab", {
      name: /Criteria 2/i,
    });
    userEvent.click(criteria2);

    const discardDialog = screen.getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();
    expect(discardDialog).toHaveTextContent("You have unsaved changes.");
    expect(discardDialog).toHaveTextContent(
      "Are you sure you want to discard your changes?"
    );
    const cancelButton = screen.getByRole("button", {
      name: "No, Keep Working",
    });
    expect(cancelButton).toBeInTheDocument();
    userEvent.click(cancelButton);
    // verifies user is not navigated
    expect(criteria1).toHaveAttribute("aria-selected", "true");
  });

  test("Measure Group nav click when dirty opens up a warning dialog, hitting continue closes it and navigates", () => {
    const { rerender } = RenderPopulationCriteriaSideNav({
      ...initialProps,
      isFormDirty: true,
    });
    const criteria1 = screen.queryByRole("tab", {
      name: /Criteria 1/i,
    });
    expect(criteria1).toBeInTheDocument();
    expect(criteria1).toHaveAttribute("aria-selected", "true");

    const criteria2 = screen.queryByRole("tab", {
      name: /Criteria 2/i,
    });
    userEvent.click(criteria2);

    const discardDialog = screen.getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();
    const continueButton = screen.getByRole("button", {
      name: "Yes, Discard All Changes",
    });
    userEvent.click(continueButton);

    // Since we cannot update state of measureGroupNumber which is maintained by parent component.
    // rerendering the PopulationCriteriaSideNav component with a new measureGroupNumber
    const reRenderProps = { ...initialProps, measureGroupNumber: 1 };
    rerender(
      <MemoryRouter
        initialEntries={[{ pathname: "/measures/testMeasureId/edit/groups" }]}
      >
        <ServiceContext.Provider value={serviceConfig}>
          <PopulationCriteriaSideNav {...reRenderProps} />
        </ServiceContext.Provider>
      </MemoryRouter>
    );
    expect(criteria2).toHaveAttribute("aria-selected", "true");
  });
});
