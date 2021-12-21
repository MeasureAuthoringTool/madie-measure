import * as React from "react";
import { render, fireEvent, cleanup, act } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import EditMeasure from "./EditMeasure";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../api/useMeasureServiceApi";
import Measure from "../../models/Measure";
import MeasureEditor from "../measureEditor/MeasureEditor";

jest.mock("./measureDetails/MeasureDetails");
jest.mock("../measureEditor/MeasureEditor");
jest.mock("../../api/useMeasureServiceApi");

const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;

const MeasureEditorMock = MeasureEditor as jest.Mock<JSX.Element>;

MeasureEditorMock.mockImplementation(() => {
  return <div>library testCql version '1.0.000'</div>;
});

const measure = {
  id: "measure ID",
} as Measure;

const serviceApiMock = {
  fetchMeasure: jest.fn().mockResolvedValue(measure),
} as unknown as MeasureServiceApi;

useMeasureServiceApiMock.mockImplementation(() => {
  return serviceApiMock;
});

const serviceConfig: ServiceConfig = {
  measureService: {
    baseUrl: "base.url",
  },
};

afterEach(cleanup);

describe("EditMeasure Component", () => {
  it("should render a loading page if the measure is not yet loaded", async () => {
    const { getByTestId, findByTestId } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <EditMeasure />
        </MemoryRouter>
      </ApiContextProvider>
    );

    const result = getByTestId("loading");
    expect(result).toBeInTheDocument();

    await findByTestId("editMeasure"); // let the rendering finish
  });

  it("should render the EditMeasure contents after the measure is loaded", async () => {
    const { findByTestId, queryByTestId } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <EditMeasure />
        </MemoryRouter>
      </ApiContextProvider>
    );

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();
    expect(serviceApiMock.fetchMeasure).toHaveBeenCalled();

    const loading = queryByTestId("loading");
    expect(loading).toBeNull();
  });

  it("should render edit measure menu with measure details page active by default", async () => {
    const { findByText } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <EditMeasure />
        </MemoryRouter>
      </ApiContextProvider>
    );

    //verify all menus present in the dom
    expect(await findByText("Details")).toBeInTheDocument();
    expect(await findByText("CQL Editor")).toBeInTheDocument();
    expect(await findByText("Measure Groups")).toBeInTheDocument();
    expect(await findByText("Patients")).toBeInTheDocument();
    expect((await findByText("Details")).classList).toContain("active");
  });

  it("should render respective menu contents on clicking menu items", async () => {
    const { findByText } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <EditMeasure />
        </MemoryRouter>
      </ApiContextProvider>
    );

    // CQL Editor Menu click action
    fireEvent.click(await findByText("CQL Editor"));
    expect((await findByText("CQL Editor")).classList).toContain("active");
    expect(document.body.textContent).toContain(
      "library testCql version '1.0.000'"
    );

    // Measure Groups Menu click action
    fireEvent.click(await findByText("Measure Groups"));
    expect((await findByText("Measure Groups")).classList).toContain("active");
    expect(document.body.textContent).toContain("In progress...");

    // Patients Menu click action
    fireEvent.click(await findByText("Patients"));
    expect((await findByText("Patients")).classList).toContain("active");
    expect(document.body.textContent).toContain("In progress...");
  });
});
