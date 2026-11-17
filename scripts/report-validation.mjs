import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { stripVTControlCharacters } from 'node:util';

const logs = ['content.log', 'lint.log', 'build.log', 'browser.log', 'container.log'];

/** Keep diagnostic text literal, bounded, and readable through the Checks API. */
export function validationSummary(directory = process.cwd()) {
  const sections = logs.map((name) => {
    const perLogLimit = name === 'browser.log' ? 30000 : 4000;
    let value;
    try {
      value = readFileSync(join(directory, name), 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      return `### ${name}\n\nNo log was produced; this command may not have run.`;
    }
    // Remove terminal control sequences, and prevent log text from terminating
    // its Markdown code block or being interpreted as embedded HTML.
    value = stripVTControlCharacters(value)
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('`', '\u02cb');
    if (value.length > perLogLimit) value = `[Earlier output omitted; showing the final ${perLogLimit} characters.]\n${value.slice(-perLogLimit)}`;
    return `### ${name}\n\n\`\`\`text\n${value.trimEnd()}\n\`\`\``;
  });
  return ['Command output from this validation run. The **validate** job remains the authoritative result.', ...sections].join('\n\n');
}

export async function publishValidation(environment = process.env, fetchRequest = globalThis.fetch) {
  const { GITHUB_TOKEN: token, GITHUB_REPOSITORY: repository, REPORT_SHA: sha } = environment;
  if (!token || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository ?? '') || !/^[a-f0-9]{40}$/i.test(sha ?? '')) {
    throw new Error('Validation reporting requires a token, repository, and full commit SHA.');
  }
  const status = environment.REPORT_STATUS;
  const conclusion = status === 'success' ? 'success' : status === 'cancelled' ? 'cancelled' : 'failure';
  const api = (environment.GITHUB_API_URL || 'https://api.github.com').replace(/\/$/, '');
  const result = await fetchRequest(`${api}/repos/${repository}/check-runs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      name: 'Validation details',
      head_sha: sha,
      status: 'completed',
      conclusion,
      details_url: `${environment.GITHUB_SERVER_URL || 'https://github.com'}/${repository}/actions/runs/${environment.GITHUB_RUN_ID}`,
      output: {
        title: `Validation ${conclusion}`,
        summary: validationSummary(),
      },
    }),
  });
  if (!result.ok) throw new Error(`Publishing validation details failed (HTTP ${result.status}).`);
  process.stdout.write('Published Validation details to the commit checks.\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  publishValidation().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
