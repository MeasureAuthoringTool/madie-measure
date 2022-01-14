import React, { useState } from "react";
import { Route, Switch, BrowserRouter, useHistory } from "react-router-dom";
import { CreateNewMeasure } from "../createNewMeasure/CreateNewMeasure";
import EditMeasure from "../editMeasure/EditMeasure";
import NewMeasure from "../newMeasure/NewMeasure";
import { Security } from "@okta/okta-react";
import { OktaAuth, toRelativeUrl } from "@okta/okta-auth-js";

export default function MeasureLanding() {
  const history = useHistory();
  const [oktaAuth, setOktaAuth] = useState(() => {
    return new OktaAuth({
      issuer: "https://dev-18092578.okta.com/oauth2/default",
      clientId: "0oa2fqtaz95fqJqbf5d7",
      redirectUri: "http://localhost:9000/login/callback",
    });
  });

  return !!oktaAuth ? (
    <div data-testid="browser-router">
      <BrowserRouter>
        <Security
          oktaAuth={oktaAuth}
          restoreOriginalUri={(_oktaAuth, originalUri) => {
            history.replace(toRelativeUrl(originalUri, window.location.origin));
          }}
        >
          <Switch>
            <Route exact path="/measure/create" component={CreateNewMeasure} />
            <Route path="/measure/:id/edit" component={EditMeasure} />
            <Route exact path="/measure" component={NewMeasure} />
          </Switch>
        </Security>
      </BrowserRouter>
    </div>
  ) : (
    <div>Loading...</div>
  );
}
