import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Measure, MeasureSet, Model } from "@madie/madie-models";
import ShareAction, {
  INVALID_SHARE_MEASURE,
  NOTHING_SELECTED,
  SHARED_TAB_INVALID_UNSHARE_MEASURE,
  SHARED_TAB_NOTHING_SELECTED,
  SHARED_TAB_UNSHARE,
  VALID_SHARE_MEASURE,
} from "./ShareAction";
import userEvent from "@testing-library/user-event";

const mockUser = "test user";
jest.mock("@madie/madie-util", () => ({
  useIsAdminTransferEnabled: () => false,
  useOktaTokens: () => ({
    getUserName: () => mockUser,
  }),
}));

const mockMeasureSet = {
  cmsId: "124",
  measureSetId: "1-2-3-4",
  owner: mockUser,
} as unknown as MeasureSet;

const qdmMeasure = {
  model: Model.QDM_5_6,
  measureSet: mockMeasureSet,
  measureSetId: "1-2-3-4",
} as Measure;

const qiCoreMeasure = {
  model: Model.QICORE,
  measureSet: { ...mockMeasureSet, cmsId: null },
  measureSetId: "1-2-3-4",
  measureMetaData: { draft: true },
} as unknown as Measure;

describe("ShareAction on Owned/All Measures tab", () => {
  it("Should disable share action btn if no measure selected", () => {
    render(
      <ShareAction
        measures={[]}
        onClick={() => {}}
        isOwner={true}
        isSharedWithUser={false}
        activeTab={0}
      />
    );
    expect(screen.getByTestId("share-action-btn")).toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should disable share action btn if user selects one measure but isOwner is false", () => {
    render(
      <ShareAction
        measures={[qiCoreMeasure]}
        onClick={() => {}}
        isOwner={false}
        isSharedWithUser={false}
        activeTab={0}
      />
    );
    expect(screen.getByTestId("share-action-btn")).toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      INVALID_SHARE_MEASURE
    );
  });

  it("Should enable share action btn if user selects one measure and isOwner is true", () => {
    render(
      <ShareAction
        measures={[qiCoreMeasure]}
        onClick={() => {}}
        isOwner={true}
        isSharedWithUser={false}
        activeTab={0}
      />
    );
    expect(screen.getByTestId("share-action-btn")).not.toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      VALID_SHARE_MEASURE
    );
  });

  it("Should enable share action btn if user selects two measures and isOwner is true", () => {
    const measure2 = { ...qiCoreMeasure, model: Model.QDM_5_6 };
    render(
      <ShareAction
        measures={[qdmMeasure, measure2]}
        onClick={() => {}}
        isOwner={true}
        isSharedWithUser={false}
        activeTab={0}
      />
    );
    expect(screen.getByTestId("share-action-btn")).not.toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      VALID_SHARE_MEASURE
    );
  });

  it("Should render both 'Share With' and 'Unshare' options on Owned Measures tab", () => {
    render(
      <ShareAction
        measures={[qiCoreMeasure]}
        onClick={() => {}}
        isOwner={true}
        isSharedWithUser={false}
        activeTab={0}
      />
    );
    const shareButton = screen.getByTestId("share-action-btn");
    fireEvent.click(shareButton);

    expect(screen.getByTestId("Share With-option")).toBeInTheDocument();
    expect(screen.getByTestId("Unshare-option")).toBeInTheDocument();
  });

  it("Should render both 'Share With' and 'Unshare' options on All Measures tab", () => {
    render(
      <ShareAction
        measures={[qiCoreMeasure]}
        onClick={() => {}}
        isOwner={true}
        isSharedWithUser={false}
        activeTab={2}
      />
    );
    const shareButton = screen.getByTestId("share-action-btn");
    fireEvent.click(shareButton);

    expect(screen.getByTestId("Share With-option")).toBeInTheDocument();
    expect(screen.getByTestId("Unshare-option")).toBeInTheDocument();
  });

  it("Should display menu items when the share action btn is clicked and call associated onClick method when 'Share With' menu item is clicked", () => {
    const onClick = jest.fn();
    render(
      <ShareAction
        measures={[qiCoreMeasure]}
        onClick={onClick}
        isOwner={true}
        isSharedWithUser={false}
        activeTab={0}
      />
    );
    const shareButton = screen.getByTestId("share-action-btn");

    expect(shareButton).not.toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      VALID_SHARE_MEASURE
    );

    fireEvent.click(shareButton);

    const shareWithMenuItem = screen.getByTestId("Share With-option");
    expect(shareWithMenuItem).toBeInTheDocument();

    fireEvent.click(screen.getByRole("menuitem", { name: "Share With" }));
    expect(onClick).toHaveBeenCalledWith("Share With");
  });

  it("Should display menu items when the share action btn is clicked and call associated onClick method when 'Unshare' menu item is clicked", () => {
    const onClick = jest.fn();
    render(
      <ShareAction
        measures={[qiCoreMeasure]}
        onClick={onClick}
        isOwner={true}
        isSharedWithUser={false}
        activeTab={0}
      />
    );
    const shareButton = screen.getByTestId("share-action-btn");

    expect(shareButton).not.toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      VALID_SHARE_MEASURE
    );

    fireEvent.click(shareButton);

    const unshareMenuItem = screen.getByTestId("Unshare-option");
    expect(unshareMenuItem).toBeInTheDocument();

    fireEvent.click(screen.getByRole("menuitem", { name: "Unshare" }));
    expect(onClick).toHaveBeenCalledWith("Unshare");
  });

  it("All Measures tab: Should disable share action btn if no measure selected", () => {
    render(
      <ShareAction
        measures={[]}
        onClick={() => {}}
        isOwner={true}
        isSharedWithUser={false}
        activeTab={2}
      />
    );
    expect(screen.getByTestId("share-action-btn")).toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("All Measures tab: Should enable share action btn if user selects one measure and isOwner is true", () => {
    render(
      <ShareAction
        measures={[qiCoreMeasure]}
        onClick={() => {}}
        isOwner={true}
        isSharedWithUser={false}
        activeTab={2}
      />
    );
    expect(screen.getByTestId("share-action-btn")).not.toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      VALID_SHARE_MEASURE
    );
  });

  it("All Measures tab: Should disable share action btn if user selects one measure but isOwner is false", () => {
    render(
      <ShareAction
        measures={[qiCoreMeasure]}
        onClick={() => {}}
        isOwner={false}
        isSharedWithUser={false}
        activeTab={2}
      />
    );
    expect(screen.getByTestId("share-action-btn")).toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      INVALID_SHARE_MEASURE
    );
  });
});

describe("ShareAction on Shared Measures tab", () => {
  it("Should disable share action btn if no measure selected", () => {
    render(
      <ShareAction
        measures={[]}
        onClick={() => {}}
        isOwner={false}
        isSharedWithUser={true}
        activeTab={1}
      />
    );
    expect(screen.getByTestId("share-action-btn")).toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      SHARED_TAB_NOTHING_SELECTED
    );
  });

  it("Should disable share action btn if user selects one measure but isSharedWithUser is false", () => {
    render(
      <ShareAction
        measures={[qiCoreMeasure]}
        onClick={() => {}}
        isOwner={false}
        isSharedWithUser={false}
        activeTab={1}
      />
    );
    expect(screen.getByTestId("share-action-btn")).toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      SHARED_TAB_INVALID_UNSHARE_MEASURE
    );
  });

  it("Should enable share action btn if user selects one measure", () => {
    render(
      <ShareAction
        measures={[qiCoreMeasure]}
        onClick={() => {}}
        isOwner={false}
        isSharedWithUser={true}
        activeTab={1}
      />
    );
    expect(screen.getByTestId("share-action-btn")).not.toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      SHARED_TAB_UNSHARE
    );
  });

  it("Should enable share action btn if user selects two measures", () => {
    const measure2 = { ...qiCoreMeasure, model: Model.QDM_5_6 };
    render(
      <ShareAction
        measures={[qdmMeasure, measure2]}
        onClick={() => {}}
        isOwner={true}
        isSharedWithUser={true}
        activeTab={1}
      />
    );
    expect(screen.getByTestId("share-action-btn")).not.toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      SHARED_TAB_UNSHARE
    );
  });

  it("Should render only 'Unshare' option on Shared Measures tab", () => {
    render(
      <ShareAction
        measures={[qiCoreMeasure]}
        onClick={() => {}}
        isOwner={false}
        isSharedWithUser={true}
        activeTab={1}
      />
    );
    const shareButton = screen.getByTestId("share-action-btn");
    fireEvent.click(shareButton);

    expect(screen.queryByTestId("Share With-option")).toBeNull();
    expect(screen.getByTestId("Unshare-option")).toBeInTheDocument();
  });

  it("Should display menu items when the share action btn is clicked and call associated onClick method when 'Unshare' menu item is clicked", () => {
    const onClick = jest.fn();

    render(
      <ShareAction
        measures={[qiCoreMeasure]}
        onClick={onClick}
        isOwner={false}
        isSharedWithUser={true}
        activeTab={1}
      />
    );
    const shareButton = screen.getByTestId("share-action-btn");

    expect(shareButton).not.toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      SHARED_TAB_UNSHARE
    );

    fireEvent.click(shareButton);

    const unshareMenuItem = screen.getByTestId("Unshare-option");
    expect(unshareMenuItem).toBeInTheDocument();

    fireEvent.click(screen.getByRole("menuitem", { name: "Unshare" }));
    expect(onClick).toHaveBeenCalledWith("Unshare");
  });
});

describe("508, keyboard and clickaway behavior", () => {
  it("closes on Tab and prevents default + stops propagation", async () => {
    const onClick = jest.fn();
    render(
      <ShareAction
        measures={[qiCoreMeasure]}
        onClick={onClick}
        isOwner={true}
        isSharedWithUser={false}
        activeTab={0}
      />
    );
    userEvent.click(screen.getByTestId("share-action-btn"));

    const menuList = await screen.findByRole("menu", { name: "" });

    fireEvent.keyDown(menuList, {
      key: "Tab",
      code: "Tab",
    });

    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("closes on Escape and stops propagation", async () => {
    const onClick = jest.fn();
    render(
      <ShareAction
        measures={[qiCoreMeasure]}
        onClick={onClick}
        isOwner={true}
        isSharedWithUser={false}
        activeTab={0}
      />
    );
    userEvent.click(screen.getByTestId("share-action-btn"));

    const menuList = await screen.findByRole("menu", { name: "" });

    fireEvent.keyDown(menuList, {
      key: "Escape", // #nosec
      code: "Escape",
    });

    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("closes when clicking away", async () => {
    const onClick = jest.fn();
    render(
      <ShareAction
        measures={[qiCoreMeasure]}
        onClick={onClick}
        isOwner={true}
        isSharedWithUser={false}
        activeTab={0}
      />
    );
    userEvent.click(screen.getByTestId("share-action-btn"));

    await screen.findByRole("menu");

    fireEvent.mouseDown(document.body);
    fireEvent.click(document.body);

    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });
  it("closes when hitting escape", async () => {
    const onClick = jest.fn();
    render(
      <ShareAction
        measures={[qiCoreMeasure]}
        onClick={onClick}
        isOwner={true}
        isSharedWithUser={false}
        activeTab={0}
      />
    );
    userEvent.click(screen.getByTestId("share-action-btn"));
    const menuList = await screen.findByRole("menu");

    fireEvent.keyDown(menuList, {
      key: "Escape",
      code: "Escape",
      bubbles: true,
    });
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });
});
