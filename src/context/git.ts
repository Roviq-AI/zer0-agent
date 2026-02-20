import { execSync } from "child_process";

const EXEC_TIMEOUT = 5_000;

export type GitContext = {
  repo_name: string | null;
  branch: string | null;
  recent_commits: string[];
  dirty_files: number;
  commits_ahead: number;
};

function exec(cmd: string): string {
  try {
    return execSync(cmd, {
      timeout: EXEC_TIMEOUT,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

export function gatherGit(): GitContext {
  const empty: GitContext = {
    repo_name: null,
    branch: null,
    recent_commits: [],
    dirty_files: 0,
    commits_ahead: 0,
  };

  // Check if we're in a git repo
  if (exec("git rev-parse --is-inside-work-tree") !== "true") {
    return empty;
  }

  // Repo name from remote or directory
  let repoName: string | null = null;
  const remoteUrl = exec("git remote get-url origin");
  if (remoteUrl) {
    const match = remoteUrl.match(/\/([^/]+?)(?:\.git)?$/);
    repoName = match?.[1] || null;
  }
  if (!repoName) {
    const topLevel = exec("git rev-parse --show-toplevel");
    if (topLevel) {
      repoName = topLevel.split("/").pop() || null;
    }
  }

  const branch = exec("git branch --show-current") || null;

  // Recent commits with relative timestamps
  const log = exec('git log --oneline --no-decorate -5 --format="%s (%cr)"');
  const recentCommits = log
    ? log.split("\n").filter((line) => line.length > 0)
    : [];

  // Dirty working directory (unstaged + staged + untracked)
  const status = exec("git status --porcelain");
  const dirtyFiles = status ? status.split("\n").filter((l) => l.length > 0).length : 0;

  // Commits ahead of upstream
  let commitsAhead = 0;
  if (branch) {
    const ahead = exec(`git rev-list --count @{upstream}..HEAD`);
    if (ahead && !isNaN(parseInt(ahead))) {
      commitsAhead = parseInt(ahead);
    }
  }

  return { repo_name: repoName, branch, recent_commits: recentCommits, dirty_files: dirtyFiles, commits_ahead: commitsAhead };
}
