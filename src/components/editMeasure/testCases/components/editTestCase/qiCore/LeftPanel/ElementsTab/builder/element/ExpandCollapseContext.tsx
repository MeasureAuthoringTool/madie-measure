import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

interface ExpandCollapseCommand {
  value: boolean;
  id: number;
}

interface ExpandCollapseContextValue {
  command: ExpandCollapseCommand | null;
  expandAll: () => void;
  collapseAll: () => void;
  registerSection: () => void;
  unregisterSection: () => void;
  sectionCount: number;
}

const ExpandCollapseContext = createContext<ExpandCollapseContextValue | null>(
  null
);

export const useExpandCollapse = (): ExpandCollapseContextValue | null => {
  return useContext(ExpandCollapseContext);
};

export const ExpandCollapseProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [command, setCommand] = useState<ExpandCollapseCommand | null>(null);
  const [sectionCount, setSectionCount] = useState(0);

  const expandAll = useCallback(() => {
    setCommand((prev) => ({ value: true, id: (prev?.id ?? 0) + 1 }));
  }, []);

  const collapseAll = useCallback(() => {
    setCommand((prev) => ({ value: false, id: (prev?.id ?? 0) + 1 }));
  }, []);

  const registerSection = useCallback(() => {
    setSectionCount((c) => c + 1);
  }, []);

  const unregisterSection = useCallback(() => {
    setSectionCount((c) => Math.max(0, c - 1));
  }, []);

  return (
    <ExpandCollapseContext.Provider
      value={{
        command,
        expandAll,
        collapseAll,
        registerSection,
        unregisterSection,
        sectionCount,
      }}
    >
      {children}
    </ExpandCollapseContext.Provider>
  );
};
