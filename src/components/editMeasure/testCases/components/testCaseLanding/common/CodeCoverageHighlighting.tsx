import React from "react";

import "styled-components/macro";
import parse from "html-react-parser";

function CodeCoverageHighlighting({ coverageHTML }) {
  return (
    <div data-testid="code-coverage-highlighting" className="mm:text-sm mm:p-5">
      {coverageHTML && parse(coverageHTML)}
    </div>
  );
}

export default CodeCoverageHighlighting;
