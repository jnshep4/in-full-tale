#!/usr/bin/env python3
"""Usage meter for one run of the "In Full Tale" build.

Reads this run's Claude Code transcripts and prints

    meter units = input + 1.25 * cache_write + 0.1 * cache_read + 5 * output

What counts as "this run": every transcript (*.jsonl) under
~/.claude/projects/, including subagent transcripts in the per-session
subdirectories. Each weekly run starts in a fresh cloud container, so that
directory holds only the current run. If that ever stops being true, pass
--session <id> (one session plus its subagents) or --since-hours N.

Each assistant message is written to the transcript once per content block,
all sharing one message id and one usage record, so usage is de-duplicated by
message id (keeping the record with the largest output count, which is the
final one when a message was logged mid-stream).

Usage:
    python3 tools/meter.py            # human-readable summary
    python3 tools/meter.py --json     # machine-readable
    python3 tools/meter.py --total    # just the number
"""
import argparse
import glob
import json
import os
import sys
import time

W_INPUT, W_CACHE_WRITE, W_CACHE_READ, W_OUTPUT = 1.0, 1.25, 0.1, 5.0


def transcripts(root, session=None, since_hours=None):
    paths = glob.glob(os.path.join(root, "**", "*.jsonl"), recursive=True)
    if session:
        paths = [p for p in paths if session in p]
    if since_hours is not None:
        cutoff = time.time() - since_hours * 3600
        paths = [p for p in paths if os.path.getmtime(p) >= cutoff]
    return sorted(paths)


def read_usage(path, seen):
    """Fold one transcript's usage into `seen` (message id -> usage dict)."""
    bad = 0
    with open(path, "r", encoding="utf-8", errors="replace") as fh:
        for n, line in enumerate(fh):
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except json.JSONDecodeError:
                bad += 1  # a line still being written; skip it
                continue
            msg = rec.get("message")
            if not isinstance(msg, dict):
                continue
            usage = msg.get("usage")
            if not isinstance(usage, dict):
                continue
            key = msg.get("id") or rec.get("requestId") or f"{path}:{n}"
            row = {
                "input": int(usage.get("input_tokens") or 0),
                "cache_write": int(usage.get("cache_creation_input_tokens") or 0),
                "cache_read": int(usage.get("cache_read_input_tokens") or 0),
                "output": int(usage.get("output_tokens") or 0),
                "file": path,
            }
            prev = seen.get(key)
            if prev is None or row["output"] >= prev["output"]:
                seen[key] = row
    return bad


def units(t):
    return (W_INPUT * t["input"] + W_CACHE_WRITE * t["cache_write"]
            + W_CACHE_READ * t["cache_read"] + W_OUTPUT * t["output"])


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--root", default=os.path.expanduser("~/.claude/projects"))
    ap.add_argument("--session", help="only transcripts whose path contains this id")
    ap.add_argument("--since-hours", type=float, help="only transcripts modified in the last N hours")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--total", action="store_true", help="print only the meter total")
    a = ap.parse_args()

    paths = transcripts(a.root, a.session, a.since_hours)
    if not paths:
        print(f"meter: no transcripts found under {a.root}", file=sys.stderr)
        return 1

    seen, bad = {}, 0
    for p in paths:
        bad += read_usage(p, seen)

    tot = {"input": 0, "cache_write": 0, "cache_read": 0, "output": 0}
    per_file = {}
    for row in seen.values():
        f = per_file.setdefault(row["file"], {"input": 0, "cache_write": 0, "cache_read": 0, "output": 0, "messages": 0})
        for k in tot:
            tot[k] += row[k]
            f[k] += row[k]
        f["messages"] += 1
    total = units(tot)

    if a.total:
        print(round(total))
        return 0
    if a.json:
        print(json.dumps({"meter_units": round(total), "tokens": tot, "messages": len(seen),
                          "transcripts": {os.path.relpath(k, a.root): {**v, "meter_units": round(units(v))}
                                          for k, v in per_file.items()},
                          "unparsed_lines": bad}, indent=1))
        return 0

    print(f"transcripts: {len(paths)}   assistant messages: {len(seen)}   unparsed lines: {bad}")
    for k, v in sorted(per_file.items()):
        print(f"  {os.path.relpath(k, a.root)}: {round(units(v)):,} units ({v['messages']} msgs)")
    print(f"input        {tot['input']:>14,}  x {W_INPUT}")
    print(f"cache_write  {tot['cache_write']:>14,}  x {W_CACHE_WRITE}")
    print(f"cache_read   {tot['cache_read']:>14,}  x {W_CACHE_READ}")
    print(f"output       {tot['output']:>14,}  x {W_OUTPUT}")
    print(f"METER UNITS  {round(total):>14,}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
