import { useState } from "react";

export const filterByOptions = ["Measure", "Version", "CMS ID"];

export const filterMap = {
  Measure: "measureName",
  Version: "version",
  "CMS ID": "cmsId",
};

interface FinalSearchAndFilterby {
  finalSearchField: string;
  finalFilterBy: string;
}

interface UseMeasureFilterSearchProps {
  filterBy: string;
  searchField: string;
  finalSearchAndFilterby: FinalSearchAndFilterby;
  handleFilter: (e: any) => void;
  handleSearch: (e: any) => void;
  finalizeSearchCriteria: () => void;
  blankSearchCriteria: () => void;
}

/**
 * Custom hook for managing measure filter and search functionality
 * Provides state and handlers for filtering and searching measures by various criteria
 */
export const useMeasureFilterSearch = (
  onPageReset?: () => void
): UseMeasureFilterSearchProps => {
  const [filterBy, setFilterBy] = useState<string>("");
  const [searchField, setSearchField] = useState<string>("");
  const [finalSearchAndFilterby, setFinalSearchAndFilterby] =
    useState<FinalSearchAndFilterby>({
      finalSearchField: "",
      finalFilterBy: "",
    });

  const handleFilter = (e) => {
    setFilterBy(e.target.value);
  };

  const handleSearch = (e) => {
    setSearchField(e.target.value);
  };

  const finalizeSearchCriteria = () => {
    const finalSearchAndFilter = {
      finalSearchField: searchField,
      finalFilterBy: filterBy,
    };
    setFinalSearchAndFilterby(finalSearchAndFilter);
  };

  const blankSearchCriteria = () => {
    setSearchField("");
    setFilterBy("");
    setFinalSearchAndFilterby({ finalFilterBy: "", finalSearchField: "" });
    if (onPageReset) {
      onPageReset();
    }
  };

  return {
    filterBy,
    searchField,
    finalSearchAndFilterby,
    handleFilter,
    handleSearch,
    finalizeSearchCriteria,
    blankSearchCriteria,
  };
};
