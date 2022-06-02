import { join } from "path";

/**
 * Map to convert request value of recruitmentStatus to corresponding Lungevity value
 */
 export const recruitmentStatusMap = new Map<string, string>([
    ["Recruiting","Recruiting"],
    ["Not Yet Recruiting","Not Yet Recruiting"],
    ["Expanded Access: Available","Available"],
  ]);
  
  /**
   * Map to convert request value of stydyType to corresponding Lungevity value
   */
  export const studyTypeMap = new Map<string, string>([
    ["Interventional","Intr"],
    ["Observational","Obsr"],
    ["Patient Registries","PReg"],
    ["Expanded Access: Available","Expn"],
  ]);
  
  export const phaseCodeMap = new Map<string, number>([
    ["early-phase-1",4],
    ["phase-0",4],
    ["phase-1",0],
    ["phase-2",1],
    ["phase-3",2],
    ["phase-4",3],
  ]);
  
  
  export const phaseDisplayMap = new Map<string, string>([
    ["Early Phase 1","early-phase-1"],
    ["Phase 0","phase-0"],
    ["Phase 1","phase-1"],
    ["Phase 2","phase-2"],
    ["Phase 3","phase-3"],
    ["Phase 4","phase-4"],
  ]);

  /**
   * Permissible string to display  in error reposnse
   */
  export const studyTypePermissibleString: string = Array.from(studyTypeMap.keys()).join(", "); 
  export var recruitmentStatusPermissibleString: string = Array.from(recruitmentStatusMap.keys()).join(", ");
  export var phasePermissibleString: string = Array.from(phaseCodeMap.keys()).join(", "); 

  /**
   * Utility method to check null string amd return empty string
   * @param s 
   * @returns 
   */
  export function checkNullString(s:string) : string {
    return s?s:"";
  }