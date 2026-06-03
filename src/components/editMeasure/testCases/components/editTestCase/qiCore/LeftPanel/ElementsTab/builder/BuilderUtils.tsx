import _ from "lodash";
import { v4 as uuidv4 } from "uuid";
import { scrollToElementByIdWhenAvailable } from "./Builder";
import { ResourceActionType } from "../../../../../../util/QiCorePatientProvider";

export function handleCancel(
  setSelectedResourceId: (id: string | null) => void,
  savedGridID: string
) {
  setSelectedResourceId(null);
  scrollToElementByIdWhenAvailable(savedGridID);
}

export function handleRowEdit(
  row: any,
  setSelectedResourceId: (id: string) => void,
  setSavedGridID: (id: string) => void
) {
  const id = row?.resource?.id;
  setSelectedResourceId(id);
  scrollToElementByIdWhenAvailable("tc-builder-resource-editor");
  setSavedGridID(`action-center-${id}`);
}

export function handleRowDelete(
  row: any,
  setSelectedResourceId: (id: string) => void,
  dispatch: (action: { type: string; payload: any }) => void
) {
  setSelectedResourceId(null);
  dispatch({
    type: ResourceActionType.REMOVE_BUNDLE_ENTRY,
    payload: row,
  });
}

export function handleRowClone(
  row: any,
  dispatch: (action: { type: string; payload: any }) => void
) {
  const clonedEntry = _.cloneDeep(row);
  const newId = uuidv4();
  if (clonedEntry?.resource) {
    clonedEntry.resource.id = newId;
  }
  if (clonedEntry?.fullUrl) {
    clonedEntry.fullUrl = `https://madie.cms.gov/${clonedEntry.resource.resourceType}/${newId}`;
  }
  dispatch({
    type: ResourceActionType.ADD_BUNDLE_ENTRY,
    payload: clonedEntry,
  });
}
