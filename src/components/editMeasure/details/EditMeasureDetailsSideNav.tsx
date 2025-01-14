import React from "react";
import tw from "twin.macro";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Tab, Tabs } from "@madie/madie-design-system/dist/react";
import "./EditMeasureSideBarNav.scss";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { useTheme } from "@mui/material";
import { Link } from "./MeasureDetails";

const OuterWrapper = tw.div`flex flex-col flex-grow py-6 bg-slate overflow-y-auto border-r border-slate`;
const InnerWrapper = tw.div`flex-grow flex flex-col`;
const Nav = tw.nav`flex-1 space-y-1 bg-slate`;

export interface EditMeasureDetailsSideNavProps {
  links: Array<Link>;
}

export default function EditMeasureDetailsSideNav(
  props: EditMeasureDetailsSideNavProps
) {
  const { links } = props;
  const { pathname } = useLocation();
  const endRoute = /[^/]*$/.exec(pathname)[0];
  const { measureId } = useParams<{
    measureId: string;
  }>();
  let navigate = useNavigate();
  const handleChange = (e, v) => {
    const newPath = `/measures/${measureId}/edit/details/${v}`;
    navigate(newPath);
  };

  const theme = useTheme();

  const getCompletedIcon = (linkInfo) => {
    return (
      <span style={{ position: "absolute", left: "8px" }}>
        <CheckCircleIcon
          data-testid={`measure-details-completed-icon-${linkInfo.id}`}
          sx={{ color: theme.palette.success.main, fontSize: 15 }}
        />
      </span>
    );
  };
  const getIncompletedIcon = (linkInfo) => {
    return (
      <span style={{ position: "absolute", left: "8px" }}>
        <ErrorIcon
          data-testid={`measure-details-incompleted-icon-${linkInfo.id}`}
          sx={{ color: theme.palette.error.main, fontSize: 15 }}
        />
      </span>
    );
  };

  function getIcon(linkInfo) {
    let icon;

    if (linkInfo.displayCompletedIcon) {
      icon = getCompletedIcon(linkInfo);
    }

    if (linkInfo.displayIncompletedIcon) {
      icon = getIncompletedIcon(linkInfo);
    }

    return icon;
  }

  return (
    <OuterWrapper>
      <InnerWrapper
        className="edit-measure-side-nav"
        id="edit-measure-details-side-nav"
      >
        <Nav aria-label="Sidebar">
          {links.map((link) => (
            <div className="link-container">
              <h4 className="link-heading">{link.title}</h4>
              <Tabs
                type="C"
                orientation="vertical"
                value={endRoute}
                onChange={handleChange}
              >
                {link.links.map((linkInfo) => {
                  return (
                    <Tab
                      label={linkInfo.title}
                      icon={getIcon(linkInfo)}
                      type="C"
                      value={linkInfo.href}
                      id={linkInfo.id}
                      data-testid={linkInfo.dataTestId}
                    />
                  );
                })}
              </Tabs>
            </div>
          ))}
        </Nav>
      </InnerWrapper>
    </OuterWrapper>
  );
}
