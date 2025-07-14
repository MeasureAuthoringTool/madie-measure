import { useEffect, useRef } from "react";
import useTestCaseServiceApi from "../api/useTestCaseServiceApi";
import { TestCase } from "@madie/madie-models";

type UseTestCasePollingParams = {
  testCaseId: string;
  measureId: string;
  shouldStart: boolean;
  onUpdate: (updated: TestCase) => void;
  validateTest: boolean;
  onError?: (error: unknown) => void;
};

export function useTestCasePolling({
  testCaseId,
  measureId,
  shouldStart,
  onUpdate,
  validateTest,
  onError,
}: UseTestCasePollingParams) {
  const testCaseService = useRef(useTestCaseServiceApi());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!shouldStart || !testCaseId || !measureId) return;

    const poll = async () => {
      try {
        const updated = await testCaseService.current.getTestCase(
          testCaseId,
          measureId,
          validateTest
        );
        const status = updated.validationStatus;

        if (!["Pending", "Validating"].includes(status)) {
          onUpdate(updated);
          stopPolling();
        }
      } catch (err) {
        stopPolling();
        if (onError) {
          onError(
            "Unable to retrieve validation results for the test case, please try again. If the error persists, please contact the help desk."
          );
        }
      }
    };

    const startPolling = () => {
      poll();
      intervalRef.current = setInterval(poll, 5000);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    startPolling();

    return () => {
      stopPolling();
    };
  }, [testCaseId, measureId, shouldStart]);
}
