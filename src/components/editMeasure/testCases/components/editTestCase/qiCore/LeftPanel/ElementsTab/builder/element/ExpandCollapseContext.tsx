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

  const expandAll = useCallback(() => {
    setCommand((prev) => ({ value: true, id: (prev?.id ?? 0) + 1 }));
  }, []);

  const collapseAll = useCallback(() => {
    setCommand((prev) => ({ value: false, id: (prev?.id ?? 0) + 1 }));
  }, []);

  return (
    <ExpandCollapseContext.Provider value={{ command, expandAll, collapseAll }}>
      {children}
    </ExpandCollapseContext.Provider>
  );
};
