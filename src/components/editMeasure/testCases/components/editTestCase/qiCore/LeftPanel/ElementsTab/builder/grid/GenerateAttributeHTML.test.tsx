import React from "react";
import { render, screen } from "@testing-library/react";
import GenerateAttributeHTML from "./GenerateAttributeHTML";

describe("GenerateAttributeHTML", () => {
  test("renders when keyPrefix is omitted", () => {
    render(<GenerateAttributeHTML value="test" />);
    expect(screen.getByText(/test/)).toBeInTheDocument();
    expect(screen.getByText(/test/)).toBeInTheDocument();
  });

  test("renders a simple key-value pair", () => {
    render(<GenerateAttributeHTML value="test" keyPrefix="simpleKey" />);
    expect(screen.getByText(/simpleKey:/)).toBeInTheDocument();
    expect(screen.getByText(/test/)).toBeInTheDocument();
  });

  test("renders a number value", () => {
    render(<GenerateAttributeHTML value={42} keyPrefix="test" />);
    expect(screen.getByText(/test:/)).toBeInTheDocument();
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  test("renders a boolean value", () => {
    render(<GenerateAttributeHTML value={true} keyPrefix="isActive" />);
    expect(screen.getByText(/isActive:/)).toBeInTheDocument();
    expect(screen.getByText(/true/)).toBeInTheDocument();
  });

  test("renders an array with indexed keys", () => {
    const data = ["item1", "item2"];
    render(<GenerateAttributeHTML value={data} keyPrefix="items" />);
    expect(screen.getByText(/items:/)).toBeInTheDocument();
    expect(screen.getByText(/item1/)).toBeInTheDocument();
    expect(screen.getByText(/item2/)).toBeInTheDocument();
  });

  test("renders a nested object", () => {
    const data = { level1: { level2: { key: "value" } } };
    render(<GenerateAttributeHTML value={data} keyPrefix="root" />);
    expect(screen.getByText(/level1:/)).toBeInTheDocument();
    expect(screen.getByText(/level2:/)).toBeInTheDocument();
    expect(screen.getByText(/key:/)).toBeInTheDocument();
    expect(screen.getByText(/value/)).toBeInTheDocument();
  });

  test("handles empty object", () => {
    render(<GenerateAttributeHTML value={{}} keyPrefix="empty" />);
    expect(screen.queryByText(/empty:/)).toBeInTheDocument();
  });

  test("handles null and undefined", () => {
    render(<GenerateAttributeHTML value={null} keyPrefix="nullKey" />);
    expect(screen.queryByText(/nullKey:/)).not.toBeInTheDocument();
    render(
      <GenerateAttributeHTML value={undefined} keyPrefix="undefinedKey" />
    );
    expect(screen.queryByText(/undefinedKey:/)).not.toBeInTheDocument();
  });

  test("returns null", () => {
    const { container } = render(
      <GenerateAttributeHTML value={Symbol("unsupported")} keyPrefix="symbol" />
    );
    expect(container.firstChild).toBeNull();
    render(<GenerateAttributeHTML value={() => {}} keyPrefix="function" />);
    expect(container.firstChild).toBeNull();
  });

  it("handles empty prefixes correctly", () => {
    const emptyPrefixData = {
      level1: {
        level2: {
          level3: "deep",
        },
      },
    };
    render(<GenerateAttributeHTML value={emptyPrefixData} keyPrefix="" />);
    expect(screen.getByText("level1:")).toBeInTheDocument();
    expect(screen.getByText("level2:")).toBeInTheDocument();
    expect(screen.getByText("level3:")).toBeInTheDocument();
    expect(screen.getByText("deep")).toBeInTheDocument();
  });
});
