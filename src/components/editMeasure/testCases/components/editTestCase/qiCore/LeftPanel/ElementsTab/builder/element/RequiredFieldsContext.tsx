import React, { createContext, useContext, useMemo } from "react";

// Create context
const RequiredFieldsContext = createContext(null);

// Create custom hook to use the context
export const useRequiredFields = () => {
  const context = useContext(RequiredFieldsContext);
  if (!context) {
    throw new Error(
      "useRequiredFields must be used within a RequiredFieldsProvider"
    );
  }
  return context;
};
/*
This guy returns a constant time lookup for weather or not a field is required. 
 ex: {
  ClaimResponse.item.adjudication: true
}

  This also means that if we have a multiple cardinality label, we need to figure out if it's required by stripping indeces
  ClaimResponse.item.adjudication[0].id
*/
// Provider Component
export const RequiredFieldsProvider = ({
  children,
  requiredFields,
  formInfo,
}) => {
  const value = useMemo(() => {
    return {
      requiredFields,
      formInfo,
      // path can be ClaimResponse.item
      // I want everything that's ClaimResponse.item.id, ClaimResponse.item.text, but not ClaimResponse.item.nothing.else
    };
  }, [requiredFields, formInfo]);

  return (
    <RequiredFieldsContext.Provider value={value}>
      {children}
    </RequiredFieldsContext.Provider>
  );
};
