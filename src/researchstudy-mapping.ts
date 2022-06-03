/**
 * This module exports a function for mapping a trial in the format returned by
 * the underlying service to the FHIR ResearchStudy type.
 */

import { fhir, ResearchStudy } from 'clinical-trial-matching-service';
import { Address, Location } from 'clinical-trial-matching-service/dist/fhir-types';
import { checkNullString, phaseDisplayMap } from "./constants";
import { QueryTrial } from './query';

export function convertToResearchStudy(lungResponse: QueryTrial, id: number): ResearchStudy {
  try {
    // The clinical trial ID is required as it's used to look up the search study
    const result = new ResearchStudy(lungResponse.id_info?lungResponse.id_info.org_study_id:id);
    result.status="active";
    if (lungResponse.brief_title) {
      result.title = lungResponse.brief_title;
    }
    result.identifier = [{ use: 'official', system: 'http://clinicaltrials.gov', value: lungResponse.id_info.nct_id }];

    if (lungResponse.phase) {
      result.phase = {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/research-study-phase',
            code: phaseDisplayMap.get(lungResponse.phase),
            display: lungResponse.phase
          }
        ],
        text: lungResponse.phase
      };
    }
    if (lungResponse.keyword) {
      result.keyword = [];
      for (const key of lungResponse.keyword) {
        result.keyword.push({ text: key });
      }
    }
    if (lungResponse.overall_contact) {
      result.addContact(checkNullString(lungResponse.overall_contact.last_name), checkNullString(lungResponse.overall_contact.phone), checkNullString(lungResponse.overall_contact.email));
    }
    if (lungResponse.detailed_description && lungResponse.detailed_description.textblock) {
      // If there is a purpose and whoIsThisFor, use that, otherwise leave the
      // description blank and allow the default CTs.gov service fill it in
      result.description = lungResponse.detailed_description.textblock;
    }
    if (lungResponse.arm_group) {
      result.arm = [];
      for (const a of lungResponse.arm_group) {
        const codeable: fhir.CodeableConcept = {};
        codeable.text = checkNullString(a.arm_group_type);
        result.arm.push({ type: codeable, name: checkNullString(a.arm_group_label), description: checkNullString(a.description) });
      }
    }
    if (lungResponse.sponsors) {
      result.sponsor = result.addContainedResource({ resourceType: 'Organization', id: 'org' + result.id, name: checkNullString(lungResponse.sponsors.agency) });
    }
    if (lungResponse.location_countries && lungResponse.location_countries.country) {
      result.location = [];
      for (const c of lungResponse.location_countries.country) {
        result.location.push({ text: c });
      }
    }
    if (lungResponse.location && lungResponse.location[0] && lungResponse.location[0].investigator) {
      for (const pi of lungResponse.location[0].investigator) {
        if (pi.role == "Principal Investigator") {
          result.principalInvestigator = result.addContainedResource({ resourceType: "Practitioner", id: 'pi' + result.id, name: [{text:checkNullString(pi.last_name)}] });
        }
      }
    }
    if (lungResponse.location && lungResponse.location[0] && lungResponse.location[0].facility) {
      const facility = lungResponse.location[0].facility;
      var s = <Location>{};
      s.resourceType = "Location";
      s.id = 'loc' + result.id;
      s.name = checkNullString(facility.name);
      if (facility.address) {
        s.address = <Address>{};
        s.address.use = 'work';
        s.address.type = 'both';
        //    s.address.text?: string;
        //   s.address.line?: string[];
        s.address.city = checkNullString(facility.address.city);
        //      s.address.district?: string;
        s.address.state = checkNullString(facility.address.state);
        s.address.postalCode = checkNullString(facility.address.zip);
        s.address.country = checkNullString(facility.address.country);
        if (facility.geodata && facility.geodata.latitude && facility.geodata.longitude) {
          s.position = { latitude: facility.geodata.latitude, longitude: facility.geodata.longitude };
        }

      }
      result.addSite(s)
    }
    return result;
  } catch (error) {
      // swallow the error to process next object
      console.log(error);    
  }
}

export default convertToResearchStudy;
