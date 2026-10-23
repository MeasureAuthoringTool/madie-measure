import styled from "styled-components";
import React from "react";
import { useNavigate } from "react-router-dom";

const GoHomeLink = styled.button.attrs((): { className: string } => ({
  className: "mm:text-blue-500 mm:hover:text-blue-900",
}))``;

const NotFound = () => {
  let navigate = useNavigate();

  function handleClick() {
    navigate("/measures");
  }
  return (
    <div data-testid="404-page">
      <h6 style={{ textAlign: "center" }}>404 - Not Found!</h6>
      <GoHomeLink
        type="button"
        data-testid="404-page-link"
        onClick={handleClick}
      >
        Go Home
      </GoHomeLink>
    </div>
  );
};
export default NotFound;
