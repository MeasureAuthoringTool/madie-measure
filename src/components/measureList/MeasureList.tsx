import React from "react";
import "twin.macro";
import "styled-components/macro";

import { Measure } from "@madie/madie-models";
import { useHistory } from "react-router-dom";
import { Chip } from "@mui/material";

export default function MeasureList(props: { measureList: Measure[] }) {
  const history = useHistory();
  return (
    <div data-testid="measure-list">
      <div tw="flex flex-col">
        <div tw="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div tw="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div>
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
                        {measure.version}
                        <Chip tw="ml-6" className="chip-draft" label="Draft" />
                      </td>
                      <td>{measure.model}</td>
                      <td>
                        <button
                          className="action-button"
                          onClick={() => {
                            history.push(`/measures/${measure.id}/edit`);
                          }}
                          tw="text-blue-600 hover:text-blue-900"
                          data-testid={`edit-measure-${measure.id}`}
                        >
                          <div className="action">View</div>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
