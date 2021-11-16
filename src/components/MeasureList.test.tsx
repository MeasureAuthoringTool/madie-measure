import * as React from "react";
import { render, screen } from "@testing-library/react";
import MeasureList from "./MeasureList";
import { Measure } from "./MeasureLanding";
import { v4 as uuid } from "uuid";

const measures: Measure[] = [
  {
    id: {
      timestamp: 1637010157,
      date: "2021-11-15T21:02:37.000+00:00",
    },
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
    id: {
      timestamp: 1637010157,
      date: "2021-11-15T21:02:37.000+00:00",
    },
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
    id: {
      timestamp: 1637010157,
      date: "2021-11-15T21:02:37.000+00:00",
    },
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
  it("should display a list of measures", () => {
    measures.forEach((m) => {
      m.measureHumanReadableId = uuid();
    });
    const { getByText } = render(<MeasureList measureList={measures} />);
    measures.forEach((m) => {
      expect(getByText(m.name)).toBeInTheDocument();
      expect(
        screen.getByTestId(`measure-button-${m.measureHumanReadableId}`)
      ).toBeInTheDocument();
    });
  });
});
