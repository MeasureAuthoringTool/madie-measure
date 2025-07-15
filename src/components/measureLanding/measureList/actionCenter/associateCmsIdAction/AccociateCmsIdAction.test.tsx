import { beforeAll, expect, jest } from "@jest/globals";
import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { Measure, MeasureSet, Model } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";
const mockUser = "test user";

jest.unstable_mockModule("@madie/madie-util", () => ({
  useOktaTokens: () => ({
    getUserName: () => mockUser,
  }),
}));

let AssociateCmsIdAction: any;
beforeAll(async () => {
  const module = await import("./AccociateCmsIdAction");
  AssociateCmsIdAction = module.default;
});

import {
  ASSOCIATE_CMS_ID,
  MUST_SELECT_ONE_QDM_AND_ONE_QI_CORE_MEASURE,
  MUST_BE_DRAFT,
  MUST_BE_OWNER,
  MUST_HAVE_CMS_ID,
  MUST_NOT_HAVE_CMS_ID,
  SELECT_TWO_MEASURES,
} from "./constants";

const mockMeasureSet = {
  cmsId: "124",
  measureSetId: "1-2-3-4",
  owner: mockUser,
} as unknown as MeasureSet;

const qdmMeasure = {
  model: Model.QDM_5_6,
  measureSet: mockMeasureSet,
  measureSetId: "1-2-3-4",
  measureMetaData: { draft: true },
} as Measure;

const qiCoreMeasure = {
  model: Model.QICORE,
  measureSet: { ...mockMeasureSet, cmsId: null },
  measureSetId: "1-2-3-4",
  measureMetaData: { draft: true },
} as Measure;

const associateCmsId = jest.fn();

describe("AssociateCmsIdAction", () => {
  it("Should disable action btn if no measure selected", () => {
    render(<AssociateCmsIdAction measures={[]} onClick={associateCmsId} />);
    expect(screen.getByTestId("associate-cms-id-action-btn")).toBeDisabled();
    expect(screen.getByTestId("associate-cms-id-tooltip")).toHaveAttribute(
      "aria-label",
      SELECT_TWO_MEASURES
    );
  });

  it("Should disable action btn if user does not select two measures ", () => {
    render(
      <AssociateCmsIdAction measures={[qdmMeasure]} onClick={associateCmsId} />
    );
    expect(screen.getByTestId("associate-cms-id-action-btn")).toBeDisabled();
    expect(screen.getByTestId("associate-cms-id-tooltip")).toHaveAttribute(
      "aria-label",
      SELECT_TWO_MEASURES
    );
  });

  it("Should disable action btn if user selects two QDM measures", () => {
    render(
      <AssociateCmsIdAction
        measures={[qdmMeasure, qdmMeasure]}
        onClick={associateCmsId}
      />
    );
    expect(screen.getByTestId("associate-cms-id-action-btn")).toBeDisabled();
    expect(screen.getByTestId("associate-cms-id-tooltip")).toHaveAttribute(
      "aria-label",
      MUST_SELECT_ONE_QDM_AND_ONE_QI_CORE_MEASURE
    );
  });

  it("Should disable action btn if user selects two QI-Core Measures", () => {
    render(
      <AssociateCmsIdAction
        measures={[qiCoreMeasure, qiCoreMeasure]}
        onClick={associateCmsId}
      />
    );
    expect(screen.getByTestId("associate-cms-id-action-btn")).toBeDisabled();
    expect(screen.getByTestId("associate-cms-id-tooltip")).toHaveAttribute(
      "aria-label",
      MUST_SELECT_ONE_QDM_AND_ONE_QI_CORE_MEASURE
    );
  });

  it("Should disable action btn if user is not owner of one of the measures selected", () => {
    expect(qiCoreMeasure.measureSet.owner).toEqual(mockUser);
    render(
      <AssociateCmsIdAction
        measures={[
          qdmMeasure,
          {
            ...qiCoreMeasure,
            measureSet: { ...mockMeasureSet, owner: "not me" },
          },
        ]}
        onClick={associateCmsId}
      />
    );
    expect(screen.getByTestId("associate-cms-id-action-btn")).toBeDisabled();
    expect(screen.getByTestId("associate-cms-id-tooltip")).toHaveAttribute(
      "aria-label",
      MUST_BE_OWNER
    );
  });

  it("Should disable action btn if the QI-Core measure is not a draft", async () => {
    const measure1 = { ...qiCoreMeasure, measureMetaData: { draft: false } };
    render(
      <AssociateCmsIdAction
        measures={[measure1, qdmMeasure]}
        onClick={associateCmsId}
      />
    );
    await waitFor(() => {
      expect(screen.getByTestId("associate-cms-id-action-btn")).toBeDisabled();
      expect(screen.getByTestId("associate-cms-id-tooltip")).toHaveAttribute(
        "aria-label",
        MUST_BE_DRAFT
      );
    });
  });

  it("Should disable action btn if the QDM measure does not have a CMS id", async () => {
    const measure1 = {
      ...qdmMeasure,
      measureSet: { ...mockMeasureSet, cmsId: null },
    };
    render(
      <AssociateCmsIdAction
        measures={[measure1, qiCoreMeasure]}
        onClick={associateCmsId}
      />
    );
    expect(screen.getByTestId("associate-cms-id-action-btn")).toBeDisabled();
    expect(screen.getByTestId("associate-cms-id-tooltip")).toHaveAttribute(
      "aria-label",
      MUST_HAVE_CMS_ID
    );
  });

  it("Should disable action btn if the QI-Core measure has a CMS id", async () => {
    const measure1 = {
      ...qiCoreMeasure,
      measureSet: { ...mockMeasureSet, cmsId: 125 },
    };

    render(
      <AssociateCmsIdAction
        measures={[measure1, qdmMeasure]}
        onClick={associateCmsId}
      />
    );
    expect(screen.getByTestId("associate-cms-id-action-btn")).toBeDisabled();
    expect(screen.getByTestId("associate-cms-id-tooltip")).toHaveAttribute(
      "aria-label",
      MUST_NOT_HAVE_CMS_ID
    );
  });

  it("Should enable action btn if one QDM measure and QI-Core is selected, QDM measure has CMS id, QICore measure has no CMS ID and is in draft state, and both measures are owned by user", async () => {
    render(
      <AssociateCmsIdAction
        measures={[qdmMeasure, qiCoreMeasure]}
        onClick={associateCmsId}
      />
    );
    expect(screen.getByTestId("associate-cms-id-action-btn")).toBeEnabled();
    expect(screen.getByTestId("associate-cms-id-tooltip")).toHaveAttribute(
      "aria-label",
      ASSOCIATE_CMS_ID
    );
    await userEvent.click(screen.getByTestId("associate-cms-id-action-btn"));
    await waitFor(() => {
      expect(associateCmsId).toHaveBeenCalled();
    });
  });
});
