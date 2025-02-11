import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import queryString from "query-string";
import {
  Button,
  Pagination,
  TextField,
} from "@madie/madie-design-system/dist/react";
import "twin.macro";
import SearchIcon from "@mui/icons-material/Search";
import InputAdornment from "@material-ui/core/InputAdornment";
import ClearIcon from "@mui/icons-material/Clear";
import { Typography, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { measureStore, checkUserCanEdit } from "@madie/madie-util";
import { useFormik } from "formik";
import { MeasureDefinition } from "@madie/madie-models";
import MeasureMetaDataRow from "../MeasureMetaDataRow";
import { MeasureDefinitionValidator } from "./MeasureDefinitionValidator";
import "../MeasureMetaDataTable.scss";

interface MeasureDefinitionsProps {
  setErrorMessage: Function;
}

const MeasureDefinitions = (props: MeasureDefinitionsProps) => {
  const { search } = useLocation();
  let navigate = useNavigate();
  const [measure, setMeasure] = useState<any>(measureStore.state);
  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  const [selectedDefinition, setSelectedDefinition] =
    useState<MeasureDefinition>(null);

  // Form utilities
  const canEdit = checkUserCanEdit(
    measure?.measureSet?.owner,
    measure?.measureSet?.acls,
    measure?.measureMetaData?.draft
  );

  const values = queryString.parse(search);
  const INITIAL_VALUES = {
    id: selectedDefinition?.id,
    term: selectedDefinition?.term,
    definition: selectedDefinition?.definition,
  } as MeasureDefinition;
  const [measureDefinitions, setMeasureDefinitions] = useState<
    MeasureDefinition[]
  >(measure?.measureMetaData?.measureDefinitions || []);

  const formik = useFormik({
    initialValues: {
      ...INITIAL_VALUES,
      searchValue: values.search ? values.search : "",
    },
    enableReinitialize: true,
    validationSchema: MeasureDefinitionValidator,
    onSubmit: async (values) => await handleSubmit(values),
  });

  useEffect(() => {
    if (measure?.measureMetaData?.measureDefinitions) {
      const copiedDefinitions = [
        ...measure?.measureMetaData?.measureDefinitions,
      ];
      setMeasureDefinitions(copiedDefinitions);
    }
  }, [setMeasureDefinitions, measure]);

  const handleSubmit = (values: MeasureDefinition) => {};

  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [visibleItems, setVisibleItems] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);
  const [currentLimit, setCurrentLimit] = useState<number>(
    (values.limit && Number(values.limit)) || 10
  );
  const [currentPage, setCurrentPage] = useState<number>(
    (values.page && Number(values.page)) || 1
  );
  const [visibleDefinitions, setVisibleDefinitions] = useState<
    MeasureDefinition[]
  >([]);

  const managePagination = useCallback(() => {
    if (measureDefinitions.length < currentLimit) {
      setOffset(0);
      setVisibleDefinitions([...measureDefinitions]);
      setVisibleItems(measureDefinitions.length);
      setTotalItems(measureDefinitions.length);
      setTotalPages(1);
    } else {
      const start = (currentPage - 1) * currentLimit;
      const end = start + currentLimit;
      const newVisibleDefinitions = [...measureDefinitions].slice(start, end);
      setOffset(start);
      setVisibleDefinitions(newVisibleDefinitions);
      setVisibleItems(newVisibleDefinitions.length);
      setTotalItems(measureDefinitions.length);
      setTotalPages(Math.ceil(measureDefinitions.length / currentLimit));
    }
  }, [
    currentLimit,
    currentPage,
    measureDefinitions,
    setOffset,
    setVisibleDefinitions,
    setVisibleItems,
    setTotalItems,
    setTotalPages,
  ]);

  useEffect(() => {
    managePagination();
  }, [measureDefinitions, currentPage, currentLimit]);

  const canGoNext = (() => {
    return currentPage < totalPages;
  })();
  const canGoPrev = Number(values?.page) > 1;
  const handlePageChange = (e, v) => {
    setCurrentPage(v);
    navigate(`?page=${v}&limit=${values?.limit || 10}`);
  };
  const handleLimitChange = (e) => {
    setCurrentLimit(e.target.value);
    setCurrentPage(1);
    navigate(`?page=${1}&limit=${e.target.value}`);
  };

  const handleClick = (id, operation) => {};

  const createEncodedQuery = (values) => {
    const searchEncoded = encodeURIComponent(values.searchValue);
    return `?search=${searchEncoded}&page=1&limit=${values.limit || 10}`;
  };
  const handleNavigate = () => {
    navigate(createEncodedQuery(formik.values));
  };
  const handleClearClick = () => {};

  return (
    <div
      id="measure-details-form"
      data-testid={`measure-definitions`}
      style={{ minHeight: 539 }}
    >
      <div className="content">
        <div className="subTitle">
          <h2>Definitions</h2>
          <div>
            <Typography
              style={{ fontSize: 14, fontWeight: 300, fontFamily: "Rubik" }}
            ></Typography>
          </div>
        </div>

        <table>
          <tr>
            <td>
              <TextField
                id="search"
                style={{ width: "280px", paddingBottom: "32px" }}
                label="Search"
                placeholder="Search"
                inputProps={{
                  "data-testid": "measure-definition-search-input",
                }}
                data-testid="measure-definition-list-search"
                name="searchValue"
                value={formik.values.searchValue}
                onChange={formik.handleChange}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleNavigate();
                  }
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment
                        position="start"
                        data-testid="test-cases-trigger-search"
                        onClick={handleNavigate}
                        style={{ cursor: "pointer" }}
                      >
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment
                        data-testid="measure-definition-clear-search"
                        position="end"
                        style={{ cursor: "pointer" }}
                        onClick={handleClearClick}
                      >
                        <IconButton>
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </td>

            <td>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row-reverse",
                  paddingBottom: "15px",
                }}
              >
                <Button
                  id="create-definition"
                  disabled={!canEdit}
                  variant="outline-filled"
                  className="page-header-action-button"
                  data-testid="create-definition-button"
                  //onClick={toggleOpen}
                  onClick={() => {}}
                  sx={{
                    display: "flex",
                    flexDirection: "row-reverse",
                  }}
                >
                  <AddIcon className="page-header-action-icon" />
                  Add Term
                </Button>
              </div>
            </td>
          </tr>
        </table>

        <div id="measure-meta-data-table">
          <table className="meta-data-table">
            <thead>
              <tr>
                <th scope="col" className="col-header">
                  Term
                </th>
                <th scope="col" className="col-header">
                  Definition
                </th>
                <th scope="col" className="col-header"></th>
              </tr>
            </thead>
            <tbody data-testId="measure-definitions-table-body">
              {visibleDefinitions.length > 0 ? (
                visibleDefinitions.map((definition, index) => (
                  <MeasureMetaDataRow
                    name={definition.term}
                    description={definition.definition}
                    handleClick={handleClick}
                    id={definition.id}
                    key={`${definition.term}-${index}`}
                    canEdit={canEdit}
                    type="definition"
                  />
                ))
              ) : (
                <p data-testId="empty-definitions">
                  There are currently no definitions. Click the (Add Term)
                  button above to add one.
                </p>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-container">
          <Pagination
            totalItems={totalItems}
            visibleItems={visibleItems}
            limitOptions={[10, 25, 50]}
            offset={offset}
            handlePageChange={handlePageChange}
            handleLimitChange={handleLimitChange}
            page={Number(values?.page) || 1}
            limit={Number(values?.limit) || 10}
            count={totalPages}
            shape="rounded"
            hideNextButton={!canGoNext}
            hidePrevButton={!canGoPrev}
          />
        </div>
      </div>
    </div>
  );
};

export default MeasureDefinitions;
