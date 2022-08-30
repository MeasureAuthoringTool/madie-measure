import * as Yup from "yup";

export const MeasureMetadataValidator = Yup.object().shape({
  genericField: Yup.object().when("dataType", (dataType) => {
    switch (dataType) {
      case "description":
        return Yup.string().required("Measure Description is required.");
      case "copyright":
        Yup.string().notRequired();
      case "disclaimer":
        Yup.string().notRequired();
      case "rationale":
        Yup.string().notRequired();
      case "author":
        Yup.string().notRequired();
      case "guidance":
        Yup.string().notRequired();
      default:
        return Yup.string().notRequired();
    }
  }),
});
