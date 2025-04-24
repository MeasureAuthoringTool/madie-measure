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
      getFirstChildren: (path) => {
        return formInfo
          .filter((el) => {
            if (!el[0]?.startsWith(path + ".")) return false;
            const subPath = el[0].slice(path.length + 1);
            return !subPath.includes(".");
          })
          .map((el) => el[1]);
      },
      getParentDefinition: (path) => {
        const lastDotIndex = path.lastIndexOf(".");
          if (lastDotIndex === -1) return undefined; // No parent, it's a root-level node
          const parentPath = path.slice(0, lastDotIndex);
          const found = formInfo.find(([key]) => key === parentPath);
          return found?.[1];
      }
    };
  }, [requiredFields, formInfo]);

  return (
    <RequiredFieldsContext.Provider value={value}>
      {children}
    </RequiredFieldsContext.Provider>
  );
};
