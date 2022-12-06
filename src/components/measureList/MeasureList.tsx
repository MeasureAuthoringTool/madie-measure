import React, { useState } from "react";
import "twin.macro";
import "styled-components/macro";
import { Measure } from "@madie/madie-models";
import { versionFormat } from "../../utils/versionFormat";
import { useHistory } from "react-router-dom";
import { Chip, IconButton } from "@mui/material";
import {
  TextField,
  Button,
  Popover,
} from "@madie/madie-design-system/dist/react";
import InputAdornment from "@material-ui/core/InputAdornment";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import useMeasureServiceApi from "../../api/useMeasureServiceApi";
import { getFeatureFlag } from "../../utils/featureFlag";
import JSzip from "jszip";
import { saveAs } from "file-saver";

const searchInputStyle = {
  borderRadius: "3px",
  height: 40,
  border: "1px solid #DDDDDD",
  "& .MuiOutlinedInput-notchedOutline": {
    borderRadius: "3px",
    "& legend": {
      width: 0,
    },
  },
  "& .MuiOutlinedInput-root": {
    "&&": {
      borderRadius: "3px",
    },
  },
  "& .MuiInputBase-input": {
    height: 40,
    fontFamily: "Rubik",
    fontSize: 14,
    borderRadius: "3px",
    padding: "9px 14px",
    "&::placeholder": {
      opacity: 0.6,
    },
  },
};

export default function MeasureList(props: {
  measureList: Measure[];
  setMeasureList;
  setTotalPages;
  setTotalItems;
  setVisibleItems;
  setOffset;
  setInitialLoad;
  activeTab: number;
  searchCriteria: string;
  setSearchCriteria;
  currentLimit: number;
  currentPage: number;
}) {
  const history = useHistory();

  // Popover utilities
  const [optionsOpen, setOptionsOpen] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMeasure, setSelectedMeasure] = useState<Measure>(null);

  const measureServiceApi = useMeasureServiceApi();

  const handleClearClick = async (event) => {
    props.setSearchCriteria("");
    const data = await measureServiceApi.fetchMeasures(
      props.activeTab === 0,
      props.currentLimit,
      0
    );
    setPageProps(data);
    history.push(
      `?tab=${props.activeTab}&page=${1}&limit=${props.currentLimit}`
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (props.searchCriteria) {
      const data =
        await measureServiceApi.searchMeasuresByMeasureNameOrEcqmTitle(
          props.activeTab === 0,
          props.currentLimit,
          0,
          props.searchCriteria
        );
      setPageProps(data);
    }

    history.push(
      `?tab=${props.activeTab}&page=${1}&limit=${props.currentLimit}`
    );
  };
  const setPageProps = (data) => {
    if (data) {
      const { content, totalPages, totalElements, numberOfElements, pageable } =
        data;
      props.setTotalPages(totalPages);
      props.setTotalItems(totalElements);
      props.setVisibleItems(numberOfElements);

      props.setMeasureList(content);
      props.setOffset(pageable.offset);
      props.setInitialLoad(false);
    }
  };

  const searchInputProps = {
    startAdornment: (
      <InputAdornment position="start">
        <SearchIcon />
      </InputAdornment>
    ),
    endAdornment: (
      <IconButton
        aria-label="Clear-Search"
        sx={{
          visibility: props.searchCriteria ? "visible" : "hidden",
        }}
        onClick={handleClearClick}
      >
        <ClearIcon />
      </IconButton>
    ),
  };

  const handleOpen = (
    selected: Measure,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setSelectedMeasure(selected);
    setAnchorEl(event.currentTarget);
    setOptionsOpen(true);
  };

  const handleClose = () => {
    setOptionsOpen(false);
    setSelectedMeasure(null);
    setAnchorEl(null);
  };

  const viewEditredirect = () => {
    history.push(`/measures/${selectedMeasure?.id}/edit/details`);
    setOptionsOpen(false);
  };

  const zipData = () => {
    const zip = new JSzip();
    zip.generateAsync({ type: "blob" }).then(function (content) {
      saveAs(
        content,
        `${selectedMeasure?.ecqmTitle}-v${versionFormat(
          selectedMeasure?.version,
          selectedMeasure?.revisionNumber
        )}-${selectedMeasure?.model}.zip`
      );
    });
  };

  return (
    <div data-testid="measure-list">
      <div tw="flex flex-col">
        <div tw="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div tw="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div>
              <form onSubmit={handleSubmit}>
                <table
                  style={{ marginLeft: 20, marginTop: 20, marginBottom: 20 }}
                >
                  <thead>
                    <tr>
                      <TextField
                        onChange={(newValue) => {
                          props.setSearchCriteria(newValue.target.value);
                        }}
                        id="searchMeasure"
                        name="searchMeasure"
                        placeholder="Search Measure"
                        type="search"
                        fullWidth
                        data-testid="measure-search-input"
                        label="Filter Measures"
                        variant="outlined"
                        defaultValue={props.searchCriteria}
                        value={props.searchCriteria}
                        inputProps={{
                          "data-testid": "searchMeasure-input",
                          "aria-required": "false",
                        }}
                        InputProps={searchInputProps}
                        sx={searchInputStyle}
                      />
                    </tr>
                  </thead>
                </table>
              </form>
              <table tw="min-w-full" style={{ borderTop: "solid 1px #DDD" }}>
                <thead tw="bg-slate">
                  <tr>
                    <th scope="col" className="col-header">
                      Measure Name
                    </th>
                    <th scope="col" className="col-header">
                      Version
                    </th>
                    <th scope="col" className="col-header">
                      Model
                    </th>
                    <th scope="col" className="col-header">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody data-testid="table-body" className="table-body">
                  {props.measureList?.map((measure, i) => (
                    <tr
                      key={`${measure.id}-${i}`}
                      data-testid="row-item"
                      className={i % 2 === 0 ? "odd" : ""}
                    >
                      <td tw="w-7/12">{measure.measureName}</td>
                      <td>
                        {versionFormat(
                          measure?.version,
                          measure?.revisionNumber
                        )}
                        <Chip tw="ml-6" className="chip-draft" label="Draft" />
                      </td>
                      <td>{measure.model}</td>
                      <td>
                        <Button
                          variant="outline-secondary"
                          onClick={(e) => {
                            if (getFeatureFlag("export")) {
                              handleOpen(measure, e);
                            } else {
                              history.push(
                                `/measures/${measure.id}/edit/details`
                              );
                            }
                          }}
                          data-testid={
                            getFeatureFlag("export")
                              ? `measure-action-${measure.id}`
                              : `edit-measure-${measure.id}`
                          }
                        >
                          {getFeatureFlag("export") ? "Select" : "View"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Popover
                optionsOpen={optionsOpen}
                anchorEl={anchorEl}
                handleClose={handleClose}
                canEdit={true}
                editViewSelectOptionProps={{
                  label: "View",
                  toImplementFunction: viewEditredirect,
                  dataTestId: `edit-measure-${selectedMeasure?.id}`,
                }}
                otherSelectOptionProps={[
                  {
                    label: "Export",
                    toImplementFunction: zipData,
                    dataTestId: `export-measure-${selectedMeasure?.id}`,
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
