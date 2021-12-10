import React from "react";
import tw from "twin.macro";
import "styled-components/macro";

import { Measure } from "../../models/Measure";
import { useHistory } from "react-router-dom";

export default function MeasureList(props: { measureList: Measure[] }) {
  const history = useHistory();

  return (
    <div data-testid="measure-list">
      <div tw="flex flex-col">
        <div tw="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div tw="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div tw="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table tw="min-w-full divide-y divide-gray-200">
                <thead tw="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      tw="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      tw="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Model
                    </th>
                    <th
                      scope="col"
                      tw="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      State
                    </th>
                    <th
                      scope="col"
                      tw="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Version
                    </th>
                    <th
                      scope="col"
                      tw="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Revision
                    </th>
                    <th
                      scope="col"
                      tw="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    />
                  </tr>
                </thead>
                <tbody>
                  {props.measureList?.map((measure, measureIdx) => (
                    <tr key={measure.measureHumanReadableId} tw="bg-white">
                      <td tw="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <button
                          type="button"
                          onClick={() => history.push("#")}
                          data-testid={`measure-button-${measure.measureHumanReadableId}`}
                        >
                          {measure.measureName}
                        </button>
                      </td>
                      <td tw="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {measure.model}
                      </td>
                      <td tw="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {measure.state}
                      </td>
                      <td tw="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {measure.version}
                      </td>
                      <td tw="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {measure.revisionNumber}
                      </td>
                      <td tw="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            history.push(`/measure/${measure.id}/edit`);
                          }}
                          tw="text-blue-600 hover:text-blue-900"
                          data-testid={`edit-measure-${measure.id}`}
                        >
                          Edit
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
