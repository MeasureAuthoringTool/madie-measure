import React from "react";

export const INSERT_TEST_CASE_HOW_IT_WORKS = (
  <>
    <p>
      This workflow allows you to insert all profiles from a selected test case
      into the current test case.
    </p>
    <p>To complete this process:</p>
    <ol>
      <li>
        Select the measure that contains the test case you want to insert.
      </li>
      <li>
        Select the test case you want to insert profiles from.
        <ul className="how-it-works-sub-list">
          <li>
            You can select View Test Case to review details before proceeding.
          </li>
        </ul>
      </li>
      <li>Select Insert.</li>
    </ol>
    <p>
      MADiE will add all profiles from the selected test case into the current
      test case. During this process, patient references are updated to the
      patient in the current test case, and new profile IDs are generated for
      each resource.
    </p>
  </>
);
