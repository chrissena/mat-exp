const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { parse } = require('yaml');
const { test } = require('node:test');
const { resolve } = require('node:path');
const vm = require('node:vm');

const root = resolve(__dirname, '../..');
const load = (name) => parse(readFileSync(`${root}/.github/workflows/${name}`, 'utf8'));
const workflow = load('claude-code-review.yml');
const job = workflow.jobs['claude-review'];
const request = job.steps.find((s) => s.id === 'request');
const action = job.steps.find((s) => s.id === 'claude-review');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const HEAD = '0123456789abcdef0123456789abcdef01234567';

function fixture() {
  return {
    eventName: 'issue_comment',
    actor: 'maintainer',
    repo: { owner: 'example', repo: 'project' },
    payload: {
      action: 'created',
      comment: { body: '/claude-review', author_association: 'MEMBER' },
      issue: {
        number: 42,
        pull_request: { url: 'https://api.github.com/repos/example/project/pulls/42' },
      },
      repository: { full_name: 'example/project', default_branch: 'main' },
      sender: { type: 'User' },
    },
  };
}

// Execute the real inline authorization with mocked read-only GitHub endpoints.
// The job predicate uses only JS-compatible operators plus startsWith.
async function dispatch(context = fixture(), options = {}) {
  const eligible = vm.runInNewContext(job.if, {
    github: { event_name: context.eventName, event: context.payload },
    startsWith: (value, prefix) => typeof value === 'string' && value.startsWith(prefix),
  });
  const calls = [],
    outputs = {};
  if (!eligible) return { calls, outputs };
  const pr = {
    state: 'open',
    draft: false,
    head: { sha: HEAD, repo: { full_name: 'example/project' } },
    base: { ref: 'main' },
    ...options.pr,
  };
  const github = {
    rest: {
      repos: {
        getCollaboratorPermissionLevel: async ({ username }) => {
          calls.push(`permission:${username}`);
          if (options.apiError) throw new Error('GitHub unavailable');
          return { data: { role_name: options.roles?.[username] || 'maintain' } };
        },
      },
      pulls: {
        get: async ({ pull_number }) => {
          assert.equal(pull_number, 42);
          calls.push('pull');
          return { data: pr };
        },
      },
    },
  };
  await new AsyncFunction('github', 'context', 'core', 'process', request.with.script)(
    github,
    context,
    {
      setOutput: (key, value) => {
        outputs[key] = value;
      },
    },
    { env: { TRIGGERING_ACTOR: options.rerunner || context.actor } },
  );
  if (outputs.authorized === 'true') calls.push('checkout', 'claude');
  return { calls, outputs };
}

test('direct PR comment reaches review with no PR-only skipped ancestor or label', async () => {
  assert.deepEqual(workflow.on, { issue_comment: { types: ['created'] } });
  assert.deepEqual(Object.keys(workflow.jobs), ['claude-review']);
  assert.equal(job.needs, undefined);
  assert.equal(workflow.concurrency, undefined);
  const result = await dispatch();
  assert.deepEqual(result.calls, ['permission:maintainer', 'pull', 'checkout', 'claude']);
  assert.equal(result.outputs.head_sha, HEAD);
});

test('the reviewer is given the PR head SHA and an unresolvable head is rejected (#3688)', async () => {
  assert.ok(action.with.prompt.includes('HEAD SHA: ${{ steps.request.outputs.head_sha }}'));
  assert.ok(action.with.prompt.includes('`Reviewed commit: <sha>`'));
  for (const sha of [undefined, '', 'abc1234', `${HEAD}0`, HEAD.toUpperCase()]) {
    await assert.rejects(
      dispatch(fixture(), { pr: { head: { sha, repo: { full_name: 'example/project' } } } }),
      /head commit/,
    );
  }
});

test('label, push, ordinary comments, issues and untrusted associations never invoke the agent', async () => {
  for (const eventName of ['pull_request', 'push', 'issues']) {
    const context = fixture();
    context.eventName = eventName;
    assert.deepEqual((await dispatch(context)).calls, []);
  }
  for (const body of [
    '@claude review this',
    'Please /claude-review',
    '/claude-review opus please',
    '/claude-review\nopus',
    '/claude-review\n@claude review',
  ]) {
    const context = fixture();
    context.payload.comment.body = body;
    assert.deepEqual((await dispatch(context)).calls, []);
  }
  const issue = fixture();
  delete issue.payload.issue.pull_request;
  assert.deepEqual((await dispatch(issue)).calls, []);
  for (const association of ['NONE', 'CONTRIBUTOR', 'FIRST_TIME_CONTRIBUTOR']) {
    const context = fixture();
    context.payload.comment.author_association = association;
    assert.deepEqual((await dispatch(context)).calls, []);
  }
});

test('the comment chooses the review model, defaulting to sonnet', async () => {
  const cases = {
    '/claude-review': 'sonnet',
    '/claude-review opus': 'opus',
    '/claude-review   Fable  ': 'fable',
    '/claude-review HAIKU': 'haiku',
    '/claude-review\tsonnet': 'sonnet',
  };
  for (const [body, model] of Object.entries(cases)) {
    const context = fixture();
    context.payload.comment.body = body;
    const { outputs } = await dispatch(context);
    assert.equal(outputs.authorized, 'true', body);
    assert.equal(outputs.model, model, body);
  }
  for (const body of [
    '/claude-review please',
    '/claude-review gpt-5',
    '/claude-review claude-opus-5-5',
  ]) {
    const context = fixture();
    context.payload.comment.body = body;
    await assert.rejects(dispatch(context), /Unknown review model/, body);
  }
});

test('whole command accepts trailing whitespace and the maintained trusted roles', async () => {
  for (const role of ['maintain', 'admin']) {
    const context = fixture();
    context.payload.comment.body += '\r\n';
    assert.equal(
      (await dispatch(context, { roles: { maintainer: role } })).outputs.authorized,
      'true',
    );
  }
});

test('write, triage, read and custom roles are rejected before checkout', async () => {
  for (const role of ['write', 'triage', 'read', 'custom-role']) {
    await assert.rejects(dispatch(fixture(), { roles: { maintainer: role } }), /maintain or admin/);
  }
});

test('rerunner must also have maintain/admin access; bots cannot request review', async () => {
  await assert.rejects(
    dispatch(fixture(), { rerunner: 'writer', roles: { writer: 'write' } }),
    /maintain or admin/,
  );
  const context = fixture();
  context.payload.sender.type = 'Bot';
  await assert.rejects(dispatch(context), /person/);
});

test('fork, deleted fork, closed, draft and other-base PRs are rejected', async () => {
  for (const pr of [
    { head: { sha: HEAD, repo: { full_name: 'outsider/project' } } },
    { head: { sha: HEAD, repo: null } },
    { state: 'closed' },
    { draft: true },
    { base: { ref: 'release' } },
  ])
    await assert.rejects(dispatch(fixture(), { pr }), /same-repository PR/);
});

test('GitHub authorization failure cannot reach checkout or OAuth action', async () => {
  await assert.rejects(dispatch(fixture(), { apiError: true }), /GitHub unavailable/);
});

test('authorization precedes all checkouts and secret-bearing steps', () => {
  assert.equal(job.steps[0], request);
  assert.equal(request.uses, 'actions/github-script@v8');
  assert.equal(request.env.TRIGGERING_ACTOR, '${{ github.triggering_actor }}');
  const checkout = job.steps.find((s) => s.uses?.startsWith('actions/checkout@'));
  assert.equal(checkout.with.ref, '${{ github.event.repository.default_branch }}');
  assert.equal(checkout.with['persist-credentials'], true);
  for (const step of job.steps.slice(1))
    assert.equal(step.if, "steps.request.outputs.authorized == 'true'");
  assert.equal(job.permissions.contents, 'read');
  assert.equal(job.permissions['id-token'], 'write');
  assert.equal(job.permissions.statuses, undefined);
  assert.equal(job.permissions.actions, 'read');
  assert.equal(action.with.github_token, undefined);
  assert.equal(action['continue-on-error'], undefined);
  assert.equal(job['runs-on'], 'ubuntu-latest');
  assert.equal(job['timeout-minutes'], 60);
  assert.equal(action.uses, 'anthropics/claude-code-action@v1');
});

test('custom command retains native progress mode and all nine specialist areas', () => {
  assert.equal(action.with.trigger_phrase, '/claude-review');
  assert.equal(action.with.track_progress, true);
  assert.equal(action.with.include_fix_links, false);
  for (const title of [
    'Correctness',
    'Public API & packaging',
    'Security',
    'Accessibility & motion',
    'Testing',
    'Design & maintainability',
    'Scope discipline',
    'Documentation & playground currency',
    'Project fit',
  ]) {
    assert.ok(action.with.prompt.includes(`**${title}**`), title);
  }
  assert.ok(action.with.prompt.includes('mcp__github_comment__update_claude_comment'));
  assert.ok(action.with.prompt.includes('mcp__github_inline_comment__create_inline_comment'));
  assert.ok(action.with.prompt.includes('reviewed commit SHA'));
  assert.ok(action.with.prompt.includes('[Review run]('));
  assert.ok(!action.with.prompt.includes('<!-- claude-review:'));
  assert.match(action.with.claude_args, /^--model \$\{\{ steps\.request\.outputs\.model \}\}$/m);
  assert.match(
    action.with.claude_args,
    /^\$\{\{ steps\.request\.outputs\.model != 'haiku' && '--effort high' \|\| '' \}\}$/m,
  );
});

test('reviews block only on severe findings and re-reviews are scoped to new commits', () => {
  const prompt = action.with.prompt;
  // Progress (tag) mode checks out the PR branch at run time, which can be ahead of the
  // requested head; the reviewer reads files at HEAD SHA when that matters.
  assert.match(prompt, /checks out this PR's branch/);
  assert.ok(!prompt.includes('The local checkout is the default branch'));
  assert.ok(prompt.includes('contents/<path>?ref=<HEAD SHA>'));
  // Re-reviews compare against the previously reviewed commit.
  assert.ok(prompt.includes('compare/<that sha>...<HEAD SHA>'));
  assert.match(prompt, /from the most recent such comment/);
  // The compare range includes main merged into the branch; only the PR's own changes count.
  assert.match(prompt, /arrived by merging\s+`main` into the branch: ignore it/);
  assert.match(
    prompt,
    /If it equals HEAD SHA \(a\s+repeat request with no new commits\), review the whole PR/,
  );
  assert.match(prompt, /still open goes back in `### Blocking` without a new thread/);
  // Every inline thread blocks the merge (conversation resolution), so only blocking findings go inline.
  assert.match(prompt, /never post a non-blocking finding inline/);
  // Severity drives the verdict: only open blocking findings request changes.
  assert.ok(prompt.includes('`[blocking]` or `[non-blocking]`'));
  assert.ok(prompt.includes('`request changes` only when at least one blocking'));
  // Stale docs stay a merge blocker (owner decision, 2026-09-29).
  assert.match(prompt, /or stale\s+documentation/);
  assert.match(prompt, /Stale docs are\s+blocking/);
  // Superseded data-model guidance must not return as an invariant to enforce.
  assert.ok(!/ImportRecord is immutable|Reference is system-scoped/.test(prompt));
  assert.ok(prompt.includes('Do not execute PR scripts'));
  assert.ok(prompt.includes('npm run build:lib'));
  assert.ok(prompt.includes('npx ng test --project @ngm-dev/mat-exp --watch=false'));
  assert.ok(!prompt.includes('dotnet test'));
});

const usageStep = job.steps.find((s) => s.name === 'Record review usage');

async function recordUsage(file) {
  const lines = [],
    warnings = [];
  const summary = {
    addHeading: (text) => (lines.push(text), summary),
    addRaw: (text) => (lines.push(text), summary),
    addTable: (rows) => (lines.push(JSON.stringify(rows)), summary),
    write: async () => summary,
  };
  const core = { summary, info: () => {}, warning: (message) => warnings.push(message) };
  const previous = process.env.EXECUTION_FILE;
  process.env.EXECUTION_FILE = file ?? '';
  try {
    await new AsyncFunction('core', 'require', usageStep.with.script)(core, require);
  } finally {
    process.env.EXECUTION_FILE = previous;
  }
  return { text: lines.join('\n'), warnings };
}

test('review usage is recorded to the job summary and can never fail the job', async () => {
  const { mkdtempSync, writeFileSync } = require('node:fs');
  const { tmpdir } = require('node:os');
  const { join } = require('node:path');
  const index = job.steps.indexOf(usageStep);
  assert.ok(index > job.steps.indexOf(action));
  assert.equal(job.steps[index + 1].name, 'Verify review delivery');
  assert.equal(usageStep.env.EXECUTION_FILE, '${{ steps.claude-review.outputs.execution_file }}');

  const dir = mkdtempSync(join(tmpdir(), 'claude-usage-'));
  const file = join(dir, 'execution.json');
  writeFileSync(
    file,
    JSON.stringify([
      { type: 'system', subtype: 'init', model: 'claude-sonnet-5-5' },
      {
        type: 'result',
        num_turns: 12,
        duration_ms: 95000,
        total_cost_usd: 0.4123,
        modelUsage: {
          'claude-sonnet-5-5': {
            inputTokens: 1200,
            outputTokens: 5400,
            thinkingTokens: 2100,
            cacheReadInputTokens: 180000,
            cacheCreationInputTokens: 42000,
            costUSD: 0.4001,
          },
        },
      },
    ]),
  );
  const recorded = await recordUsage(file);
  assert.deepEqual(recorded.warnings, []);
  for (const fragment of [
    'Session model: claude-sonnet-5-5',
    'turns: 12',
    'duration: 95s',
    '$0.4123',
    '180,000',
    '2,100',
    '$0.4001',
  ])
    assert.ok(recorded.text.includes(fragment), fragment);

  writeFileSync(file, '{not json');
  assert.equal((await recordUsage(file)).warnings.length, 1);
  assert.deepEqual(await recordUsage(undefined), { text: '', warnings: [] });
  assert.deepEqual(await recordUsage(join(dir, 'missing.json')), { text: '', warnings: [] });
});

test('only a delivered final verdict from this run completes the review', async () => {
  const step = job.steps.find((s) => s.name === 'Verify review delivery');
  assert.equal(step.env.EXECUTION_FILE, '${{ steps.claude-review.outputs.execution_file }}');
  assert.equal(
    step.env.REVIEW_RUN_LINK,
    '[Review run](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}/attempts/${{ github.run_attempt }})',
  );
  const marker = '[Review run](https://github.com/example/project/actions/runs/123/attempts/2)';
  assert.equal(step.env.HEAD_SHA, '${{ steps.request.outputs.head_sha }}');
  const cite = `**Reviewed commit:** \`${HEAD}\``;
  const comment = {
    user: { login: 'claude[bot]' },
    body: `${cite}\n**Verdict:** approve\n${marker}`,
  };
  async function verify(comments, executionFile = '/tmp/executed.json') {
    const listComments = () => {};
    const github = {
      rest: { issues: { listComments } },
      paginate: async (method, args) => {
        assert.equal(method, listComments);
        assert.equal(args.issue_number, 42);
        assert.equal(args.per_page, 100);
        // The action strips HTML comments from outgoing MCP updates.
        return comments.map((c) => ({ ...c, body: c.body?.replace(/<!--[\s\S]*?-->/g, '') }));
      },
    };
    await new AsyncFunction('github', 'context', 'process', step.with.script)(
      github,
      { repo: { owner: 'example', repo: 'project' }, issue: { number: 42 } },
      { env: { EXECUTION_FILE: executionFile, REVIEW_RUN_LINK: marker, HEAD_SHA: HEAD } },
    );
  }
  await assert.rejects(verify([comment], ''), /did not execute/);
  for (const comments of [
    [],
    [{ ...comment, body: 'Claude Code is working...' }],
    [{ ...comment, body: marker }],
    [{ ...comment, body: 'Verdict: approve' }],
    [{ ...comment, body: comment.body.replace('/2)', '/1)') }],
    [{ ...comment, user: { login: 'maintainer' } }],
    // A verdict with trailing reasoning, a missing citation, or a citation of
    // anything but the head (blob hash, older commit, short SHA) is not delivered.
    [{ ...comment, body: `${cite}\nVerdict: approve — looks good\n${marker}` }],
    [{ ...comment, body: `Verdict: approve\n${marker}` }],
    [{ ...comment, body: `Reviewed commit: \`f7005868a\`\nVerdict: approve\n${marker}` }],
    [{ ...comment, body: `Reviewed commit: ${HEAD.slice(0, 7)}\nVerdict: approve\n${marker}` }],
  ])
    await assert.rejects(verify(comments), /did not deliver/);
  for (const verdict of ['approve', 'request changes', 'comment only']) {
    await verify([{ ...comment, body: `${cite}\nVerdict: **${verdict}**\n${marker}` }]);
  }
  await verify([{ ...comment, body: `Reviewed commit: ${HEAD}\nVerdict: approve\n${marker}` }]);
  // A completed native progress comment can be after the first page.
  await verify([...Array(100).fill({ body: 'older discussion' }), comment]);
  assert.ok(!JSON.stringify(workflow).includes('claude-review/policy'));
});
