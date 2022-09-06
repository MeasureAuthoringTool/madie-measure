import * as Yup from "yup";

export const MeasureMetadataValidator = Yup.object().shape({
  genericField: Yup.object().when("dataType", (dataType) => {
    switch (dataType) {
      case "description":
        return Yup.string().required("Measure Description is required.");
      default:
        return Yup.string().notRequired();
    }
  }),
});
