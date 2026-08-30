import { WHRNG } from "../../Casino/RNG";
import { DeckMod, ModType } from "../Types";
import { getConsumableBuff, getDebuff, getEndgameBuff, getEndgameStatDebuff, getID, getLevel } from "../utils/statRng";
import { getRandomSockets } from "../utils/moduleUtilities";
import { createProcessingModule, createUplink } from "./createModule";
import { CyberdeckState } from "./CyberdeckState";
import { Player } from "@player";
import { mergeBuffs } from "../utils/modStatsUtils";

export function createCorruptedModule(rng: WHRNG): DeckMod {
  // TODO-fico: reduce this probability after testing
  if (Player.sourceFiles.get(1) && rng.random() < 0.1) {
    return getEndgameStatModule(rng);
  }

  const roll = rng.random();
  if (roll < 0.04) {
    return getCorruptedRackExtension(rng);
  }
  if (roll < 0.09) {
    return getCorruptedSkillChip(rng);
  }

  if (roll < 0.15) {
    return createUplink(getLevel(rng), rng, false);
  }

  if (roll < 0.21) {
    return createProcessingModule(getLevel(rng), rng, false);
  }

  if (roll < 0.27) {
    const module = createProcessingModule(getLevel(rng, 2), rng, true, 1.5, 2);
    module.stats.playerMults ??= mergeBuffs(getDebuff(8, rng), module.stats?.playerMults ?? {});
    module.level = -1;
    return module;
  }

  if (roll < 0.33) {
    const module = createUplink(getLevel(rng, 2), rng, true, 1.5, 2);
    module.stats.playerMults ??= mergeBuffs(getDebuff(8, rng), module.stats?.playerMults ?? {});
    module.level = -1;
    return module;
  }

  if (roll < 0.39) {
    return createProcessingModule(getLevel(rng, 2), rng);
  }
  if (roll < 0.45) {
    return createUplink(getLevel(rng, 2), rng);
  }

  // TODO-fico: remove this after first rounds of testing
  if (roll < 0.6) {
    return createCorruptedModule(rng);
  }

  return getJunkModule(rng);
}

export const getJunkModule = (rng: WHRNG) => {
  const oneSocket = getRandomSockets(rng, 1);
  const twoSocket = getRandomSockets(rng, 2);
  const modules: DeckMod[] = [
    {
      type: ModType.RackExtension,
      id: getID(rng),
      sockets: oneSocket,
      level: 0,
      stats: {
        extraRackSlots: 1,
      },
    },
    {
      type: ModType.ProcessingMod,
      id: getID(rng),
      sockets: twoSocket,
      level: 0,
      stats: {
        playerMults: getDebuff(1, rng),
      },
    },
    {
      type: ModType.Uplink,
      id: getID(rng),
      sockets: twoSocket,
      level: 0,
      stats: {
        playerMults: getDebuff(1, rng),
      },
    },
    {
      type: ModType.PowerSupply,
      id: getID(rng),
      sockets: twoSocket,
      level: 0,
      stats: {},
    },
  ];

  return modules[Math.floor(rng.random() * modules.length)];
};

const getCorruptedRackExtension = (rng: WHRNG): DeckMod => {
  const debuffs = mergeBuffs(getDebuff(8, rng), getDebuff(8, rng));
  const extraSlots = Math.floor(rng.random() * 3) + 2;
  return {
    type: ModType.RackExtension,
    id: getID(rng),
    sockets: getRandomSockets(rng, 1),
    level: -1,
    stats: {
      playerMults: debuffs,
      extraRackSlots: extraSlots,
    },
  };
};

const getCorruptedSkillChip = (rng: WHRNG): DeckMod => {
  const buffs = mergeBuffs(getConsumableBuff(8, rng), getConsumableBuff(8, rng));
  return {
    type: ModType.SkillChip,
    id: getID(rng),
    sockets: getRandomSockets(rng, 1),
    level: -1,
    stats: {
      consumableStats: buffs,
    },
  };
};

const getEndgameStatModule = (rng: WHRNG): DeckMod => {
  const level = getLevel(rng, CyberdeckState.netrunningLevel + 2);
  const buff = getEndgameBuff(level, rng);
  const standardDebuff = getDebuff(CyberdeckState.netrunningLevel, rng);
  const endgameDebuff = getEndgameStatDebuff(CyberdeckState.netrunningLevel / 2, rng);
  const effects = mergeBuffs(buff, endgameDebuff);

  return {
    type: ModType.ProcessingMod,
    id: getID(rng),
    sockets: getRandomSockets(rng, 1),
    level: level,
    stats: {
      playerMults: standardDebuff,
      endgameStats: effects,
    },
  };
};
