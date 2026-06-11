import React, { useEffect, useRef } from "react";
import {
  ResourceActionType,
  useQiCoreResource,
} from "../../../../../util/QiCorePatientProvider";
import _ from "lodash";
import Builder from "./builder/Builder";

const ElementsTab = ({
  canEdit,
  editorVal,
  setEditorVal,
  testCase,
  setValidationSchema,
  setInitialFormikValuesStu6,
  activeTab,
  isComposite = false,
  onInsertTCClick = () => {},
}) => {
  const { state, dispatch } = useQiCoreResource();
  const lastJsonRef = useRef(null);
  useEffect(() => {
    if (
      !_.isEmpty(editorVal) &&
      editorVal !== "Loading..." &&
      (_.isNil(lastJsonRef.current) || editorVal !== lastJsonRef.current)
    ) {
      lastJsonRef.current = editorVal;
      const bundle = JSON.parse(editorVal);
      dispatch({
        type: ResourceActionType.LOAD_BUNDLE,
        payload: bundle,
      });
    }
  }, [dispatch, editorVal]);

  useEffect(() => {
    const bundleStr = JSON.stringify(state?.bundle, null, 2);
    if (state.bundle && !_.isEmpty(bundleStr) && bundleStr !== editorVal) {
      lastJsonRef.current = bundleStr;
      setEditorVal(bundleStr);
    }
  }, [state]);

  return (
    <>
      <Builder
        testCase={testCase}
        canEdit={canEdit}
        setInitialFormikValuesStu6={setInitialFormikValuesStu6}
        setValidationSchema={setValidationSchema}
        activeTab={activeTab}
        isComposite={isComposite}
        onInsertTCClick={onInsertTCClick}
      />
    </>
  );
};

export default ElementsTab;
