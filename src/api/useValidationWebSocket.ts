import useServiceConfig from "./useServiceConfig";
import { useOktaTokens } from "@madie/madie-util";
import { ServiceConfig } from "./ServiceContext";
import { test } from "@jest/globals";

export interface ValidationResult {
  testCaseId: string;
  validResource: boolean;
  operationOutcome: {
    message: string;
  };
}

export class ValidationSseClient {
  private eventSource: EventSource | null = null;

  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  connect(testCaseId: string, onMessage: (msg: ValidationResult) => void) {
    if (this.eventSource) {
      return;
    }

    // Setup EventSource with Authorization token as query param (simplest way for now)
    const url = `${
      this.baseUrl
    }/sse/validation-results/${testCaseId}?access_token=${encodeURIComponent(
      "Bearer " + this.getAccessToken()
    )}`;
    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener(
      `validation-result/${testCaseId}`,
      (event) => {
        try {
          console.log("Got a new validation result message", event);
          const data: ValidationResult = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error("Failed to parse SSE message:", error);
        }
      }
    );

    this.eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      this.disconnect();
    };
  }

  disconnect() {
    if (this.eventSource) {
      console.log("connection is closed");
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

const useValidationSseService = (): ValidationSseClient => {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();

  return new ValidationSseClient(
    serviceConfig?.testCaseService.baseUrl,
    getAccessToken
  );
};

export default useValidationSseService;
