import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import ShareDialog, { SharedUser, convertDate } from "./ShareDialog";
import { MeasureServiceApi } from "@madie/madie-util";
import { Measure, MeasureMetadata } from "@madie/madie-models";

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
} as unknown as MeasureServiceApi;

jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
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
      />
    );
    const table = await screen.findByTestId("share-measure-tbl");

    expect(getByTestId("share-dialog")).toBeInTheDocument();
    expect(mockMeasureServiceApi.getSharedMeasures).toBeCalled();
    expect(mockMeasureServiceApi.getRecentMeasuresByMeasureSetId).toBeCalled();
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
    expect(await screen.findByText("Share With")).toBeInTheDocument();

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
    expect(await screen.findByText("Unshare")).toBeInTheDocument();
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
    expect(tableHeaders[1]).toHaveTextContent("User");
    expect(tableHeaders[2]).toHaveTextContent("Date Shared");
    //Expand row column has no header
    expect(tableHeaders[3]).toHaveTextContent("");

    const tableRows = table.querySelectorAll("tbody tr");

    expect(tableRows[0]).toHaveTextContent(mockMeasure1.measureName);
    expect(screen.queryByTestId(`expand-button-${mockMeasure1.id}`)).toBeNull();

    expect(tableRows[1]).toHaveTextContent(mockMeasure2.measureName);

    const expandButton = await screen.findByTestId(
      `expand-button-${mockMeasure2.id}`
    );
    fireEvent.click(expandButton);

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
      />
    );
    expect(await screen.findByTestId("share-dialog")).toBeInTheDocument();
    expect(await screen.findByText("Unshare")).toBeInTheDocument();

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
    expect(tableHeaders[1]).toHaveTextContent("User");
    expect(tableHeaders[2]).toHaveTextContent("Date Shared");
    //Expand row column has no header
    expect(tableHeaders[3]).toHaveTextContent("");

    const tableRows = table.querySelectorAll("tbody tr");

    expect(tableRows[0]).toHaveTextContent(mockMeasure1.measureName);
    expect(screen.queryByTestId(`expand-button-${mockMeasure1.id}`)).toBeNull();

    expect(tableRows[1]).toHaveTextContent(mockMeasure2.measureName);

    const expandButton = await screen.findByTestId(
      `expand-button-${mockMeasure2.id}`
    );
    fireEvent.click(expandButton);

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
          "The selected measure(s) are already shared with this user."
        )
      ).toBeInTheDocument();
    });
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
    expect(addUserBtn).toBeEnabled();

    fireEvent.click(addUserBtn);

    await waitFor(() => {
      expect(addUserBtn).toBeDisabled();
      expect(saveBtn).toBeDisabled();
      expect(harpIdInput.value).toBe("");
    });
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

    const expandButtonMockMeasure1 = screen.getByTestId(
      `expand-button-TestMeasureId1`
    );
    fireEvent.click(expandButtonMockMeasure1);

    const expandButtonMockMeasure2 = screen.getByTestId(
      `expand-button-TestMeasureId2`
    );
    fireEvent.click(expandButtonMockMeasure2);

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

    const expandButtonMockMeasure1 = screen.getByTestId(
      `expand-button-TestMeasureId1`
    );
    fireEvent.click(expandButtonMockMeasure1);

    const expandButtonMockMeasure2 = screen.getByTestId(
      `expand-button-TestMeasureId2`
    );
    fireEvent.click(expandButtonMockMeasure2);

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

    const expandButton = await screen.findByTestId(
      `expand-button-${mockMeasure2.id}`
    );
    fireEvent.click(expandButton);

    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(2);
    expect(checkBoxes[0]).toBeChecked();
    expect(checkBoxes[1]).toBeChecked();

    fireEvent.click(checkBoxes[0]);

    await waitFor(() => expect(checkBoxes[0]).not.toBeChecked());
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

    const expandButton = await screen.findByTestId(
      `expand-button-${mockMeasure2.id}`
    );
    fireEvent.click(expandButton);

    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(2);
    expect(checkBoxes[0]).toBeChecked();
    expect(checkBoxes[1]).toBeChecked();

    fireEvent.click(checkBoxes[0]);

    await waitFor(() => expect(checkBoxes[0]).not.toBeChecked());
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
