import { render, screen } from "@testing-library/react";
import * as React from "react";
import ShareDialog from "./ShareDialog";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../api/useMeasureServiceApi";
import { Measure, MeasureMetadata } from "@madie/madie-models";

const useMeasureServiceMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;
const mockMeasureServiceApi = {
  getSharedWithUserIds: jest.fn().mockResolvedValue(["userId1", "userId2"]),
} as unknown as MeasureServiceApi;

jest.mock("../../../api/useMeasureServiceApi", () =>
  jest.fn(() => mockMeasureServiceApi)
);

const testUser = "test user";
const mockMetaData = {
  description: "Test Description",
  copyright: "Test Copyright",
  disclaimer: "Test Disclaimer",
  rationale: "Test Rationale",
  guidance: "Test Guidance",
} as unknown as MeasureMetadata;

const mockMeasure = {
  id: "TestMeasureId",
  measureName: "The Measure for Testing",
  createdBy: testUser,
  measureMetaData: { ...mockMetaData },
  acls: [{ userId: "othertestuser@example.com", roles: ["SHARED_WITH"] }],
} as Measure;

describe("Create Share Dialog component", () => {
  const { getByTestId } = screen;

  beforeEach(() => {
    jest.resetModules();
    useMeasureServiceMock.mockReset().mockImplementation(() => {
      return mockMeasureServiceApi;
    });
  });

  it("should render share dialog", () => {
    render(
      <ShareDialog measure={mockMeasure} open={true} onClose={jest.fn()} />
    );
    expect(getByTestId("share-dialog")).toBeInTheDocument();
    expect(mockMeasureServiceApi.getSharedWithUserIds).toBeCalled();
  });

  it("should render share dialog and display corresponding message if the message is not yet shared with anyone", () => {
    mockMeasureServiceApi.getSharedWithUserIds = jest
      .fn()
      .mockResolvedValueOnce([]);

    render(
      <ShareDialog measure={mockMeasure} open={true} onClose={jest.fn()} />
    );
    expect(getByTestId("share-dialog")).toBeInTheDocument();
    expect(mockMeasureServiceApi.getSharedWithUserIds).toBeCalled();
    expect(
      screen.queryByText(
        "This measure is not yet shared with anyone. Enter the HARP ID of the user you'd like to share it with and click the (Add User) button above to share the measure."
      )
    ).toBeVisible();
  });

  it("should render share dialog and display error message if getSharedWithUserIds call throws an exception", async () => {
    const errorMessage =
      "Unable to retrieve users that the measure is shared with. If the error persists, please contact the help desk.";
    mockMeasureServiceApi.getSharedWithUserIds = jest
      .fn()
      .mockRejectedValue(new Error(errorMessage));

    render(
      <ShareDialog measure={mockMeasure} open={true} onClose={jest.fn()} />
    );

    expect(getByTestId("share-dialog")).toBeInTheDocument();
    expect(mockMeasureServiceApi.getSharedWithUserIds).toBeCalled();
    expect(await screen.findByText(errorMessage)).toBeVisible();
  });

  it("should render share dialog but not call getSharedWithUserIds if no measure is passed in to share dialog component", () => {
    mockMeasureServiceApi.getSharedWithUserIds = jest
      .fn()
      .mockResolvedValueOnce([]);
    render(<ShareDialog measure={null} open={true} onClose={jest.fn()} />);
    expect(getByTestId("share-dialog")).toBeInTheDocument();
    expect(mockMeasureServiceApi.getSharedWithUserIds).not.toBeCalled();
  });
});
