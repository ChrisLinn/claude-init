+ During you interaction with the user, if you find anything reusable in this project (e.g. version of a library, model name), especially about a fix to a mistake you made or a correction you received, you should take note in the `Lessons` section in the `CLAUDE.md` file so you will not make the same mistake again.

## Lessons

- When using `ipset add` commands, always use the `-exist` flag to prevent errors when adding duplicate entries (e.g., `ipset add allowed-domains "$ip" -exist`). DNS resolution can return duplicate IPs or the same IP may be shared across domains.
