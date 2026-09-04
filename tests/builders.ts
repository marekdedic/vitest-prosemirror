import { schema as basicSchema } from "prosemirror-schema-basic";
import { builders } from "prosemirror-test-builder";

const built = builders(basicSchema);

// Builders bound to plain prosemirror-schema-basic (not the list-augmented
// superset behind prosemirror-test-builder's pre-exported doc/p). Node builders
// are keyed by their real schema type name, which is also what
// stringifyProseMirrorNode emits — a handful get shorter aliases below.
export const blockquote = built.blockquote;
export const br = built.hard_break;
export const codeBlock = built.code_block;
export const doc = built.doc;
export const em = built.em;
export const heading = built.heading;
export const hr = built.horizontal_rule;
export const img = built.image;
export const p = built.paragraph;
export const strong = built.strong;
