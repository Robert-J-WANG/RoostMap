---
name: roostmap-learning-notes
description: Rules for planning, writing, reviewing or revising any Step in RoostMap's docs/steps.md development record. Use before writing a Step outline, writing or editing a note section, or reviewing a note draft, so every Step follows the same structure and reads as a reasoned development record rather than an operation manual.
---

# RoostMap development-record rules

`docs/steps.md` is a chronological development record. It records how each Step was really developed: the problem, the reasoning behind each decision, the key code, the real errors and fixes, and the real verification results. It must be understandable to the owner and to another developer reading it in order.

It is not a polished tutorial: wording is not rewritten for its own sake. It is also never an operation manual, a configuration checklist or a record of the conversation that produced it.

These rules add detail to `AGENTS.md` Sections 6, 7, 13 and 14. When they conflict, `AGENTS.md` and the owner's latest instruction win. Steps 01 to Step 08 §3 were written under the earlier tutorial-level rules and are not revised to match this document.

## 1. Before writing

1. Re-read the Step's entry in `docs/DEVELOPMENT_OUTLINE.md` and the relevant parts of `docs/PROJECT_DESIGN.md` and `docs/TECHNICAL_SPEC.md`. Write to the approved baseline.
2. Read the end of the previous Step and every section of the current Step written so far.
3. Inspect the real evidence: source files, scripts, fixtures, generated reports and the owner's real command output. Never invent an output, count, file name or result.

## 2. Workflow

1. **Short Step outline.** Before the first section is written, list the numbered sections, each with one line naming the problem it solves. The order follows real dependencies. Get the owner's approval.
2. **Code first, then the record.** Within a section, the code is written and its checks are run first. The note section is written afterwards from the working code and the real output, in one pass.
3. **Real results only.** Give the command, wait for the owner's real output, and record that output.
4. **One review round.** Each Step gets at most one review round for the note. The bar is "understandable and correct", not perfect wording. Fix real errors, missing reasons and confusing structure. Do not rewrite for style.

## 3. Step structure and formatting

Keep the structure of the existing Steps:

~~~text
## Step NN · <Chinese title from DEVELOPMENT_OUTLINE.md>

### 这一步做什么
<the starting point → the problem → the scope of this Step → the outcome expected>

### 1. <create the branch, with a short reason for the branch name>
### 2. ... numbered sections in dependency order
#### 2.1 ... subsections when a section has several stages
### N. <verify the complete result and complete the Git operations>

### Step NN 完成状态
<a text block with one "✅ <verifiable outcome>" per line>
~~~

- Headings are short natural Chinese phrases that describe the stage.
- Prose is in Chinese. File names, identifiers, commands, types and commit messages stay in English.
- Use ```text for data flows and output, ```bash for commands, and ```ts, ```tsx, ```js, ```json or ```yaml for code and data.
- Use `---` only between Steps.
- When a Step is complete, every item in its status block is `✅`.

## 4. Core rules: a development record, not an operation manual

These five rules are the baseline. Every section must satisfy them.

1. **Development order.** Each section follows "problem → why this approach → key code → real result". It starts from what the previous section established.
2. **Reason before action.** Explain why a command or code is needed before showing it. A section is never only a list of commands or steps. Lead into code with the reasoning, such as "因此……", not with bare placement instructions such as "在 X 之后加入：".
3. **Real results with scope.** Record only output that was really produced. Each conclusion states what it proves and what it does not.
4. **Consistent names and terms.** Use one term for one thing across the note, the code and the baseline documents. Function names start with a verb; variables, constants and parameters are nouns. Use concrete domain words instead of abstract labels.
5. **No discussion traces and no unhappened results.** Never mention the assistant, the conversation, reviews or rejected options. Never describe future work as done. A real mistake and its fix are kept when they explain something.

## 5. What the record may simplify

- **Key code only.** Show the code that carries the section's logic, with a short explanation. The code is introduced with or right after its explanation. A complete function may be shown once; when a function is shown again, earlier parts may be replaced by a placeholder comment with an ellipsis. Code in the note may omit JSDoc, section-header comments and comments that repeat the prose, but its logic must match the real file.
- **Concepts.** Explain a new concept briefly at first use: what it does and why it is needed here. Skip generic background.
- **Intermediate output.** Record intermediate output only when it shows something: an error, a key count or a changed behaviour. The final verification output of the section is always recorded.
- **Data defined by need.** Define only the contracts, types and fields the current Step consumes. When the model grows, explain the extension where it happens.

## 6. Quality check before saving

1. The section follows "problem → why → key code → real result" and starts from the previous section.
2. Reasons come before commands and code, and the section does not read as a list of operations.
3. Every result was really produced, and its scope is stated.
4. Names and terms are consistent with the code and the baseline documents.
5. No discussion traces, and no unhappened results.
6. Someone reading the note in order can understand what was done and why.
