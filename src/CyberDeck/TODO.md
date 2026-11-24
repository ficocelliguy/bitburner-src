Patch changes:
- Added support for dragging and dropping mods from storage into a full rack to swap with the mod you dropped on top of
- Improved netrun reward modal layout and component reward display - with tooltips!
- Added feedback to all dev menu buttons

TODO:

- give a skillchip reward if there isn't one and the skillchip tutorial step isn't completed

- filter box help text

- double click to move mod?

- hover effect on socket when mousing over it when installed

- limit the width of the portal screen?

- dev menu - set component counts



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


challenge ideas from playtest feedback:

- Bus Bar: Charge 3 mods through a single power supply
  - Confusion: power supplies read as pure debuffs. 
  - Hint: "A power supply doesn't make power, it spreads it. The debuff is the price of the extra sockets."
  - Reward: Crafted power supplies get +1 socket

- Cold Trail: Start a netrun with the hostile trace fully decayed
  - Confusion: the ICEBreaker price curve. Hallowed (Sept 30) asked "does the cooldown only start when you pick
    up your loot?" and "so it just starts off even higher than 20k ICE?". princess_fox (Sept 18) ran back-to-back
    until told to wait. E9Cipher (Sept 18) asked why the price was Infinity.
  - Hint: "Every run leaves a trace. The longer you wait, the cheaper the next one gets. Watch the trace risk
    on the netrunning page."
  - Reward: +2 netrun cooldown reduction level
  - Hook: completeNetrunChallenges runs before netrunRewards updates lastNetrunningTimestamp, so check
    getNetrunningTraceFraction() === 0 there (non-corrupted only). Progress: current trace fraction.

- Upgrade Path: Reach netrunning level 5
  - Confusion: that netrunning level is what gates mod rarity, and that it is raised by skillchips from a specific
    target. Hallowed (Sept 30): "Rarity 2, right... TT" and "not getting anything impressive". AnIncrementalGamer63
    (Oct 5) didn't know how to switch targets. Fico's own balance sim alternates Omnia runs and stat runs.
  - Hint: "Omnia Cybersystems runs drop the skillchips that raise your deck's levels. A higher netrunning
    level means higher rarity rolls on everything that follows."
  - Reward: Omnia netruns drop one extra skillchip
  - Hook: consumeSkillChips - check CyberdeckState.netrunningLevel >= 5 after applying stats. Progress:
    netrunningLevel / 5. Different from Skill Junkie (count consumed): this is about the outcome, not the grind.

- Pocket Rig: Upgrade the cyberdeck server's cores 3 times
  - Confusion: what the cyberdeck server is for. AnIncrementalGamer63 (Sept 18): "pitiful amount of ram and nothing
    indicates it has special properties". DIGI7 (Nov 2): "the cyberdeck can be used to run scripts!?" and
    "i was wondering if it soft-reset". The upgrades live on the crafting page, where nobody looks for a server.
  - Hint: "The deck is a server too. Its RAM is small and expensive, but its cores are uncapped, and both
    survive augmentation installs. Upgrades are on the crafting page."
  - Reward: Server RAM upgrades give 4GB instead of 2GB
  - Hook: upgradeCyberdeckServerCores - check serverCoreUpgrades >= 3. Progress: serverCoreUpgrades / 3.
    Pairs with Cortex Donor above (share threads from the deck) as the "use the server" pair.

- Keepsake: Favorite 3 mods
  - Confusion: storage fills fast and nothing protects a good roll. gmcew (Nov 15) "filled my mod storage in a
    matter of minutes". Hallowed (Sept 30) was surprised a full storage still allowed netrunning (now requires a
    free slot). AnIncrementalGamer63 (Sept 18) warned others to favorite mods before running his auto-salvage
    script, which means the feature exists but nobody found it in the UI.
  - Hint: "Favorited mods can't be salvaged, by you or by your scripts. Mark the ones you're building around."
  - Reward: +2 mod storage size
  - Hook: toggleFavorite in ModuleComponent and the favoriteMod API - count mods with favorite === true across
    installedModules + storedModules. Progress: count / 3.

- Fabricator: Gain 1,000 total components from charged mods
  - Confusion: that mods can produce components at all. E9Cipher (Sept 18) read the production stats as something
    to "set a number for". AnIncrementalGamer63 (Sept 18) asked for a mods row in component stats before it
    existed. The "mods" row now exists but nothing points at it.
  - Hint: "Some Omnia mods roll ROM, chip or neurode production per cycle. Wire one up and watch the 'mods' row
    on the stats page tick."
  - Reward: Component production stats on new mods roll 25% higher
  - Hook: getCyberdeckComponentsFromMods - sum componentStats.{rom,chips,neurodes}.mods >= 1000. Runs every
    processing tick, so keep the check to a single comparison. Progress: sum / 1000.

- Stockpile: Hold 100 ICEBreakers at once
  - Confusion: what ICEBreakers are and why a run won't start. E9Cipher (Sept 18): "I still don't understand what
    ICEBreakers are". E9Cipher (Nov 15) hit the forbidden cursor with too few and reported it as a bug. Hallowed
    (Sept 30) noted the glitch page doesn't show your count. Tutorial says "craft some" but not why.
  - Hint: "ICEBreakers are the ammo for netrunning. Every run burns a stack, and the more recent your last run,
    the bigger the stack. Craft them from components on the crafting page."
  - Reward: ICEBreaker crafting cost reduced
  - Hook: craftICEBreaker (and netrun component rewards) - check components.iceBreakers >= 100. Progress: count / 100.

- Muscle Memory: Install augmentations with 4+ mods charged
  - Confusion: whether the deck survives a reset. DIGI7 (Nov 2) assumed it would soft-reset. Nothing in the UI says
    mods, wiring, levels and server upgrades persist through installs (only bitnode prestige wipes them).
  - Hint: "Your deck is hardware. Augmentation installs don't touch it, so a good layout is worth the time."
  - Reward: +1 netrunning level
  - Hook: prestigeCyberdeck(prestigeBitnode = false) - check getChargedModuleIDs().length >= 5 (panel + 4) before
    anything else runs. Lower priority: only fires once per install, so it's a slow teach.

Confusions from the thread that are already covered by an existing challenge or an idea above:

- Firewalls are passable, just slow (Hallowed Sept 20 "This is cruel"; gmcew Nov 15 routed around them for weeks).
  Covered by Battering Ram. Consider moving it earlier in the order and adding "you can walk through pink" to
  the hint.
- Depowering a rack extension ejects its mods (DIGI7 Nov 2; AnIncrementalGamer63 Sept 18). Covered by Big Deck's hint.
- Same-color wires can't cross and covered sockets gray out (princess_fox Sept 20). Covered by Full House's hint.
- Netrunning does not count as a component source (DIGI7 Nov 2). Covered by Supplier's reworded description.
- Right-click flags a group (DIGI7 Nov 2 "only discovered you could mark trapped things from the challenge").
  Covered by Bomb Squad. This is the proof that challenge hints work as the extended tutorial.
- Picking a target per run and what each specializes in (AnIncrementalGamer63 Oct 5). Covered by Espionage above.
- Ending a run early vs. running the battery dry (princess_fox Sept 18). Covered by Efficient above.
- Scrapping the starting skillchip soft-locks the tutorial step (DIGI7 Nov 2). Not a challenge, but the tutorial
  should either exclude starting mods from salvage until consumed or accept any later skillchip.

Not challenge-shaped, but repeated enough to note for docs:

- start() vs getStatus() look like the same call (DIGI7 Nov 7). getStatus() is not discoverable from start()'s docs.
- coordinates are [y, x] in getStatus() but x/y fields on grid entities (DIGI7 Nov 15; gmcew Nov 15).
- getGrid() groups answered "why can't I see connections" (AnIncrementalGamer63 Sept 19), but the docs don't say
  group ids are how you find them.


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
