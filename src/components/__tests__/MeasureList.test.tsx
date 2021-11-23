import * as React from "react";

import { fireEvent, getByTestId, render, screen } from "@testing-library/react";
import MeasureList from "../MeasureList";
import { Measure } from "../../models/Measure";

import userEvent from "@testing-library/user-event";

import { v4 as uuid } from "uuid";

const mockPush = jest.fn();
jest.mock("react-router-dom", () => ({
  useHistory: () => {
    const push = () => mockPush("/example");
    return { push };
  },
}));

const measures: Measure[] = [
  {
    id: "IDIDID1",
    measureHumanReadableId: null,
    measureSetId: "1",
    version: 0,
    revisionNumber: 0,
    state: "NEW",
    name: "new measure - A",
    cql: null,
    createdAt: null,
    createdBy: null,
    lastModifiedAt: null,
    lastModifiedBy: null,
    model: "QDM",
  },
  {
    id: "IDIDID2",
    measureHumanReadableId: null,
    measureSetId: "2",
    version: 0,
    revisionNumber: 999999,
    state: "DRAFT",
    name: "draft measure - B",
    cql: null,
    createdAt: null,
    createdBy: null,
    lastModifiedAt: null,
    lastModifiedBy: null,
    model: "FHIR",
  },
  {
    id: "IDIDID2",
    measureHumanReadableId: null,
    measureSetId: "3",
    version: 1.3,
    revisionNumber: 0,
    state: "VERSIONED",
    name: "versioned measure - C",
    cql: null,
    createdAt: null,
    createdBy: null,
    lastModifiedAt: null,
    lastModifiedBy: null,
    model: "QI-Core",
  },
];

describe("Measure List component", () => {
  beforeEach(() => {
    measures.forEach((m) => {
      m.measureHumanReadableId = uuid();
    });
  });

  it("should display a list of measures", () => {
    const { getByText, getByTestId } = render(
      <MeasureList measureList={measures} />
    );
    measures.forEach((m) => {
      expect(getByText(m.name)).toBeInTheDocument();
      expect(
        screen.getByTestId(`measure-button-${m.measureHumanReadableId}`)
      ).toBeInTheDocument();
    });
    const measureButton = getByTestId(
      `measure-button-${measures[0].measureHumanReadableId}`
    );
    fireEvent.click(measureButton);
    expect(mockPush).toHaveBeenCalledWith("/example");
  });

  it("should navigate to the edit measure screen on click of edit button", () => {
    const { getByTestId } = render(<MeasureList measureList={measures} />);
    const editButton = getByTestId(`edit-measure-${measures[0].id.date}`);
    expect(window.location.href).toBe("http://localhost/");
    fireEvent.click(editButton);
    expect(mockPush).toHaveBeenCalledWith("/example");
  });
});
