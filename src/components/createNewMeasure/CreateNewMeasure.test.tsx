import * as React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { CreateNewMeasure } from "./CreateNewMeasure";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { CreateNewMeasureModel } from "../../models/CreateNewMeasureModel";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockPush = jest.fn();
jest.mock("react-router-dom", () => ({
  useHistory: () => {
    const push = () => mockPush("/example");
    return { push };
  },
}));

jest.mock("../config/Config", () => ({
  getServiceConfig: () => ({
    measureService: {
      baseUrl: "exmaple-service-url",
    },
  }),
}));

describe("Home component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should generate field level error for required measure name", async () => {
    const { getByTestId } = render(<CreateNewMeasure />);
    const input = getByTestId("measure-name-text-field");
    fireEvent.blur(input);
    await waitFor(() => {
      expect(getByTestId("measureName-helper-text")).not.toBe(null);
      expect(getByTestId("measureName-helper-text")).toHaveTextContent(
        "A measure name is required."
      );
    });
  });

  it("should generate field level error for at least one alphabet in measure name", async () => {
    const { getByTestId } = render(<CreateNewMeasure />);
    const input = getByTestId("measure-name-text-field") as HTMLInputElement;
    fireEvent.blur(input);
    userEvent.type(input, "123123");
    expect(input.value).toBe("123123");
    await waitFor(() => {
      expect(getByTestId("measureName-helper-text")).not.toBe(null);
      expect(getByTestId("measureName-helper-text")).toHaveTextContent(
        "A measure name must contain at least one letter."
      );
    });
  });

  it("should generate field level error for underscore in measure name", async () => {
    const { getByTestId } = render(<CreateNewMeasure />);
    const input = getByTestId("measure-name-text-field") as HTMLInputElement;
    fireEvent.blur(input);
    userEvent.type(input, "testing_measureName12");
    expect(input.value).toBe("testing_measureName12");
    await waitFor(() => {
      expect(getByTestId("measureName-helper-text")).not.toBe(null);
      expect(getByTestId("measureName-helper-text")).toHaveTextContent(
        "Measure Name must not contain '_' (underscores)."
      );
    });
  });

  it("should successfully retrieve service config and save measure, then navigate to measure list display", async () => {
    const measure: CreateNewMeasureModel = {
      measureName: "Example Measure name",
    };

    const { getByTestId } = render(<CreateNewMeasure />);
    const input = getByTestId("measure-name-text-field") as HTMLInputElement;

    fireEvent.blur(input);
    userEvent.type(input, "Example Measure name");

    expect(input.value).toBe("Example Measure name");

    fireEvent.click(getByTestId("create-new-measure-save-button"));

    mockedAxios.post.mockResolvedValue({ data: {} });
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "exmaple-service-url/measure",
        measure
      );
    });
  });

  it("should handle post service call error", async () => {
    const measure: CreateNewMeasureModel = {
      measureName: "Example Measure name",
    };

    const { getByTestId } = render(<CreateNewMeasure />);
    const input = getByTestId("measure-name-text-field") as HTMLInputElement;

    fireEvent.blur(input);
    userEvent.type(input, "Example Measure name");
    fireEvent.click(getByTestId("create-new-measure-save-button"));

    mockedAxios.post.mockRejectedValue({ data: {} });
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "exmaple-service-url/measure",
        measure
      );
    });
  });

  it("should navigate to measure home page on cancel", async () => {
    const { getByTestId } = render(<CreateNewMeasure />);

    fireEvent.click(getByTestId("create-new-measure-cancel-button"));
    expect(mockPush).toHaveBeenCalledWith("/example");
  });
});
