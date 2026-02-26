/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LeftPanelNavTabs from "./LeftPanelNavTabs";

// Mock useFeatureFlags
jest.mock("@madie/madie-util", () => ({
  useFeatureFlags: jest.fn(),
}));

const { useFeatureFlags } = require("@madie/madie-util");

describe("LeftPanelNavTabs isDebugMode logic", () => {
  const setActiveTab = jest.fn();
  const originalLocalStorage = { ...global.localStorage };
  const originalWindow = { ...global.window };

  beforeEach(() => {
    setActiveTab.mockClear();
    // Reset mocks
    useFeatureFlags.mockReturnValue({ qdmHideJson: false });
    // Clear localStorage and window property
    window.localStorage.clear();
    delete (window as any).madieDebug;
  });

  afterAll(() => {
    // Restore original localStorage and window
    (global as any).localStorage = originalLocalStorage;
    (global as any).window = originalWindow;
  });

  it("shows JSON tab when qdmHideJson is false", () => {
    useFeatureFlags.mockReturnValue({ qdmHideJson: false });
    render(
      <LeftPanelNavTabs activeTab="elements" setActiveTab={setActiveTab} />
    );
    expect(screen.getByTestId("json-tab")).toBeInTheDocument();
  });

  it("hides JSON tab when qdmHideJson is true and not in debug mode", () => {
    useFeatureFlags.mockReturnValue({ qdmHideJson: true });
    render(
      <LeftPanelNavTabs activeTab="elements" setActiveTab={setActiveTab} />
    );
    expect(screen.queryByTestId("json-tab")).toBeNull();
  });

  it("shows JSON tab when qdmHideJson is true but madieDebug in localStorage", () => {
    useFeatureFlags.mockReturnValue({ qdmHideJson: true });
    window.localStorage.setItem("madieDebug", "true");
    render(
      <LeftPanelNavTabs activeTab="elements" setActiveTab={setActiveTab} />
    );
    expect(screen.getByTestId("json-tab")).toBeInTheDocument();
  });

  it("shows JSON tab when qdmHideJson is true but window.madieDebug is set", () => {
    useFeatureFlags.mockReturnValue({ qdmHideJson: true });
    (window as any).madieDebug = true;
    render(
      <LeftPanelNavTabs activeTab="elements" setActiveTab={setActiveTab} />
    );
    expect(screen.getByTestId("json-tab")).toBeInTheDocument();
  });

  it("calls setActiveTab on tab change", () => {
    useFeatureFlags.mockReturnValue({ qdmHideJson: false });
    render(
      <LeftPanelNavTabs activeTab="elements" setActiveTab={setActiveTab} />
    );
    fireEvent.click(screen.getByTestId("json-tab"));
    expect(setActiveTab).toHaveBeenCalledWith("json");
  });
});
