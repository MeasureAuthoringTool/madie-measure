import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import InlineEdit from "../InlineEdit";
import axios from "axios";

import Enzyme from "enzyme";
import * as Adapter from "@wojtekmaj/enzyme-adapter-react-17";

interface Measure {
  id: string;
  name: string;
}

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;
const measure: Measure = { id: "1", name: "John" };
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
  Enzyme.configure({ adapter: new Adapter() });
  const baseProps = {
    text: "Name",
    onSetText: () => {
      () => {};
    },
  };
  const wrapper = render(<InlineEdit {...baseProps} />);

  expect(wrapper.getByTestId("inline-view-span")).toBeTruthy();
});

test("Renders the InlineEdit 'Edit' span when clicked", async () => {
  Enzyme.configure({ adapter: new Adapter() });
  const baseProps = {
    text: "Name",
    onSetText: () => {
      () => {};
    },
  };
  const wrapper = render(<InlineEdit {...baseProps} />);

  expect(wrapper.getByTestId("inline-view-span")).toBeTruthy();

  const start = wrapper.getByTestId("inline-view-span");
  fireEvent.click(start);

  expect(wrapper.getByTestId("inline-edit-input")).toBeTruthy();
});

test("Saves the InlineEdit 'Edit' when outer area clicked", async () => {
  Enzyme.configure({ adapter: new Adapter() });
  const baseProps = {
    text: "Name",
    onSetText: () => {
      () => {};
    },
  };
  const wrapper = render(<InlineEdit {...baseProps} />);

  let viewSpan = wrapper.getByTestId("inline-view-span");

  expect(viewSpan).toBeTruthy();

  userEvent.click(viewSpan);

  viewSpan = wrapper.getByTestId("inline-edit-input");
  expect(viewSpan).toBeTruthy();

  const outerArea = wrapper.getByTestId("outer-area");
  userEvent.click(outerArea);
  viewSpan = wrapper.getByTestId("inline-view-span");
});

test("Saves the InlineEdit 'Edit' when Enter clicked", async () => {
  const setMeasure = (value: React.SetStateAction<Measure>): void => {};
  Enzyme.configure({ adapter: new Adapter() });
  const baseProps = {
    text: "Name",
    onSetText: (text) => setMeasure,
  };
  const wrapper = render(<InlineEdit {...baseProps} />);

  let viewSpan = wrapper.getByTestId("inline-view-span");

  expect(viewSpan).toBeTruthy();

  userEvent.click(viewSpan);

  let editInput = wrapper.getByTestId("inline-edit-input");
  expect(editInput).toBeTruthy();

  userEvent.type(editInput, "Widget");
  expect(screen.getByTestId("inline-edit-input")).toHaveValue("NameWidget");
  fireEvent.keyDown(editInput, { key: "Enter", code: "Enter" });
  expect(screen.getByTestId("inline-view-span")).toBeTruthy();
  expect(screen.getByTestId("inline-view-span")).toHaveTextContent("Name");
});

test("Discards the InlineEdit 'Edit' when Esc clicked", async () => {
  Enzyme.configure({ adapter: new Adapter() });
  const baseProps = {
    text: "Name",
    onSetText: () => {
      () => {};
    },
  };
  const wrapper = render(<InlineEdit {...baseProps} />);

  let viewSpan = wrapper.getByTestId("inline-view-span");

  expect(viewSpan).toBeTruthy();

  userEvent.click(viewSpan);

  let editInput = wrapper.getByTestId("inline-edit-input");
  expect(editInput).toBeTruthy();

  userEvent.type(editInput, "Widget");
  expect(screen.getByTestId("inline-edit-input")).toHaveValue("NameWidget");
  fireEvent.keyDown(editInput, { key: "Escape", code: 27 });

  expect(wrapper.getByTestId("inline-view-span")).toBeTruthy();
});
