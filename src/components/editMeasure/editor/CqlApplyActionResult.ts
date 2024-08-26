export type CqlApplyActionResult = {
  cql: string;
  status: "success" | "info" | "danger";
  message: string;
};
