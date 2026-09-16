"""Write a throwaway copy of index.html with the theme pinned and the audit attached.

Mirrors shots.sh: the injected <script> must run *after* main.js so its own
theme init can't override the pin.
"""

import sys

theme, audit_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]

src = open("index.html").read()
tag = '<script src="main.js"></script>'
if tag not in src:
    sys.exit(f"could not find {tag} in index.html — has the script tag changed?")

with open(audit_path) as f:
    audit = f.read()

injected = (
    f'{tag}\n'
    f'<script>document.documentElement.setAttribute("data-theme","{theme}");</script>\n'
    f'<script>\n{audit}\n</script>'
)
open(out_path, "w").write(src.replace(tag, injected))
