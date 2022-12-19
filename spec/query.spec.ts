/**
 * This provides an example of how to test the query to ensure it produces
 * results.
 */

import {
  ClinicalTrialsGovService,
  ResearchStudy,
  SearchSet
} from "clinical-trial-matching-service";
import nock from "nock";
import { Bundle, BundleEntry } from "fhir/r4";
import { getEmptyStringIfNull, phasePermissibleString } from "../src/constants";
import { isLungevityResponse, LungevityResponse } from "../src/lungevity-types";
import createClinicalTrialLookup, {
  APIQuery, convertResponseToSearchSet, isQueryErrorResponse, isQueryResponse, isQueryTrial, QueryResponse
} from "../src/query";

describe("createClinicalTrialLookup()", () => {
  it("creates a function if configured properly", () => {
    expect(
      typeof createClinicalTrialLookup({
        endpoint: "http://www.example.com/",
        auth_token: "token",
      })
    ).toEqual("function");
  });

  // This test just makes sure an error is properly raised for invalid
  // configurations
  it("raises an error if configuration is missing", () => {
    expect(() => {
      createClinicalTrialLookup({});
    }).toThrowError("Missing endpoint in configuration");
    expect(() => {
      createClinicalTrialLookup({ endpoint: "http://www.example.com/" });
    }).toThrowError("Missing auth_token in configuration");
  });
});

describe("isQueryTrial()", () => {
  it("returns false for non-trial objects", () => {
    expect(isQueryTrial(null)).toBeFalse();
    expect(isQueryTrial(true)).toBeFalse();
    expect(isQueryTrial("string")).toBeFalse();
    expect(isQueryTrial(42)).toBeFalse();
    expect(isQueryTrial({ invalid: true })).toBeFalse();
  });

  it("returns true on a matching object", () => {
    expect(isQueryTrial({ name: "Hello" })).toBeTrue();
  });
});

describe("isQueryResponse()", () => {
  it("returns false for non-response objects", () => {
    expect(isQueryResponse(null)).toBeFalse();
    expect(isQueryResponse(true)).toBeFalse();
    expect(isQueryResponse("string")).toBeFalse();
    expect(isQueryResponse(42)).toBeFalse();
    expect(isQueryResponse({ invalid: true })).toBeFalse();
  });

  it("returns true on a matching object", () => {
    expect(isQueryResponse({ results: [] })).toBeTrue();
    expect(isQueryResponse({ results: [{ brief_title: "Trial" }] })).toBeTrue();
    // Currently this is true. It may make sense to make it false, but for now,
    // a single invalid trial does not invalidate the array.
    expect(isQueryResponse({ results: [{ invalid: true }] })).toBeTrue();
  });
});

describe("isQueryErrorResponse()", () => {
  it("returns false for non-response objects", () => {
    expect(isQueryErrorResponse(null)).toBeFalse();
    expect(isQueryErrorResponse(true)).toBeFalse();
    expect(isQueryErrorResponse("string")).toBeFalse();
    expect(isQueryErrorResponse(42)).toBeFalse();
    expect(isQueryErrorResponse({ invalid: true })).toBeFalse();
  });

  it("returns true on a matching object", () => {
    expect(isQueryErrorResponse({ error: "oops" })).toBeTrue();
  });
});

describe("isLungevityResponse()", () => {
  it("returns false for non-lungevity-response objects", () => {
    expect(isLungevityResponse(null)).toBeFalse();
    expect(isLungevityResponse(true)).toBeFalse();
    expect(isLungevityResponse("string")).toBeFalse();
    expect(isLungevityResponse(42)).toBeFalse();
    expect(isLungevityResponse({ invalid: true })).toBeFalse();
    expect(isLungevityResponse({ results: [] })).toBeFalse();
    expect(isLungevityResponse({ brief_title: 123})).toBeFalse();
  });

  it("returns true on a matching lungevity object", () => {
    expect(isLungevityResponse({ brief_title: "test","id_info":{"org_study_id":665895, nct_id:"NCA000123"},"status":"active" })).toBeTrue();
    expect(isLungevityResponse({ brief_title: "test","id_info":{"org_study_id":665895, nct_id:"NCA000123"},"status":"active", invalid:true })).toBeTrue();
  });
});

describe("getEmptyStringIfNull()", () => {
  it("returns empty string in case of null", () => {
    expect(getEmptyStringIfNull(null)).toEqual("");
    expect(getEmptyStringIfNull("string")).toEqual("string");
  });
});

describe("APIQuery", () => {
  it("extracts passed properties", () => {
    const query = new APIQuery({
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          resource: {
            resourceType: "Parameters",
            parameter: [
              {
                name: "zipCode",
                valueString: "01730",
              },
              {
                name: "travelRadius",
                valueString: "25",
              },
              {
                "name": "condition",
                "valueString": "Non-Small Cell Lung Cancer"
            },
            {
                "name": "studyType",
                "valueString": "Interventional"
            },
              {
                name: "phase",
                valueString: "phase-1",
              },
              {
                name: "recruitmentStatus",
                valueString: "Recruiting",
              },
            ],
          },
        },
      ],
    });
    expect(query.condition).toEqual("Non-Small Cell Lung Cancer");
    expect(query.studyType).toEqual("Intr");
    expect(query.phase).toEqual("0");
    expect(query.recruitmentStatus).toEqual("Recruiting");
  });

  it("gathers conditions", () => {
    const query = new APIQuery({
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          resource: {
            resourceType: "Condition",
            subject: {},
            code: {
              coding: [
                {
                  system: "http://www.example.com/",
                  code: "test",
                },
              ],
            },
          },
        },
        {
          resource: {
            resourceType: "Condition",
            subject: {},
            code: {
              coding: [
                {
                  system: "https://www.example.com/",
                  code: "test-2",
                },
              ],
            },
          },
        },
      ],
    });
    expect(query.conditions).toEqual([
      { system: "http://www.example.com/", code: "test" },
      { system: "https://www.example.com/", code: "test-2" },
    ]);
  });

  it("converts the query to a string", () => {
    expect(
      new APIQuery({
        resourceType: "Bundle",
        type: "collection",
        entry: [
          {
            resource: {
              resourceType: "Parameters",
              parameter: [
                {
                  name: "zipCode",
                  valueString: "01730",
                },
                {
                  name: "travelRadius",
                  valueString: "25",
                },
                {
                  "name": "condition",
                  "valueString": "Non-Small Cell Lung Cancer"
                },
                {
                    "name": "studyType",
                    "valueString": "Interventional"
                },
                {
                    "name": "phase",
                    "valueString": "phase-1"
                }
              ],
            },
          },
        ],
      }).toString()
    ).toEqual(
      '?query=term:lung cancer,no_unk:Y,cntry1=NA%3AUS,cond:Non-Small Cell Lung Cancer,type:Intr,phase:0,recr:open'
    );
  });

  it("ignores unknown parameters", () => {
    // Passing in this case is simply "not raising an exception"
    new APIQuery({
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          resource: {
            resourceType: "Parameters",
            parameter: [
              {
                name: "unknown",
                valueString: "invalid",
              },
            ],
          },
        },
      ],
    });
  });

  it("ignores invalid entries", () => {
    // Passing in this case is simply "not raising an exception"
    const bundle: Bundle = {
      resourceType: "Bundle",
      type: "collection",
      entry: [],
    };
    // Force an invalid entry in
    bundle.entry?.push(({ invalid: true } as unknown) as BundleEntry);
    new APIQuery(bundle);
    // Passing is not raising an exception
  });

  it("throw eror on invalid phase value", () => {
    expect(() => {
      new APIQuery({
        resourceType: "Bundle",
        type: "collection",
        entry: [
          {
            resource: {
              resourceType: "Parameters",
              parameter: [
                {
                    "name": "phase",
                    "valueString": "phase-23"
                }
              ],
            },
          },
        ],
      }).toString()
    }).toThrowError("Invalid value of phase. Permissible values are " + phasePermissibleString);
  });

  it("throw eror on invalid studyType value", () => {
    expect(() => {
      new APIQuery({
        resourceType: "Bundle",
        type: "collection",
        entry: [
          {
            resource: {
              resourceType: "Parameters",
              parameter: [
                {
                    "name": "studyType",
                    "valueString": "1"
                }
              ],
            },
          },
        ],
      }).toString()
    }).toThrowError("Invalid value of studyType. Permissible values are |Interventional|,|Observational|,|Patient Registries|,|Expanded Access: Available|");
  });

  it("throw eror on invalid recruitmentStatus value", () => {
    expect(() => {
      new APIQuery({
        resourceType: "Bundle",
        type: "collection",
        entry: [
          {
            resource: {
              resourceType: "Parameters",
              parameter: [
                {
                    "name": "recruitmentStatus",
                    "valueString": "1"
                }
              ],
            },
          },
        ],
      }).toString()
    }).toThrowError("Invalid value of recruitmentStatus. Permissible values are |Recruiting|,|Not Yet Recruiting|,|Expanded Access: Available|");
  });
});

describe("convertResponseToSearchSet()", () => {
  it("converts trials", () => {
    return expectAsync(
      convertResponseToSearchSet({
        results: [{ brief_title: "test","id_info":{"org_study_id":665895, nct_id:"NCA000123"},"status":"active" }],
      }).then((searchSet) => {
        expect(searchSet.entry.length).toEqual(1);
        expect(searchSet.entry[0].resource).toBeInstanceOf(ResearchStudy);
        expect(
          (searchSet.entry[0].resource as ResearchStudy).status
        ).toEqual("active");
      })
    ).toBeResolved();
  });

  it("skips invalid trials", () => {
    const response: QueryResponse = {
      results: [],
    };
    // Push on an invalid object
    response.results.push(({
      invalidObject: true,
    } as unknown) as LungevityResponse);
    return expectAsync(convertResponseToSearchSet(response)).toBeResolved();
  });

  it("uses the backup service if provided", () => {
    // Note that we don't initialize the backup service so no files are created
    const backupService = new ClinicalTrialsGovService("temp");
    // Instead we install a spy that takes over "updating" the research studies
    // by doing nothing
    const spy = spyOn(backupService, "updateResearchStudies").and.callFake(
      (studies) => {
        return Promise.resolve(studies);
      }
    );
    return expectAsync(
      convertResponseToSearchSet(
        {
          results: [{ brief_title: "test","id_info":{"org_study_id":665895, nct_id:"NCA000123"},"status":"active" }],
        },
        backupService
      )
    )
      .toBeResolved()
      .then(() => {
        expect(spy).toHaveBeenCalled();
      });
  });
});

describe("ClinicalTrialLookup", () => {
  // A valid patient bundle for the matcher, passed to ensure a query is generated
  const patientBundle: Bundle = {
    resourceType: "Bundle",
    type: "batch",
    entry: [],
  };
  let matcher: (patientBundle: Bundle) => Promise<SearchSet>;
  let scope: nock.Scope;
  let mockRequest: nock.Interceptor;
  beforeEach(() => {
    // Create the matcher here. This creates a new instance each test so that
    // each test can adjust it as necessary without worrying about interfering
    // with other tests.
    matcher = createClinicalTrialLookup({
      endpoint: "https://www.example.com/endpoint",
      auth_token: "test_token",
    });
    // Create the interceptor for the mock request here as it's the same for
    // each test
    scope = nock("https://www.example.com");
    mockRequest = scope.get("/endpoint?query=term:lung cancer,no_unk:Y,cntry1=NA%3AUS,recr:open");
  });
  afterEach(() => {
    // Expect the endpoint to have been hit in these tests
    expect(nock.isDone()).toBeTrue();
  });

  it("generates a request", () => {
    mockRequest.reply(200, {results:[{ brief_title: 'test','id_info':{'org_study_id':665895},'status':'active' }]});
    return expectAsync(matcher(patientBundle)).toBeResolved();
  });

  it("rejects with an error if an error is returned by the server", () => {
    // Simulate an error response
    mockRequest.reply(500, { error: "Test error" });
    return expectAsync(matcher(patientBundle)).toBeRejectedWithError(
      "Server returned 500 Internal server error"
    );
  });

  it("rejects with an error if an HTTP error is returned by the server", () => {
    // Simulate an error response
    mockRequest.reply(500, "Internal Server Error");
    return expectAsync(matcher(patientBundle)).toBeRejectedWithError(
      "Server returned 500 Internal server error"
    );
  });

  it("rejects with an error if the response is invalid", () => {
    // Simulate a valid response with something that can't be parsed as JSON
    mockRequest.reply(200, { missingAllKnownKeys: true });
    return expectAsync(matcher(patientBundle)).toBeRejectedWithError(
      "Unable to parse response from server"
    );
  });

  it("rejects with an error if the response is not JSON", () => {
    // Simulate a valid response with something that can't be parsed as JSON
    mockRequest.reply(200, "A string that isn't JSON");
    return expectAsync(matcher(patientBundle)).toBeRejectedWithError(
      "Unable to parse response as JSON"
    );
  });

  it("rejects with an error if the request fails", () => {
    // Simulate a valid response with something that can't be parsed as JSON
    mockRequest.replyWithError("Test error");
    return expectAsync(matcher(patientBundle)).toBeRejectedWithError(
      "Test error"
    );
  });
});
