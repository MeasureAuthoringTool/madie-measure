import { Measure } from "@madie/madie-models";
import useExecutionContext from "./useExecutionContext";

const useMeasureModel = (): Measure["model"] | undefined => {
  const context = useExecutionContext();
  return context?.measureState?.[0]?.model;
};

export default useMeasureModel;
