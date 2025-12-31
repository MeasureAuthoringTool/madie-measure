import * as React from "react";
import { render, screen } from "@testing-library/react";
import { Formik } from "formik";
import ContentReferenceType, {
  ExtendedElementDefinition,
} from "./ContentReferenceType";
import { RequiredFieldsProvider } from "../RequiredFieldsContext";
import mockRequiredFields from "../mockRequiredFields";

jest.mock("../TypeEditor", () => (props: any) => (
  <div data-testid={`type-editor-${props.label}`}>
    TypeEditor: {props.label}
  </div>
));

jest.mock("../ChoiceType", () => (props: any) => (
  <div data-testid={`choice-type-${props.label}`}>
    ChoiceType: {props.label}
  </div>
));

jest.mock(
  "../../../../../../../common/UIOnlyModelAgnostic/ElementSection",
  () =>
    ({ title, children }: any) =>
      (
        <div data-testid={`element-section-${title}`}>
          <div data-testid="section-title">{title}</div>
          {children}
        </div>
      )
);

const mockFormInfo = [
  [
    "Questionnaire.item",
    {
      id: "Questionnaire.item",
      type: [{ code: "BackboneElement" }],
      max: "*",
      min: 0,
      canBeMultipleCardinality: true,
    },
  ],
  [
    "Questionnaire.item.linkId",
    {
      id: "Questionnaire.item.linkId",
      type: [{ code: "string" }],
      max: "1",
      min: 1,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "Questionnaire.item.text",
    {
      id: "Questionnaire.item.text",
      type: [{ code: "string" }],
      max: "1",
      min: 0,
      canBeMultipleCardinality: false,
    },
  ],
  [
    "Questionnaire.item.extension",
    {
      id: "Questionnaire.item.extension",
      type: [{ code: "Extension" }],
      max: "*",
      min: 0,
      canBeMultipleCardinality: true,
    },
  ],
];

const mockElementDefinition = {
  id: "Questionnaire.item.item",
  contentReference: "#Questionnaire.item",
  max: "*",
  min: 0,
  canBeMultipleCardinality: true,
} as ExtendedElementDefinition;

const mockParentElementDefinition = {
  id: "Questionnaire.item",
  type: [{ code: "BackboneElement" }],
} as ExtendedElementDefinition;

const mockResource = {
  resourceType: "Questionnaire",
};

const renderWithProviders = (
  component: React.ReactElement,
  formikValues: any = {}
) => {
  return render(
    <Formik initialValues={formikValues} onSubmit={jest.fn()}>
      <RequiredFieldsProvider
        requiredFields={mockRequiredFields}
        formInfo={mockFormInfo}
      >
        {component}
      </RequiredFieldsProvider>
    </Formik>
  );
};

describe("ContentReferenceType", () => {
  it("renders unsupported message when contentReference is missing", () => {
    const elementDef = {
      ...mockElementDefinition,
      contentReference: undefined,
    } as ExtendedElementDefinition;

    renderWithProviders(
      <ContentReferenceType
        elementDefinition={elementDef}
        parentElementDefinition={mockParentElementDefinition}
        resource={mockResource}
        canEdit={true}
      />
    );

    expect(
      screen.getByText("This ContentReference Type attribute is not supported")
    ).toBeInTheDocument();
  });

  it("renders single element section with default value", () => {
    renderWithProviders(
      <ContentReferenceType
        elementDefinition={mockElementDefinition}
        parentElementDefinition={mockParentElementDefinition}
        resource={mockResource}
        canEdit={true}
      />,
      {}
    );

    expect(screen.getByTestId("element-section-Item 1")).toBeInTheDocument();
    expect(
      screen.getByTestId("type-editor-Questionnaire.item.item[0].linkId")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("type-editor-Questionnaire.item.item[0].text")
    ).toBeInTheDocument();
  });

  it("renders multiple element sections for array values", () => {
    const formikValues = {
      Questionnaire: {
        item: {
          item: [
            { linkId: "1", text: "Question 1" },
            { linkId: "2", text: "Question 2" },
          ],
        },
      },
    };

    renderWithProviders(
      <ContentReferenceType
        elementDefinition={mockElementDefinition}
        parentElementDefinition={mockParentElementDefinition}
        resource={mockResource}
        canEdit={true}
      />,
      formikValues
    );

    expect(screen.getByTestId("element-section-Item 1")).toBeInTheDocument();
    expect(screen.getByTestId("element-section-Item 2")).toBeInTheDocument();
    expect(
      screen.getByTestId("type-editor-Questionnaire.item.item[0].linkId")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("type-editor-Questionnaire.item.item[1].linkId")
    ).toBeInTheDocument();
  });

  it("handles single cardinality element", () => {
    const singleCardinalityDef = {
      ...mockElementDefinition,
      max: "1",
      canBeMultipleCardinality: false,
    };

    renderWithProviders(
      <ContentReferenceType
        elementDefinition={singleCardinalityDef}
        parentElementDefinition={mockParentElementDefinition}
        resource={mockResource}
        canEdit={true}
      />
    );

    expect(screen.getByTestId("element-section-Item 1")).toBeInTheDocument();
    expect(
      screen.getByTestId("type-editor-Questionnaire.item.item.linkId")
    ).toBeInTheDocument();
  });

  it("filters out id, extension and modifierExtension elements", () => {
    const extendedFormInfo = [
      ...mockFormInfo,
      [
        "Questionnaire.item.modifierExtension",
        {
          id: "Questionnaire.item.modifierExtension",
          type: [{ code: "Extension" }],
        },
      ],
      [
        "Questionnaire.item.id",
        {
          id: "Questionnaire.item.id",
          type: [{ code: "string" }],
        },
      ],
    ];

    render(
      <Formik initialValues={{}} onSubmit={jest.fn()}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={extendedFormInfo}
        >
          <ContentReferenceType
            elementDefinition={mockElementDefinition}
            parentElementDefinition={mockParentElementDefinition}
            resource={mockResource}
            canEdit={true}
          />
        </RequiredFieldsProvider>
      </Formik>
    );

    expect(
      screen.queryByTestId(
        "type-editor-Questionnaire.item.item[0].modifierExtension"
      )
    ).not.toBeInTheDocument();

    expect(
      screen.queryByTestId("type-editor-Questionnaire.item.item[0].id")
    ).not.toBeInTheDocument();
  });

  it("filters out nested contentReference elements to avoid infinite rendering", () => {
    const formInfoWithNestedRef = [
      ...mockFormInfo,
      [
        "Questionnaire.item.nestedItem",
        {
          id: "Questionnaire.item.nestedItem",
          contentReference: "#Questionnaire.item",
        },
      ],
    ];

    render(
      <Formik initialValues={{}} onSubmit={jest.fn()}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={formInfoWithNestedRef}
        >
          <ContentReferenceType
            elementDefinition={mockElementDefinition}
            parentElementDefinition={mockParentElementDefinition}
            resource={mockResource}
            canEdit={true}
          />
        </RequiredFieldsProvider>
      </Formik>
    );

    expect(
      screen.queryByTestId("type-editor-Questionnaire.item.item[0].nestedItem")
    ).not.toBeInTheDocument();
  });

  it("renders when canEdit is false", () => {
    renderWithProviders(
      <ContentReferenceType
        elementDefinition={mockElementDefinition}
        parentElementDefinition={mockParentElementDefinition}
        resource={mockResource}
        canEdit={false}
      />
    );

    expect(screen.getByTestId("element-section-Item 1")).toBeInTheDocument();
    expect(
      screen.getByTestId("type-editor-Questionnaire.item.item[0].linkId")
    ).toBeInTheDocument();
  });

  it("handles empty formInfo gracefully", () => {
    render(
      <Formik initialValues={{}} onSubmit={jest.fn()}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={[]}
        >
          <ContentReferenceType
            elementDefinition={mockElementDefinition}
            parentElementDefinition={mockParentElementDefinition}
            resource={mockResource}
            canEdit={true}
          />
        </RequiredFieldsProvider>
      </Formik>
    );

    expect(
      screen.getByText("This ContentReference Type attribute is not supported")
    ).toBeInTheDocument();
  });

  it("handles contentReference with incorrect format", () => {
    const invalidDef = {
      ...mockElementDefinition,
      contentReference: "InvalidFormat",
    } as ExtendedElementDefinition;

    render(
      <Formik initialValues={{}} onSubmit={jest.fn()}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={mockFormInfo}
        >
          <ContentReferenceType
            elementDefinition={invalidDef}
            parentElementDefinition={mockParentElementDefinition}
            resource={mockResource}
            canEdit={true}
          />
        </RequiredFieldsProvider>
      </Formik>
    );

    expect(
      screen.getByText("This ContentReference Type attribute is not supported")
    ).toBeInTheDocument();
  });

  it("renders correct section titles with _.startCase formatting", () => {
    renderWithProviders(
      <ContentReferenceType
        elementDefinition={mockElementDefinition}
        parentElementDefinition={mockParentElementDefinition}
        resource={mockResource}
        canEdit={true}
      />
    );

    expect(screen.getByTestId("section-title")).toHaveTextContent("Item 1");
  });

  it("handles elements with multiple cardinality parent correctly", () => {
    const formInfoWithMultiParent = [
      [
        "Questionnaire.item",
        {
          id: "Questionnaire.item",
          type: [{ code: "BackboneElement" }],
          max: "*",
          min: 0,
          canBeMultipleCardinality: true,
        },
      ],
      [
        "Questionnaire.item.answer",
        {
          id: "Questionnaire.item.answer",
          type: [{ code: "BackboneElement" }],
          max: "*",
          min: 0,
          canBeMultipleCardinality: true,
        },
      ],
      [
        "Questionnaire.item.answer.valueString",
        {
          id: "Questionnaire.item.answer.valueString",
          type: [{ code: "string" }],
          max: "1",
          min: 0,
          canBeMultipleCardinality: false,
        },
      ],
    ];

    const formikValues = {
      Questionnaire: {
        item: {
          item: [
            {
              answer: [
                { valueString: "Answer 1" },
                { valueString: "Answer 2" },
              ],
            },
          ],
        },
      },
    };

    render(
      <Formik initialValues={formikValues} onSubmit={jest.fn()}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={formInfoWithMultiParent}
        >
          <ContentReferenceType
            elementDefinition={mockElementDefinition}
            parentElementDefinition={mockParentElementDefinition}
            resource={mockResource}
            canEdit={true}
          />
        </RequiredFieldsProvider>
      </Formik>
    );

    expect(screen.getByTestId("element-section-Item 1")).toBeInTheDocument();
    expect(screen.getByTestId("element-section-Answer")).toBeInTheDocument();
  });

  it("handles large arrays with multiple sections", () => {
    const formikValues = {
      Questionnaire: {
        item: {
          item: [
            { linkId: "1" },
            { linkId: "2" },
            { linkId: "3" },
            { linkId: "4" },
            { linkId: "5" },
          ],
        },
      },
    };

    renderWithProviders(
      <ContentReferenceType
        elementDefinition={mockElementDefinition}
        parentElementDefinition={mockParentElementDefinition}
        resource={mockResource}
        canEdit={true}
      />,
      formikValues
    );

    expect(screen.getByTestId("element-section-Item 1")).toBeInTheDocument();
    expect(screen.getByTestId("element-section-Item 2")).toBeInTheDocument();
    expect(screen.getByTestId("element-section-Item 3")).toBeInTheDocument();
    expect(screen.getByTestId("element-section-Item 4")).toBeInTheDocument();
    expect(screen.getByTestId("element-section-Item 5")).toBeInTheDocument();
  });

  it("passes correct props to TypeEditor", () => {
    renderWithProviders(
      <ContentReferenceType
        elementDefinition={mockElementDefinition}
        parentElementDefinition={mockParentElementDefinition}
        resource={mockResource}
        canEdit={true}
      />
    );

    const typeEditor = screen.getByTestId(
      "type-editor-Questionnaire.item.item[0].linkId"
    );
    expect(typeEditor).toHaveTextContent(
      "TypeEditor: Questionnaire.item.item[0].linkId"
    );
  });

  it("renders ChoiceType for elements with [x] in label", () => {
    const formInfoWithChoiceType = [
      [
        "Questionnaire.item",
        {
          id: "Questionnaire.item",
          type: [{ code: "BackboneElement" }],
          max: "*",
          min: 0,
          canBeMultipleCardinality: true,
        },
      ],
      [
        "Questionnaire.item.value[x]",
        {
          id: "Questionnaire.item.value[x]",
          type: [{ code: "string" }, { code: "boolean" }],
          max: "1",
          min: 0,
          canBeMultipleCardinality: false,
        },
      ],
    ];

    render(
      <Formik initialValues={{}} onSubmit={jest.fn()}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={formInfoWithChoiceType}
        >
          <ContentReferenceType
            elementDefinition={mockElementDefinition}
            parentElementDefinition={mockParentElementDefinition}
            resource={mockResource}
            canEdit={true}
          />
        </RequiredFieldsProvider>
      </Formik>
    );

    expect(
      screen.getByTestId("choice-type-Questionnaire.item.item[0].value[x]")
    ).toBeInTheDocument();
  });

  it("handles MultiCardinalityElement with default value when formik path is empty", () => {
    const formInfoWithMultiCardinality = [
      [
        "Questionnaire.item",
        {
          id: "Questionnaire.item",
          type: [{ code: "BackboneElement" }],
          max: "*",
          min: 0,
          canBeMultipleCardinality: true,
        },
      ],
      [
        "Questionnaire.item.option",
        {
          id: "Questionnaire.item.option",
          type: [{ code: "BackboneElement" }],
          max: "*",
          min: 0,
          canBeMultipleCardinality: true,
        },
      ],
      [
        "Questionnaire.item.option.valueString",
        {
          id: "Questionnaire.item.option.valueString",
          type: [{ code: "string" }],
          max: "1",
          min: 0,
          canBeMultipleCardinality: false,
        },
      ],
    ];

    render(
      <Formik initialValues={{}} onSubmit={jest.fn()}>
        <RequiredFieldsProvider
          requiredFields={mockRequiredFields}
          formInfo={formInfoWithMultiCardinality}
        >
          <ContentReferenceType
            elementDefinition={mockElementDefinition}
            parentElementDefinition={mockParentElementDefinition}
            resource={mockResource}
            canEdit={true}
          />
        </RequiredFieldsProvider>
      </Formik>
    );

    expect(screen.getByTestId("element-section-Option")).toBeInTheDocument();
  });
});
