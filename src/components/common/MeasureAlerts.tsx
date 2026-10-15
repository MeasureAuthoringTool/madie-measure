import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  MadieAlert,
  MinimizedAlert,
} from "@madie/madie-design-system/dist/react";

type MinimizedState = {
  minimizedAlerts: Record<string, boolean>;
  errorCount: number;
};

type AlertContext = {
  sources: Map<symbol, MinimizedState>;
  update: (source: symbol, state: MinimizedState) => void;
  remove: (source: symbol) => void;
  restore: () => void;
};

const MeasureAlertsContext = createContext<AlertContext | null>(null);
const expandedAlerts = {};

const contentText = (content: React.ReactNode): string =>
  React.Children.toArray(content)
    .map((child) =>
      React.isValidElement(child)
        ? contentText(child.props.children)
        : String(child)
    )
    .join("\n");

export const MeasureAlertsProvider = ({
  children,
  resetKey,
}: {
  children: React.ReactNode;
  resetKey?: string;
}) => {
  const [sources, setSources] = useState<Map<symbol, MinimizedState>>(
    new Map()
  );
  const update = useCallback((source: symbol, state: MinimizedState) => {
    setSources((previous) => new Map(previous).set(source, state));
  }, []);
  const remove = useCallback((source: symbol) => {
    setSources((previous) => {
      if (!previous.has(source)) return previous;
      const next = new Map(previous);
      next.delete(source);
      return next;
    });
  }, []);
  const restore = useCallback(() => setSources(new Map()), []);

  useEffect(restore, [resetKey, restore]);

  return (
    <MeasureAlertsContext.Provider value={{ sources, update, remove, restore }}>
      {children}
    </MeasureAlertsContext.Provider>
  );
};

export const MinimizedMeasureAlerts = () => {
  const context = useContext(MeasureAlertsContext);
  const container = useRef<HTMLSpanElement>(null);
  const minimizedSources = context
    ? Array.from(context.sources.values()).filter((source) =>
        Object.values(source.minimizedAlerts).some(Boolean)
      )
    : [];

  return (
    <span ref={container} tabIndex={-1} role="group" aria-label="Alert actions">
      {minimizedSources.length > 0 && (
        <MinimizedAlert
          errorCount={minimizedSources.reduce(
            (total, source) => total + source.errorCount,
            0
          )}
          onClick={() => {
            container.current?.focus();
            context.restore();
          }}
        />
      )}
    </span>
  );
};

const MeasureAlert = (props: React.ComponentProps<typeof MadieAlert>) => {
  const context = useContext(MeasureAlertsContext);
  const source = useRef(Symbol("measure-alert")).current;
  const remove = context?.remove;
  const signature = JSON.stringify(
    (props.alerts || [props]).map((alert) => [
      alert.type,
      alert.visible,
      contentText(alert.content),
    ])
  );

  useEffect(() => () => remove?.(source), [remove, source, signature]);

  return context ? (
    <MadieAlert
      {...props}
      minimizedAlerts={
        context.sources.get(source)?.minimizedAlerts || expandedAlerts
      }
      onMinimizedAlertsChange={(minimizedAlerts, errorCount) =>
        context.update(source, { minimizedAlerts, errorCount })
      }
    />
  ) : (
    <MadieAlert {...props} />
  );
};

export default MeasureAlert;
