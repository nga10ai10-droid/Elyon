import {z} from 'zod';
import {database,HttpError,requireUser,readBody,responseError,sameOrigin,rateLimit} from '@/lib/commerce';
const address=z.object({name:z.string().trim().min(2).max(100),street:z.string().trim().min(5).max(150),city:z.string().trim().min(2).max(80),postcode:z.string().regex(/^\d{5}$/),country:z.literal('ES')}).strict();
export async function GET(){try{
  const u=await requireUser();const db=database();
  const [orders,a,profile,privacy]=await Promise.all([
    db.prepare('SELECT id,status,total,tracking,created FROM orders WHERE user_id=? ORDER BY created DESC LIMIT 50').bind(u.id).all(),
    db.prepare('SELECT data FROM addresses WHERE user_id=?').bind(u.id).first<{data:string}>(),
    db.prepare('SELECT name,created,updated FROM member_profiles WHERE user_id=?').bind(u.id).first(),
    db.prepare('SELECT id,status,created FROM privacy_requests WHERE user_id=?').bind(u.id).first()
  ]);
  return Response.json({user:u,orders:orders.results,address:a?JSON.parse(a.data):null,profile,privacy},{headers:{'Cache-Control':'no-store'}})
}catch(e){return responseError(e)}}
export async function POST(request:Request){try{
  sameOrigin(request);const u=await requireUser();
  await rateLimit(request,'account',20);const body=await readBody(request);const db=database();
  if(body.action==='profile'){
    const p=z.object({action:z.literal('profile'),name:z.string().trim().min(2).max(80)}).strict().safeParse(body);
    if(!p.success)throw new HttpError(400,'Indica un nombre entre 2 y 80 caracteres.');
    await db.prepare('INSERT INTO member_profiles (user_id,name,created,updated) VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET name=excluded.name,updated=excluded.updated').bind(u.id,p.data.name,Date.now(),Date.now()).run();
    return Response.json({ok:true});
  }
  if(body.action==='delete-address'){
    if(body.confirmed!==true)throw new HttpError(400,'Confirma que quieres eliminar la dirección guardada.');
    await db.prepare('DELETE FROM addresses WHERE user_id=?').bind(u.id).run();return Response.json({ok:true});
  }
  if(body.action==='privacy-request'){
    if(body.confirmed!==true)throw new HttpError(400,'Confirma que quieres solicitar la supresión de tus datos.');
    await db.prepare('INSERT INTO privacy_requests (user_id,id,status,created) VALUES (?,?,?,?) ON CONFLICT(user_id) DO NOTHING').bind(u.id,crypto.randomUUID(),'pending',Date.now()).run();
    const row=await db.prepare('SELECT id,status,created FROM privacy_requests WHERE user_id=?').bind(u.id).first();
    return Response.json({ok:true,request:row});
  }
  const a=address.safeParse(body);if(!a.success)throw new HttpError(400,'Revisa la dirección y el código postal.');
  await db.prepare('INSERT INTO addresses (user_id,data,updated) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data,updated=excluded.updated').bind(u.id,JSON.stringify(a.data),Date.now()).run();
  return Response.json({ok:true});
}catch(e){return responseError(e)}}
