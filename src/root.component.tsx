import React from "react";
import tw from "twin.macro";

const Notice = tw.span`text-green-700`;
export default function Root(props) {
  return <Notice>{props.name} is mounted!!</Notice>;
}
