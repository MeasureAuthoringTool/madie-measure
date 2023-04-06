import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
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
        title: "Measure Overview",
        links: [
          {
            title: "Description",
            href: "descriptionLink",
            dataTestId: "leftPanelMeasureDescription",
            id: "sideNavMeasureDescription",
          },
          {
            title: "Rationale",
            href: "rationaleLink",
            dataTestId: "leftPanelMeasureRationale",
            id: "sideNavMeasureRationale",
          },
          {
            title: "Guidance",
            href: "guidanceLink",
            dataTestId: "leftPanelMeasureGuidance",
            id: "sideNavMeasureGuidance",
          },
        ],
      },
    ],
  };
  const RenderEditMeasureDetailsSideNav = (props) => {
    return render(
      <MemoryRouter
        initialEntries={[{ pathname: "/measures/test-measure/edit/details" }]}
      >
        <EditMeasureDetailsSideNav {...props} />
      </MemoryRouter>
    );
  };

  test("Measure Details side nav bar is rendered with appropriate titles and nav links", async () => {
    await waitFor(() => RenderEditMeasureDetailsSideNav(initialProps));
    expect(screen.getByText("Measure Overview")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Rationale")).toBeInTheDocument();
    expect(screen.getByText("Guidance")).toBeInTheDocument();
  });
});
