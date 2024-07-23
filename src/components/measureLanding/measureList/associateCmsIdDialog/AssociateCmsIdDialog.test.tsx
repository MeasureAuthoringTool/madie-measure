import * as React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import AssociateCmsIdDialog from "./AssociateCmsIdDialog";
import { Measure } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";

describe("Associate Cms Id Dialog component", () => {
  const selectedMeasures = [
    {
      id: "668f2e5cdab7ae7e3385d32c",
      measureSetId: "7588745d-8fdb-40c1-b526-303c77b54a22",
      measureName: "NewBugTest",
      version: "0.0.000",
      model: "QDM v5.6",
      measureSet: {
        id: "668f2e5cdab7ae7e3385d32d",
        cmsId: 65,
        measureSetId: "7588745d-8fdb-40c1-b526-303c77b54a22",
        owner: "prateek.keerthi@semanticbits.com",
        acls: null,
      },
      active: true,
      ecqmTitle: "NewBugTest",
      measureMetaData: {
        steward: {
          id: "665f5ed06f0a020286915740",
          name: "3Cloud Solutions",
          oid: "e96086c0-a69f-11ea-bb37-0242ac130002",
          url: "https://3cloudsolutions.com/",
        },
        developers: [
          {
            id: "665f5ed06f0a020286915740",
            name: "3Cloud Solutions",
            oid: "e96086c0-a69f-11ea-bb37-0242ac130002",
            url: "https://3cloudsolutions.com/",
          },
        ],
        description: "Test",
        copyright: null,
        disclaimer: null,
        rationale: null,
        guidance: null,
        clinicalRecommendation: null,
        draft: true,
        references: [
          {
            id: "38e47055-e2e5-4e24-b317-61f98390ccf2",
            referenceText: "dfef",
            referenceType: "Citation",
          },
          {
            id: "48ecc607-3dc1-4331-9765-707242814f20",
            referenceText: "test",
            referenceType: "Citation",
          },
        ],
        endorsements: null,
        definition: null,
        experimental: false,
        transmissionFormat: null,
        measureSetTitle: null,
        cqlMetaData: {
          codeSystemMap: {},
        },
      },
    },
    {
      id: "66955b8d74affa0fc24a9eb3",
      measureSetId: "fdd28520-fb30-4e8c-9e86-e5768ecbcf1d",
      measureName: "Test1234",
      version: "0.0.000",
      model: "QI-Core v4.1.1",
      measureSet: {
        id: "66955b8e74affa0fc24a9eb4",
        measureSetId: "fdd28520-fb30-4e8c-9e86-e5768ecbcf1d",
        owner: "prateek.keerthi@semanticbits.com",
        acls: null,
      },
      active: true,
      ecqmTitle: "Test",
      measureMetaData: {
        steward: null,
        developers: null,
        description: null,
        copyright: null,
        disclaimer: null,
        rationale: null,
        guidance: null,
        clinicalRecommendation: null,
        draft: true,
        references: null,
        endorsements: null,
        definition: null,
        experimental: false,
        transmissionFormat: null,
        measureSetTitle: null,
        cqlMetaData: null,
      },
    },
  ] as unknown as Measure[];

  it("verify content in associate cms id dialog", async () => {
    const onCloseFn = jest.fn();
    render(
      <AssociateCmsIdDialog
        measures={selectedMeasures}
        onClose={onCloseFn}
        open={true}
        handleCmsIdAssociationContinueDialog={jest.fn()}
      />
    );

    const associateBtn = screen.getByTestId(
      "associate-cms-id-button"
    ) as HTMLInputElement;
    expect(associateBtn).toBeInTheDocument();
    expect(associateBtn).toBeEnabled();

    const associateCancelBtn = screen.getByTestId(
      "cancel-button"
    ) as HTMLInputElement;
    expect(associateCancelBtn).toBeInTheDocument();
    expect(associateCancelBtn).toBeEnabled();

    const associatePopupText = screen.queryByText("Associate CMS ID");
    expect(associatePopupText).toBeInTheDocument();

    userEvent.click(associateCancelBtn);
    expect(onCloseFn).toHaveBeenCalled();
  });

  it("displaying are you sure modal when associate button is clicked", async () => {
    const onCloseFn = jest.fn();
    render(
      <AssociateCmsIdDialog
        measures={selectedMeasures}
        onClose={onCloseFn}
        open={true}
        handleCmsIdAssociationContinueDialog={jest.fn()}
      />
    );

    const associateBtn = screen.getByTestId(
      "associate-cms-id-button"
    ) as HTMLInputElement;
    expect(associateBtn).toBeInTheDocument();
    expect(associateBtn).toBeEnabled();

    const associateCancelBtn = screen.getByTestId(
      "cancel-button"
    ) as HTMLInputElement;
    expect(associateCancelBtn).toBeInTheDocument();
    expect(associateCancelBtn).toBeEnabled();

    const associatePopupText = screen.queryByText("Associate CMS ID");
    expect(associatePopupText).toBeInTheDocument();

    userEvent.click(associateBtn);

    const associatePopupText1 = screen.queryByText("Are you sure?");
    expect(associatePopupText1).toBeInTheDocument();

    const associateCmsIdentifierConfirmingDialogCancelBtn = screen.getByTestId(
      "associate-cms-identifier-confirmation-dialog-cancel-button"
    );
    expect(associateCmsIdentifierConfirmingDialogCancelBtn).toBeInTheDocument();

    const associateCmsIdentifierConfirmingDialogContinueBtn =
      screen.getByTestId(
        "associate-cms-identifier-confirmation-dialog-continue-button"
      );
    expect(
      associateCmsIdentifierConfirmingDialogContinueBtn
    ).toBeInTheDocument();

    userEvent.click(associateCmsIdentifierConfirmingDialogCancelBtn);
    await waitFor(() => {
      expect(screen.queryByText("Are you sure?")).not.toBeVisible();
    });
  });
});
