import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import ShareDialog from "./ShareDialog";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../api/useMeasureServiceApi";
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

const useMeasureServiceMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;
const mockMeasureServiceApi = {
  getSharedWithUserIds: jest.fn().mockResolvedValue({
    [mockMeasure1.id]: mockMeasure1.acls
      ? mockMeasure1.acls.map((acls) => acls.userId)
      : [],
    [mockMeasure2.id]: mockMeasure2.acls
      ? mockMeasure2.acls.map((acls) => acls.userId)
      : [],
  }),
  getMeasuresByMeasureSetId: jest.fn().mockImplementation((measureSetId) => {
    return measureSetId === "MeasureSetId1" ? [mockMeasure1] : [mockMeasure2];
  }),
} as unknown as MeasureServiceApi;

jest.mock("../../../api/useMeasureServiceApi", () =>
  jest.fn(() => mockMeasureServiceApi)
);

describe("Create Share Dialog component", () => {
  const { getByTestId } = screen;

  beforeEach(() => {
    jest.resetModules();
    useMeasureServiceMock.mockReset().mockImplementation(() => {
      return mockMeasureServiceApi;
    });
  });

  it("should render share dialog", async () => {
    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );
    const table = await screen.findByTestId("share-measure-tbl");

    expect(getByTestId("share-dialog")).toBeInTheDocument();
    expect(mockMeasureServiceApi.getSharedWithUserIds).toBeCalled();
  });

  it("should render share dialog and show not show HARP ID input if option is Unshare", async () => {
    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Unshare"}
        onClose={jest.fn()}
      />
    );
    expect(getByTestId("share-dialog")).toBeInTheDocument();
    expect(mockMeasureServiceApi.getSharedWithUserIds).toBeCalled();

    expect(screen.queryByTestId("harp-id-input")).toBeNull();
  });

  it("should display share measure table", async () => {
    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(getByTestId("share-dialog")).toBeInTheDocument();
    expect(mockMeasureServiceApi.getSharedWithUserIds).toBeCalled();

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
        `unshare-checkbox-${mockMeasure2.id}-${mockMeasure2.acls[0].userId}`
      )
    ).toBeNull();
    expect(
      screen.queryByTestId(
        `unshare-checkbox-${mockMeasure2.id}-${mockMeasure2.acls[1].userId}`
      )
    ).toBeNull();
  });

  it("should display unshare measure table", async () => {
    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Unshare"}
        onClose={jest.fn()}
      />
    );

    expect(getByTestId("share-dialog")).toBeInTheDocument();
    expect(mockMeasureServiceApi.getSharedWithUserIds).toBeCalled();

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
      await screen.findByTestId(
        `unshare-checkbox-${mockMeasure2.id}-${mockMeasure2.acls[0].userId}`
      )
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId(
        `unshare-checkbox-${mockMeasure2.id}-${mockMeasure2.acls[1].userId}`
      )
    ).toBeInTheDocument();
  });

  it("should not render share dialog if dialog is closed", () => {
    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={false}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );
    expect(screen.queryByTestId("share-dialog")).toBeNull();
  });

  it("should render share dialog and show 'Share With' title in dialog", async () => {
    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );
    expect(getByTestId("share-dialog")).toBeInTheDocument();
    expect(await screen.findByText("Share With")).toBeInTheDocument();
  });

  it("should render share dialog and show 'Unshare' title in dialog", async () => {
    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Unshare"}
        onClose={jest.fn()}
      />
    );
    expect(getByTestId("share-dialog")).toBeInTheDocument();
    expect(await screen.findByText("Unshare")).toBeInTheDocument();
  });

  it("should render share dialog and display error message if getSharedWithUserIds call throws an exception", async () => {
    const errorMessage =
      "Unable to retrieve users that the selected measure(s) is shared with. If the error persists, please contact the help desk.";
    mockMeasureServiceApi.getSharedWithUserIds = jest
      .fn()
      .mockRejectedValue(new Error(errorMessage));

    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );

    expect(getByTestId("share-dialog")).toBeInTheDocument();
    const table = await screen.findByTestId("share-measure-tbl");
    expect(mockMeasureServiceApi.getSharedWithUserIds).toBeCalled();
    expect(await screen.findByText(errorMessage)).toBeVisible();
  });

  it("should render share dialog but not call getSharedWithUserIds if no measure is passed in to share dialog component", () => {
    mockMeasureServiceApi.getSharedWithUserIds = jest
      .fn()
      .mockResolvedValueOnce([]);
    render(
      <ShareDialog
        measures={[]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );
    expect(getByTestId("share-dialog")).toBeInTheDocument();
    expect(mockMeasureServiceApi.getSharedWithUserIds).not.toBeCalled();
  });

  it("should render share dialog and show HARP ID input if option is Share With", async () => {
    render(
      <ShareDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        option={"Share With"}
        onClose={jest.fn()}
      />
    );
    expect(getByTestId("share-dialog")).toBeInTheDocument();
    const table = await screen.findByTestId("share-measure-tbl");
    expect(mockMeasureServiceApi.getSharedWithUserIds).toBeCalled();

    expect(await screen.findByTestId("harp-id-input")).toBeInTheDocument();
  });
});
