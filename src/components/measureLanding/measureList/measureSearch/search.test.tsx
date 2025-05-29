import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import Search from "./search";
import userEvent from "@testing-library/user-event";
import { within } from "@testing-library/dom";

describe("Search Component", () => {
  const mockSetSearchCriteria = jest.fn();
  const defaultCriteria = {
    searchField: "",
    optionalSearchProperties: [],
  };

  const renderComponent = (searchCriteria = defaultCriteria) => {
    render(
      <Search
        searchCriteria={searchCriteria}
        setSearchCriteria={mockSetSearchCriteria}
      />
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render search field and filter options correctly", async () => {
    renderComponent();

    const searchField = screen.getByTestId("measure-search-input");
    expect(searchField).toBeInTheDocument();

    const filterBy = screen.getByTestId("filter-by");
    const filterByDropDown = within(filterBy).getByRole("combobox", {
      hidden: true,
    }) as HTMLInputElement;
    userEvent.click(filterByDropDown);

    const optionsList = await screen.findAllByRole("option");
    expect(optionsList).toHaveLength(4);
    expect(optionsList[0]).toHaveTextContent("Measure");
    expect(optionsList[1]).toHaveTextContent("Version");
    expect(optionsList[2]).toHaveTextContent("Model");
    expect(optionsList[3]).toHaveTextContent("CMS ID");
  });

  it("should submit the form with appropriate values", async () => {
    renderComponent();

    const filterBy = screen.getByTestId("filter-by");
    const filterByDropDown = within(filterBy).getByRole("combobox", {
      hidden: true,
    }) as HTMLInputElement;
    userEvent.click(filterByDropDown);

    const optionsList = await screen.findAllByRole("option");
    expect(optionsList).toHaveLength(4);
    expect(optionsList[0]).toHaveTextContent("Measure");
    userEvent.click(optionsList[0]);

    const input = screen.getByTestId("measure-search-input");

    userEvent.type(input, "Diabetes");
    expect(input).toHaveValue("Diabetes");

    const searchIcon = await screen.findByTestId("search-icon");
    expect(searchIcon).toBeVisible();
    userEvent.click(searchIcon);

    await waitFor(() => {
      expect(mockSetSearchCriteria).toHaveBeenCalledWith({
        searchField: "Diabetes",
        optionalSearchProperties: ["Measure"],
      });
    });
  });

  it("should clear the search field when clear button is clicked ", async () => {
    const criteriaWithSearch = {
      searchField: "Heart Failure",
      optionalSearchProperties: ["Status"],
    };

    renderComponent(criteriaWithSearch);

    const clearButton = screen.getByRole("button", { name: /Clear-Search/i });
    expect(clearButton).toBeVisible();

    userEvent.click(clearButton);

    expect(mockSetSearchCriteria).toHaveBeenCalledWith({
      searchField: "",
      optionalSearchProperties: [],
    });
  });

  it("should hide the clear button when search field is empty", async () => {
    renderComponent();

    const clearButton = await screen.findByTestId("clear-search-icon");

    expect(clearButton).toBeInTheDocument();
    expect(clearButton).toHaveStyle("visibility: hidden");
  });
});
