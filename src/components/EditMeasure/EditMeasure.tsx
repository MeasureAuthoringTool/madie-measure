import * as React from "react";
import "styled-components/macro";
import EditMeasureNav from "./EditMeasureNav/EditMeasureNav";
import EditMeasureRoutes from "../../routes/EditMeasureRoutes";

export default function EditMeasure() {
  return (
    <div>
      <EditMeasureNav />
      <EditMeasureRoutes />
    </div>
  );
}
