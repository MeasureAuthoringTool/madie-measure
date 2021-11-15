import React from "react";
import tw from "twin.macro";

export default function MeasureLanding() {
  return (
    <>
      <span>Welcome </span>
      <button
        type="button"
        tw="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={() => (window.location.href = "/measure/create")}
        data-testid="create-new-measure-button"
      >
        New Measure
      </button>
    </>
  );
}
