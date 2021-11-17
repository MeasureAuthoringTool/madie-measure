import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateNewMeasure } from "./CreateNewMeasure";

describe("Home component", () => {
  it("should mount home component", async () => {
    const { getByTestId } = render(<CreateNewMeasure />);
    // const input = getByTestId("measureName");
    // userEvent.click(input);
    // await waitFor(() => {
    //   expect(getByTestId("helper-text")).not.toBe(null);
    //   expect(getByTestId("helper-text")).toHaveTextContent(
    //     "A measure name is required."
    //   );
    // });
  });
});
