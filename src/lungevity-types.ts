/**
 * Lungeivity API Response object type definitition
 * 
 */
export interface LungevityResponse extends Record<string, unknown> {
    overall_contact_backup?: OverallContact;
    last_update_submitted?: string;
    completion_date?: CompletionDate;
    responsible_party?: ResponsibleParty;
    detailed_description?: BriefSummary;
    has_expanded_access?: string;
    study_first_submitted?: string;
    id?: string;
    intervention?: Intervention[];
    study_first_posted?: CompletionDate;
    study_design_info?: StudyDesignInfo;
    source?: string;
    eligibility?: Eligibility;
    primary_completion_date?: CompletionDate;
    last_injected?: Date;
    location?: Location[];
    number_of_arms?: number;
    last_update_posted?: CompletionDate;
    start_date?: StartDate;
    id_info?: IDInfo;
    study_type?: string;
    arm_group?: ArmGroup[];
    sponsors?: Sponsors;
    secondary_outcome?: Outcome[];
    overall_status?: string;
    primary_outcome?: Outcome[];
    verification_date?: DateInfo;
    phase?: string;
    firstreceived_date?: DateInfo;
    condition?: string[];
    location_countries?: LocationCountries;
    keyword?: string[];
    condition_browse?: TermBrowse;
    enrollment?: Enrollment;
    last_update_submitted_qc?: string;
    official_title?: string;
    intervention_browse?: TermBrowse;
    study_first_submitted_qc?: string;
    required_header?: RequiredHeader;
    overall_contact?: OverallContact;
    brief_title: string;
    overall_official?: OverallOfficial[];
    brief_summary?: BriefSummary;
    oversight_info?: OversightInfo;
    lastchanged_date?: DateInfo;
}

export interface ArmGroup {
    description: string;
    arm_group_label: string;
    arm_group_type: string;
}

export interface BriefSummary {
    textblock: string;
}

export interface CompletionDate {
    attributes: Attributes;
    value: string;
}

export interface Attributes {
    type: string;
}

export interface TermBrowse {
    mesh_term: string[];
}

export interface Eligibility {
    healthy_volunteers: string;
    gender: string;
    minimum_age: string;
    maximum_age: string;
    criteria: BriefSummary;
}

export interface Enrollment {
    attributes: Attributes;
    value: number;
}

export interface DateInfo {
    value: string;
}

export interface IDInfo {
    org_study_id: number;
    nct_id: string;
}

export interface Intervention {
    intervention_name: string;
    other_name?: string[];
    description: string;
    arm_group_label: string[];
    intervention_type: string;
}

export interface Location {
    status: string;
    contact_backup: OverallContact;
    facility: Facility;
    investigator: Investigator[];
    contact: OverallContact;
    geodata: Geodata;
}

export interface OverallContact {
    phone: string;
    last_name: string;
    email: string;
}

export interface Facility {
    name: string;
    address: Address;
}

export interface Address {
    city: string;
    state: string;
    zip: string;
    country: string;
}

export interface Geodata {
    latitude: number;
    formatted: string;
    longitude: number;
    original: string;
}

export interface Investigator {
    last_name: string;
    role: string;
}

export interface LocationCountries {
    country: string[];
}

export interface OverallOfficial {
    affiliation: string;
    last_name: string;
    role: string;
}

export interface OversightInfo {
    has_dmc: string;
}

export interface Outcome {
    time_frame: string;
    description?: string;
    measure: string;
}

export interface RequiredHeader {
    url: string;
    link_text: string;
}

export interface ResponsibleParty {
    responsible_party_type: string;
}

export interface Sponsors {
    lead_sponsor: LeadSponsor;
}

export interface LeadSponsor {
    agency: string;
    agency_class: string;
}

export interface StartDate {
    value: DateInfo;
}

export interface StudyDesignInfo {
    primary_purpose: string;
    masking: string;
    intervention_model: string;
}

/**
 * Type guard to determine if an object is a valid LungevityResponse.
 * @param o the object to determine if it is a LungevityResponse
 * @returns boolean
 */
export function isLungevityResponse(o: unknown): boolean {
    if (typeof o !== "object" || o === null) return false;
    return typeof (o as LungevityResponse).brief_title === "string";
}
