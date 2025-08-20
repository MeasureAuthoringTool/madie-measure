import * as React from "react";

import { render } from "@testing-library/react";
import ValidationPanel from "./ValidationPanel";
import {
  HapiOperationOutcome,
  TestCase,
  ValidationStatus,
} from "@madie/madie-models";

const testcase = {
  id: "1",
  title: "Ip Pass",
  json: "test",
} as TestCase;
const hapiOperationOutcome: HapiOperationOutcome[] = [
  {
    code: 200,
    message: "success",
    successful: true,
    outcomeResponse: {
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code: "informational",
          diagnostics: "No issues detected during validation",
          location: ["undefined"],
        },
      ],
      text: "test",
    },
  },
];
const validationErrors = [
  ,
  {
    severity: "warning",
    code: "processing",
    details: {
      coding: [
        {
          system: "http://hl7.org/fhir/java-core-messageId",
          code: "Terminology_TX_NoValid_16",
        },
      ],
    },
    diagnostics: "Validation warning.",
    location: ["location 1"],
    key: 1,
  },
  {
    severity: "error",
    code: "processing",
    details: {
      coding: [
        {
          system: "http://hl7.org/fhir/java-core-messageId",
          code: "Terminology_TX_NoValid_16",
        },
      ],
    },
    diagnostics: "Validation error.",
    location: ["location 2"],
    key: 0,
  },
];

const validationInfo = [
  {
    severity: "warning",
    code: "warning",
    details: {
      coding: [
        {
          system: "http://hl7.org/fhir/java-core-messageId",
          code: "Terminology_TX_NoValid_16",
        },
      ],
    },
    diagnostics: "Meta.profile: No issues detected during validation",
    location: ["location 1"],
    key: 0,
  },
  {
    code: "warning",
    details: {
      coding: [
        {
          system: "http://hl7.org/fhir/java-core-messageId",
          code: "Terminology_TX_NoValid_16",
        },
      ],
    },
    diagnostics: "No issues detected during validation",
    location: ["location 2"],
    key: 1,
  },
];

describe("ValidationPanel component", () => {
  it("should render ValidationPanel for pending status", () => {
    const pendingTestCase = {
      ...testcase,
      validationStatus: ValidationStatus.PENDING,
    };
    const { getByTestId } = render(
      <ValidationPanel testCase={pendingTestCase} validationErrors={[]} />
    );

    expect(getByTestId("validation-skeleton-box")).toBeInTheDocument();
    expect(getByTestId("validation-skeleton")).toBeInTheDocument();
  });

  it("should render ValidationPanel for validating status", () => {
    const validatingTestCase = {
      ...testcase,
      validationStatus: ValidationStatus.VALIDATING,
    };
    const { getByTestId } = render(
      <ValidationPanel testCase={validatingTestCase} validationErrors={[]} />
    );

    expect(getByTestId("validation-skeleton-box")).toBeInTheDocument();
    expect(getByTestId("validation-skeleton")).toBeInTheDocument();
  });

  it("should render ValidationPanel for valid status", () => {
    const validTestCase = {
      ...testcase,
      validationStatus: ValidationStatus.VALID,
    };
    const { getByText } = render(
      <ValidationPanel testCase={validTestCase} validationErrors={[]} />
    );

    expect(getByText("Nothing to see here!")).toBeInTheDocument();
  });

  it("should render ValidationPanel for valid status with validation info", () => {
    const validTestCase = {
      ...testcase,
      validationStatus: ValidationStatus.VALID,
    };
    const { getByTestId } = render(
      <ValidationPanel
        testCase={validTestCase}
        validationErrors={validationInfo}
      />
    );

    expect(getByTestId("validation-card-0")).toBeInTheDocument();
    expect(getByTestId("validation-card-1")).toBeInTheDocument();
  });

  it("should render ValidationPanel for invalid status", () => {
    const invalidTestCase = {
      ...testcase,
      validationStatus: ValidationStatus.INVALID,
      hapiOperationOutcome: hapiOperationOutcome[0],
    };
    const { getByTestId } = render(
      <ValidationPanel
        testCase={invalidTestCase}
        validationErrors={validationErrors}
      />
    );

    expect(getByTestId("validation-card-0")).toBeInTheDocument();
    expect(getByTestId("validation-card-0")).toHaveTextContent("Error");
    expect(getByTestId("validation-card-1")).toBeInTheDocument();
    expect(getByTestId("validation-card-1")).toHaveTextContent(
      "Warning: Validation warning"
    );
  });

  it("should render meta validation error with correct styling and text", () => {
    const testCase = {
      ...testcase,
      validationStatus: ValidationStatus.INVALID,
    };
    const metaError = [
      {
        severity: "error",
        code: "processing",
        diagnostics: "Meta.profile: Profile validation failed.",
        location: ["location 1"],
        key: 2,
      },
    ];
    const { getByTestId } = render(
      <ValidationPanel testCase={testCase} validationErrors={metaError} />
    );
    const card = getByTestId("validation-card-2");
    expect(card).toBeInTheDocument();
    expect(card).toHaveTextContent("Meta.profile: Profile validation failed.");
  });

  it("should not render informational errors", () => {
    const testCase = {
      ...testcase,
      validationStatus: ValidationStatus.INVALID,
    };
    const errors = [
      {
        severity: "information",
        code: "informational",
        diagnostics: "This is informational.",
        location: ["location 1"],
        key: 3,
      },
      {
        severity: "error",
        code: "processing",
        diagnostics: "Validation failed.",
        location: ["location 2"],
        key: 4,
      },
    ];
    const { queryByTestId } = render(
      <ValidationPanel testCase={testCase} validationErrors={errors} />
    );
    expect(queryByTestId("validation-card-3")).not.toBeInTheDocument();
    expect(queryByTestId("validation-card-4")).toBeInTheDocument();
  });

  it("should render warning validation error with correct styling and text", () => {
    const testCase = {
      ...testcase,
      validationStatus: ValidationStatus.INVALID,
    };
    const warningError = [
      {
        severity: "warning",
        code: "warning",
        diagnostics: "This is a warning.",
        location: ["location 1"],
        key: 5,
      },
    ];
    const { getByTestId } = render(
      <ValidationPanel testCase={testCase} validationErrors={warningError} />
    );
    const card = getByTestId("validation-card-5");
    expect(card).toBeInTheDocument();
    expect(card).toHaveTextContent("Warning: This is a warning.");
  });

  it("should render no errors present text when no errors and feature flag is true for valid status and isQiCoreV6", () => {
    const validTestCase = {
      ...testcase,
      validationStatus: ValidationStatus.VALID,
    };
    const { getByText } = render(
      <ValidationPanel
        testCase={validTestCase}
        validationErrors={[]}
        isQiCoreV6={true}
        stu6TestCaseValidationFeatureFlag={true}
      />
    );
    expect(getByText("Nothing to see here!")).toBeInTheDocument();
  });

  it("should render no errors present text when no errors and feature flag is true for valid status and not isQiCoreV6", () => {
    const validTestCase = {
      ...testcase,
      validationStatus: ValidationStatus.VALID,
    };
    const { getByText } = render(
      <ValidationPanel
        testCase={validTestCase}
        validationErrors={[]}
        isQiCoreV6={false}
        stu6TestCaseValidationFeatureFlag={true}
      />
    );
    expect(getByText("Nothing to see here!")).toBeInTheDocument();
  });

  it("should render no errors present text when no errors and feature flag is false", () => {
    const validTestCase = {
      ...testcase,
      validationStatus: ValidationStatus.VALID,
    };
    const { getByText } = render(
      <ValidationPanel
        testCase={validTestCase}
        validationErrors={[]}
        isQiCoreV6={true}
        stu6TestCaseValidationFeatureFlag={false}
      />
    );
    expect(getByText("Nothing to see here!")).toBeInTheDocument();
  });
});
