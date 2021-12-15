import { createContext } from "react";
import Measure from "../../models/Measure";

const MeasureContext = createContext<Measure>(null);

export default MeasureContext;

export const MeasureContextProvider = MeasureContext.Provider;
export const MeasureContextConsumer = MeasureContext.Consumer;
