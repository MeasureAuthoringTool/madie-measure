import * as React from "react";
import {
  render,
  fireEvent,
  waitFor,
  screen,
  within,
  act,
} from "@testing-library/react";

import MeasureInformation from "./MeasureInformation";

import useQdmElmTranslationServiceApi, {
  QdmElmTranslationServiceApi,
} from "../../../../api/useQdmElmTranslationServiceApi";
import useFhirElmTranslationServiceApi, {
  FhirElmTranslationServiceApi,
} from "../../../../api/useFhirElmTranslationServiceApi";
import { Measure, Model } from "@madie/madie-models";
import { AxiosError, AxiosResponse } from "axios";
import { parseContent, synchingEditorCqlContent } from "@madie/madie-editor";
import userEvent from "@testing-library/user-event";
import {
  checkUserCanEdit,
  measureStore,
  MeasureServiceApi,
  UserServiceApi,
  useFeatureFlags,
} from "@madie/madie-util";

const mockHistoryPush = jest.fn();

jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom") as any),
  useNavigate: () => mockHistoryPush,
}));

jest.mock("../../../../api/useQdmElmTranslationServiceApi");
jest.mock("../../../../api/useFhirElmTranslationServiceApi");
const useQdmElmTranslationServiceApiMock =
  useQdmElmTranslationServiceApi as jest.Mock<QdmElmTranslationServiceApi>;
const useFhirElmTranslationServiceApiMock =
  useFhirElmTranslationServiceApi as jest.Mock<FhirElmTranslationServiceApi>;

const setErrorMessage = jest.fn();
const testUser = "john doe";

const testQDMElmJson = `{
  "library": {
      "annotation": [
          {
              "translatorVersion": "99.9.9"
          }
      ]
  }
}`;
const testFhirElmJson = `{
  "library": {
      "annotation": [
          {
              "translatorVersion": "1.5.0"
          }
      ]
  }
}`;
const measureMetaDataDraft = {
  experimental: false,
  endorsements: [
    {
      endorsementId: "NQF",
      endorser: "1234",
    },
  ],
  draft: true,
};
const measureMetaDataNotDraft = {
  ...measureMetaDataDraft,
  draft: false,
};

let measure;

jest.mock("@madie/madie-editor", () => ({
  synchingEditorCqlContent: jest
    .fn()
    .mockResolvedValue({ cql: "modified cql" }),
  parseContent: jest.fn(() => []),
  validateContent: jest.fn().mockResolvedValue({
    errors: [],
    translation: { library: "NewLibName" },
  }),
}));

const endorserList = [
  {
    endorserOrganization: "-",
  },
  {
    endorserOrganization: "NQF",
  },
];
const mockMeasureServiceApi = {
  getAllEndorsers: jest.fn().mockResolvedValue(endorserList),
  createCmsId: jest.fn(),
  updateMeasure: jest.fn().mockResolvedValue({ status: 200 }),
} as unknown as MeasureServiceApi;

const mockUserServiceApi = {
  getMeasureOwnerDetails: jest.fn().mockResolvedValue({}),
} as unknown as UserServiceApi;
jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
  useUserServiceApi: jest.fn(() => mockUserServiceApi),
  useFeatureFlags: jest.fn().mockReturnValue({
    Locking: true,
  }),
  useOktaTokens: jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  })),
  useKeyPress: jest.fn(() => false),
  measureStore: {
    updateMeasure: jest.fn(),
    state: jest.fn(),
    initialState: jest.fn(),
    subscribe: (set) => {
      // set(measure)
      return { unsubscribe: () => null };
    },
  },
  routeHandlerStore: {
    subscribe: (set) => {
      set();
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: () => null,
    state: { canTravel: true, pendingPath: "" },
    initialState: { canTravel: true, pendingPath: "" },
  },

  checkUserCanEdit: jest.fn(() => {
    return true;
  }),
}));

const axiosError: AxiosError = {
  response: {
    status: 500,
    data: { status: 500, error: "bad test", message: "oh no what happened" },
  } as AxiosResponse,
  toJSON: jest.fn(),
} as unknown as AxiosError;

describe("MeasureInformation component", () => {
  beforeEach(() => {
    const qdmElmTranslationServiceApiMock = {
      fetchTranslatorVersion: jest.fn().mockResolvedValue("3.1.0"),
    } as unknown as QdmElmTranslationServiceApi;
    const fhirElmTranslationServiceApiMock = {
      fetchTranslatorVersion: jest.fn().mockResolvedValue("3.2.0"),
    } as unknown as FhirElmTranslationServiceApi;

    useQdmElmTranslationServiceApiMock.mockImplementation(() => {
      return qdmElmTranslationServiceApiMock;
    });
    useFhirElmTranslationServiceApiMock.mockImplementation(() => {
      return fhirElmTranslationServiceApiMock;
    });

    measure = {
      id: "test measure",
      measureName: "TestM123",
      cqlLibraryName: "TestLibray123",
      model: "QI-Core v4.1.1",
      ecqmTitle: "ecqmTitle",
      measurementPeriodStart: "01/01/2022",
      measurementPeriodEnd: "12/02/2022",
      createdBy: "john doe",
      measureSetId: "testMeasureId",
      acls: [{ userId: "othertestuser@example.com", roles: ["SHARED_WITH"] }],
      elmJson: `{}`,
      measureMetaData: {
        experimental: false,
        endorsements: [
          {
            endorsementId: "NQF",
            endorser: "1234",
          },
        ],
      },
      measureSet: {
        id: "id1",
        cmsId: 23,
        measureSetId: "testMeasureId",
        owner: "test.com",
      },
    } as unknown as Measure;

    measureStore.state.mockImplementation(() => measure);
  });
  const {
    getByTestId,
    queryByText,
    findByTestId,
    findByText,
    getByRole,
    getByText,
  } = screen;

  it("Toast error shows when endorsing organization is not null and endorsement Id is empty", async () => {
    measureStore.state.mockImplementationOnce(() => measure);
    checkUserCanEdit.mockImplementationOnce(() => true);
    await act(async () => {
      render(
        <MeasureInformation
          setErrorMessage={setErrorMessage}
          measureCanEdit={true}
        />
      );
      const endorserAutoComplete = await screen.findByTestId("endorser");
      fireEvent.keyDown(endorserAutoComplete, { key: "ArrowDown" });
      // selects 2nd option
      const endorserOptions = await screen.findAllByRole("option");
      fireEvent.click(endorserOptions[1]);

      // verifies if the option is selected
      const endorserComboBox =
        within(endorserAutoComplete).getByRole("combobox");
      expect(endorserComboBox).toHaveValue("NQF");
      //verifies endorserId was enabled
      const endorserId = getByTestId(
        "endorsement-number-input"
      ) as HTMLInputElement;
      expect(endorserId).toBeEnabled();
      //clear endorserId
      fireEvent.change(endorserId, {
        target: { value: "" },
      });
      expect(endorserId).toHaveValue("");

      const saveButton = await screen.findByRole("button", { name: "Save" });
      expect(saveButton).toBeInTheDocument();
      await waitFor(() => expect(saveButton).toBeEnabled());
      act(() => {
        fireEvent.click(saveButton);
      });
      // previous implementation depended on setTimeout.
      await waitFor(() => {
        expect(
          screen.getByText("Endorser Number is Required")
        ).toBeInTheDocument();
      });
    });
  });

  test("Click Save button will save the change", async () => {
    (checkUserCanEdit as jest.Mock).mockImplementation(() => {
      return true;
    });
    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );

    const endorserAutoComplete = await screen.findByTestId("endorser");
    fireEvent.keyDown(endorserAutoComplete, { key: "ArrowDown" });
    // selects 2nd option
    const endorserOptions = await screen.findAllByRole("option");
    fireEvent.click(endorserOptions[1]);

    // verifies if the option is selected
    const endorserComboBox = within(endorserAutoComplete).getByRole("combobox");
    expect(endorserComboBox).toHaveValue("NQF");
    //verifies endorserId was enabled
    const endorserId = getByTestId(
      "endorsement-number-input"
    ) as HTMLInputElement;
    expect(endorserId).toBeEnabled();
    //enter endorserId
    fireEvent.change(endorserId, {
      target: { value: "1" },
    });
    expect(endorserId).toHaveValue("1");

    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    }) as HTMLButtonElement;
    expect(discardButton).toBeEnabled();

    await act(async () => {
      const input = await findByTestId("measure-name-input");
      fireEvent.change(input, {
        target: { value: "new value" },
      });
      const createBtn = getByTestId("measurement-information-save-button");
      expect(createBtn).toBeEnabled();
      act(() => {
        fireEvent.click(createBtn);
      });
    });
  });

  test("Intended venue field being disable when user is not owner", async () => {
    mockMeasureServiceApi.getAllEndorsers = jest
      .fn()
      .mockResolvedValue(endorserList);
    mockMeasureServiceApi.updateMeasure = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });
    (checkUserCanEdit as jest.Mock).mockImplementation(() => {
      return false;
    });
    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={false}
      />
    );

    const intendedVenueComplete = screen.getByRole("textbox", {
      name: "Intended Venue",
    }) as HTMLInputElement;
    expect(intendedVenueComplete).toBeInTheDocument();
    expect(intendedVenueComplete).toHaveAttribute("readonly");
  });

  test("Adding intended venue and saving it", async () => {
    mockMeasureServiceApi.getAllEndorsers = jest
      .fn()
      .mockResolvedValue(endorserList);
    mockMeasureServiceApi.updateMeasure = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });
    (checkUserCanEdit as jest.Mock).mockImplementation(() => {
      return true;
    });
    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );

    const intendedVenueComplete = (await screen.findByTestId(
      "intended-venue-input"
    )) as HTMLInputElement;
    expect(intendedVenueComplete).toBeInTheDocument();
    expect(intendedVenueComplete.value).toBe("-");
    fireEvent.change(intendedVenueComplete, {
      target: { value: "Eligible Clinician (EC)" },
    });
    expect(intendedVenueComplete.value).toBe("Eligible Clinician (EC)");

    fireEvent.change(intendedVenueComplete, {
      target: { value: "-" },
    });
    expect(intendedVenueComplete.value).toBe("-");

    fireEvent.change(intendedVenueComplete, {
      target: { value: "Eligible Hospital (EH)" },
    });
    expect(intendedVenueComplete.value).toBe("Eligible Hospital (EH)");

    await waitFor(async () => {
      const input = await findByTestId("measure-name-input");
      fireEvent.change(input, {
        target: { value: "new value" },
      });
      const createBtn = getByTestId("measurement-information-save-button");
      expect(createBtn).toBeEnabled();
      userEvent.click(createBtn);
      expect(
        getByTestId("edit-measure-information-success-text")
      ).toBeInTheDocument();
    });
  });
  test("Adding Eligible Clinician (EC) intended venue and saving it", async () => {
    mockMeasureServiceApi.getAllEndorsers = jest
      .fn()
      .mockResolvedValue(endorserList);
    mockMeasureServiceApi.updateMeasure = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });
    (checkUserCanEdit as jest.Mock).mockImplementation(() => {
      return true;
    });
    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );

    const intendedVenueComplete = (await screen.findByTestId(
      "intended-venue-input"
    )) as HTMLInputElement;
    expect(intendedVenueComplete).toBeInTheDocument();
    expect(intendedVenueComplete.value).toBe("-");
    fireEvent.change(intendedVenueComplete, {
      target: { value: "Eligible Clinician (EC)" },
    });
    expect(intendedVenueComplete.value).toBe("Eligible Clinician (EC)");

    await waitFor(async () => {
      const input = await findByTestId("measure-name-input");
      fireEvent.change(input, {
        target: { value: "new value" },
      });
      const createBtn = getByTestId("measurement-information-save-button");
      expect(createBtn).toBeEnabled();
      userEvent.click(createBtn);
      expect(
        getByTestId("edit-measure-information-success-text")
      ).toBeInTheDocument();
    });
  });

  test("Adding no value for intended venue and saving it", async () => {
    mockMeasureServiceApi.getAllEndorsers = jest
      .fn()
      .mockResolvedValue(endorserList);
    mockMeasureServiceApi.updateMeasure = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });
    (checkUserCanEdit as jest.Mock).mockImplementation(() => {
      return true;
    });
    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );

    const intendedVenueComplete = (await screen.findByTestId(
      "intended-venue-input"
    )) as HTMLInputElement;
    expect(intendedVenueComplete).toBeInTheDocument();
    expect(intendedVenueComplete.value).toBe("-");
    fireEvent.change(intendedVenueComplete, {
      target: { value: "-" },
    });
    expect(intendedVenueComplete.value).toBe("-");

    await waitFor(async () => {
      const input = await findByTestId("measure-name-input");
      fireEvent.change(input, {
        target: { value: "new value" },
      });
      const createBtn = getByTestId("measurement-information-save-button");
      expect(createBtn).toBeEnabled();
      userEvent.click(createBtn);
      expect(
        getByTestId("edit-measure-information-success-text")
      ).toBeInTheDocument();
    });
  });

  it("Toast error shows when endorsement Id is not alphanumeric", async () => {
    measureStore.state.mockImplementationOnce(() => measure);
    checkUserCanEdit.mockImplementationOnce(() => true);
    await act(async () => {
      render(
        <MeasureInformation
          setErrorMessage={setErrorMessage}
          measureCanEdit={true}
        />
      );
      const endorserAutoComplete = await screen.findByTestId("endorser");
      fireEvent.keyDown(endorserAutoComplete, { key: "ArrowDown" });
      // selects 2nd option
      const endorserOptions = await screen.findAllByRole("option");
      fireEvent.click(endorserOptions[1]);

      // verifies if the option is selected
      const endorserComboBox =
        within(endorserAutoComplete).getByRole("combobox");
      expect(endorserComboBox).toHaveValue("NQF");
      //verifies endorserId was enabled
      const endorserId = getByTestId(
        "endorsement-number-input"
      ) as HTMLInputElement;
      expect(endorserId).toBeEnabled();
      //change endorserId
      fireEvent.change(endorserId, {
        target: { value: "test 1" },
      });
      expect(endorserId).toHaveValue("test 1");

      const saveButton = await screen.findByRole("button", { name: "Save" });
      expect(saveButton).toBeInTheDocument();
      await waitFor(() => expect(saveButton).toBeEnabled());

      userEvent.click(saveButton);
      await waitFor(() => {
        expect(
          screen.getByText("Endorser Number must be alpha numeric")
        ).toBeInTheDocument();
      });
    });
  });

  it("should regenerate ELM when the CQL Library Name is updated", async () => {
    measureStore.state.mockImplementation(() => measure);
    mockMeasureServiceApi.getAllEndorsers = jest
      .fn()
      .mockResolvedValue(endorserList);
    mockMeasureServiceApi.updateMeasure = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });

    const testMeasure = {
      ...measure,
      versionId: "test measure",
      measureId: undefined,
      cql: "modified cql",
    } as unknown as Measure;

    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );

    const cqlLibraryName = (await screen.findByRole("textbox", {
      name: "Measure CQL Library Name",
    })) as HTMLInputElement;
    expect(cqlLibraryName.value).toEqual(testMeasure.cqlLibraryName);

    const modifiedLibName = "NewLibName";
    userEvent.clear(cqlLibraryName);
    userEvent.type(cqlLibraryName, modifiedLibName);
    expect(cqlLibraryName.value).not.toEqual(testMeasure.cqlLibraryName);
    expect(cqlLibraryName.value).toEqual(modifiedLibName);

    const saveButton = await screen.findByRole("button", { name: "Save" });
    expect(saveButton).toBeInTheDocument();
    await waitFor(() => expect(saveButton).toBeEnabled());

    userEvent.click(saveButton);
    await waitFor(() => expect(synchingEditorCqlContent).toBeCalled());
    await waitFor(() => expect(parseContent).toBeCalled());

    expect(
      await screen.getByText("Measurement Information Updated Successfully")
    ).toBeInTheDocument();

    const toastCloseButton = await screen.findByTestId("close-error-button");
    expect(toastCloseButton).toBeInTheDocument();
    act(() => {
      fireEvent.click(toastCloseButton);
    });
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });

    await waitFor(() =>
      expect(mockMeasureServiceApi.updateMeasure).toBeCalledWith({
        ...testMeasure,
        cqlLibraryName: modifiedLibName,
        elmJson: JSON.stringify({ library: modifiedLibName }),
        // This can be removed after MAT-5396
        measureMetaData: {
          experimental: false,
          intendedVenue: null,
          endorsements: [
            {
              endorsementId: "NQF",
              endorser: "1234",
              endorserSystemId: null,
            },
          ],
        },
      })
    );
  });

  it("should render the component with measure's information populated", async () => {
    checkUserCanEdit.mockImplementationOnce(() => true);
    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );

    const result: HTMLElement = getByTestId("measure-information-form");
    expect(result).toBeInTheDocument();

    await act(async () => {
      const text = getByTestId("measure-name-input") as HTMLInputElement;
      expect(text.value).toBe(measure.measureName);
      const measureId = screen.getByRole("textbox", {
        name: "Measure Id",
      }) as HTMLInputElement;
      expect(measureId.value).toBe(measure.measureSetId);
      expect(measureId).toHaveProperty("readOnly", true);
      const versionId = screen.getByRole("textbox", {
        name: "Version ID",
      }) as HTMLInputElement;
      expect(versionId.value).toBe(measure.id);
      expect(versionId).toHaveProperty("readOnly", true);
      const cmsId = screen.getByRole("textbox", {
        name: "CMS ID",
      }) as HTMLInputElement;
      expect(cmsId.value).toBe("23FHIR");
      expect(cmsId).toHaveProperty("readOnly", true);
      const cqlLibraryNameText = getByTestId(
        "cql-library-name-input"
      ) as HTMLInputElement;
      expect(cqlLibraryNameText.value).toBe(measure.cqlLibraryName);
      const ecqmTitleText = getByTestId("ecqm-input") as HTMLInputElement;
      expect(ecqmTitleText.value).toBe(measure.ecqmTitle);

      const experimentalInput = screen.getByRole("checkbox", {
        name: "Experimental",
      }) as HTMLInputElement;
      expect(experimentalInput.value).toBe("false");
    });
  });

  it("should not allow underscore in cql library name for Qi-Core measure", async () => {
    const testMeasure = {
      ...measure,
      cqlLibraryName: "TestCqlLibraryName",
      versionId: "test measure",
      measureId: undefined,
      cql: "modified cql",
    } as unknown as Measure;
    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );

    const result: HTMLElement = getByTestId("measure-information-form");
    expect(result).toBeInTheDocument();

    const cqlLibraryName = (await screen.findByRole("textbox", {
      name: "Measure CQL Library Name",
    })) as HTMLInputElement;

    const modifiedLibName = "NewLibName_";
    userEvent.clear(cqlLibraryName);
    userEvent.type(cqlLibraryName, modifiedLibName);
    expect(cqlLibraryName.value).not.toEqual(testMeasure.cqlLibraryName);
    expect(cqlLibraryName.value).toEqual(modifiedLibName);

    const saveButton = await screen.findByRole("button", { name: "Save" });
    expect(saveButton).toBeInTheDocument();
    await waitFor(() => expect(saveButton).not.toBeEnabled());
  });

  it("should allow underscore in cql library name for QDM measure", async () => {
    const testMeasure = {
      ...measure,
      model: Model.QDM_5_6,
    } as unknown as Measure;
    measureStore.state.mockImplementation(() => testMeasure);
    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );

    const result: HTMLElement = getByTestId("measure-information-form");
    expect(result).toBeInTheDocument();

    const cqlLibraryName = (await screen.findByRole("textbox", {
      name: "Measure CQL Library Name",
    })) as HTMLInputElement;

    const modifiedLibName = "NewLibName_";
    userEvent.clear(cqlLibraryName);
    userEvent.type(cqlLibraryName, modifiedLibName);
    expect(cqlLibraryName.value).toEqual(modifiedLibName);

    const saveButton = await screen.findByRole("button", { name: "Save" });
    expect(saveButton).toBeInTheDocument();
    await waitFor(() => expect(saveButton).toBeEnabled());
  });

  it("generate cms id", async () => {
    measure.measureSet = {
      id: "id1",
      measureSetId: "testMeasureId",
      owner: "test.com",
    };

    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );
    const result: HTMLElement = getByTestId("measure-information-form");
    expect(result).toBeInTheDocument();

    await act(async () => {
      const cmsIdBtn = getByTestId(
        "generate-cms-id-button"
      ) as HTMLInputElement;
      expect(cmsIdBtn).toBeEnabled();
      act(() => {
        fireEvent.click(cmsIdBtn);
      });
    });

    measure.model = Model.QDM_5_6;
    measure.measureSet = {
      id: "id1",
      cmsId: 2,
      measureSetId: "testMeasureId",
      owner: "test.com",
    };
    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );
    const cmsId = screen.getByRole("textbox", {
      name: "CMS ID",
    }) as HTMLInputElement;
    expect(cmsId.value).toBe("2");
    expect(cmsId).toHaveProperty("readOnly", true);
  });

  it("gracefully handles issue with generate cms id", async () => {
    mockMeasureServiceApi.getAllEndorsers = jest
      .fn()
      .mockResolvedValue(endorserList);
    mockMeasureServiceApi.updateMeasure = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });
    mockMeasureServiceApi.createCmsId = jest.fn().mockRejectedValueOnce({
      status: 403,
      response: { data: { message: "Failed to generate CMS ID." } },
    });

    measure.measureSet = {
      id: "id1",
      measureSetId: "testMeasureId",
      owner: "test.com",
    };

    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );
    const result: HTMLElement = screen.getByTestId("measure-information-form");
    expect(result).toBeInTheDocument();

    const cmsIdBtn = screen.getByTestId(
      "generate-cms-id-button"
    ) as HTMLInputElement;
    expect(cmsIdBtn).toBeEnabled();
    userEvent.click(cmsIdBtn);
    const cmsPopupBtn = screen.getByTestId(
      "cms-identifier-dialog-continue-button"
    );
    expect(cmsPopupBtn).toBeEnabled();
    userEvent.click(cmsPopupBtn);

    measure.model = Model.QDM_5_6;
    measure.measureSet = {
      id: "id1",
      measureSetId: "testMeasureId",
      owner: "test.com",
    };
    expect(
      await screen.findByText("Failed to create CMS ID.")
    ).toBeInTheDocument();
  });

  it("cms id popup closes on cancel click", async () => {
    mockMeasureServiceApi.createCmsId = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });
    mockMeasureServiceApi.getAllEndorsers = jest
      .fn()
      .mockResolvedValue(endorserList);

    measure.measureSet = {
      id: "id1",
      measureSetId: "testMeasureId",
      owner: "test.com",
    };

    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );
    const result: HTMLElement = screen.getByTestId("measure-information-form");
    expect(result).toBeInTheDocument();
    const cmsIdBtn = screen.getByTestId(
      "generate-cms-id-button"
    ) as HTMLInputElement;
    expect(cmsIdBtn).toBeEnabled();
    userEvent.click(cmsIdBtn);
    const cmsPopupBtn = screen.getByTestId(
      "cms-identifier-dialog-continue-button"
    );
    expect(cmsPopupBtn).toBeInTheDocument();
    const cmsCancelBtn = screen.getByTestId(
      "cms-identifier-dialog-cancel-button"
    );
    expect(cmsCancelBtn).toBeInTheDocument();
    userEvent.click(cmsCancelBtn);
    const cmsPopupText = screen.queryByText(
      "Are you sure you wish to generate a CMS ID?"
    );
    await waitFor(() => {
      expect(cmsPopupText).not.toBeInTheDocument();
    });
  });

  it("Should display measure Version ID when it is not null", async () => {
    measure.versionId = "testVersionId";
    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );

    const result: HTMLElement = getByTestId("measure-information-form");
    expect(result).toBeInTheDocument();

    await act(async () => {
      const text = getByTestId("measure-name-input") as HTMLInputElement;
      expect(text.value).toBe(measure.measureName);
      const versionId = screen.getByRole("textbox", {
        name: "Version ID",
      }) as HTMLInputElement;
      expect(versionId.value).toBe(measure.versionId);
      expect(versionId).toHaveProperty("readOnly", true);
    });
  });

  it("should render the component with a blank measure name", async () => {
    measure.measureName = "";
    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );
    const result: HTMLElement = getByTestId("measure-information-form");
    expect(result).toBeInTheDocument();
    await act(async () => {
      const text = getByTestId("measure-name-input") as HTMLInputElement;
      expect(text.value).toBe("");
    });
  });

  it("Check if the measurement information save button is present", () => {
    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );
    const result: HTMLElement = getByTestId(
      "measurement-information-save-button"
    );
    expect(result).toBeInTheDocument();
  });

  it("saving measurement information successfully and displaying success message", async () => {
    mockMeasureServiceApi.createCmsId = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });
    mockMeasureServiceApi.getAllEndorsers = jest
      .fn()
      .mockResolvedValue(endorserList);
    measure.measureName = "";

    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );

    await act(async () => {
      const input = await findByTestId("measure-name-input");
      fireEvent.change(input, {
        target: { value: "new value" },
      });
      const createBtn = getByTestId("measurement-information-save-button");
      expect(createBtn).toBeEnabled();
      act(() => {
        fireEvent.click(createBtn);
      });
    });

    await waitFor(
      () =>
        expect(
          getByTestId("edit-measure-information-success-text")
        ).toBeInTheDocument(),
      {
        timeout: 5000,
      }
    );
  });

  it("should display error message when updating failed", async () => {
    mockMeasureServiceApi.updateMeasure = jest.fn().mockRejectedValueOnce({
      status: 500,
      response: { data: { message: "update failed" } },
    });
    mockMeasureServiceApi.getAllEndorsers = jest
      .fn()
      .mockResolvedValue(endorserList);

    measure.measureName = "";
    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );

    await act(async () => {
      const input = await findByTestId("measure-name-input");
      fireEvent.change(input, {
        target: { value: "new value" },
      });

      const createBtn = getByTestId("measurement-information-save-button");
      expect(createBtn).toBeEnabled();
      act(() => {
        fireEvent.click(createBtn);
      });
    });

    await waitFor(() => expect(setErrorMessage).toHaveBeenCalled(), {
      timeout: 5000,
    });
  });

  it("Should be editable if measure is shared with the user", () => {
    measure.model = Model.QICORE;
    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );
    const result: HTMLElement = getByTestId("measure-information-form");
    expect(result).toBeInTheDocument();

    const measureNameInput = getByTestId(
      "measure-name-input"
    ) as HTMLInputElement;
    expect(measureNameInput).toBeEnabled();

    const cqlLibraryNameText = getByTestId(
      "cql-library-name-input"
    ) as HTMLInputElement;
    expect(cqlLibraryNameText).toBeEnabled();

    const ecqmTitleText = getByTestId("ecqm-input") as HTMLInputElement;
    expect(ecqmTitleText).toBeEnabled();

    const experimentalInput = screen.getByRole("checkbox", {
      name: "Experimental",
    }) as HTMLInputElement;
    expect(experimentalInput).toBeEnabled();
    expect(experimentalInput.value).toBe("false");
    userEvent.click(experimentalInput);
    expect(experimentalInput.value).toBe("true");

    const endorser = getByTestId("endorser") as HTMLInputElement;
    expect(endorser).toBeEnabled();
  });

  it("Should set the following elements to read only if measure is not shared with the user", async () => {
    (checkUserCanEdit as jest.Mock).mockImplementation(() => {
      return false;
    });
    measure.model = Model.QDM_5_6;
    await act(async () => {
      render(
        <MeasureInformation
          setErrorMessage={setErrorMessage}
          measureCanEdit={false}
        />
      );
      const result: HTMLElement = getByTestId("measure-information-form");
      expect(result).toBeInTheDocument();

      const measureNameInput = screen.getByRole("textbox", {
        name: "Measure Name",
      }) as HTMLInputElement;

      expect(measureNameInput).toBeInTheDocument();
      expect(measureNameInput).toHaveTextContent("TestM123");
      expect(measureNameInput).toHaveProperty("readOnly", true);

      const cqlLibraryNameText = screen.getByRole("textbox", {
        name: "Measure CQL Library Name",
      }) as HTMLInputElement;
      expect(cqlLibraryNameText).toBeInTheDocument();
      expect(cqlLibraryNameText).toHaveTextContent("TestLibray123");
      expect(cqlLibraryNameText).toHaveProperty("readOnly", true);

      const ecqmTitleText = screen.getByRole("textbox", {
        name: "eCQM Abbreviated Title",
      }) as HTMLInputElement;
      expect(ecqmTitleText).toBeInTheDocument();
      expect(ecqmTitleText).toHaveTextContent("ecqmTitle");
      expect(ecqmTitleText).toHaveProperty("readOnly", true);

      const endorser = screen.getByRole("textbox", {
        name: "Endorsing Organization",
      });

      expect(endorser).toBeInTheDocument();
      expect(endorser).toHaveTextContent("1234");
      expect(endorser).toHaveProperty("readOnly", true);

      const endorserId = screen.getByRole("textbox", {
        name: "Endorsement #",
      });

      expect(endorserId).toBeInTheDocument();
      expect(endorserId).toHaveTextContent("NQF");
      expect(endorserId).toHaveProperty("readOnly", true);
    });
  });

  test("Click on dropdown displays different options", async () => {
    (checkUserCanEdit as jest.Mock).mockImplementation(() => {
      return true;
    });
    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );
    const endorserAutoComplete = await screen.findByTestId("endorser");
    fireEvent.keyDown(endorserAutoComplete, { key: "ArrowDown" });
    // selects 2nd option
    const endorserOptions = await screen.findAllByRole("option");
    fireEvent.click(endorserOptions[1]);

    // verifies if the option is selected
    const endorserComboBox = within(endorserAutoComplete).getByRole("combobox");
    expect(endorserComboBox).toHaveValue("NQF");
    //verifies endorserId was enabled
    const endorserId = getByTestId(
      "endorsement-number-input"
    ) as HTMLInputElement;
    expect(endorserId).toBeEnabled();
    //enter endorserId
    fireEvent.change(endorserId, {
      target: { value: "1" },
    });
    expect(endorserId).toHaveValue("1");
  });
  test("Click Clear icon clears selected value and Discard and Save buttons are disabled", async () => {
    (checkUserCanEdit as jest.Mock).mockImplementation(() => {
      return true;
    });
    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );

    const endorserAutoComplete = await screen.findByTestId("endorser");

    fireEvent.keyDown(endorserAutoComplete, { key: "ArrowDown" });
    // selects 2nd option
    const endorserOptions = await screen.findAllByRole("option");
    fireEvent.click(endorserOptions[1]);

    // verifies if the option is selected
    const endorserComboBox = within(endorserAutoComplete).getByRole("combobox");
    expect(endorserComboBox).toHaveValue("NQF");

    const endorserId = getByTestId(
      "endorsement-number-input"
    ) as HTMLInputElement;
    //verifies endorserId was enabled
    expect(endorserId).toBeEnabled();
    //enter endorserId
    fireEvent.change(endorserId, {
      target: { value: "1" },
    });
    expect(endorserId).toHaveValue("1");

    const clearButton = screen.getByTestId("CloseIcon") as HTMLButtonElement;
    fireEvent.click(clearButton);
    expect(endorserComboBox).toHaveValue("");
    expect(endorserId).toHaveValue("");
  });

  it("Discard dialog opens and succeeds", async () => {
    mockMeasureServiceApi.getAllEndorsers = jest
      .fn()
      .mockResolvedValue(endorserList);
    mockMeasureServiceApi.updateMeasure = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });
    (checkUserCanEdit as jest.Mock).mockImplementation(() => {
      return true;
    });
    measure.measureName = "";
    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );
    await act(async () => {
      const input = await findByTestId("measure-name-input");
      fireEvent.change(input, {
        target: { value: "new value" },
      });
    });
    const cancelButton = getByTestId("cancel-button");
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toBeEnabled();
    fireEvent.click(cancelButton);
    const discardDialog = await screen.getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();
    const continueButton = await screen.getByTestId(
      "discard-dialog-continue-button"
    );
    expect(continueButton).toBeInTheDocument();
    fireEvent.click(continueButton);
    await waitFor(() => {
      // check for old value
      const input = getByTestId("measure-name-input");
      expect(input.value).toBe("");
    });
  });

  it("Discard dialog opens and cancels", async () => {
    measure.measureName = "";
    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );
    await act(async () => {
      const input = await findByTestId("measure-name-input");
      fireEvent.change(input, {
        target: { value: "new value" },
      });
    });
    const cancelButton = getByTestId("cancel-button");
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toBeEnabled();
    fireEvent.click(cancelButton);
    const discardDialog = await screen.getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();
    expect(queryByText("You have unsaved changes.")).toBeVisible();
    const discardDialogCancelButton = screen.getByTestId(
      "discard-dialog-cancel-button"
    );
    expect(discardDialogCancelButton).toBeInTheDocument();
    fireEvent.click(discardDialogCancelButton);
    await waitFor(() => {
      expect(queryByText("You have unsaved changes.")).not.toBeVisible();
    });
  });

  it("should render endorser dropdown with endorser list", async () => {
    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );
    const endorserDropDown = await screen.findByTestId("endorser");
    fireEvent.keyDown(endorserDropDown, { key: "ArrowDown" });

    const endorserOptions = await screen.findAllByRole("option");
    expect(endorserOptions).toHaveLength(2);

    // equivalent to pressing escape on keyboard
    fireEvent.keyDown(endorserDropDown, {
      key: "Escape",
      code: "Escape",
      charCode: 27,
    });
  });

  it("should disable endorserId when endorser is unselected", async () => {
    checkUserCanEdit.mockImplementationOnce(() => true);
    await act(async () => {
      render(
        <MeasureInformation
          setErrorMessage={setErrorMessage}
          measureCanEdit={true}
        />
      );
      const endorserAutoComplete = await screen.findByTestId("endorser");
      const endorserComboBox =
        within(endorserAutoComplete).getByRole("combobox");
      const endorserId = getByTestId(
        "endorsement-number-input"
      ) as HTMLInputElement;

      const clearButton = screen.getByTestId("CloseIcon") as HTMLButtonElement;
      fireEvent.click(clearButton);
      expect(endorserComboBox).toHaveValue("");

      //verifies endorserId is disabled
      expect(endorserId).toBeDisabled();

      fireEvent.keyDown(endorserAutoComplete, { key: "ArrowDown" });
      // selects 2nd option
      const endorserOptions = await screen.findAllByRole("option");
      fireEvent.click(endorserOptions[1]);

      // verifies if the option is selected
      expect(endorserComboBox).toHaveValue("NQF");
      //verifies endorserId was enabled
      expect(endorserId).toBeEnabled();
      //Add input for endorserId
      fireEvent.change(endorserId, {
        target: { value: "1234" },
      });
      expect(endorserId).not.toHaveValue("");

      // select 1st option
      fireEvent.keyDown(endorserAutoComplete, { key: "ArrowDown" });
      const endorserOptions2 = await screen.findAllByRole("option");
      fireEvent.click(endorserOptions2[0]);

      // verifies if the option is selected and endorserId has been cleared and disabled
      expect(endorserComboBox).toHaveValue("");
      expect(endorserId).toHaveValue("");
      expect(endorserId).toBeDisabled();
    });
  });

  it("QICore: When no elmJson is present, we're able to get the current version from the translator", async () => {
    const testMeasure = {
      ...measure,
      model: Model.QICORE,
    } as unknown as Measure;
    measureStore.state.mockImplementationOnce(() => testMeasure);
    checkUserCanEdit.mockImplementationOnce(() => true);
    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );
    await waitFor(async () => {
      const translatorVersion = await findByTestId(
        "translator-version-text-field"
      );
      expect(translatorVersion).toBeInTheDocument();
      expect(translatorVersion).toHaveValue("3.2.0");
    });
  });
  it("QDM: When no elmJson is present, we handle the 400 BAD Request from the translator", async () => {
    const testMeasure = {
      ...measure,
      model: Model.QDM_5_6,
    } as unknown as Measure;
    measureStore.state.mockImplementationOnce(() => testMeasure);
    checkUserCanEdit.mockImplementationOnce(() => true);
    useQdmElmTranslationServiceApiMock.mockImplementationOnce(() => {
      return {
        fetchTranslatorVersion: jest.fn().mockRejectedValueOnce({
          status: 400,
          data: "Non-draft version is no longer supported.",
          error: { message: "error" },
        }),
      } as unknown as QdmElmTranslationServiceApi;
    });

    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );
    await waitFor(async () => {
      const translatorVersionText = await findByText(
        "Unable to determine translator version."
      );
      expect(translatorVersionText).toBeInTheDocument();
    });
  });

  it("Fhir: When elmJson is present, we're able to get the current version from the translator", async () => {
    const testMeasure = {
      ...measure,
      model: Model.QICORE,
      elmJson: testFhirElmJson,
    } as unknown as Measure;
    measureStore.state.mockImplementationOnce(() => testMeasure);
    checkUserCanEdit.mockImplementationOnce(() => true);
    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );
    await waitFor(async () => {
      const translatorVersion = await findByTestId(
        "translator-version-text-field"
      );
      expect(translatorVersion).toBeInTheDocument();
      expect(translatorVersion).toHaveValue("1.5.0");
    });
  });

  it("Fhir: When no elmJson is present, we handle the 400 BAD Request from the translator", async () => {
    const testMeasure = {
      ...measure,
      model: Model.QICORE,
      measureMetaData: measureMetaDataNotDraft,
    } as unknown as Measure;
    measureStore.state.mockImplementationOnce(() => testMeasure);
    checkUserCanEdit.mockImplementationOnce(() => true);
    useFhirElmTranslationServiceApiMock.mockImplementationOnce(() => {
      return {
        fetchTranslatorVersion: jest.fn().mockRejectedValueOnce({
          status: 400,
          data: "Non-draft version is no longer supported.",
          error: { message: "error" },
        }),
      } as unknown as QdmElmTranslationServiceApi;
    });

    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );
    await waitFor(async () => {
      const translatorVersionText = await findByText(
        "Unable to determine translator version."
      );
      expect(translatorVersionText).toBeInTheDocument();
    });
  });

  it("QDM: When elmJson is present, we're able to get the current version from the translator", async () => {
    const testMeasure = {
      ...measure,
      model: Model.QDM_5_6,
      elmJson: testQDMElmJson,
    } as unknown as Measure;
    measureStore.state.mockImplementationOnce(() => testMeasure);
    checkUserCanEdit.mockImplementationOnce(() => true);
    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );
    await waitFor(async () => {
      const translatorVersion = await findByTestId(
        "translator-version-text-field"
      );
      expect(translatorVersion).toBeInTheDocument();
      expect(translatorVersion).toHaveValue("99.9.9");
    });
  });

  it("Translator Version: When set to draft we have specific verbage display", async () => {
    const testMeasure = {
      ...measure,
      model: Model.QDM_5_6,
      elmJson: testQDMElmJson,
      measureMetaData: measureMetaDataDraft,
    } as unknown as Measure;
    measureStore.state.mockImplementationOnce(() => testMeasure);
    checkUserCanEdit.mockImplementationOnce(() => true);
    await act(async () => {
      render(
        <MeasureInformation
          setErrorMessage={setErrorMessage}
          measureCanEdit={true}
        />
      );
      const translatorVersionText = await findByText(
        "Currently using CQL to ELM Translator Version"
      );
      expect(translatorVersionText).toBeInTheDocument();
    });
  });

  it("Translator Version: When set to draft we have specific verbage display", async () => {
    const testMeasure = {
      ...measure,
      model: Model.QDM_5_6,
      elmJson: testQDMElmJson,
      measureMetaData: measureMetaDataDraft,
    } as unknown as Measure;
    measureStore.state.mockImplementationOnce(() => testMeasure);
    checkUserCanEdit.mockImplementationOnce(() => true);
    await act(async () => {
      render(
        <MeasureInformation
          setErrorMessage={setErrorMessage}
          measureCanEdit={true}
        />
      );
      const translatorVersionText = await findByText(
        "Currently using CQL to ELM Translator Version"
      );
      expect(translatorVersionText).toBeInTheDocument();
    });
  });

  it("Translator Version: When set to it handles an error while fetching translator version", async () => {
    const testMeasure = {
      ...measure,
      model: Model.QDM_5_6,
      elmJson: testQDMElmJson,
      measureMetaData: measureMetaDataDraft,
    } as unknown as Measure;
    measureStore.state.mockImplementationOnce(() => testMeasure);
    checkUserCanEdit.mockImplementationOnce(() => true);
    useQdmElmTranslationServiceApiMock.mockImplementationOnce(() => {
      return {
        fetchTranslatorVersion: jest.fn().mockRejectedValueOnce({
          status: 424,
          data: "Unable to determine translator version.",
          error: { message: "error" },
        }),
      } as unknown as QdmElmTranslationServiceApi;
    });

    await act(async () => {
      render(
        <MeasureInformation
          setErrorMessage={setErrorMessage}
          measureCanEdit={true}
        />
      );
      const translatorVersionText = await findByText(
        "Unable to determine translator version."
      );
      expect(translatorVersionText).toBeInTheDocument();
    });
  });

  it("Translator Version: When set to not draft, we have specific verbage display", async () => {
    const testMeasure = {
      ...measure,
      model: Model.QDM_5_6,
      elmJson: testQDMElmJson,
      measureMetaData: measureMetaDataNotDraft,
    } as unknown as Measure;
    measureStore.state.mockImplementationOnce(() => testMeasure);
    checkUserCanEdit.mockImplementationOnce(() => true);
    await act(async () => {
      render(
        <MeasureInformation
          setErrorMessage={setErrorMessage}
          measureCanEdit={true}
        />
      );
      const translatorVersionText = await findByText(
        "Versioned with CQL to ELM Translator Version"
      );
      expect(translatorVersionText).toBeInTheDocument();
    });
  });

  it("should display 423 error message when updating failed", async () => {
    mockMeasureServiceApi.updateMeasure = jest.fn().mockRejectedValueOnce({
      status: 423,
      response: {
        data: {
          message:
            "Unable to update measure. Measure is locked by another user.",
        },
      },
    });
    mockMeasureServiceApi.getAllEndorsers = jest
      .fn()
      .mockResolvedValue(endorserList);

    measure.measureName = "";
    render(
      <MeasureInformation
        setErrorMessage={setErrorMessage}
        measureCanEdit={true}
      />
    );

    await act(async () => {
      const input = await findByTestId("measure-name-input");
      fireEvent.change(input, {
        target: { value: "new value" },
      });

      const createBtn = getByTestId("measurement-information-save-button");
      expect(createBtn).toBeEnabled();
      act(() => {
        fireEvent.click(createBtn);
      });
    });

    await waitFor(() => expect(setErrorMessage).toHaveBeenCalled(), {
      timeout: 5000,
    });
  });

  it("sets measureOwner to the fetched owner name on success", async () => {
    mockUserServiceApi.getMeasureOwnerDetails.mockResolvedValueOnce({
      firstName: "Jane",
      lastName: "Doe",
    });

    const { getByTestId } = render(
      <MeasureInformation setErrorMessage={jest.fn()} measureCanEdit={true} />
    );

    await waitFor(() => {
      expect(
        (getByTestId("measure-owner-text-field") as HTMLInputElement).value
      ).toBe("Jane Doe");
    });
  });

  it("sets measureOwner to '-' on fetch failure", async () => {
    mockUserServiceApi.getMeasureOwnerDetails.mockRejectedValueOnce(
      new Error("fail")
    );

    const { getByTestId } = render(
      <MeasureInformation setErrorMessage={jest.fn()} measureCanEdit={true} />
    );

    await waitFor(() => {
      expect(
        (getByTestId("measure-owner-text-field") as HTMLInputElement).value
      ).toBe("-");
    });
  });
});
