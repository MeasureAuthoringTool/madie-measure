import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import { TruncateText } from "@madie/madie-design-system/dist/react";
import * as _ from "lodash";
import { useMeasureServiceApi } from "@madie/madie-util";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import tw from "twin.macro";
import "styled-components/macro";
import { convertDate } from "../../../../testCases/components/testCaseLanding/common/TestCaseTable/TestCaseTable";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Component, Measure } from "@madie/madie-models";
import { IconButton, Tooltip } from "@mui/material";
import {
  CollapseIcon,
  ExpandIcon,
} from "../../../../../../icons/MeasureListTableRightArrowIcons";

const TH = tw.th`p-3 text-left text-sm font-bold capitalize`;

export default function AddedComponentsTable({
  components,
  onComponentsUpdate,
}: {
  components: Component[];
  onComponentsUpdate: (updatedComponents: Component[]) => void;
}) {
  const [hoveredHeader, setHoveredHeader] = useState<string>("");
  const measureServiceApi = useRef(useMeasureServiceApi()).current;
  const [retrievedComponents, setRetrievedComponents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedGroupForExpansion, setSelectedGroupForExpansion] =
    useState(null);
  const [isGroupRowExpanded, setIsGroupRowExpanded] = useState<boolean>(false);
  const [expandedGroupsData, setExpandedGroupsData] = useState<any[]>([]);

  const handleGroupRowClick = (component) => {
    if (!isGroupRowExpanded || selectedGroupForExpansion !== component.id) {
      setSelectedGroupForExpansion(component.id);
      setExpandedGroupsData(component.groups || []);
      setIsGroupRowExpanded(true);
    } else {
      setIsGroupRowExpanded(false);
      setExpandedGroupsData([]);
      setSelectedGroupForExpansion(null);
    }
  };

  const fetchMeasuresForComponents = useCallback(async () => {
    if (!components?.length) {
      setRetrievedComponents([]);
      return;
    }
    try {
      // multiple components can share the same measureId (different groups).
      // we only need each measureId once.
      const componentMeasureIds = _.uniq(components.map((c) => c.measureId));

      const results = await measureServiceApi.fetchMeasuresByIds(
        componentMeasureIds
      );
      setRetrievedComponents(results);
    } catch (err) {
      console.error(err);
    }
  }, [components, measureServiceApi]);

  useEffect(() => {
    fetchMeasuresForComponents();
  }, [fetchMeasuresForComponents]);

  const handleDeleteComponent = (measureId: string) => {
    setLoading(true);
    try {
      const updatedComponents = components.filter(
        (comp) => comp.measureId !== measureId
      );

      onComponentsUpdate(updatedComponents);
    } catch (err) {
      console.error("Error deleting component:", err);
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo<ColumnDef<Measure>[]>(() => {
    const columnDefs = [
      {
        header: "Measure",
        cell: (info) => (
          <TruncateText
            text={info.row.original.measureName}
            maxLength={120}
            dataTestId={`measure-name-${info.row.original.id}`}
          />
        ),
        accessorKey: "measureName",
      },
      {
        header: "Version",
        cell: (info) => (
          <>
            <TruncateText
              text={info.row.original.version}
              maxLength={20}
              dataTestId={`measure-version-${info.row.original.id}`}
            />
          </>
        ),
        accessorKey: "version",
      },
      {
        header: "CMS ID",
        cell: (info) => (
          <TruncateText
            text={_.toString(info.row.original?.measureSet?.cmsId)}
            maxLength={20}
            dataTestId={`measure-cmsId-${info.row.original.id}`}
          />
        ),
        accessorKey: "cmsId",
      },
      {
        header: "Updated",
        cell: (info) => {
          const converted = convertDate(info.row.original.lastModifiedAt);
          const { date } = converted;
          return <div>{date}</div>;
        },
        accessorKey: "lastModifiedAt",
      },
      {
        id: "actions",
        header: null,
        cell: (info) => (
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => handleDeleteComponent(info.row.original.id)}
              disabled={loading}
              data-testid={`delete-component-${info.row.original.id}`}
            >
              <DeleteOutlinedIcon sx={{ color: "#D92F2F" }} />
            </IconButton>
          </Tooltip>
        ),
        accessorKey: "actions",
      },
      {
        header: "",
        cell: (info) => {
          const handleKeyDown = (e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleGroupRowClick(info.row.original);
            }
          };
          return (
            <span
              role="button"
              tabIndex={0}
              onClick={() => {
                handleGroupRowClick(info.row.original);
              }}
              onKeyDown={handleKeyDown}
              style={{
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isGroupRowExpanded &&
              selectedGroupForExpansion === info.row.original.id ? (
                <CollapseIcon />
              ) : (
                <ExpandIcon />
              )}
            </span>
          );
        },
        accessorKey: "expandArrow",
      },
    ];

    return columnDefs;
  }, [components, isGroupRowExpanded]);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data: retrievedComponents,
    columns,
    getRowId: (row) => row.id,
    defaultColumn: {
      size: 200,
      minSize: 50,
      maxSize: 500,
    },
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    enableRowSelection: true,
  });

  const groupColumns = useMemo<ColumnDef<any>[]>(() => {
    return [
      {
        header: "Population Criteria",
        cell: (info) => (
          <TruncateText
            text={info.row.original.displayId}
            maxLength={120}
            dataTestId={`group-name-${info.row.original.id}`}
          />
        ),
        accessorKey: "displayId",
      },
    ];
  }, []);

  const uniqueMeasures = _.uniqBy(components, (c) => c.measureId);
  return components.length > 0 ? (
    <div>
      <h3
        style={{ fontWeight: 500, marginBottom: 24 }}
      >{`Selected Composite Measure Components (${uniqueMeasures.length})`}</h3>
      <div className="measure-table no-margin no-vert-borders no-radius middle-align-row">
        <div className="table" style={{ overflow: "auto" }}>
          <table
            tw="min-w-full"
            data-testid="measure-list-tbl"
            className="ml-table"
            style={{
              borderSpacing: "0 2em !important",
            }}
          >
            <thead tw="bg-slate">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isHovered = hoveredHeader?.includes(header.id);
                    return (
                      <TH
                        key={header.id}
                        scope="col"
                        onClick={header.column.getToggleSortingHandler()}
                        onMouseEnter={() => setHoveredHeader(header.id)}
                        onMouseLeave={() => setHoveredHeader(null)}
                        className="header-cell"
                      >
                        {header.isPlaceholder ? null : (
                          <button
                            className={
                              header.column.getCanSort()
                                ? "cursor-pointer select-none header-button"
                                : "header-button"
                            }
                            title={
                              header.column.getCanSort()
                                ? header.column.getNextSortingOrder() === "asc"
                                  ? "Sort ascending"
                                  : header.column.getNextSortingOrder() ===
                                    "desc"
                                  ? "Sort descending"
                                  : "Clear sort"
                                : undefined
                            }
                          >
                            <span className="arrowDisplay">
                              {header.column.columnDef.header !== "" &&
                                header.column.getCanSort() &&
                                isHovered &&
                                !header.column.getIsSorted() && (
                                  <UnfoldMoreIcon />
                                )}
                              {header.column.columnDef.header !== "" &&
                                ({
                                  asc: <KeyboardArrowUpIcon />,
                                  desc: <KeyboardArrowDownIcon />,
                                }[header.column.getIsSorted() as string] ??
                                  null)}
                            </span>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </button>
                        )}
                      </TH>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="table-body" style={{ padding: 20 }}>
              {table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <tr
                    key={row.id}
                    className="ml-tr"
                    data-testid={`row-item`}
                    style={{
                      borderTop: "solid 1px #8c8c8c",
                      borderSpacing: "0 2em !important",
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} data-testid={`measure-name-${cell.id}`}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>

                  {selectedGroupForExpansion === row.original.id && (
                    <tr data-testid={`expanded-group-row`}>
                      <td colSpan={columns.length}>
                        <div
                          style={{
                            paddingLeft: "40px",
                            paddingTop: "12px",
                            paddingBottom: "12px",
                            paddingRight: "40px",
                          }}
                        >
                          <table
                            style={{
                              width: "100%",
                              borderCollapse: "collapse",
                            }}
                          >
                            <thead>
                              <tr
                                style={{
                                  backgroundColor: "#ededed",
                                  borderBottom: "1px solid #8c8c8c",
                                }}
                              >
                                {groupColumns.map((column) => (
                                  <th
                                    key={column.id}
                                    style={{
                                      padding: "8px 16px",
                                      textAlign: "left",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {column.header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {expandedGroupsData?.map((group) => (
                                <tr
                                  key={`group-${group.id}`}
                                  style={{ borderBottom: "1px solid #ddd" }}
                                >
                                  {groupColumns.map((column: any) => (
                                    <td
                                      key={column?.accessorKey || column.id}
                                      style={{ padding: "8px 16px" }}
                                    >
                                      {flexRender(
                                        column.cell ?? column.accessorKey,
                                        {
                                          row: {
                                            id: group.id,
                                            original: group,
                                          },
                                          getValue: () =>
                                            group[column.accessorKey],
                                        }
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ) : null;
}
