import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ActionCenter from "./ActionCenter";
import { Measure, MeasureSet, Model } from "@madie/madie-models";
import {
  checkUserCanEdit,
  useFeatureFlags,
  useOktaTokens,
} from "@madie/madie-util";
import useMeasureServiceApi from "../../../../api/useMeasureServiceApi";
import DeleteAction from "./deleteAction/DeleteAction";
import ExportAction from "./exportAction/ExportAction";
import DraftAction from "./draftAction/DraftAction";
import VersionAction from "./versionAction/VersionAction";
import AssociateCmsIdAction from "./associateCmsIdAction/AccociateCmsIdAction";

jest.mock("@madie/madie-util", () => ({
  checkUserCanEdit: jest.fn(),
  useFeatureFlags: jest.fn(),
  useOktaTokens: jest.fn(),
}));

jest.mock("../../../../api/useMeasureServiceApi");
const mockedUseMeasureServiceApi = useMeasureServiceApi as jest.MockedFunction<
  typeof useMeasureServiceApi
>;

const mockFeatureFlags = {
  MeasureListCheckboxes: true,
  associateMeasures: true,
};
const mockGetUserName = jest.fn(() => "test user");
const mockCheckUserCanEdit = jest.fn();

const mockMeasureSet = {
  cmsId: "124",
  measureSetId: "1-2-3-4",
  owner: "test user",
} as unknown as MeasureSet;

const qdmMeasure = {
  model: Model.QDM_5_6,
  measureSet: mockMeasureSet,
  measureSetId: "1-2-3-4",
  measureMetaData: { draft: true },
} as Measure;

const qiCoreMeasure = {
  model: Model.QICORE,
  measureSet: { ...mockMeasureSet, cmsId: null },
  measureSetId: "1-2-3-4",
  measureMetaData: { draft: true },
} as Measure;

describe("ActionCenter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useFeatureFlags as jest.Mock).mockReturnValue(mockFeatureFlags);
    (useOktaTokens as jest.Mock).mockReturnValue({
      getUserName: mockGetUserName,
    });
    (checkUserCanEdit as jest.Mock).mockImplementation(mockCheckUserCanEdit);
  });

  it("should render all action components", () => {
    mockCheckUserCanEdit.mockReturnValue(true);

    render(
      <ActionCenter
        measures={[qdmMeasure]}
        associateCmsId={jest.fn()}
        exportMeasure={jest.fn()}
        updateTargetMeasure={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        setDraftMeasureDialog={jest.fn()}
      />
    );

    expect(screen.getByTestId("action-center")).toBeInTheDocument();
    expect(screen.getByTestId("delete-action-btn")).toBeInTheDocument();
    expect(screen.getByTestId("export-action-btn")).toBeInTheDocument();
    expect(screen.getByTestId("draft-action-btn")).toBeInTheDocument();
    expect(screen.getByTestId("version-action-btn")).toBeInTheDocument();
    expect(
      screen.getByTestId("associate-cms-id-action-btn")
    ).toBeInTheDocument();
  });

  it("should call updateTargetMeasure and setCreateVersionDialog when version action is triggered", () => {
    const updateTargetMeasure = jest.fn();
    const setCreateVersionDialog = jest.fn();

    render(
      <ActionCenter
        measures={[qdmMeasure]}
        associateCmsId={jest.fn()}
        exportMeasure={jest.fn()}
        updateTargetMeasure={updateTargetMeasure}
        setCreateVersionDialog={setCreateVersionDialog}
        setDraftMeasureDialog={jest.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("version-action-btn"));

    expect(updateTargetMeasure).toHaveBeenCalledWith(qdmMeasure);
    expect(setCreateVersionDialog).toHaveBeenCalledWith({
      open: true,
      measureId: qdmMeasure.measureSetId,
    });
  });

  it("should call exportMeasure when export action is triggered", () => {
    const exportMeasure = jest.fn();
    const updateTargetMeasure = jest.fn();

    render(
      <ActionCenter
        measures={[qdmMeasure]}
        associateCmsId={jest.fn()}
        exportMeasure={exportMeasure}
        updateTargetMeasure={updateTargetMeasure}
        setCreateVersionDialog={jest.fn()}
        setDraftMeasureDialog={jest.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("export-action-btn"));

    expect(updateTargetMeasure).toHaveBeenCalledWith(qdmMeasure);
    expect(exportMeasure).toHaveBeenCalled();
  });

  it("should disable actions based on permissions", () => {
    mockCheckUserCanEdit.mockReturnValue(false);

    render(
      <ActionCenter
        measures={[qdmMeasure]}
        associateCmsId={jest.fn()}
        exportMeasure={jest.fn()}
        updateTargetMeasure={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        setDraftMeasureDialog={jest.fn()}
      />
    );

    expect(screen.getByTestId("delete-action-btn")).toBeDisabled();
    expect(screen.getByTestId("export-action-btn")).not.toBeDisabled();
    expect(screen.getByTestId("draft-action-btn")).toBeDisabled();
    expect(screen.getByTestId("version-action-btn")).toBeDisabled();
  });
});
