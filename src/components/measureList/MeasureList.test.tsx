import * as React from "react";
import userEvent from "@testing-library/user-event";
import { fireEvent, getByTestId, render, screen } from "@testing-library/react";
import { Measure } from "../../models/Measure";
import MeasureList from "./MeasureList";
import useOktaTokens from "../../hooks/useOktaTokens";

import { v4 as uuid } from "uuid";

const mockPush = jest.fn();
jest.mock("react-router-dom", () => ({
  useHistory: () => {
    const push = () => mockPush("/example");
    return { push };
  },
}));
jest.mock("../../hooks/useOktaTokens");
const useOktaTokensMock = useOktaTokens as Jest.Mock<Function>;
const MEASURE_CREATEDBY = "testuser@example.com";

const measures: Measure[] = [
  {
    id: "IDIDID1",
    measureHumanReadableId: null,
    measureSetId: "1",
    version: 0,
    revisionNumber: 0,
    state: "NEW",
    measureName: "new measure - A",
    cql: null,
    createdAt: null,
    createdBy: MEASURE_CREATEDBY,
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
    measureName: "draft measure - B",
    cql: null,
    createdAt: null,
    createdBy: null,
    lastModifiedAt: null,
    lastModifiedBy: null,
    model: "FHIR",
  },
  {
    id: "IDIDID3",
    measureHumanReadableId: null,
    measureSetId: "3",
    version: 1.3,
    revisionNumber: 0,
    state: "VERSIONED",
    measureName: "versioned measure - C",
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
    useOktaTokensMock.mockImplementation(() => ({
      getUserName: () => MEASURE_CREATEDBY,
    }));
    const { getByText, getByTestId } = render(
      <MeasureList measureList={measures} />
    );
    measures.forEach((m) => {
      expect(getByText(m.measureName)).toBeInTheDocument();
      expect(screen.getByTestId(`measure-button-${m.id}`)).toBeInTheDocument();
    });
    const measureButton = getByTestId(`measure-button-${measures[0].id}`);
    fireEvent.click(measureButton);
    expect(mockPush).toHaveBeenCalledWith("/example");
  });

  it("should navigate to the edit measure screen on click of edit button", () => {
    const { getByTestId } = render(<MeasureList measureList={measures} />);
    const editButton = getByTestId(`edit-measure-${measures[0].id}`);
    expect(window.location.href).toBe("http://localhost/");
    fireEvent.click(editButton);
    expect(mockPush).toHaveBeenCalledWith("/example");
  });

  it("should view button instead of edit button when user is not the owner of the measure", () => {
    useOktaTokensMock.mockImplementation(() => ({
      getUserName: () => "AnotherUser@example.com",
    }));
    const { getByTestId } = render(<MeasureList measureList={measures} />);
    const viewButton = getByTestId(`view-measure-${measures[0].id}`);
    expect(viewButton).toBeInTheDocument();

    expect(window.location.href).toBe("http://localhost/");
    fireEvent.click(viewButton);
    expect(mockPush).toHaveBeenCalledWith("/example");
  });
});
