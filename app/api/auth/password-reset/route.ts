import {z} from 'zod';
import {HttpError,rateLimit,readBody,responseError,sameOrigin} from '@/lib/commerce';
import {emailConfigured,passwordResetEmail,sendEmail} from '@/lib/email';
import {generateActionLink} from '@/lib/firebase-admin';

const input=z.object({email:z.string().email().max(200)}).strict();

export async function POST(request:Request){
  try{
    sameOrigin(request);
    await rateLimit(request,'password-reset',5);
    const parsed=input.safeParse(await readBody(request));
    if(!parsed.success)throw new HttpError(400,'Revisa el correo electrónico.');
    const email=parsed.data.email.toLowerCase();
    // Not configured is a server problem, not account info: say so instead of failing silently.
    if(!emailConfigured())throw new HttpError(503,'El envío de correos no está disponible ahora mismo. Escríbenos a elyonwearspain@gmail.com.');
    const link=await generateActionLink('PASSWORD_RESET',email);
    if(link){
      const content=passwordResetEmail(link);
      await sendEmail({to:email,...content,idempotencyKey:`reset-${email}-${Math.floor(Date.now()/60000)}`});
    }
    // Always respond ok, whether or not the account exists — avoids revealing registered emails.
    return Response.json({ok:true});
  }catch(e){return responseError(e)}
}
