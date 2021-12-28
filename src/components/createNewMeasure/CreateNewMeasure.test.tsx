import * as React from "react";
import {
  render,
  fireEvent,
  waitFor,
  screen,
  waitForElementToBeRemoved,
  within,
  logRoles,
} from "@testing-library/react";
import { CreateNewMeasure } from "./CreateNewMeasure";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import Measure from "../../models/Measure";
import { Model } from "../../models/Model";

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
      baseUrl: "example-service-url",
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

  it("should render the measure Scoring field", () => {
    render(<CreateNewMeasure />);
    const scoringDropdown = screen.getByRole("button", {
      name: /measure scoring/i,
    });
    expect(scoringDropdown).toBeInTheDocument();
    const selectLabels = screen.getAllByText("Measure Scoring");
    expect(selectLabels.length).toEqual(2);
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

  it("should render the scoring options when clicked", async () => {
    render(<CreateNewMeasure />);
    const scoringDropdown = screen.getByRole("button", {
      name: /measure scoring/i,
    });
    userEvent.click(scoringDropdown);

    const cohortOption = screen.getByText("Cohort");
    expect(cohortOption).toBeInTheDocument();
  });

  it("should have model options of Model enum types plus None", async () => {
    render(<CreateNewMeasure />);
    const modelDropdown = screen.getByRole("button", {
      name: /select a model/i,
    });
    userEvent.click(modelDropdown);
    const modelOptionsList = await screen.findByRole("listbox", {
      name: /select a model/i,
    });
    const options = within(modelOptionsList).getAllByRole("option");
    expect(options.length).toBe(Object.values(Model).length + 1);
    const optionTexts = options.map((option) => option.textContent);
    expect(optionTexts).toEqual(["None", ...Object.values(Model)]);
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

  it("should create new measure, then navigate to measure list display", async () => {
    const measure = {
      measureName: "Example Measure name",
      cqlLibraryName: "TestLib",
      model: "QI-Core",
    } as Measure;
    render(<CreateNewMeasure />);
    const measureNameInput = await screen.findByRole("textbox", {
      name: "Measure Name",
    });
    userEvent.type(measureNameInput, measure.measureName);
    await waitFor(() => {
      expect(measureNameInput).toHaveValue(measure.measureName);
    });

    const modelDropdown = screen.getByRole("button", {
      name: /select a model/i,
    });
    userEvent.click(modelDropdown);
    const qiCoreOption = await screen.findByText(measure.model);
    userEvent.click(qiCoreOption);
    await waitForElementToBeRemoved(() => screen.queryByText("None"));
    const cqlLibraryNameInput = screen.getByRole("textbox", {
      name: "Measure CQL Library Name",
    });
    userEvent.type(cqlLibraryNameInput, measure.cqlLibraryName);
    await waitFor(() =>
      expect(cqlLibraryNameInput).toHaveValue(measure.cqlLibraryName)
    );

    const createMeasureButton = screen.getByRole("button", {
      name: "Create Measure",
    });
    await waitFor(() => expect(createMeasureButton).toBeEnabled(), {
      timeout: 3000,
    });
    userEvent.click(createMeasureButton);

    mockedAxios.post.mockResolvedValue({ data: {} });
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "example-service-url/measure",
        measure
      );
    });
  });

  it("should handle post service call error", async () => {
    const { getByTestId } = render(<CreateNewMeasure />);
    const measureNameInput = await screen.findByRole("textbox", {
      name: "Measure Name",
    });
    userEvent.type(measureNameInput, "Example Measure name");
    await waitFor(() => {
      expect(measureNameInput).toHaveValue("Example Measure name");
    });

    const modelDropdown = screen.getByRole("button", {
      name: /select a model/i,
    });
    userEvent.click(modelDropdown);
    const qiCoreOption = await screen.findByText("QI-Core");
    userEvent.click(qiCoreOption);
    await waitForElementToBeRemoved(() => screen.queryByText("None"));
    const cqlLibraryNameInput = screen.getByRole("textbox", {
      name: "Measure CQL Library Name",
    });
    userEvent.type(cqlLibraryNameInput, "TestLib");
    await waitFor(() => expect(cqlLibraryNameInput).toHaveValue("TestLib"));

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
