import * as React from "react";
import {
  render,
  fireEvent,
  waitFor,
  screen,
  within,
} from "@testing-library/react";
import { act } from "react-dom/test-utils";
import MeasureInformation from "./MeasureInformation";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../../api/useMeasureServiceApi";
import { Measure } from "@madie/madie-models";
import { MemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";
import { useOktaTokens } from "@madie/madie-util";
import { describe, expect, it } from "@jest/globals";
import { AxiosError, AxiosResponse } from "axios";

const mockHistoryPush = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

jest.mock("../../../../api/useMeasureServiceApi");

const testUser = "john doe";
const measure = {
  id: "test measure",
  measureName: "the measure for testing",
  cqlLibraryName: "TestCqlLibraryName",
  ecqmTitle: "ecqmTitle",
  measurementPeriodStart: "01/01/2022",
  measurementPeriodEnd: "12/02/2022",
  createdBy: "john doe",
} as unknown as Measure;

jest.mock("@madie/madie-util", () => ({
  useOktaTokens: jest.fn(() => ({
    getUserName: jest.fn(() => "john doe"), //#nosec
    getAccessToken: () => "test.jwt",
  })),
  useKeyPress: jest.fn(() => false),
  measureStore: {
    updateMeasure: jest.fn((measure) => measure),
    state: jest.fn().mockImplementation(() => measure),
    initialState: jest.fn().mockImplementation(() => null),
    subscribe: (set) => {
      // set(measure)
      return { unsubscribe: () => null };
    },
  },
  routeHandlerStore: {
    subscribe: (set) => {
      set(measure);
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: () => null,
    state: { canTravel: true, pendingPath: "" },
    initialState: { canTravel: true, pendingPath: "" },
  },
}));

const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;

const axiosError: AxiosError = {
  response: {
    status: 500,
    data: { status: 500, error: "bad test", message: "oh no what happened" },
  } as AxiosResponse,
  toJSON: jest.fn(),
} as unknown as AxiosError;

let serviceApiMock: MeasureServiceApi;

useOktaTokens.mockImplementation(() => ({
  getUserName: () => testUser, // #nosec
}));

describe("MeasureInformation component", () => {
  const {
    getByTestId,
    findByTestId,
    queryByText,
    findByRole,
    findByText,
    queryByTestId,
  } = screen;

  it("should render the component with measure's information populated", async () => {
    render(<MeasureInformation />);

    const result: HTMLElement = getByTestId("measure-information-edit");
    expect(result).toBeInTheDocument();

    await act(async () => {
      const text = getByTestId("measure-name-input") as HTMLInputElement;
      expect(text.value).toBe(measure.measureName);
      const versionId = getByTestId("version-id-input") as HTMLInputElement;
      expect(versionId.value).toBe(measure.id);
      expect(versionId).toHaveProperty("readOnly", true);
      const cmsId = getByTestId("cms-id-input") as HTMLInputElement;
      expect(cmsId.value).toBe("");
      expect(cmsId).toHaveProperty("readOnly", true);
      const cqlLibraryNameText = getByTestId(
        "cql-library-name-input"
      ) as HTMLInputElement;
      expect(cqlLibraryNameText.value).toBe(measure.cqlLibraryName);
      const ecqmTitleText = getByTestId("ecqm-input") as HTMLInputElement;
      expect(ecqmTitleText.value).toBe(measure.ecqmTitle);
      const measurementPeriodStartNode = getByTestId(
        "measurement-period-start"
      );
      const measurementPeriodStartInput = within(
        measurementPeriodStartNode
      ).getByRole("textbox") as HTMLInputElement;
      expect(measurementPeriodStartInput.value).toBe(
        measure.measurementPeriodStart
      );
      const measurementPeriodEndNode = getByTestId("measurement-period-end");
      const measurementPeriodEndInput = within(
        measurementPeriodEndNode
      ).getByRole("textbox") as HTMLInputElement;
      expect(measurementPeriodEndInput.value).toBe(
        measure.measurementPeriodEnd
      );
    });
  });

  it("Should display measure Version ID when it is not null", async () => {
    measure.versionId = "testVersionId";
    render(<MeasureInformation />);

    const result: HTMLElement = getByTestId("measure-information-edit");
    expect(result).toBeInTheDocument();

    await act(async () => {
      const text = getByTestId("measure-name-input") as HTMLInputElement;
      expect(text.value).toBe(measure.measureName);
      const versionId = getByTestId("version-id-input") as HTMLInputElement;
      expect(versionId.value).toBe(measure.versionId);
      expect(versionId).toHaveProperty("readOnly", true);
    });
  });

  it("should render the component with a blank measure name", async () => {
    measure.measureName = "";
    render(<MeasureInformation />);
    const result: HTMLElement = getByTestId("measure-information-edit");
    expect(result).toBeInTheDocument();
    await act(async () => {
      const text = getByTestId("measure-name-input") as HTMLInputElement;
      expect(text.value).toBe("");
    });
  });

  it("Check if the measurement information save button is present", () => {
    render(<MeasureInformation />);
    const result: HTMLElement = getByTestId(
      "measurement-information-save-button"
    );
    expect(result).toBeInTheDocument();
  });

  it("Check if measurement start field is present in the form", async () => {
    render(<MeasureInformation />);
    const result = getByTestId("measurement-information-form");
    expect(result).toBeInTheDocument();
    await act(async () => {
      const measurementPeriodStart: HTMLElement = getByTestId(
        "measurement-period-start"
      );
      expect(measurementPeriodStart).toBeInTheDocument();
    });
  });

  it("Check if measurement start date field updates input as expected", async () => {
    measure.measurementPeriodStart = null;
    render(<MeasureInformation />);
    const measurementPeriodStartNode = getByTestId("measurement-period-start");
    const measurementPeriodStartInput = within(
      measurementPeriodStartNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.type(measurementPeriodStartInput, "12/07/2001");
    await act(async () => {
      await waitFor(() =>
        expect(measurementPeriodStartInput.value).toBe("12/07/2001")
      );
    });
  });

  it("Check if measurement end date field has expected value", async () => {
    measure.measurementPeriodEnd = null;
    render(<MeasureInformation />);
    const measurementPeriodEndNode = getByTestId("measurement-period-end");
    const measurementPeriodEndInput = within(
      measurementPeriodEndNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.type(measurementPeriodEndInput, "12/07/2009");
    await waitFor(() =>
      expect(measurementPeriodEndInput.value).toBe("12/07/2009")
    );
  });

  it("Check if measurement period save button is disabled when measurement period start and end date have same values", async () => {
    measure.measurementPeriodEnd = null;
    measure.measurementPeriodStart = null;
    render(<MeasureInformation />);
    const measurementPeriodStartNode = getByTestId("measurement-period-start");
    const measurementPeriodStartInput = within(
      measurementPeriodStartNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.type(measurementPeriodStartInput, "12/07/2009");
    await act(async () => {
      await waitFor(() =>
        expect(measurementPeriodStartInput.value).toBe("12/07/2009")
      );
    });
    const measurementPeriodEndNode = getByTestId("measurement-period-end");
    const measurementPeriodEndInput = within(
      measurementPeriodEndNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.type(measurementPeriodEndInput, "12/07/2009");
    await waitFor(() =>
      expect(measurementPeriodEndInput.value).toBe("12/07/2009")
    );

    const createBtn = getByTestId("measurement-information-save-button");
    expect(createBtn).toBeInTheDocument();
    expect(createBtn).not.toBeEnabled();
  });

  it("Check if measurement period save button is disabled when measurement period end date is less than start date", async () => {
    measure.measurementPeriodEnd = null;
    measure.measurementPeriodStart = null;
    render(<MeasureInformation />);
    const measurementPeriodStartNode = getByTestId("measurement-period-start");
    const measurementPeriodStartInput = within(
      measurementPeriodStartNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.type(measurementPeriodStartInput, "12/07/2009");
    await act(async () => {
      await waitFor(() =>
        expect(measurementPeriodStartInput.value).toBe("12/07/2009")
      );
    });
    const measurementPeriodEndNode = getByTestId("measurement-period-end");
    const measurementPeriodEndInput = within(
      measurementPeriodEndNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.type(measurementPeriodEndInput, "12/07/2008");
    await waitFor(() =>
      expect(measurementPeriodEndInput.value).toBe("12/07/2008")
    );

    const createBtn = getByTestId("measurement-information-save-button");
    expect(createBtn).toBeInTheDocument();
    expect(createBtn).toBeDisabled();
  });

  it("Check if measurement period save button is disabled when measurement period end date or state date is not valid", async () => {
    measure.measurementPeriodEnd = null;
    measure.measurementPeriodStart = null;
    render(<MeasureInformation />);
    const measurementPeriodStartNode = getByTestId("measurement-period-start");
    const measurementPeriodStartInput = within(
      measurementPeriodStartNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.type(measurementPeriodStartInput, "12/07/200");
    await act(async () => {
      await waitFor(() =>
        expect(measurementPeriodStartInput.value).toBe("12/07/200")
      );
    });
    const measurementPeriodEndNode = getByTestId("measurement-period-end");
    const measurementPeriodEndInput = within(
      measurementPeriodEndNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.type(measurementPeriodEndInput, "12/07/2008");
    await waitFor(() =>
      expect(measurementPeriodEndInput.value).toBe("12/07/2008")
    );

    const createBtn = getByTestId("measurement-information-save-button");
    expect(createBtn).toBeInTheDocument();
    expect(createBtn).toBeDisabled();
  });

  it("Check if measurement period save button is enabled when measurement period start and end dates pass all date checks", async () => {
    measure.measurementPeriodEnd = null;
    measure.measurementPeriodStart = null;
    render(<MeasureInformation />);
    const measurementPeriodStartNode = getByTestId("measurement-period-start");
    const measurementPeriodStartInput = within(
      measurementPeriodStartNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.type(measurementPeriodStartInput, "12/07/2000");
    expect(measurementPeriodStartInput.value).toBe("12/07/2000");
    const measurementPeriodEndNode = getByTestId("measurement-period-end");
    const measurementPeriodEndInput = within(
      measurementPeriodEndNode
    ).getByRole("textbox") as HTMLInputElement;
    userEvent.type(measurementPeriodEndInput, "12/07/2009");
    expect(measurementPeriodEndInput.value).toBe("12/07/2009");

    const createBtn = getByTestId("measurement-information-save-button");
    expect(createBtn).toBeInTheDocument();
    expect(createBtn).toBeEnabled();
  });

  it("saving measurement information successfully and displaying success message", async () => {
    serviceApiMock = {
      updateMeasure: jest.fn().mockResolvedValueOnce({ status: 200 }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);
    measure.measurementPeriodEnd = null;
    measure.measurementPeriodStart = null;
    measure.measureName = "";

    render(<MeasureInformation />);

    await act(async () => {
      const input = await findByTestId("measure-name-input");
      fireEvent.change(input, {
        target: { value: "new value" },
      });

      const measurementPeriodStartNode = getByTestId(
        "measurement-period-start"
      );
      const measurementPeriodStartInput = within(
        measurementPeriodStartNode
      ).getByRole("textbox") as HTMLInputElement;
      userEvent.type(measurementPeriodStartInput, "12/07/2000");
      expect(measurementPeriodStartInput.value).toBe("12/07/2000");
      const measurementPeriodEndNode = getByTestId("measurement-period-end");
      const measurementPeriodEndInput = within(
        measurementPeriodEndNode
      ).getByRole("textbox") as HTMLInputElement;
      userEvent.type(measurementPeriodEndInput, "12/07/2009");
      expect(measurementPeriodEndInput.value).toBe("12/07/2009");

      const createBtn = getByTestId("measurement-information-save-button");
      expect(createBtn).toBeEnabled();
      act(() => {
        fireEvent.click(createBtn);
      });
    });

    await waitFor(
      () =>
        expect(
          getByTestId("measurement-information-success-message")
        ).toBeInTheDocument(),
      {
        timeout: 5000,
      }
    );
  });

  it("should display error message when updating failed", async () => {
    serviceApiMock = {
      updateMeasure: jest.fn().mockRejectedValueOnce({
        status: 500,
        response: { data: { message: "update failed" } },
      }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);

    measure.measureName = "";
    measure.measurementPeriodEnd = null;
    measure.measurementPeriodStart = null;
    render(<MeasureInformation />);

    await act(async () => {
      const input = await findByTestId("measure-name-input");
      fireEvent.change(input, {
        target: { value: "new value" },
      });

      const measurementPeriodStartNode = getByTestId(
        "measurement-period-start"
      );
      const measurementPeriodStartInput = within(
        measurementPeriodStartNode
      ).getByRole("textbox") as HTMLInputElement;
      userEvent.type(measurementPeriodStartInput, "12/07/2000");
      expect(measurementPeriodStartInput.value).toBe("12/07/2000");
      const measurementPeriodEndNode = getByTestId("measurement-period-end");
      const measurementPeriodEndInput = within(
        measurementPeriodEndNode
      ).getByRole("textbox") as HTMLInputElement;
      userEvent.type(measurementPeriodEndInput, "12/07/2009");
      expect(measurementPeriodEndInput.value).toBe("12/07/2009");

      const createBtn = getByTestId("measurement-information-save-button");
      expect(createBtn).toBeEnabled();
      act(() => {
        fireEvent.click(createBtn);
      });
    });

    await waitFor(
      () =>
        expect(
          getByTestId("measurement-information-error-message")
        ).toBeInTheDocument(),
      {
        timeout: 5000,
      }
    );
  });

  it("Should display a delete button if user is the owner of measure", async () => {
    render(<MeasureInformation />);
    const result: HTMLElement = await findByTestId("delete-measure-button");
    expect(result).toBeInTheDocument();
  });

  it("Should not display a delete button if user is not the owner of measure", () => {
    useOktaTokens.mockImplementationOnce(() => ({
      getUserName: () => "othertestuser@example.com", //#nosec
    }));
    render(<MeasureInformation />);
    const result: HTMLElement = queryByText("delete-measure-button");
    expect(result).toBeNull();
  });

  it("On delete click, user is presented with a confirm deletion screen", async () => {
    render(<MeasureInformation />);
    const result: HTMLElement = await findByTestId("delete-measure-button");
    fireEvent.click(result);
    const confirmDelete = getByTestId("delete-measure-button-2");
    expect(confirmDelete).toBeInTheDocument();
    const cancelDelete = await getByTestId("cancel-delete-measure-button");
    expect(cancelDelete).toBeInTheDocument();
  });

  it("Dialog closes when clicking cancel delete button", async () => {
    render(<MeasureInformation />);
    const result: HTMLElement = await findByTestId("delete-measure-button");
    act(() => {
      fireEvent.click(result);
    });
    const confirmDelete = getByTestId("delete-measure-button-2");
    expect(confirmDelete).toBeInTheDocument();
    const cancelDelete = getByTestId("cancel-delete-measure-button");
    expect(cancelDelete).toBeInTheDocument();
    act(() => {
      fireEvent.click(cancelDelete);
    });

    await waitFor(
      () => {
        expect(
          queryByTestId("cancel-delete-measure-button")
        ).not.toBeInTheDocument();
        expect(
          queryByTestId("delete-measure-button-2")
        ).not.toBeInTheDocument();
      },
      {
        timeout: 5000,
      }
    );
  });

  it("On successful delete action click, user can see success message and routes back to measures", async () => {
    serviceApiMock = {
      updateMeasure: jest.fn().mockResolvedValueOnce({ status: 200 }),
    } as unknown as MeasureServiceApi;
    await render(
      <MemoryRouter>
        <MeasureInformation />
      </MemoryRouter>
    );

    const result: HTMLElement = await findByTestId("delete-measure-button");
    act(() => {
      fireEvent.click(result);
    });
    const confirmDelete = await getByTestId("delete-measure-button-2");
    expect(confirmDelete).toBeInTheDocument();

    act(() => {
      fireEvent.click(confirmDelete);
    });

    await waitFor(
      () => {
        expect(
          getByTestId("edit-measure-information-success-text")
        ).toBeInTheDocument();
        expect(mockHistoryPush).toHaveBeenCalledWith("/measures");
      },
      {
        timeout: 5000,
      }
    );
  });

  it("On failed delete action click, user can see toast error pop up", async () => {
    render(<MeasureInformation />);
    const result: HTMLElement = await findByTestId("delete-measure-button");
    fireEvent.click(result);
    const confirmDelete = await getByTestId("delete-measure-button-2");
    expect(confirmDelete).toBeInTheDocument();
    const cancelDelete = await getByTestId("cancel-delete-measure-button");
    expect(cancelDelete).toBeInTheDocument();
    fireEvent.click(confirmDelete);

    await waitFor(
      () =>
        expect(
          getByTestId("edit-measure-information-generic-error-text")
        ).toBeInTheDocument(),
      {
        timeout: 5000,
      }
    );
    setTimeout(() => {
      expect(
        "edit-measure-information-generic-error-text"
      ).not.toBeInTheDocument();
    }, 5000);
  });

  it("On failed delete action, user can see toast with error message", async () => {
    serviceApiMock = {
      updateMeasure: jest.fn().mockRejectedValueOnce(axiosError),
    } as unknown as MeasureServiceApi;

    render(<MeasureInformation />);

    const deleteButton = await findByRole("button", { name: "Delete Measure" });
    userEvent.click(deleteButton);
    const confirmDeleteButton = await findByRole("button", {
      name: "Yes, Delete",
    });
    userEvent.click(confirmDeleteButton);
    await waitFor(
      () =>
        expect(
          getByTestId("edit-measure-information-generic-error-text")
        ).toBeInTheDocument(),
      {
        timeout: 5000,
      }
    );
    const toastErrorMessage = await findByText(
      "500: bad test oh no what happened"
    );
    expect(toastErrorMessage).toBeInTheDocument();
  });
});
