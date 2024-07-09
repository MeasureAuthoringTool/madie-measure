import * as React from "react";
import { render, screen } from "@testing-library/react";
import AssociateCmsIdAction, {
  ASSOCIATE_CMS_ID,
  MUST_BE_DIFFERENT_MODELS,
  MUST_BE_DRAFT,
  MUST_BE_OWNER,
  MUST_HAVE_CMS_ID,
  MUST_NOT_HAVE_CMS_ID,
  SELECT_TWO_MEASURES,
} from "./AccociateCmsIdAction";
import { Measure, MeasureSet, Model } from "@madie/madie-models";

const mockUser = "test user";
jest.mock("@madie/madie-util", () => ({
  useOktaTokens: () => ({
    getUserName: () => mockUser,
  }),
}));
const mockMeasureSet = {
  cmsId: "124",
  measureSetId: "1-2-3-4",
  owner: mockUser,
} as unknown as MeasureSet;

const mockMeasure1 = {
  model: Model.QDM_5_6,
  measureSet: mockMeasureSet,
  measureSetId: "1-2-3-4",
} as Measure;

const mockMeasure2 = {
  model: Model.QICORE,
  measureSet: { ...mockMeasureSet, cmsId: null },
  measureSetId: "1-2-3-4",
  measureMetaData: { draft: true },
} as unknown as Measure;

describe("AssociateCmsIdAction", () => {
  it("Should disable action btn if no measure selected", () => {
    render(<AssociateCmsIdAction measures={[]} />);
    expect(screen.getByTestId("associate_cms_id_btn")).toBeDisabled();
    expect(screen.getByTestId("associate_cms_id_tooltip")).toHaveAttribute(
      "aria-label",
      SELECT_TWO_MEASURES
    );
  });

  it("Should disable action btn if user does not select two measures ", () => {
    render(<AssociateCmsIdAction measures={[mockMeasure1]} />);
    expect(screen.getByTestId("associate_cms_id_btn")).toBeDisabled();
    expect(screen.getByTestId("associate_cms_id_tooltip")).toHaveAttribute(
      "aria-label",
      SELECT_TWO_MEASURES
    );
  });

  it("Should disable action btn if user is not owner of one of the measures selected", () => {
    expect(mockMeasure2.measureSet.owner).toEqual(mockUser);
    render(
      <AssociateCmsIdAction
        measures={[
          mockMeasure1,
          {
            ...mockMeasure2,
            measureSet: { ...mockMeasureSet, owner: "not me" },
          },
        ]}
      />
    );
    expect(screen.getByTestId("associate_cms_id_btn")).toBeDisabled();
    expect(screen.getByTestId("associate_cms_id_tooltip")).toHaveAttribute(
      "aria-label",
      MUST_BE_OWNER
    );
  });

  it("Should disable action btn if user selects two measures with same model", () => {
    const measure2 = { ...mockMeasure2, model: Model.QDM_5_6 };
    render(<AssociateCmsIdAction measures={[mockMeasure1, measure2]} />);
    expect(screen.getByTestId("associate_cms_id_btn")).toBeDisabled();
    expect(screen.getByTestId("associate_cms_id_tooltip")).toHaveAttribute(
      "aria-label",
      MUST_BE_DIFFERENT_MODELS
    );
  });

  it("Should disable action btn if QICore measure selected is not a draft", () => {
    expect(mockMeasure2.model).toEqual(Model.QICORE);
    const measure2 = { ...mockMeasure2, measureMetaData: { draft: false } };
    render(<AssociateCmsIdAction measures={[mockMeasure1, measure2]} />);
    expect(screen.getByTestId("associate_cms_id_btn")).toBeDisabled();
    expect(screen.getByTestId("associate_cms_id_tooltip")).toHaveAttribute(
      "aria-label",
      MUST_BE_DRAFT
    );
  });

  it("Should disable action btn if QDM measure selected does not have CMS id", () => {
    expect(mockMeasure1.model).toEqual(Model.QDM_5_6);
    const measure1 = {
      ...mockMeasure1,
      measureSet: { ...mockMeasureSet, cmsId: null },
    };
    render(<AssociateCmsIdAction measures={[measure1, mockMeasure2]} />);
    expect(screen.getByTestId("associate_cms_id_btn")).toBeDisabled();
    expect(screen.getByTestId("associate_cms_id_tooltip")).toHaveAttribute(
      "aria-label",
      MUST_HAVE_CMS_ID
    );
  });

  it("Should disable action btn if QICore measure selected has CMS id", () => {
    expect(mockMeasure2.model).toEqual(Model.QICORE);
    const measure2 = {
      ...mockMeasure2,
      measureSet: { ...mockMeasureSet, cmsId: 125 },
    };
    render(<AssociateCmsIdAction measures={[mockMeasure1, measure2]} />);
    expect(screen.getByTestId("associate_cms_id_btn")).toBeDisabled();
    expect(screen.getByTestId("associate_cms_id_tooltip")).toHaveAttribute(
      "aria-label",
      MUST_NOT_HAVE_CMS_ID
    );
  });

  it("Should enable action btn if two measures have different models, QDM measure has CMS id, QICore measure has no CMS ID and both owned by user", () => {
    render(<AssociateCmsIdAction measures={[mockMeasure1, mockMeasure2]} />);
    expect(screen.getByTestId("associate_cms_id_btn")).toBeEnabled();
    expect(screen.getByTestId("associate_cms_id_tooltip")).toHaveAttribute(
      "aria-label",
      ASSOCIATE_CMS_ID
    );
  });
});
