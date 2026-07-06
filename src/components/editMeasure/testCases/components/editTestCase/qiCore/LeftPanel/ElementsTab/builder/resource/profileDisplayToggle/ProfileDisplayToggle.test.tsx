import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfileDisplayToggle from "./ProfileDisplayToggle";
import { ProfileDisplayMode } from "./ProfileDisplayMode";

describe("ProfileDisplayToggle component", () => {
  it("renders both radio buttons", () => {
    const onChange = jest.fn();
    render(
      <ProfileDisplayToggle
        mode={ProfileDisplayMode.RELEVANT}
        allProfileCount={50}
        relevantProfileCount={10}
        onChange={onChange}
      />
    );

    expect(screen.getByLabelText(/All Profiles \(50\)/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Measure-relevant profiles \(10\)/i)
    ).toBeInTheDocument();
  });

  it("defaults to Measure-relevant profiles when mode is RELEVANT", () => {
    const onChange = jest.fn();
    render(
      <ProfileDisplayToggle
        mode={ProfileDisplayMode.RELEVANT}
        allProfileCount={50}
        relevantProfileCount={10}
        onChange={onChange}
      />
    );

    expect(
      screen.getByLabelText(/Measure-relevant profiles \(10\)/i)
    ).toBeChecked();
    expect(screen.getByLabelText(/All Profiles \(50\)/i)).not.toBeChecked();
  });

  it("displays All Profiles as checked when mode is ALL", () => {
    const onChange = jest.fn();
    render(
      <ProfileDisplayToggle
        mode={ProfileDisplayMode.ALL}
        allProfileCount={50}
        relevantProfileCount={10}
        onChange={onChange}
      />
    );

    expect(screen.getByLabelText(/All Profiles \(50\)/i)).toBeChecked();
    expect(
      screen.getByLabelText(/Measure-relevant profiles \(10\)/i)
    ).not.toBeChecked();
  });

  it("calls onChange with ALL when All Profiles is selected", async () => {
    const onChange = jest.fn();
    render(
      <ProfileDisplayToggle
        mode={ProfileDisplayMode.RELEVANT}
        allProfileCount={50}
        relevantProfileCount={10}
        onChange={onChange}
      />
    );

    userEvent.click(screen.getByLabelText(/All Profiles \(50\)/i));
    expect(onChange).toHaveBeenCalledWith(ProfileDisplayMode.ALL);
  });

  it("calls onChange with RELEVANT when Measure-relevant profiles is selected", async () => {
    const onChange = jest.fn();
    render(
      <ProfileDisplayToggle
        mode={ProfileDisplayMode.ALL}
        allProfileCount={50}
        relevantProfileCount={10}
        onChange={onChange}
      />
    );

    userEvent.click(screen.getByLabelText(/Measure-relevant profiles \(10\)/i));
    expect(onChange).toHaveBeenCalledWith(ProfileDisplayMode.RELEVANT);
  });

  it("displays correct profile counts", () => {
    const onChange = jest.fn();
    render(
      <ProfileDisplayToggle
        mode={ProfileDisplayMode.RELEVANT}
        allProfileCount={123}
        relevantProfileCount={7}
        onChange={onChange}
      />
    );

    expect(screen.getByText(/All Profiles \(123\)/)).toBeInTheDocument();
    expect(
      screen.getByText(/Measure-relevant profiles \(7\)/)
    ).toBeInTheDocument();
  });
});
