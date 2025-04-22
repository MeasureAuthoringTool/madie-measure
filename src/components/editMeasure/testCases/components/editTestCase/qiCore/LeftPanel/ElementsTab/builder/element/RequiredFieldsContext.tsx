import React, { createContext, useContext, useMemo } from "react";

// Create context
const RequiredFieldsContext = createContext(null);

// Create custom hook to use the context
export const useRequiredFields = () => {
  const context = useContext(RequiredFieldsContext);
  if (!context) {
    throw new Error("useRequiredFields must be used within a RequiredFieldsProvider");
  }
  return context;
};

// Provider Component
export const RequiredFieldsProvider = ({ children, requiredFields }) => {
  const value = useMemo(() => requiredFields, [requiredFields]); // probably don't need this

  return (
    <RequiredFieldsContext.Provider value={value}>
      {children}
    </RequiredFieldsContext.Provider>
  );
};