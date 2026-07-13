import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LockedMessageModal from "./LockedMessageModal";
import { MemoryRouter } from "react-router-dom";

const mockGetOwnerDetails = jest.fn();
jest.mock("@madie/madie-util", () => ({
  useUserServiceApi: jest.fn(() => ({
    getOwnerDetails: mockGetOwnerDetails,
  })),
}));

describe("LockedMessageModal component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOwnerDetails.mockResolvedValue({});
  });

  it("renders the owner's display name and harpId when open", async () => {
    mockGetOwnerDetails.mockResolvedValueOnce({
      firstName: "John",
      lastName: "Doe",
    });
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
    await waitFor(() => {
      expect(message).toHaveTextContent(
        "This measure is currently being edited by John Doe (user123)."
      );
    });
    expect(message).toHaveTextContent(
      "You will be unable to make changes at this time."
    );
    expect(mockGetOwnerDetails).toHaveBeenCalledWith("user123");
  });

  it("falls back to the harpId as the display name when no name is available", async () => {
    mockGetOwnerDetails.mockResolvedValueOnce({ harpId: "user123" });
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
    await waitFor(() => {
      expect(message).toHaveTextContent(
        "This measure is currently being edited by user123 (user123)."
      );
    });
  });

  it("falls back to the harpId when owner details cannot be retrieved", async () => {
    mockGetOwnerDetails.mockRejectedValueOnce(new Error("fail"));
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
    await waitFor(() => {
      expect(message).toHaveTextContent(
        "This measure is currently being edited by user123 (user123)."
      );
    });
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
