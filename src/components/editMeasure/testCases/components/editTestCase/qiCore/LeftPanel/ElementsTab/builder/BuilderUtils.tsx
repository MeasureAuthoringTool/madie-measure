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
  dispatch: (action: { type: string; payload: any }) => void
) {
  dispatch({
    type: ResourceActionType.REMOVE_BUNDLE_ENTRY,
    payload: row,
  });
}
