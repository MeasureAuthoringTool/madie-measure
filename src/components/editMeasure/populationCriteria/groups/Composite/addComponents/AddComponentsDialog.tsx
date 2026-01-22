import React, { useMemo, useState } from "react";
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

export default function AddComponentsDialog({ open, onClose }) {
  const TH = tw.th`p-3 text-left text-sm font-bold capitalize`;

  const columns = useMemo<ColumnDef<Measure>[]>(() => {
    const columnDefs = [
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
    data: [],
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
              {headerGroup.headers.map((header) => {
                return (
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
                );
              })}
            </tr>
          ))}
        </thead>
      </table>
    </MadieDialog>
  );
}
