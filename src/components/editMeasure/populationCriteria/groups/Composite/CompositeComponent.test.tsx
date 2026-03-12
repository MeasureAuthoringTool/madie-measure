import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CompositeComponent from "./CompositeComponent";
import { Measure } from "@madie/madie-models";

const mockFormik = {
  values: {
    compositeScoring: "",
  },
  setFieldValue: jest.fn(),
  touched: {},
  errors: {},
};

const mockMeasureDetails = [
  {
    id: "m1",
    measureName: "Alpha Measure",
    version: "1.0.0",
    measureSet: { cmsId: "CMS111" },
    lastModifiedAt: "2024-01-15",
    groups: [{ id: "g1", displayId: "Population1" }],
  },
];

const mockMeasureServiceApi = {
  fetchMeasuresByIds: jest.fn().mockResolvedValue(mockMeasureDetails),
};

const measure = {
  id: "measure ID",
  createdBy: "testuser@example.com",
  model: "QI-Core v4.1.1",
  measureMetaData: { draft: true },
} as Measure;

const submitComponentForm = jest.fn();

jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
}));

describe("CompositeComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMeasureServiceApi.fetchMeasuresByIds.mockResolvedValue(
      mockMeasureDetails
    );
  });

  it("renders the composite component container", () => {
    render(
      <CompositeComponent
        canEdit={true}
        formik={mockFormik}
        components={[]}
        measure={measure}
        submitComponentForm={submitComponentForm}
      />
    );
    expect(screen.getByTestId("composite-component")).toBeInTheDocument();
  });

  it("renders the CompositeScoring select dropdown", () => {
    render(
      <CompositeComponent
        canEdit={true}
        formik={mockFormik}
        components={[]}
        measure={measure}
        submitComponentForm={submitComponentForm}
      />
    );
    expect(screen.getByTestId("composite-scoring")).toBeInTheDocument();
  });

  it("disables Add Components button when composite scoring is not selected", () => {
    render(
      <CompositeComponent
        canEdit={true}
        formik={mockFormik}
        components={[]}
        measure={measure}
        submitComponentForm={submitComponentForm}
      />
    );
    const addButton = screen.getByTestId("select-components-btn");
    expect(addButton).toBeDisabled();
  });

  it("does not call fetchMeasuresByIds when components is empty", () => {
    render(
      <CompositeComponent
        canEdit={true}
        formik={mockFormik}
        components={[]}
        measure={measure}
        submitComponentForm={submitComponentForm}
      />
    );
    expect(mockMeasureServiceApi.fetchMeasuresByIds).not.toHaveBeenCalled();
  });

  it("calls fetchMeasuresByIds with unique measureIds on mount when components are provided", async () => {
    const components = [
      { measureId: "m1", groupId: "g1" },
      { measureId: "m1", groupId: "g2" }, // duplicate measureId — should be deduped
      { measureId: "m2", groupId: "g3" },
    ];

    render(
      <CompositeComponent
        canEdit={true}
        formik={mockFormik}
        components={components as any}
        measure={measure}
        submitComponentForm={submitComponentForm}
      />
    );

    await waitFor(() => {
      expect(mockMeasureServiceApi.fetchMeasuresByIds).toHaveBeenCalledWith([
        "m1",
        "m2",
      ]);
    });
  });

  it("renders AddedComponentsTable with fetched component details", async () => {
    const components = [{ measureId: "m1", groupId: "g1" }];

    render(
      <CompositeComponent
        canEdit={true}
        formik={mockFormik}
        components={components as any}
        measure={measure}
        submitComponentForm={submitComponentForm}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Alpha Measure")).toBeInTheDocument();
    });
  });

  it("calls submitComponentForm with filtered components on delete", async () => {
    const components = [
      { measureId: "m1", groupId: "g1" },
      { measureId: "m2", groupId: "g2" },
    ];

    render(
      <CompositeComponent
        canEdit={true}
        formik={mockFormik}
        components={components as any}
        measure={measure}
        submitComponentForm={submitComponentForm}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Alpha Measure")).toBeInTheDocument();
    });

    const deleteButton = screen.getByTestId("delete-component-m1");
    await userEvent.click(deleteButton);

    expect(submitComponentForm).toHaveBeenCalledWith([
      { measureId: "m2", groupId: "g2" },
    ]);
  });

  it("logs error and keeps componentDetails empty when fetchMeasuresByIds fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    mockMeasureServiceApi.fetchMeasuresByIds.mockRejectedValueOnce(
      new Error("fetch failed")
    );

    const components = [{ measureId: "m1", groupId: "g1" }];

    render(
      <CompositeComponent
        canEdit={true}
        formik={mockFormik}
        components={components as any}
        measure={measure}
        submitComponentForm={submitComponentForm}
      />
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("measure-list-tbl")).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
