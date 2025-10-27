import * as React from "react";
import ResourceList from "./ResourceList";
import { ResourceIdentifier } from "../../../../../../../api/models/ResourceIdentifier";
import { render, screen, waitFor, act } from "@testing-library/react";
import { Simulate } from "react-dom/test-utils";
import userEvent from "@testing-library/user-event";
const { getByTestId } = screen;

const generateResources = (number: number): ResourceIdentifier[] => {
  const resourceList: ResourceIdentifier[] = [];
  for (let i = 0; i < number; i++) {
    const resource: ResourceIdentifier = {
      id: `${i}`,
      title: `title${i}`,
      type: `type${i}`,
      category: `category${i}`,
      profile: `profile${i}`,
    };
    resourceList.push(resource);
  }
  return resourceList;
};

describe("ResourceList component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render a spinner", async () => {
    const resourceList = generateResources(0);
    const onClick = jest.fn();
    render(<ResourceList resourceIdentifiers={undefined} onClick={onClick} />);
    await waitFor(() => {
      expect(getByTestId("madie-loading-spinner")).toBeInTheDocument();
    });
  });

  it("should display list of resources limited to 5", async () => {
    const resourceList = generateResources(50);
    const onClick = jest.fn();
    render(
      <ResourceList resourceIdentifiers={resourceList} onClick={onClick} />
    );

    const table = await screen.findByTestId("measure-list-tbl");
    const tableHeaders = table.querySelectorAll("thead th");
    expect(tableHeaders[0]).toHaveTextContent("Profile");
    userEvent.click(tableHeaders[0]); // doesn't do anything right now, but i have a prevent default in there so i want the code coverage.
    const tableRows = table.querySelectorAll("tbody tr");
    expect(tableRows.length).toBe(5);
  });

  it("should display list of resources limited to 4", async () => {
    const resourceList = generateResources(4);
    const onClick = jest.fn();
    render(
      <ResourceList resourceIdentifiers={resourceList} onClick={onClick} />
    );
    const table = await screen.findByTestId("measure-list-tbl");
    const tableRows = table.querySelectorAll("tbody tr");
    expect(tableRows.length).toBe(4);
    // trigger onClick function
    userEvent.click(screen.getByTestId("add-element-2"));
    expect(onClick).toHaveBeenCalledWith({
      id: `2`,
      title: `title2`,
      type: `type2`,
      category: `category2`,
      profile: `profile2`,
    });
  });

  it("should enter text, clear text, hit enter button", async () => {
    const resourceList = generateResources(5);
    const onClick = jest.fn();
    render(
      <ResourceList resourceIdentifiers={resourceList} onClick={onClick} />
    );
    const table = await screen.findByTestId("measure-list-tbl");
    const tableRows = table.querySelectorAll("tbody tr");
    expect(tableRows.length).toBe(5);
    const searchFieldInput = getByTestId("search-elements-input-input");
    expect(searchFieldInput.value).toBe("");
    userEvent.type(searchFieldInput, "test{enter}");
    Simulate.change(searchFieldInput);
    expect(searchFieldInput.value).toBe("test");
    const clearIcon = getByTestId("ClearIcon");

    userEvent.click(clearIcon);
    await waitFor(() => {
      expect(searchFieldInput.value).toBe("");
    });
  });

  it("change limit and page", async () => {
    const resourceList = generateResources(50);
    const onClick = jest.fn();
    render(
      <ResourceList resourceIdentifiers={resourceList} onClick={onClick} />
    );
    const table = await screen.findByTestId("measure-list-tbl");
    const tableRows = table.querySelectorAll("tbody tr");
    expect(tableRows.length).toBe(5);
    await waitFor(() => {
      const resource1 = screen.getByText("title1");
      expect(resource1).toBeInTheDocument();
    });
    // change page
    const pageButton = await screen.findByLabelText("Go to page 2");
    act(() => {
      userEvent.click(pageButton);
    });
    await waitFor(() => {
      const resource6 = screen.getByText("title6");
      expect(resource6).toBeInTheDocument();
    });
    // change limit
    const [combobox] = await screen.findAllByText("5");
    userEvent.click(combobox);
    const pageLimit25 = screen.getByRole("option", {
      name: /25/i,
    });
    userEvent.click(pageLimit25);
    const resource24 = await screen.findByText("title24");
    expect(resource24).toBeInTheDocument();
  });

  it("should be able to add QICore Patient resource when it is not already added", async () => {
    const resourceList = [
      {
        id: "qicore-patient",
        title: "QI Core Patient",
        type: "Patient",
        category: "Demo",
        profile: "profile-patient",
      },
      {
        id: "2",
        title: "Some Other Resource",
        type: "Other",
        category: "Demo",
        profile: "profile-other",
      },
    ];
    const onClick = jest.fn();

    render(
      <ResourceList
        resourceIdentifiers={resourceList}
        onClick={onClick}
        isPatientAdded={false}
      />
    );

    // Add button for QICore pateint and other resource should NOT be disabled
    const addBtn = screen.getByTestId("add-element-qicore-patient");
    expect(addBtn).not.toBeDisabled();

    const addBtnOther = screen.getByTestId("add-element-2");
    expect(addBtnOther).not.toBeDisabled();
  });

  it("disables add resource button when QICore Patient is already added", async () => {
    const resourceList = [
      {
        id: "qicore-patient",
        title: "QI Core Patient",
        type: "Patient",
        category: "Demo",
        profile: "profile-patient",
      },
      {
        id: "2",
        title: "Some Other Resource",
        type: "Other",
        category: "Demo",
        profile: "profile-other",
      },
    ];
    const onClick = jest.fn();

    render(
      <ResourceList
        resourceIdentifiers={resourceList}
        onClick={onClick}
        isPatientAdded={true}
      />
    );

    // Add button for qicore-patient should be disabled
    const addBtn = screen.getByTestId("add-element-qicore-patient");
    expect(addBtn).toBeDisabled();

    // Add button for other resource should NOT be disabled
    const addBtnOther = screen.getByTestId("add-element-2");
    expect(addBtnOther).not.toBeDisabled();
  });

  it("disables add resource button for QICore patient and US Core patient profile when one patient is already added", async () => {
    const resourceList = [
      {
        id: "qicore-patient",
        title: "QI Core Patient",
        type: "Patient",
        category: "Demo",
        profile: "profile-patient",
      },
      {
        id: "us-core-patient",
        title: "US QI Core Patient",
        type: "Patient",
        category: "Demo",
        profile: "profile-other",
      },
    ];
    const onClick = jest.fn();

    render(
      <ResourceList
        resourceIdentifiers={resourceList}
        onClick={onClick}
        isPatientAdded={true}
      />
    );

    // Add button for qicore-patient should be disabled
    const addBtn = screen.getByTestId("add-element-qicore-patient");
    expect(addBtn).toBeDisabled();

    // Add button for us-core-patient resource should be disabled
    const addBtnOther = screen.getByTestId("add-element-us-core-patient");
    expect(addBtnOther).toBeDisabled();
  });
});
