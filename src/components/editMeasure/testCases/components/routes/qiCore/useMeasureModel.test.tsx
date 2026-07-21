import React from "react";
import { render, screen } from "@testing-library/react";
import { ExecutionContextProvider } from "./ExecutionContext";
import useMeasureModel from "./useMeasureModel";

const Probe = () => <span data-testid="model">{useMeasureModel()}</span>;

describe("useMeasureModel", () => {
  it("returns the current measure model from the execution context", () => {
    render(
      <ExecutionContextProvider
        value={
          {
            measureState: [{ model: "QI-Core 6.0" } as any, jest.fn()],
          } as any
        }
      >
        <Probe />
      </ExecutionContextProvider>
    );

    expect(screen.getByTestId("model")).toHaveTextContent("QI-Core 6.0");
  });

  it("returns undefined outside the execution context", () => {
    render(<Probe />);

    expect(screen.getByTestId("model")).toBeEmptyDOMElement();
  });
});
