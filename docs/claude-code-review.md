# Claude Code reviews

This fork adapts the live SyRF review implementation at
[`camaradesuk/syrf@616a58f`](https://github.com/camaradesuk/syrf/blob/616a58f01a829da3b530a8ff6fa64a8c076dc719/.github/workflows/claude-code-review.yml),
including its authorization, progress comments, re-review prompt, usage summary,
and delivery verification. Its supporting authorization/delivery tests are adapted
from `.github/scripts/test-claude-review-comment.cjs` at the same revision.

## Request a review

Once the workflow is on the default branch and authentication is configured, add
one PR conversation comment containing only:

```text
/claude-review
```

The default model is `sonnet`. Select another with `/claude-review opus`,
`/claude-review fable`, or `/claude-review haiku` (case-insensitive). These aliases
follow SyRF and resolve through Claude Code; model availability depends on the
connected account. Effort is high except for Haiku. Do not request another run
until the current one finishes; inspect its reviewed SHA before re-requesting.

**Labels do not trigger reviews.** In particular, `claude-review` is inert in the
current SyRF implementation. Pushes, PR events, comment edits, ordinary comments,
and `@claude` mentions do not trigger this workflow. There is no standing opt-in,
automatic re-review, concurrency group, cancellation controller, synthetic status,
or automatic merge. Each eligible newly created command starts one job, as in
SyRF; duplicate commands can therefore spend quota concurrently.

The requester and any rerunner must have `maintain` or `admin` repository access.
The requester must be human and have a trusted author association. The target must
be an open, non-draft, same-repository PR against the default branch. Authorization
is checked before checkout or OAuth use; API failure denies access. External fork
heads are rejected even when a maintainer requests the review.

## Output and review boundaries

Claude updates its native progress comment and posts confirmed blocking findings
as native inline threads. Non-blocking suggestions stay in the summary. A re-review
checks changes since the last reviewed commit, excludes unrelated merged-main
changes, and avoids duplicate findings. The final comment includes the exact
reviewed head SHA, a verdict and the current run-attempt link. Delivery verification
fails if execution output or that Claude-authored final comment is absent; a stale
comment or progress stub cannot pass. The verdict is advisory text, not an enforced
branch-protection rule or a GitHub approval. A completed review with a
`request changes` verdict can have a successful delivery job.

The Angular prompt covers correctness, public API/packaging, security,
accessibility/motion, testing, existing design patterns, scope, docs/playgrounds,
and project conventions. It uses npm and this repository's actual Angular CLI,
build and Playwright commands. It forbids executing PR scripts, installing
packages, editing source, pushing, publishing, or exposing secrets during review.
Those prompt restrictions supplement authorization; they are not a sandbox.
The existing general-purpose SyRF `claude.yml` write-capable agent is deliberately
not copied: this change adds reviews only.

## Differences from SyRF and permissions

- Uses `ubuntu-latest`, an isolated GitHub-hosted runner, instead of the SyRF
  organization's `juniper-ci` self-hosted pool. The 60-minute timeout is retained.
- Keeps `anthropics/claude-code-action@v1`, `actions/checkout@v5`, and
  `actions/github-script@v8`, matching the source, with native App OIDC exchange,
  `track_progress: true`, and fix links disabled. There is no custom GitHub token.
- Keeps `contents: read`, `pull-requests: write`, `issues: write`, `actions: read`,
  and `id-token: write`. The App token is obtained by the action; its installation
  has its own permissions. Do not describe the agent as technically incapable of
  all writes merely because the checkout token is read-only.
- Checkout initially reads the default branch and retains its read-only Git
  credential for progress mode's initial PR fetch (SyRF's workaround for upstream
  [#1340](https://github.com/anthropics/claude-code-action/pull/1340)); checkout cleans
  it up after the job. The action then checks out the PR branch. The prompt handles
  a newer branch tip by reading reviewed-head files through the GitHub API.
- Tests parse YAML with the declared `yaml` dev dependency instead of requiring
  SyRF's external `yq` binary. Existing Verify CI runs them after dependency install.

## One-time setup and current verification limit

As inspected on 2026-10-16, Actions is enabled and all actions are permitted, but
`chrissena/mat-exp` has **zero repository Actions secrets**. The available CLI token
cannot list GitHub App installations (HTTP 403), so Claude App access is unverified.
The workflow is reviewable but live review authentication has not been tested.
No secret values were read or copied from SyRF.

1. Install or grant the official [Claude GitHub App](https://github.com/apps/claude)
   access to **chrissena/mat-exp**.
2. Generate an OAuth token with `claude setup-token` in your own local terminal,
   then add it as the repository Actions secret **CLAUDE_CODE_OAUTH_TOKEN** in
   [Actions secrets](https://github.com/chrissena/mat-exp/settings/secrets/actions).
   Do not paste the token into a PR, issue, or chat. This matches the
   [official action setup guide](https://github.com/anthropics/claude-code-action/blob/main/docs/setup.md).
3. Review and merge the infrastructure PR when ready. `issue_comment` executes
   the default-branch workflow: comments before it lands cannot test this new file.
4. After the target PR's checks pass, request one review on a ready same-repository
   PR. Confirm both the final reviewed SHA and delivery step. If no workflow run
   appears, check the fork's Actions tab for an activation prompt; the API reported
   no registered workflows at implementation time. No repository settings were changed.

Do not make this opt-in comment job a required check for every PR. No inherited
SyRF rulesets or retired `claude-review/policy` statuses are installed here.

## Local verification without model quota

```bash
npm ci
node --test .github/scripts/test-claude-review-comment.cjs
actionlint .github/workflows/claude-code-review.yml .github/workflows/verify-and-release.yml
```

The fixtures execute the real inline scripts with mocked GitHub responses. They
cover authorization, model parsing, rejected trigger events and fork heads,
rerunner access, exact head binding, usage parsing, and final delivery validation.
They do not prove OAuth or App installation works; that needs the post-merge smoke
review above. Existing component builds and demo servers are unaffected.
