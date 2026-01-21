import * as React from "react";
import { render, screen } from "@testing-library/react";
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
    it("should display action buttons", () => {
      render(
        <MemoryRouter>
          <ActionCenter
            selectedTestCases={[
              { id: "1", validResource: true, title: "Test Case 1" },
            ]}
            canEdit={true}
            isQDM={false}
            isDraft={true}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId("delete-action-btn")).toBeInTheDocument();
      expect(
        screen.getByTestId("shift-test-case-dates-action-btn")
      ).toBeInTheDocument();
      expect(screen.getByTestId("clone-action-btn")).toBeInTheDocument();
      expect(screen.getByTestId("export-action-btn")).toBeInTheDocument();
    });

    it("shouldn't display shift test cases button when measure is versioned and EditTestsOnVersionedMeasures feature flag is true", () => {
      render(
        <MemoryRouter>
          <ActionCenter
            selectedTestCases={[
              { id: "1", validResource: true, title: "Test Case 1" },
            ]}
            canEdit={true}
            isQDM={false}
            isDraft={false}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId("delete-action-btn")).toBeInTheDocument();
      expect(
        screen.queryByTestId("shift-test-case-dates-action-btn")
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("clone-action-btn")).toBeInTheDocument();
      expect(screen.getByTestId("export-action-btn")).toBeInTheDocument();
    });

    it("should display action buttons based on selected valid test cases", () => {
      const selectedTestCase = [
        { id: "1", validResource: true, title: "Test Case 1" },
      ];
      render(
        <MemoryRouter>
          <ActionCenter
            selectedTestCases={selectedTestCase}
            canEdit={true}
            isQDM={false}
            isDraft={true}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId("delete-action-btn")).toBeEnabled();
      expect(
        screen.getByTestId("shift-test-case-dates-action-btn")
      ).toBeEnabled();
      expect(screen.getByTestId("clone-action-btn")).toBeEnabled();
      expect(screen.getByTestId("export-action-btn")).toBeEnabled();
    });

    it("should display action buttons based on selected invalid test cases", () => {
      const selectedTestCaseInvalid = [
        { id: "1", validResource: false, title: "Test Case 1" },
      ];
      render(
        <MemoryRouter>
          <ActionCenter
            selectedTestCases={selectedTestCaseInvalid}
            canEdit={true}
            isQDM={false}
            isDraft={true}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId("delete-action-btn")).toBeEnabled();
      expect(
        screen.getByTestId("shift-test-case-dates-action-btn")
      ).toBeEnabled();
      expect(screen.getByTestId("clone-action-btn")).toBeDisabled();
      expect(screen.getByTestId("export-action-btn")).toBeEnabled();
    });

    it("should show appropriate tooltips based on button states", async () => {
      const selectedTestCase = [
        { id: "1", validResource: true, title: "Test Case 1" },
      ];
      render(
        <MemoryRouter>
          <ActionCenter
            selectedTestCases={selectedTestCase}
            canEdit={true}
            isQDM={false}
            isDraft={true}
          />
        </MemoryRouter>
      );

      const deleteTooltip = await screen.findByTestId("delete-tooltip");
      expect(deleteTooltip).toHaveAttribute("aria-label", "Delete test case");

      const shiftTestCaseDatesTooltip = await screen.findByTestId(
        "shift-test-case-dates-tooltip"
      );
      expect(shiftTestCaseDatesTooltip).toHaveAttribute(
        "aria-label",
        "Shift test case dates"
      );

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

    it("should disable clone button when no test case is selected", () => {
      render(
        <MemoryRouter>
          <ActionCenter
            selectedTestCases={[]}
            canEdit={true}
            isQDM={false}
            isDraft={true}
          />
        </MemoryRouter>
      );

      const cloneBtn = screen.getByTestId("clone-action-btn");
      const cloneTooltip = screen.getByTestId("clone-tooltip");

      expect(cloneBtn).toBeDisabled();
      expect(cloneTooltip).toHaveAttribute(
        "aria-label",
        "Select a valid test case to clone"
      );
    });

    it("should disable clone button if test case title is 226 characters or more", () => {
      const longTitle = "A".repeat(226);
      const selectedTestCase = [
        { id: "1", validResource: true, title: longTitle },
      ];

      render(
        <MemoryRouter>
          <ActionCenter
            selectedTestCases={selectedTestCase}
            canEdit={true}
            isQDM={false}
            isDraft={true}
          />
        </MemoryRouter>
      );

      const cloneBtn = screen.getByTestId("clone-action-btn");
      const cloneTooltip = screen.getByTestId("clone-tooltip");

      expect(cloneBtn).toBeDisabled();
      expect(cloneTooltip).toHaveAttribute(
        "aria-label",
        "The test case title is too long to clone"
      );
    });

    it("should clone test case when clone button is clicked", () => {
      const selectedTestCase = [
        { id: "1", validResource: true, title: "Test Case 1" },
      ];
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

    it("should export transaction bundle for QI-Core", () => {
      const selectedTestCase = [
        { id: "1", validResource: true, title: "Test Case 1" },
      ];
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
      const selectedTestCase = [
        { id: "1", validResource: true, title: "Test Case 1" },
      ];
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
      const selectedTestCase = [
        { id: "1", validResource: true, title: "Test Case 1" },
      ];
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
            executeAllTestCases={true}
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
      const selectedTestCase = [
        { id: "1", validResource: true, title: "Test Case 1" },
      ];
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
            executeAllTestCases={true}
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
      const selectedTestCase = [
        { id: "1", executionStatus: "NA", title: "Test Case 1" },
      ];
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
            executeAllTestCases={false}
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

    it("should disable delete icon when test case is created before versioning on versioned measures", async () => {
      const selectedTestCase = [
        {
          id: "1",
          validResource: true,
          title: "Test Case 1",
          createdBeforeVersioning: true,
        },
      ];
      render(
        <MemoryRouter>
          <ActionCenter
            selectedTestCases={selectedTestCase}
            canEdit={true}
            isQDM={false}
            isDraft={false}
          />
        </MemoryRouter>
      );

      const deleteTooltip = await screen.findByTestId("delete-tooltip");
      expect(deleteTooltip).toHaveAttribute(
        "aria-label",
        "Test cases added prior to versioning cannot be deleted"
      );
      expect(screen.getByTestId("delete-action-btn")).toBeDisabled();
    });

    it("should disable delete icon when no test case is selected", async () => {
      render(
        <MemoryRouter>
          <ActionCenter
            selectedTestCases={[]}
            canEdit={true}
            isQDM={false}
            isDraft={false}
          />
        </MemoryRouter>
      );

      const deleteTooltip = await screen.findByTestId("delete-tooltip");
      expect(deleteTooltip).toHaveAttribute(
        "aria-label",
        "Select a test case to delete"
      );
      expect(screen.getByTestId("delete-action-btn")).toBeDisabled();
    });

    describe("Make JSON Match UI Button", () => {
      beforeEach(() => {
        (useFeatureFlags as jest.Mock).mockReturnValue({
          MakeJSONMatchUI: true,
        });
      });

      it("should not display Make JSON Match UI button when feature flag is off", () => {
        (useFeatureFlags as jest.Mock).mockReturnValue({
          MakeJSONMatchUI: false,
        });

        render(
          <MemoryRouter>
            <ActionCenter
              selectedTestCases={[
                { id: "1", validResource: true, title: "Test Case 1" },
              ]}
              canEdit={true}
              isQDM={false}
              isDraft={true}
            />
          </MemoryRouter>
        );

        expect(
          screen.queryByTestId("make-json-match-ui-action-btn")
        ).not.toBeInTheDocument();
      });

      it("should not display Make JSON Match UI button when user does not have edit access", () => {
        render(
          <MemoryRouter>
            <ActionCenter
              selectedTestCases={[
                { id: "1", validResource: true, title: "Test Case 1" },
              ]}
              canEdit={false}
              isQDM={false}
              isDraft={true}
            />
          </MemoryRouter>
        );

        expect(
          screen.queryByTestId("make-json-match-ui-action-btn")
        ).not.toBeInTheDocument();
      });

      it("should not display Make JSON Match UI button for QDM measures", () => {
        render(
          <MemoryRouter>
            <ActionCenter
              selectedTestCases={[
                { id: "1", validResource: true, title: "Test Case 1" },
              ]}
              canEdit={true}
              isQDM={true}
              isDraft={true}
            />
          </MemoryRouter>
        );

        expect(
          screen.queryByTestId("make-json-match-ui-action-btn")
        ).not.toBeInTheDocument();
      });

      it("should display Make JSON Match UI button for QI-Core measures when feature flag is enabled and user has edit access", () => {
        render(
          <MemoryRouter>
            <ActionCenter
              selectedTestCases={[
                { id: "1", validResource: true, title: "Test Case 1" },
              ]}
              canEdit={true}
              isQDM={false}
              isDraft={true}
            />
          </MemoryRouter>
        );

        expect(
          screen.getByTestId("make-json-match-ui-action-btn")
        ).toBeInTheDocument();
      });

      it("should enable Make JSON Match UI button when one test case is selected", () => {
        render(
          <MemoryRouter>
            <ActionCenter
              selectedTestCases={[
                { id: "1", validResource: true, title: "Test Case 1" },
              ]}
              canEdit={true}
              isQDM={false}
              isDraft={true}
            />
          </MemoryRouter>
        );

        const makeJsonMatchUiBtn = screen.getByTestId(
          "make-json-match-ui-action-btn"
        );
        expect(makeJsonMatchUiBtn).toBeEnabled();
      });

      it("should enable Make JSON Match UI button when multiple test cases are selected", () => {
        render(
          <MemoryRouter>
            <ActionCenter
              selectedTestCases={[
                { id: "1", validResource: true, title: "Test Case 1" },
                { id: "2", validResource: true, title: "Test Case 2" },
              ]}
              canEdit={true}
              isQDM={false}
              isDraft={true}
            />
          </MemoryRouter>
        );

        const makeJsonMatchUiBtn = screen.getByTestId(
          "make-json-match-ui-action-btn"
        );
        expect(makeJsonMatchUiBtn).toBeEnabled();
      });

      it("should disable Make JSON Match UI button when no test cases are selected", () => {
        render(
          <MemoryRouter>
            <ActionCenter
              selectedTestCases={[]}
              canEdit={true}
              isQDM={false}
              isDraft={true}
            />
          </MemoryRouter>
        );

        const makeJsonMatchUiBtn = screen.getByTestId(
          "make-json-match-ui-action-btn"
        );
        expect(makeJsonMatchUiBtn).toBeDisabled();
      });

      it("should show disabled tooltip when no test cases are selected", async () => {
        render(
          <MemoryRouter>
            <ActionCenter
              selectedTestCases={[]}
              canEdit={true}
              isQDM={false}
              isDraft={true}
            />
          </MemoryRouter>
        );

        const tooltip = await screen.findByTestId("make-json-match-ui-tooltip");
        expect(tooltip).toHaveAttribute(
          "aria-label",
          "Select a test case to make JSON (family/given) match UI (group/title)"
        );
      });

      it("should show enabled tooltip when test cases are selected", async () => {
        render(
          <MemoryRouter>
            <ActionCenter
              selectedTestCases={[
                { id: "1", validResource: true, title: "Test Case 1" },
              ]}
              canEdit={true}
              isQDM={false}
              isDraft={true}
            />
          </MemoryRouter>
        );

        const tooltip = await screen.findByTestId("make-json-match-ui-tooltip");
        expect(tooltip).toHaveAttribute(
          "aria-label",
          "Make JSON (family/given) match UI (group/title)"
        );
      });

      it("should work on draft measures", () => {
        render(
          <MemoryRouter>
            <ActionCenter
              selectedTestCases={[
                { id: "1", validResource: true, title: "Test Case 1" },
              ]}
              canEdit={true}
              isQDM={false}
              isDraft={true}
            />
          </MemoryRouter>
        );

        const makeJsonMatchUiBtn = screen.getByTestId(
          "make-json-match-ui-action-btn"
        );
        expect(makeJsonMatchUiBtn).toBeEnabled();
      });

      it("should work on versioned measures", () => {
        render(
          <MemoryRouter>
            <ActionCenter
              selectedTestCases={[
                { id: "1", validResource: true, title: "Test Case 1" },
              ]}
              canEdit={true}
              isQDM={false}
              isDraft={false}
            />
          </MemoryRouter>
        );

        const makeJsonMatchUiBtn = screen.getByTestId(
          "make-json-match-ui-action-btn"
        );
        expect(makeJsonMatchUiBtn).toBeEnabled();
      });

      it("should call setMakeJsonMatchUiDialogOpen when clicking Make JSON Match UI button", async () => {
        const mockSetMakeJsonMatchUiDialogOpen = jest.fn();
        render(
          <MemoryRouter>
            <ActionCenter
              selectedTestCases={[
                { id: "1", validResource: true, title: "Test Case 1" },
              ]}
              canEdit={true}
              isQDM={false}
              isDraft={true}
              setMakeJsonMatchUiDialogOpen={mockSetMakeJsonMatchUiDialogOpen}
            />
          </MemoryRouter>
        );

        const makeJsonMatchUiBtn = screen.getByTestId(
          "make-json-match-ui-action-btn"
        );
        await userEvent.click(makeJsonMatchUiBtn);

        expect(mockSetMakeJsonMatchUiDialogOpen).toHaveBeenCalledWith(true);
      });
    });
  });
});
