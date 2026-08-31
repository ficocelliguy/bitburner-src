REQUIRED FOR MVP

- api
- re-enable offline summary & beta text

- Droppable: unsupported nested scroll container detected on rewards panel in dev screen

- basic doc page - rewrite

- Add WiFUs
  - Wired Firmware Unit

- code review
- unit tests
- lint

- make testing script

TODO:

- tooltips for stats page

- filter box help text

  - more search options? > and < ?

- netrunning
  - animated background

TODO LATER:

- BN

  - rewards
    - starting netrunning level?
    - rack extension cap up?

- Full docs

- offline production?

- when creating a module, make an IP or module VIN that can be used to create the module again later

- stats page

  - cleanup styling

- Glitch netrunning
  - bonus corruption effects?
    - can't be removed
    - health loss?
    - sockets in wrong order?

Cyberdeck Expansion

Project goals:

- Let the player slowly assemble custom augment-like persistent buffs that reward long nodes
- Ask the player to weigh tradeoffs / debuffs in exchange for buffs via randomized loot / gacha
- Add secondary benefits to under-utilized or niche mechanics (job work, hacknet money, manual program creation, crime, classes)
- Add the potential for rarely finding small (<10%) boosts to some mechanics that otherwise cannot be boosted
- Avoid boosting very strong mechanics like faction rep or batching

Puzzles the player may want to solve:

- Given a list of mods (that each have connection limitations), how many of them can I actually daisy-chain together? which ones' buffs are worth the associated debuffs? How can I maximize stats I care about?
- How much do I spend time doing meta things (e.g. faction rep work) vs side things that help build up my cyberdeck mods?
- How much do I wait for netrunning to fully reset, vs spending more resources to get new random mods more often?
- When do I swap out mods with other ones I have in storage to buff something else? (moving mods takes a short amount of time, so "flash mobbing" is possible but requires planning)
- How much do I spend resources on standard netrunning (for more consistent rewards) vs the more expensive corrupted netrunning (which may give junk, or mods with bigger tradeoffs, or exclusive stat boost types)?

Open questions:

- What parts of this should be limited to endgame? higher rarity mods? Specific stats? specific mod types e.g. rack extensions? caps on storage size or levels? ALl of it?
- What other under-utilized mechanics could also have component gains associated with it?
- What other currently fixed game stats could work with rare minor buffs?

Implementation notes:

- RNG is seeded based on the players' ID and current source-files, and unique to each roll type. This means that savescumming doesn't change anything, and doing other activities doesn't change the "queued" outcome of future rolls of a particular type.
- There is a soft-cap to how often the player can roll for new loot, since the price to roll immediately after a prior roll is prohibitively expensive. This cooldown is configurable to ensure slow, steady progress.
- The potential roll range for each stat (and which stats can be rolled) is hand-chosen, and can be tuned stat-by-stat.
- Component gains from many sources are soft-capped. Further investment DOES increase component gains, but by diminishing returns.
- For testing, the cooldowns of netrunning are currently significantly reduced.

CYBERDECK: IDEA SCRATCH SPACE

- Small, persistent cloud server, with upgradable cores, that gives buffs to scripts running on it
- Small buffs for other mechanics - allows players to specialize
- Both permanent and transient upgrades - with opportunity cost

Gated by components, which can be gained from various other mechanics

Netrunning is mod gacha - cooldown time "Trace Decay", costs resources (ICEbreakers that get slagged). Gives random mods, sometimes components, sometimes icebreakers
Some mod types can be crafted - takes money and components - power supply, processing unit, not consumables
Netrunning and crafting can be leveled via consumables or spending lots of money + components

- New faction to provide deck and key upgrades as augments?
- Some upgrades require components, gathered from doing other activities (megacorp work? crime? gang? dnet?)

tabs for netrunning, crafting, deck management
crafting tab shows percent of current craft
components always shown in the top corner

mod types:
Power supply - few stats (or only debuffs), but many power connection sockets
Processing mod - buffs only scripts running on the deck itself
Uplink unit - global buffs, but much lower buffs than processing unit
Skillchip - consumable - single use, destroyed on connection to power. Gives permanent buff and some components. storage increase fraction? rack extension limit?
Rack expansion - more slots!
Heatsink for heat management? some mods give off heat, and cause debuffs for hgh heat? low temps increase other chips' boosts?
some mods get buffs for high heat instead?

Module buff ideas:

- boost share with cores
- boost crime chance and speed (inc. gang)
- boost grafting speed
- work rep boost?
- improve component droprate
- improve netrunning cooldown
- modules have some debuffs too
- component production

the glitch connects to netrunning somehow? dangerous netrunning outside of the blackwall?

wiring puzzle

- Each module has some number of colored ports (based on index - all 0s are blue, all 1s are green, etc)
- Modules can be connected to other modules via cables on matching colors
- must be connected to give buffs
- cables can only be vertical (matching colors) and cannot overlap other cables

Base cyberdeck must be chosen

- only one can be had at a time - must sell the old one to get a new one
- each option is better at some things, and has some limits
- glitchy one?

ROM components

- backdoors
- darknet caches
- petty crime
- making programs by hand

chip components

- company work
- IPvGO game completions
- hacknet

neurode components

- kills from crime
- going to class
- infil?
- coding contracts?
- sleeve de-shock
