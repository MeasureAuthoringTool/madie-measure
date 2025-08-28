import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required
import * as React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import {
  createMemoryRouter,
  RouterProvider,
  MemoryRouter,
} from "react-router-dom";
import { routesConfig } from "../measureRoutes/MeasureRoutes";
import { MeasureServiceApi } from "../../api/useMeasureServiceApi";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import userEvent from "@testing-library/user-event";
import { oneItemResponse } from "../__mocks__/mockMeasureResponses";
import { within } from "@testing-library/dom";
// @ts-ignore
import { useFeatureFlags } from "@madie/madie-util";
import MeasureLanding from "./MeasureLanding";

const serviceConfig = {
  fhirElmTranslationService: { baseUrl: "fhir/services" },
  qdmElmTranslationService: { baseUrl: "qdm/services" },
  terminologyService: { baseUrl: "example-service-url" },
  measureService: {
    baseUrl: "example-service-url",
  },
} as unknown as ServiceConfig;

const abortController = new AbortController();
const mockUser = "TestUser1";

jest.mock("@madie/madie-util", () => ({
  useDocumentTitle: jest.fn(),
  useOktaTokens: () => ({
    getUserName: () => mockUser,
  }),
  checkUserCanEdit: jest.fn(() => {
    return true;
  }),
  checkUserCanDelete: jest.fn(() => {
    return true;
  }),
  useFeatureFlags: jest.fn(),
  measureStore: {
    updateMeasure: jest.fn((measure) => measure),
    state: jest.fn().mockImplementation(() => null),
    initialState: jest.fn().mockImplementation(() => null),
    subscribe: () => {
      return { unsubscribe: () => null };
    },
  },
}));

const mockedUsedNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom") as any),
  useNavigate: () => mockedUsedNavigate,
}));

const mockMeasureServiceApi = {
  searchMeasuresByCriteria: jest.fn().mockResolvedValue(oneItemResponse),
  getMeasureCounts: jest.fn().mockResolvedValue({
    ownedMeasures: 5,
    sharedMeasures: 3,
    allMeasures: 10,
  }),
  transferMeasures: jest.fn().mockResolvedValue({
    data: true,
  }),
} as unknown as MeasureServiceApi;

jest.mock("../../api/useMeasureServiceApi", () =>
  jest.fn(() => mockMeasureServiceApi)
);

// Custom render function to test MeasureLanding component directly
// Update to wrap in MemoryRouter to provide router context for useLocation()
const renderMeasureLanding = () => {
  return render(
    <ApiContextProvider value={serviceConfig}>
      <MemoryRouter initialEntries={["/measures"]}>
        <MeasureLanding />
      </MemoryRouter>
    </ApiContextProvider>
  );
};

describe("Measure Page", () => {
  afterEach(() => {
    mockedUsedNavigate.mockReset();
    jest.clearAllMocks();
  });
  beforeEach(() => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      MeasureSearch: true,
      TransferMeasure: true,
    }));
    localStorage.clear();
  });
  const renderRouter = (initialEntries) => {
    const router = createMemoryRouter(routesConfig, {
      initialEntries: initialEntries,
    });

    render(
      <ApiContextProvider value={serviceConfig}>
        <RouterProvider router={router} />
      </ApiContextProvider>
    );
  };

  test("shows owned measures on page load", async () => {
    renderRouter(["/measures"]);
    const measure1 = await screen.findByText("TestMeasure1");
    expect(measure1).toBeInTheDocument();
    await waitFor(() => {
      expect(
        mockMeasureServiceApi.searchMeasuresByCriteria
      ).toHaveBeenCalledWith(
        ["OWNED"],
        10,
        0,
        "",
        "",
        {
          optionalSearchProperties: [],
          searchField: "",
        },
        abortController.signal
      );
    });

    const ownedMeasuresTab = screen.getByRole("tab", {
      name: "Owned Measures (5)",
    });
    const sharedMeasuresTab = screen.getByRole("tab", {
      name: "Shared Measures (3)",
    });
    const allMeasuresTab = screen.getByRole("tab", {
      name: "All Measures (10)",
    });

    expect(ownedMeasuresTab).toHaveClass("Mui-selected");
    expect(sharedMeasuresTab).not.toHaveClass("Mui-selected");
    expect(allMeasuresTab).not.toHaveClass("Mui-selected");
  });

  test("shared measure nav click triggers nav", async () => {
    renderRouter(["/measures"]);
    const measure1 = await screen.findByText("TestMeasure1");
    expect(measure1).toBeInTheDocument();
    await waitFor(() => {
      expect(
        mockMeasureServiceApi.searchMeasuresByCriteria
      ).toHaveBeenCalledWith(
        ["OWNED"],
        10,
        0,
        "",
        "",
        {
          optionalSearchProperties: [],
          searchField: "",
        },
        abortController.signal
      );
    });

    const ownedMeasuresTab = await screen.findByTestId("owned-measures-tab");
    userEvent.click(ownedMeasuresTab);
    expect(ownedMeasuresTab).toHaveClass("Mui-selected");

    const sharedMeasuresTab = await screen.findByTestId("shared-measures-tab");
    userEvent.click(sharedMeasuresTab);

    expect(mockedUsedNavigate).toHaveBeenCalledWith("?tab=1&page=1&limit=10");
    expect(ownedMeasuresTab).not.toHaveClass("Mui-selected");
    expect(sharedMeasuresTab).toHaveClass("Mui-selected");
  });

  test("all measure nav click triggers nav", async () => {
    renderRouter(["/measures"]);
    const measure1 = await screen.findByText("TestMeasure1");
    expect(measure1).toBeInTheDocument();
    await waitFor(() => {
      expect(
        mockMeasureServiceApi.searchMeasuresByCriteria
      ).toHaveBeenCalledWith(
        ["OWNED"],
        10,
        0,
        "",
        "",
        {
          optionalSearchProperties: [],
          searchField: "",
        },
        abortController.signal
      );
    });

    const ownedMeasuresTab = await screen.findByTestId("owned-measures-tab");
    userEvent.click(ownedMeasuresTab);
    expect(ownedMeasuresTab).toHaveClass("Mui-selected");

    const allMeasuresTab = await screen.findByTestId("all-measures-tab");
    userEvent.click(allMeasuresTab);

    expect(mockedUsedNavigate).toHaveBeenCalledWith("?tab=2&page=1&limit=10");
    expect(ownedMeasuresTab).not.toHaveClass("Mui-selected");
    expect(allMeasuresTab).toHaveClass("Mui-selected");
  });

  test("loading in with props for shared measures page, triggers a fetch", async () => {
    renderRouter(["/measures?tab=1&page=1&limit=10"]); // Use 1-based page in the query string

    const sharedMeasuresTab = await screen.findByTestId("shared-measures-tab");

    // Ensure the "Shared Measures" tab is selected
    await waitFor(() => {
      expect(sharedMeasuresTab).toHaveClass("Mui-selected");
    });
    await waitFor(() => {
      expect(
        mockMeasureServiceApi.searchMeasuresByCriteria
      ).toHaveBeenNthCalledWith(
        1,
        ["SHARED"],
        "10",
        0,
        "",
        "",
        {
          optionalSearchProperties: [],
          searchField: "",
        },
        expect.any(AbortSignal)
      );
    });
  });

  test("loading in with props for all measures page, triggers a fetch", async () => {
    renderRouter(["/measures?tab=2&page=1&limit=10"]); // Use 1-based page in the query string

    const allMeasuresTab = await screen.findByTestId("all-measures-tab");

    // Ensure the "All Measures" tab is selected
    await waitFor(() => {
      expect(allMeasuresTab).toHaveClass("Mui-selected");
    });
    await waitFor(() => {
      expect(
        mockMeasureServiceApi.searchMeasuresByCriteria
      ).toHaveBeenNthCalledWith(
        1,
        ["ALL"],
        "10",
        0,
        "",
        "",
        {
          optionalSearchProperties: [],
          searchField: "",
        },
        expect.any(AbortSignal)
      );
    });
  });

  test("Search measure should call search api with search criteria", async () => {
    renderRouter(["/measures"]);

    const searchField = (await screen.findByTestId(
      "measure-search-input"
    )) as HTMLInputElement;
    expect(searchField).toBeInTheDocument();

    userEvent.type(searchField, "test");
    expect(searchField).toHaveValue("test");
    fireEvent.submit(searchField);
    await waitFor(() => {
      expect(
        mockMeasureServiceApi.searchMeasuresByCriteria
      ).toHaveBeenCalledWith(
        ["OWNED"],
        10,
        0,
        "",
        "",
        { searchField: "test", optionalSearchProperties: [] },
        abortController.signal
      );
    });
  });

  test("Create event triggers the event listener", async () => {
    renderRouter(["/measures"]);
    const event = new Event("create");
    window.dispatchEvent(event);
    await waitFor(() => {
      expect(
        mockMeasureServiceApi.searchMeasuresByCriteria
      ).toHaveBeenCalledWith(
        ["OWNED"],
        10,
        0,
        "",
        "",
        {
          optionalSearchProperties: [],
          searchField: "",
        },
        abortController.signal
      );
    });
  });

  test("test pagination page button", async () => {
    renderRouter(["/measures"]);
    const pageButton = await screen.findByLabelText("page 1");
    userEvent.click(pageButton);
    expect(mockedUsedNavigate).toHaveBeenCalledWith("?tab=0&page=1&limit=10");
    const measure1 = await screen.findByText("TestMeasure1");
    expect(measure1).toBeInTheDocument();
  });

  test("test pagination page limit change", async () => {
    renderRouter(["/measures"]);

    // Ensure the initial fetch is called with the default limit
    await waitFor(() => {
      expect(
        mockMeasureServiceApi.searchMeasuresByCriteria
      ).toHaveBeenCalledWith(
        ["OWNED"],
        10,
        0,
        "",
        "",
        {
          optionalSearchProperties: [],
          searchField: "",
        },
        abortController.signal
      );
    });

    await waitFor(() => {
      const combobox = screen.getByText("10");
      expect(combobox).toBeInTheDocument();

      userEvent.click(combobox);
    });

    // Simulate changing the page limit
    const pageLimit25 = screen.getByRole("option", { name: /25/i });
    userEvent.click(pageLimit25);
    expect(mockedUsedNavigate).toHaveBeenCalledWith("?tab=0&page=1&limit=25");
  });

  it("Should display errors when fetching measures is rejected", async () => {
    (mockMeasureServiceApi.searchMeasuresByCriteria as jest.Mock)
      .mockClear()
      .mockRejectedValueOnce(new Error("Unable to fetch measures"));
    renderRouter(["/measures"]);

    const error = await screen.findByTestId("generic-error-text-header");
    expect(error).toBeInTheDocument();
    const errorText = await screen.findByText("Unable to fetch measures");
    expect(errorText).toBeInTheDocument();
  });

  it("Should not display errors when fetching measures is canceled", async () => {
    (mockMeasureServiceApi.searchMeasuresByCriteria as jest.Mock)
      .mockClear()
      .mockRejectedValueOnce(new Error("canceled"));
    renderRouter(["/measures"]);
    expect(screen.queryByTestId("generic-error-text-header")).toBeNull();
    expect(screen.queryByText("Unable to fetch measures")).toBeNull();
  });

  test("Search measure should display errors when searching measures is rejected", async () => {
    (mockMeasureServiceApi.searchMeasuresByCriteria as jest.Mock)
      .mockClear()
      .mockRejectedValueOnce(new Error("Unable to fetch measures"));
    renderRouter(["/measures"]);

    const searchField = (await screen.findByTestId(
      "measure-search-input"
    )) as HTMLInputElement;
    expect(searchField).toBeInTheDocument();

    userEvent.type(searchField, "test");
    expect(searchField).toHaveValue("test");
    fireEvent.submit(searchField);
    await waitFor(() => {
      const error = screen.getByTestId("generic-error-text-header");
      expect(error).toBeInTheDocument();
      const errorText = screen.getByText("Unable to fetch measures");
      expect(errorText).toBeInTheDocument();
    });
  });

  test("Search measure should not display errors when searching measures is canceled", async () => {
    (mockMeasureServiceApi.searchMeasuresByCriteria as jest.Mock)
      .mockClear()
      .mockRejectedValueOnce(new Error("canceled"));
    renderRouter(["/measures"]);

    const searchField = (await screen.findByTestId(
      "measure-search-input"
    )) as HTMLInputElement;
    expect(searchField).toBeInTheDocument();

    userEvent.type(searchField, "test");
    expect(searchField).toHaveValue("test");
    fireEvent.submit(searchField);

    await waitFor(() => {
      expect(screen.queryByTestId("generic-error-text-header")).toBeNull();
      expect(screen.queryByText("Unable to fetch measures")).toBeNull();
    });
  });

  test.skip("render associate cms id dialog", async () => {
    //this fails in gitactions no matter what I do, passes locally
    renderRouter(["/measures"]);
    await waitFor(() => {
      expect(
        mockMeasureServiceApi.searchMeasuresByCriteria
      ).toHaveBeenCalledWith(true, 10, 0, abortController.signal);
    });
    const combobox = await screen.findByText("10");
    expect(combobox).toBeInTheDocument();
    expect(screen.getByTestId("measure-list-tbl")).toBeInTheDocument();
    const measure1Checkbox = await within(
      await screen.findByTestId("measure-name-measureId1_select")
    ).findByRole("checkbox");
    userEvent.click(measure1Checkbox);
    const measure2Checkbox = await within(
      await screen.findByTestId("measure-name-measureId2_select")
    ).findByRole("checkbox");
    userEvent.click(measure2Checkbox);
    const associateCmsIdBtn = await screen.findByTestId(
      "associate-cms-id-action-btn"
    );
    expect(associateCmsIdBtn).toBeEnabled();
    userEvent.click(associateCmsIdBtn);
    const dialogTable = await screen.findByTestId(
      "associate-cms-id-dialog-tbl"
    );
    expect(dialogTable).toBeInTheDocument();
    await waitFor(() => {
      const measure1Name = within(dialogTable).getByText("TestMeasure1");
      expect(measure1Name).toBeInTheDocument();
      const measure2Name = within(dialogTable).getByText("TestMeasure2");
      expect(measure2Name).toBeInTheDocument();
    });
    expect(
      screen.getByText("Copy QDM Metadata to QI-Core measure")
    ).toBeInTheDocument();
  });

  test("shows measure counts on page load", async () => {
    renderRouter(["/measures"]);
    await waitFor(() => {
      expect(
        mockMeasureServiceApi.searchMeasuresByCriteria
      ).toHaveBeenCalledWith(
        ["OWNED"],
        10,
        0,
        "",
        "",
        {
          optionalSearchProperties: [],
          searchField: "",
        },
        abortController.signal
      );
    });
    await waitFor(() => {
      expect(mockMeasureServiceApi.getMeasureCounts).toHaveBeenCalled();
    });
    const ownedMeasuresTab = screen.getByRole("tab", {
      name: "Owned Measures (5)",
    });
    expect(ownedMeasuresTab).toBeInTheDocument();
    expect(ownedMeasuresTab).toHaveClass("Mui-selected");

    const sharedMeasuresTab = screen.getByRole("tab", {
      name: "Shared Measures (3)",
    });
    expect(sharedMeasuresTab).toBeInTheDocument();
    expect(sharedMeasuresTab).not.toHaveClass("Mui-selected");

    const allMeasuresTab = screen.getByRole("tab", {
      name: "All Measures (10)",
    });
    expect(allMeasuresTab).toBeInTheDocument();
    expect(allMeasuresTab).not.toHaveClass("Mui-selected");
  });

  test("should display transfer dialog and display success toast", async () => {
    renderRouter(["/measures"]);
    const measure1 = await screen.findByText("TestMeasure1");
    expect(measure1).toBeInTheDocument();
    await waitFor(() => {
      expect(
        mockMeasureServiceApi.searchMeasuresByCriteria
      ).toHaveBeenCalledWith(
        ["OWNED"],
        10,
        0,
        "",
        "",
        {
          optionalSearchProperties: [],
          searchField: "",
        },
        abortController.signal
      );
    });

    const ownedMeasuresTab = screen.getByRole("tab", {
      name: "Owned Measures (5)",
    });
    const sharedMeasuresTab = screen.getByRole("tab", {
      name: "Shared Measures (3)",
    });
    const allMeasuresTab = screen.getByRole("tab", {
      name: "All Measures (10)",
    });

    expect(ownedMeasuresTab).toHaveClass("Mui-selected");
    expect(sharedMeasuresTab).not.toHaveClass("Mui-selected");
    expect(allMeasuresTab).not.toHaveClass("Mui-selected");

    const checkbox = await screen.findByTestId("checkbox-select-all-checkbox");
    expect(checkbox).toBeInTheDocument();
    act(() => {
      userEvent.click(checkbox);
    });

    const transferActionBtn = await screen.findByTestId("transfer-action-btn");
    expect(transferActionBtn).toBeInTheDocument();
    act(() => {
      userEvent.click(transferActionBtn);
    });

    expect(screen.getByTestId("transfer-dialog")).toBeInTheDocument();

    const newHarpIdInput = screen.getByTestId("harp-id-input");
    expect(newHarpIdInput).toBeInTheDocument();
    expect(newHarpIdInput.value).toBe("");
    const transferBtn = screen.getByTestId("transfer-save-button");
    expect(transferBtn).toBeInTheDocument();
    expect(transferBtn).toBeDisabled();

    fireEvent.change(newHarpIdInput, {
      target: { value: "newUser" },
    });
    expect(newHarpIdInput.value).toBe("newUser");
    expect(transferBtn).toBeEnabled();

    act(() => {
      fireEvent.click(transferBtn);
    });

    expect(await screen.findByTestId("toast-success")).toHaveTextContent(
      "The measure(s) were successfully transferred."
    );
    expect(screen.queryByTestId("transfer-dialog")).not.toBeInTheDocument();
  });

  test("should display transfer dialog and failure toast", async () => {
    (mockMeasureServiceApi.transferMeasures as jest.Mock)
      .mockClear()
      .mockRejectedValueOnce(new Error("Unable to transfer measures."));

    renderRouter(["/measures"]);
    const measure1 = await screen.findByText("TestMeasure1");
    expect(measure1).toBeInTheDocument();
    await waitFor(() => {
      expect(
        mockMeasureServiceApi.searchMeasuresByCriteria
      ).toHaveBeenCalledWith(
        ["OWNED"],
        10,
        0,
        "",
        "",
        {
          optionalSearchProperties: [],
          searchField: "",
        },
        abortController.signal
      );
    });

    const checkbox = await screen.findByTestId("checkbox-select-all-checkbox");
    expect(checkbox).toBeInTheDocument();
    act(() => {
      userEvent.click(checkbox);
    });

    const transferActionBtn = await screen.findByTestId("transfer-action-btn");
    expect(transferActionBtn).toBeInTheDocument();
    act(() => {
      userEvent.click(transferActionBtn);
    });

    expect(screen.getByTestId("transfer-dialog")).toBeInTheDocument();

    const newHarpIdInput = screen.getByTestId("harp-id-input");
    expect(newHarpIdInput).toBeInTheDocument();
    expect(newHarpIdInput.value).toBe("");
    const transferBtn = screen.getByTestId("transfer-save-button");
    expect(transferBtn).toBeInTheDocument();
    expect(transferBtn).toBeDisabled();

    fireEvent.change(newHarpIdInput, {
      target: { value: "newUser" },
    });
    expect(newHarpIdInput.value).toBe("newUser");
    expect(transferBtn).toBeEnabled();

    act(() => {
      fireEvent.click(transferBtn);
    });

    expect(await screen.findByTestId("toast-danger")).toHaveTextContent(
      "Unable to transfer the selected measure(s) to the harpId. If the error persists, please contact the help desk."
    );
    const closeToast = screen.getByTestId("close-toast-button");
    expect(closeToast).toBeInTheDocument();
    act(() => {
      userEvent.click(closeToast);
    });

    setTimeout(() => {
      expect(screen.queryByTestId("toast-danger")).not.toBeInTheDocument();
    }, 500);
  });
});
