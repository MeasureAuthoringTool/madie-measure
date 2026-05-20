import * as React from "react";
import "@testing-library/jest-dom";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import { Simulate } from "react-dom/test-utils";
import userEvent from "@testing-library/user-event";
import CreateNewTestCaseDialog from "./CreateNewTestCaseDialog";
import { Measure } from "@madie/madie-models";
import axios from "../../../../../api/axios-instance";
import { specialChars } from "../../util/checkSpecialCharacters";
import { MemoryRouter } from "react-router-dom";

jest.mock("../../../../../api/axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const MEASURE_CREATEDBY = "testuser";
jest.mock("@madie/madie-util", () => ({
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
  }),
  measureStore: {
    updateMeasure: jest.fn((measure) => measure),
    state: null,
    initialState: null,
    subscribe: (set) => {
      set({} as Measure);
      return { unsubscribe: () => null };
    },
    unsubscribe: () => null,
  },
}));

const formikInfo = {
  title: "test case 1",
  description: "test case description",
  series: "test case series",
};

describe("Create New Test Case Dialog", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockMeasure = { ...formikInfo, id: "test-id" };
  const mockOnSuccess = jest.fn();
  test("should render all the fields in the test case creation form", async () => {
    const { findByTestId } = render(
      <MemoryRouter
        initialEntries={[
          `/measures/${mockMeasure.id}/edit/test-cases/list-page`,
        ]}
      >
        <CreateNewTestCaseDialog
          open={true}
          onClose={undefined}
          onSuccess={mockOnSuccess}
        />
      </MemoryRouter>
    );

    expect(await findByTestId("create-test-case-title")).toBeInTheDocument();
    expect(
      await findByTestId("create-test-case-description")
    ).toBeInTheDocument();
    expect(await findByTestId("test-case-series")).toBeInTheDocument();

    const cancelButton = await findByTestId("create-test-case-cancel-button");
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toBeEnabled();

    const saveButton = await findByTestId("create-test-case-save-button");
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
  });

  test("Save button should not be enabled when required field is empty", async () => {
    const mockOnSuccess = jest.fn();
    const { getByTestId } = render(
      <MemoryRouter
        initialEntries={[
          `/measures/${mockMeasure.id}/edit/test-cases/list-page`,
        ]}
      >
        <CreateNewTestCaseDialog
          open={true}
          onClose={undefined}
          onSuccess={mockOnSuccess}
        />
      </MemoryRouter>
    );

    const titleInput = getByTestId(
      "create-test-case-title-input"
    ) as HTMLInputElement;
    userEvent.type(titleInput, "");
    expect(titleInput.value).toBe("");
    Simulate.change(titleInput);

    const descriptonInput = getByTestId(
      "create-test-case-description"
    ) as HTMLInputElement;
    userEvent.type(descriptonInput, "");
    expect(descriptonInput.value).toBe("");
    Simulate.change(titleInput);

    expect(getByTestId("create-test-case-save-button")).toBeDisabled();
  });

  test("should save test case inputs as expected", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        id: "testID",
        createdBy: MEASURE_CREATEDBY,
        description: formikInfo.description,
        title: formikInfo.title,
        series: formikInfo.series,
      },
    });
    const measure: Measure = {
      model: "QDM",
    } as unknown as Measure;
    const mockOnSuccess = jest.fn();
    const { getByRole, getByTestId, getByText, queryByTestId } = render(
      <MemoryRouter
        initialEntries={[
          `/measures/${mockMeasure.id}/edit/test-cases/list-page`,
        ]}
      >
        <CreateNewTestCaseDialog
          open={true}
          onClose={jest.fn()}
          onSuccess={mockOnSuccess}
          measure={measure}
        />
      </MemoryRouter>
    );

    const titleInput = getByTestId(
      "create-test-case-title-input"
    ) as HTMLInputElement;
    userEvent.type(titleInput, formikInfo.title);
    expect(titleInput.value).toBe(formikInfo.title);
    Simulate.change(titleInput);

    const descriptionInput = getByTestId(
      "create-test-case-description"
    ) as HTMLInputElement;
    userEvent.type(descriptionInput, formikInfo.description);
    expect(descriptionInput.value).toBe(formikInfo.description);
    Simulate.change(descriptionInput);

    const seriesInput = getByRole("combobox");
    userEvent.type(seriesInput, formikInfo.series);
    const seriesOption = getByText('Add "test case series"');
    expect(getByTestId('Add "test case series"-aa-option')).toBeInTheDocument();
    expect(seriesOption).toBeInTheDocument();
    userEvent.click(seriesOption);
    await waitFor(() => {
      expect(seriesInput).toHaveValue(formikInfo.series);
    });

    const saveButton = getByTestId("create-test-case-save-button");
    expect(saveButton).not.toBeDisabled();
    userEvent.click(saveButton);
    await waitFor(() => {
      expect(queryByTestId("server-error-alerts")).not.toBeVisible();
    });
  }, 16000);

  test("should render errors when saving test case inputs failed", async () => {
    mockedAxios.post.mockRejectedValue({
      data: {
        error: { message: "server error" },
      },
    });
    const mockOnSuccess = jest.fn();

    const { getByRole, getByTestId, getByText, queryByTestId } = render(
      <MemoryRouter
        initialEntries={[
          `/measures/${mockMeasure.id}/edit/test-cases/list-page`,
        ]}
      >
        <CreateNewTestCaseDialog
          open={true}
          onClose={jest.fn()}
          onSuccess={mockOnSuccess}
        />
      </MemoryRouter>
    );

    const titleInput = getByTestId(
      "create-test-case-title-input"
    ) as HTMLInputElement;
    userEvent.type(titleInput, formikInfo.title);
    expect(titleInput.value).toBe(formikInfo.title);
    Simulate.change(titleInput);

    const descriptionInput = getByTestId(
      "create-test-case-description"
    ) as HTMLInputElement;
    userEvent.type(descriptionInput, formikInfo.description);
    expect(descriptionInput.value).toBe(formikInfo.description);
    Simulate.change(descriptionInput);

    const seriesInput = getByRole("combobox");
    userEvent.type(seriesInput, formikInfo.series);
    const seriesOption = getByText('Add "test case series"');
    expect(getByTestId('Add "test case series"-aa-option')).toBeInTheDocument();
    expect(seriesOption).toBeInTheDocument();
    userEvent.click(seriesOption);
    await waitFor(() => {
      expect(seriesInput).toHaveValue(formikInfo.series);
    });

    const saveButton = getByTestId("create-test-case-save-button");
    expect(saveButton).not.toBeDisabled();
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.findByTestId("server-error-alerts")).toBeTruthy();
      expect(
        screen.findByText(
          "An error occurred while creating the test case: Unable to create new test case"
        )
      ).toBeTruthy();
      const closeErrorButton = screen.findByTestId("close-error-button");
      expect(closeErrorButton).toBeTruthy();
    });
    const closeErrorButton = getByTestId("close-error-button");
    fireEvent.click(closeErrorButton);
    await waitFor(() => {
      expect(queryByTestId("server-error-alerts")).not.toBeVisible();
    });
  });

  test("should not save test case as input has special characters for QDM measure", async () => {
    const measure: Measure = {
      model: "QDM v5.6",
    } as unknown as Measure;
    const mockOnSuccess = jest.fn();
    const { getByRole, getByTestId, getByText, queryByTestId } = render(
      <MemoryRouter
        initialEntries={[
          `/measures/${mockMeasure.id}/edit/test-cases/list-page`,
        ]}
      >
        <CreateNewTestCaseDialog
          open={true}
          onClose={jest.fn()}
          onSuccess={mockOnSuccess}
        />
      </MemoryRouter>
    );

    const titleInput = getByTestId(
      "create-test-case-title-input"
    ) as HTMLInputElement;
    userEvent.type(titleInput, formikInfo.title);
    expect(titleInput.value).toBe(formikInfo.title);
    fireEvent.change(titleInput, {
      target: { value: "invalid title ~!@#$" },
    });

    const descriptionInput = getByTestId(
      "create-test-case-description"
    ) as HTMLInputElement;
    userEvent.type(descriptionInput, formikInfo.description);
    expect(descriptionInput.value).toBe(formikInfo.description);
    Simulate.change(descriptionInput);

    const seriesInput = getByRole("combobox");
    userEvent.type(seriesInput, formikInfo.series);
    const seriesOption = getByText('Add "test case series"');
    expect(getByTestId('Add "test case series"-aa-option')).toBeInTheDocument();
    expect(seriesOption).toBeInTheDocument();
    userEvent.click(seriesOption);
    await waitFor(() => {
      expect(seriesInput).toHaveValue(formikInfo.series);
    });

    const saveButton = getByTestId("create-test-case-save-button");
    expect(saveButton).not.toBeDisabled();
    fireEvent.click(saveButton);
    await waitFor(() => {
      const serverErrorAlert = queryByTestId("server-error-alerts");
      expect(serverErrorAlert).toBeVisible();
      expect(serverErrorAlert).toHaveTextContent(
        "Test Case Title can not contain special characters: " + specialChars
      );
    });
  }, 16000);

  it("should handle custom series by clicking 'Add \"...\"'", async () => {
    const measure: Measure = {
      model: "QDM",
    } as unknown as Measure;
    const mockOnSuccess = jest.fn();
    const { getByRole, getByTestId, getByText, queryByTestId } = render(
      <MemoryRouter
        initialEntries={[
          `/measures/${mockMeasure.id}/edit/test-cases/list-page`,
        ]}
      >
        <CreateNewTestCaseDialog
          open={true}
          onClose={jest.fn()}
          onSuccess={mockOnSuccess}
        />
      </MemoryRouter>
    );

    const titleInput = getByTestId(
      "create-test-case-title-input"
    ) as HTMLInputElement;
    userEvent.type(titleInput, formikInfo.title);
    expect(titleInput.value).toBe(formikInfo.title);
    Simulate.change(titleInput);

    const descriptionInput = getByTestId(
      "create-test-case-description"
    ) as HTMLInputElement;
    userEvent.type(descriptionInput, formikInfo.description);
    expect(descriptionInput.value).toBe(formikInfo.description);
    Simulate.change(descriptionInput);

    const seriesInput = getByRole("combobox");
    userEvent.type(seriesInput, "test case series");
    const addOption = await screen.findByText('Add "test case series"');
    expect(addOption).toBeInTheDocument();
    userEvent.click(addOption);
    await waitFor(() => {
      expect(seriesInput).toHaveValue("test case series");
    });

    const saveButton = getByTestId("create-test-case-save-button");
    expect(saveButton).not.toBeDisabled();
    userEvent.click(saveButton);
    await waitFor(() => {
      expect(queryByTestId("server-error-alerts")).not.toBeVisible();
    });
  }, 16000);

  it("should render title with 'Composite' when isComposite prop is true", async () => {
    const measure: Measure = {
      model: "QDM",
      measureMetaData: {
        composite: true,
      },
    } as unknown as Measure;
    const { findByText } = render(
      <MemoryRouter
        initialEntries={[
          `/measures/${mockMeasure.id}/edit/test-cases/list-page`,
        ]}
      >
        <CreateNewTestCaseDialog
          open={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          measure={measure}
        />
      </MemoryRouter>
    );

    const titleElement = await findByText("Create Composite Test Case");
    expect(titleElement).toBeInTheDocument();
  });

  test("defaults json with a QI-Core Patient bundle when creating a QI-Core test case", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        id: "testID",
        createdBy: MEASURE_CREATEDBY,
        description: formikInfo.description,
        title: formikInfo.title,
        series: formikInfo.series,
      },
    });
    const measure: Measure = {
      model: "QI-Core v4.1.1",
    } as unknown as Measure;
    const { getByRole, getByTestId, getByText } = render(
      <MemoryRouter
        initialEntries={[
          `/measures/${mockMeasure.id}/edit/test-cases/list-page`,
        ]}
      >
        <CreateNewTestCaseDialog
          open={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
          measure={measure}
        />
      </MemoryRouter>
    );

    const titleInput = getByTestId(
      "create-test-case-title-input"
    ) as HTMLInputElement;
    userEvent.type(titleInput, formikInfo.title);
    Simulate.change(titleInput);

    const descriptionInput = getByTestId(
      "create-test-case-description"
    ) as HTMLInputElement;
    userEvent.type(descriptionInput, formikInfo.description);
    Simulate.change(descriptionInput);

    const seriesInput = getByRole("combobox");
    userEvent.type(seriesInput, formikInfo.series);
    const seriesOption = getByText('Add "test case series"');
    userEvent.click(seriesOption);
    await waitFor(() => {
      expect(seriesInput).toHaveValue(formikInfo.series);
    });

    const saveButton = getByTestId("create-test-case-save-button");
    userEvent.click(saveButton);

    await waitFor(() => {
      const postCall = mockedAxios.post.mock.calls.find(([url]) =>
        String(url).includes("/test-cases")
      );
      expect(postCall).toBeDefined();
      const submittedTestCase = postCall![1] as any;
      expect(submittedTestCase.json).toBeTruthy();
      const bundle = JSON.parse(submittedTestCase.json);
      expect(bundle.resourceType).toBe("Bundle");
      expect(bundle.type).toBe("collection");
      expect(bundle.entry).toHaveLength(1);
      expect(bundle.entry[0].resource.resourceType).toBe("Patient");
      expect(bundle.entry[0].resource.meta.profile).toEqual([
        "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-patient",
      ]);
      expect(bundle.entry[0].fullUrl).toBe(
        `https://madie.cms.gov/Patient/${bundle.entry[0].resource.id}`
      );
    });
  }, 16000);
});
