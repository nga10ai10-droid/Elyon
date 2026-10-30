import {HttpError,identity,rateLimit,responseError,sameOrigin} from '@/lib/commerce';
import {emailConfigured,sendEmail,verificationEmail} from '@/lib/email';
import {generateActionLink} from '@/lib/firebase-admin';

export async function POST(request:Request){
  try{
    sameOrigin(request);
    const user=await identity();
    if(!user.id||!user.email)throw new HttpError(401,'Inicia sesión para continuar.');
    await rateLimit(request,'verify-email',5);
    if(!emailConfigured())throw new HttpError(503,'El envío de correo no está configurado todavía.');
    const link=await generateActionLink('VERIFY_EMAIL',user.email);
    if(!link)throw new HttpError(404,'No se encontró la cuenta.');
    const content=verificationEmail('',link);
    await sendEmail({to:user.email,...content,idempotencyKey:`verify-${user.id}-${Math.floor(Date.now()/60000)}`});
    return Response.json({ok:true});
  }catch(e){return responseError(e)}
}
