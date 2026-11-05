# Token-cost analysis scripts

What they measure and how to rerun them. The findings and the playbook that came out of them are in
the game repo: `doc/ai/champion-league/findings/2026-11-05-token-cost.md`.

They read a Claude Code session transcript (`~/.claude/projects/<project>/<session>.jsonl`) and its
`subagents/` folder. The session path is hard-coded at the top of each script; change it to analyse
another session. Run with `python3 -I <script>` from a scratch folder (they write JSON beside them).

| Script | What it does |
|---|---|
| `usage_main.py <jsonl> <out.json>` | sums input, output, cache-creation and cache-read tokens over the main transcript (unique message ids), by model |
| `usage_sub.py` | the same for every sub-agent transcript, ranked by cache reads, with the first line of each agent's prompt |
| `classify_main.py` | per call: tools used, command summary, timestamps; per tool result: size. Writes `main_classified.json` |
| `analyze_main.py` | context-size distribution, compaction count, cost by day, cost by what each call did |
| `bash_break.py` | splits the Bash calls (polling, shell reading, inline scripts) and ranks tool results by carry cost (size x calls they stayed in context) |
| `attach.py` | sizes of the transcript's attachment types (task reminders, skill listings, deferred-tool lists) |
| `reminder.py`, `reminder_effect.py` | the task-list reminder: its size, and how much context each copy adds (growth on calls where one arrived against calls where none did) |
| `by_task.py` | cost by the task that was `in_progress`; unreliable when tasks are left in_progress for days (it was), use the sub-agent split instead |
| `export_tasks.py` | writes the last task list, with descriptions, to JSON and Markdown |
| `pack_evidence.py` | the script that assembled this folder's parent from the session scratchpad |

Cost units: one fresh input token = 1; a cache read = 0.1; a cache write = 1.25; an output token = 5.
These are the usual ratios, not an invoice: use them to compare, not to bill.
