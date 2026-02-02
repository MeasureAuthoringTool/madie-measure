import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import EditMeasureDetailsSideNav, {
  EditMeasureDetailsSideNavProps,
} from "./EditMeasureDetailsSideNav";

describe("EditMeasureDetailsSideNav", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const initialProps: EditMeasureDetailsSideNavProps = {
    links: [
      {
        title: "General Information",
        links: [
          {
            title: "Name, Version & ID",
            href: "",
            dataTestId: "leftPanelMeasureInformation",
            id: "sideNavMeasureInformation",
            displayCompletedIcon: true,
            displayIncompletedIcon: false,
          },
          {
            title: "Model & Measurement Period",
            href: "model&measurement-period",
            dataTestId: "leftPanelModelAndMeasurementPeriod",
            id: "sideNavMeasureModelAndMeasurementPeriod",
            displayCompletedIcon: false,
            displayIncompletedIcon: true,
          },
          {
            title: "Steward & Developers",
            href: "measure-steward",
            dataTestId: "leftPanelMeasureSteward",
            id: "sideNavMeasureSteward",
            displayCompletedIcon: false,
            displayIncompletedIcon: true,
          },
        ],
      },
      {
        title: "Measure Overview",
        links: [
          {
            title: "Description",
            href: "measure-description",
            dataTestId: "leftPanelMeasureDescription",
            id: "sideNavMeasureDescription",
            displayCompletedIcon: false,
          },
          {
            title: "Rationale",
            href: "measure-rationale",
            dataTestId: "leftPanelMeasureRationale",
            id: "sideNavMeasureRationale",
            displayCompletedIcon: false,
          },
          {
            title: "Guidance (Usage)",
            href: "measure-guidance",
            dataTestId: "leftPanelMeasureGuidance",
            id: "sideNavMeasureGuidance",
            displayCompletedIcon: true,
          },
          {
            title: "Definition",
            href: "measure-definition",
            dataTestId: "leftPanelQDMMeasureDefinition",
            id: "sideNavQDMMeasureDefinition",
            displayCompletedIcon: true,
          },
          {
            title: "Clinical Recommendation",
            href: "measure-clinical-recommendation",
            dataTestId: "leftPanelMeasureClinicalRecommendation",
            id: "sideNavMeasureClinicalRecommendation",
            displayCompletedIcon: true,
          },
          {
            title: "References",
            href: "measure-references",
            dataTestId: "leftPanelMeasureReferences",
            id: "sideNavMeasureReferences",
            displayCompletedIcon: true,
            displayIncompletedIcon: false,
          },
          {
            title: "Transmission Format",
            href: "transmission-format",
            dataTestId: "leftPanelMeasureTransmissionFormat",
            id: "sideNavMeasureTransmissionFormat",
            displayCompletedIcon: true,
          },
          {
            title: "Measure Set",
            href: "measure-set",
            dataTestId: "leftPanelMeasureSet",
            id: "sideNavMeasureSet",
            displayCompletedIcon: true,
          },
        ],
      },
      {
        title: "Legal",
        links: [
          {
            title: "Copyright",
            href: "measure-copyright",
            dataTestId: "leftPanelMeasureCopyright",
            id: "sideNavMeasureCopyright",
            displayCompletedIcon: true,
          },
          {
            title: "Disclaimer",
            href: "measure-disclaimer",
            dataTestId: "leftPanelMeasureDisclaimer",
            id: "sideNavMeasureDisclaimer",
            displayCompletedIcon: true,
          },
        ],
      },
    ],
  };
  const renderEditMeasureDetailsSideNav = (props) =>
    render(
      <MemoryRouter
        initialEntries={[{ pathname: "/measures/test-measure/edit/details" }]}
      >
        <EditMeasureDetailsSideNav {...props} />
      </MemoryRouter>
    );

  test("Measure Details side nav bar is rendered with appropriate titles, icons, and nav links", async () => {
    await waitFor(() => renderEditMeasureDetailsSideNav(initialProps));

    expect(screen.queryByText("General Information")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "General Information" })
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByText("Name, Version & ID")).toBeInTheDocument();
    expect(
      screen.queryByText("Model & Measurement Period")
    ).toBeInTheDocument();
    expect(screen.queryByText("Steward & Developers")).toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `measure-details-completed-icon-${initialProps.links[0].links[0].id}`
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `measure-details-incompleted-icon-${initialProps.links[0].links[1].id}`
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `measure-details-incompleted-icon-${initialProps.links[0].links[2].id}`
      )
    ).toBeInTheDocument();

    expect(screen.queryByText("Measure Overview")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Measure Overview" })
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByText("Description")).toBeInTheDocument();
    expect(screen.queryByText("Rationale")).toBeInTheDocument();
    expect(screen.queryByText("Guidance (Usage)")).toBeInTheDocument();
    expect(screen.queryByText("Definition")).toBeInTheDocument();
    expect(screen.queryByText("Clinical Recommendation")).toBeInTheDocument();
    expect(screen.queryByText("References")).toBeInTheDocument();
    expect(screen.queryByText("Transmission Format")).toBeInTheDocument();
    expect(screen.queryByText("Measure Set")).toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `measure-details-completed-icon-${initialProps.links[1].links[0].id}`
      )
    ).toBeNull();
    expect(
      screen.queryByTestId(
        `measure-details-incompleted-icon-${initialProps.links[1].links[0].id}`
      )
    ).toBeNull();
    expect(
      screen.queryByTestId(
        `measure-details-completed-icon-${initialProps.links[1].links[1].id}`
      )
    ).toBeNull();
    expect(
      screen.queryByTestId(
        `measure-details-incompleted-icon-${initialProps.links[1].links[1].id}`
      )
    ).toBeNull();
    expect(
      screen.queryByTestId(
        `measure-details-completed-icon-${initialProps.links[1].links[2].id}`
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `measure-details-completed-icon-${initialProps.links[1].links[3].id}`
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `measure-details-completed-icon-${initialProps.links[1].links[4].id}`
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `measure-details-completed-icon-${initialProps.links[1].links[5].id}`
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `measure-details-completed-icon-${initialProps.links[1].links[6].id}`
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `measure-details-completed-icon-${initialProps.links[1].links[7].id}`
      )
    ).toBeInTheDocument();

    expect(screen.queryByText("Legal")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Legal" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.queryByText("Copyright")).toBeInTheDocument();
    expect(screen.queryByText("Disclaimer")).toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `measure-details-completed-icon-${initialProps.links[2].links[0].id}`
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `measure-details-completed-icon-${initialProps.links[2].links[1].id}`
      )
    ).toBeInTheDocument();
  });

  test("Measure Details sections can be collapsed and expanded", async () => {
    await waitFor(() => renderEditMeasureDetailsSideNav(initialProps));

    const generalInfoToggle = screen.getByRole("button", {
      name: "General Information",
    });
    expect(screen.getByText("Name, Version & ID")).toBeInTheDocument();

    await userEvent.click(generalInfoToggle);
    expect(generalInfoToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Name, Version & ID")).not.toBeInTheDocument();

    await userEvent.click(generalInfoToggle);
    expect(generalInfoToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Name, Version & ID")).toBeInTheDocument();
  });
});
