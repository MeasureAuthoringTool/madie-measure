import React from "react";
import tw from "twin.macro";
import "styled-components/macro";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import { Link } from "react-router-dom";
import Measure from "../../../models/Measure";

const HeaderContent = tw.div`h-44 text-white px-8 py-6 flex justify-center items-start flex-col`;

export default function Header(props: { measure: Measure }) {
  return (
    <div
      className="container-header-gradient"
      data-testid="edit-measure-header"
    >
      <HeaderContent>
        <div tw="mb-2" role="presentation">
          <Breadcrumbs aria-label="measures">
            <Link tw="text-white" to="/measures">
              Measures
            </Link>
          </Breadcrumbs>
        </div>
        <div>
          <p tw="text-3xl py-0 mb-4">{props.measure.measureName}</p>
        </div>
        <div tw="flex flex-nowrap justify-start items-center">
          {[
            "Active",
            props.measure.model,
            props.measure.version,
            props.measure.measurementPeriodStart +
              " - " +
              props.measure.measurementPeriodEnd,
          ].map((val, key) => {
            if (val)
              return (
                <p
                  key={key}
                  tw="pl-4 ml-4 mb-0 border-l-2 border-[rgba(221,221,221, 0.5)] leading-none first:pl-0 first:ml-0 first:border-0"
                >
                  {val}
                </p>
              );
          })}
        </div>
      </HeaderContent>
    </div>
  );
}
