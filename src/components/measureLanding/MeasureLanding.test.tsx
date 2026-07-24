import * as mockCmsIdStubs from "../../__mocks__/cmsIdFormatterStubs";
import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required
import * as React from "react";
import * as mockMeasureActionStubs from "../../__mocks__/measureActionStubs";
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

import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import userEvent from "@testing-library/user-event";
import { oneItemResponse } from "../__mocks__/mockMeasureResponses";
import { within } from "@testing-library/dom";
// @ts-ignore
import { MeasureServiceApi, useMeasureServiceApi } from "@madie/madie-util";
import MeasureLanding from "./MeasureLanding";
import {
  TRANSFER_MEASURE_SUCCESS,
  TRANSFER_MEASURE_FAILURE,
} from "../common/transferDialog/TransferDialog";

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
  ...mockCmsIdStubs,
  ...mockMeasureActionStubs,
  useDocumentTitle: jest.fn(),
  useUserServiceApi: jest.fn(() => ({ getOwnerDetails: jest.fn() })),
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
  useUserRoles: jest.fn(() => ({
    roles: [],
    isAdmin: false,
  })),
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
    status: 200,
    data: [],
  }),
} as unknown as MeasureServiceApi;

const mockMeasureReviewServiceApi = {
  getMeasureReview: jest.fn().mockResolvedValue(null),
  createMeasureReview: jest.fn().mockResolvedValue({ id: "new-review-id" }),
  updateMeasureReview: jest
    .fn()
    .mockResolvedValue({ id: "existing-review-id" }),
};

jest.mock("@madie/madie-util", () => ({
  ...mockMeasureActionStubs,
  ...mockCmsIdStubs,
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
  useMeasureReviewServiceApi: jest.fn(() => mockMeasureReviewServiceApi),
  useUserServiceApi: jest.fn(() => ({ getOwnerDetails: jest.fn() })),
  useOktaTokens: jest.fn(() => ({
    getAccessToken: () => "test.jwt",
    getUserName: () => mockUser,
  })),
  checkUserCanEdit: jest.fn().mockImplementation(() => true),
  checkUserCanDelete: jest.fn().mockImplementation(() => true),
  useFeatureFlags: jest.fn(),
  useUserRoles: jest.fn(() => ({
    roles: [],
    isAdmin: false,
  })),
  useDocumentTitle: jest.fn(),
  measureStore: {
    updateMeasure: jest.fn((measure) => measure),
    state: jest.fn().mockImplementation(() => null),
    initialState: jest.fn().mockImplementation(() => null),
    subscribe: () => {
      return { unsubscribe: () => null };
    },
  },
}));

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

  test("shows owned measures on page load, and sorting works", async () => {
    renderRouter(["/measures?tab=0&page=1&limit=10"]);
    const measure1 = await screen.findByText("TestMeasure1");
    expect(measure1).toBeInTheDocument();
    await waitFor(() => {
      expect(
        mockMeasureServiceApi.searchMeasuresByCriteria
      ).toHaveBeenCalledWith(
        ["OWNED"],
        "10",
        0,
        "",
        "",
        {
          optionalSearchProperties: [],
          searchField: "",
        },
        expect.any(AbortController)
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

    const measureSortHeader = screen.getByTestId("header-measureName");
    expect(measureSortHeader).toBeInTheDocument();
    expect(measureSortHeader.title).toBe("Sort ascending");
  });

  test("shared measure nav click triggers nav", async () => {
    renderRouter(["/measures?tab=0&page=1&limit=10"]);
    const measure1 = await screen.findByText("TestMeasure1");
    expect(measure1).toBeInTheDocument();
    await waitFor(() => {
      expect(
        mockMeasureServiceApi.searchMeasuresByCriteria
      ).toHaveBeenCalledWith(
        ["OWNED"],
        "10",
        0,
        "",
        "",
        {
          optionalSearchProperties: [],
          searchField: "",
        },
        expect.any(AbortController)
      );
    });

    // already in owned measures tab..
    const ownedMeasuresTab = await screen.findByTestId("owned-measures-tab");
    // await userEvent.click(ownedMeasuresTab);
    expect(ownedMeasuresTab).toHaveClass("Mui-selected");

    // navigate shared.
    const sharedMeasuresTab = await screen.findByTestId("shared-measures-tab");
    await userEvent.click(sharedMeasuresTab);
    await waitFor(() => {
      expect(mockedUsedNavigate).toHaveBeenCalledWith("?tab=1&page=1&limit=10");
    });
  });

  test("all measure nav click triggers nav", async () => {
    renderRouter(["/measures?tab=0&page=1&limit=10"]);
    const measure1 = await screen.findByText("TestMeasure1");
    expect(measure1).toBeInTheDocument();
    await waitFor(() => {
      expect(
        mockMeasureServiceApi.searchMeasuresByCriteria
      ).toHaveBeenCalledWith(
        ["OWNED"],
        "10",
        0,
        "",
        "",
        {
          optionalSearchProperties: [],
          searchField: "",
        },
        expect.any(AbortController)
      );
    });

    const ownedMeasuresTab = await screen.findByTestId("owned-measures-tab");
    userEvent.click(ownedMeasuresTab);
    expect(ownedMeasuresTab).toHaveClass("Mui-selected");

    const allMeasuresTab = await screen.findByTestId("all-measures-tab");
    userEvent.click(allMeasuresTab);

    expect(mockedUsedNavigate).toHaveBeenCalledWith("?tab=2&page=1&limit=10");
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
        expect.any(AbortController)
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
        expect.any(AbortController)
      );
    });
  });

  test("Search measure should call search api with search criteria", async () => {
    renderRouter(["/measures?tab=0&page=1&limit=10"]);

    const searchField = (await screen.findByRole(
      "textbox"
    )) as HTMLInputElement;
    expect(searchField).toBeInTheDocument();

    userEvent.type(searchField, "test");
    expect(searchField).toHaveValue("test");

    // Click the search trigger button to submit the search
    const searchTrigger = screen.getByTestId("measure-trigger-search");
    fireEvent.click(searchTrigger);

    await waitFor(() => {
      expect(
        mockMeasureServiceApi.searchMeasuresByCriteria
      ).toHaveBeenCalledWith(
        ["OWNED"],
        "10",
        0,
        "",
        "",
        { searchField: "test", optionalSearchProperties: expect.any(Array) },
        expect.any(AbortController)
      );
    });
  });

  test("Create event triggers the event listener", async () => {
    renderRouter(["/measures?tab=0&page=1&limit=10"]);
    const event = new Event("create");
    window.dispatchEvent(event);
    await waitFor(() => {
      expect(
        mockMeasureServiceApi.searchMeasuresByCriteria
      ).toHaveBeenCalledWith(
        ["OWNED"],
        "10",
        0,
        "",
        "",
        {
          optionalSearchProperties: [],
          searchField: "",
        },
        expect.any(AbortController)
      );
    });
  });

  test("test pagination page button", async () => {
    renderRouter(["/measures?tab=0&page=1&limit=10"]);
    const pageButton = await screen.findByLabelText("page 1");
    userEvent.click(pageButton);
    expect(mockedUsedNavigate).toHaveBeenCalledWith("?tab=0&page=1&limit=10");
    const measure1 = await screen.findByText("TestMeasure1");
    expect(measure1).toBeInTheDocument();
  });

  test("test pagination page limit change", async () => {
    renderRouter(["/measures?tab=0&page=1&limit=10"]);

    // Ensure the initial fetch is called with the default limit
    await waitFor(() => {
      expect(
        mockMeasureServiceApi.searchMeasuresByCriteria
      ).toHaveBeenCalledWith(
        ["OWNED"],
        "10",
        0,
        "",
        "",
        {
          optionalSearchProperties: [],
          searchField: "",
        },
        expect.any(AbortController)
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
    renderRouter(["/measures?tab=0&page=1&limit=10"]);

    const error = await screen.findByTestId("generic-error-text-header");
    expect(error).toBeInTheDocument();
    const errorText = await screen.findByText("Unable to fetch measures");
    expect(errorText).toBeInTheDocument();
  });

  it("Should not display errors when fetching measures is canceled", async () => {
    (mockMeasureServiceApi.searchMeasuresByCriteria as jest.Mock)
      .mockClear()
      .mockRejectedValueOnce(new Error("canceled"));
    renderRouter(["/measures?tab=0&page=1&limit=10"]);
    expect(screen.queryByTestId("generic-error-text-header")).toBeNull();
    expect(screen.queryByText("Unable to fetch measures")).toBeNull();
  });

  test("Search measure should display errors when searching measures is rejected", async () => {
    (mockMeasureServiceApi.searchMeasuresByCriteria as jest.Mock)
      .mockClear()
      .mockRejectedValueOnce(new Error("Unable to fetch measures"));
    renderRouter(["/measures?tab=0&page=1&limit=10"]);

    const searchField = (await screen.findByRole(
      "textbox"
    )) as HTMLInputElement;
    expect(searchField).toBeInTheDocument();

    userEvent.type(searchField, "test");
    expect(searchField).toHaveValue("test");

    // Click the search trigger button to submit the search
    const searchTrigger = screen.getByTestId("measure-trigger-search");
    fireEvent.click(searchTrigger);

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
    renderRouter(["/measures?tab=0&page=1&limit=10"]);

    const searchField = (await screen.findByRole(
      "textbox"
    )) as HTMLInputElement;
    expect(searchField).toBeInTheDocument();

    userEvent.type(searchField, "test");
    expect(searchField).toHaveValue("test");

    // Click the search trigger button to submit the search
    const searchTrigger = screen.getByTestId("measure-trigger-search");
    fireEvent.click(searchTrigger);

    await waitFor(() => {
      expect(screen.queryByTestId("generic-error-text-header")).toBeNull();
      expect(screen.queryByText("Unable to fetch measures")).toBeNull();
    });
  });
  //keep skipeed
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
    renderRouter(["/measures?tab=0&page=1&limit=10"]);
    await waitFor(() => {
      expect(
        mockMeasureServiceApi.searchMeasuresByCriteria
      ).toHaveBeenCalledWith(
        ["OWNED"],
        "10",
        0,
        "",
        "",
        {
          optionalSearchProperties: [],
          searchField: "",
        },
        expect.any(AbortController)
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

  describe("Request Cancellation", () => {
    let originalAbort: jest.SpyInstance;

    beforeEach(() => {
      // Mock AbortController.abort method
      originalAbort = jest.spyOn(AbortController.prototype, "abort");
    });

    afterEach(() => {
      originalAbort.mockRestore();
    });

    test("should cancel previous request when switching tabs", async () => {
      renderRouter(["/measures?tab=0&page=1&limit=10"]);

      // Wait for initial load
      await waitFor(() => {
        expect(
          mockMeasureServiceApi.searchMeasuresByCriteria
        ).toHaveBeenCalledTimes(1);
      });

      // Click on Shared Measures tab
      const sharedMeasuresTab = await screen.findByTestId(
        "shared-measures-tab"
      );
      fireEvent.click(sharedMeasuresTab);

      // Verify abort was called when switching tabs
      expect(originalAbort).toHaveBeenCalled();

      // Verify navigation happens
      expect(mockedUsedNavigate).toHaveBeenCalledWith("?tab=1&page=1&limit=10");
    });

    test("should handle race condition - only latest request updates UI", async () => {
      // First call: delayed promise that rejects with canceled when aborted
      (mockMeasureServiceApi.searchMeasuresByCriteria as jest.Mock)
        .mockImplementationOnce((...args) => {
          const abortCtrl = args[6];
          return new Promise((resolve, reject) => {
            abortCtrl.signal.addEventListener("abort", () =>
              reject(new Error("canceled"))
            );
            setTimeout(
              () =>
                resolve({
                  ...oneItemResponse,
                  content: [{ id: "delayed", measureName: "DelayedMeasure" }],
                }),
              100
            );
          });
        })
        // Second call: immediate response (should win)
        .mockResolvedValueOnce({
          ...oneItemResponse,
          content: [{ id: "immediate", measureName: "ImmediateMeasure" }],
        });

      renderRouter(["/measures?tab=0&page=1&limit=10"]);

      // Wait for initial load to start
      await waitFor(() => {
        expect(
          mockMeasureServiceApi.searchMeasuresByCriteria
        ).toHaveBeenCalledTimes(1);
      });

      // Quickly switch to another tab before first request completes
      const sharedMeasuresTab = await screen.findByTestId(
        "shared-measures-tab"
      );
      fireEvent.click(sharedMeasuresTab);

      // Wait for both requests to potentially complete
      await waitFor(() => {
        const calls = (
          mockMeasureServiceApi.searchMeasuresByCriteria as jest.Mock
        ).mock.calls.length;
        expect(calls).toBeGreaterThanOrEqual(2);
        expect(calls).toBeLessThanOrEqual(3);
      });
      // Ensure no generic error displayed (canceled first request ignored)
      expect(
        screen.queryByTestId("generic-error-text-header")
      ).not.toBeInTheDocument();
    });

    test("should not update UI when request is cancelled", async () => {
      // Mock a request that gets cancelled
      const cancelledError = new Error("canceled");
      (
        mockMeasureServiceApi.searchMeasuresByCriteria as jest.Mock
      ).mockRejectedValueOnce(cancelledError);

      renderRouter(["/measures?tab=0&page=1&limit=10"]);

      // Wait for the cancelled request
      await waitFor(() => {
        expect(
          mockMeasureServiceApi.searchMeasuresByCriteria
        ).toHaveBeenCalled();
      });

      // Should not show error for cancelled requests
      expect(
        screen.queryByTestId("generic-error-text-header")
      ).not.toBeInTheDocument();
    });

    test("should handle multiple rapid tab switches", async () => {
      renderRouter(["/measures?tab=0&page=1&limit=10"]);

      // Wait for initial load
      await waitFor(() => {
        expect(
          mockMeasureServiceApi.searchMeasuresByCriteria
        ).toHaveBeenCalledTimes(1);
      });

      const sharedMeasuresTab = await screen.findByTestId(
        "shared-measures-tab"
      );
      const allMeasuresTab = await screen.findByTestId("all-measures-tab");
      const ownedMeasuresTab = await screen.findByTestId("owned-measures-tab");

      // Rapidly switch between tabs
      fireEvent.click(sharedMeasuresTab);
      fireEvent.click(allMeasuresTab);
      fireEvent.click(ownedMeasuresTab);

      // Verify abort was called multiple times (each tab switch calls abort twice - once in handleTabChange, once in retrieveMeasures)
      expect(originalAbort).toHaveBeenCalledTimes(6);

      // Verify final navigation (check that the last call contains the expected URL)
      const ownedMeasuresTabSelected = await screen.findByTestId(
        "owned-measures-tab"
      );
      expect(ownedMeasuresTabSelected).toHaveClass("Mui-selected");
    });

    test("should cancel request during search", async () => {
      renderRouter(["/measures?tab=0&page=1&limit=10"]);

      const searchField = (await screen.findByRole(
        "textbox"
      )) as HTMLInputElement;

      // Start typing in search
      fireEvent.change(searchField, { target: { value: "test" } });

      // Click the search trigger button to submit the search
      const searchTrigger = screen.getByTestId("measure-trigger-search");
      fireEvent.click(searchTrigger);

      // Immediately switch tabs to cancel the search request
      const sharedMeasuresTab = await screen.findByTestId(
        "shared-measures-tab"
      );
      fireEvent.click(sharedMeasuresTab);

      // Verify abort was called
      expect(originalAbort).toHaveBeenCalled();
    });

    test("should only show loading state for current request", async () => {
      // Mock delayed responses
      const delayedPromise = new Promise((resolve) => {
        setTimeout(() => resolve(oneItemResponse), 200);
      });

      (mockMeasureServiceApi.searchMeasuresByCriteria as jest.Mock)
        .mockImplementationOnce(() => delayedPromise)
        .mockResolvedValue(oneItemResponse);

      renderRouter(["/measures?tab=0&page=1&limit=10"]);

      // Switch tabs quickly
      const sharedMeasuresTab = await screen.findByTestId(
        "shared-measures-tab"
      );
      fireEvent.click(sharedMeasuresTab);

      // Loading should eventually stop even if first request is still pending
      await waitFor(
        () => {
          const spinner = screen.queryByTestId("loading-spinner");
          expect(spinner).not.toBeInTheDocument();
        },
        { timeout: 300 }
      );
    });
  });
});
