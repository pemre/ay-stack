/**
 * Baseline CSS custom-property resolver.
 *
 * Reads one or more CSS texts, collects the custom properties declared in
 * root-level blocks (`:root`, `:host`, `@theme` / `@theme static`) and in
 * dark-theme blocks (`[data-theme="dark"]`), then follows every `var()` chain
 * down to a literal value.
 *
 * Contract (design.md — "Baseline resolver (`tools/tokens/`)"):
 *   parseBlocks(cssTexts)   → { root: Map, dark: Map }   raw declared values
 *   resolveAll(decls)       → Map                        var() chains flattened
 *   resolveThemes(cssTexts) → { light, dark }             both themes resolved
 *
 * Semantics:
 *  - `var(--x, fallback)` uses the declared value of `--x` when `--x` exists in
 *    the declaration map, and the fallback when it does not. A missing name with
 *    no fallback is an error, not an empty string.
 *  - Dark is resolved as an overlay on root, so a property the dark block does
 *    not redeclare (notably `--accent-a66`) resolves the way the CSS cascade
 *    resolves it: through the root declaration, but against dark's overrides.
 *  - Reference cycles throw, naming the full chain.
 *  - Values are never rewritten beyond whitespace collapsing, so hex and rgba()
 *    notation is preserved verbatim.
 *
 * No dependencies. Plain Node ESM.
 */

const ROOT = "root";
const DARK = "dark";

/** Strip `/* … *\/` comments. */
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Index of the `)` matching the `(` at `openIdx`. Throws when unbalanced. */
function matchParen(text, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") {
      depth--;
      if (depth === 0) return i;
    }
  }
  throw new Error(`Unbalanced parenthesis in CSS value: ${text.slice(openIdx, openIdx + 60)}`);
}

/** Index of the next `var(` token at or after `from`, or -1. */
function findVar(text, from) {
  let i = from;
  while (i < text.length) {
    const idx = text.indexOf("var(", i);
    if (idx === -1) return -1;
    const prev = idx === 0 ? "" : text[idx - 1];
    // `var(` must not be the tail of a longer identifier such as `--myvar(`.
    if (!/[\w-]/.test(prev)) return idx;
    i = idx + 4;
  }
  return -1;
}

/** Split the inside of a `var(…)` into [name, fallback|undefined]. */
function splitVarArgs(inner) {
  let depth = 0;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "," && depth === 0) {
      return [inner.slice(0, i).trim(), inner.slice(i + 1).trim()];
    }
  }
  return [inner.trim(), undefined];
}

/**
 * Which declaration map(s) a block prelude targets.
 * Returns a subset of ["root", "dark"]; an empty array means "ignore".
 */
function classifyPrelude(prelude) {
  const p = prelude.trim();
  if (p.startsWith("@")) {
    // `@theme { … }` / `@theme static { … }` declare root-level theme variables.
    return /^@theme\b/.test(p) ? [ROOT] : [];
  }
  const targets = [];
  for (const raw of p.split(",")) {
    const sel = raw.trim();
    if (!sel) continue;
    if (/\[data-theme\s*=\s*["']?dark["']?\]/.test(sel)) {
      if (!targets.includes(DARK)) targets.push(DARK);
    } else if (sel === ":root" || sel === ":host") {
      if (!targets.includes(ROOT)) targets.push(ROOT);
    }
  }
  return targets;
}

/** At-rules whose bodies contain further rule blocks rather than declarations. */
function isNestingAtRule(prelude) {
  return /^@(media|supports|layer|container|scope)\b/.test(prelude.trim());
}

/** Walk the top-level `prelude { body }` blocks of a stylesheet. */
function* iterateBlocks(css) {
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open === -1) return;
    const rawPrelude = css.slice(i, open);
    // Drop anything before the last statement terminator (e.g. a preceding
    // `@import "…";`) so the prelude is just this block's selector.
    const prelude = rawPrelude.slice(rawPrelude.lastIndexOf(";") + 1).trim();

    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") depth--;
      j++;
    }
    const body = css.slice(open + 1, depth === 0 ? j - 1 : css.length);
    yield { prelude, body };
    i = j;
  }
}

/** Extract `--name: value` pairs from a block body, ignoring nested blocks. */
function parseDeclarations(body) {
  const decls = [];
  let buf = "";
  let paren = 0;
  let brace = 0;

  const flush = () => {
    const text = buf.trim();
    buf = "";
    if (!text.startsWith("--")) return;
    const colon = text.indexOf(":");
    if (colon === -1) return;
    const name = text.slice(0, colon).trim();
    const value = text.slice(colon + 1).trim();
    if (name.startsWith("--") && name.length > 2) decls.push([name, value]);
  };

  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (brace > 0) {
      if (ch === "{") brace++;
      else if (ch === "}") brace--;
      continue;
    }
    if (ch === "{") {
      brace++;
      buf = "";
      continue;
    }
    if (ch === "(") paren++;
    else if (ch === ")") paren--;
    else if (ch === ";" && paren === 0) {
      flush();
      continue;
    }
    buf += ch;
  }
  flush();
  return decls;
}

/**
 * Parse declarations out of the `:root` / `[data-theme="dark"]` / `@theme`
 * blocks of one or more CSS texts. Later declarations of the same name win,
 * matching the CSS cascade for a stylesheet chain.
 *
 * @param {string[]} cssTexts
 * @returns {{ root: Map<string,string>, dark: Map<string,string> }}
 */
export function parseBlocks(cssTexts) {
  const root = new Map();
  const dark = new Map();
  const maps = { [ROOT]: root, [DARK]: dark };

  const visit = (css) => {
    for (const { prelude, body } of iterateBlocks(css)) {
      if (isNestingAtRule(prelude)) {
        visit(body);
        continue;
      }
      const targets = classifyPrelude(prelude);
      if (targets.length === 0) continue;
      const decls = parseDeclarations(body);
      for (const target of targets) {
        for (const [name, value] of decls) maps[target].set(name, value);
      }
    }
  };

  for (const css of cssTexts) visit(stripComments(css));
  return { root, dark };
}

/**
 * Follow every `var()` chain to a literal.
 *
 * @param {Map<string,string>} decls
 * @returns {Map<string,string>} resolved values, keyed in sorted name order
 * @throws when a chain cycles or references an undeclared name with no fallback
 */
export function resolveAll(decls) {
  const resolved = new Map();
  const stack = [];

  const substitute = (value, owner) => {
    let out = "";
    let i = 0;
    for (;;) {
      const idx = findVar(value, i);
      if (idx === -1) {
        out += value.slice(i);
        break;
      }
      out += value.slice(i, idx);
      const close = matchParen(value, idx + 3);
      const [refName, fallback] = splitVarArgs(value.slice(idx + 4, close));

      if (decls.has(refName)) {
        out += resolveName(refName);
      } else if (fallback !== undefined) {
        out += substitute(fallback, owner);
      } else {
        throw new Error(
          `Unresolvable custom property ${refName}` +
            (owner ? ` referenced by ${owner}` : "") +
            " (not declared and no fallback given)",
        );
      }
      i = close + 1;
    }
    return out;
  };

  const resolveName = (name) => {
    if (resolved.has(name)) return resolved.get(name);
    if (stack.includes(name)) {
      throw new Error(`Cyclic custom property reference: ${[...stack, name].join(" -> ")}`);
    }
    stack.push(name);
    try {
      const literal = substitute(decls.get(name), name).replace(/\s+/g, " ").trim();
      if (findVar(literal, 0) !== -1) {
        throw new Error(`Resolution left an unresolved var() in ${name}: ${literal}`);
      }
      resolved.set(name, literal);
      return literal;
    } finally {
      stack.pop();
    }
  };

  for (const name of decls.keys()) resolveName(name);

  return new Map([...resolved].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

const toObject = (map) => Object.fromEntries(map);

/**
 * Both themes resolved. Dark is `resolveAll(root overlaid with dark)`, so a
 * property the dark block does not redeclare still resolves — through the root
 * declaration, but against dark's overrides.
 *
 * @param {string[]} cssTexts
 * @returns {{ light: Record<string,string>, dark: Record<string,string> }}
 */
export function resolveThemes(cssTexts) {
  const { root, dark } = parseBlocks(cssTexts);
  const overlay = new Map(root);
  for (const [name, value] of dark) overlay.set(name, value);
  return {
    light: toObject(resolveAll(root)),
    dark: toObject(resolveAll(overlay)),
  };
}
