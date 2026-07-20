import { ElementDefinition, Resource } from "fhir/r4";
import { Model } from "@madie/madie-models";

export interface TypeComponentProps {
  label?: string;
  canEdit: boolean;
  value?: any;
  onChange?: (nextValue: any) => void;
  onBlur?: (e: any) => void;
  structureDefinition?: ElementDefinition;
  fieldRequired: boolean;
  helperText?: any;
  error?: any;
  resource?: Resource;
  stringOnly?: boolean;
  name?: string;
  setTouched?: () => void;
  showAddAttributeButton?: boolean;
  addTitle?: string;
  handleAddElement?: () => void;
  showDeleteButton?: boolean;
  handleDeleteElement?: () => void;
  containerStyle?: React.CSSProperties;
  measureModel?: Model;
}
