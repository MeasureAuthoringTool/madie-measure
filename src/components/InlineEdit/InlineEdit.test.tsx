import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import * as React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  getByTestId,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InlineEdit from "./InlineEdit";
import axios from "axios";

import Enzyme from "enzyme";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";

interface Measure {
  id: string;
  name: string;
}

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;
const measures: Measure[] = [
  { id: "1", name: "John" },
  { id: "2", name: "Andrew" },
];
mockedAxios.get.mockResolvedValueOnce(measures).mockResolvedValueOnce(measures);
jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom") as any),
  useParams: () => ({
    connectionId: "12",
  }),
}));

test("Renders the InlineEdit 'View' span initially", () => {
  const baseProps = {
    text: "Name",
  };
  const { getByTestId } = render(<InlineEdit {...baseProps} />);
  expect(getByTestId("inline-view-span")).toBeTruthy();
  expect(getByTestId("inline-view-span")).toHaveTextContent("Name");
});

test("Renders the InlineEdit 'Edit' span when clicked", async () => {
  const baseProps = {
    text: "Name",
  };
  const { getByTestId } = render(<InlineEdit {...baseProps} />);
  expect(getByTestId("inline-view-span")).toBeTruthy();
  fireEvent.click(getByTestId("inline-view-span"));
  expect(getByTestId("inline-edit-input")).toBeTruthy();
});

test("Saves the InlineEdit 'Edit' when outer area clicked", async () => {
  Enzyme.configure({ adapter: new Adapter() });
  const baseProps = {
    text: "Name",
    onSetText: () => {},
  };
  const { getByTestId } = render(<InlineEdit {...baseProps} />);

  const viewSpan = getByTestId("inline-view-span");
  expect(viewSpan).toBeTruthy();
  userEvent.click(viewSpan);

  expect(getByTestId("inline-edit-input")).toBeTruthy();

  userEvent.click(getByTestId("outer-area"));
  expect(viewSpan).toBeTruthy();
});

test("Saves the InlineEdit 'Edit' when Enter clicked", async () => {
  const setMeasure = (value: React.SetStateAction<Measure>): void => {};
  Enzyme.configure({ adapter: new Adapter() });
  const baseProps = {
    text: "Name",
    onSetText: (text) => setMeasure,
  };
  const { getByTestId } = render(<InlineEdit {...baseProps} />);

  const viewSpan = getByTestId("inline-view-span");
  expect(viewSpan).toBeTruthy();
  userEvent.click(viewSpan);

  const editInput = getByTestId("inline-edit-input");
  expect(editInput).toBeTruthy();

  userEvent.type(editInput, "Widget");
  expect(editInput).toHaveValue("NameWidget");
  fireEvent.keyDown(editInput, { key: "Enter", code: "Enter" });
  expect(viewSpan).toBeTruthy();
});

test("Discards the InlineEdit 'Edit' when Esc clicked", async () => {
  const baseProps = {
    text: "Name",
  };
  const { getByTestId } = render(<InlineEdit {...baseProps} />);
  const viewSpan = getByTestId("inline-view-span");
  userEvent.click(viewSpan);

  const editInput = getByTestId("inline-edit-input");
  expect(editInput).toBeTruthy();
  userEvent.type(editInput, "Widget");

  expect(editInput).toHaveValue("NameWidget");
  fireEvent.keyDown(editInput, { key: "Escape", code: 27 });

  expect(viewSpan).toBeTruthy();
  expect(viewSpan).toHaveTextContent("Name");
});

describe("InlineEdit Error Handling", () => {
  const baseProps = {
    text: "testMeasure",
  };
  it("should generate field level error for required measure name", async () => {
    const { getByTestId } = render(<InlineEdit {...baseProps} />);
    userEvent.click(getByTestId("inline-view-span"));

    const editInput = getByTestId("inline-edit-input");
    userEvent.clear(editInput);

    expect(screen.getByTestId("inline-edit-input")).toHaveValue("");
    userEvent.click(getByTestId("save-edit-measure-name"));
    await waitFor(() => {
      expect(getByTestId("edit-measure-name-error-text")).toHaveTextContent(
        "A measure name is required."
      );
    });
  });

  it("should generate field level error for at least one alphabet in measure name", async () => {
    const { getByTestId } = render(<InlineEdit {...baseProps} />);
    userEvent.click(getByTestId("inline-view-span"));

    const editInput = getByTestId("inline-edit-input");
    userEvent.clear(editInput);
    userEvent.type(editInput, "123445");

    expect(screen.getByTestId("inline-edit-input")).toHaveValue("123445");
    userEvent.click(getByTestId("save-edit-measure-name"));
    await waitFor(() => {
      expect(getByTestId("edit-measure-name-error-text")).toHaveTextContent(
        "A measure name must contain at least one letter."
      );
    });
  });

  it("should generate field level error for underscore in measure name", async () => {
    const { getByTestId } = render(<InlineEdit {...baseProps} />);
    userEvent.click(getByTestId("inline-view-span"));

    const editInput = getByTestId("inline-edit-input");
    userEvent.type(editInput, "_");

    expect(screen.getByTestId("inline-edit-input")).toHaveValue("testMeasure_");
    userEvent.click(getByTestId("save-edit-measure-name"));
    await waitFor(() => {
      expect(getByTestId("edit-measure-name-error-text")).toHaveTextContent(
        "Measure Name must not contain '_' (underscores)."
      );
    });
  });

  it("should generate field level error for more than 500 characters", async () => {
    const { getByTestId } = render(<InlineEdit {...baseProps} />);
    userEvent.click(getByTestId("inline-view-span"));

    const editInput = getByTestId("inline-edit-input");
    userEvent.type(
      editInput,
      "MeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasureNameMeasutestMeasure"
    );
    userEvent.click(getByTestId("save-edit-measure-name"));
    await waitFor(() => {
      expect(getByTestId("edit-measure-name-error-text")).toHaveTextContent(
        "A measure name cannot be more than 500 characters."
      );
    });
  });
});
