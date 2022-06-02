import { join } from "path";

/**
 *  Map to convert parameter.valueString of 'recruitmentStatus' to corresponding Lungevity value
 */
 export const recruitmentStatusMap = new Map<string, string>([
    ["Recruiting","Recruiting"],
    ["Not Yet Recruiting","Not Yet Recruiting"],
    ["Expanded Access: Available","Available"],
  ]);
  
  /**
   * Map to convert parameter.valueString of 'studyType' to corresponding Lungevity value
   */
  export const studyTypeMap = new Map<string, string>([
    ["Interventional","Intr"],
    ["Observational","Obsr"],
    ["Patient Registries","PReg"],
    ["Expanded Access: Available","Expn"],
  ]);
  
  /**
   * Map to convert parameter.valueString of 'phase' to corresponding Lungevity value
   */
  export const phaseCodeMap = new Map<string, number>([
    ["early-phase-1",4],
    ["phase-0",4],
    ["phase-1",0],
    ["phase-2",1],
    ["phase-3",2],
    ["phase-4",3],
  ]);
  
  /**
   * Map to convert Lungevity display value of 'phase' to corresponding code
   */
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
  export const studyTypePermissibleString: string = `|${Array.from(studyTypeMap.keys()).join("|,|")}|`; 
  export var recruitmentStatusPermissibleString: string = `|${Array.from(recruitmentStatusMap.keys()).join("|,|")}|`;
  export var phasePermissibleString: string = `|${Array.from(phaseCodeMap.keys()).join("|,|")}|`; 

  /**
   * Utility method to check null string amd return empty string
   * @param str 
   * @returns 
   */
  export function checkNullString(str:string) : string {
    return str?str:"";
  }