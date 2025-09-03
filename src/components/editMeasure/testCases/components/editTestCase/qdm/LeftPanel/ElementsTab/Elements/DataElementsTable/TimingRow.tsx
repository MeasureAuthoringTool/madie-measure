import React from "react";

interface timingProps {
  abbr: string;
  val: string;
}
const TimingRow = ({ abbr, val }: timingProps) => {
  return (
    <div className="timing-row">
      <div className="abbrev">{abbr}: &nbsp;</div>
      <div>{val}</div>
    </div>
  );
};

export default TimingRow;
