# The Cyberdeck (WIP)

Everyone in the sprawl has a deck of some kind, but yours is different. It's a physical rack of chips and modules bolted to your rig, humming warm against your ribs. Slot the right mods together, wire power through them, and the deck starts giving you edges you can't buy off the shelf: faster crimes, richer contracts, a leg up in the market.

Nothing about it is stable, though. Stats roll great or awful, and corrupted mods bring debuffs along with their gains.

You'll find the Cyberdeck as its own screen in the main sidebar, with four tabs: Manage Mods (the rack), Netrun, Craft, and Stats.

&nbsp;

### The rack

The deck is a fixed set of slots. You drop mods into the rack and wire them up by dragging cables between the colored sockets on their edges. A cable only connects two sockets of the same color, and cables cannot overlap - running a wire past another mod's socket of the same color blocks the whole move.

Power comes from the I/O panel at the top. A mod stays dark unless a chain of cables can trace back to it. Only powered mods give you their bonuses.

Mods come in a few shapes:

- **Power Supply** - few stats of its own, but plenty of sockets. Its job is fanning power out to mods that would otherwise sit dark.
- **Processing Mod** - bonuses that only apply to scripts running on the cyberdeck server itself.
- **Uplink** - bonuses that apply to you through the Augmentation system: hacking, combat, crime, work.
- **Rack Extension** - rarely rolls anything useful, but adds slots. There's a cap on how many you can install.
- **Skill Chip** - one-shot. Powering a chip consumes it and permanently raises a deck-wide level (netrunning, crafting, mod storage, trace cooldown).

Rarity scales how big the stat rolls are. Most mods roll one or two positive stats; some pair those with a debuff. Read a mod before you power it.

Mods you don't want can be dragged into the trash can, which disassembles them into components. Right-click a mod to favorite it if you want it safe from that.

&nbsp;

### Netrunning

The **Netrun** tab is where new mods come from. Each run burns some ICE (crafted separately on the Craft tab), drops three random mods into your storage, and gives you a handful of components. If your storage is already full you can't run.

Between runs there's a "Trace Decay" cooldown. Running back-to-back costs a lot more ICE; waiting it out drops the price back down. The `netrun_cooldown_lvl` stat (from skill chips) lowers the floor.

The second option, **Corrupted Netrunning**, reaches past the Blackwall. It has a hard cooldown, burns much more ICE, and hands back mods with stats you won't see anywhere else. Some of them come back so corrupted the good stats bring real debuffs with them.

&nbsp;

### Crafting

The **Craft** tab spends components to make ICEbreakers (each one produces the ICE that netrunning burns), Power Supply mods, Uplink mods, and Processing mods. Crafted mods use your Crafting level to roll instead of your Netrunning level, but the math is the same. This is also where you spend components to upgrade the cyberdeck server's RAM and cores.

&nbsp;

### Components

The deck runs on five things: **ROM**, **Chips**, **Neurodes**, **Cores**, and **ICE**. Every netrun drops a mix of the first four. Beyond that:

- **ROM** - petty crime, writing programs by hand
- **Chips** - hacknet income, company work reputation
- **Neurodes** - kills from violent crime, taking classes
- **Cores** - only from netrunning
- **ICE** - only from crafting

Whatever else you're doing in the game is quietly filling your bins. Specialize hard in one activity and you'll run short on the components tied to everything else.

&nbsp;

### Playing the tradeoffs

A mod with two great stats and a debuff you don't care about is a steal. A rack extension is only worth the slot if you're already sitting on better mods than you can fit. Swapping mods in and out takes a few seconds, so you can plan around it: slot a crime-speed mod before a long run of contracts, then pull it back off when you're done.
