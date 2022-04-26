import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import tw from "twin.macro";
import styled, { css } from "styled-components";
import InlineEdit from "../../../inlineEdit/InlineEdit";
import Measure from "../../../../models/Measure";
import useMeasureServiceApi from "../../../../api/useMeasureServiceApi";
import useCurrentMeasure from "../../useCurrentMeasure";
import "styled-components/macro";
import useOktaTokens from "../../../../hooks/useOktaTokens";
import { Button, Toast } from "@madie/madie-design-system/dist/react";
import DeleteDialog from "./DeleteDialog";

export const DisplayDiv = styled.div(() => [
  tw`flex`,
  css`
    white-space: pre;
  `,
]);
export const DisplaySpan = styled.span`
  white-space: pre;
`;

export default function MeasureInformation() {
  const history = useHistory();
  const measureServiceApi = useMeasureServiceApi();
  const { measure, setMeasure } = useCurrentMeasure();
  const [genericErrorMessage, setGenericErrorMessage] = useState<string>();
  const { getUserName } = useOktaTokens();
  const userName = getUserName();

  // Dialog and toast utilities
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");

  const onToastClose = () => {
    setToastType(null);
    setToastMessage("");
    setToastOpen(false);
  };
  const handleToast = (type, message, open) => {
    setToastType(type);
    setToastMessage(message);
    setToastOpen(open);
  };

  const deleteMeasure = async () => {
    const deletedMeasure: Measure = { ...measure, active: false };
    try {
      const result = await measureServiceApi.updateMeasure(deletedMeasure);
      if (result.status === 200) {
        handleToast("success", "Measure successfully deleted", true);
        setTimeout(() => {
          history.push("/measures");
        }, 3000);
      }
    } catch (e) {
      if (e?.response?.data) {
        const { error, status, message } = e.response.data;
        const errorMessage = `${status}: ${error} ${message}`;
        handleToast("danger", errorMessage, true);
      } else {
        handleToast("danger", e.toString(), true);
      }
    }
  };
  function updateMeasureTitle(text: string): void {
    if (text !== measure.measureName) {
      const newMeasure: Measure = { ...measure, measureName: text };

      measureServiceApi
        .updateMeasure(newMeasure)
        .then(() => {
          setMeasure(newMeasure);
        })
        .catch(({ response }) => {
          if (response.data.measureName) {
            setGenericErrorMessage(
              "Unable to update measure. Reason: " + response.data.measureName
            );
          }
        });
    }
  }

  return (
    <div tw="px-4 pt-4" data-testid="measure-name-edit">
      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        measureName={measure?.measureName}
        deleteMeasure={deleteMeasure}
      />
      {genericErrorMessage && (
        <div tw="bg-red-500 pt-4 px-4 pb-4">
          <span
            tw="text-white"
            data-testid="edit-measure-information-generic-error-text"
          >
            {genericErrorMessage}
          </span>
        </div>
      )}
      <DisplayDiv>
        <span tw="mr-2">Measure Name:</span>
        {measure.createdBy === userName && (
          <InlineEdit
            text={measure.measureName}
            onSetText={updateMeasureTitle}
          />
        )}
        {measure.createdBy !== userName && measure.measureName}
        {measure.createdBy === userName && (
          <Button
            variant="danger-primary"
            data-testid="delete-measure-button"
            disabled={measure.createdBy !== userName}
            onClick={() => setDeleteOpen(true)}
          >
            Delete Measure
          </Button>
        )}
      </DisplayDiv>
      <div tw="flex" data-testid="cql-library-name-display">
        <span tw="mr-2">Measure CQL Library Name:</span>
        <DisplaySpan>{measure.cqlLibraryName || "NA"}</DisplaySpan>
      </div>
      <Toast
        toastKey="measure-information-toast"
        toastType={toastType}
        testId={
          toastType === "danger"
            ? "edit-measure-information-generic-error-text"
            : "edit-measure-information-success-text"
        }
        open={toastOpen}
        message={toastMessage}
        onClose={onToastClose}
        autoHideDuration={6000}
      />
    </div>
  );
}
