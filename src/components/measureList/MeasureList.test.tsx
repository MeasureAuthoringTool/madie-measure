import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Measure, Model } from "@madie/madie-models";
import MeasureList from "./MeasureList";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../api/useMeasureServiceApi";
import { oneItemResponse } from "../measureRoutes/mockMeasureResponses";
import userEvent from "@testing-library/user-event";

import { v4 as uuid } from "uuid";
import ServiceContext, { ServiceConfig } from "../../api/ServiceContext";

const mockPush = jest.fn();
jest.mock("react-router-dom", () => ({
  useHistory: () => {
    const push = () => mockPush("/example");
    return { push };
  },
}));

jest.mock("@madie/madie-util", () => ({
  useOktaTokens: jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  })),
  checkUserCanEdit: jest.fn().mockImplementation(() => true),
  useFeatureFlags: () => ({
    export: true,
    //measureVersioning: true,
  }),
}));

jest.mock("../../api/useMeasureServiceApi");
const useMeasureServiceMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;
const mockMeasureServiceApi = {
  searchMeasuresByMeasureNameOrEcqmTitle: jest
    .fn()
    .mockResolvedValue(oneItemResponse),
  fetchMeasures: jest.fn().mockResolvedValue(oneItemResponse),
  createVersion: jest.fn().mockResolvedValue({}),
  getMeasureExport: jest
    .fn()
    .mockResolvedValue({ size: 635581, type: "application/octet-stream" }),
} as unknown as MeasureServiceApi;

jest.mock("../../api/useMeasureServiceApi", () =>
  jest.fn(() => mockMeasureServiceApi)
);

const MEASURE_CREATEDBY = "testuser@example.com"; //#nosec
const testGroup = [
  {
    id: "test",
    scoring: "Cohort",
    measureGroupTypes: ["OUTCOME"],
  },
];
const measures: Measure[] = [
  {
    id: "IDIDID1",
    measureHumanReadableId: null,
    ecqmTitle: "ecqmTitleeee",
    measureSetId: "1",
    version: "0.0.000",
    state: "NEW",
    measureName: "new measure - A",
    cql: null,
    createdAt: null,
    createdBy: MEASURE_CREATEDBY,
    lastModifiedAt: null,
    lastModifiedBy: null,
    model: "QDM",
    active: true,
    measureMetaData: {
      draft: true,
    },
  },
  {
    id: "IDIDID2",
    measureHumanReadableId: null,
    measureSetId: "2",
    version: "0.0.000",
    state: "DRAFT",
    measureName: "draft measure - B",
    cql: "Sample Cql",
    createdAt: null,
    createdBy: null,
    lastModifiedAt: null,
    lastModifiedBy: null,
    model: "FHIR",
    active: false,
    measureMetaData: {
      draft: true,
    },
  },
  {
    id: "IDIDID3",
    measureHumanReadableId: null,
    measureSetId: "3",
    version: "1.3",
    state: "VERSIONED",
    measureName: "versioned measure - C",
    cql: "Sample Cql",
    cqlErrors: true,
    groups: [testGroup],
    createdAt: null,
    createdBy: null,
    lastModifiedAt: null,
    lastModifiedBy: null,
    model: Model.QICORE.valueOf(),
    active: false,
    measureMetaData: {
      draft: false,
    },
  },
];

const serviceConfig: ServiceConfig = {
  elmTranslationService: { baseUrl: "" },
  measureService: { baseUrl: "" },
  terminologyService: { baseUrl: "" },
};

const setMeasureListMock = jest.fn();
const setTotalPagesMock = jest.fn();
const setTotalItemsMock = jest.fn();
const setVisibleItemsMock = jest.fn();
const setOffsetMock = jest.fn();
const setInitialLoadMock = jest.fn();
const setSearchCriteriaMock = jest.fn();
const setErrMsgMock = jest.fn();
const onListUpdateMock = jest.fn();

describe("Measure List component", () => {
  beforeEach(() => {
    measures.forEach((m) => {
      m.measureHumanReadableId = uuid();
    });

    useMeasureServiceMock.mockReset().mockImplementation(() => {
      return mockMeasureServiceApi;
    });
  });

  const renderMeasureList = (searchCriteria?: string) => {
    render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setInitialLoad={setInitialLoadMock}
          activeTab={0}
          searchCriteria={searchCriteria ? searchCriteria : ""}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          onListUpdate={onListUpdateMock}
        />
      </ServiceContext.Provider>
    );
  };

  it("should display a list of measures", () => {
    renderMeasureList();
    measures.forEach((m) => {
      expect(screen.getByText(m.measureName)).toBeInTheDocument();
    });
  });

  it("should navigate to the edit measure screen on click of edit/view button", async () => {
    renderMeasureList();
    const selectButtons = await screen.findAllByRole("button", {
      name: "Select",
    });

    fireEvent.click(selectButtons[0]);
    const editButton = await screen.findByRole("button", {
      name: "View",
    });
    expect(editButton).toBeInTheDocument();
    expect(window.location.href).toBe("http://localhost/");
    fireEvent.click(editButton);
    expect(mockPush).toHaveBeenCalledWith("/example");
  });

  it("should display the popover with options of export and view when feature flag is set to true", () => {
    renderMeasureList();
    const actionButton = screen.getByTestId(`measure-action-${measures[0].id}`);
    expect(actionButton).toBeInTheDocument();
    expect(actionButton).toHaveTextContent("Select");
    expect(window.location.href).toBe("http://localhost/");
    fireEvent.click(actionButton);
    expect(
      screen.getByTestId(`view-measure-${measures[0].id}`)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`export-measure-${measures[0].id}`)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`create-version-measure-${measures[0].id}`)
    ).toBeInTheDocument();
    expect(window.location.href).toBe("http://localhost/");
    fireEvent.click(screen.getByTestId(`view-measure-${measures[0].id}`));
    expect(mockPush).toHaveBeenCalledWith("/example");
  });

  it("Search measure should display returned measures", () => {
    renderMeasureList("test");

    const searchFieldInput = screen.getByTestId(
      "searchMeasure-input"
    ) as HTMLInputElement;
    expect(searchFieldInput).toBeInTheDocument();
    userEvent.type(searchFieldInput, "test");
    expect(searchFieldInput.value).toBe("test");

    fireEvent.submit(searchFieldInput);

    measures.forEach((m) => {
      expect(screen.getByText(m.measureName)).toBeInTheDocument();
    });

    expect(
      mockMeasureServiceApi.searchMeasuresByMeasureNameOrEcqmTitle
    ).toHaveBeenCalledWith(true, 10, 0, "test");
  });

  it("Clear search criteria should clear input field", async () => {
    renderMeasureList("test");
    const searchFieldInput = screen.getByTestId(
      "searchMeasure-input"
    ) as HTMLInputElement;
    expect(searchFieldInput).toBeInTheDocument();
    userEvent.type(searchFieldInput, "test");
    expect(searchFieldInput.value).toBe("test");

    fireEvent.submit(searchFieldInput);

    measures.forEach((m) => {
      expect(screen.getByText(m.measureName)).toBeInTheDocument();
    });

    const clearButton = screen.getByRole("button", {
      name: /Clear-Search/i,
    });
    userEvent.click(clearButton);
    setTimeout(() => {
      expect(searchFieldInput.value).toBe("");
    }, 25000);

    expect(mockMeasureServiceApi.fetchMeasures).toHaveBeenCalledWith(
      true,
      10,
      0
    );
  });

  it("empty search criteria won't trigger search", () => {
    renderMeasureList();
    const searchFieldInput = screen.getByTestId(
      "searchMeasure-input"
    ) as HTMLInputElement;
    userEvent.type(searchFieldInput, "");
    expect(searchFieldInput.value).toBe("");

    fireEvent.submit(searchFieldInput);

    expect(
      mockMeasureServiceApi.searchMeasuresByMeasureNameOrEcqmTitle
    ).not.toHaveBeenCalledWith(true, 10, 0, "");
  });

  it("Clear search with error should still do the push", async () => {
    (mockMeasureServiceApi.fetchMeasures as jest.Mock)
      .mockClear()
      .mockRejectedValueOnce(new Error("Unable to fetch measures"));
    (mockMeasureServiceApi.searchMeasuresByMeasureNameOrEcqmTitle as jest.Mock)
      .mockClear()
      .mockRejectedValueOnce(new Error("Unable to fetch measures"));

    renderMeasureList("test");

    const searchFieldInput = screen.getByTestId(
      "searchMeasure-input"
    ) as HTMLInputElement;
    userEvent.type(searchFieldInput, "test");
    expect(searchFieldInput.value).toBe("test");

    fireEvent.submit(searchFieldInput);

    measures.forEach((m) => {
      expect(screen.getByText(m.measureName)).toBeInTheDocument();
    });

    const clearButton = screen.getByRole("button", {
      name: /Clear-Search/i,
    });
    userEvent.click(clearButton);
    setTimeout(() => {
      expect(searchFieldInput.value).toBe("");
    }, 25000);
    expect(mockMeasureServiceApi.fetchMeasures).toHaveBeenCalledWith(
      true,
      10,
      0
    );
    expect(mockPush).toHaveBeenCalledWith("/example");
  });

  it("should display create version dialog on click of version button", () => {
    renderMeasureList();
    const actionButton = screen.getByTestId(`measure-action-${measures[0].id}`);
    expect(actionButton).toBeInTheDocument();
    expect(actionButton).toHaveTextContent("Select");
    expect(window.location.href).toBe("http://localhost/");
    fireEvent.click(actionButton);
    expect(
      screen.getByTestId(`view-measure-${measures[0].id}`)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`export-measure-${measures[0].id}`)
    ).toBeInTheDocument();

    const createVersionButton = screen.getByTestId(
      `create-version-measure-${measures[0].id}`
    );
    expect(createVersionButton).toBeInTheDocument();
    expect(createVersionButton).toHaveTextContent("Version");
    fireEvent.click(createVersionButton);

    expect(screen.getByTestId("create-version-dialog")).toBeInTheDocument();
  });

  it("should display unauthorized error while creating a version of a measure", async () => {
    const error = {
      response: {
        status: 403,
      },
    };
    const useMeasureServiceMockRejected = {
      createVersion: jest.fn().mockRejectedValue(error),
    } as unknown as MeasureServiceApi;

    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockRejected;
    });

    renderMeasureList();
    fireEvent.click(screen.getByTestId(`measure-action-${measures[0].id}`));
    fireEvent.click(
      screen.getByTestId(`create-version-measure-${measures[0].id}`)
    );
    fireEvent.click(screen.getByLabelText("Major"));
    await waitFor(() => {
      fireEvent.click(screen.getByTestId("create-version-continue-button"));
      expect(screen.getByTestId("error-toast")).toHaveTextContent(
        "User is unauthorized to create a version"
      );
    });
  });

  it("should display bad request while creating a version of a measure", async () => {
    const error = {
      response: {
        status: 400,
      },
    };
    const useMeasureServiceMockRejected = {
      createVersion: jest.fn().mockRejectedValue(error),
    } as unknown as MeasureServiceApi;

    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockRejected;
    });
    renderMeasureList();
    fireEvent.click(screen.getByTestId(`measure-action-${measures[0].id}`));
    fireEvent.click(
      screen.getByTestId(`create-version-measure-${measures[0].id}`)
    );
    fireEvent.click(screen.getByLabelText("Major"));
    await waitFor(() => {
      fireEvent.click(screen.getByTestId("create-version-continue-button"));
      expect(screen.getByTestId("error-toast")).toHaveTextContent(
        "Requested measure cannot be versioned"
      );
    });
  });

  it("should display other error while creating a version of a measure", async () => {
    const error = {
      response: {
        status: 500,
        message: "server error",
      },
    };
    const useMeasureServiceMockRejected = {
      createVersion: jest.fn().mockRejectedValue(error),
    } as unknown as MeasureServiceApi;

    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockRejected;
    });

    renderMeasureList();
    fireEvent.click(screen.getByTestId(`measure-action-${measures[0].id}`));
    fireEvent.click(
      screen.getByTestId(`create-version-measure-${measures[0].id}`)
    );
    fireEvent.click(screen.getByLabelText("Major"));
    await waitFor(() => {
      fireEvent.click(screen.getByTestId("create-version-continue-button"));
      expect(screen.getByTestId("error-toast")).toHaveTextContent(
        "server error"
      );
    });
  });

  it("should display success message while creating a version of a measure and message can be closed", async () => {
    const success = {
      response: {
        data: {},
      },
    };
    const useMeasureServiceMockRejected = {
      createVersion: jest.fn().mockResolvedValue(success),
    } as unknown as MeasureServiceApi;

    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockRejected;
    });
    renderMeasureList();
    fireEvent.click(screen.getByTestId(`measure-action-${measures[0].id}`));
    fireEvent.click(
      screen.getByTestId(`create-version-measure-${measures[0].id}`)
    );
    fireEvent.click(screen.getByLabelText("Major"));
    await waitFor(() => {
      fireEvent.click(screen.getByTestId("create-version-continue-button"));
      expect(screen.getByTestId("success-toast")).toHaveTextContent(
        "New version of measure is Successfully created"
      );

      const closeButton = screen.getByTestId("close-toast-button");
      fireEvent.click(closeButton);
      setTimeout(() => {
        expect(
          screen.queryByTestId("create-version-success-text")
        ).not.toBeInTheDocument();
      }, 500);
    });
  });

  it("should display draft/version actions based on whether measure is draft or versioned", async () => {
    renderMeasureList();
    const selectButtons = await screen.findAllByRole("button", {
      name: "Select",
    });

    // first measure should have Version action as this is a draft measure
    fireEvent.click(selectButtons[0]);
    const draftButton = await screen.findByRole("button", {
      name: "Version",
    });
    expect(draftButton).toBeInTheDocument();

    // second measure should have Version action as this is a draft measure
    fireEvent.click(selectButtons[1]);
    expect(
      await screen.findByRole("button", {
        name: "Version",
      })
    ).toBeInTheDocument();

    // third measure should have Draft action as this is versioned measure
    fireEvent.click(selectButtons[2]);
    expect(
      await screen.findByRole("button", {
        name: "Draft",
      })
    ).toBeInTheDocument();
  });

  it("should display draft dialog on clicking Draft action", async () => {
    renderMeasureList();
    const selectButtons = await screen.findAllByRole("button", {
      name: "Select",
    });
    fireEvent.click(selectButtons[2]);
    const draftButton = await screen.findByRole("button", {
      name: "Draft",
    });
    fireEvent.click(draftButton);
    expect(screen.getByText("Create Draft")).toBeInTheDocument();
    const measureName = (await screen.findByRole("textbox", {
      name: "Measure Name",
    })) as HTMLInputElement;
    expect(measureName.value).toEqual(measures[2].measureName);
    // close dialog
    fireEvent.click(screen.getByText(/Cancel/i));
  });

  it("should create a measure draft successfully", async () => {
    const success = {
      response: {
        data: {},
      },
    };
    const useMeasureServiceMockResolved = {
      draftMeasure: jest.fn().mockResolvedValue(success),
    } as unknown as MeasureServiceApi;
    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockResolved;
    });
    renderMeasureList();

    const selectButtons = await screen.findAllByRole("button", {
      name: "Select",
    });
    fireEvent.click(selectButtons[2]);
    const draftButton = await screen.findByRole("button", {
      name: "Draft",
    });
    fireEvent.click(draftButton);
    expect(screen.getByText("Create Draft")).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Continue/i));
    await waitFor(() => {
      expect(screen.getByTestId("success-toast")).toHaveTextContent(
        "New draft created successfully."
      );
    });
  });

  it("should display errors if draft creation fails with validation", async () => {
    const error = {
      response: {
        status: 400,
        data: {
          message:
            'Can not create a draft for the measure "Test". Only one draft is permitted per measure.',
        },
      },
    };
    const useMeasureServiceMockRejected = {
      draftMeasure: jest.fn().mockRejectedValue(error),
    } as unknown as MeasureServiceApi;

    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockRejected;
    });
    renderMeasureList();

    const selectButtons = await screen.findAllByRole("button", {
      name: "Select",
    });
    fireEvent.click(selectButtons[2]);
    const draftButton = await screen.findByRole("button", {
      name: "Draft",
    });
    fireEvent.click(draftButton);
    expect(screen.getByText("Create Draft")).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Continue/i));
    await waitFor(() => {
      expect(screen.getByTestId("error-toast")).toHaveTextContent(
        error.response.data.message
      );
    });
  });

  it("should display errors if service down or internal server errors", async () => {
    const error = {
      response: {
        data: {},
        request: {
          responseText: {
            message: "Insert sand in the disk drive to continue.",
          },
        },
      },
    };
    const useMeasureServiceMockRejected = {
      draftMeasure: jest.fn().mockRejectedValue(error),
    } as unknown as MeasureServiceApi;

    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockRejected;
    });

    renderMeasureList();
    const selectButtons = await screen.findAllByRole("button", {
      name: "Select",
    });
    fireEvent.click(selectButtons[2]);
    const draftButton = await screen.findByRole("button", {
      name: "Draft",
    });
    fireEvent.click(draftButton);
    expect(screen.getByText("Create Draft")).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Continue/i));
    await waitFor(() => {
      expect(screen.getByTestId("error-toast")).toHaveTextContent(
        "An error occurred, please try again. If the error persists, please contact the help desk."
      );
    });
  });

  it("should display the error when cql is empty while exporting the measure", async () => {
    const error = {
      response: {
        status: 409,
      },
    };

    useMeasureServiceMock.mockImplementation(() => {
      return {
        ...mockMeasureServiceApi,
        getMeasureExport: jest.fn().mockRejectedValue(error),
      };
    });

    renderMeasureList();
    const actionButton = screen.getByTestId(`measure-action-${measures[0].id}`);
    fireEvent.click(actionButton);
    expect(
      screen.getByTestId(`export-measure-${measures[0].id}`)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId(`export-measure-${measures[0].id}`));
    await waitFor(() => {
      expect(screen.getByTestId("error-toast")).toHaveTextContent(
        "Unable to Export measure. Measure Bundle could not be generated as Measure does not contain CQL."
      );
    });
  });

  it("should display the error when there are return type mismatch or errors in cql while exporting the measure", async () => {
    const error = {
      response: {
        status: 409,
      },
    };

    useMeasureServiceMock.mockImplementation(() => {
      return {
        ...mockMeasureServiceApi,
        getMeasureExport: jest.fn().mockRejectedValue(error),
      };
    });

    renderMeasureList();
    const actionButton = screen.getByTestId(`measure-action-${measures[2].id}`);
    fireEvent.click(actionButton);
    expect(
      screen.getByTestId(`export-measure-${measures[2].id}`)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId(`export-measure-${measures[2].id}`));
    await waitFor(() => {
      expect(screen.getByTestId("error-toast")).toHaveTextContent(
        "Unable to Export measure. Measure Bundle could not be generated as Measure contains errors."
      );
    });
  });

  it("should display the error when there are no associated population criteria while exporting the measure", async () => {
    const error = {
      response: {
        status: 409,
      },
    };

    useMeasureServiceMock.mockImplementation(() => {
      return {
        ...mockMeasureServiceApi,
        getMeasureExport: jest.fn().mockRejectedValue(error),
      };
    });

    renderMeasureList();
    const actionButton = screen.getByTestId(`measure-action-${measures[1].id}`);
    fireEvent.click(actionButton);
    expect(
      screen.getByTestId(`export-measure-${measures[1].id}`)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId(`export-measure-${measures[1].id}`));
    await waitFor(() => {
      expect(screen.getByTestId("error-toast")).toHaveTextContent(
        "Unable to Export measure. Measure Bundle could not be generated as Measure does not contain Population Criteria."
      );
    });
  });

  it("should display the error when there are no associated libraries in hapi fhir or if the server is down while exporting the measure", async () => {
    const error = {
      response: {
        status: 500,
      },
    };

    useMeasureServiceMock.mockImplementation(() => {
      return {
        ...mockMeasureServiceApi,
        getMeasureExport: jest.fn().mockRejectedValue(error),
      };
    });

    renderMeasureList();
    fireEvent.click(screen.getByTestId(`measure-action-${measures[2].id}`));
    expect(
      screen.getByTestId(`export-measure-${measures[2].id}`)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId(`export-measure-${measures[2].id}`));
    await waitFor(() => {
      expect(screen.getByTestId("error-toast")).toHaveTextContent(
        "Unable to Export measure. Measure Bundle could not be generated. Please try again and contact the Help Desk if the problem persists."
      );
    });
  });

  it("should call the export api to generate the measure zip file", async () => {
    const success = {
      response: {
        data: {
          size: 635581,
          type: "application/octet-stream",
        },
      },
    };
    useMeasureServiceMock.mockImplementation(() => {
      return {
        ...mockMeasureServiceApi,
        getMeasureExport: jest.fn().mockResolvedValue(success),
      };
    });

    renderMeasureList();
    const actionButton = screen.getByTestId(`measure-action-${measures[0].id}`);
    fireEvent.click(actionButton);
    const link = {
      click: jest.fn(),
      setAttribute: jest.fn(),
    };
    window.URL.createObjectURL = jest
      .fn()
      .mockReturnValueOnce("http://fileurl");
    document.body.appendChild = jest.fn();
    document.createElement = jest.fn().mockReturnValueOnce(link);
    expect(
      screen.getByTestId(`export-measure-${measures[0].id}`)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId(`export-measure-${measures[0].id}`));
    await waitFor(() => {
      expect(link.click).toBeCalled();
    });
  });
});
