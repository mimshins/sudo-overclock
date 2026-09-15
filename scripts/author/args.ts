/*
 * Minimal argv parser for the authoring commands.
 *
 * Positional args are collected in order; `--flag value` pairs go into `flags`.
 * A flag with no following value (or followed by another `--flag`) becomes
 * "true".
 */

type ParsedArgs = {
  readonly positional: readonly string[];
  readonly flags: Readonly<Record<string, string>>;
};

const parseArgs = (argv: readonly string[]): ParsedArgs => {
  const positional: string[] = [];
  const flags: Record<string, string> = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === undefined) continue;

    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[index + 1];
      if (next === undefined || next.startsWith("--")) {
        flags[key] = "true";
      } else {
        flags[key] = next;
        index += 1;
      }
    } else {
      positional.push(arg);
    }
  }

  return { positional, flags };
};

export { parseArgs };
export type { ParsedArgs };
