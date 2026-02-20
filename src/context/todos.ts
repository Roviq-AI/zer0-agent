import { existsSync, readFileSync, lstatSync, realpathSync } from "fs";
import { join, resolve } from "path";

const TODO_FILES = [
  "TODO.md",
  "TODO",
  "todo.md",
  "tasks/todo.md",
  "tasks/TODO.md",
  "TASKS.md",
  ".todo",
];

const MAX_FILE_SIZE = 50_000; // 50KB — don't read huge files

export function gatherTodos(cwd: string): string[] {
  const todos: string[] = [];
  const resolvedCwd = resolve(cwd);

  for (const file of TODO_FILES) {
    const filepath = join(resolvedCwd, file);
    if (!existsSync(filepath)) continue;

    try {
      // SECURITY: Prevent symlink attacks — only read regular files
      // that resolve within the project directory
      const stat = lstatSync(filepath);
      if (stat.isSymbolicLink()) continue;
      if (!stat.isFile()) continue;
      if (stat.size > MAX_FILE_SIZE) continue;

      // Double-check the real path stays within the project
      const realPath = realpathSync(filepath);
      if (!realPath.startsWith(resolvedCwd)) continue;

      const content = readFileSync(filepath, "utf-8");
      const lines = content.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();
        // Match unchecked todo items: - [ ] or * [ ] or just - items
        if (
          trimmed.startsWith("- [ ]") ||
          trimmed.startsWith("* [ ]") ||
          (trimmed.startsWith("- ") && !trimmed.startsWith("- [x]"))
        ) {
          const item = trimmed
            .replace(/^[-*]\s*\[[ ]\]\s*/, "")
            .replace(/^[-*]\s*/, "")
            .trim();
          if (item.length > 0 && item.length < 200) {
            todos.push(item);
          }
        }

        if (todos.length >= 10) break;
      }

      if (todos.length >= 10) break;
    } catch {
      continue;
    }
  }

  return todos.slice(0, 10);
}
