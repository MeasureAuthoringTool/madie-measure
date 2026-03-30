import * as React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import EditMeasureNav from "./EditMeasureNav";
import { measureStore } from "@madie/madie-util";

// measureStore is provided by the module-level mock in __mocks__/@madie/madie-util.tsx
// but we need the subscribe / state shape used here, so override it.
jest.mock("@madie/madie-util", () => ({
  measureStore: {
    state: jest.fn(),
    subscribe: jest.fn().mockImplementation(() => ({ unsubscribe: jest.fn() })),
  },
}));

const mockMeasureStore = measureStore as jest.Mocked<typeof measureStore>;

const renderNav = (path: string, isQDM = false) => {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/measures/:measureId/edit/*"
          element={<EditMeasureNav isQDM={isQDM} />}
        />
      </Routes>
    </MemoryRouter>
  );
};

describe("EditMeasureNav", () => {
  beforeEach(() => {
    mockMeasureStore.state.mockReturnValue({
      testCases: [{ id: "1" }, { id: "2" }],
      measureMetaData: { composite: false },
    });
  });

  afterEach(() => jest.clearAllMocks());

  it("renders all tabs and shows test case count from store", () => {
    renderNav("/measures/m1/edit/details");
    expect(screen.getByTestId("measure-details-tab")).toBeInTheDocument();
    expect(screen.getByTestId("cql-editor-tab")).toBeInTheDocument();
    expect(screen.getByTestId("groups-tab")).toBeInTheDocument();
    expect(screen.getByText("Test Cases (2)")).toBeInTheDocument();
  });

  it("shows 'Test Cases' label when testCases is undefined (null state)", () => {
    mockMeasureStore.state.mockReturnValue({
      testCases: undefined,
      measureMetaData: { composite: false },
    });
    renderNav("/measures/m1/edit/details");
    expect(screen.getByText("Test Cases")).toBeInTheDocument();
  });

  it("shows Test Cases (0) when testCases is null", () => {
    mockMeasureStore.state.mockReturnValue({
      testCases: null,
      measureMetaData: { composite: false },
    });
    renderNav("/measures/m1/edit/details");
    expect(screen.getByText("Test Cases (0)")).toBeInTheDocument();
  });

  it("hides CQL Editor tab for composite measure", () => {
    mockMeasureStore.state.mockReturnValue({
      testCases: [],
      measureMetaData: { composite: true },
    });
    renderNav("/measures/m1/edit/details");
    expect(screen.queryByTestId("cql-editor-tab")).not.toBeInTheDocument();
  });

  it("sets Details tab as active on /details route", () => {
    renderNav("/measures/m1/edit/details");
    expect(screen.getByTestId("measure-details-tab")).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  it("sets CQL Editor tab as active on /cql-editor route", () => {
    renderNav("/measures/m1/edit/cql-editor");
    expect(screen.getByTestId("cql-editor-tab")).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  it("sets Population Criteria tab active on /groups route (non-QDM)", () => {
    renderNav("/measures/m1/edit/groups/1");
    expect(screen.getByTestId("groups-tab")).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  it.each(["supplemental-data", "risk-adjustment"])(
    "keeps Population Criteria tab active on /%s for non-QDM",
    (route) => {
      renderNav(`/measures/m1/edit/${route}`);
      expect(screen.getByTestId("groups-tab")).toHaveAttribute(
        "aria-selected",
        "true"
      );
    }
  );

  it("sets Population Criteria tab active on /base-configuration for QDM", () => {
    renderNav("/measures/m1/edit/base-configuration", true);
    expect(screen.getByTestId("groups-tab")).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  it.each(["groups", "supplemental-data", "risk-adjustment", "reporting"])(
    "keeps Population Criteria tab active on /%s for QDM",
    (route) => {
      renderNav(`/measures/m1/edit/${route}`, true);
      expect(screen.getByTestId("groups-tab")).toHaveAttribute(
        "aria-selected",
        "true"
      );
    }
  );

  it("sets Test Cases tab active on /test-cases route", () => {
    renderNav("/measures/m1/edit/test-cases/list-page");
    expect(screen.getByTestId("patients-tab")).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  it("unsubscribes from measureStore on unmount", () => {
    const unsubscribe = jest.fn();
    mockMeasureStore.subscribe.mockReturnValueOnce({ unsubscribe });
    const { unmount } = renderNav("/measures/m1/edit/details");
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
