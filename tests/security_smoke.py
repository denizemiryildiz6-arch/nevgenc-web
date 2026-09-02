from pathlib import Path
import re, sys
root=Path(__file__).resolve().parents[1]
fail=[]
for p in list((root/'assets/js').rglob('*.js'))+[root/'index.html',root/'404.html']:
    text=p.read_text(errors='ignore')
    for pattern,label in [
        (r'\beval\s*\(','eval'),
        (r'new\s+Function\s*\(','new Function'),
        (r'javascript\s*:','javascript URL'),
        (r'\son(?:click|error|load)\s*=','inline event handler'),
    ]:
        if re.search(pattern,text,re.I): fail.append(f'{label}: {p.relative_to(root)}')
for p in root.rglob('*'):
    if not p.is_file() or p.suffix.lower() in {'.png','.jpg','.jpeg','.zip','.md','.sql'}: continue
    text=p.read_text(errors='ignore')
    for pattern,label in [
        (r'sb_secret_[A-Za-z0-9._-]+','Supabase secret'),
        (r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----','private key'),
        (r'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}','JWT-like secret'),
    ]:
        if re.search(pattern,text): fail.append(f'{label}: {p.relative_to(root)}')
sql='\n'.join(p.read_text(errors='ignore') for p in sorted((root/'supabase/migrations').glob('*.sql')))
for m in re.finditer(r'create\s+table\s+(?:if\s+not\s+exists\s+)?([\w.]+)',sql,re.I):
    table=m.group(1).lower()
    if table.startswith(('auth.','storage.')): continue
    if not re.search(r'alter\s+table\s+'+re.escape(table)+r'\s+enable\s+row\s+level\s+security',sql,re.I):
        fail.append(f'RLS missing: {table}')
if fail:
    print('\n'.join(fail))
    sys.exit(1)
print('security smoke checks passed')
