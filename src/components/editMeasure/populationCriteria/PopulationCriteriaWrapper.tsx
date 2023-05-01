import React, { Suspense } from "React";

import PopulationCriteriaHome from "./PopulationCriteriaHome";
const PopulationCriteriaWrapper = () => {
  return (
    <Suspense fallback={<div>loading</div>}>
      <PopulationCriteriaHome />
    </Suspense>
  );
};

export default PopulationCriteriaWrapper;
