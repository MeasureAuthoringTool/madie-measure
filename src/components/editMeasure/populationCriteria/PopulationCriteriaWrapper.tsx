import React, { Suspense } from "react";

import PopulationCriteriaHome from "./PopulationCriteriaHome";
const PopulationCriteriaWrapper = ({ measureCanEdit }) => {
  return (
    <Suspense fallback={<div>loading</div>}>
      <PopulationCriteriaHome measureCanEdit={measureCanEdit} />
    </Suspense>
  );
};

export default PopulationCriteriaWrapper;
