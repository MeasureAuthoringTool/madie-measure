import React, { Suspense, useState } from "react";

import PopulationCriteriaHome from "./PopulationCriteriaHome";
import LockedMessageModal from "../../common/lockedMessageModal/LockedMessageModal";
const PopulationCriteriaWrapper = ({
  measureCanEdit,
  measureLockedBy = undefined,
  displayLockedMeasurePopup = true,
}) => {
  const [lockedModalOpen, setLockedModalOpen] = useState(
    measureCanEdit && !measureLockedBy ? false : true
  );
  return (
    <>
      <Suspense fallback={<div>loading</div>}>
        <PopulationCriteriaHome
          measureCanEdit={measureCanEdit && !measureLockedBy}
        />
      </Suspense>
      {measureCanEdit && measureLockedBy && displayLockedMeasurePopup && (
        <LockedMessageModal
          lockedType={"measure"}
          lockedBy={measureLockedBy}
          lockedModalOpen={lockedModalOpen}
          setLockedModalOpen={setLockedModalOpen}
        />
      )}
    </>
  );
};

export default PopulationCriteriaWrapper;
