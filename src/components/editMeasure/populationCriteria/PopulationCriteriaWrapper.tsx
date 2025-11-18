import React, { Suspense, useState } from "react";

import PopulationCriteriaHome from "./PopulationCriteriaHome";
import MeasureLockedPopup from "../measureLockedPopup/MeasureLockedPopup";
const PopulationCriteriaWrapper = ({
  measureCanEdit,
  measureLockedBy = undefined,
}) => {
  const [lockedMeasurePopupOpen, setLockedMeasurePopupOpen] = useState(
    measureCanEdit && !measureLockedBy ? false : true
  );
  return (
    <>
      <Suspense fallback={<div>loading</div>}>
        <PopulationCriteriaHome
          measureCanEdit={measureCanEdit && !measureLockedBy}
        />
      </Suspense>
      {measureCanEdit && measureLockedBy && (
        <MeasureLockedPopup
          measureLockedBy={measureLockedBy}
          lockedMeasurePopupOpen={lockedMeasurePopupOpen}
          setLockedMeasurePopupOpen={setLockedMeasurePopupOpen}
        />
      )}
    </>
  );
};

export default PopulationCriteriaWrapper;
