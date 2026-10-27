import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div data-testid="404-page">
      <h6 style={{ textAlign: "center" }}>404 - Not Found!</h6>
      <button className="mm:text-blue-500 mm:hover:text-blue-900">
        <Link to="/measures" data-testid="404-page-link">
          Go Home
        </Link>
      </button>
    </div>
  );
};
export default NotFound;
