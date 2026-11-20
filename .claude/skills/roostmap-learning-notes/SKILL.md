---
name: roostmap-learning-notes
description: Rules for planning, drafting, expanding, reviewing or revising any Step in RoostMap's docs/steps.md learning notes. Use before writing a Step outline, expanding a section, editing an existing note section or reviewing a note draft, so every Step follows the same narrative structure, knowledge boundary and style.
---

# RoostMap learning-note rules

`docs/steps.md` is a chronological learning note. It is written for a learner who meets the work in order, including readers other than the owner. It explains a real development process; it is not an operation manual, a configuration checklist or a record of the conversation that produced it.

These rules add detail to `AGENTS.md` Sections 6, 7, 13 and 14. When they conflict, `AGENTS.md` and the owner's latest instruction win.

## 1. Before writing

1. Re-read `AGENTS.md`, and the Step's entry in `docs/DEVELOPMENT_OUTLINE.md`.
2. Read the relevant parts of `docs/PROJECT_DESIGN.md` and `docs/TECHNICAL_SPEC.md`. Write to the approved baseline, not to an older note.
3. Read the end of the previous Step, including its conclusion and status block, and every section of the current Step written so far.
4. Inspect the real evidence: source files, scripts, fixtures, generated reports and the owner's real command output. Never invent an output, count, file name or result.
5. Identify the knowledge boundary: the exact Step and section being written. Everything after it is unknown.

## 2. Workflow: outline first, then one section at a time

1. **Step outline.** Before any section body is written, produce the outline of the whole Step:
   - the single development carrier: one feature slice, data flow, PR or delivery pipeline;
   - the real starting point, the problem being solved and the completed outcome;
   - numbered `###` sections and the `####` subsections planned inside each;
   - for each section, one line saying what problem it solves and what result it hands to the next section.
   
   Check the causal order: each section must need only what earlier sections produced. Get the owner's approval before expanding.
2. **Expand one section at a time.** Write only the section the owner asks for. Stop when that section reaches its own result. Do not draft later sections in advance.
3. **Real results only.** Where a section needs command output or test results, give the command, explain the expected effect, and wait for the owner's real output. Record that output, not an assumed one. A section is complete only after its validation has really run. When files are synchronised for the owner, advance them section by section so that each section's validation produces its own real output.
4. **Revise from evidence.** If a real result contradicts the plan, revise the current section and, when needed, the remaining outline. Record a useful mistake and its fix as part of the narrative, without describing the discussion.

## 3. Step structure and formatting

Match the completed Steps 01 to 07:

~~~text
## Step NN · <Chinese title from DEVELOPMENT_OUTLINE.md>

### 这一步做什么
<the result the previous Step established → the problem it leaves → why the
 current state is insufficient → the scope of this Step → a text-block flow of
 the whole Step → the outcome that should exist at the end, with no results yet>

### 1. <create the branch, with a short reason for the branch name>
### 2. ... numbered sections in causal order
#### 2.1 ... subsections when a section has several stages
### N. <verify the complete result and complete the Git operations>

### Step NN 完成状态
<a text block with one "✅ <verifiable outcome>" per line>
~~~

- Headings are short natural Chinese phrases that describe the current stage, such as `### 3. 组合地图边界和租金数据`. They are not questions, slogans or bare technology names.
- Prose is in Chinese. File names, identifiers, commands, types and commit messages stay in English. Technical terms may stay in English.
- Use ```text blocks for data flows, tool responsibilities, fixed parameters and expected output. Use ```bash for commands, and ```ts, ```tsx, ```js, ```json or ```yaml for code and data.
- Introduce real output with a short line, such as `输出为：` or `结果为：`, then explain what the output proves.
- When a code change grows step by step, show only the new part. Name the file when it is first created, and describe where a fragment belongs through its role in the logic ("函数的第二部分……", "先……再……"), not through placement instructions. Show the complete current version of a block only when partial snippets would be ambiguous.
- Later test outputs in the same file may be shortened to the new tests and the totals, marking the omission as `……（3.3 的 2 个测试省略）`. Keep the first and the final complete outputs in full.
- Use a separator line `---` only between Steps.
- When a Step is complete, every item in its status block is `✅`. A Step that is still in progress keeps `⬜` or has no status items yet.

## 4. Narrative rules

### One causal through-line

Each section follows, where applicable:

```text
the result established immediately before
→ the current problem, or why the existing behaviour is insufficient
→ the concept and mechanism needed
→ the chosen implementation
→ the observable result and its validation
```

- Open each section from the fact that the previous section established. The topic must not change abruptly.
- Order work by real technical and product dependency, not by technology category.
- Include only operations that advance the current through-line. Move unrelated configuration to the Step where it becomes necessary.
- Before any command or code, say why it is needed and what effect to expect.

### Code grows with the narrative

A note does not present a finished file in pieces. The final file is the result of the steps; it does not exist before them.

- Every code block contains only what the current step needs: no import, constant, type, field, parameter, section-header comment or helper that a later step will use. Add each one in the step that first needs it, and say why it is needed.
- Never copy fragments out of the finished file. Write each fragment from the current step's need, then check that the fragments assemble to the real file's logic.
- Introduce code in the same place as its explanation. When a section solves several sub-problems, give each sub-problem its code right after its explanation instead of one block at the end. Larger functions grow part by part.
- Explain purpose, concept and new syntax before the code block. After the block, keep only explanations that need the code in view, such as a rule-by-rule reading of a schema.
- Lead into code with the reasoning, for example "因此，两种记录各定义一个转换函数……", "这个计算与具体区域无关，可以封装成工具函数 `sameQuarterLastYear`：", "调用 `buildCurrentRent` 得到当前租金……". Do not lead in with placement commands such as "在 X 之后加入：" or a bare "创建 `file`：".
- Do not give a separate code block for a mechanical change, such as adding one name to an import. Mention it in the sentence that introduces the code that needs it.
- Code in the note does not have to match the file comment for comment. Remove comments that repeat the surrounding prose, style-only additions such as JSDoc and section-header comments, and anything else the narrative does not use. Keep comments that carry information found nowhere else, such as which case each test assertion covers. The code logic must stay identical to the real file.
- When code is removed from a note, remove every explanation that referred to it.
- Prefer explicit forms that show what is happening, such as `rows.map((row) => toArea(row))` instead of `rows.map(toArea)`.
- Extract a helper function only when the logic is independent of the current data or is reused. Keep a function's own steps inside it; do not wrap internal logic in nested helpers.

### Concrete names and data defined by need

- Name data, types, functions and variables with concrete domain words that say what they hold, for example `quarterlyRents`, `currentRent`, `AreaWithCurrentRent`. Avoid abstract or statistical labels such as slice, observation, summary, history or metric when a concrete word exists.
- Use one term for one thing throughout the note. When a name changes, update every sentence that used the old term.
- Before defining data, state what the page or consumer needs and where each value comes from. A short structure diagram of the data being defined helps the learner see the model before the code.
- Define only the contracts, types and fields the current step consumes. Do not add fields, categories, arrays or types for later features; extend the model in the step that needs it and explain the extension there.

### Tests in the narrative

Each test part follows the same reasoning order:

```text
what is checked and against which known answer
→ the preparation the tests need (fixtures, helpers, a shared result)
→ new testing APIs (toEqual, toMatchObject, safeParse and similar)
→ the code
→ run → real output → a one- or two-sentence conclusion with its scope
```

- Hand-derived answers are written once. Later test parts refer to them, and test comments carry the per-case detail, instead of repeating answer tables.
- Test data uses only facts established earlier in the note. Values discovered or calculated later are described as valid sample values, not as checked facts.

### Explain concepts at first use

When a concept first appears, explain, in the RoostMap context:

- what it is;
- how it behaves;
- why it is needed here;
- how it relates to the surrounding code.

A learner must be able to explain the reason and the mechanism in their own words. Give only the explanation the current narrative needs. Do not add generic background or encyclopaedic detail.

### Knowledge boundary: no spoilers

- Use only facts established earlier in the note, plus what the current section introduces.
- Do not name later sections or later Steps. Do not justify the current work with later results, and do not write "后面会", "下一节将", "为后续准备" or similar.
- Explain a scope limit with current reasons, for example "本步只处理一个 Region，因为……", not by assigning the excluded work to a later Step.
- Before saving, read the section as if every later section were hidden. Rewrite any sentence that needs later knowledge to make sense.
- Do not explain code that the current step does not contain, such as how a later reader will use a value.

### No discussion traces

- The note reads as one developer's real, forward-moving process. Never mention the assistant, the conversation, reviews, reconsidered options, or "根据讨论" / "我们决定".
- Rewording a conversational detour into neutral prose does not make it learning material. Remove it unless it changes the current explanation, decision or validation.
- An approved design decision is presented through its engineering reason and its evidence, such as profiling output, measurements or a source-data property. It is not presented as the outcome of a discussion.
- A real mistake made during implementation is kept when it teaches something: show the error, the diagnosis and the fix in their real order.
- Check intent, not only wording. Remove a sentence whose purpose is to answer a question raised in the discussion but not raised by the narrative, to defend against an alternative the reader has never seen, or to justify why something was removed or not encapsulated.
- Do not describe the note itself, for example "笔记中不再列出" or "写在测试代码的注释中".

### Minimal sufficient detail

- Remove generic introductions, repeated conclusions, templated transitions and facts that do not serve the current task.
- Keep necessary context and causal links. Brevity must not leave instructions unexplained.
- Test each paragraph: if removing it loses no context, reasoning, action or evidence the current section needs, remove it.
- Do not state the same plan twice, for example as both bullet points and a flow diagram, or as an overview list followed by the same items in detail.

### Honest verification

- Never present an unexecuted command, test, build, deployment or manual check as successful.
- State the scope of each conclusion, for example "这个结论只说明……".
- Follow `AGENTS.md`: the owner performs commands, Git, installation and deployment. The note records the owner's real results.

## 5. Quality gate before presenting or saving

Check every item for the changed section. If any item fails, revise before presenting:

1. One real problem or behaviour carries the whole section.
2. Observation, cause, mechanism, implementation and validation appear in causal order. A stage is omitted only when it genuinely does not apply.
3. The section starts from the fact established immediately before it.
4. Every new concept is explained at first use, in the RoostMap context.
5. Code and commands come after their purpose. The section is not a runbook: lead-ins state reasoning, not placement commands, and no code block exists only for a mechanical edit.
6. Every code block contains only what its step needs, and the fragments assemble to the real file's logic.
7. Comments and explanations do not repeat each other, and no explanation refers to code that is not shown.
8. Names are concrete, terms are consistent, and the data model contains only what this step consumes.
9. No trace of discussion, drafting, review or rejected alternatives remains, in wording or in intent.
10. No repeated conclusions, templated paragraphs or generic background remain.
11. Nothing crosses the knowledge boundary.
12. No result is claimed that was not really produced.
13. Headings are concise and describe the stage.
14. Re-read from the learner's position: someone who knows only the note up to this point can follow and explain the section.

For a Step outline, also check that:

- the Step has one carrier;
- the sections follow real dependencies, so that no section needs a later section's result;
- every planned section serves the Step's acceptance criteria in `docs/DEVELOPMENT_OUTLINE.md`;
- no planned work belongs to a later Step.
