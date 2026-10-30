import 'server-only';

type BrandEmailInput={
  preheader:string;
  eyebrow?:string;
  title:string;
  intro:string;
  contentHtml?:string;
  action?:{label:string;url:string};
  footer?:string;
  logoUrl?:string;
};

const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]!));
const safeUrl=(value:string)=>{try{const url=new URL(value);return url.protocol==='https:'?url.toString():''}catch{return ''}};

export function brandedEmail(input:BrandEmailInput){
  const logo=safeUrl(input.logoUrl||'');
  const action=input.action&&safeUrl(input.action.url)?`<tr><td style="padding:8px 40px 32px"><a href="${escapeHtml(safeUrl(input.action.url))}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;letter-spacing:.08em;padding:16px 24px;border-radius:2px">${escapeHtml(input.action.label.toUpperCase())}</a></td></tr>`:'';
  const logoMarkup=logo?`<img src="${escapeHtml(logo)}" width="48" height="48" alt="ELYON" style="display:block;width:48px;height:48px;border:0">`:`<span style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:800;letter-spacing:.2em;color:#111111">ELYON</span>`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(input.title)}</title></head><body style="margin:0;padding:0;background:#f3f3f1;color:#111111"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(input.preheader)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f3f3f1"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#ffffff"><tr><td style="padding:36px 40px 28px;border-bottom:1px solid #e8e8e5">${logoMarkup}</td></tr><tr><td style="padding:38px 40px 10px"><p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:.18em;color:#737373">${escapeHtml((input.eyebrow||'ELYON').toUpperCase())}</p><h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:32px;line-height:1.12;font-weight:700;letter-spacing:-.025em;color:#111111">${escapeHtml(input.title)}</h1></td></tr><tr><td style="padding:12px 40px 24px"><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;color:#393939">${escapeHtml(input.intro)}</p></td></tr>${input.contentHtml?`<tr><td style="padding:0 40px 26px">${input.contentHtml}</td></tr>`:''}${action}<tr><td style="padding:26px 40px 36px;border-top:1px solid #e8e8e5"><p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.55;color:#666666">${escapeHtml(input.footer||'Si no esperabas este mensaje, puedes ignorarlo.')}</p><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:.08em;color:#969696">ELYON · BUILT FOR MORE</p></td></tr></table></td></tr></table></body></html>`;
}

