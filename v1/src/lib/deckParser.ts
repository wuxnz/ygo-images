export interface ParsedDeck {
  main: number[];
  extra: number[];
  side: number[];
}

/**
 * Parses the text content of a .ydk Yu-Gi-Oh! deck file.
 * Very small & fast implementation that only understands the
 * `#main`, `#extra`, `!side` (or `#side`) section markers.
 * Lines that cannot be parsed into integers are ignored.
 */
export function parseYdk(content: string): ParsedDeck {
  const lines = content.split(/\r?\n/);

  const main: number[] = [];
  const extra: number[] = [];
  const side: number[] = [];

  // 0 = before any marker (main by default),
  // 1 = inside main, 2 = inside extra, 3 = inside side
  let section: 1 | 2 | 3 = 1;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith("#main")) {
      section = 1;
      continue;
    }
    if (line.startsWith("#extra")) {
      section = 2;
      continue;
    }
    if (line.startsWith("#side") || line.startsWith("!side")) {
      section = 3;
      continue;
    }

    // card id lines are numeric strings
    const id = Number.parseInt(line, 10);
    if (Number.isNaN(id)) continue;

    if (section === 1) main.push(id);
    else if (section === 2) extra.push(id);
    else side.push(id);
  }

  return { main, extra, side };
}
