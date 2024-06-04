import getLibraryNameErrors from "./getLibraryNameErrors";
import "@testing-library/jest-dom";
import { describe, expect, test } from "@jest/globals";
import { Model } from "@madie/madie-models";
import { ERROR_MAP } from "./getLibraryNameErrors";

describe("getLibraryNameErrors", () => {
  test("Sees no errors", () => {
    expect(getLibraryNameErrors("QiCore1", Model.QICORE)).toStrictEqual([]);
  });
  test("Catches max limit exceeded violation", () => {
    expect(
      getLibraryNameErrors(
        "A1asdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdasdfasfdasdfasdfasdfasdfdf",
        Model.QICORE
      )[0]
    ).toBe(ERROR_MAP.max.message);
  });
  test("Catches Empty violation", () => {
    expect(getLibraryNameErrors("", Model.QICORE)[0]).toBe(
      ERROR_MAP.required.message
    );
  });
  test("Catches QDM naming convention violation", () => {
    expect(getLibraryNameErrors("QDM_1!", Model.QDM_5_6)[0]).toBe(
      ERROR_MAP.qdmCheck.message
    );
  });
  test("Catches Qi-core naming convention violation", () => {
    expect(getLibraryNameErrors("QiCore_1", Model.QICORE)[0]).toBe(
      ERROR_MAP.qiCoreCheck.message
    );
  });
  test("Catches more than one", () => {
    expect(
      getLibraryNameErrors(
        "QiCore_@#$@$ajsdfnajsdfnajsdfnasjkdfnaksjdnfjkasndfjkasndfkjasndfkjasdnfjkasdnfjksdfnjk",
        Model.QICORE
      )
    ).toStrictEqual([ERROR_MAP.max.message, ERROR_MAP.qiCoreCheck.message]);
  });
});
