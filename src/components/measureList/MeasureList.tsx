import React from "react";
import "twin.macro";
import "styled-components/macro";

import { Measure } from "@madie/madie-models";
import { useHistory } from "react-router-dom";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export default function MeasureList(props: { measureList: Measure[] }) {
  const history = useHistory();
  return (
    <div data-testid="measure-list">
      <div tw="flex flex-col">
        <div tw="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div tw="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div>
              <table tw="min-w-full" style={{ borderTop: "solid 1px #DDD" }}>
                <thead>
                  <tr>
                    <th scope="col" className="col-header">
                      Measure Name
                    </th>
                    <th scope="col" className="col-header">
                      Model
                    </th>
                    <th scope="col" className="col-header">
                      Version
                    </th>
                    <th scope="col" className="col-header">
                      Revision
                    </th>
                    <th scope="col" className="col-header">
                      Status
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
                      <td>{measure.measureName}</td>
                      <td>{measure.model}</td>
                      <td>{measure.version}</td>
                      <td>{measure.revisionNumber}</td>
                      <td>
                        <div>
                          <div className="activity">
                            <div className="bubble active-bubble" />
                            <div>{measure.active ? "Active" : "Inactive"}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <button
                          className="action-button"
                          onClick={() => {
                            history.push(`/measures/${measure.id}/edit`);
                          }}
                          tw="text-blue-600 hover:text-blue-900"
                          data-testid={`edit-measure-${measure.id}`}
                        >
                          <div className="action">View/Edit</div>
                          <div className="chevron-container">
                            <ExpandMoreIcon />
                          </div>
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
