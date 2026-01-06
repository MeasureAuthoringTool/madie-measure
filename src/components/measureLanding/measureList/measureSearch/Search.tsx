import React, { Dispatch, SetStateAction } from "react";
import { IconButton, MenuItem } from "@mui/material";
import _ from "lodash";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import { useFormik } from "formik";
import "twin.macro";
import "styled-components/macro";
import { Select, TextField } from "@madie/madie-design-system/dist/react";
import { MeasureSearchCriteria } from "../../MeasureLanding";

const renderMenuItemsForFilter = (options: string[]) => {
  return [
    ...options.map((option) => (
      <MenuItem
        key={`${option}-option`}
        value={option}
        data-testid={`${option}-option`}
      >
        {option}
      </MenuItem>
    )),
  ];
};

const Search = (props: {
  searchCriteria: MeasureSearchCriteria;
  setSearchCriteria: Dispatch<SetStateAction<MeasureSearchCriteria>>;
  handlePageChange: (e, v) => void;
}) => {
  const { searchCriteria, setSearchCriteria, handlePageChange } = { ...props };
  const formik = useFormik({
    initialValues: {
      searchField: searchCriteria?.searchField,
      filterBy: searchCriteria?.optionalSearchProperties?.[0],
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      setSearchCriteria({
        searchField: values?.searchField,
        optionalSearchProperties: [values?.filterBy],
      });
      handlePageChange(null, 1);
    },
  });

  return (
    <form
      onSubmit={formik.handleSubmit}
      // flex-basis here should be aware if there's one or two items here. If two, it should be 60%, if one, it should be 50%. Not really perfect, but looks much better for two items we're shifting for
      style={{
        display: "flex",
        gap: 16,
        flexBasis: "60%",
      }}
    >
      <Select
        defaultValue=""
        placeHolder={{ name: "Filter By", value: "" }}
        label="Filter By"
        name="filterBy"
        id={`filter-by`}
        data-testid={`filter-by`}
        inputProps={{
          "data-testid": `filter-by-input`,
        }}
        {...formik.getFieldProps("filterBy")}
        options={renderMenuItemsForFilter([
          "-",
          "Measure",
          "Version",
          "Model",
          "CMS ID",
        ])}
      />
      <TextField
        id="measure-search-field"
        name="searchField"
        placeholder="Search"
        type="text"
        fullWidth
        data-testid="measure-search"
        label="Search"
        variant="outlined"
        {...formik.getFieldProps("searchField")}
        inputProps={{
          "data-testid": "measure-search-input",
          "aria-required": "false",
        }}
        slotProps={{
          input: {
            startAdornment: (
              <IconButton
                type="submit"
                data-testid="search-icon"
                aria-label="Search"
                sx={{ marginTop: "0 !important" }}
              >
                <SearchIcon />
              </IconButton>
            ),
            endAdornment: (
              <IconButton
                aria-label="Clear-Search"
                data-testid="clear-search-icon"
                sx={{
                  visibility: _.isEmpty(formik?.values?.searchField)
                    ? "hidden"
                    : "visible",
                }}
                onClick={() =>
                  setSearchCriteria({
                    searchField: "",
                    optionalSearchProperties: [],
                  })
                }
              >
                <ClearIcon />
              </IconButton>
            ),
          },
        }}
      />
    </form>
  );
};

export default Search;
