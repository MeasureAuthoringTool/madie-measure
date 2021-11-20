import * as React from "react";
import { getServiceConfig, ServiceConfig } from "../Config";
import axios from "axios";

jest.mock("axios");

describe("Service Config Utility", () => {
  it("should retrieve the service configuration info", () => {
    expect.assertions(1);
    const config: ServiceConfig = {
      measureService: {
        baseUrl: "url",
      },
    };
    const resp = { data: config };
    // @ts-ignore
    axios.get.mockResolvedValue(resp);
    getServiceConfig().then((result) => expect(result).toEqual(config));
  });

  it("should error if the config is inaccessible", async () => {
    expect.assertions(1);
    const resp = { data: {} };
    // @ts-ignore
    axios.get.mockResolvedValue(resp);
    try {
      await getServiceConfig();
    } catch (err) {
      expect(err.message).toBe("Invalid Service Config");
    }
  });
});
