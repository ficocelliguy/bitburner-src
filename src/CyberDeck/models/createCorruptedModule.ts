import { WHRNG } from "../../Casino/RNG";
import { DeckModule, ModuleType } from "../Types";
import { getConsumableBuff, getDebuff, getEndgameBuff, getEndgameStatDebuff, getID, getLevel } from "../utils/statRng";
import { getRandomSockets } from "../utils/moduleUtilities";
import { createProcessingModule, createUplink } from "./createModule";
import { CyberdeckState } from "./CyberdeckState";
import { Player } from "@player";
import { mergeBuffs, mergeConsumableStats, mergeEndgameMults } from "../utils/modStatsUtils";

export function createCorruptedModule(rng: WHRNG): DeckModule {

  if (Player.sourceFiles.get(1) && rng.random() < 0.08) {
    return getEndgameStatModule(rng);
  }

  const roll = rng.random();
  if (roll < 0.08) {
    return getCorruptedRackExtension(rng);
  }
  if (roll < 0.14) {
    return getCorruptedSkillChip(rng);
  }

  if (roll < 0.22) {
    return createUplink(getLevel(rng), rng, false);
  }

  if (roll < 0.30) {
    return createProcessingModule(getLevel(rng), rng, false);
  }

  if (roll < 0.38) {
    const module = createProcessingModule(getLevel(rng, 2), rng, true, 1.5, 2);
    module.stats.playerMults ??= mergeBuffs([getDebuff(8, rng), module.stats?.playerMults ?? {}]);
    module.level = -1;
    return module;
  }

  if (roll < 0.46) {
    const module = createUplink(getLevel(rng, 2), rng, true, 1.5, 2);
    module.stats.playerMults ??= mergeBuffs([getDebuff(8, rng), module.stats?.playerMults ?? {}]);
    module.level = -1;
    return module;
  }

  return getJunkModule(rng);
}


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
      },
    },
    {
      type: ModuleType.ProcessingModule,
      id: getID(rng),
      sockets: twoSocket,
      level: 0,
      stats: {
        playerMults: getDebuff(1, rng),
      },
    },
    {
      type: ModuleType.Uplink,
      id: getID(rng),
      sockets: twoSocket,
      level: 0,
      stats: {
        playerMults: getDebuff(1, rng),
      },
    },
    {
      type: ModuleType.PowerSupply,
      id: getID(rng),
      sockets: twoSocket,
      level: 0,
      stats: {},
    },
  ];

  return modules[Math.floor(rng.random() * modules.length)];
}

const getCorruptedRackExtension = (rng: WHRNG): DeckModule => {
  const debuffs = mergeBuffs([getDebuff(8, rng), getDebuff(8, rng)]);
  const extraSlots = Math.floor(rng.random() * 3) + 2;
  return {
    type: ModuleType.RackExtension,
    id: getID(rng),
    sockets: getRandomSockets(rng, 1),
    level: -1,
    stats: {
      playerMults: debuffs,
      extraRackSlots: extraSlots,
    }
  };
}

const getCorruptedSkillChip = (rng: WHRNG): DeckModule => {
  const buffs = mergeConsumableStats(
    getConsumableBuff(8, rng),
    getConsumableBuff(8, rng),
  );
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
  const level = getLevel(rng, CyberdeckState.netrunningLevel + 2);
  const buff = getEndgameBuff(level, rng);
  const standardDebuff = getDebuff(CyberdeckState.netrunningLevel, rng);
  const endgameDebuff = getEndgameStatDebuff(CyberdeckState.netrunningLevel / 2, rng);
  const effects = mergeEndgameMults([buff, endgameDebuff]);

  return {
    type: ModuleType.ProcessingModule,
    id: getID(rng),
    sockets: getRandomSockets(rng, 1),
    level: level,
    stats: {
      playerMults: standardDebuff,
      endgameStats: effects,
    },
  };
}