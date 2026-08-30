import { PlayerBaseWork, WorkType } from "./Work";
import { CONSTANTS } from "../Constants";
import { Player } from "@player";
import { dialogBoxCreate } from "../ui/React/DialogBox";
import { gainCyberdeck } from "../CyberDeck/effects";
import { constructorsForReviver, Generic_fromJSON, Generic_toJSON, IReviverValue } from "../utils/JSONReviver";
import { CyberdeckState } from "../CyberDeck/models/CyberdeckState";
import { CyberdeckRequiredWorkUnits } from "../CyberDeck/models/constants";


export const isCreateCyberdeckWork = (w: PlayerBaseWork | null): w is CreateCyberdeckWork =>
  w !== null && w.type === WorkType.CREATE_CYBERDECK;


export class CreateCyberdeckWork extends PlayerBaseWork {
  unitCompleted: number;
  unitRate: number;

  constructor() {
    super(WorkType.CREATE_CYBERDECK, false);
    this.unitCompleted = CyberdeckState.unitCompleted;
    this.unitRate = 1;
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

  /** Serialize the current object to a JSON save state. */
  toJSON(): IReviverValue {
    return Generic_toJSON("CreateCyberdeckWork", this);
  }

  /** Initializes a CreateProgramWork object from a JSON save state. */
  static fromJSON(value: IReviverValue): CreateCyberdeckWork {
    return Generic_fromJSON(CreateCyberdeckWork, value.data);
  }

  getStatusText() {
    return ""
  }
}


constructorsForReviver.CreateCyberdeckWork = CreateCyberdeckWork;