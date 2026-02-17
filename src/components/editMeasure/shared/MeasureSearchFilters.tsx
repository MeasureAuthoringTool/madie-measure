import React from "react";
import { IconButton, InputAdornment, MenuItem } from "@mui/material";
import { Select, TextField } from "@madie/madie-design-system/dist/react";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { filterByOptions } from "../hooks/useMeasureFilterSearch";
import "./MeasureSearchFilters.scss";

interface MeasureFilterSearchProps {
  filterBy: string;
  searchField: string;
  onFilterChange: (e: any) => void;
  onSearchChange: (e: any) => void;
  onSearchTrigger: () => void;
  onSearchClear: () => void;
}

/**
 * Reusable component for measure filter and search UI
 * Provides filter dropdown and search input with trigger and clear actions
 */
export const MeasureSearchFilters: React.FC<MeasureFilterSearchProps> = ({
  filterBy,
  searchField,
  onFilterChange,
  onSearchChange,
  onSearchTrigger,
  onSearchClear,
}) => {
  return (
    <div className="measure-search-filters">
      <div>
        <Select
          label="Filter By"
          id="filter-by-select"
          data-testid="filter-by-select"
          inputProps={{ "data-testid": "filter-by-select-input" }}
          placeHolder={{ name: "Filter By", value: "" }}
          SelectDisplayProps={{
            "aria-required": "true",
          }}
          size="small"
          name="filterBy"
          value={filterBy}
          onChange={onFilterChange}
          options={filterByOptions
            ?.map((option) => {
              return (
                <MenuItem
                  key={option}
                  value={option}
                  data-testid={`filter-by-${option}`}
                >
                  {option}
                </MenuItem>
              );
            })
            .concat(
              <MenuItem key="-" value="" data-testid={`filter-by--`}>
                -
              </MenuItem>
            )}
        />
      </div>
      <div>
        <TextField
          id="search"
          label="Search"
          placeholder="Search"
          inputProps={{
            "data-testid": "test-case-list-search-input",
          }}
          data-testid="test-case-list-search"
          name="searchField"
          value={searchField}
          onChange={onSearchChange}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSearchTrigger();
            }
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment
                  position="start"
                  data-testid="test-cases-trigger-search"
                  onClick={onSearchTrigger}
                  style={{ cursor: "pointer" }}
                >
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment
                  data-testid="test-cases-clear-search"
                  position="end"
                  style={{ cursor: "pointer" }}
                  onClick={onSearchClear}
                >
                  <IconButton>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </div>
    </div>
  );
};
