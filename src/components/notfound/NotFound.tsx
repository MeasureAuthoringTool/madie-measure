import React from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  let navigate = useNavigate();

  function handleClick() {
    navigate("/measures");
  }
  return (
    <div data-testid="404-page">
      <h6 style={{ textAlign: "center" }}>404 - Not Found!</h6>
      <button
        type="button"
        data-testid="404-page-link"
        onClick={handleClick}
        className="mm:text-blue-500 mm:hover:text-blue-900"
      >
        Go Home
      </button>
    </div>
  );
};
export default NotFound;
