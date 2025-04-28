import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import useServiceConfig from "./useServiceConfig";
import { useOktaTokens } from "@madie/madie-util";
import useTestCaseServiceApi from "../components/editMeasure/testCases/api/useTestCaseServiceApi";
import { ServiceConfig } from "./ServiceContext";
import { HapiOperationOutcome } from "@madie/madie-models";

export interface ValidationResult {
  testCaseId: string;
  validResource: boolean;
  operationOutcome: HapiOperationOutcome;
}

export class ValidationWebSocketClient {
  private client: Client | null = null;

  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  connect(testCaseId: string, onMessage: (msg: ValidationResult) => void) {
    if (this.client?.connected) return;

    // transport restricts to the use of websockets only, a fallback to other protocols such as jsonp-polling will not work,
    // We need fallback if any old browser doesn't support websockets.
    // Had to restrict as jsonp-polling doesn't support CORS ?
    const socket = new SockJS(
      `${this.baseUrl}/ws?access_token=Bearer ${this.getAccessToken()}`,
      null,
      {
        transports: ["websocket"],
      }
    );

    this.client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("WebSocket connected", testCaseId);
        this.client?.subscribe(
          `/topic/validation-results/${testCaseId}`,
          (message) => {
            const payload: ValidationResult = JSON.parse(message.body);
            onMessage(payload);
          }
        );
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame);
      },
    });

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
  }
}

const useValidationWebSocketService = (): ValidationWebSocketClient => {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();

  return new ValidationWebSocketClient(
    serviceConfig?.testCaseService.baseUrl,
    getAccessToken
  );
};

export default useValidationWebSocketService;
