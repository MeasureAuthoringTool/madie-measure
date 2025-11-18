import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MeasureLockedPopup from "./MeasureLockedPopup";
import { MemoryRouter } from "react-router-dom";

describe("MeasureLockedPopup component", () => {
  it("renders correctly when open", () => {
    render(
      <MemoryRouter>
        <MeasureLockedPopup
          measureLockedBy="user123"
          lockedMeasurePopupOpen={true}
          setLockedMeasurePopupOpen={jest.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Measure currently In-Use")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This measure is currently edited by HARP ID user123. You will be unable to make changes until it's saved."
      )
    ).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <MemoryRouter>
        <MeasureLockedPopup
          measureLockedBy="user123"
          lockedMeasurePopupOpen={false}
          setLockedMeasurePopupOpen={jest.fn()}
        />
      </MemoryRouter>
    );

    expect(
      screen.queryByText("Measure currently In-Use")
    ).not.toBeInTheDocument();
  });

  it("calls setLockedMeasurePopupOpen with false when Close button is clicked", async () => {
    const setLockedMeasurePopupOpen = jest.fn();
    render(
      <MemoryRouter>
        <MeasureLockedPopup
          measureLockedBy="user123"
          lockedMeasurePopupOpen={true}
          setLockedMeasurePopupOpen={setLockedMeasurePopupOpen}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Close"));

    await waitFor(() => {
      expect(setLockedMeasurePopupOpen).toHaveBeenCalledWith(false);
    });
  });
});
