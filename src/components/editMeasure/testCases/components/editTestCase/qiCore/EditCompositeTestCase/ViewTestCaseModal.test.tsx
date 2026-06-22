import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ViewTestCaseModal from "./ViewTestCaseModal";

jest.mock("../../../editor/Editor", () => ({
  __esModule: true,
  default: ({ value, readOnly }: any) => (
    <textarea data-testid="json-editor" value={value} readOnly={readOnly} />
  ),
}));

jest.mock("../LeftPanel/ElementsTab/ElementsTab", () => ({
  __esModule: true,
  default: (props: any) => (
    <div
      data-testid="elements-tab-mock"
      data-active-tab={props.activeTab}
      data-can-edit={String(props.canEdit)}
    />
  ),
}));

jest.mock("../../../../util/QiCorePatientProvider", () => ({
  __esModule: true,
  QiCoreResourceProvider: ({ children }: any) => <>{children}</>,
}));

jest.mock("../../calculator/CalculatorDialog", () => ({
  __esModule: true,
  default: ({ open }: any) =>
    open ? <div data-testid="calculator-dialog-mock" /> : null,
}));

jest.mock("../../calculator/EditorCalculator", () => ({
  __esModule: true,
  default: ({ onClick }: any) => (
    <button data-testid="editor-calculator-button" onClick={onClick}>
      Calculator
    </button>
  ),
}));

jest.mock("../LeftPanel/EditorSearch", () => ({
  __esModule: true,
  default: () => <div data-testid="editor-search-mock" />,
}));

const testCase = {
  id: "tc-1",
  title: "Test Case Alpha",
  json: JSON.stringify({ resourceType: "Bundle", entry: [{}, {}] }),
} as any;

describe("ViewTestCaseModal", () => {
  it("renders shared left-panel tabs with added and json states", () => {
    render(
      <ViewTestCaseModal open={true} onClose={jest.fn()} testCase={testCase} />
    );

    expect(screen.getByText("Added (2)")).toBeInTheDocument();
    expect(screen.getByText("JSON")).toBeInTheDocument();
    expect(screen.queryByTestId("available-tab")).not.toBeInTheDocument();
    expect(screen.getByTestId("elements-tab-mock")).toHaveAttribute(
      "data-active-tab",
      "added"
    );
  });

  it("switches to json and exposes json search", async () => {
    render(
      <ViewTestCaseModal open={true} onClose={jest.fn()} testCase={testCase} />
    );

    await userEvent.click(screen.getByText("JSON"));

    expect(screen.getByTestId("json-editor")).toBeInTheDocument();
    expect(screen.getByTestId("editor-search-mock")).toBeInTheDocument();
  });

  it("opens calculator dialog from the shared tabs", async () => {
    render(
      <ViewTestCaseModal open={true} onClose={jest.fn()} testCase={testCase} />
    );

    await userEvent.click(screen.getByTestId("editor-calculator-button"));

    expect(screen.getByTestId("calculator-dialog-mock")).toBeInTheDocument();
  });

  it("uses an empty string when test case json is undefined", async () => {
    const undefinedJsonTestCase = {
      ...testCase,
      json: undefined,
    } as any;

    render(
      <ViewTestCaseModal
        open={true}
        onClose={jest.fn()}
        testCase={undefinedJsonTestCase}
      />
    );

    await userEvent.click(screen.getByText("JSON"));

    expect(screen.getByTestId("json-editor")).toHaveValue("");
  });

  it("uses an empty string when JSON.stringify throws", async () => {
    const stringifySpy = jest
      .spyOn(JSON, "stringify")
      .mockImplementationOnce(() => {
        throw new Error("stringify failed");
      });

    render(
      <ViewTestCaseModal open={true} onClose={jest.fn()} testCase={testCase} />
    );

    await userEvent.click(screen.getByText("JSON"));

    expect(screen.getByTestId("json-editor")).toHaveValue("");
    stringifySpy.mockRestore();
  });
});
