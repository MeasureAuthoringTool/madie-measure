const mock = jest.genMockFromModule("axios");
const axios = jest.requireActual("axios");

jest.mock("axios", () => {
  return {
    create: jest.fn(() => ({
      get: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    })),
    get: jest.fn(),
  };
});

module.exports = axios;
