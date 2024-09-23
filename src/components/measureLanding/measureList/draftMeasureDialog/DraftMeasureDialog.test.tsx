import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import clearAllMocks = jest.clearAllMocks;
import DraftMeasureDialog from "./DraftMeasureDialog";
import { Measure, Model } from "@madie/madie-models";

jest.mock("@madie/madie-util", () => ({
  useFeatureFlags: jest.fn().mockReturnValue({
    qiCore6: true,
  }),
}));

describe("DraftMeasureDialog component", () => {
  let measure: Measure, onCloseFn, onSubmitFn;
  beforeEach(() => {
    clearAllMocks();
    measure = {
      id: "1",
      measureName: "Test",
      model: "QI-Core v4.1.1",
    } as unknown as Measure;
    onCloseFn = jest.fn();
    onSubmitFn = jest.fn();
  });

  const renderComponent = () => {
    render(
      <DraftMeasureDialog
        open={true}
        onClose={onCloseFn}
        onSubmit={onSubmitFn}
        measure={measure}
      />
    );
  };

  it("should render draft measure dialog", async () => {
    renderComponent();
    expect(screen.getByText("Create Draft")).toBeInTheDocument();
    const measureName = (await screen.findByRole("textbox", {
      name: "Measure Name",
    })) as HTMLInputElement;
    expect(measureName.value).toEqual(measure.measureName);
    expect(screen.getByTestId("create-draft-continue-button")).toBeEnabled();
  });

  it("should check for required measure name", async () => {
    renderComponent();
    expect(screen.getByText("Create Draft")).toBeInTheDocument();
    const measureName = (await screen.findByRole("textbox", {
      name: "Measure Name",
    })) as HTMLInputElement;
    userEvent.clear(measureName);
    await waitFor(() => {
      expect(screen.getByTestId("measureName-helper-text")).toHaveTextContent(
        "A Measure name is required."
      );
    });
  });

  it("should check for measure name with at least one letter", async () => {
    renderComponent();
    expect(screen.getByText("Create Draft")).toBeInTheDocument();
    const measureName = (await screen.findByRole("textbox", {
      name: "Measure Name",
    })) as HTMLInputElement;

    userEvent.clear(measureName);
    userEvent.type(measureName, "123");
    await waitFor(() => {
      expect(screen.getByTestId("measureName-helper-text")).toHaveTextContent(
        "A Measure name must contain at least one letter."
      );
    });
  });

  it("should check for measure name with at no special characters", async () => {
    renderComponent();
    expect(screen.getByText("Create Draft")).toBeInTheDocument();
    const measureName = (await screen.findByRole("textbox", {
      name: "Measure Name",
    })) as HTMLInputElement;

    userEvent.type(measureName, "A_");
    await waitFor(() => {
      expect(screen.getByTestId("measureName-helper-text")).toHaveTextContent(
        "Measure Name must not contain '_' (underscores)."
      );
    });
  });

  it("should display a model version option for QI-Core measures", async () => {
    renderComponent();
    const measureName = (await screen.findByRole("textbox", {
      name: "Measure Name",
    })) as HTMLInputElement;
    expect(measureName.value).toEqual(measure.measureName);
    expect(await screen.findByText("Create Draft")).toBeInTheDocument();
    expect(await screen.findByText("Update Model Version")).toBeInTheDocument();
    expect(await screen.findByText("QI-Core v4.1.1")).toBeInTheDocument();

    expect(screen.getByTestId("create-draft-continue-button")).toBeEnabled();
  });

  it("should have multiple model version options for QI-Core measures", async () => {
    renderComponent();
    const measureName = (await screen.findByRole("textbox", {
      name: "Measure Name",
    })) as HTMLInputElement;
    expect(measureName.value).toEqual(measure.measureName);
    expect(await screen.findByText("Create Draft")).toBeInTheDocument();
    expect(await screen.findByText("Update Model Version")).toBeInTheDocument();

    const modelInput = screen.getByTestId(
      "measure-model-input"
    ) as HTMLInputElement;
    expect(modelInput.value).toBe("QI-Core v4.1.1");

    const modelSelect = screen.getByTestId("measure-model-select");
    const modelSelectDropdown = within(modelSelect).getByRole(
      "button"
    ) as HTMLInputElement;
    userEvent.click(modelSelectDropdown);

    fireEvent.change(modelInput, {
      target: { value: "QI-Core v6.0.0" },
    });

    expect(modelInput.value).toBe("QI-Core v6.0.0");

    expect(screen.getByTestId("create-draft-continue-button")).toBeEnabled();
  });

  it("should not display a model version option for QDM measures", async () => {
    const qdmMeasure = Object.assign({}, measure);
    qdmMeasure.model = Model.QDM_5_6;
    render(
      <DraftMeasureDialog
        open={true}
        onClose={onCloseFn}
        onSubmit={onSubmitFn}
        measure={qdmMeasure}
      />
    );
    expect(await screen.findByText("Create Draft")).toBeInTheDocument();
    const measureName = (await screen.findByRole("textbox", {
      name: "Measure Name",
    })) as HTMLInputElement;
    expect(measureName.value).toEqual(measure.measureName);
    expect(screen.queryByText("Update Model Version")).not.toBeInTheDocument();

    expect(screen.getByTestId("create-draft-continue-button")).toBeEnabled();
  });

  it("should call model close handler on clicking cancel button", async () => {
    renderComponent();
    userEvent.click(screen.getByText(/Cancel/i));
    expect(onCloseFn).toHaveBeenCalled();
  });

  it("should call onSubmit handler on clicking continue button", async () => {
    renderComponent();
    userEvent.click(screen.getByText(/Continue/i));
    await waitFor(() => {
      expect(onSubmitFn).toHaveBeenCalled();
    });
  });
});
