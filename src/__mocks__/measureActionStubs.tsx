import * as React from "react";

// Stubs for the shared action-center components that live in @madie/madie-util.
// Spread into a test's inline `jest.mock("@madie/madie-util", ...)` factory —
// import as `mockMeasureActionStubs` (the mock* prefix satisfies jest hoisting).
export const exportMeasure = jest.fn();
export const downloadZipFile = jest.fn();
export const parseErrorMessageFromBlob = jest.fn();
export const generateTimestampedFileName = jest.fn(
  (baseName: string, extension: string) => `${baseName}_timestamp.${extension}`
);
export const REVIEW_STATUS_OPTIONS = ["Ready", "In Progress", "Complete"];
export const EXPORT_FAILURE_MESSAGE =
  "Unable to Export measure. Package could not be generated. Please try again and contact the Help Desk if the problem persists.";
export const getNewestMeasureInstance = jest.fn(
  (measures: any[]) => measures?.[0]
);
export const ExportAction = ({ onClick }: any) => (
  <div>
    <button data-testid="export-action-btn">Export</button>
    <div
      role="menuitem"
      tabIndex={0}
      onClick={() => onClick && onClick("Executable Export")}
    >
      Executable Export
    </div>
    <div
      role="menuitem"
      tabIndex={0}
      onClick={() => onClick && onClick("Publishable Export")}
    >
      Publishable Export
    </div>
  </div>
);
export const ViewHRAction = ({ onClick }: any) => (
  <button data-testid="view-hr-action-btn" onClick={onClick}>
    View HR Action
  </button>
);
export const HistoryAction = ({ onClick }: any) => (
  <button data-testid="history-action-btn" onClick={onClick}>
    History Action
  </button>
);
export const CompareVersionsAction = ({ onClick }: any) => (
  <button data-testid="compare-versions-action-btn" onClick={onClick}>
    Compare Versions Action
  </button>
);
export const ExportDialog = ({ open }: any) =>
  open ? <div data-testid="export-dialog">Export Dialog</div> : null;
export const ExportIcon = () => <span data-testid="export-icon" />;
export const ViewHRModal = ({ open, onClose }: any) =>
  open ? (
    <div data-testid="view-human-readable-modal">
      View HR Modal
      <button data-testid="view-hr-close-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ) : null;
export const ViewMeasureHistoryDialog = ({ open, onClose }: any) =>
  open ? (
    <div data-testid="view-measure-history-dialog">
      Measure History
      <button data-testid="view-history-close-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ) : null;
export const CompareVersionsDialog = ({ open }: any) =>
  open ? (
    <div data-testid="compare-versions-dialog">Compare Versions</div>
  ) : null;
export const ShareAction = ({ measures, activeTab, onClick }: any) => {
  const options = activeTab === 1 ? ["Unshare"] : ["Share With", "Unshare"];
  return (
    <div>
      <button data-testid="share-action-btn" disabled={!measures?.length}>
        Share
      </button>
      {options.map((option: string) => (
        <div
          key={option}
          role="menuitem"
          tabIndex={0}
          onClick={() => onClick && onClick(option)}
        >
          {option}
        </div>
      ))}
    </div>
  );
};
export const ShareDialog = ({ open }: any) =>
  open ? <div data-testid="share-dialog">Share Dialog</div> : null;
export const TransferAction = ({ measures, onClick }: any) => (
  <button
    data-testid="transfer-action-btn"
    disabled={!measures?.length}
    onClick={() => onClick && onClick()}
  >
    Transfer
  </button>
);
export const TransferDialog = ({ open }: any) =>
  open ? <div data-testid="transfer-dialog">Transfer Dialog</div> : null;
export const ManageReviewDialog = ({ open }: any) =>
  open ? (
    <div data-testid="manage-review-dialog">Manage Review Dialog</div>
  ) : null;
