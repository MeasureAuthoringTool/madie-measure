import * as React from "react";
import ResourceList from "./ResourceList";
import { ResourceIdentifier } from "../../../../../../../api/models/ResourceIdentifier";
import { render, screen, waitFor, act } from "@testing-library/react";
import { Simulate } from "react-dom/test-utils";
import userEvent from "@testing-library/user-event";
import { ExecutionContextProvider } from "../../../../../../routes/qiCore/ExecutionContext";
const { getByTestId } = screen;

const renderWithExecutionContext = (
  ui: React.ReactElement,
  model = "QI-Core 6.0"
) =>
  render(
    <ExecutionContextProvider
      value={{ measureState: [{ model } as any, jest.fn()] } as any}
    >
      {ui}
    </ExecutionContextProvider>
  );

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

  it("should display 'No profiles found' when resourceIdentifiers is an empty array", async () => {
    const onClick = jest.fn();
    render(<ResourceList resourceIdentifiers={[]} onClick={onClick} />);
    expect(screen.getByTestId("no-profiles-found")).toBeInTheDocument();
    expect(screen.getByText("No profiles found")).toBeInTheDocument();
    expect(screen.queryByTestId("measure-list-tbl")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("madie-loading-spinner")
    ).not.toBeInTheDocument();
  });

  it("should display 'No profiles found' when search yields no results", async () => {
    const resourceList = generateResources(5);
    const onClick = jest.fn();
    render(
      <ResourceList resourceIdentifiers={resourceList} onClick={onClick} />
    );
    const table = await screen.findByTestId("measure-list-tbl");
    expect(table).toBeInTheDocument();

    const searchFieldInput = getByTestId(
      "search-elements-input-input"
    ) as HTMLInputElement;
    userEvent.type(searchFieldInput, "nonexistent{enter}");

    await waitFor(() => {
      expect(screen.getByTestId("no-profiles-found")).toBeInTheDocument();
      expect(screen.getByText("No profiles found")).toBeInTheDocument();
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
    expect(tableHeaders[0]).toHaveTextContent("Relevant Profiles");
    expect(tableHeaders[1]).toHaveTextContent("HL7");
    userEvent.click(tableHeaders[0]); // doesn't do anything right now, but i have a prevent default in there so i want the code coverage.
    const tableRows = table.querySelectorAll("tbody tr");
    expect(tableRows.length).toBe(5);
  });

  it("should render an HL7 icon and open the correct QI-Core STU6 profile URL", async () => {
    const resourceList = [
      {
        id: "qicore-patient",
        title: "QI Core Patient",
        type: "Patient",
        category: "Demo",
        profile: "profile-patient",
      },
    ];
    const onClick = jest.fn();
    window.open = jest.fn();

    renderWithExecutionContext(
      <ResourceList resourceIdentifiers={resourceList} onClick={onClick} />
    );

    const hl7Button = await screen.findByTestId("hl7-link-qicore-patient");
    expect(hl7Button).toBeInTheDocument();
    userEvent.click(hl7Button);
    expect(window.open).toHaveBeenCalledWith(
      "https://hl7.org/fhir/us/qicore/STU6/StructureDefinition-qicore-patient.html",
      "_blank"
    );
  });

  it("should render an HL7 icon and open the correct QI-Core STU7 profile URL", async () => {
    const resourceList = [
      {
        id: "qicore-patient",
        title: "QI Core Patient",
        type: "Patient",
        category: "Demo",
        profile: "profile-patient",
      },
    ];
    const onClick = jest.fn();
    window.open = jest.fn();

    renderWithExecutionContext(
      <ResourceList resourceIdentifiers={resourceList} onClick={onClick} />,
      "QI-Core 7.0"
    );

    const hl7Button = await screen.findByTestId("hl7-link-qicore-patient");
    expect(hl7Button).toBeInTheDocument();
    userEvent.click(hl7Button);
    expect(window.open).toHaveBeenCalledWith(
      "https://hl7.org/fhir/us/qicore/STU7/StructureDefinition-qicore-patient.html",
      "_blank"
    );
  });

  it("should open a US Core profile link when the id starts with us-core", async () => {
    const resourceList = [
      {
        id: "us-core-patient",
        title: "US Core Patient",
        type: "Patient",
        category: "Demo",
        profile: "profile-patient",
      },
    ];
    const onClick = jest.fn();
    window.open = jest.fn();

    renderWithExecutionContext(
      <ResourceList resourceIdentifiers={resourceList} onClick={onClick} />
    );

    const hl7Button = await screen.findByTestId("hl7-link-us-core-patient");
    expect(hl7Button).toBeInTheDocument();
    userEvent.click(hl7Button);
    expect(window.open).toHaveBeenCalledWith(
      "https://hl7.org/fhir/us/core/StructureDefinition-us-core-patient.html",
      "_blank"
    );
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
    const searchFieldInput = getByTestId(
      "search-elements-input-input"
    ) as HTMLInputElement;
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

  it("disables insert existing testcase button when QICore Patient is not added on composite measure", async () => {
    const onClick = jest.fn();

    render(
      <ResourceList
        resourceIdentifiers={[]}
        onClick={onClick}
        isPatientAdded={false}
        isComposite={true}
      />
    );

    // Add button for qicore-patient should be disabled
    const insertBtn = screen.getByTestId("insert-test-case-button");
    expect(insertBtn).toBeDisabled();
  });

  it("enables insert existing testcase button when QICore Patient is added on composite measure", async () => {
    const onClick = jest.fn();

    render(
      <ResourceList
        resourceIdentifiers={[]}
        onClick={onClick}
        isPatientAdded={true}
        isComposite={true}
      />
    );

    // Add button for qicore-patient should be disabled
    const insertBtn = screen.getByTestId("insert-test-case-button");
    expect(insertBtn).toBeEnabled();
  });

  describe("Profile Display Mode", () => {
    const relevantResources: ResourceIdentifier[] = [
      {
        id: "qicore-patient",
        title: "QICore Patient",
        type: "Patient",
        category: "Base",
        profile: "profile-patient",
      },
      {
        id: "qicore-encounter",
        title: "QICore Encounter",
        type: "Encounter",
        category: "Base",
        profile: "profile-encounter",
      },
    ];

    const allResources: ResourceIdentifier[] = [
      ...relevantResources,
      {
        id: "fhir-observation",
        title: "FHIR Observation",
        type: "Observation",
        category: "Clinical",
        profile: "profile-observation",
      },
      {
        id: "fhir-condition",
        title: "FHIR Condition",
        type: "Condition",
        category: "Clinical",
        profile: "profile-condition",
      },
    ];

    beforeEach(() => {
      localStorage.clear();
    });

    it("defaults to Measure-relevant profiles when no saved mode exists", () => {
      const onClick = jest.fn();
      render(
        <ResourceList
          resourceIdentifiers={relevantResources}
          allResourceIdentifiers={allResources}
          onClick={onClick}
          measureId="measure-1"
        />
      );

      expect(screen.getByLabelText(/Measure-relevant profiles/i)).toBeChecked();
      expect(screen.getByLabelText(/All Profiles/i)).not.toBeChecked();
    });

    it("shows only selected All Profiles for composite measures", async () => {
      localStorage.setItem(
        "available-elements-profile-mode-measure-1",
        "RELEVANT"
      );
      const onClick = jest.fn();
      render(
        <ResourceList
          resourceIdentifiers={relevantResources}
          allResourceIdentifiers={allResources}
          onClick={onClick}
          isComposite={true}
          measureId="measure-1"
        />
      );

      expect(screen.getByLabelText(/All Profiles \(4\)/i)).toBeChecked();
      expect(
        screen.queryByLabelText(/Measure-relevant profiles/i)
      ).not.toBeInTheDocument();

      const table = await screen.findByTestId("measure-list-tbl");
      expect(table.querySelectorAll("tbody tr")).toHaveLength(4);
    });

    it("displays correct profile counts", () => {
      const onClick = jest.fn();
      render(
        <ResourceList
          resourceIdentifiers={relevantResources}
          allResourceIdentifiers={allResources}
          onClick={onClick}
          measureId="measure-1"
        />
      );

      expect(screen.getByText(/All Profiles \(4\)/)).toBeInTheDocument();
      expect(
        screen.getByText(/Measure-relevant profiles \(2\)/)
      ).toBeInTheDocument();
    });

    it("displays Relevant Profiles header in relevant mode", async () => {
      const onClick = jest.fn();
      render(
        <ResourceList
          resourceIdentifiers={relevantResources}
          allResourceIdentifiers={allResources}
          onClick={onClick}
          measureId="measure-1"
        />
      );

      const table = await screen.findByTestId("measure-list-tbl");
      const tableHeaders = table.querySelectorAll("thead th");
      expect(tableHeaders[0]).toHaveTextContent("Relevant Profiles");
    });

    it("displays All Profiles header when All Profiles is selected", async () => {
      localStorage.setItem("available-elements-profile-mode-measure-1", "ALL");
      const onClick = jest.fn();
      render(
        <ResourceList
          resourceIdentifiers={relevantResources}
          allResourceIdentifiers={allResources}
          onClick={onClick}
          measureId="measure-1"
        />
      );

      const table = await screen.findByTestId("measure-list-tbl");
      const tableHeaders = table.querySelectorAll("thead th");
      expect(tableHeaders[0]).toHaveTextContent("All Profiles");
    });

    it("shows all profiles when All Profiles mode is selected", async () => {
      localStorage.setItem("available-elements-profile-mode-measure-1", "ALL");
      const onClick = jest.fn();
      render(
        <ResourceList
          resourceIdentifiers={relevantResources}
          allResourceIdentifiers={allResources}
          onClick={onClick}
          measureId="measure-1"
        />
      );

      const table = await screen.findByTestId("measure-list-tbl");
      const tableRows = table.querySelectorAll("tbody tr");
      expect(tableRows.length).toBe(4);
    });

    it("shows only relevant profiles in relevant mode", async () => {
      const onClick = jest.fn();
      render(
        <ResourceList
          resourceIdentifiers={relevantResources}
          allResourceIdentifiers={allResources}
          onClick={onClick}
          measureId="measure-1"
        />
      );

      const table = await screen.findByTestId("measure-list-tbl");
      const tableRows = table.querySelectorAll("tbody tr");
      expect(tableRows.length).toBe(2);
    });

    it("persists selected mode per measure", async () => {
      const onClick = jest.fn();
      render(
        <ResourceList
          resourceIdentifiers={relevantResources}
          allResourceIdentifiers={allResources}
          onClick={onClick}
          measureId="measure-1"
        />
      );

      userEvent.click(screen.getByLabelText(/All Profiles/i));

      expect(
        localStorage.getItem("available-elements-profile-mode-measure-1")
      ).toBe("ALL");
    });

    it("loads saved mode from localStorage", () => {
      localStorage.setItem("available-elements-profile-mode-measure-1", "ALL");
      const onClick = jest.fn();
      render(
        <ResourceList
          resourceIdentifiers={relevantResources}
          allResourceIdentifiers={allResources}
          onClick={onClick}
          measureId="measure-1"
        />
      );

      expect(screen.getByLabelText(/All Profiles/i)).toBeChecked();
    });

    it("does not reuse mode across different measures", () => {
      localStorage.setItem("available-elements-profile-mode-measure-1", "ALL");
      const onClick = jest.fn();
      render(
        <ResourceList
          resourceIdentifiers={relevantResources}
          allResourceIdentifiers={allResources}
          onClick={onClick}
          measureId="measure-2"
        />
      );

      expect(screen.getByLabelText(/Measure-relevant profiles/i)).toBeChecked();
    });
  });
});
