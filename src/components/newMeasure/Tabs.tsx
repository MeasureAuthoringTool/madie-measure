import React from "react";
import { Tabs as MUITabs, Tab } from "@mui/material";

type Props = {
  label: string;
  onChange: Function;
  items: Array<object>;
};
const Tabs = ({ value, onChange, items }: Props & any) => {
  return (
    <MUITabs value={value} onChange={onChange}>
      {items.forEach((item, index) => (
        <Tab label={item.label} id={item.id} data-testid={item.dataTestID}>
          {item.value}
        </Tab>
      ))}
    </MUITabs>
  );
};
