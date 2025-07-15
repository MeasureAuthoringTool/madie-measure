import React, { useCallback, useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { Measure, Model } from "@madie/madie-models";
import { useOktaTokens } from "@madie/madie-util";
import {
  ASSOCIATE_CMS_ID,
  MUST_SELECT_ONE_QDM_AND_ONE_QI_CORE_MEASURE,
  MUST_BE_DRAFT,
  MUST_BE_OWNER,
  MUST_HAVE_CMS_ID,
  MUST_NOT_HAVE_CMS_ID,
  SELECT_TWO_MEASURES,
} from "./constants";
import IconLink from "../../../../../icons/IconLink";

interface PropTypes {
  measures: Measure[];
  onClick: () => void;
}

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

        if (
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
          setTooltipMessage(ASSOCIATE_CMS_ID);
          setDisableAssociateCmsIdBtn(false);
        }
      } else {
        setTooltipMessage(MUST_SELECT_ONE_QDM_AND_ONE_QI_CORE_MEASURE);
      }
    } else {
      setTooltipMessage(SELECT_TWO_MEASURES);
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
