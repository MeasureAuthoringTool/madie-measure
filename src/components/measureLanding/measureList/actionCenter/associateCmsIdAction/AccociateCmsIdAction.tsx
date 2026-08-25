import React, { useCallback, useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { Measure, Model } from "@madie/madie-models";
import { useOktaTokens } from "@madie/madie-util";
import IconLink from "../../../../../icons/IconLink";

interface PropTypes {
  measures: Measure[];
  onClick: () => void;
}

export const MUST_BE_OWNER = "Must own both selected measures";
export const MUST_SELECT_ONE_QDM_AND_ONE_QI_CORE_MEASURE =
  "Must select one QDM and one QI-Core measure";
export const MUST_BE_DRAFT = "QI-Core measure must be in a draft status";
export const MUST_HAVE_CMS_ID = "QDM measure must contain a CMS ID";
export const MUST_NOT_HAVE_CMS_ID = "QI-Core measure must NOT contain a CMS ID";
export const ASSOCIATE_CMS_ID = "Associate CMS ID";
export const SELECT_TWO_MEASURES = "Select two measures";
export const MEASURE_LOCKED_MESSAGE =
  "Unable to associate measures. Locked while being edited by";
export const CANNOT_LINK_COMPOSITE = "Cannot link Composite measures";

export default function AssociateCmsIdAction(props: PropTypes) {
  const { measures } = props;
  const [disableAssociateCmsIdBtn, setDisableAssociateCmsIdBtn] =
    useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(SELECT_TWO_MEASURES);

  const { getUserName } = useOktaTokens();
  const userName = getUserName();
  const validateAssociateCmsIdActionState = useCallback(() => {
    if (measures?.length === 2) {
      const qdmMeasure = measures.find(
        (measure) => measure.model === Model.QDM_5_6
      );

      const qiCoreMeasure = measures.find(
        (measure) =>
          measure.model === Model.QICORE || measure.model === Model.QICORE_6_0_0
      );

      if (qdmMeasure && qiCoreMeasure) {
        // set button state to disabled by default
        setDisableAssociateCmsIdBtn(true);

        if (qiCoreMeasure.measureMetaData?.composite) {
          setTooltipMessage(CANNOT_LINK_COMPOSITE);
        } else if (
          qdmMeasure.measureSet.owner.toLowerCase() !==
            userName.toLowerCase() ||
          qiCoreMeasure.measureSet.owner.toLowerCase() !==
            userName.toLowerCase()
        ) {
          setTooltipMessage(MUST_BE_OWNER);
        } else if (!qiCoreMeasure.measureMetaData.draft) {
          setTooltipMessage(MUST_BE_DRAFT);
        } else if (!qdmMeasure.measureSet.cmsId) {
          setTooltipMessage(MUST_HAVE_CMS_ID);
        } else if (qiCoreMeasure.measureSet.cmsId) {
          setTooltipMessage(MUST_NOT_HAVE_CMS_ID);
        } else {
          if (qiCoreMeasure.measureLock?.lockedBy) {
            setTooltipMessage(
              MEASURE_LOCKED_MESSAGE + ` ${qiCoreMeasure.measureLock.lockedBy}`
            );
          } else {
            setTooltipMessage(ASSOCIATE_CMS_ID);
            setDisableAssociateCmsIdBtn(false);
          }
        }
      } else {
        setTooltipMessage(MUST_SELECT_ONE_QDM_AND_ONE_QI_CORE_MEASURE);
      }
    } else {
      setTooltipMessage(SELECT_TWO_MEASURES);
      setDisableAssociateCmsIdBtn(true);
    }
  }, [measures, userName]);

  useEffect(() => {
    validateAssociateCmsIdActionState();
  }, [measures, validateAssociateCmsIdActionState]);

  return (
    <Tooltip
      data-testid="associate-cms-id-tooltip"
      title={tooltipMessage}
      onMouseOver={validateAssociateCmsIdActionState}
      arrow
      placement="top"
      slotProps={{
        tooltip: {
          sx: {
            zIndex: 99,
            backgroundColor: "#333",
            "& .MuiTooltip-arrow": {
              color: "#333",
            },
          },
        },
      }}
    >
      <span>
        <IconButton
          onClick={props.onClick}
          disabled={disableAssociateCmsIdBtn}
          data-testid="associate-cms-id-action-btn"
        >
          <IconLink />
        </IconButton>
      </span>
    </Tooltip>
  );
}
