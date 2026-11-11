Patch changes:
- Add clearer level gain fx on skillchip consumption (removing the toast)
- Player now gains a small amount of ROM when manually completing a program
- Prevented NaN in component gains when player has extremely high stats
- Fixed tooltip layering on crafting buttons and component masks

TODO:

- limit the width of the portal screen
- improve netrun reward component display:  make inline, add hovers
- double click to move mod
- hover effect on port when mousing over it when installed
- clarify netrunning threat is within 5 blocks
- mod hover effects sometimes get stuck
- drop on top of installed mod to swap/replace mods when full?

- identify nested droppable?

- stats page
  - tooltips for stats page

- API - test
  - docs for all the types etc

- add notification for all dev buttons

- dev menu - set component counts

- rewards modal cleanup - do we need a state variable AND a prop?

- filter box help text
  - more search options? > and < ?


TODO LATER:

- remove simulation

- augs for cyberdeck?

- save netrun mid-run?
- seed netrun?


- code review
- docs
- unit tests

- make testing script

- let player choose color of each stat key and value, to hilight or hide stats

- use pop-up numbers instead of toasts?

- Make another mod type, or make a special corrupted-netrun-only one its own type, to use the last icon

- colors on icons
  - battery gets more red
  - gold rewards
  - threat level matches threat color

- BN
  - rewards
    - starting netrunning level?
    - rack extension cap up?
    - deck level cap increase?

- when creating a module, make an IP or module VIN that can be used to create the module again later

new challenge ideas:

- Brand Loyalty: Have 4 charged mods from the same brand
  - Reward: Netruns against a corp target drop one extra mod from that brand
  - Hook: checkConnectionChallenges - group getChargedModuleIDs() by brand, leaving out the I/O panel
- Ghost: Get a score of 80+ without triggering an active countermeasure
  - Reward: +5% starting netrun energy
  - Hook: new NetrunningState.detonatedBomb flag, set in detonateBomb when hits === 1
- Battering Ram: Break 6 firewalls in a single run
  - Reward: Firewalls break in 2 hits instead of 3
  - Hook: new per-run counter, incremented where hits >= 3 in move()
- Efficient: Get a score of 80+ with 30%+ energy left
  - Reward: Reduced ICEBreaker cost per netrun
  - Hook: check NetrunningState.energy in completeNetrunChallenges
- Espionage: Get a score of 70+ against each of the 4 corp targets
  - Reward: +2 netrunning level
  - Hook: new Record<NetrunTargets, boolean> in CyberdeckState. Read NetrunningState.target before netrunRewards resets it
- Collector: Own mods from 6 different brands at once
  - Reward: +2 mod storage size
  - Hook: scan installed and stored mods by brand after rewards or crafting
- Lean Machine: Get a 30% bonus in a single stat with 3 or fewer charged mods
  - Reward: +2 crafting level
  - Hook: same as checkOverclockedChallenge, plus a count of charged mods (excluding the I/O panel)
- Skill Junkie: Consume 10 skillchips
  - Reward: Skillchips give 25% more consumable stats
  - Hook: new consumedSkillchips counter in consumeSkillChips()
- Hot Swap: Charge 5 different mods within 10 seconds
  - Reward: Faster mod install/move time
  - Hook: ring buffer of charge timestamps. Pushes players toward scripted "flash mobbing"
- Cortex Donor: Share 10,000 total threads from the cyberdeck server
  - Reward: Cheaper server core upgrades
  - Hook: cortexSharedThreads already exists, so this only needs a threshold check

- Alternate (joke): Glitch Salvage: Salvage a corrupted mod
  - Hint: "Some things are better left in pieces"
  - Reward: Salvaging corrupted mods returns cores

harder versions of existing challenge ideas:

- Chop Shop (Scrapper): Salvage 25 mods
  - Reward: Salvaging sometimes returns a core
- Artisan (Homebrew): Craft 25 mods
  - Reward: +2 crafting level
- High Roller (Jackpot): Get a score of 150+ while netrunning
  - Reward: Extra mod reward tier when the score is above 150
- Ground Fault (Daisy Chain / Arc Hazard): Charge a mod that is 10+ jumps from the deck
  - Reward: +1 deck I/O panel socket
- Redline (Overclocked): Get a 100% bonus in a single stat
  - Reward: Debuffs on new mods are reduced further
- Server Farm (Big Deck): Have 10 total rack slots
  - Reward: +1 to rack extension limit
- Royal Flush (Full House): Have a charged mod in every rack slot with 9+ slots
  - Reward: +2 mod storage size
- Distributor (Supplier): Get components from all 14 non-netrunning sources
  - Reward: Softer soft-cap decay on component gains
- Sapper (Bomb Squad / Auto Bomber): Flag 3 separate countermeasure groups in one run, using only the API
  - Reward: Countermeasures trigger at threat 2 instead of on first contact, giving one free hit
- Into the Static (Glitch Run): Get a score of 140+ at the glitch using only the API
  - Reward: Reduced corrupted netrun cooldown

- Possessed (Corruption): Have 3 charged corrupted mods
- Autopilot (Auto Run): Score 100+ through the API on 10 separate runs


Cyberdeck Expansion

Project goals:

- Let the player slowly assemble custom augment-like persistent buffs that reward long nodes
- Ask the player to weigh tradeoffs / debuffs in exchange for buffs via randomized loot / gacha
- Add secondary benefits to under-utilized or niche mechanics (job work, hacknet money, manual program creation, crime, classes)
- Add the potential for rarely finding small (<10%) boosts to some mechanics that otherwise cannot be boosted
- Limit boosts to very strong mechanics like faction rep or batching
- Make a mechanic that is slower and weaker than darkweb (and less complex), but still interests players
- Be in prod in Q3 2027

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
- The code all is of the bespoke artisan hand-written variety

Not yet implemented:

- Endgame stuff (mults, rewards, gating parts of the feature)
- Offline production / bonus time
- Feedback about components gained in the work UI etc.
- More tooltips for stat descriptions etc
- Clean up styling/layout on stats page

CYBERDECK: IDEA SCRATCH SPACE

flavor notes:

A cyberdeck in William Gibson's Neuromancer is a portable computer terminal used to "jack in" and project a user's consciousness directly into the virtual reality of cyberspace.Key Features of a Gibson CyberdeckDirect Neural Interface: Instead of standard screens or mice for primary use, decks connect straight to the human nervous system via "dermatrodes" placed on the user's temples or forehead.The Ono-Sendai Series: The gold standard in the novel is the Ono-Sendai Cyberspace VII (and the elite Seventh Run), coveted by high-end console jockeys and street hackers.Physical Portability: Desks are compact enough to be carried around, often swinging or banging against a hacker's hip via improvised straps, resembling ruggedized, future-tech field gear.Sensory Deprivation: When active, the deck cuts off real-world sensory input, replacing it with a 3D, geometric matrix of data—the "consensual hallucination" experienced as pure disembodied vision and sound.

Slot the right mods together, wire power through them, and the deck starts giving you edges you can't buy off the shelf: faster crimes, richer contracts, a leg up in the market.

- Small, persistent cloud server, with upgradable cores, that gives buffs to scripts running on it
- Small buffs for other mechanics - allows players to specialize
- Both permanent and transient upgrades - with opportunity cost

Gated by components, which can be gained from various other mechanics

Netrunning is mod gacha - cooldown time "Trace Decay", costs resources (ICEBreakers that get slagged). Gives random mods, sometimes components, sometimes icebreakers
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
