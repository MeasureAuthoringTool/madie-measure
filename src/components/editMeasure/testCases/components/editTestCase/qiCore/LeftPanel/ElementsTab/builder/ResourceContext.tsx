import { createContext } from "react";
import { ResourceIdentifier } from "../../../../../../api/models/ResourceIdentifier";

const ResourceContext = createContext<ResourceIdentifier[] | null>(null);

export default ResourceContext;
export const ResourceContextProvider = ResourceContext.Provider;
export const ResourceContextContextConsumer = ResourceContext.Consumer;
