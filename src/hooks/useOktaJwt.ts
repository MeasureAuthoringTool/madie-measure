const getField = (storageKey, field) => {
  const storageStr = window.localStorage.getItem(storageKey);
  if (storageStr) {
    const storage = JSON.parse(storageStr);
    if (storage && storage[field]) {
      return storage[field];
    }
  }
  return null;
};

const getAccessTokenObj = (storageKey) => {
  return getField(storageKey, "accessToken");
};

const getAccessToken = (storageKey) => {
  return getAccessTokenObj(storageKey)?.accessToken;
};

const getIdTokenObj = (storageKey) => {
  return getField(storageKey, "idToken");
};

const getIdToken = (storageKey) => {
  return getIdTokenObj(storageKey)?.idToken;
};

export const useOktaTokens = (storageKey = "okta-token-storage") => {
  return {
    getAccessToken: () => getAccessToken(storageKey),
    getAccessTokenObj: () => getAccessTokenObj(storageKey),
    getIdToken: () => getIdToken(storageKey),
    getIdTokenObj: () => getIdTokenObj(storageKey),
  };
};
