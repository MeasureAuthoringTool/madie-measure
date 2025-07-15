import { jest } from "@jest/globals";
import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required
import * as React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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
  getMeasureCounts: jest
    .fn()
    .mockResolvedValue({ allMeasures: 12, myMeasures: 12 }),
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

  test("shows my measures on page load", async () => {
    renderRouter(["/measures"]);
    const measure1 = await screen.findByText("TestMeasure1");
    expect(measure1).toBeInTheDocument();
    await waitFor(() => {
      expect(
        mockMeasureServiceApi.searchMeasuresByCriteria
      ).toHaveBeenCalledWith(
        true,
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
    const myMeasuresTab = screen.getByRole("tab", { name: "My Measures" });
    expect(myMeasuresTab).toBeInTheDocument();
    expect(myMeasuresTab).toHaveClass("Mui-selected");
    const allMeasuresTab = screen.getByRole("tab", { name: "All Measures" });
    expect(allMeasuresTab).toBeInTheDocument();
    expect(allMeasuresTab).not.toHaveClass("Mui-selected");
  });

  test("all measure nav click triggers nav", async () => {
    renderRouter(["/measures"]);
    const measure1 = await screen.findByText("TestMeasure1");
    expect(measure1).toBeInTheDocument();
    await waitFor(() => {
      expect(
        mockMeasureServiceApi.searchMeasuresByCriteria
      ).toHaveBeenCalledWith(
        true,
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

    const myMeasuresTab = await screen.findByTestId("my-measures-tab");
    userEvent.click(myMeasuresTab);
    expect(myMeasuresTab).toHaveClass("Mui-selected");

    const allMeasuresTab = await screen.findByTestId("all-measures-tab");
    userEvent.click(allMeasuresTab);
    expect(mockedUsedNavigate).toHaveBeenCalledWith("?tab=1&page=1&limit=10");
  });
  test("loading in with props for all measures page, triggers a fetch", async () => {
    renderRouter(["/measures?tab=1&page=1&limit=10"]); // Use 1-based page in the query string

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
        false,
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
        true,
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
        true,
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
        true,
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
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      MeasureSearch: true,
    }));
    renderRouter(["/measures"]);
    await waitFor(() => {
      expect(
        mockMeasureServiceApi.searchMeasuresByCriteria
      ).toHaveBeenCalledWith(
        true,
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
    const myMeasuresTab = screen.getByRole("tab", {
      name: "My Measures (12)",
    });
    expect(myMeasuresTab).toBeInTheDocument();
    expect(myMeasuresTab).toHaveClass("Mui-selected");
    const allMeasuresTab = screen.getByRole("tab", {
      name: "All Measures (12)",
    });
    expect(allMeasuresTab).toBeInTheDocument();
    expect(allMeasuresTab).not.toHaveClass("Mui-selected");
  });
});
