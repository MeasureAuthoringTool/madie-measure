import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LockedMessageModal from "./LockedMessageModal";
import { MemoryRouter } from "react-router-dom";

describe("LockedMessageModal component", () => {
  it("renders correctly when open", () => {
    render(
      <MemoryRouter>
        <LockedMessageModal
          lockedType="measure"
          lockedBy="user123"
          lockedModalOpen={true}
          setLockedModalOpen={jest.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Measure currently In-Use")).toBeInTheDocument();
    const message = screen.getByTestId("measure-locked-modal-message");
    expect(message).toHaveTextContent(
      /This measure is currently edited by HARP ID/i
    );
    expect(message).toHaveTextContent("user123");
    expect(message).toHaveTextContent(
      "You will be unable to make changes at this time."
    );
  });

  it("does not render when closed", () => {
    render(
      <MemoryRouter>
        <LockedMessageModal
          lockedType="measure"
          lockedBy="user123"
          lockedModalOpen={false}
          setLockedModalOpen={jest.fn()}
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
        <LockedMessageModal
          lockedType="measure"
          lockedBy="user123"
          lockedModalOpen={true}
          setLockedModalOpen={setLockedMeasurePopupOpen}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Close"));

    await waitFor(() => {
      expect(setLockedMeasurePopupOpen).toHaveBeenCalledWith(false);
    });
  });
});
