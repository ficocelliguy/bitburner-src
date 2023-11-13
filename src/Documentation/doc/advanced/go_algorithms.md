// TODO: This document

# Programming a basic IPvGO script

This is how to do the thing!

## Self-contained algorithms

**Difficulty**: Easy

Pros:

- Easy to implement
- Does not require other scripts to work
- Works at any stage of the game

Cons:

- Limits income generation
- Extremely [RAM](../basic/ram.md) inefficient
- Utilizes script online time poorly
- Risk of over hacking

Self-contained algorithms are the simplest family of hacking algorithms to implement.
Each script is tasked with choosing which function to execute based on the status of the target server.
Because of this, they guarantee a consistent, but relatively small, flow of money.

The general logic goes like this:

    loop forever {
        if security is not minimum {
            await ns.weaken(target)
        } else if money is not maximum {
            await ns.grow(target)
        } else {
            await ns.hack(target)
        }
    }

This algorithm is perfectly capable of paving the way through the majority of the game, but it has a few significant issues.

- It tends to make all your scripts on every server do the same thing.
  (e.g. If the target is 0.01 security above the minimum, all scripts will decide to weaken, when only a handful of threads should be devoted to the task)
- At higher thread counts, these scripts have the potential to hack the server to $0, or maximum security, requiring a long setup time while the scripts return the server to the best stats.
- Requires function calls such as `getServerSecurityLevel` and `getServerMoneyAvailable`, as well as calling all three hacking functions, increasing RAM cost which is multiplied by the number of allocated threads
