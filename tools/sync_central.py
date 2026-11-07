#!/usr/bin/env python3
"""Fill this webapp's own data store, data/central.json, with only the central-catalogue fields the page shows.
Read-only against the central catalogue (https://cedwyn.bucklerfamily.estate/api/catalogue/<id>). data/central.json is a
derived cache: never edit it by hand; the central catalogue stays the single source of truth. The file is rewritten only
when a record it holds changed, and a run that can read fewer than half of the records leaves it as it was.
Storytime: the record IDs come from every served page and data file (*.html, *.json, *.js, *.xml, *.txt anywhere in the repo), so a record
cited there later is picked up on the next run with no hand-kept list. Run by .github/workflows/sync-central.yml every
6 hours. — Sion's Tab agent"""
import json, re, sys, time, datetime, pathlib, urllib.request
ROOT = pathlib.Path(__file__).resolve().parent.parent
API = 'https://cedwyn.bucklerfamily.estate/api/catalogue/'
FIELDS = ('id', 'kind', 'title', 'date_display', 'date_sort', 'status', 'page')
NEEDS = ['**/*.html', '**/*.json', '**/*.js', '**/*.xml', '**/*.txt']   # the pages whose record IDs this webapp shows (globs)
OUT = ROOT / 'data' / 'central.json'   # served at /storytime/data/central.json once Storytime has a site path
SKIP = ('.git/', '.github/', 'SPLIT.json', 'node_modules/')   # not served; never read
ids = set()
for g in NEEDS:
    for f in sorted(ROOT.glob(g)):
        if f.resolve() == OUT.resolve() or not f.is_file(): continue   # never read the store itself
        if any(x in f.relative_to(ROOT).as_posix() for x in SKIP): continue
        ids |= set(re.findall(r'\b(?:EV|MR|AR)-\d{4}\b', f.read_text(encoding='utf-8', errors='ignore')))
items, miss = {}, []
for i in sorted(ids):
    try:
        req = urllib.request.Request(f'{API}{i}?cb={int(time.time())}', headers={'User-Agent': 'cedwyn-webapp-sync/1.0'})
        it = (json.load(urllib.request.urlopen(req, timeout=30)) or {}).get('item') or {}
        if it.get('id') == i: items[i] = {k: it.get(k) for k in FIELDS}
        else: miss.append(i)
    except Exception:
        miss.append(i)
    time.sleep(0.15)
prev = {}
try: prev = json.loads(OUT.read_text(encoding='utf-8'))
except Exception: pass
if len(items) < max(1, len(prev.get('items', {})) // 2):
    sys.exit(f'only {len(items)} of {len(ids)} records readable; data/central.json left as it was')
if prev.get('items') == items and prev.get('not_in_central') == miss:
    print('no change', len(items)); sys.exit(0)
doc = {
    'source': API.rstrip('/'),
    'note': "This webapp's own data store: the central-catalogue fields for the record IDs cited in "
            + 'the served pages and data files (' + ', '.join(NEEDS) + ')' + '. Derived and read-only; never edit by hand (tools/sync_central.py rewrites it).',
    'fields': list(FIELDS),
    'synced_utc': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
    'count': len(items), 'not_in_central': miss, 'items': items}
OUT.parent.mkdir(parents=True, exist_ok=True)   # first run: data/ may not exist yet
OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
print('written', len(items), 'missing', len(miss))
