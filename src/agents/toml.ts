const sectionName = (line: string) => line.trim().match(/^\[\[?\s*([^\]]+?)\s*\]\]?/)?.[1];

export function hasTomlTable(raw: string, table: string): boolean {
  return raw.split(/\r?\n/).some((line) => sectionName(line) === table);
}

export function removeTomlTable(raw: string, table: string): string {
  const kept: string[] = [];
  let skipping = false;
  for (const line of raw.split(/\r?\n/)) {
    const name = sectionName(line);
    if (name !== undefined) skipping = name === table || name.startsWith(`${table}.`);
    if (!skipping) kept.push(line);
  }
  return kept.join("\n").replace(/\n{3,}/g, "\n\n");
}

export function appendTomlTable(raw: string, block: string): string {
  const base = raw.trimEnd();
  return `${base}${base ? "\n\n" : ""}${block.trimEnd()}\n`;
}
