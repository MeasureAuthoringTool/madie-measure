"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var react_1 = require("@testing-library/react");
var CompositeProfilesViews_1 = require("./CompositeProfilesViews");
// Mock child components to isolate behavior
jest.mock("./CompositeMeasuresTable", function () {
  return {
    __esModule: true,
    default: function (_a) {
      var measures = _a.measures;
      return (
        <div data-testid="composite-table">
          {(measures === null || measures === void 0
            ? void 0
            : measures.length) || 0}{" "}
          measures
        </div>
      );
    },
  };
});
jest.mock(
  "../LeftPanel/ElementsTab/builder/HowItWorks/HowItWorks",
  function () {
    return {
      __esModule: true,
      default: function (_a) {
        var isOpen = _a.isOpen;
        return (
          <div data-testid="how-it-works">{isOpen ? "open" : "closed"}</div>
        );
      },
    };
  }
);
describe("CompositeProfileViews", function () {
  var defaultProps = {
    howItWorksOpen: false,
    setAvailableTab: jest.fn(),
    setHowItWorksOpen: jest.fn(),
    compositeMeasures: [{ id: 1 }, { id: 2 }],
    completedMeasureCount: 1,
    handleSelectTestCase: jest.fn(),
  };
  it("renders header text", function () {
    (0, react_1.render)(<CompositeProfilesViews_1.default {...defaultProps} />);
    expect(
      react_1.screen.getByText(
        /Select Which Measures to choose Test Case Profiles from:/i
      )
    ).toBeInTheDocument();
  });
  it("renders measure completion text", function () {
    (0, react_1.render)(<CompositeProfilesViews_1.default {...defaultProps} />);
    expect(
      react_1.screen.getByText("1 of 2 Measures (Components) complete")
    ).toBeInTheDocument();
  });
  it("renders CompositeMeasuresTable", function () {
    (0, react_1.render)(<CompositeProfilesViews_1.default {...defaultProps} />);
    expect(react_1.screen.getByTestId("composite-table")).toBeInTheDocument();
    expect(react_1.screen.getByText("2 measures")).toBeInTheDocument();
  });
  it("calls setAvailableTab when back button is clicked", function () {
    (0, react_1.render)(<CompositeProfilesViews_1.default {...defaultProps} />);
    var button = react_1.screen.getByTestId("back-to-all-profiles-button");
    react_1.fireEvent.click(button);
    expect(defaultProps.setAvailableTab).toHaveBeenCalledWith("profiles");
  });
  it("applies class when howItWorksOpen is true", function () {
    (0, react_1.render)(
      <CompositeProfilesViews_1.default
        {...defaultProps}
        howItWorksOpen={true}
      />
    );
    var howItWorksContainer =
      react_1.screen.getByTestId("how-it-works").parentElement;
    expect(howItWorksContainer).toHaveClass("how-it-works-flush-left");
  });
  it("does not render completion text when no measures", function () {
    (0, react_1.render)(
      <CompositeProfilesViews_1.default
        {...defaultProps}
        compositeMeasures={[]}
      />
    );
    expect(
      react_1.screen.queryByText(/Measures \(Components\) complete/i)
    ).not.toBeInTheDocument();
  });
});
