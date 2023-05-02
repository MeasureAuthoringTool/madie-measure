import React, { Suspense } from "react";

import PopulationCriteriaHome from "./PopulationCriteriaHome";
const PopulationCriteriaWrapper = () => {
  return (
    <Suspense fallback={<div>loading</div>}>
      <PopulationCriteriaHome />
    </Suspense>
  );
};

export default PopulationCriteriaWrapper;
