import startServer from "../src/server";
import { Server } from "http";
import ClinicalTrialMatchingService from "clinical-trial-matching-service";

describe("startServer()", () => {
  beforeAll(() => {
    // Set the CTGov backup service to use a memory DB, overriding the .env config
    process.env.CTGOV_CACHE_FILE = ':memory:';
  });
  beforeEach(() => {
    // Don't actually want to start the server listening, so spy on the
    // prototype to prevent that from happening
    spyOn(ClinicalTrialMatchingService.prototype, "listen").and.callFake(() => {
      // Note: null return works here because the result of service is never
      // actually used in the "real" function
      return Promise.resolve(null as unknown as Server);
    });
  });

  it("starts the server", () => {
    return expectAsync(startServer()).toBeResolved();
  });

  it("overrides the configuration", () => {
    // Basically make sure we get our configuration values back out
    return expectAsync(
      startServer({
        endpoint: "https://www.example.com/endpoint",
        auth_token: "fake",
        host: "127.0.0.1",
        port: 0,
      }).then((service) => {
        expect(service.host).toEqual("127.0.0.1");
        expect(service.port).toEqual(0);
      })
    ).toBeResolved();
  });
});
