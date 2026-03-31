import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import ShareDialog, {
  SharedUser,
  convertDate,
  MEASURE_SHARING_EXPORT_SUCCESS,
  MEASURE_SHARING_EXPORT_ERROR,
  INVALID_HARP_ID_MESSAGE,
  HARP_ID_VALIDATION_FAILURE,
} from "./ShareDialog";
import { MeasureServiceApi } from "@madie/madie-util";
import { Measure, MeasureMetadata } from "@madie/madie-models";
import FileSaver from "file-saver";
import userEvent from "@testing-library/user-event";

jest.mock("file-saver", () => ({
  saveAs: jest.fn(),
}));

jest.mock("../../../utils/exportUtil", () => ({
  generateTimestampedFileName: jest.fn(
    () => "MeasureSharingExport_20260320_120000.xlsx"
  ),
}));

const testUser = "test user";
const mockMetaData = {
  description: "Test Description",
  copyright: "Test Copyright",
  disclaimer: "Test Disclaimer",
  rationale: "Test Rationale",
  guidance: "Test Guidance",
} as unknown as MeasureMetadata;

const mockMeasure1 = {
  id: "TestMeasureId1",
  measureName: "The Measure for Testing 1",
  createdBy: testUser,
  measureMetaData: { ...mockMetaData },
  measureSetId: "MeasureSetId1",
} as Measure;

const mockMeasure2 = {
  id: "TestMeasureId2",
  measureName: "The Measure for Testing 2",
  createdBy: testUser,
  measureMetaData: { ...mockMetaData },
  measureSetId: "MeasureSetId2",
  acls: [
    { userId: "userId1", roles: ["SHARED_WITH"] },
    { userId: "userId2", roles: ["SHARED_WITH"] },
  ],
} as Measure;

const today = new Date();
const yesterday = new Date();
yesterday.setDate(new Date().getDate() - 1);

const mockGetSharedMeasures = jest.fn().mockResolvedValue({
  [mockMeasure1.id]: mockMeasure1.acls
    ? mockMeasure1.acls.map(
        (acl) =>
          ({
            userId: acl.userId,
            performedAt: yesterday.toISOString(),
          } as unknown as SharedUser)
      )
    : [],
  [mockMeasure2.id]: mockMeasure2.acls
    ? mockMeasure2.acls.map(
        (acl) =>
          ({
            userId: acl.userId,
            performedAt: yesterday.toISOString(),
          } as unknown as SharedUser)
      )
    : [],
});

const mockGetRecentMeasuresByMeasureSetId = jest.fn((measureSetIds) => {
  const measures = [];
  if (measureSetIds.includes("MeasureSetId1")) {
    measures.push(mockMeasure1);
  }
  if (measureSetIds.includes("MeasureSetId2")) {
    measures.push(mockMeasure2);
  }
  return Promise.resolve(measures);
});

const mockShareMeasures = jest.fn().mockResolvedValue({
  [mockMeasure1.id]: mockMeasure1?.acls,
  [mockMeasure2.id]: mockMeasure2?.acls,
});

const mockUnshareMeasures = jest.fn().mockResolvedValue({
  [mockMeasure1.id]: mockMeasure1?.acls,
});

const mockMeasureServiceApi = {
  getSharedMeasures: jest.fn().mockResolvedValue({
    [mockMeasure1.id]: mockMeasure1.acls
      ? mockMeasure1.acls.map(
          (acl) =>
            ({
              userId: acl.userId,
              performedAt: yesterday.toISOString(),
            } as unknown as SharedUser)
        )
      : [],
    [mockMeasure2.id]: mockMeasure2.acls
      ? mockMeasure2.acls.map(
          (acl) =>
            ({
              userId: acl.userId,
              performedAt: yesterday.toISOString(),
            } as unknown as SharedUser)
        )
      : [],
  }),
  shareMeasures: mockShareMeasures,
  getRecentMeasuresByMeasureSetId: mockGetRecentMeasuresByMeasureSetId,
  unshareMeasures: mockUnshareMeasures,
  getSharedAccessReportForMeasures: jest
    .fn()
    .mockResolvedValue(
      new Blob(["test"], { type: "application/vnd.ms-excel" })
    ),
} as unknown as MeasureServiceApi;

const mockUserServiceApi = {
  getOwnerDetails: jest
    .fn()
    .mockResolvedValue({ harpId: "userId", userStatus: "ACTIVE" }),
  getBulkUserDetails: jest
    .fn()
    .mockImplementation((harpIds: string[]) =>
      Promise.resolve(
        harpIds.reduce(
          (acc, id) => ({ ...acc, [id]: { harpId: id, userStatus: "ACTIVE" } }),
          {}
        )
      )
    ),
};

jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
  useUserServiceApi: jest.fn(() => mockUserServiceApi),
  useOktaTokens: jest.fn(() => ({
    getAccessToken: () => "test.jwt",
    getUserName: () => "test user",
  })),
}));

describe("Create Share Dialog component", () => {
  const { getByTestId } = screen;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("should render share dialog", async () => {
    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
        onSave={jest.fn()}
        isAdmin={false}
      />
    );
    const table = await screen.findByTestId("share-measure-tbl");

    expect(getByTestId("share-dialog")).toBeInTheDocument();
    expect(mockMeasureServiceApi.getSharedMeasures).toBeCalled();
    expect(mockMeasureServiceApi.getRecentMeasuresByMeasureSetId).toBeCalled();

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();

    const exportButtons = screen.queryAllByText(/Export User List/i);
    expect(exportButtons.length).toBe(0);
    expect(screen.queryByText(/Export User List/i)).not.toBeInTheDocument();
  });

  it("should render share dialog but not call getSharedMeasures if no measure is passed in to share dialog component", async () => {
    mockMeasureServiceApi.getSharedMeasures = jest.fn().mockResolvedValue([]);
    mockMeasureServiceApi.getRecentMeasuresByMeasureSetId = jest
      .fn()
      .mockResolvedValue([]);

    render(
      <ShareDialog
        measures={[]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(mockMeasureServiceApi.getSharedMeasures).not.toBeCalled();
    expect(
      mockMeasureServiceApi.getRecentMeasuresByMeasureSetId
    ).not.toBeCalled();
  });

  it("should render share dialog and display error message if getSharedMeasures call throws an exception", async () => {
    const errorMessage =
      "Unable to retrieve users that the selected measure(s) is shared with. If the error persists, please contact the help desk.";

    mockMeasureServiceApi.getSharedMeasures = jest
      .fn()
      .mockRejectedValue(new Error(errorMessage));
    mockMeasureServiceApi.getRecentMeasuresByMeasureSetId = jest
      .fn()
      .mockResolvedValue([mockMeasure1, mockMeasure2]);

    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(mockMeasureServiceApi.getSharedMeasures).toBeCalled();
    expect(mockMeasureServiceApi.getRecentMeasuresByMeasureSetId).toBeCalled();
    expect(await screen.findByText(errorMessage)).toBeVisible();
  });

  it("should render share dialog and display response.data.message.error if getSharedMeasures call returns an error", async () => {
    const errorMessage =
      "Unable to retrieve users that the selected measure(s) is shared with. If the error persists, please contact the help desk.";

    mockMeasureServiceApi.getSharedMeasures = jest.fn().mockRejectedValue({
      response: {
        data: {
          message: errorMessage,
        },
      },
    });

    mockMeasureServiceApi.getRecentMeasuresByMeasureSetId = jest
      .fn()
      .mockResolvedValue([mockMeasure1, mockMeasure2]);

    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(mockMeasureServiceApi.getSharedMeasures).toBeCalled();
    expect(mockMeasureServiceApi.getRecentMeasuresByMeasureSetId).toBeCalled();
    expect(await screen.findByText(errorMessage)).toBeVisible();
  });

  it("should not render share dialog if dialog is closed", () => {
    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={false}
        option={"Share With"}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );
    expect(screen.queryByTestId("share-dialog")).toBeNull();
  });

  it("should render share dialog and show 'Share With' title in dialog", async () => {
    const mockOnClose = jest.fn();

    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Share With"}
        onClose={mockOnClose}
        onSave={jest.fn()}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(await screen.findByText("Share With...")).toBeInTheDocument();

    const cancelButton = screen.getByTestId("share-cancel-button");
    expect(cancelButton).toBeEnabled();

    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should render share dialog and show 'Unshare' title in dialog", async () => {
    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Unshare"}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(await screen.findByText("Unshare From...")).toBeInTheDocument();
  });

  it("should render share dialog and show HARP ID input if option is Share With", async () => {
    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    const table = await screen.findByTestId("share-measure-tbl");
    expect(mockMeasureServiceApi.getSharedMeasures).toBeCalled();
    expect(mockMeasureServiceApi.getRecentMeasuresByMeasureSetId).toBeCalled();

    expect(await screen.findByTestId("harp-id-input")).toBeInTheDocument();
  });

  it("should render share dialog and not show HARP ID input if option is Unshare", async () => {
    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Unshare"}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(mockMeasureServiceApi.getSharedMeasures).toBeCalled();
    expect(mockMeasureServiceApi.getRecentMeasuresByMeasureSetId).toBeCalled();

    expect(screen.queryByTestId("harp-id-input")).toBeNull();
  });

  it("should display share measure table", async () => {
    mockMeasureServiceApi.getSharedMeasures = jest.fn().mockResolvedValue({
      [mockMeasure1.id]: mockMeasure1.acls
        ? mockMeasure1.acls.map(
            (acl) =>
              ({
                userId: acl.userId,
                performedAt: yesterday.toISOString(),
              } as unknown as SharedUser)
          )
        : [],
      [mockMeasure2.id]: mockMeasure2.acls
        ? mockMeasure2.acls.map(
            (acl) =>
              ({
                userId: acl.userId,
                performedAt: yesterday.toISOString(),
              } as unknown as SharedUser)
          )
        : [],
    });

    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(mockMeasureServiceApi.getSharedMeasures).toBeCalled();
    expect(mockMeasureServiceApi.getRecentMeasuresByMeasureSetId).toBeCalled();

    const table = await screen.findByTestId("share-measure-tbl");
    const tableHeaders = table.querySelectorAll("thead th");

    expect(tableHeaders[0]).toHaveTextContent("Measure");
    expect(tableHeaders[1]).toHaveTextContent("Shared With");
    expect(tableHeaders[2]).toHaveTextContent("Date Shared");

    const tableRows = table.querySelectorAll("tbody tr");

    expect(tableRows[0]).toHaveTextContent(mockMeasure1.measureName);
    expect(screen.queryByTestId(`expand-button-${mockMeasure1.id}`)).toBeNull();

    expect(tableRows[1]).toHaveTextContent(mockMeasure2.measureName);

    //Only display checkboxes in subrows when the Unshare dialog is opened
    expect(
      screen.queryByTestId(
        `unshare-checkbox-${mockMeasure2.acls![0].userId}_${mockMeasure2.id}`
      )
    ).toBeNull();
    expect(
      screen.queryByTestId(
        `unshare-checkbox-${mockMeasure2.acls![1].userId}_${mockMeasure2.id}`
      )
    ).toBeNull();
  });

  it("should display share measure table", async () => {
    mockMeasureServiceApi.getSharedMeasures = jest.fn().mockResolvedValue({
      [mockMeasure1.id]: mockMeasure1.acls
        ? mockMeasure1.acls.map(
            (acl) =>
              ({
                userId: acl.userId,
                performedAt: yesterday.toISOString(),
              } as unknown as SharedUser)
          )
        : [],
      [mockMeasure2.id]: mockMeasure2.acls
        ? mockMeasure2.acls.map(
            (acl) =>
              ({
                userId: acl.userId,
                performedAt: yesterday.toISOString(),
              } as unknown as SharedUser)
          )
        : [],
    });
  });

  it("should render share dialog and show 'Unshare' title in dialog", async () => {
    const mockOnClose = jest.fn();

    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Unshare"}
        onClose={mockOnClose}
        onSave={jest.fn()}
        isAdmin={false}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    const exportButtons = screen.queryAllByText(/Export User List/i);
    expect(exportButtons.length).toBe(0);
    expect(screen.queryByText(/Export User List/i)).not.toBeInTheDocument();
    expect(await screen.findByText("Unshare From...")).toBeInTheDocument();

    const cancelButton = screen.getByTestId("share-cancel-button");
    expect(cancelButton).toBeEnabled();

    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should display unshare measure table", async () => {
    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Unshare"}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(mockMeasureServiceApi.getSharedMeasures).toBeCalled();
    expect(mockMeasureServiceApi.getRecentMeasuresByMeasureSetId).toBeCalled();

    const table = await screen.findByTestId("share-measure-tbl");
    const tableHeaders = table.querySelectorAll("thead th");

    expect(tableHeaders[0]).toHaveTextContent("Measure");
    expect(tableHeaders[1]).toHaveTextContent("Shared With");
    expect(tableHeaders[2]).toHaveTextContent("Date Shared");

    const tableRows = table.querySelectorAll("tbody tr");

    expect(tableRows[0]).toHaveTextContent(mockMeasure1.measureName);
    expect(screen.queryByTestId(`expand-button-${mockMeasure1.id}`)).toBeNull();

    expect(tableRows[1]).toHaveTextContent(mockMeasure2.measureName);

    expect(
      screen.queryByTestId(
        `unshare-checkbox-${mockMeasure2.acls![0].userId}_${mockMeasure2.id}`
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(
        `unshare-checkbox-${mockMeasure2.acls![1].userId}_${mockMeasure2.id}`
      )
    ).toBeInTheDocument();
  });

  it("should not add any user row to the grid for any measure if all measures already have that user", async () => {
    mockMeasureServiceApi.getSharedMeasures = jest.fn().mockResolvedValue({
      [mockMeasure1.id]: mockMeasure1.acls
        ? mockMeasure1.acls.map(
            (acl) =>
              ({
                userId: acl.userId,
                performedAt: yesterday.toISOString(),
              } as unknown as SharedUser)
          )
        : [],
      [mockMeasure2.id]: mockMeasure2.acls
        ? mockMeasure2.acls.map(
            (acl) =>
              ({
                userId: acl.userId,
                performedAt: yesterday.toISOString(),
              } as unknown as SharedUser)
          )
        : [],
    });
    mockMeasureServiceApi.getRecentMeasuresByMeasureSetId =
      mockGetRecentMeasuresByMeasureSetId;

    render(
      <ShareDialog
        measures={[mockMeasure2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(await screen.findByTestId("share-measure-tbl")).toBeInTheDocument();
    expect(mockMeasureServiceApi.getSharedMeasures).toBeCalled();
    expect(mockMeasureServiceApi.getRecentMeasuresByMeasureSetId).toBeCalled();

    const addUserBtn = await screen.findByTestId("add-user-btn");
    expect(addUserBtn).toBeDisabled();
    const saveBtn = await screen.findByTestId("share-save-button");
    expect(saveBtn).toBeDisabled();
    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;
    expect(harpIdInput).toBeInTheDocument();

    fireEvent.change(harpIdInput, { target: { value: "userId1" } });
    expect(harpIdInput.value).toBe("userId1");
    expect(addUserBtn).toBeEnabled();

    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(saveBtn).toBeDisabled();
      expect(harpIdInput.value).toBe("userId1");
      expect(
        screen.getByText(
          "The selected measure(s) are already shared with the entered user(s)."
        )
      ).toBeInTheDocument();
    });
  });

  it("should show field-error when HARP ID is not a MADiE user", async () => {
    mockUserServiceApi.getBulkUserDetails.mockRejectedValueOnce({
      response: { status: 400 },
    });

    render(
      <ShareDialog
        measures={[mockMeasure1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();

    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;
    const addUserBtn = await screen.findByTestId("add-user-btn");

    fireEvent.change(harpIdInput, { target: { value: "invalidUser" } });
    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(screen.getByText(INVALID_HARP_ID_MESSAGE)).toBeInTheDocument();
    });
  });

  it("should show toast error when HARP ID validation fails due to a non-400 error", async () => {
    mockUserServiceApi.getBulkUserDetails.mockRejectedValueOnce({
      response: { status: 500 },
    });

    render(
      <ShareDialog
        measures={[mockMeasure1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();

    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;
    const addUserBtn = await screen.findByTestId("add-user-btn");

    fireEvent.change(harpIdInput, { target: { value: "someUser" } });
    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(screen.getByText(HARP_ID_VALIDATION_FAILURE)).toBeInTheDocument();
    });
  });

  it("should show field-error when HARP ID belongs to an inactive MADiE user", async () => {
    mockUserServiceApi.getBulkUserDetails.mockResolvedValueOnce({
      inactiveUser: { harpId: "inactiveUser", userStatus: "DEACTIVATED" },
    });

    render(
      <ShareDialog
        measures={[mockMeasure1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();

    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;
    const addUserBtn = await screen.findByTestId("add-user-btn");

    fireEvent.change(harpIdInput, { target: { value: "inactiveUser" } });
    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(
        screen.getByText(
          "The provided HARP ID inactiveUser is not associated with an active MADiE user."
        )
      ).toBeInTheDocument();
    });
  });

  it("should add user when HARP ID is an active MADiE user", async () => {
    mockUserServiceApi.getBulkUserDetails.mockResolvedValueOnce({
      validUser: { harpId: "validUser", userStatus: "ACTIVE" },
    });

    render(
      <ShareDialog
        measures={[mockMeasure1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();

    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;
    const addUserBtn = await screen.findByTestId("add-user-btn");
    const saveBtn = await screen.findByTestId("share-save-button");

    fireEvent.change(harpIdInput, { target: { value: "validUser" } });
    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(saveBtn).toBeEnabled();
      expect(harpIdInput.value).toBe("");
    });
  });

  it("should add valid user to table and show error for inactive user when mixed IDs are provided", async () => {
    mockUserServiceApi.getBulkUserDetails.mockResolvedValueOnce({
      activeUser: { harpId: "activeUser", userStatus: "ACTIVE" },
      inactiveUser: { harpId: "inactiveUser", userStatus: "DEACTIVATED" },
    });

    render(
      <ShareDialog
        measures={[mockMeasure1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-measure-tbl");

    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;
    const addUserBtn = await screen.findByTestId("add-user-btn");
    const saveBtn = await screen.findByTestId("share-save-button");

    fireEvent.change(harpIdInput, {
      target: { value: "activeUser,inactiveUser," },
    });
    expect(
      await screen.findByTestId("harp-chip-activeUser")
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId("harp-chip-inactiveUser")
    ).toBeInTheDocument();

    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(
        screen.getByText(
          "The provided HARP ID inactiveUser is not associated with an active MADiE user."
        )
      ).toBeInTheDocument();
      expect(saveBtn).toBeEnabled();
      expect(harpIdInput.value).toBe("");
    });

    expect(
      screen.getByTestId("TestMeasureId1 activeUser_userId")
    ).toHaveTextContent("activeUser");
  });

  it("should silently ignore duplicate IDs and process only new ones when mixed input is provided", async () => {
    mockUserServiceApi.getBulkUserDetails.mockResolvedValueOnce({
      userId3: { harpId: "userId3", userStatus: "ACTIVE" },
    });

    mockMeasureServiceApi.getSharedMeasures = jest.fn().mockResolvedValue({
      [mockMeasure2.id]: mockMeasure2.acls
        ? mockMeasure2.acls.map(
            (acl) =>
              ({
                userId: acl.userId,
                performedAt: yesterday.toISOString(),
              } as unknown as SharedUser)
          )
        : [],
    });
    mockMeasureServiceApi.getRecentMeasuresByMeasureSetId = jest
      .fn()
      .mockResolvedValue([mockMeasure2]);

    render(
      <ShareDialog
        measures={[mockMeasure2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-measure-tbl");

    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;
    const addUserBtn = await screen.findByTestId("add-user-btn");
    const saveBtn = await screen.findByTestId("share-save-button");

    fireEvent.change(harpIdInput, { target: { value: "userId1,userId3," } });
    expect(await screen.findByTestId("harp-chip-userId1")).toBeInTheDocument();
    expect(await screen.findByTestId("harp-chip-userId3")).toBeInTheDocument();

    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(
        screen.queryByText(
          "The selected measure(s) are already shared with the entered user(s)."
        )
      ).not.toBeInTheDocument();
      expect(saveBtn).toBeEnabled();
    });

    expect(
      screen.getByTestId("TestMeasureId2 userId3_userId")
    ).toHaveTextContent("userId3");
  });

  it("should not add any user row to the grid for any measure if a string with all whitespace is entered", async () => {
    render(
      <ShareDialog
        measures={[mockMeasure1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(await screen.findByTestId("share-measure-tbl")).toBeInTheDocument();
    expect(mockMeasureServiceApi.getSharedMeasures).toBeCalled();

    const addUserBtn = await screen.findByTestId("add-user-btn");
    expect(addUserBtn).toBeDisabled();
    const saveBtn = await screen.findByTestId("share-save-button");
    expect(saveBtn).toBeDisabled();
    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;
    expect(harpIdInput).toBeInTheDocument();

    const userIdWithAllwhiteSpace = "    ";

    fireEvent.change(harpIdInput, {
      target: { value: userIdWithAllwhiteSpace },
    });
    expect(harpIdInput.value).toBe(userIdWithAllwhiteSpace);
    expect(addUserBtn).toBeDisabled();
  });

  it("should add a user row to the grid for each measure that does not already have that user", async () => {
    mockMeasureServiceApi.getSharedMeasures = jest.fn().mockResolvedValue({
      [mockMeasure1.id]: mockMeasure1.acls
        ? mockMeasure1.acls.map(
            (acl) =>
              ({
                userId: acl.userId,
                performedAt: yesterday.toISOString(),
              } as unknown as SharedUser)
          )
        : [],
      [mockMeasure2.id]: mockMeasure2.acls
        ? mockMeasure2.acls.map(
            (acl) =>
              ({
                userId: acl.userId,
                performedAt: yesterday.toISOString(),
              } as unknown as SharedUser)
          )
        : [],
    });
    mockMeasureServiceApi.getRecentMeasuresByMeasureSetId =
      mockGetRecentMeasuresByMeasureSetId;
    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(await screen.findByTestId("share-measure-tbl")).toBeInTheDocument();
    expect(mockMeasureServiceApi.getSharedMeasures).toBeCalled();
    expect(mockMeasureServiceApi.getRecentMeasuresByMeasureSetId).toBeCalled();

    const addUserBtn = await screen.findByTestId("add-user-btn");
    expect(addUserBtn).toBeDisabled();
    const saveBtn = await screen.findByTestId("share-save-button");
    expect(saveBtn).toBeDisabled();
    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;
    expect(harpIdInput).toBeInTheDocument();

    fireEvent.change(harpIdInput, { target: { value: "userId3" } });
    expect(harpIdInput.value).toBe("userId3");
    expect(addUserBtn).toBeEnabled();

    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(addUserBtn).toBeDisabled();
      expect(saveBtn).toBeEnabled();
      expect(harpIdInput.value).toBe("");
    });

    //Row 1
    expect(screen.getByTestId("TestMeasureId1_measureName")).toHaveTextContent(
      "The Measure for Testing 1"
    );
    //Subrow 1 of Row 1
    expect(
      screen.getByTestId("TestMeasureId1 userId3_userId")
    ).toHaveTextContent("userId3");
    expect(
      screen.getByTestId("TestMeasureId1 userId3_dateShared")
    ).toHaveTextContent(convertDate(today.toUTCString()));

    //Row 2
    expect(screen.getByTestId("TestMeasureId2_measureName")).toHaveTextContent(
      "The Measure for Testing 2"
    );
    //Subrow 1 of Row 2
    expect(
      screen.getByTestId("TestMeasureId2 userId3_userId")
    ).toHaveTextContent("userId3");
    expect(
      screen.getByTestId("TestMeasureId2 userId3_dateShared")
    ).toHaveTextContent(convertDate(today.toUTCString()));
    //Subrow 2 of Row 2
    expect(
      screen.getByTestId("TestMeasureId2 userId1_userId")
    ).toHaveTextContent("userId1");
    expect(
      screen.getByTestId("TestMeasureId2 userId1_dateShared")
    ).toHaveTextContent(convertDate(yesterday.toUTCString()));
    //Subrow 3 of Row 2
    expect(
      screen.getByTestId("TestMeasureId2 userId2_userId")
    ).toHaveTextContent("userId2");
    expect(
      screen.getByTestId("TestMeasureId2 userId2_dateShared")
    ).toHaveTextContent(convertDate(yesterday.toUTCString()));
  });

  it("should add a user row to the grid for each measure that does not already have that user (after stripping all whitespace in HARP ID field)", async () => {
    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(await screen.findByTestId("share-measure-tbl")).toBeInTheDocument();
    expect(mockMeasureServiceApi.getSharedMeasures).toBeCalled();

    const addUserBtn = await screen.findByTestId("add-user-btn");
    expect(addUserBtn).toBeDisabled();
    const saveBtn = await screen.findByTestId("share-save-button");
    expect(saveBtn).toBeDisabled();
    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;
    expect(harpIdInput).toBeInTheDocument();

    const userIdWithExtraSpaces = " userId 3 ";

    fireEvent.change(harpIdInput, { target: { value: userIdWithExtraSpaces } });
    expect(harpIdInput.value).toBe(userIdWithExtraSpaces);
    expect(addUserBtn).toBeEnabled();

    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(addUserBtn).toBeDisabled();
      expect(saveBtn).toBeEnabled();
      expect(harpIdInput.value).toBe("");
    });
    //Row 1
    expect(screen.getByTestId("TestMeasureId1_measureName")).toHaveTextContent(
      "The Measure for Testing 1"
    );
    //Subrow 1 of Row 1
    expect(
      screen.getByTestId("TestMeasureId1 userId3_userId")
    ).toHaveTextContent("userId3");
    expect(
      screen.getByTestId("TestMeasureId1 userId3_dateShared")
    ).toHaveTextContent(convertDate(today.toUTCString()));

    //Row 2
    expect(screen.getByTestId("TestMeasureId2_measureName")).toHaveTextContent(
      "The Measure for Testing 2"
    );
    //Subrow 1 of Row 2
    expect(
      screen.getByTestId("TestMeasureId2 userId3_userId")
    ).toHaveTextContent("userId3");
    expect(
      screen.getByTestId("TestMeasureId2 userId3_dateShared")
    ).toHaveTextContent(convertDate(today.toUTCString()));
    //Subrow 2 of Row 2
    expect(
      screen.getByTestId("TestMeasureId2 userId1_userId")
    ).toHaveTextContent("userId1");
    expect(
      screen.getByTestId("TestMeasureId2 userId1_dateShared")
    ).toHaveTextContent(convertDate(yesterday.toUTCString()));
    //Subrow 3 of Row 2
    expect(
      screen.getByTestId("TestMeasureId2 userId2_userId")
    ).toHaveTextContent("userId2");
    expect(
      screen.getByTestId("TestMeasureId2 userId2_dateShared")
    ).toHaveTextContent(convertDate(yesterday.toUTCString()));
  });

  it("should add a user row to the grid for each measure that does not already have that user and save successfully after clicking Save button.", async () => {
    const mockOnSave = jest.fn();

    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
        onSave={mockOnSave}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(await screen.findByTestId("share-measure-tbl")).toBeInTheDocument();
    expect(mockMeasureServiceApi.getSharedMeasures).toBeCalled();

    const addUserBtn = await screen.findByTestId("add-user-btn");
    expect(addUserBtn).toBeDisabled();
    const saveBtn = await screen.findByTestId("share-save-button");
    expect(saveBtn).toBeDisabled();
    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;
    expect(harpIdInput).toBeInTheDocument();

    fireEvent.change(harpIdInput, { target: { value: "userId3" } });
    expect(harpIdInput.value).toBe("userId3");
    expect(addUserBtn).toBeEnabled();

    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(addUserBtn).toBeDisabled();
      expect(saveBtn).toBeEnabled();
      expect(harpIdInput.value).toBe("");
    });

    fireEvent.click(saveBtn);

    await waitFor(async () => {
      expect(mockMeasureServiceApi.shareMeasures).toBeCalled();
      expect(mockOnSave).toHaveBeenCalledWith({
        toastType: "success",
        toastMessage: "The measure(s) were successfully shared.",
        toastOpen: true,
      });
    });
  });

  it("should add a user row to the grid for each measure that does not already have that user and fail after clicking Save button.", async () => {
    const errorMessage =
      "Unable to share the selected measure(s) with the added users. If the error persists, please contact the help desk.";

    mockMeasureServiceApi.getSharedMeasures = jest.fn().mockResolvedValue({
      [mockMeasure1.id]: mockMeasure1.acls
        ? mockMeasure1.acls.map(
            (acl) =>
              ({
                userId: acl.userId,
                performedAt: yesterday.toISOString(),
              } as unknown as SharedUser)
          )
        : [],
      [mockMeasure2.id]: mockMeasure2.acls
        ? mockMeasure2.acls.map(
            (acl) =>
              ({
                userId: acl.userId,
                performedAt: yesterday.toISOString(),
              } as unknown as SharedUser)
          )
        : [],
    });
    mockMeasureServiceApi.getRecentMeasuresByMeasureSetId =
      mockGetRecentMeasuresByMeasureSetId;
    mockMeasureServiceApi.shareMeasures = jest
      .fn()
      .mockRejectedValue(new Error(errorMessage));

    const mockOnSave = jest.fn();

    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
        onSave={mockOnSave}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(await screen.findByTestId("share-measure-tbl")).toBeInTheDocument();
    expect(mockMeasureServiceApi.getSharedMeasures).toBeCalled();

    const addUserBtn = await screen.findByTestId("add-user-btn");
    expect(addUserBtn).toBeDisabled();
    const saveBtn = await screen.findByTestId("share-save-button");
    expect(saveBtn).toBeDisabled();
    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;
    expect(harpIdInput).toBeInTheDocument();

    fireEvent.change(harpIdInput, { target: { value: "userId3" } });
    expect(harpIdInput.value).toBe("userId3");
    expect(addUserBtn).toBeEnabled();

    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(addUserBtn).toBeDisabled();
      expect(saveBtn).toBeEnabled();
      expect(harpIdInput.value).toBe("");
    });

    fireEvent.click(saveBtn);

    await waitFor(async () => {
      expect(mockMeasureServiceApi.shareMeasures).toBeCalled();
      expect(mockOnSave).toHaveBeenCalledWith({
        toastType: "danger",
        toastMessage: errorMessage,
        toastOpen: true,
      });
    });
  });

  it("should successfully unshare a user from a measure.", async () => {
    const mockOnSave = jest.fn();

    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Unshare"}
        onClose={jest.fn()}
        onSave={mockOnSave}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(mockMeasureServiceApi.getSharedMeasures).toBeCalled();
    expect(mockMeasureServiceApi.getRecentMeasuresByMeasureSetId).toBeCalled();

    const saveBtn = await screen.findByTestId("share-save-button");
    expect(saveBtn).toBeDisabled();
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(3);
    expect(checkBoxes[0]).toBeChecked();
    expect(checkBoxes[1]).toBeChecked();
    expect(checkBoxes[2]).toBeChecked();

    fireEvent.click(checkBoxes[1]);

    await waitFor(() => expect(checkBoxes[1]).not.toBeChecked());
    expect(saveBtn).toBeEnabled();

    fireEvent.click(saveBtn);

    expect(await screen.findByText("Are you sure?")).toBeInTheDocument();

    const acceptBtn = await screen.findByTestId(
      "share-confirmation-dialog-accept-button"
    );
    expect(acceptBtn).toBeEnabled();

    fireEvent.click(acceptBtn);
    await waitFor(async () => {
      expect(mockMeasureServiceApi.unshareMeasures).toBeCalled();
      expect(mockOnSave).toHaveBeenCalledWith({
        toastType: "success",
        toastMessage: "The measure(s) were successfully unshared.",
        toastOpen: true,
      });
    });
  });

  it("should fail to unshare a user from a measure.", async () => {
    const errorMessage =
      "Unable to unshare the selected measure(s) with the users who were unchecked. If the error persists, please contact the help desk.";

    mockMeasureServiceApi.getSharedMeasures = jest.fn().mockResolvedValue({
      [mockMeasure1.id]: mockMeasure1.acls
        ? mockMeasure1.acls.map(
            (acl) =>
              ({
                userId: acl.userId,
                performedAt: yesterday.toISOString(),
              } as unknown as SharedUser)
          )
        : [],
      [mockMeasure2.id]: mockMeasure2.acls
        ? mockMeasure2.acls.map(
            (acl) =>
              ({
                userId: acl.userId,
                performedAt: yesterday.toISOString(),
              } as unknown as SharedUser)
          )
        : [],
    });
    mockMeasureServiceApi.getRecentMeasuresByMeasureSetId =
      mockGetRecentMeasuresByMeasureSetId;
    mockMeasureServiceApi.unshareMeasures = jest
      .fn()
      .mockRejectedValue(new Error(errorMessage));

    const mockOnSave = jest.fn();

    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Unshare"}
        onClose={jest.fn()}
        onSave={mockOnSave}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(mockMeasureServiceApi.getSharedMeasures).toBeCalled();
    expect(mockMeasureServiceApi.getRecentMeasuresByMeasureSetId).toBeCalled();

    const saveBtn = await screen.findByTestId("share-save-button");
    expect(saveBtn).toBeDisabled();
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(3);
    expect(checkBoxes[0]).toBeChecked();
    expect(checkBoxes[1]).toBeChecked();
    expect(checkBoxes[2]).toBeChecked();

    fireEvent.click(checkBoxes[1]);

    await waitFor(() => expect(checkBoxes[1]).not.toBeChecked());
    expect(saveBtn).toBeEnabled();

    fireEvent.click(saveBtn);

    expect(await screen.findByText("Are you sure?")).toBeInTheDocument();

    const acceptBtn = await screen.findByTestId(
      "share-confirmation-dialog-accept-button"
    );
    expect(acceptBtn).toBeEnabled();

    fireEvent.click(acceptBtn);
    await waitFor(async () => {
      expect(mockMeasureServiceApi.unshareMeasures).toBeCalled();
      expect(mockOnSave).toHaveBeenCalledWith({
        toastType: "danger",
        toastMessage: errorMessage,
        toastOpen: true,
      });
    });
  });

  it("should create chips when comma is used as delimiter in HARP ID field", async () => {
    render(
      <ShareDialog
        measures={[mockMeasure1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();

    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;

    // Typing "user1,user2," creates chips for user1 and user2, input cleared
    fireEvent.change(harpIdInput, { target: { value: "user1,user2," } });

    expect(await screen.findByTestId("harp-chip-user1")).toBeInTheDocument();
    expect(await screen.findByTestId("harp-chip-user2")).toBeInTheDocument();
    expect(harpIdInput.value).toBe("");

    const addUserBtn = screen.getByTestId("add-user-btn");
    expect(addUserBtn).toBeEnabled();
  });

  it("should clear all chips and input value when clear button is clicked", async () => {
    render(
      <ShareDialog
        measures={[mockMeasure1]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();

    const harpIdInput = (await screen.findByTestId(
      "harp-id-input"
    )) as HTMLInputElement;

    fireEvent.change(harpIdInput, { target: { value: "user1,user2," } });
    expect(await screen.findByTestId("harp-chip-user1")).toBeInTheDocument();
    expect(await screen.findByTestId("harp-chip-user2")).toBeInTheDocument();
  });

  it("should toggle all user checkboxes when header select-all checkbox is clicked in Unshare mode", async () => {
    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Unshare"}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();

    // header checkbox + 2 sub-row checkboxes (mockMeasure2 has userId1, userId2)
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(3);

    // Initially all rows are selected
    expect(checkBoxes[0]).toBeChecked();
    expect(checkBoxes[1]).toBeChecked();
    expect(checkBoxes[2]).toBeChecked();

    // Click header to deselect all
    fireEvent.click(checkBoxes[0]);
    await waitFor(() => {
      expect(checkBoxes[0]).not.toBeChecked();
      expect(checkBoxes[1]).not.toBeChecked();
      expect(checkBoxes[2]).not.toBeChecked();
    });

    // Click header again to re-select all
    fireEvent.click(checkBoxes[0]);
    await waitFor(() => {
      expect(checkBoxes[0]).toBeChecked();
      expect(checkBoxes[1]).toBeChecked();
      expect(checkBoxes[2]).toBeChecked();
    });
  });

  it("should show header checkbox unchecked when only some rows are selected in Unshare mode", async () => {
    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Unshare"}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();

    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(3);

    // All checked initially
    expect(checkBoxes[0]).toBeChecked();

    // Uncheck one sub-row
    fireEvent.click(checkBoxes[1]);
    await waitFor(() => expect(checkBoxes[1]).not.toBeChecked());

    // Header should no longer be fully checked
    expect(checkBoxes[0]).not.toBeChecked();
    expect(checkBoxes[2]).toBeChecked();
  });
});
describe("UnshareFromMe Confirmation Dialog component", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("should render confirmation dialog only", async () => {
    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"UnshareFromMe"}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />
    );

    expect(screen.getByTestId("share-confirmation-dialog")).toBeInTheDocument();
    expect(screen.queryByTestId("share-dialog")).toBeNull();
  });

  it("should close Share dialog and call onClose when option is 'Share With'", async () => {
    const onCloseMock = jest.fn();

    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option="Share With"
        onClose={onCloseMock}
        onSave={jest.fn()}
      />
    );

    expect(screen.getByTestId("share-dialog")).toBeInTheDocument();
    expect(screen.queryByTestId("share-confirmation-dialog")).toBeNull();

    const cancelButton = screen.getByTestId("share-cancel-button");
    fireEvent.click(cancelButton);

    expect(onCloseMock).toHaveBeenCalled();
    expect(screen.queryByTestId("share-confirmation-dialog")).toBeNull();
  });

  it("should close Unshare dialog and call onClose when option is 'Unshare'", async () => {
    const onCloseMock = jest.fn();

    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option="Unshare"
        onClose={onCloseMock}
        onSave={jest.fn()}
      />
    );

    expect(screen.getByTestId("share-dialog")).toBeInTheDocument();
    expect(screen.queryByTestId("share-confirmation-dialog")).toBeNull();

    const cancelButton = screen.getByTestId("share-cancel-button");
    fireEvent.click(cancelButton);

    expect(onCloseMock).toHaveBeenCalled();
    expect(screen.queryByTestId("share-confirmation-dialog")).toBeNull();
  });

  it("should close confirmation dialog and call onClose when option is 'UnshareFromMe'", async () => {
    const onCloseMock = jest.fn();

    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option="UnshareFromMe"
        onClose={onCloseMock}
        onSave={jest.fn()}
      />
    );

    expect(screen.getByTestId("share-confirmation-dialog")).toBeInTheDocument();
    expect(screen.queryByTestId("share-dialog")).toBeNull();

    const cancelButton = screen.getByTestId(
      "share-confirmation-dialog-cancel-button"
    );
    fireEvent.click(cancelButton);

    expect(onCloseMock).toHaveBeenCalled();
    expect(screen.queryByTestId("share-dialog")).toBeNull();
  });

  it("should successfully unshare a user from a measure", async () => {
    const mockOnSave = jest.fn();
    mockMeasureServiceApi.unshareMeasures = mockUnshareMeasures;
    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option="UnshareFromMe"
        onClose={jest.fn()}
        onSave={mockOnSave}
      />
    );

    // Only the confirmation dialog is rendered
    expect(
      await screen.findByTestId("share-confirmation-dialog")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("share-dialog")).toBeNull();

    const acceptBtn = await screen.findByTestId(
      "share-confirmation-dialog-accept-button"
    );
    expect(acceptBtn).toBeEnabled();

    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(mockMeasureServiceApi.unshareMeasures).toBeCalled();
      expect(mockOnSave).toHaveBeenCalledWith({
        toastType: "success",
        toastMessage: "The measure(s) were successfully unshared.",
        toastOpen: true,
      });
    });
  });

  it("should fail to unshare a user from a measure with UnshareFromMe", async () => {
    const errorMessage =
      "Unable to unshare the selected measure(s) with the users who were unchecked. If the error persists, please contact the help desk.";

    mockMeasureServiceApi.unshareMeasures = jest
      .fn()
      .mockRejectedValueOnce(new Error(errorMessage));

    const mockOnSave = jest.fn();

    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option="UnshareFromMe"
        onClose={jest.fn()}
        onSave={mockOnSave}
      />
    );

    const acceptBtn = await screen.findByTestId(
      "share-confirmation-dialog-accept-button"
    );
    expect(acceptBtn).toBeEnabled();

    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(mockMeasureServiceApi.unshareMeasures).toBeCalled();
      expect(mockOnSave).toHaveBeenCalledWith({
        toastType: "danger",
        toastMessage: errorMessage,
        toastOpen: true,
      });
    });
  });

  it("should render warning content with measure names and current user", async () => {
    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option="UnshareFromMe"
        onClose={jest.fn()}
        onSave={jest.fn()}
        isAdmin={false}
      />
    );

    const confirmationDialog = await screen.findByTestId(
      "share-confirmation-dialog"
    );
    expect(confirmationDialog).toBeInTheDocument();

    // Check the warning text
    expect(screen.getByText("You are about to unshare")).toBeInTheDocument();

    // Each measure name should appear
    expect(screen.getByText(mockMeasure1.measureName)).toBeInTheDocument();
    expect(screen.getByText(mockMeasure2.measureName)).toBeInTheDocument();

    // The current user should appear in the list
    const userListItems = screen.getAllByRole("listitem");
    expect(userListItems.length).toBe(2);
    expect(userListItems[0]).toHaveTextContent("test user");
    expect(userListItems[1]).toHaveTextContent("test user");
  });
});

describe("Export user list", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMeasureServiceApi.getSharedMeasures = jest.fn().mockResolvedValue({
      [mockMeasure1.id]: [],
      [mockMeasure2.id]: mockMeasure2.acls
        ? mockMeasure2.acls.map(
            (acl) =>
              ({
                userId: acl.userId,
                performedAt: yesterday.toISOString(),
              } as unknown as SharedUser)
          )
        : [],
    });
    mockMeasureServiceApi.getRecentMeasuresByMeasureSetId =
      mockGetRecentMeasuresByMeasureSetId;
    mockMeasureServiceApi.getSharedAccessReportForMeasures = jest
      .fn()
      .mockResolvedValue(
        new Blob(["test"], { type: "application/vnd.ms-excel" })
      );
  });

  it("should export the user list with correct measure ids and save the file on success", async () => {
    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
        onSave={jest.fn()}
        isAdmin={true}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    // wait for the table to load so sharedMeasures state is populated
    await screen.findByTestId("share-measure-tbl");

    const exportButton = await screen.findByText(/Export User List/i);
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(
        mockMeasureServiceApi.getSharedAccessReportForMeasures
      ).toHaveBeenCalledWith([mockMeasure1.id, mockMeasure2.id]);
      expect(FileSaver.saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        "MeasureSharingExport_20260320_120000.xlsx"
      );
    });
    expect(
      screen.getByText(MEASURE_SHARING_EXPORT_SUCCESS)
    ).toBeInTheDocument();
  });

  it("should show error toast when export user list fails", async () => {
    mockMeasureServiceApi.getSharedAccessReportForMeasures = jest
      .fn()
      .mockRejectedValue(new Error("Export failed"));

    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
        onSave={jest.fn()}
        isAdmin={true}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-measure-tbl");

    const exportButton = await screen.findByText(/Export User List/i);
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(
        screen.getByText(MEASURE_SHARING_EXPORT_ERROR)
      ).toBeInTheDocument();
    });
    expect(FileSaver.saveAs).not.toHaveBeenCalled();
  });

  it("should export user list from unshare dialog", async () => {
    // Only render with mockMeasure2 which has shared users
    render(
      <ShareDialog
        measures={[mockMeasure2]}
        open={true}
        option={"Unshare"}
        onClose={jest.fn()}
        onSave={jest.fn()}
        isAdmin={true}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-measure-tbl");

    const exportButton = await screen.findByText(/Export User List/i);
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(
        mockMeasureServiceApi.getSharedAccessReportForMeasures
      ).toHaveBeenCalledWith([mockMeasure2.id]);
    });
    // verify toast
    expect(
      screen.getByText(MEASURE_SHARING_EXPORT_SUCCESS)
    ).toBeInTheDocument();
    userEvent.click(screen.getByTestId("ClearIcon"));
  });

  it("should not render Export User List button when isAdmin is false", async () => {
    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
        onSave={jest.fn()}
        isAdmin={false}
      />
    );

    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    await screen.findByTestId("share-measure-tbl");

    expect(screen.queryByText(/Export User List/i)).not.toBeInTheDocument();
    expect(
      mockMeasureServiceApi.getSharedAccessReportForMeasures
    ).not.toHaveBeenCalled();
  });
});
