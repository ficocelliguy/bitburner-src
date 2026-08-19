import { InternalAPI } from "../Netscript/APIWrapper";
import { Cyberdeck } from "@nsdefs";
import { CyberdeckState } from "./models/CyberdeckState";


export function NetscriptCyberdeck(): InternalAPI<Cyberdeck> {
  return {
    getComponentCounts: () => {
      return { ...CyberdeckState.components };
    }
  };
}