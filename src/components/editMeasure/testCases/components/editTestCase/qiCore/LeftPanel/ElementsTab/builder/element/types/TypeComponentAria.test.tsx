import React from "react";
import { render, screen } from "@testing-library/react";
import StringComponent from "./StringComponent";
import UriComponent from "./UriComponent";
import UrlComponent from "./UrlComponent";
import IntegerComponent from "./IntegerComponent";
import DecimalComponent from "./DecimalComponent";
import BooleanComponent from "./BooleanComponent";
import InstantComponent from "./InstantComponent";
import DateComponent from "./DateComponent";
import DateTimeComponent from "./DateTimeComponent";

describe.each([
  ["string", StringComponent],
  ["uri", UriComponent],
  ["url", UrlComponent],
  ["integer", IntegerComponent],
  ["decimal", DecimalComponent],
  ["boolean", BooleanComponent],
  ["instant", InstantComponent],
  ["date", DateComponent],
  ["dateTime", DateTimeComponent],
] as const)("%s validation accessibility", (_name, Component) => {
  it.each([undefined, false, "Invalid field value"])(
    "uses a boolean invalid state for error %s",
    (error) => {
      const { container } = render(
        <Component
          label="Value"
          canEdit
          fieldRequired={false}
          error={error}
          helperText={error || undefined}
          onChange={jest.fn()}
        />
      );
      const inputs = container.querySelectorAll("[aria-invalid]");
      expect(inputs.length).toBeGreaterThan(0);
      for (const input of inputs) {
        expect(["true", "false"]).toContain(input.getAttribute("aria-invalid"));
      }
      if (error) {
        expect(
          container.querySelector('[aria-invalid="true"]')
        ).toBeInTheDocument();
        expect(screen.getByText(error)).toBeInTheDocument();
      } else {
        expect(
          container.querySelector('[aria-invalid="true"]')
        ).not.toBeInTheDocument();
      }
    }
  );
});
