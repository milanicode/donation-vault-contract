# Threat Model — <project name>

> Narrative companion to `.security/threat-model.yaml` (the machine-readable
> source of truth). Keep IDs in sync: prose explains, YAML enforces.
> Method: `methodology/THREAT-MODELING.md`.

## 1. Architecture

TODO(sfsec): Diagram or describe the system: contracts, external dependencies
(tokens, oracles, other protocols), privileged roles, and how value flows
through it. State what is IN scope and OUT of scope.

## 2. Assets (what an attacker wants)

For each `AST-*` in the YAML: what it is, where it lives, its worst-case loss.

| ID | Asset | Held by | Worst case |
| -- | ----- | ------- | ---------- |
| AST-001 | TODO(sfsec) | | |

## 3. Actors and trust

For each `ACT-*`: who they are, what they can call, why they are (un)trusted.
Untrusted is the default; every "trusted: true" needs a sentence of defense.

## 4. Trust boundaries

Where does data/value cross from a less-trusted to a more-trusted zone?
Every boundary is an attack surface and should map to at least one threat.

## 5. Attacker capabilities

The attacker model this analysis assumes. Removing a standard capability
(reentrancy, MEV, flashloans, multiple accounts) requires justification here.

## 6. Threats

For each `THR-*`: attack narrative — who does what, in what order, and what
breaks. Severity per `specification/SEVERITY.yaml`. Accepted risks must carry
`accepted_risk` in the YAML and appear in every report.

## 7. Security requirements

For each `REQ-*`: the testable property that neutralizes its threats. These
flow into invariants (`.security/invariants.yaml`) and from there into tests.
