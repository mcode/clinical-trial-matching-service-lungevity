/**
 * This module exports a function for mapping a trial in the format returned by
 * the underlying service to the FHIR ResearchStudy type.
 */

import { ResearchStudy } from 'clinical-trial-matching-service';
import { Address, CodeableConcept, Location } from 'fhir/r4';
import { getEmptyStringIfNull, phaseDisplayMap } from "./constants";
import { LungevityResponse } from './lungevity-types';

export function convertToResearchStudy(lungResponse: LungevityResponse, id: number): ResearchStudy {
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
      result.addContact(getEmptyStringIfNull(lungResponse.overall_contact.last_name), getEmptyStringIfNull(lungResponse.overall_contact.phone), getEmptyStringIfNull(lungResponse.overall_contact.email));
    }
    if (lungResponse.detailed_description && lungResponse.detailed_description.textblock) {
      // If there is a purpose and whoIsThisFor, use that, otherwise leave the
      // description blank and allow the default CTs.gov service fill it in
      result.description = lungResponse.detailed_description.textblock;
    }
    if (lungResponse.arm_group) {
      result.arm = [];
      for (const a of lungResponse.arm_group) {
        const codeable: CodeableConcept = {};
        codeable.text = getEmptyStringIfNull(a.arm_group_type);
        result.arm.push({ type: codeable, name: getEmptyStringIfNull(a.arm_group_label), description: getEmptyStringIfNull(a.description) });
      }
    }
    if (lungResponse.sponsors) {
      result.sponsor = result.addContainedResource({ resourceType: 'Organization', id: 'org' + result.id, name: getEmptyStringIfNull(lungResponse.sponsors.lead_sponsor.agency) });
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
          result.principalInvestigator = result.addContainedResource({ resourceType: "Practitioner", id: 'pi' + result.id, name: [{text:getEmptyStringIfNull(pi.last_name)}] });
        }
      }
    }
    if (lungResponse.location && lungResponse.location[0] && lungResponse.location[0].facility) {
      const location = lungResponse.location[0];
      const facility = location.facility;
      const s = <Location>{ resourceType: "Location" };
      s.id = 'loc' + result.id;
      s.name = getEmptyStringIfNull(facility.name);
      if (facility.address) {
        s.address = <Address>{};
        s.address.use = 'work';
        s.address.type = 'both';
        //    s.address.text?: string;
        //   s.address.line?: string[];
        s.address.city = getEmptyStringIfNull(facility.address.city);
        //      s.address.district?: string;
        s.address.state = getEmptyStringIfNull(facility.address.state);
        s.address.postalCode = getEmptyStringIfNull(facility.address.zip);
        s.address.country = getEmptyStringIfNull(facility.address.country);
        if (location.geodata && location.geodata.latitude && location.geodata.longitude) {
          s.position = { latitude: location.geodata.latitude, longitude: location.geodata.longitude };
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
