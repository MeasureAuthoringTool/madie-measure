import { jest } from "@jest/globals";
import React from "react";
import { renderHook } from "@testing-library/react-hooks";
import useFormikResetOnEvent from "./useFormikResetOnEvent";

describe("useFormikResetOnEvent", () => {
  it("calls formik.resetForm when resetAllForms event is dispatched", () => {
    const resetForm = jest.fn();
    const formik = { resetForm };

    renderHook(() => useFormikResetOnEvent(formik));
    window.dispatchEvent(new Event("resetAllForms"));

    expect(resetForm).toHaveBeenCalledTimes(1);
  });

  it("removes event listener on unmount", () => {
    const resetForm = jest.fn();
    const formik = { resetForm };

    const { unmount } = renderHook(() => useFormikResetOnEvent(formik));

    unmount();
    window.dispatchEvent(new Event("resetAllForms"));
    expect(resetForm).not.toHaveBeenCalled();
  });
});
