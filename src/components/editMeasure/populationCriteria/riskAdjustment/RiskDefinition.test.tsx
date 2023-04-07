import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import RiskDefinition from "./RiskDefinition";
import { act } from "react-dom/test-utils";

describe("RiskDefinition", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const { getByTestId, getByText } = screen;

  const RenderRiskDefinition = (props) => {
    return render(<RiskDefinition {...props} />);
  };

  test("Component renders with props, props trigger as expected", async () => {
    const test1Props = {
      handleDescriptionChange: jest.fn(),
      risk: {
        definition: "Smokers who quit not quitting",
        description:
          "Side effect of sand in disk drive to skew unrelated populations",
      },
    };
    await waitFor(() => RenderRiskDefinition(test1Props));
    const label = getByText("Smokers who quit not quitting - Description");
    expect(label).toBeInTheDocument();
    const textArea = getByTestId("Smokers who quit not quitting-description");
    expect(textArea.value).toEqual(test1Props.risk.description);
    act(() => {
      userEvent.type(textArea, "p");
    });
    expect(test1Props.handleDescriptionChange).toHaveBeenCalledTimes(1);
  });
});
