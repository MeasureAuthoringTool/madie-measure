import * as React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeasureServiceApi } from "@madie/madie-util";
import { Measure } from "@madie/madie-models";
import AuthoritativeSource from "./AuthoritativeSource";

const measure = {
  id: "measure ID",
  measureName: "measureName",
  createdBy: "testuser",
  model: "QI-Core v4.1.1",
  measureMetaData: {
    authoritativeSource: "https://www.test.in",
  },
} as Measure;

let mockMeasureServiceApi = {
  updateMeasure: jest.fn().mockResolvedValue({ status: 200, data: measure }),
} as unknown as MeasureServiceApi;

const mockUpdateMeasure = jest.fn((measure) => measure);

jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
  useDocumentTitle: jest.fn(),
  useOktaTokens: jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  })),
  measureStore: {
    updateMeasure: (measure) => mockUpdateMeasure(measure),
    state: jest.fn().mockImplementation(() => measure),
    initialState: jest.fn().mockImplementation(() => measure),
    subscribe: () => {
      return { unsubscribe: () => null };
    },
  },
  routeHandlerStore: {
    subscribe: () => {
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: jest.fn((routeObj) => routeObj),
    state: { canTravel: false, pendingPath: "" },
    initialState: { canTravel: false, pendingPath: "" },
  },
}));

const setErrorMessage = jest.fn();
const { getByTestId, findByTestId, queryByTestId } = screen;

describe("Authoritative Source page", () => {
  afterEach(() => jest.clearAllMocks());

  const renderComponent = (measureCanEdit = true) =>
    render(
      <AuthoritativeSource
        setErrorMessage={setErrorMessage}
        measureCanEdit={measureCanEdit}
      />
    );

  it("should render a single text field pre-populated with the saved value", () => {
    renderComponent();

    expect(getByTestId("measure-authoritative-source")).toBeInTheDocument();
    const input = getByTestId("authoritative-source-input") as HTMLInputElement;
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(input.value).toBe("https://www.test.in");
  });

  it("should disable Save and Discard Changes until the value changes", async () => {
    renderComponent();

    expect(getByTestId("authoritative-source-save")).toBeDisabled();
    expect(getByTestId("discard-button")).toBeDisabled();

    userEvent.clear(getByTestId("authoritative-source-input"));
    userEvent.type(
      getByTestId("authoritative-source-input"),
      "https://www.test.org"
    );

    await waitFor(() => {
      expect(getByTestId("authoritative-source-save")).toBeEnabled();
      expect(getByTestId("discard-button")).toBeEnabled();
    });
  });

  it("should not render the form actions when the user cannot edit", () => {
    renderComponent(false);

    expect(queryByTestId("authoritative-source-save")).toBeNull();
    expect(queryByTestId("discard-button")).toBeNull();
  });

  it("should save a valid URI and display a success toast", async () => {
    renderComponent();

    const input = getByTestId("authoritative-source-input");
    userEvent.clear(input);
    userEvent.type(input, "https://www.test.org");
    await waitFor(() =>
      expect(getByTestId("authoritative-source-save")).toBeEnabled()
    );
    userEvent.click(getByTestId("authoritative-source-save"));

    await waitFor(() =>
      expect(mockMeasureServiceApi.updateMeasure).toHaveBeenCalledWith(
        expect.objectContaining({
          measureMetaData: expect.objectContaining({
            authoritativeSource: "https://www.test.org",
          }),
        })
      )
    );
    expect(
      await findByTestId("measureAuthoritativeSourceSuccess")
    ).toHaveTextContent("Measure Authoritative Source Saved Successfully");
    expect(mockUpdateMeasure).toHaveBeenCalledWith(measure);
  });

  it("should not save and should show 'Must be a URI value' when the value is not a URI", async () => {
    renderComponent();

    const input = getByTestId("authoritative-source-input");
    userEvent.clear(input);
    userEvent.type(input, "www.test.in");
    await waitFor(() =>
      expect(getByTestId("authoritative-source-save")).toBeEnabled()
    );
    userEvent.click(getByTestId("authoritative-source-save"));

    expect(await screen.findByText("Must be a URI value")).toBeInTheDocument();
    expect(mockMeasureServiceApi.updateMeasure).not.toHaveBeenCalled();
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("should revert to the saved value on discard changes", async () => {
    renderComponent();

    const input = getByTestId("authoritative-source-input") as HTMLInputElement;
    userEvent.clear(input);
    userEvent.type(input, "https://www.test.org");
    await waitFor(() => expect(input.value).toBe("https://www.test.org"));

    userEvent.click(getByTestId("discard-button"));
    const continueButton = await screen.findByRole("button", {
      name: "Yes, Discard All Changes",
    });
    userEvent.click(continueButton);

    await waitFor(() => expect(input.value).toBe("https://www.test.in"));
    expect(mockMeasureServiceApi.updateMeasure).not.toHaveBeenCalled();
  });

  it("should report an error when the measure cannot be saved", async () => {
    mockMeasureServiceApi.updateMeasure = jest
      .fn()
      .mockRejectedValue({ status: 500 });
    renderComponent();

    const input = getByTestId("authoritative-source-input");
    userEvent.clear(input);
    userEvent.type(input, "https://www.test.org");
    await waitFor(() =>
      expect(getByTestId("authoritative-source-save")).toBeEnabled()
    );
    userEvent.click(getByTestId("authoritative-source-save"));

    await waitFor(() =>
      expect(setErrorMessage).toHaveBeenCalledWith(
        'Error updating Authoritative Source for "measureName"'
      )
    );
    expect(
      await findByTestId("measureAuthoritativeSourceError")
    ).toBeInTheDocument();
  });

  it("should show the locked-by message when the measure is locked", async () => {
    mockMeasureServiceApi.updateMeasure = jest.fn().mockRejectedValue({
      status: 423,
      response: {
        data: {
          message: "Unable to update measure. Measure is locked by other.user",
        },
      },
    });
    renderComponent();

    const input = getByTestId("authoritative-source-input");
    userEvent.clear(input);
    userEvent.type(input, "https://www.test.org");
    await waitFor(() =>
      expect(getByTestId("authoritative-source-save")).toBeEnabled()
    );
    userEvent.click(getByTestId("authoritative-source-save"));

    await waitFor(() =>
      expect(mockUpdateMeasure).toHaveBeenCalledWith(
        expect.objectContaining({
          measureLock: { lockedBy: "other.user" },
        })
      )
    );
  });
});
