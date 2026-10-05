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
  MadieTable,
  MadieDeleteDialog,
  TruncateText,
} from "@madie/madie-design-system/dist/react";
import * as _ from "lodash";
import { Trash2 } from "lucide-react";
import { convertDate } from "../../../../testCases/components/testCaseLanding/common/TestCaseTable/TestCaseTable";
import { Component, Group, Measure } from "@madie/madie-models";
import { IconButton, Switch, Tooltip } from "@mui/material";
import {
  CollapseIcon,
  ExpandIcon,
} from "../../../../../../icons/MeasureListTableRightArrowIcons";
import { useNavigate } from "react-router-dom";
import "./AddedComponentsTable.scss";

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
  const handleSort = (sort: string) => {
    setSorting((currentSorting) => {
      const activeSort = currentSorting[0];
      if (activeSort?.id !== sort) {
        return [{ id: sort, desc: false }];
      }
      return activeSort.desc ? [] : [{ id: sort, desc: true }];
    });
  };

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
              aria-label={`View Group ${info.row.original.displayId}`}
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
      <div className="measure-table added-components-table no-margin no-vert-borders no-radius middle-align-row">
        <div className="table" style={{ overflow: "auto" }}>
          <MadieTable
            table={table}
            currentSort={sorting[0]?.id}
            currentDirection={
              sorting.length > 0
                ? sorting[0].desc
                  ? "DESC"
                  : "ASC"
                : undefined
            }
            handleSort={handleSort}
            id="addedComponentsTable"
            dataTestId="measure-list-tbl"
            renderExpandedRow={(row) =>
              selectedGroupForExpansion === row.original.id && (
                <tr data-testid="expanded-group-row">
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
              )
            }
          />
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
