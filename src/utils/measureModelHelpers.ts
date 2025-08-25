export default function getModelFamily(model: string) {
  if (model) {
    return model && model.startsWith("QI-Core")
      ? `FHIR`
      : `${model?.split(" ")[0]}`;
  }
}
