"""Pull the audit JSON out of a --dump-dom capture and print it for a human.

Exit 0 = every measured ratio at or above its floor, 1 = at least one real
failure, 3 = the audit never ran.

Approximate results (text over a backdrop-filter surface) are printed as WARN
and do not set the exit code — the blur makes them an estimate, so they are a
prompt to look, not a verdict.
"""

import json
import re
import sys

dom = sys.stdin.read()
match = re.search(
    r'<script type="application/json" id="contrast-report">(.*?)</script>', dom, re.S
)
if not match:
    print("  audit did not run — page failed to load, or main.js threw")
    sys.exit(3)

r = json.loads(match.group(1))


def show(label, rows):
    for f in rows:
        print(f'  {label}  {f["ratio"]:>6}:1  needs {f["need"]}  {f["sel"]}')
        print(f'          {f["fg"]} on {f["bg"]}  {f["size"]}')
        print(f'          "{f["text"]}"')


show("FAIL", r["fail"])
show("WARN", r["approx"])

for u in r["unmeasurable"]:
    print(f'  ????  no single backdrop colour ({u["why"]})  {u["sel"]}')
    print(f'          "{u["text"]}"')

parts = [
    f'{r["checked"]} measured',
    f'{len(r["fail"])} below floor',
    f'{len(r["approx"])} below floor behind blur',
    f'{len(r["unmeasurable"])} unmeasurable',
    f'lowest {r["min"]}:1',
]
print("  " + " · ".join(parts))

sys.exit(1 if r["fail"] else 0)
