import "@testing-library/jest-dom";
import { vi } from "vitest";
import enMessages from "./messages/en.json";

// Resolve a dotted key like "wizard.create.title" against the EN dictionary.
// Returning real strings keeps existing test assertions (which check for
// English text) passing without rewriting every test.
function lookup(messages: unknown, path: string): string | undefined {
  return path.split(".").reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === "object" && segment in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[segment];
    }
    return undefined;
  }, messages) as string | undefined;
}

// Parse a `{var, plural, one {…} other {…}}` ICU block at position `start`,
// where `template[start]` is the opening `{`. Returns the matching close index
// (1 past the `}`) and the resolved string for the given count.
function parseIcuBlock(
  template: string,
  start: number,
  values: Record<string, unknown>,
): { end: number; output: string } | null {
  let depth = 0;
  let end = -1;
  for (let i = start; i < template.length; i++) {
    if (template[i] === "{") depth++;
    else if (template[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end === -1) return null;
  const inner = template.slice(start + 1, end - 1);
  const headerMatch = inner.match(/^(\w+)\s*,\s*plural\s*,\s*/);
  if (!headerMatch) return null;
  const varName = headerMatch[1];
  const count = Number(values[varName]);
  const body = inner.slice(headerMatch[0].length);

  // Walk branches: `name {body}` or `=N {body}`.
  let i = 0;
  let chosen: string | null = null;
  let fallback: string | null = null;
  while (i < body.length) {
    while (i < body.length && /\s/.test(body[i])) i++;
    const labelMatch = body.slice(i).match(/^(=\d+|\w+)\s*\{/);
    if (!labelMatch) break;
    const label = labelMatch[1];
    i += labelMatch[0].length;
    let depth2 = 1;
    const bodyStart = i;
    while (i < body.length && depth2 > 0) {
      if (body[i] === "{") depth2++;
      else if (body[i] === "}") depth2--;
      if (depth2 > 0) i++;
    }
    const branchBody = body.slice(bodyStart, i);
    i++;

    if (label === "other") fallback = branchBody;
    if (label === `=${count}`) chosen = branchBody;
    if (label === "one" && count === 1) chosen = branchBody;
    if (label === "zero" && count === 0) chosen = branchBody;
  }
  const resolved = (chosen ?? fallback ?? "").replace(/#/g, String(count));
  return { end, output: resolved };
}

function interpolate(template: string, values?: Record<string, unknown>): string {
  if (!values) return template;
  let output = "";
  let i = 0;
  while (i < template.length) {
    if (template[i] === "{") {
      const block = parseIcuBlock(template, i, values);
      if (block) {
        output += interpolate(block.output, values);
        i = block.end;
        continue;
      }
      const close = template.indexOf("}", i);
      if (close === -1) {
        output += template.slice(i);
        break;
      }
      const inside = template.slice(i + 1, close).trim();
      output += values[inside] !== undefined ? String(values[inside]) : `{${inside}}`;
      i = close + 1;
    } else {
      output += template[i];
      i++;
    }
  }
  return output;
}

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useTranslations: (namespace?: string) => {
      const fn = (key: string, values?: Record<string, unknown>) => {
        const fullPath = namespace ? `${namespace}.${key}` : key;
        const template = lookup(enMessages, fullPath) ?? fullPath;
        return interpolate(template, values);
      };
      fn.rich = (key: string) => {
        const fullPath = namespace ? `${namespace}.${key}` : key;
        return lookup(enMessages, fullPath) ?? fullPath;
      };
      return fn;
    },
    useLocale: () => "en",
  };
});

vi.mock("next-intl/server", async () => {
  const actual =
    await vi.importActual<typeof import("next-intl/server")>("next-intl/server");
  return {
    ...actual,
    getTranslations: async (
      arg?: string | { locale?: string; namespace?: string },
    ) => {
      const namespace =
        typeof arg === "string" ? arg : arg?.namespace ?? undefined;
      const fn = (key: string, values?: Record<string, unknown>) => {
        const fullPath = namespace ? `${namespace}.${key}` : key;
        const template = lookup(enMessages, fullPath) ?? fullPath;
        return interpolate(template, values);
      };
      fn.rich = (key: string) => {
        const fullPath = namespace ? `${namespace}.${key}` : key;
        return lookup(enMessages, fullPath) ?? fullPath;
      };
      return fn;
    },
    setRequestLocale: () => {},
  };
});

vi.mock("@/i18n/navigation", async () => {
  const NextLink = (await import("next/link")).default;
  const { usePathname, useRouter } = await import("next/navigation");
  return {
    Link: NextLink,
    usePathname,
    useRouter,
    redirect: () => {},
    getPathname: ({ href }: { href: string }) => href,
  };
});
