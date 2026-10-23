import React from "react";

import "styled-components/macro";
import parse from "html-react-parser";

function CodeCoverageHighlighting({ coverageHTML }) {
  return (
    <div className="mm:text-sm mm:p-5" data-testid="code-coverage-highlighting">
      {coverageHTML && parse(coverageHTML)}
    </div>
  );
}

export default CodeCoverageHighlighting;
