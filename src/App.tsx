import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { MadieMeasure } from "./madie-madie-measure";
import CreateNewMeasure from "./components/CreateNewMeasure";

export default function App({ name }) {
  return (
    <>
      <Router>
        <div data-testid="test">
          <Switch>
            <Route path="/measure/create">
              <CreateNewMeasure />
            </Route>
            <Route path="/measure">
              <MadieMeasure />
            </Route>
          </Switch>
        </div>
      </Router>
    </>
  );
}
