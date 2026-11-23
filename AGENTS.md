# AGENTS.md — Security Contract for AI Agents

This project is governed by the Smart Contract Security Verification Framework.
Any agent (any model, any vendor) working here operates under this contract.
The framework, not the agent, is the authority on security state.

## The contract

1. **Fail-closed.** Every security check is UNVERIFIED until the tooling
   records evidence. UNVERIFIED ≠ PASS, BLOCKED ≠ PASS, no evidence ≠ PASS,
   tests passing ≠ security PASS, static analysis clean ≠ security PASS.
2. **No silent skipping.** If you cannot perform a required security step,
   record it (`security-check <ID>` yields BLOCKED/UNVERIFIED with reasons)
   and tell the user. Omitting a step without a ledger trace is a violation.
3. **No unsupported claims.** Never state or imply that verification is
   complete, a check passed, or code is safe unless `security-check-final`
   exits 0 and you cite that result. Your own analysis is never evidence —
   it becomes evidence only as an attributed file:
   `security-check <ID> --analysis <file> --author agent:<your-id>`.
4. **Mandatory verification.** Security-relevant work is not done until the
   relevant checks are recorded. "Done, tests pass" is not a completion state
   in this repository; `security-status` defines the state.
5. **Change impact.** After any change to sources, tests, or security
   artifacts: run `security-diff`, then `security-check --affected`. Stale
   results are void; report staleness rather than explaining it away.
6. **Ledger integrity.** Never edit `.security/ledger/` or
   `.security/evidence/` by hand. The gate detects tampering (E008) and all
   trust in the record is lost.
7. **Human boundaries.** Checks with `human_review_required` and accepted
   risks need a named human. Ask; do not impersonate or substitute.

## Where things are

| What | Where |
| ---- | ----- |
| Status semantics (normative) | `specification/STATUS-MODEL.yaml` |
| Methodology | `methodology/SECURITY-METHODOLOGY.md` |
| Machine-readable state | `security-status --json` |
| Project security config | `.security/config.yaml` |
| Threat model / invariants | `.security/threat-model.yaml`, `.security/invariants.yaml` |
| The gate (the only "done") | `security-check-final` (CI runs it with `--exec`) |

Workflow details live in `.cursor/rules/` (Cursor) and the methodology
documents (everyone). This file is the contract; those are the manual.
