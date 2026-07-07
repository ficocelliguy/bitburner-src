

export const CyberDeckState = {
  hasCyberdeck: true,
  baseRackSize: 6,
  installedModules: [] as (DeckModule | null)[],
  storedModules: [] as (DeckModule | null)[],
  components: {
    ROM: 0,
    neurodes: 0,
    chips: 0,
  },
};

export type DeckModule = {
  id: string;
  sockets: number[];
  type: string;
  stats?: null;
}

for (let i = 0; i < 4; i++) {
  CyberDeckState.installedModules.push({
    id: `${(Math.random() * 1e3) | 0}`,
    sockets: [],
    type: "Module",
  });
}
for (let i = 0; i < 10; i++) {
  CyberDeckState.storedModules.push({
    id: `${(Math.random() * 1e3) | 0}`,
    sockets: [],
    type: "Module",
  });
}