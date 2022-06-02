/**
 * Handles conversion of patient bundle data to a proper request for matching service apis.
 * Retrieves api response as promise to be used in conversion to fhir ResearchStudy
 */
import https from "https";
import { IncomingMessage } from "http";
import {recruitmentStatusMap, studyTypeMap, phaseCodeMap, phaseDisplayMap, 
  recruitmentStatusPermissibleString, studyTypePermissibleString, phasePermissibleString} from "./constants"; 
import {
  fhir,
  ClinicalTrialsGovService,
  ServiceConfiguration,
  ResearchStudy,
  SearchSet,
  updateResearchStudyWithClinicalStudy,
  ClinicalStudy,
  BasicHttpError,
} from "clinical-trial-matching-service";
import convertToResearchStudy from "./researchstudy-mapping";

export interface QueryConfiguration extends ServiceConfiguration {
  endpoint?: string;
  auth_token?: string;
}

/**
 * Slight change to the default way research studies are updated.
 * @param researchStudy the base research study
 * @param clinicalStudy the clinical study data from ClinicalTrials.gov
 */
 export function updateResearchStudy(researchStudy: fhir.ResearchStudy, clinicalStudy: ClinicalStudy): void {
  if (researchStudy.description) {
    const briefSummary = clinicalStudy.brief_summary;
    if (briefSummary) {
      researchStudy.description += '\n\n' + briefSummary[0].textblock[0];
    }
  }
  updateResearchStudyWithClinicalStudy(researchStudy, clinicalStudy);
}

/**
 * Create a new matching function using the given configuration.
 *
 * @param configuration the configuration to use to configure the matcher
 * @param ctgService an optional ClinicalTrialGovService which can be used to
 *     update the returned trials with additional information pulled from
 *     ClinicalTrials.gov
 */
export function createClinicalTrialLookup(
  configuration: QueryConfiguration,
  ctgService?: ClinicalTrialsGovService
): (patientBundle: fhir.Bundle) => Promise<SearchSet> {
  // Raise errors on missing configuration
  if (typeof configuration.endpoint !== "string") {
    throw new Error("Missing endpoint in configuration");
  }
  if (typeof configuration.auth_token !== "string") {
    throw new Error("Missing auth_token in configuration");
  }
  const endpoint = configuration.endpoint;
  const bearerToken = configuration.auth_token;
  return function getMatchingClinicalTrials(
    patientBundle: fhir.Bundle
  ): Promise<SearchSet> {
    // Create the query based on the patient bundle:
    const query = new APIQuery(patientBundle);
    // And send the query to the server
    return sendQuery(endpoint, query, bearerToken, ctgService);
  };
}

export default createClinicalTrialLookup;

// Generic type for the request data being sent to the server. Fill this out
// with a more complete type.
type QueryRequest = string;

/**
 * Generic type for the trials returned.
 *
 * TO-DO: Fill this out to match your implementation
 */
export interface QueryTrial extends Record<string, any> {
  brief_title: string;
}

/**
 * Type guard to determine if an object is a valid QueryTrial.
 * @param o the object to determine if it is a QueryTrial
 */
export function isQueryTrial(o: any): o is QueryTrial {
  if (typeof o !== "object" || o === null) return false;
  // TO-DO: Make this match your format.
  return typeof (o as QueryTrial).brief_title === "string";
}

// Generic type for the response data being received from the server.
export interface QueryResponse extends Record<string, any> {
  results: QueryTrial[];
}

/**
 * Type guard to determine if an object is a valid QueryResponse.
 * @param o the object to determine if it is a QueryResponse
 */
export function isQueryResponse(o: any): o is QueryResponse {
  if (typeof o !== "object" || o === null) return false;

  // Note that the following DOES NOT check the array to make sure every object
  // within it is valid. Currently this is done later in the process. This
  // makes this type guard or the QueryResponse type sort of invalid. However,
  // the assumption is that a single unparsable trial should not cause the
  // entire response to be thrown away.
  return Array.isArray((o as QueryResponse).results);
}

export interface QueryErrorResponse extends Record<string, unknown> {
  error: string;
}

/**
 * Type guard to determine if an object is a QueryErrorResponse.
 * @param o the object to determine if it is a QueryErrorResponse
 */
export function isQueryErrorResponse(o: unknown): o is QueryErrorResponse {
  if (typeof o !== "object" || o === null) return false;
  return typeof (o as QueryErrorResponse).error === "string";
}

// Generic type that represents a JSON object - that is, an object parsed from
// JSON. Note that the return value from JSON.parse is an any, this does not
// represent that.
type JsonObject = Record<string, unknown>;

// API RESPONSE SECTION
export class APIError extends Error {
  constructor(
    message: string,
    public result: IncomingMessage,
    public body: string
  ) {
    super(message);
  }
}

/**
 * This class represents a query, built based on values from within the patient
 * bundle.
 * TO-DO
 * Finish making an object for storing the various parameters necessary for the api query
 * based on a patient bundle.
 * Reference https://github.com/mcode/clinical-trial-matching-engine/wiki to see patientBundle Structures
 */
export class APIQuery {
  // The following example fields are defined by default within the matching UI
  /**
   * US zip code
   */
  zipCode: string;
  /**
   * Distance in miles a user has indicated they're willing to travel
   */
  travelRadius: number;
  /**
   * A FHIR ResearchStudy phase
   */
  phase: number;
  /**
   * A FHIR ResearchStudy status
   */
  recruitmentStatus: string;
  /**
   * Lungevity Study Condition
   */
  condition: string;
  /**
   * Lungevity Study Condition - free text search string
   */
   freeText: string;
   /**
   * Lungevity Study Condition - Mutation/Translocation/Alteration String
   */
  term: string;
  /**
   * Lungevity Study Type
   */
   studyType: string;
  /**
   * Lungevity Study Gender
   */
   gender: string;
  /**
   * A set of conditions.
   */
  conditions: { code: string; system: string }[] = [];
  // TO-DO Add any additional fields which need to be extracted from the bundle to construct query
  
   /**
   * Create a new query object.
   * @param patientBundle the patient bundle to use for field values
   */
  constructor(patientBundle: fhir.Bundle) {
    for (const entry of patientBundle.entry) {
      if (!("resource" in entry)) {
        // Skip bad entries
        continue;
      }
      const resource = entry.resource;
      // Pull out search parameters
      if (resource.resourceType === "Parameters") {
        for (const parameter of resource.parameter) {
          if(parameter.name == "condition") {
            this.condition = parameter.valueString;
          }
          if(parameter.name == "term") {
            this.term = parameter.valueString;
          }
          if(parameter.name == "gender") {
            this.gender = parameter.valueString;   
          }
          if(parameter.name == "studyType") {
            const val:string = studyTypeMap.get(parameter.valueString);
            if(val){
              this.studyType = val;
            } else {
              
              throw new BasicHttpError(
                "Invalid value of studyType. Permissible values are "+studyTypePermissibleString,
              400);
            }
            
          }

          if(parameter.name == "phase") {
            const val:number = phaseCodeMap.get(parameter.valueString);
            if(val){
              this.phase = val;
            } else{
              
              throw new BasicHttpError(
                "Invalid value of phase. Permissible values are "+phasePermissibleString,
              400);
            }
            
          }

          if(parameter.name == "recruitmentStatus") {
            const val:string = recruitmentStatusMap.get(parameter.valueString);
            if(val){
              this.recruitmentStatus = val;
            } else {
              throw new BasicHttpError(
                "Invalid value of recruitmentStatus. Permissible values are "+recruitmentStatusPermissibleString,
              400);
            }
            
          }
        }
      }
      // Gather all conditions the patient has
      if (resource.resourceType === "Condition") {
        this.addCondition(resource);
      }
      // TO-DO Extract any additional resources that you defined
    }
  }

  /**
   * Handle condition data. The default implementation does nothing, your
   * implementation may pull out specific data.
   * @param condition the condition to add
   */
  addCondition(condition: fhir.Condition): void {
    for (const coding of condition.code.coding) {
      this.conditions.push(coding);
    }
  }

  /**
   * Create the information sent to the server.
   * @return {string} the api query
   */
  toQuery(): QueryRequest {
    var searchString: string = "?query=term:lung cancer,no_unk:Y,cntry1=NA%3AUS";
    //{ condition :",cond:", gender :",gndr:", studyType :",type:", phase :",phase:", recruitmentStatus :",recr:"}
    let cond = ",cond:";
   
    if(this.condition) {
      cond += this.condition
    }
    if(this.freeText) {
      if(cond != ",cond:")
        cond += "%2C" + this.freeText;
      else
        cond += this.freeText;
    }
    if(this.term) {
      if(cond != ",cond:")
        cond += "%2C" + this.term;
      else
        cond += this.term;
    }
    if(cond != ",cond:"){
      searchString = searchString + cond;
    }
    if(this.gender){
      searchString = searchString + ",gndr:" +  this.gender;
    }
    if(this.studyType){
      searchString = searchString + ",type:" + this.studyType;
    }
    if(this.phase){
      searchString = searchString +  ",phase:" + this.phase;
    }
    if(this.recruitmentStatus){
      searchString = searchString + ",recr:" + this.recruitmentStatus;
    } else {
      searchString = searchString + ",recr:open";
    }
    

    return searchString;
  }

  toString(): string {
    // Note that if toQuery is no longer a string, this will no longer work
    return this.toQuery();
  }
}

/**
 * Convert a query response into a search set.
 *
 * @param response the response object
 * @param ctgService an optional ClinicalTrialGovService which can be used to
 *     update the returned trials with additional information pulled from
 *     ClinicalTrials.gov
 */
export function convertResponseToSearchSet(
  response: QueryResponse,
  ctgService?: ClinicalTrialsGovService
): Promise<SearchSet> {
  // Our final response
  const studies: ResearchStudy[] = [];
  // For generating IDs
  let id = 0;
  for (const trial of response.results) {
    if (isQueryTrial(trial)) {
      studies.push(convertToResearchStudy(trial, id++));
    } else {
      // This trial could not be understood. It can be ignored if that should
      // happen or raised/logged as an error.
      console.error("Unable to parse trial from server: %o", trial);
    }
  }
  if (ctgService) {
    // If given a backup service, use it
    return ctgService.updateResearchStudies(studies).then(() => {
      return new SearchSet(studies);
    });
  } else {
    // Otherwise, resolve immediately
    return Promise.resolve(new SearchSet(studies));
  }
}

/**
 * Helper function to handle actually sending the query.
 *
 * @param endpoint the URL of the end point to send the query to
 * @param query the query to send
 * @param bearerToken the bearer token to send along with the query to
 *     authenticate with the service
 * @param ctgService an optional ClinicalTrialGovService which can be used to
 *     update the returned trials with additional information pulled from
 *     ClinicalTrials.gov
 */
function sendQuery(
  endpoint: string,
  query: APIQuery,
  bearerToken: string,
  ctgService?: ClinicalTrialsGovService
): Promise<SearchSet> {
  return new Promise((resolve, reject) => {
    let body = "";
    if(query) {
      body = query.toQuery();
    }
    console.log(endpoint+body); 
    const request = https.request(
      endpoint+body,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          Authorization: "Bearer " + bearerToken,
        },
      },
      (result) => {
        let responseBody = "";
        result.on("data", (chunk) => {
          responseBody += chunk;
        });
        result.on("end", () => {
          console.log("Complete");
          if (result.statusCode === 200) {
            let json: unknown;
            try {
              json = JSON.parse(responseBody) as unknown;
            } catch (ex) {
              reject(
                new APIError(
                  "Unable to parse response as JSON",
                  result,
                  responseBody
                )
              );
            }
            if (isQueryResponse(json)) {
              resolve(convertResponseToSearchSet(json, ctgService));
            } else if (isQueryErrorResponse(json)) {
              reject(
                new APIError(
                  `Error from service: ${json.error}`,
                  result,
                  responseBody
                )
              );
            } else {
              reject(new Error("Unable to parse response from server"));
            }
          } else {
            reject(
              new APIError(
                `Server returned ${result.statusCode} ${result.statusMessage}`,
                result,
                responseBody
              )
            );
          }
        });
      }
    );

    request.on("error", (error) => reject(error));
    request.end();
  });
}
