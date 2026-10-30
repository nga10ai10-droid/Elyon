import 'server-only';
import {database,setting} from './commerce';
import {brandedEmail} from './email-brand';

type QueueRow={id:string;order_id:string;kind:string;attempts:number};
type OrderRow={id:string;email:string|null;total:number;status:string;tracking:string|null};
type LineRow={name:string;quantity:number;unit_price:number};

const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]!));
const euros=(cents:number)=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(cents/100);
const logoUrl=()=>setting('EMAIL_LOGO_URL').trim()||`${setting('SITE_ORIGIN').replace(/\/$/,'')}/assets/logo.png`;

export function emailConfigured(){return Boolean(setting('RESEND_API_KEY').trim()&&setting('EMAIL_FROM').includes('@'))}

export async function sendEmail(input:{to:string;subject:string;text:string;html:string;idempotencyKey:string}){
 const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${setting('RESEND_API_KEY')}`,'Content-Type':'application/json','Idempotency-Key':input.idempotencyKey},body:JSON.stringify({from:setting('EMAIL_FROM'),to:[input.to],subject:input.subject,text:input.text,html:input.html,reply_to:setting('SUPPORT_EMAIL')||undefined}),signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw new Error(`Email provider returned ${response.status}`);
}

function message(order:OrderRow,lines:LineRow[],kind:string){
 const safeId=escapeHtml(order.id);const rows=lines.map(line=>`<tr><td style="padding:10px 0;border-bottom:1px solid #ececea;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#333333">${escapeHtml(line.name)} × ${line.quantity}</td><td align="right" style="padding:10px 0;border-bottom:1px solid #ececea;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#111111">${euros(line.unit_price*line.quantity)}</td></tr>`).join('');
 if(kind==='shipping_confirmation'){
  const tracking=order.tracking?.trim()||'Consulta el seguimiento respondiendo a este correo.';
  const details=`<p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#737373">PEDIDO</p><p style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#111111">${safeId}</p><p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#737373">SEGUIMIENTO</p><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#111111">${escapeHtml(tracking)}</p>`;
  return {subject:`Tu pedido ELYON ${order.id.slice(0,8)} está en camino`,text:`Tu pedido ${order.id} ha sido enviado. Seguimiento: ${tracking}`,html:brandedEmail({preheader:'Tu pedido ELYON ya está en camino.',eyebrow:'Actualización de envío',title:'Tu pedido está en camino.',intro:'Ya hemos preparado tu pedido y ha salido de nuestro almacén.',contentHtml:details,footer:'¿Necesitas ayuda? Responde a este correo y nuestro equipo te atenderá.',logoUrl:logoUrl()})};
 }
 const details=`<p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#737373">PEDIDO ${safeId}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${rows}<tr><td style="padding:18px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#111111">TOTAL</td><td align="right" style="padding:18px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;color:#111111">${euros(order.total)}</td></tr></table>`;
 return {subject:`Pedido confirmado · ELYON ${order.id.slice(0,8)}`,text:`Hemos recibido el pago del pedido ${order.id}. Total: ${euros(order.total)}.`,html:brandedEmail({preheader:'Tu pedido ELYON está confirmado.',eyebrow:'Confirmación de pedido',title:'Gracias por elegir ELYON.',intro:'Hemos recibido correctamente tu pago. Te avisaremos en cuanto el pedido salga de nuestro almacén.',contentHtml:details,footer:'Conserva este correo como confirmación de tu compra.',logoUrl:logoUrl()})};
}

export function verificationEmail(name:string,link:string){
 const customer=name.trim()?name.trim().slice(0,80):'Hola';
 return {subject:'Confirma tu cuenta ELYON',text:`${customer}, confirma tu cuenta ELYON abriendo este enlace: ${link}`,html:brandedEmail({preheader:'Solo falta confirmar tu correo para activar tu cuenta ELYON.',eyebrow:'Mi ELYON',title:'Confirma tu cuenta.',intro:`${customer}, gracias por formar parte de ELYON. Confirma tu correo para activar tu cuenta, consultar tus pedidos y comprar de forma segura.`,action:{label:'Confirmar mi cuenta',url:link},footer:'Si no has creado esta cuenta, puedes ignorar este mensaje con seguridad.',logoUrl:logoUrl()})};
}

export function passwordResetEmail(link:string){
 return {subject:'Restablece tu contraseña de ELYON',text:`Restablece tu contraseña de ELYON abriendo este enlace: ${link}`,html:brandedEmail({preheader:'Restablece tu contraseña de ELYON.',eyebrow:'Mi ELYON',title:'Restablece tu contraseña.',intro:'Hemos recibido una solicitud para restablecer tu contraseña. Si no has sido tú, puedes ignorar este mensaje con seguridad.',action:{label:'Restablecer contraseña',url:link},footer:'Este enlace caduca por seguridad al cabo de un tiempo.',logoUrl:logoUrl()})};
}

export async function processOrderEmails(orderId?:string,limit=12){
 if(!emailConfigured())return {configured:false,sent:0,failed:0};
 const db=database();const where=orderId?' AND order_id=?':'';const statement=db.prepare(`SELECT id,order_id,kind,attempts FROM outbox WHERE status='pending' AND attempts < 5${where} ORDER BY created LIMIT ?`);const bound=orderId?statement.bind(orderId,limit):statement.bind(limit);const {results}=await bound.all<QueueRow>();let sent=0,failed=0;
 for(const item of results){
  const claim=await db.prepare("UPDATE outbox SET status='sending',attempts=attempts+1 WHERE id=? AND status='pending'").bind(item.id).run();if(!claim.meta.changes)continue;
  try{
   const order=await db.prepare('SELECT id,email,total,status,tracking FROM orders WHERE id=?').bind(item.order_id).first<OrderRow>();
   if(!order?.email||!/^\S+@\S+\.\S+$/.test(order.email))throw new Error('Order has no deliverable email');
   const {results:lines}=await db.prepare('SELECT name,quantity,unit_price FROM order_lines WHERE order_id=? ORDER BY rowid').bind(order.id).all<LineRow>();const content=message(order,lines,item.kind);
   await sendEmail({to:order.email,...content,idempotencyKey:`elyon-${item.id.replace(/[^a-zA-Z0-9_-]/g,'-')}`});await db.prepare("UPDATE outbox SET status='sent' WHERE id=? AND status='sending'").bind(item.id).run();sent++;
  }catch(error){console.error('Email delivery failed',error instanceof Error?error.message:'unknown');await db.prepare("UPDATE outbox SET status=CASE WHEN attempts>=5 THEN 'failed' ELSE 'pending' END WHERE id=? AND status='sending'").bind(item.id).run();failed++;}
 }
 return {configured:true,sent,failed};
}
