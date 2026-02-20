import { gatherGit } from "./git.js";
import { gatherTodos } from "./todos.js";
import { gatherProject } from "./project.js";
import { sanitizeArray } from "./privacy.js";

export type GatheredContext = {
  project_name?: string;
  recent_commits?: string[];
  active_todos?: string[];
  stack?: string[];
  status_hint?: string;
  personality?: string;
  dirty_files?: number;
  commits_ahead?: number;
};

export function gatherContext(
  cwd: string,
  personality: string
): GatheredContext {
  const git = gatherGit();
  const todos = gatherTodos(cwd);
  const project = gatherProject(cwd);

  const ctx: GatheredContext = {};

  // Project name: prefer package.json, fallback to git repo name
  const projectName = project.name || git.repo_name;
  if (projectName) ctx.project_name = projectName;

  // Recent commits (sanitized)
  if (git.recent_commits.length > 0) {
    ctx.recent_commits = sanitizeArray(git.recent_commits);
  }

  // Active TODOs (sanitized)
  if (todos.length > 0) {
    ctx.active_todos = sanitizeArray(todos);
  }

  // Tech stack
  if (project.stack.length > 0) {
    ctx.stack = project.stack;
  }

  // Git working state
  if (git.dirty_files > 0) {
    ctx.dirty_files = git.dirty_files;
  }
  if (git.commits_ahead > 0) {
    ctx.commits_ahead = git.commits_ahead;
  }

  // Build a status hint from git branch + state
  const hints: string[] = [];
  if (git.branch && git.branch !== "main" && git.branch !== "master") {
    const branchHint = git.branch
      .replace(/^(feat|feature|fix|chore|refactor|hotfix)\//i, "")
      .replace(/[-_]/g, " ");
    hints.push(`Working on: ${branchHint}`);
  }
  if (git.dirty_files > 0) {
    hints.push(`${git.dirty_files} files changed`);
  }
  if (git.commits_ahead > 0) {
    hints.push(`${git.commits_ahead} commits ahead of upstream`);
  }
  if (hints.length > 0) {
    ctx.status_hint = hints.join(", ");
  }

  // Personality
  ctx.personality = personality;

  // Enforce total payload size
  const serialized = JSON.stringify(ctx);
  if (serialized.length > 2000) {
    if (ctx.recent_commits) ctx.recent_commits = ctx.recent_commits.slice(0, 3);
    if (ctx.active_todos) ctx.active_todos = ctx.active_todos.slice(0, 3);
  }

  return ctx;
}

export function formatContextForDryRun(ctx: GatheredContext): string {
  const lines: string[] = [];

  if (ctx.project_name) lines.push(`  project:    ${ctx.project_name}`);
  if (ctx.stack?.length) lines.push(`  stack:      ${ctx.stack.join(", ")}`);
  if (ctx.dirty_files) lines.push(`  changed:    ${ctx.dirty_files} files`);
  if (ctx.commits_ahead) lines.push(`  ahead:      ${ctx.commits_ahead} commits`);
  if (ctx.recent_commits?.length) {
    lines.push(`  commits:`);
    ctx.recent_commits.forEach((c) => lines.push(`    - ${c}`));
  }
  if (ctx.active_todos?.length) {
    lines.push(`  todos:`);
    ctx.active_todos.forEach((t) => lines.push(`    - ${t}`));
  }
  if (ctx.status_hint) lines.push(`  status:     ${ctx.status_hint}`);
  if (ctx.personality) lines.push(`  personality: ${ctx.personality}`);

  return lines.join("\n");
}

export function isContextEmpty(ctx: GatheredContext): boolean {
  return (
    !ctx.project_name &&
    !ctx.recent_commits?.length &&
    !ctx.active_todos?.length &&
    !ctx.stack?.length
  );
}
