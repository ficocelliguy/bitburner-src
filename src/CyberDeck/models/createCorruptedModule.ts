import { WHRNG } from "../../Casino/RNG";
import { DeckModule, ModuleType } from "../Types";
import { getConsumableBuff, getDebuff, getEndgameBuff, getID } from "../utils/statRng";
import { getRandomSockets } from "../utils/moduleUtilities";
import { mergeBuffs } from "./createModule";


const getJunkModule = (rng: WHRNG) => {
  const oneSocket = getRandomSockets(rng, 1 );
  const twoSocket = getRandomSockets(rng, 2 );
  const modules: DeckModule[] = [
    {
      type: ModuleType.RackExtension,
      id: getID(rng),
      sockets: oneSocket,
      level: 0,
      stats: {
        extraRackSlots: 1,
      }
    },
    {
      type: ModuleType.ProcessingModule,
      id: getID(rng),
      sockets: twoSocket,
      level: 0,
      stats: {
        playerMults: {
          hacking: -0.01,
        }
      }
    },
    {
      type: ModuleType.PowerSupply,
      id: getID(rng),
      sockets: twoSocket,
      level: 0,
    },
  ]

  return modules[Math.floor(rng.random() * modules.length)];
}

const getCorruptedRackExtension = (rng: WHRNG): DeckModule => {
  const debuffs = mergeBuffs(getDebuff(8, rng), getDebuff(8, rng));
  return {
    type: ModuleType.RackExtension,
    id: getID(rng),
    sockets: getRandomSockets(rng, 1),
    level: -1,
    stats: {
      playerMults: debuffs,
    }
  };
}

const getCorruptedSkillChip = (rng: WHRNG): DeckModule => {
  const buffs = {
    ...getConsumableBuff(8, rng),
    ...getConsumableBuff(8, rng),
  };
  return {
    type: ModuleType.SkillChip,
    id: getID(rng),
    sockets: getRandomSockets(rng, 1),
    level: -1,
    stats: {
      consumableStats: buffs,
    },
  };
}

const getEndgameStatModule = (rng: WHRNG): DeckModule => {
  const buff = getEndgameBuff(rng);
  const debuff = getDebuff(8, rng);

  return {
    type: ModuleType.ProcessingModule,
    id: getID(rng),
    sockets: getRandomSockets(rng, 1),
    level: -1,
    stats: {
      playerMults: debuff,
      endgameStats: buff,
    }
  }
}


//TODO: mod with extra large buff and two debuffs

// TODO: high-level regular mod

// TODO: mod with no debuff