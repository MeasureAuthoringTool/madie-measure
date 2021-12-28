import * as React from "react";
import {
  render,
  fireEvent,
  waitFor,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { CreateNewMeasure } from "./CreateNewMeasure";
import userEvent from "@testing-library/user-event";
import axios from "axios";

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

  it("should render the model field", () => {
    render(<CreateNewMeasure />);
    const modelDropdown = screen.getByRole("button", {
      name: /select a model/i,
    });
    expect(modelDropdown).toBeInTheDocument();
    const selectModelLabels = screen.getAllByText("Select a model");
    expect(selectModelLabels.length).toEqual(2);
  });

  it("should render the model options when clicked", async () => {
    render(<CreateNewMeasure />);
    const modelDropdown = screen.getByRole("button", {
      name: /select a model/i,
    });
    userEvent.click(modelDropdown);
    const noneOption = await screen.findByText("None");
    expect(noneOption).toBeInTheDocument();
    const qiCoreOption = screen.getByText("QI-Core");
    expect(qiCoreOption).toBeInTheDocument();
  });

  it("should update the dropdown with the selected option", async () => {
    render(<CreateNewMeasure />);
    const modelDropdown = screen.getByRole("button", {
      name: /select a model/i,
    });
    userEvent.click(modelDropdown);
    const qiCoreOption = screen.getByText("QI-Core");
    expect(qiCoreOption).toBeInTheDocument();
    userEvent.click(qiCoreOption);
    await waitForElementToBeRemoved(() => screen.queryByText("None"));
    const qiCore = await screen.findByText("QI-Core");
    expect(qiCore).toBeInTheDocument();
    const qiCoreButton = screen.getByRole("button", { name: /qi-core/i });
    expect(qiCoreButton).toBeInTheDocument();
  });

  // it.skip("should create new measure, then navigate to measure list display", async () => {
  //   const measure = {
  //     measureName: "Example Measure name",
  //     cqlLibraryName: "TestLib",
  //     model: "QI-Core",
  //   } as Measure;
  //
  //   const { container, getByTestId } = render(<CreateNewMeasure />);
  //   const measureName = getByTestId(
  //     "measure-name-text-field"
  //   ) as HTMLInputElement;
  //
  //   fireEvent.blur(measureName);
  //   userEvent.type(measureName, "Example Measure name");
  //   expect(measureName.value).toBe("Example Measure name");
  //
  //   const modelDropdown = screen.getByRole("button", {
  //     name: /select a model/i,
  //   });
  //   userEvent.click(modelDropdown);
  //   const option = await screen.findByText("QI-Core");
  //   userEvent.click(option);
  //   await waitForElementToBeRemoved(() => screen.queryByText("None"));
  //   const qiCore = await screen.findByText("QI-Core");
  //   expect(qiCore).toBeInTheDocument();
  //   const cqlLibraryName = getByTestId("cql-library-name") as HTMLInputElement;
  //   fireEvent.change(cqlLibraryName, {
  //     target: { value: "TestLib" },
  //   });
  //
  //   logRoles(container);
  //   const createButton = await screen.findByRole("button", {
  //     name: "Create Measure",
  //   });
  //
  //   screen.debug();
  //
  //   await waitFor(() => expect(createButton).not.toBeDisabled(), {
  //     timeout: 5000,
  //   });
  //
  //   fireEvent.click(getByTestId("create-new-measure-save-button"));
  //
  //   mockedAxios.post.mockResolvedValue({ data: {} });
  //   await waitFor(() => {
  //     expect(mockedAxios.post).toHaveBeenCalledWith(
  //       "exmaple-service-url/measure",
  //       measure
  //     );
  //   });
  // });

  it("should handle post service call error", async () => {
    const { getByTestId } = render(<CreateNewMeasure />);
    // const measureName = getByTestId(
    //   "measure-name-text-field"
    // ) as HTMLInputElement;

    const measureNameInput = await screen.findByRole("textbox", {
      name: "Measure Name",
    });
    // fireEvent.blur(measureName);
    userEvent.type(measureNameInput, "Example Measure name");
    await waitFor(() => {
      expect(measureNameInput).toHaveValue("Example Measure name");
    });
    // expect(measureNameInput).toHaveTextContent("Example Measure name");

    // await act(async () => {
    const modelDropdown = screen.getByRole("button", {
      name: /select a model/i,
    });
    userEvent.click(modelDropdown);
    const qiCoreOption = await screen.findByText("QI-Core");
    userEvent.click(qiCoreOption);
    await waitForElementToBeRemoved(() => screen.queryByText("None"));
    // const qiCoreButton = screen.getByRole("button", {name: /qi-core/i});
    // expect(qiCoreButton).toBeInTheDocument();
    // });
    const cqlLibraryNameInput = screen.getByRole("textbox", {
      name: "Measure CQL Library Name",
    });
    // const cqlLibraryName = getByTestId("cql-library-name") as HTMLInputElement;
    // fireEvent.change(cqlLibraryName, {
    //   target: {value: "TestLib"},
    // });
    userEvent.type(cqlLibraryNameInput, "TestLib");
    await waitFor(() => expect(cqlLibraryNameInput).toHaveValue("TestLib"));

    const debugButton = screen.getByRole("button", { name: "debug" });
    userEvent.click(debugButton);

    const createMeasureButton = screen.getByRole("button", {
      name: "Create Measure",
    });

    await waitFor(() => expect(createMeasureButton).toBeEnabled(), {
      timeout: 3000,
    });

    userEvent.click(createMeasureButton);

    const error = { response: { data: { message: "some error" } } };
    mockedAxios.post.mockRejectedValue(error);
    await waitFor(() => {
      const errors = getByTestId("server-error-alerts");
      expect(errors.textContent).toEqual(error.response.data.message);
    });
    // });
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
