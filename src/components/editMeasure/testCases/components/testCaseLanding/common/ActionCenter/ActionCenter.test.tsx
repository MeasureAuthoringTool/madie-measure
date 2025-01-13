import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import ActionCenter from "./ActionCenter";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { useNavigate } from "react-router-dom";
// @ts-ignore
import { useFeatureFlags } from "@madie/madie-util";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

jest.mock("@madie/madie-util", () => ({
  useFeatureFlags: jest.fn(),
}));

describe("ActionCenter Component", () => {
  let mockNavigate: jest.Mock;

  beforeEach(() => {
    mockNavigate = jest.fn();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useFeatureFlags as jest.Mock).mockReturnValue({
      TestCaseListActionCenter: true,
      CopyTestCases: true,
    });
  });

  it("should render filter by with appropriate options and also a search input field, and call navigate on enter", () => {
    render(
      <MemoryRouter initialEntries={["testcasepage"]}>
        <ActionCenter selectedTestCases={[]} canEdit={false} isQDM={false} />
      </MemoryRouter>
    );

    const filterBySelect = screen.getByRole("combobox", {
      name: "Filter By",
    });
    expect(filterBySelect).toBeInTheDocument();
    userEvent.click(filterBySelect);

    const filterByOptions = screen.getAllByRole("option") as HTMLLIElement[];
    expect(filterByOptions[0]).toHaveTextContent("Case #");
    expect(filterByOptions[1]).toHaveTextContent("Status");
    expect(filterByOptions[2]).toHaveTextContent("Group");
    expect(filterByOptions[3]).toHaveTextContent("Title");
    expect(filterByOptions[4]).toHaveTextContent("Description");

    userEvent.click(filterByOptions[1]);

    const searchInput = screen.getByRole("textbox", { name: "Search" });
    expect(searchInput).toBeInTheDocument();
    const searchInputField = screen.getByTestId("test-case-list-search-input");
    userEvent.type(searchInputField, "test");
    userEvent.keyboard("{Enter}");
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining("filter=Status&search=test&page=1&limit=10")
    );

    userEvent.click(screen.getByTestId("test-cases-trigger-search"));
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining("filter=Status&search=test&page=1&limit=10")
    );

    userEvent.click(screen.getByTestId("test-cases-clear-search"));
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining("/"));
  });

  describe("Action Buttons", () => {
    it("should not display action buttons when the TestCaseListActionCenter feature flag is false", () => {
      (useFeatureFlags as jest.Mock).mockReturnValue({
        TestCaseListActionCenter: false,
      });

      render(
        <MemoryRouter>
          <ActionCenter selectedTestCases={[]} canEdit={false} isQDM={false} />
        </MemoryRouter>
      );

      expect(screen.queryByTestId("delete-action-btn")).not.toBeInTheDocument();
      expect(screen.queryByTestId("clone-action-btn")).not.toBeInTheDocument();
      expect(screen.queryByTestId("export-action-btn")).not.toBeInTheDocument();
    });

    it("should display action buttons when the TestCaseListActionCenter feature flag is true", () => {
      render(
        <MemoryRouter>
          <ActionCenter
            selectedTestCases={[{ id: "1", validResource: true }]}
            canEdit={true}
            isQDM={false}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId("delete-action-btn")).toBeInTheDocument();
      expect(screen.getByTestId("clone-action-btn")).toBeInTheDocument();
      expect(screen.getByTestId("export-action-btn")).toBeInTheDocument();
    });

    it("should display action buttons based on selected valid test cases", () => {
      const selectedTestCase = [{ id: "1", validResource: true }];
      render(
        <MemoryRouter>
          <ActionCenter
            selectedTestCases={selectedTestCase}
            canEdit={true}
            isQDM={false}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId("delete-action-btn")).toBeEnabled();
      expect(screen.getByTestId("clone-action-btn")).toBeEnabled();
      expect(screen.getByTestId("export-action-btn")).toBeEnabled();
    });

    it("should display action buttons based on selected invalid test cases", () => {
      const selectedTestCaseInvalid = [{ id: "1", validResource: false }];
      render(
        <MemoryRouter>
          <ActionCenter
            selectedTestCases={selectedTestCaseInvalid}
            canEdit={true}
            isQDM={false}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId("delete-action-btn")).toBeEnabled();
      expect(screen.getByTestId("clone-action-btn")).toBeDisabled();
      expect(screen.getByTestId("export-action-btn")).toBeEnabled();
    });

    it("should show appropriate tooltips based on button states", async () => {
      const selectedTestCase = [{ id: "1", validResource: true }];
      render(
        <MemoryRouter>
          <ActionCenter
            selectedTestCases={selectedTestCase}
            canEdit={true}
            isQDM={false}
          />
        </MemoryRouter>
      );

      const deleteTooltip = await screen.findByTestId("delete-tooltip");
      expect(deleteTooltip).toHaveAttribute("aria-label", "Delete test case");

      const cloneTooltip = await screen.findByTestId("clone-tooltip");
      expect(cloneTooltip).toHaveAttribute("aria-label", "Clone test case");

      const copyTooltip = await screen.findByTestId("copy-tooltip");
      expect(copyTooltip).toHaveAttribute(
        "aria-label",
        "Copy to another measure"
      );

      const exportTooltip = await screen.findByTestId("export-tooltip");
      expect(exportTooltip).toHaveAttribute("aria-label", "Export test cases");
    });

    it("should clone test case when clone button is clicked", () => {
      const selectedTestCase = [{ id: "1", validResource: true }];
      const onCloneTestCase = jest.fn();
      render(
        <MemoryRouter>
          <ActionCenter
            selectedTestCases={selectedTestCase}
            canEdit={true}
            isQDM={true}
            onCloneTestCase={onCloneTestCase}
          />
        </MemoryRouter>
      );

      const cloneBtn = screen.getByTestId("clone-action-btn");
      expect(cloneBtn).toBeEnabled();
      userEvent.click(cloneBtn);
      expect(onCloneTestCase).toBeCalled();
    });

    it("should not show copy test cases tooltips when feature flag is not on", async () => {
      (useFeatureFlags as jest.Mock).mockReturnValue({
        TestCaseListActionCenter: true,
        CopyTestCases: false,
      });
      const selectedTestCase = [{ id: "1", validResource: true }];
      const onCloneTestCase = jest.fn();
      render(
        <MemoryRouter>
          <ActionCenter
            selectedTestCases={selectedTestCase}
            canEdit={true}
            isQDM={true}
            onCloneTestCase={onCloneTestCase}
          />
        </MemoryRouter>
      );

      const copyTooltip = await screen.queryByTestId("copy-tooltip");
      expect(copyTooltip).not.toBeInTheDocument();
    });

    it("should export transaction bundle for QI-Core", () => {
      const selectedTestCase = [{ id: "1", validResource: true }];
      const setExportOptionsOpen = jest.fn();
      const exportTestCases = jest.fn();

      render(
        <MemoryRouter>
          <ActionCenter
            selectedTestCases={selectedTestCase}
            canEdit={true}
            isQDM={false}
            exportTestCases={exportTestCases}
            exportOptionsOpen={true}
            setExportOptionsOpen={setExportOptionsOpen}
          />
        </MemoryRouter>
      );

      const exportActionBtn = screen.getByTestId("export-action-icon");
      expect(exportActionBtn).toBeInTheDocument();
      userEvent.click(exportActionBtn);

      const exportTransactBundle = screen.getByTestId(
        "export-transaction-bundle"
      );
      expect(exportTransactBundle).toBeInTheDocument();
      userEvent.click(exportTransactBundle);
      expect(exportTestCases).toBeCalled();
    });

    it("should export collection bundle for QI-Core", () => {
      const selectedTestCase = [{ id: "1", validResource: true }];
      const setExportOptionsOpen = jest.fn();
      const exportTestCases = jest.fn();
      render(
        <MemoryRouter>
          <ActionCenter
            selectedTestCases={selectedTestCase}
            canEdit={true}
            isQDM={false}
            exportTestCases={exportTestCases}
            exportOptionsOpen={true}
            setExportOptionsOpen={setExportOptionsOpen}
          />
        </MemoryRouter>
      );

      const exportActionBtn = screen.getByTestId("export-action-icon");
      expect(exportActionBtn).toBeInTheDocument();
      userEvent.click(exportActionBtn);

      const exportCollectBundle = screen.getByTestId(
        "export-collection-bundle"
      );
      expect(exportCollectBundle).toBeInTheDocument();
      userEvent.click(exportCollectBundle);
      expect(exportTestCases).toBeCalled();
    });

    it("should export QRDA for QDM", () => {
      const selectedTestCase = [{ id: "1" }];
      const setExportOptionsOpen = jest.fn();
      const onExportQRDA = jest.fn();
      render(
        <MemoryRouter>
          <ActionCenter
            selectedTestCases={selectedTestCase}
            canEdit={true}
            isQDM={true}
            onExportQRDA={onExportQRDA}
            measureId="1"
            exportOptionsOpen={true}
            setExportOptionsOpen={setExportOptionsOpen}
          />
        </MemoryRouter>
      );

      const exportActionBtn = screen.getByTestId("export-action-icon");
      expect(exportActionBtn).toBeInTheDocument();
      userEvent.click(exportActionBtn);

      const exportQrda = screen.getByTestId("export-qrda-1");
      expect(exportQrda).toBeInTheDocument();
      userEvent.click(exportQrda);
      expect(onExportQRDA).toBeCalled();
    });

    it("should export Excel for QDM", () => {
      const selectedTestCase = [{ id: "1" }];
      const setExportOptionsOpen = jest.fn();
      const onExportExcel = jest.fn();
      render(
        <MemoryRouter>
          <ActionCenter
            selectedTestCases={selectedTestCase}
            canEdit={true}
            isQDM={true}
            onExportExcel={onExportExcel}
            measureId="1"
            exportOptionsOpen={true}
            setExportOptionsOpen={setExportOptionsOpen}
          />
        </MemoryRouter>
      );

      const exportActionBtn = screen.getByTestId("export-action-icon");
      expect(exportActionBtn).toBeInTheDocument();
      userEvent.click(exportActionBtn);

      const exportExcel = screen.getByTestId("export-excel-1");
      expect(exportExcel).toBeInTheDocument();
      userEvent.click(exportExcel);
      expect(onExportExcel).toBeCalled();
    });

    it("should disable export button if execution status is NA for QDM", async () => {
      const selectedTestCase = [{ id: "1", executionStatus: "NA" }];
      const setExportOptionsOpen = jest.fn();
      const onExportExcel = jest.fn();
      render(
        <MemoryRouter>
          <ActionCenter
            selectedTestCases={selectedTestCase}
            canEdit={true}
            isQDM={true}
            onExportExcel={onExportExcel}
            measureId="1"
            exportOptionsOpen={false}
            setExportOptionsOpen={setExportOptionsOpen}
          />
        </MemoryRouter>
      );

      const exportActionBtn = screen.getByTestId("export-action-icon");
      expect(exportActionBtn).toBeInTheDocument();

      const exportTooltip = await screen.findByTestId("export-tooltip");
      expect(exportTooltip).toHaveAttribute(
        "aria-label",
        "Test cases must be executed prior to exporting."
      );
    });
  });
});
