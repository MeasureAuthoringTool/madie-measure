import { useEffect } from "react";

// reusable component to hook into form locations.
// We have a discard dialog in the measure-actions-center that needs to know about every other form in the app, and trigger the reset onContinue
// We could have that onContinue logic emit an event, and this component should add the listener on each form that needs to blank.
const useFormikResetOnEvent = (formik) => {
  useEffect(() => {
    const handleEvent = () => {
      formik.resetForm();
    };

    window.addEventListener("resetAllForms", handleEvent);

    return () => {
      window.removeEventListener("resetAllForms", handleEvent);
    };
  }, [formik]);
};

export default useFormikResetOnEvent;
