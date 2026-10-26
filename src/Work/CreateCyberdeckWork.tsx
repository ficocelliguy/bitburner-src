import { PlayerBaseWork, WorkType } from "./Work";
import { CONSTANTS } from "../Constants";
import { Player } from "@player";
import { dialogBoxCreate } from "../ui/React/DialogBox";
import { gainCyberdeck } from "../CyberDeck/models/cyberdeckServer";
import { Generic_fromJSON, IReviverValue } from "../utils/JSONReviver";
import { CyberdeckState } from "../CyberDeck/models/CyberdeckState";
import { CyberdeckRequiredWorkUnits } from "../CyberDeck/models/constants";
import { makeSerializable } from "../utils/GenericReviver";

export const isCreateCyberdeckWork = (w: PlayerBaseWork | null): w is CreateCyberdeckWork =>
  w !== null && w.type === WorkType.CREATE_CYBERDECK;

export class CreateCyberdeckWork extends PlayerBaseWork {
  unitCompleted: number;
  unitRate: number;

  constructor() {
    super(WorkType.CREATE_CYBERDECK, false);
    this.unitCompleted = CyberdeckState.unitCompleted;
    this.unitRate = CONSTANTS.MilliPerCycle;
  }

  unitNeeded(): number {
    return CyberdeckRequiredWorkUnits;
  }

  process(cycles: number): boolean {
    const focusBonus = Player.focusPenalty();

    this.cyclesWorked += cycles;
    this.unitCompleted += this.unitRate * cycles * focusBonus;
    CyberdeckState.unitCompleted = this.unitCompleted;

    return this.unitCompleted >= this.unitNeeded();
  }

  finish(cancelled: boolean, suppressDialog?: boolean): void {
    if (!cancelled) {
      Player.gainIntelligenceExp(
        (CONSTANTS.IntelligenceProgramBaseExpGain * this.cyclesWorked * CONSTANTS.MilliPerCycle) / 1000,
      );

      if (!suppressDialog) {
        dialogBoxCreate(`You finished creating a custom Ono-Sendai Mk7 Cyberdeck!`);
      }
      gainCyberdeck();
    }

    this.resolveNextCompletion();
  }

  APICopy() {
    return {
      type: WorkType.CREATE_CYBERDECK as const,
      cyclesWorked: this.cyclesWorked,
      nextCompletion: this.nextCompletion,
    };
  }

  /** Custom load handling */
  static jsonReviver(value: IReviverValue): CreateCyberdeckWork {
    return Generic_fromJSON(CreateCyberdeckWork, value.data, CreateCyberdeckWork.includedKeys);
  }

  getStatusText() {
    return "Assembling cyberdeck...";
  }

  static includedKeys = makeSerializable("CompanyWork", CreateCyberdeckWork);
}
