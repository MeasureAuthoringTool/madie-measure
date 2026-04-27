import { useState, useEffect } from "react";
// These functions are listed so that they can be referenced in jest files since jest cannot see browser.
// some functions are copy pasted from the source since their side effects are required for tests.
export function useKeyPress(targetKey) {
  // State for keeping track of whether key is pressed
  const [keyPressed, setKeyPressed] = useState(false);

  // If pressed key is our target key then set to true
  function downHandler({ key }) {
    if (key === targetKey) {
      setKeyPressed(true);
    }
  }

  // If released key is our target key then set to false
  const upHandler = ({ key }) => {
    if (key === targetKey) {
      setKeyPressed(false);
    }
  };

  // Add event listeners
  useEffect(() => {
    window.addEventListener("keydown", downHandler);
    window.addEventListener("keyup", upHandler);
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array ensures that effect is only run on mount and unmount

  return keyPressed;
}

export const useOktaTokens = (storageKey = "okta-token-storage") => {
  return {
    getAccessToken: () => "test-token",
    getAccessTokenObj: () => {},
    getUserName: () => "test-fake-user@email.com", //#nosec
    getIdToken: () => "test-id-token",
    getIdTokenObj: () => {},
  };
};

export function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }

      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

export const routeHandlerStore = {
  initialState: { canTravel: true, pendingRoute: "" },
  state: { canTravel: true, pendingRoute: "" },
  subscribe: () => null, // needs to return an object with key subscribe
  unsubscribe: () => null,
};

// Check if user can edit a measure
export const checkUserCanEdit = (
  owner: string,
  sharedWith: string[] = []
): boolean => {
  const username = "test-fake-user@email.com"; //#nosec
  return owner === username || sharedWith.includes(username);
};

// Check if user can delete a measure
export const checkUserCanDelete = (owner: string): boolean => {
  const username = "test-fake-user@email.com"; //#nosec
  return owner === username;
};

// Mock for admin transfer enabled check
export const useIsAdminTransferEnabled = () => false;

// Mock userRolesStore
export const userRolesStore = {
  getState: () => ({ roles: [], isAdmin: false }),
  updateUserRoles: () => {},
  subscribe: () => ({ unsubscribe: () => {} }),
};

// Mock useUserRoles hook
export const useUserRoles = () => ({ roles: [], isAdmin: false });

export const getOidFromString = (
  oidString: string,
  dataModel: string
): string => {
  if (dataModel === "QDM") {
    return oidString?.split("urn:oid:")[1];
  }
  return oidString?.split("ValueSet/")[1];
};
