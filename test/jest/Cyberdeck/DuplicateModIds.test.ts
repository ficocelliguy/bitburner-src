import { setupBasicTestingEnvironment, initGameEnvironment } from "../Utilities";
import { CyberdeckState } from "../../../src/CyberDeck/models/CyberdeckState";
import { getNetrunningRewards, getCorruptedNetrunningRewards } from "../../../src/CyberDeck/models/netrunRewards";
import { createInitialModules } from "../../../src/CyberDeck/models/createModule";
import { WHRNG } from "../../../src/Casino/RNG";
import { DeckMod } from "../../../src/CyberDeck/Types";

beforeAll(() => {
  initGameEnvironment();
  setupBasicTestingEnvironment();
});

beforeEach(() => {
  CyberdeckState.storedModules = [];
  CyberdeckState.installedModules = [];
  CyberdeckState.connections = [];
});

function allIds() {
  return [...CyberdeckState.installedModules, ...CyberdeckState.storedModules].map((m) => m.id);
}

describe("mod IDs", () => {
  test.each([
    ["netrun", (rng: WHRNG) => getNetrunningRewards(rng, 150)],
    ["corrupted netrun", (rng: WHRNG) => getCorruptedNetrunningRewards(rng, 150)],
  ])("%s rewards never contain duplicate IDs", (_, getRewards: (rng: WHRNG) => DeckMod[]) => {
    // Without storing each mod on creation, roughly 1% of reward batches contained duplicate IDs
    for (let seed = 1; seed <= 2000; seed++) {
      CyberdeckState.storedModules = [];
      const rewards = getRewards(new WHRNG(seed));
      const ids = rewards.map((m) => m.id);
      expect(new Set(ids).size).toBe(ids.length);
      // Rewards are stored exactly once, at the front of storage
      expect(CyberdeckState.storedModules).toEqual(rewards);
    }
  });

  test("rewards are added to the front of existing storage", () => {
    getNetrunningRewards(new WHRNG(1), 150);
    const existing = [...CyberdeckState.storedModules];
    const rewards = getNetrunningRewards(new WHRNG(2), 150);
    expect(CyberdeckState.storedModules).toEqual([...rewards, ...existing]);
    expect(new Set(allIds()).size).toBe(allIds().length);
  });

  test("initial modules are split between the rack and storage without duplicates", () => {
    createInitialModules();
    expect(CyberdeckState.installedModules).toHaveLength(3);
    expect(CyberdeckState.storedModules).toHaveLength(2);
    expect(new Set(allIds()).size).toBe(5);
  });
});
