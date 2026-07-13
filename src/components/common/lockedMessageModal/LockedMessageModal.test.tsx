import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LockedMessageModal from "./LockedMessageModal";
import { MemoryRouter } from "react-router-dom";

const mockUseOwnerName = jest.fn();
jest.mock("@madie/madie-util", () => ({
  useOwnerName: (harpId) => mockUseOwnerName(harpId),
}));

describe("LockedMessageModal component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOwnerName.mockImplementation((harpId) => harpId);
  });

  it("renders the owner's display name and harpId when open", () => {
    mockUseOwnerName.mockReturnValue("John Doe");
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
      "This measure is currently being edited by John Doe (user123)."
    );
    expect(message).toHaveTextContent(
      "You will be unable to make changes at this time."
    );
    expect(mockUseOwnerName).toHaveBeenCalledWith("user123");
  });

  it("falls back to the harpId as the display name when no name is available", () => {
    mockUseOwnerName.mockReturnValue("user123");
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

    const message = screen.getByTestId("measure-locked-modal-message");
    expect(message).toHaveTextContent(
      "This measure is currently being edited by user123 (user123)."
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

  it("calls setLockedModalOpen with false when Close button is clicked", async () => {
    const setLockedModalOpen = jest.fn();
    render(
      <MemoryRouter>
        <LockedMessageModal
          lockedType="measure"
          lockedBy="user123"
          lockedModalOpen={true}
          setLockedModalOpen={setLockedModalOpen}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Close"));

    await waitFor(() => {
      expect(setLockedModalOpen).toHaveBeenCalledWith(false);
    });
  });
});
