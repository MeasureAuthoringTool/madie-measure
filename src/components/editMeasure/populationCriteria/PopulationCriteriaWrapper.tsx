import React, { Suspense } from "react";

import PopulationCriteriaHome from "./PopulationCriteriaHome";
const PopulationCriteriaWrapper = ({ measureLockedByAnotherUser }) => {
  return (
    <Suspense fallback={<div>loading</div>}>
      <PopulationCriteriaHome
        measureLockedByAnotherUser={measureLockedByAnotherUser}
      />
    </Suspense>
  );
};

export default PopulationCriteriaWrapper;
