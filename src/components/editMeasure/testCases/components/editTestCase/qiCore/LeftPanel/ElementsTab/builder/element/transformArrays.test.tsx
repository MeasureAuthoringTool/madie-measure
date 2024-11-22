import React from "react";
import { transformArrays } from "./transformArrays";

describe("Transform Arrays works as expected", () => {
  const testData = [
    { id: "ClaimResponse.item.adjudication.id" },
    { id: "ClaimResponse.item.adjudication.extension" },
    { id: "ClaimResponse.item.adjudication.modifierExtension" },
    { id: "ClaimResponse.item.adjudication.category" },
    { id: "ClaimResponse.item.adjudication.reason" },
    { id: "ClaimResponse.item.adjudication.amount" },
    { id: "ClaimResponse.item.adjudication.value" },
    { id: "ClaimResponse.item.detail.id" },
    { id: "ClaimResponse.item.detail.extension" },
    { id: "ClaimResponse.item.detail.modifierExtension" },
    { id: "ClaimResponse.item.detail.detailSequence" },
    { id: "ClaimResponse.item.detail.noteNumber" },
    { id: "ClaimResponse.item.detail.adjudication" },
    { id: "ClaimResponse.item.detail.subDetail" },
    { id: "ClaimResponse.item.detail.subDetail.id" },
    { id: "ClaimResponse.item.detail.subDetail.extension" },
    { id: "ClaimResponse.item.detail.subDetail.modifierExtension" },
    { id: "ClaimResponse.item.detail.subDetail.subDetailSequence" },
    { id: "ClaimResponse.item.detail.subDetail.noteNumber" },
    { id: "ClaimResponse.item.detail.subDetail.adjudication" },
  ];
  test("Splits by heirarchy", () => {
    expect(transformArrays(testData, 3)).length.toBe(2);
  });
  test("Doesn't split when uneccessary", () => {
    const test2 = [
      { id: "ClaimResponse.item.detail.id" },
      { id: "ClaimResponse.item.detail.extension" },
      { id: "ClaimResponse.item.detail.modifierExtension" },
      { id: "ClaimResponse.item.detail.detailSequence" },
      { id: "ClaimResponse.item.detail.noteNumber" },
      { id: "ClaimResponse.item.detail.adjudication" },
      { id: "ClaimResponse.item.detail.subDetail" },
      { id: "ClaimResponse.item.detail.subDetail.id" },
      { id: "ClaimResponse.item.detail.subDetail.extension" },
      { id: "ClaimResponse.item.detail.subDetail.modifierExtension" },
      { id: "ClaimResponse.item.detail.subDetail.subDetailSequence" },
      { id: "ClaimResponse.item.detail.subDetail.noteNumber" },
      { id: "ClaimResponse.item.detail.subDetail.adjudication" },
    ];
    expect(transformArrays(test2, 3)).length.toBe(1);
  });
});
