import React, { useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { Measure, Model } from "@madie/madie-models";
import { useOktaTokens } from "@madie/madie-util";
import IconLink from "../../../../icons/IconLink";

interface PropTypes {
  measures: Measure[];
}

export const MUST_BE_OWNER = "Must own both selected measures";
export const MUST_BE_DIFFERENT_MODELS = "Measures must be different models";
export const MUST_BE_DRAFT = "QI-Core measure must be in a draft status";
export const MUST_HAVE_CMS_ID = "QDM measure must contain a CMS ID";
export const MUST_NOT_HAVE_CMS_ID = "QI-Core measure must NOT contain a CMS ID";
export const ASSOCIATE_CMS_ID = "Associate CMS ID";
export const SELECT_TWO_MEASURES = "Select two measures";

export default function AssociateCmsIdAction(props: PropTypes) {
  const { measures } = props;
  const [disableAssociateCmsIdBtn, setDisableAssociateCmsIdBtn] =
    useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(SELECT_TWO_MEASURES);

  const { getUserName } = useOktaTokens();
  const userName = getUserName();

  const validateAssociateCmsIdActionState = () => {
    // set button state to disabled by default
    setDisableAssociateCmsIdBtn(true);
    if (measures.length === 2) {
      const [measure1, measure2] = measures;
      if (
        measure1.measureSet.owner !== userName ||
        measure2.measureSet.owner !== userName
      ) {
        setTooltipMessage(MUST_BE_OWNER);
      } else if (measure1.model === measure2.model) {
        setTooltipMessage(MUST_BE_DIFFERENT_MODELS);
      } else if (
        (measure1.model === Model.QICORE && !measure1.measureMetaData.draft) ||
        (measure2.model === Model.QICORE && !measure2.measureMetaData.draft)
      ) {
        setTooltipMessage(MUST_BE_DRAFT);
      } else if (
        (measure1.model === Model.QDM_5_6 && !measure1.measureSet.cmsId) ||
        (measure2.model === Model.QDM_5_6 && !measure2.measureSet.cmsId)
      ) {
        setTooltipMessage(MUST_HAVE_CMS_ID);
      } else if (
        (measure1.model === Model.QICORE && measure1.measureSet.cmsId) ||
        (measure2.model === Model.QICORE && measure2.measureSet.cmsId)
      ) {
        setTooltipMessage(MUST_NOT_HAVE_CMS_ID);
      } else {
        setTooltipMessage(ASSOCIATE_CMS_ID);
        setDisableAssociateCmsIdBtn(false);
      }
    } else {
      setTooltipMessage(SELECT_TWO_MEASURES);
    }
  };

  const associateCmsId = () => {
    // TODO: implement this with MAT-7301
    // eslint-disable-next-line no-console
    console.log("linking cms id...");
  };

  useEffect(() => {
    validateAssociateCmsIdActionState();
  }, [measures, validateAssociateCmsIdActionState]);

  return (
    <Tooltip
      data-testid="associate_cms_id_tooltip"
      title={tooltipMessage}
      onMouseOver={validateAssociateCmsIdActionState}
      arrow
    >
      <span>
        <IconButton
          onClick={associateCmsId}
          disabled={disableAssociateCmsIdBtn}
          data-testid="associate_cms_id_btn"
        >
          <IconLink
            fillColor={disableAssociateCmsIdBtn ? "#8C8C8C" : "#0073C8"}
          />
        </IconButton>
      </span>
    </Tooltip>
  );
}
