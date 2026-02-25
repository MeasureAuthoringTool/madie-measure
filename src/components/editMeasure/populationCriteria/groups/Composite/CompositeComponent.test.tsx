import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CompositeComponent from "./CompositeComponent";
import { oneItemResponse } from "../../../../__mocks__/mockMeasureResponses";
import { Measure } from "@madie/madie-models";

const mockFormik = {
  values: {
    compositeScoring: "",
  },
  setFieldValue: jest.fn(),
  touched: {},
  errors: {},
};

const mockMeasureServiceApi = {
  searchMeasuresByCriteria: jest.fn().mockResolvedValue(oneItemResponse),
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
    const addButton = screen.getByTestId("add-components-btn");
    expect(addButton).toBeDisabled();
  });
});
