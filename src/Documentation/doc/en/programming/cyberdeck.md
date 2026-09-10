# Cyberdeck

The sky above is the color of television, tuned to a dead channel. Your deck hums at your side, a custom rack of mods hand-wired into a rugged keyboard and neural interface. Your augments spark as you prepare to dive. You've caught wind of a big score - forbidden new mod tech - protected only by some flimsy ICE security software.

Cyberspace holds the research and storage of every major megacorp, and not all of it is well protected. A few well-placed ICEBreakers and one clean netrun, and the mods inside are yours.

**To get a cyberdeck, you can buy one from a tech shop in New Tokyo or Ishima.** If you have the hacking level for it (1000), you can also hand-build your own from the Create Program menu.

&nbsp;

### The Rack

Any console jockey can buy an off-the-shelf setup. What sets a netrunner apart is a customized rack of mods. Your deck has a limited number of slots. Each mod comes with stat buffs, sockets you can daisy-chain other mods off of, and (usually) stat debuffs to weigh against the buffs. Drag mods onto the rack, rearrange them, or move them into storage for later.

Mods fall into one of these types:

- **Power Supply** - lots of sockets to route power to other mods.
- **Processing Mod** - buffs to various game mechanics and crafting component production.
- **Uplink** - buffs to player stats.
- **Rack Extension** - few stats or sockets, but raises the size of the rack when powered.
- **Skill Chip** - single-use. Consumed when powered, and gives a permanent bonus to one of your cyberdeck levels.

Higher rarity mods gain access to higher potential stat rolls. On average, they have higher buffs and lower debuffs than lower-rarity mods, but a well-rolled mod of a lower rarity might still be better.

Drag mods you don't want onto the trash can to disassemble them into components. Right-click a mod to favorite it and keep it from being recycled.

```js
const mod = ns.cyberdeck.getStoredMods()[0];

await ns.cyberdeck.installMod(mod.id);
```

&nbsp;

### Wiring Up Mods

A mod only takes effect when it's powered. Power comes from the I/O panel at the top of the rack, either directly, or by chaining through another powered mod.

- Drag from one socket to a matching-color socket to add a wire.
- Click a socket to remove its wire.
- Wires of the same color cannot cross other wires of that same color. Arrange your mods carefully!

Each mod (and the base I/O panel) only have sockets on certain indexes (represented by colors in the UI). Connections can only go between mods that share a socket index/color.

```js
const IO = ns.cyberdeck.getCyberdeckIOPanel();
const mod = ns.cyberdeck.getInstalledMods()[0];

if (mod.sockets[3] && getCyberdeckIOPanel().sockets[3]) {
  ns.cyberdeck.addConnection(IO.id, mod.id, 3);
}
```

&nbsp;

### Netrunning

Netrunning is the main way to get new mods. You spend a few ICEBreakers, dive into cyberspace, and come back out with random loot: mods, and sometimes crafting components. It is also the only source of cores, which are needed for hand-crafting new mods.

Each run trips automated security. For a while after, it takes many more ICEBreakers to get back in. This cooldown is called trace decay.

You can make netrunning better over time by finding and consuming the right skill chips:

- Raising your **netrunning level** increases the rarity of the loot you find.
- Raising your **netrunning cooldown level** shortens the trace decay window.

```js
const costIsBelowThreshold = ns.cyberdeck.getNetrunningCost() <= 2;
const canAffordNetrunning = ns.cyberdeck.getNetrunningCost() <= ns.cyberdeck.getComponentCounts().ICEBreakers;

if (costIsBelowThreshold && canAffordNetrunning) {
  const result = await ns.cyberdeck.netrun();

  // Recycle mods that don't have valuable stats to save storage space
  const firstModReward = result.mods[0];
  if (!(firstModReward.stats.playerMults?.strength > 0)) {
    ns.cyberdeck.crafting.recycleMod(firstModReward.id);
  }
}
```

&nbsp;

### Crafting Components

**ROM** are read-only memory cards, prized for their durability. Sources:

- Backdooring or nuking servers
- Crime (excluding homicide-type crime)
- Creating .exe programs manually
- Opening darknet caches
- Some mods, when powered

**Chips** are general-purpose programmable circuitboards, or sometimes breadboards. Sources:

- Working a company or business job
- Money gained from the hacknet
- Completing IPvGO subnet games
- Some mods, when powered

**Neurodes** are organic neural interface parts, used to talk to the wearer's augments. Sources:

- Crime kills
- Attending classes or gym training
- Completing coding contracts
- Using cortexShare()
- Some mods, when powered

**Cores** are the key ingredient for hand-crafting mods. Only found via netrunning.

```js
const cost = ns.cyberdeck.crafting.getICEBreakerCraftingCost();
const { rom, neurodes, chips } = ns.cyberdeck.getComponentCounts();

if (cost.rom <= rom && cost.neurodes <= neurodes && cost.chips <= chips) {
  ns.cyberdeck.crafting.craftICEBreaker(1);
}
```

&nbsp;

### Deck Customization Considerations

- Which stats are worth buffing up? Which ones are safe to leave debuffed?
- Which mods can you actually wire together right now? Do you need to craft a power supply to bridge the gap?
- How often should you netrun? Wait for trace decay to fully clear, or push through the extra cost?
- How much of your playtime goes to activities that produce crafting components, versus other goals?
- Are there mods worth saving for later? Can you build a second rack layout to swap between?
