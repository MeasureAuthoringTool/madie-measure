import styled from "styled-components";
import React from "react";
import { Link } from "react-router-dom";

const GoHomeLink = styled.button.attrs((): { className: string } => ({
  className: "mm:text-blue-500 mm:hover:text-blue-900",
}))``;

const NotFound = () => {
  return (
    <div data-testid="404-page">
      <h6 style={{ textAlign: "center" }}>404 - Not Found!</h6>
      <GoHomeLink>
        <Link to="/measures" data-testid="404-page-link">
          Go Home
        </Link>
      </GoHomeLink>
    </div>
  );
};
export default NotFound;
