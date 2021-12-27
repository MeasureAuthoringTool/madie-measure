import * as React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { CreateNewMeasure } from "./CreateNewMeasure";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import Measure from "../../models/Measure";

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

  it("should creates new measure, then navigate to measure list display", async () => {
    const measure = {
      measureName: "Example Measure name",
      cqlLibraryName: "TestLib",
    } as Measure;

    const { getByTestId } = render(<CreateNewMeasure />);
    const measureName = getByTestId(
      "measure-name-text-field"
    ) as HTMLInputElement;

    fireEvent.blur(measureName);
    userEvent.type(measureName, "Example Measure name");
    expect(measureName.value).toBe("Example Measure name");
    const cqlLibraryName = getByTestId("cql-library-name") as HTMLInputElement;
    fireEvent.change(cqlLibraryName, {
      target: { value: "TestLib" },
    });

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
    const { getByTestId } = render(<CreateNewMeasure />);
    const measureName = getByTestId(
      "measure-name-text-field"
    ) as HTMLInputElement;

    fireEvent.blur(measureName);
    userEvent.type(measureName, "Example Measure name");
    const cqlLibraryName = getByTestId("cql-library-name") as HTMLInputElement;
    fireEvent.change(cqlLibraryName, {
      target: { value: "TestLib" },
    });

    fireEvent.click(getByTestId("create-new-measure-save-button"));
    const error = { response: { data: { message: "some error" } } };
    mockedAxios.post.mockRejectedValue(error);
    await waitFor(() => {
      const errors = getByTestId("server-error-alerts");
      expect(errors.textContent).toEqual(error.response.data.message);
    });
  });

  it("should navigate to measure home page on cancel", async () => {
    const { getByTestId } = render(<CreateNewMeasure />);

    fireEvent.click(getByTestId("create-new-measure-cancel-button"));
    expect(mockPush).toHaveBeenCalledWith("/example");
  });

  it("should validate required library name constraints", async () => {
    const { getByTestId } = render(<CreateNewMeasure />);
    const cqlLibraryName = getByTestId("cql-library-name") as HTMLInputElement;
    // required constraints
    fireEvent.blur(cqlLibraryName);
    await waitFor(() => {
      expect(getByTestId("cqlLibraryName-helper-text")).toHaveTextContent(
        "Measure library name is required."
      );
    });
  });

  it("should validate no underscore constraint on library name", async () => {
    const { getByTestId } = render(<CreateNewMeasure />);
    const cqlLibraryName = getByTestId("cql-library-name") as HTMLInputElement;
    // No underscore constraints
    fireEvent.blur(cqlLibraryName);
    userEvent.type(cqlLibraryName, "Te_st");
    await waitFor(() => {
      expect(getByTestId("cqlLibraryName-helper-text")).toHaveTextContent(
        "Measure library name must not contain '_' (underscores)."
      );
    });
  });

  it("should validate library name starts with upper case letter constraints", async () => {
    const { getByTestId } = render(<CreateNewMeasure />);
    const cqlLibraryName = getByTestId("cql-library-name") as HTMLInputElement;
    // Name start with Upper case Letter constraints
    fireEvent.blur(cqlLibraryName);
    userEvent.type(cqlLibraryName, "test");
    await waitFor(() => {
      expect(getByTestId("cqlLibraryName-helper-text")).toHaveTextContent(
        "Measure library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces."
      );
    });
  });

  it("should validate library name no space constraints", async () => {
    const { getByTestId } = render(<CreateNewMeasure />);
    const cqlLibraryName = getByTestId("cql-library-name") as HTMLInputElement;
    // No space constraints
    fireEvent.blur(cqlLibraryName);
    userEvent.type(cqlLibraryName, "Test Lib");
    await waitFor(() => {
      expect(getByTestId("cqlLibraryName-helper-text")).toHaveTextContent(
        "Measure library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces."
      );
    });
  });
});
