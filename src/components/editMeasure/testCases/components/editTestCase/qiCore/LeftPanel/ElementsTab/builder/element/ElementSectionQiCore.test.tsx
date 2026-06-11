import * as React from "react";
import "@testing-library/jest-dom";
import { describe, expect, test } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import ElementSectionQiCore from "./ElementSectionQiCore";
import {
  ExpandCollapseProvider,
  useExpandCollapse,
} from "./ExpandCollapseContext";
import { Formik } from "formik";

const { findByText, findByTestId, queryByTestId } = screen;

describe("TabHeadings", () => {
  test("TabHeading does in fact exist with specified text", async () => {
    const title = "FakeTitle";
    render(<ElementSectionQiCore title={title} />);
    const foundTitle = await findByText(title);
    expect(foundTitle).toBeInTheDocument();
  });

  test("Tab Headings display descriptions when clicked on, hides after", async () => {
    const title = "Demographics";
    const expectedId = `elements-header-content-${title}`;
    render(<ElementSectionQiCore title={title} />);
    const foundTitle = await findByText(title);
    // open
    expect(foundTitle).toBeInTheDocument();
    expect(queryByTestId(expectedId)).toBeNull();
    const expansionButton = await findByTestId(
      "elements-heading-expansion-button-Demographics"
    );
    act(() => {
      fireEvent.click(expansionButton);
    });
    const foundBody = await findByTestId(expectedId);
    expect(foundBody).toBeInTheDocument();
  });

  test("AddElementButton is rendered when canBeMultipleCardinality is true", async () => {
    const handleAddElementMock = jest.fn();
    render(
      <ElementSectionQiCore
        title="Test Title"
        canBeMultipleCardinality={true}
        handleAddElement={handleAddElementMock}
      />
    );
    const addButton = await screen.findByText("Add Element");
    expect(addButton).toBeInTheDocument();
    fireEvent.click(addButton);
    expect(handleAddElementMock).toHaveBeenCalled();
  });

  test("AddElementButton is not rendered when canBeMultipleCardinality is false", async () => {
    render(
      <ElementSectionQiCore
        title="Test Title"
        canBeMultipleCardinality={false}
        handleAddElement={jest.fn()}
      />
    );
    const addButton = screen.queryByText("Add Element");
    expect(addButton).not.toBeInTheDocument();
  });

  test("Required asterisk is displayed when required is true", async () => {
    render(<ElementSectionQiCore title="Required Title" required={true} />);
    const asterisk = await screen.findByText("*");
    expect(asterisk).toBeInTheDocument();
  });

  test("Required asterisk is not displayed when required is false", async () => {
    render(<ElementSectionQiCore title="Optional Title" required={false} />);
    const asterisk = screen.queryByText("*");
    expect(asterisk).not.toBeInTheDocument();
  });
});

// Helper component that triggers expand/collapse from context
const ExpandCollapseTestHarness = ({ title, startOpen = false }) => {
  const ctx = useExpandCollapse();
  return (
    <>
      <button data-testid="trigger-expand" onClick={() => ctx.expandAll()} />
      <button
        data-testid="trigger-collapse"
        onClick={() => ctx.collapseAll()}
      />
      <ElementSectionQiCore title={title} startOpen={startOpen}>
        <span data-testid="child-content">child</span>
      </ElementSectionQiCore>
    </>
  );
};

describe("ElementSectionQiCore with ExpandCollapseContext", () => {
  test("expandAll opens a collapsed section", async () => {
    render(
      <ExpandCollapseProvider>
        <ExpandCollapseTestHarness title="Name" startOpen={false} />
      </ExpandCollapseProvider>
    );
    expect(screen.queryByTestId("elements-header-content-Name")).toBeNull();
    act(() => {
      fireEvent.click(screen.getByTestId("trigger-expand"));
    });
    expect(
      await screen.findByTestId("elements-header-content-Name")
    ).toBeInTheDocument();
  });

  test("collapseAll closes an open section", async () => {
    render(
      <ExpandCollapseProvider>
        <ExpandCollapseTestHarness title="Name" startOpen={true} />
      </ExpandCollapseProvider>
    );
    expect(
      await screen.findByTestId("elements-header-content-Name")
    ).toBeInTheDocument();
    act(() => {
      fireEvent.click(screen.getByTestId("trigger-collapse"));
    });
    await waitFor(() => {
      expect(
        screen.queryByTestId("elements-header-content-Name")
      ).not.toBeInTheDocument();
    });
  });

  test("expandAll can be triggered multiple times consecutively", async () => {
    render(
      <ExpandCollapseProvider>
        <ExpandCollapseTestHarness title="Name" startOpen={false} />
      </ExpandCollapseProvider>
    );
    act(() => {
      fireEvent.click(screen.getByTestId("trigger-expand"));
    });
    expect(
      await screen.findByTestId("elements-header-content-Name")
    ).toBeInTheDocument();
    // Manually collapse via chevron
    act(() => {
      fireEvent.click(
        screen.getByTestId("elements-heading-expansion-button-Name")
      );
    });
    await waitFor(() => {
      expect(
        screen.queryByTestId("elements-header-content-Name")
      ).not.toBeInTheDocument();
    });
    // Expand All again should re-open
    act(() => {
      fireEvent.click(screen.getByTestId("trigger-expand"));
    });
    expect(
      await screen.findByTestId("elements-header-content-Name")
    ).toBeInTheDocument();
  });

  test("section still toggles via its own chevron when context is present", async () => {
    render(
      <ExpandCollapseProvider>
        <ExpandCollapseTestHarness title="Name" startOpen={false} />
      </ExpandCollapseProvider>
    );
    expect(screen.queryByTestId("elements-header-content-Name")).toBeNull();
    act(() => {
      fireEvent.click(
        screen.getByTestId("elements-heading-expansion-button-Name")
      );
    });
    expect(
      await screen.findByTestId("elements-header-content-Name")
    ).toBeInTheDocument();
  });

  test("section renders without error when used outside ExpandCollapseProvider", async () => {
    render(
      <ElementSectionQiCore title="Standalone" startOpen={false}>
        <span>content</span>
      </ElementSectionQiCore>
    );
    expect(screen.getByText("Standalone")).toBeInTheDocument();
  });
});

// Triggers expandPopulated from context, wrapped in Formik.
const ExpandPopulatedTestHarness = ({
  title,
  fieldPath,
  startOpen = false,
  values,
}) => {
  const ctx = useExpandCollapse();
  return (
    <Formik initialValues={values} onSubmit={jest.fn()}>
      <>
        <button
          data-testid="trigger-expand-populated"
          onClick={() => ctx.expandPopulated()}
        />
        <ElementSectionQiCore
          title={title}
          fieldPath={fieldPath}
          startOpen={startOpen}
        >
          <span data-testid="child-content">child</span>
        </ElementSectionQiCore>
      </>
    </Formik>
  );
};

describe("ElementSectionQiCore expandPopulated", () => {
  test("expandPopulated opens a collapsed section that has data", async () => {
    render(
      <ExpandCollapseProvider>
        <ExpandPopulatedTestHarness
          title="Value"
          fieldPath="Patient.value"
          startOpen={false}
          values={{ Patient: { value: "some data" } }}
        />
      </ExpandCollapseProvider>
    );
    expect(screen.queryByTestId("elements-header-content-Value")).toBeNull();
    act(() => {
      fireEvent.click(screen.getByTestId("trigger-expand-populated"));
    });
    expect(
      await screen.findByTestId("elements-header-content-Value")
    ).toBeInTheDocument();
  });

  test("expandPopulated closes an open section that has no data", async () => {
    render(
      <ExpandCollapseProvider>
        <ExpandPopulatedTestHarness
          title="Value"
          fieldPath="Patient.value"
          startOpen={true}
          values={{ Patient: { value: "" } }}
        />
      </ExpandCollapseProvider>
    );
    expect(
      await screen.findByTestId("elements-header-content-Value")
    ).toBeInTheDocument();
    act(() => {
      fireEvent.click(screen.getByTestId("trigger-expand-populated"));
    });
    await waitFor(() => {
      expect(
        screen.queryByTestId("elements-header-content-Value")
      ).not.toBeInTheDocument();
    });
  });

  test("expandPopulated treats nested non-empty objects as populated", async () => {
    render(
      <ExpandCollapseProvider>
        <ExpandPopulatedTestHarness
          title="Period"
          fieldPath="Patient.period"
          startOpen={false}
          values={{ Patient: { period: { start: "2020-01-01" } } }}
        />
      </ExpandCollapseProvider>
    );
    expect(screen.queryByTestId("elements-header-content-Period")).toBeNull();
    act(() => {
      fireEvent.click(screen.getByTestId("trigger-expand-populated"));
    });
    expect(
      await screen.findByTestId("elements-header-content-Period")
    ).toBeInTheDocument();
  });

  test("expandPopulated treats empty nested objects as not populated", async () => {
    render(
      <ExpandCollapseProvider>
        <ExpandPopulatedTestHarness
          title="Period"
          fieldPath="Patient.period"
          startOpen={true}
          values={{ Patient: { period: { start: "", end: "" } } }}
        />
      </ExpandCollapseProvider>
    );
    expect(
      await screen.findByTestId("elements-header-content-Period")
    ).toBeInTheDocument();
    act(() => {
      fireEvent.click(screen.getByTestId("trigger-expand-populated"));
    });
    await waitFor(() => {
      expect(
        screen.queryByTestId("elements-header-content-Period")
      ).not.toBeInTheDocument();
    });
  });
});

describe("ElementSectionQiCore delete button", () => {
  test("renders the delete button when canBeMultipleCardinality is true", async () => {
    render(
      <ElementSectionQiCore
        title="DeleteMe"
        canBeMultipleCardinality={true}
        handleDeleteElement={jest.fn()}
      />
    );
    expect(
      await screen.findByTestId("elements-delete-button-DeleteMe")
    ).toBeInTheDocument();
  });

  test("does not render the delete button when canBeMultipleCardinality is false", () => {
    render(
      <ElementSectionQiCore
        title="NoDelete"
        canBeMultipleCardinality={false}
        handleDeleteElement={jest.fn()}
      />
    );
    expect(
      screen.queryByTestId("elements-delete-button-NoDelete")
    ).not.toBeInTheDocument();
  });

  test("calls handleDeleteElement when the delete button is clicked", async () => {
    const handleDeleteElementMock = jest.fn();
    render(
      <ElementSectionQiCore
        title="ClickMe"
        canBeMultipleCardinality={true}
        handleDeleteElement={handleDeleteElementMock}
      />
    );
    const deleteButton = await screen.findByTestId(
      "elements-delete-button-ClickMe"
    );
    fireEvent.click(deleteButton);
    expect(handleDeleteElementMock).toHaveBeenCalledTimes(1);
  });

  test("disables the delete button when handleDeleteElement is not provided", async () => {
    render(
      <ElementSectionQiCore title="Disabled" canBeMultipleCardinality={true} />
    );
    const deleteButton = await screen.findByTestId(
      "elements-delete-button-Disabled"
    );
    expect(deleteButton).toBeDisabled();
  });

  test("Add Element and Delete buttons share a single right-aligned flex group", async () => {
    render(
      <ElementSectionQiCore
        title="SideBySide"
        canBeMultipleCardinality={true}
        showAddButton={true}
        handleAddElement={jest.fn()}
        handleDeleteElement={jest.fn()}
      />
    );
    const addButton = await screen.findByText("Add Element");
    const deleteButton = await screen.findByTestId(
      "elements-delete-button-SideBySide"
    );

    const addContainer = addButton.closest(".element-add-container");
    expect(addContainer).not.toBeNull();
    expect(addContainer!.parentElement).toBe(deleteButton.parentElement);
    expect(addContainer!.parentElement).toHaveStyle({ display: "flex" });
  });

  test("renders only the Add Element button when delete is not allowed", () => {
    render(
      <ElementSectionQiCore
        title="AddOnly"
        canBeMultipleCardinality={false}
        showAddButton={true}
        handleAddElement={jest.fn()}
      />
    );
    expect(screen.getByText("Add Element")).toBeInTheDocument();
    expect(
      screen.queryByTestId("elements-delete-button-AddOnly")
    ).not.toBeInTheDocument();
  });
});
