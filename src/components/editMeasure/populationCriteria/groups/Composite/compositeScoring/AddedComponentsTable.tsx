import { formatCmsId } from "@madie/madie-util";
import React, { useMemo, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import {
  Button,
  MadieDeleteDialog,
  TruncateText,
} from "@madie/madie-design-system/dist/react";
import * as _ from "lodash";
import { Trash2 } from "lucide-react";
import tw from "twin.macro";
import "styled-components/macro";
import { convertDate } from "../../../../testCases/components/testCaseLanding/common/TestCaseTable/TestCaseTable";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Component, Group, Measure } from "@madie/madie-models";
import { IconButton, Switch, Tooltip } from "@mui/material";
import {
  CollapseIcon,
  ExpandIcon,
} from "../../../../../../icons/MeasureListTableRightArrowIcons";
import { useNavigate } from "react-router-dom";

const TH = tw.th`p-3 text-left text-sm font-bold capitalize`;

type ComponentGroup = Group & {
  description?: string;
  groupDescription?: string;
  measureGroupTypes?: string[];
  type?: string;
};

export default function AddedComponentsTable({
  components,
  selectedComponents = [],
  canEdit,
  onToggleGroup = () => null,
  onDeleteComponent,
}: {
  components: Measure[];
  selectedComponents?: Component[];
  canEdit: boolean;
  onToggleGroup?: (
    measureId: string,
    groupId: string,
    include: boolean
  ) => void;
  onDeleteComponent: (componentId: string) => void;
}) {
  const navigate = useNavigate();
  const [hoveredHeader, setHoveredHeader] = useState<string | null>("");
  const [componentToDelete, setComponentToDelete] = useState<Measure | null>(
    null
  );

  const [selectedGroupForExpansion, setSelectedGroupForExpansion] = useState<
    string | null
  >(null);
  const [isGroupRowExpanded, setIsGroupRowExpanded] = useState<boolean>(false);
  const [expandedGroupsData, setExpandedGroupsData] = useState<
    ComponentGroup[]
  >([]);

  const handleGroupRowClick = (component: Measure) => {
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

  const handleDeleteComponent = (measureId: string) => {
    try {
      onDeleteComponent(measureId);
    } catch (err) {
      console.error("Error deleting component:", err);
    }
  };

  const isGroupIncluded = (measureId: string | null, groupId: string) =>
    !!measureId &&
    selectedComponents?.some(
      (component) =>
        component.measureId === measureId && component.groupId === groupId
    );

  const getIncludedGroupCount = (measureId: string | null) =>
    measureId
      ? selectedComponents?.filter(
          (component) => component.measureId === measureId
        ).length || 0
      : 0;

  const getGroupType = (group: ComponentGroup) => {
    if (Array.isArray(group?.measureGroupTypes)) {
      return group.measureGroupTypes.join(", ") || "-";
    }
    return group?.type || "-";
  };

  const getGroupDescription = (group: ComponentGroup) => {
    const description = group?.groupDescription || group?.description;
    if (!description) {
      return "-";
    }
    const descriptionElement = document.createElement("div");
    descriptionElement.innerHTML = description;
    return (
      descriptionElement.textContent || descriptionElement.innerText || "-"
    );
  };

  const columns = useMemo<ColumnDef<Measure>[]>(() => {
    const columnDefs: ColumnDef<Measure>[] = [
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
            text={formatCmsId(
              info.row.original?.measureSet?.cmsId,
              info.row.original?.model
            )}
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
        header: "",
        cell: (info) => {
          const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
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

    // Do not display delete action on read only views
    if (canEdit) {
      columnDefs.push({
        id: "actions",
        header: "",
        cell: (info) => (
          <Tooltip
            title="Delete"
            slotProps={{
              tooltip: {
                sx: {
                  zIndex: 99,
                  backgroundColor: "#333",
                  "& .MuiTooltip-arrow": {
                    color: "#333",
                  },
                },
              },
            }}
          >
            <IconButton
              size="small"
              onClick={() => setComponentToDelete(info.row.original)}
              data-testid={`delete-component-${info.row.original.id}`}
            >
              <Trash2 size={20} color="#D92F2F" />
            </IconButton>
          </Tooltip>
        ),
        accessorKey: "actions",
      });
    }

    return columnDefs;
  }, [components, canEdit, isGroupRowExpanded, selectedGroupForExpansion]);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data: components,
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
      {
        header: "Type",
        cell: (info) => (
          <TruncateText
            text={getGroupType(info.row.original)}
            maxLength={80}
            dataTestId={`group-type-${info.row.original.id}`}
          />
        ),
        accessorKey: "measureGroupTypes",
      },
      {
        header: "Scoring",
        cell: (info) => (
          <TruncateText
            text={info.row.original.scoring || "-"}
            maxLength={80}
            dataTestId={`group-scoring-${info.row.original.id}`}
          />
        ),
        accessorKey: "scoring",
      },
      {
        header: "Description",
        cell: (info) => (
          <TruncateText
            text={getGroupDescription(info.row.original)}
            maxLength={120}
            dataTestId={`group-description-${info.row.original.id}`}
          />
        ),
        accessorKey: "groupDescription",
      },
      {
        id: "actions",
        header: "Actions",
        cell: (info) => {
          const measureId = selectedGroupForExpansion;
          const groupIndex = expandedGroupsData.findIndex(
            (group) => group.id === info.row.original.id
          );
          return (
            <Button
              variant="outline-filled"
              data-testid={`view-group-${info.row.original.id}`}
              // aria-label={`${buttonText} Measure ${
              //   info.row.original.measureName
              // } ${info.row.original.version}${
              //   info.row.original.actions.measureMetaData?.draft ? " Draft" : ""
              // }${isLockedByOther ? ` (Locked by ${lockedByDisplayName})` : ""}`}
              onClick={() => {
                navigate(
                  `/measures/${measureId}/edit/groups/${groupIndex + 1}`
                );
              }}
              tabIndex={0}
              role="button"
            >
              View
            </Button>
          );
        },
      },
      {
        id: "include",
        header: "Include",
        cell: (info) => {
          const measureId = selectedGroupForExpansion;
          const groupCount = expandedGroupsData.length;
          const checked = isGroupIncluded(measureId, info.row.original.id);
          const includedGroupCount = getIncludedGroupCount(measureId);
          return (
            <Switch
              checked={checked}
              disabled={
                !canEdit ||
                groupCount <= 1 ||
                (checked && includedGroupCount <= 1)
              }
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                if (measureId) {
                  onToggleGroup(
                    measureId,
                    info.row.original.id,
                    event.target.checked
                  );
                }
              }}
              slotProps={{
                input: {
                  "aria-label": `Include ${info.row.original.displayId}`,
                },
              }}
              data-testid={`include-group-${info.row.original.id}`}
            />
          );
        },
      },
    ];
  }, [
    canEdit,
    expandedGroupsData,
    onToggleGroup,
    selectedComponents,
    selectedGroupForExpansion,
  ]);

  const uniqueMeasures = _.uniqBy(components, (c) => c.id);
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
                                            group[
                                              column.accessorKey as keyof ComponentGroup
                                            ],
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

      <MadieDeleteDialog
        open={!!componentToDelete}
        onClose={() => setComponentToDelete(null)}
        onContinue={() => {
          if (componentToDelete) {
            handleDeleteComponent(componentToDelete.id);
          }
          setComponentToDelete(null);
        }}
        dialogTitle="Delete Component Measure"
        hideWarning
        customDialogBody={
          <>
            Are you sure you want to delete the component measure{" "}
            <span className="strong">{componentToDelete?.measureName}</span>
          </>
        }
      />
    </div>
  ) : null;
}
