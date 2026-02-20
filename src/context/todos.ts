import { existsSync, readFileSync } from "fs";
import { join } from "path";

const TODO_FILES = [
  "TODO.md",
  "TODO",
  "todo.md",
  "tasks/todo.md",
  "tasks/TODO.md",
  "TASKS.md",
  ".todo",
];

export function gatherTodos(cwd: string): string[] {
  const todos: string[] = [];

  for (const file of TODO_FILES) {
    const filepath = join(cwd, file);
    if (!existsSync(filepath)) continue;

    try {
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
