import React, { useEffect, useMemo, useState } from "react";
import {
  TruncateText,
  MadieDialog,
} from "@madie/madie-design-system/dist/react";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { Measure } from "@madie/madie-models";
import * as _ from "lodash";
import tw from "twin.macro";
import "styled-components/macro";

const TH = tw.th`p-3 text-left text-sm font-bold capitalize`;

export default function AddComponentsDialog({ open, onClose, data = [] }) {
  const IndeterminateCheckbox = ({ indeterminate, checked, ...rest }: any) => {
    const ref = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (ref.current) {
        ref.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    return <input type="checkbox" ref={ref} checked={checked} {...rest} />;
  };

  const columns = useMemo<ColumnDef<Measure>[]>(() => {
    const columnDefs = [
      {
        id: "select",
        header: ({ table }) => {
          const visibleRows = table.getRowModel().rows;

          const allVisibleSelected = visibleRows.every((row) =>
            row.getIsSelected()
          );
          const someVisibleSelected = visibleRows.some((row) =>
            row.getIsSelected()
          );

          const toggleVisibleRows = () => {
            const shouldSelectAll = !allVisibleSelected;
            visibleRows.forEach((row) => row.toggleSelected(shouldSelectAll));
          };

          return (
            <IndeterminateCheckbox
              checked={allVisibleSelected}
              indeterminate={!allVisibleSelected && someVisibleSelected}
              onChange={toggleVisibleRows}
              aria-label="Test Case Selection"
              tabIndex={0}
            />
          );
        },

        cell: (info) => (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 16,
            }}
          >
            <div className="px-1">
              <IndeterminateCheckbox
                checked={info.row.getIsSelected()}
                disabled={!info.row.getCanSelect()}
                indeterminate={info.row.getIsSomeSelected()}
                onChange={info.row.getToggleSelectedHandler()}
              />
            </div>
          </div>
        ),
      },
      {
        header: "Measure Name",
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
        cell: (info) => (
          <TruncateText
            text={_.toString(info.row.original?.measureSet?.cmsId)}
            maxLength={20}
            dataTestId={`measure-lastModifiedAt-${info.row.original.id}`}
          />
        ),
        accessorKey: "lastModifiedAt",
      },
    ];

    return columnDefs;
  }, []);

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    defaultColumn: {
      size: 200,
      minSize: 50,
      maxSize: 500,
    },
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleDialogClose = () => {
    onClose();
  };

  const handleDialogSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <MadieDialog
      title="Select Composite Measure Components"
      dialogProps={{
        onClose: handleDialogClose,
        open,
        onSubmit: handleDialogSubmit,
      }}
      cancelButtonProps={{
        variant: "secondary",
        cancelText: "Cancel",
        "data-testid": "select-composite-measure-components-cancel-button",
      }}
      continueButtonProps={{
        variant: "cyan",
        type: "submit",
        "data-testid": "select-composite-measure-components-continue-button",
        continueText: "Save",
      }}
      maxWidth={"lg"}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead tw="bg-slate">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TH key={header.id} scope="col" className="header-cell">
                  {header.isPlaceholder ? null : (
                    <button className={"header-button"}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </button>
                  )}
                </TH>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </MadieDialog>
  );
}
