from pathlib import Path
import re, sys
root=Path(__file__).resolve().parents[1]
errors=[]

def must(path, needle, label):
    text=(root/path).read_text(encoding='utf-8')
    if needle not in text: errors.append(f'{label}: missing {needle!r}')

def must_not_glob(pattern, regex, label):
    rx=re.compile(regex,re.I|re.M)
    for p in root.glob(pattern):
        if p.is_file():
            txt=p.read_text(encoding='utf-8',errors='ignore')
            if rx.search(txt): errors.append(f'{label}: {p.relative_to(root)}')

must('index.html','script-src-attr \'none\'','CSP inline script blocking')
must('index.html','id="mfa-overlay"','MFA dialog')
must('index.html','id="confirm-overlay"','safe confirmation dialog')
must('assets/js/services/session.js','getAuthenticatorAssuranceLevel','MFA AAL check')
must('assets/js/services/session.js','challengeAndVerify','MFA verification')
must('assets/js/services/session.js','requestOwnPasswordReset','account password reset UX')
must('assets/js/services/repositories.js','content_audit_log','admin audit log repository')
must('assets/js/views.js','data-admin-tab=\"security\"','admin security tab')
must('assets/js/services/repositories.js','imageMagicType','image magic-byte validation')
must('assets/js/services/repositories.js','createImageBitmap','image decode validation')
must('assets/js/services/repositories.js',"canvas.toBlob(resolve,'image/webp',0.9)",'metadata stripping/re-encode')
must('supabase/migrations/013_production_security_ux.sql','private.has_aal2()','database AAL2 enforcement')
must('supabase/migrations/013_production_security_ux.sql','grant select on public.content_audit_log to authenticated','audit RLS table privilege')
must('supabase/migrations/013_production_security_ux.sql','trg_community_post_rate_limit','post rate limit')
must('supabase/functions/account-delete/index.ts','emailConfirmation','delete email confirmation')
must('supabase/functions/content-admin/index.ts','requireAal2WhenEnabled(assuranceLevel)','content AAL2')
must('supabase/functions/_shared/http.ts',"throw new HttpError(415,'İstek içeriği JSON olmalıdır.')",'JSON content-type enforcement')
must_not_glob('assets/js/**/*.js',r'\beval\s*\(|new\s+Function\s*\(|javascript\s*:', 'dangerous JS primitive')
must_not_glob('index.html',r'\son(?:click|error|load)\s*=', 'inline event handler')

# Config must not contain privileged secret material.
for p in [root/'assets/js/config.js',root/'assets/js/config.example.js']:
    if p.exists():
        txt=p.read_text(encoding='utf-8',errors='ignore')
        if re.search(r'(service[_-]?role|secret[_-]?key|SUPABASE_SERVICE_ROLE_KEY)\s*[:=]',txt,re.I):
            errors.append(f'privileged secret reference: {p.name}')

if errors:
    print('FAILED')
    for e in errors: print('-',e)
    sys.exit(1)
print('v17 security/ux checks passed')
