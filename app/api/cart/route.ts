import {z} from 'zod';
import {bagContents,bagCookie,catalog,cookieBag,database,getBag,HttpError,initializeCatalog,readBody,responseError,sameOrigin,rateLimit} from '@/lib/commerce';
import {variantId} from '@/lib/products';
const input=z.object({id:z.string().max(80),color:z.string().max(30),size:z.string().max(10),quantity:z.number().int().min(0).max(10)}).strict();
const cookie=(id:string,request:Request)=>bagCookie(id,new URL(request.url).protocol==='https:'||process.env.NODE_ENV==='production');
export async function GET(request:Request){try{const id=await getBag(request);return Response.json({items:await bagContents(id)},{headers:{'Cache-Control':'no-store',...(id&&cookieBag(request)!==id?{'Set-Cookie':cookie(id,request)}:{})}})}catch(e){return responseError(e)}}
export async function POST(request:Request){try{
 sameOrigin(request);await rateLimit(request,'bag',60);const parsed=input.safeParse(await readBody(request));if(!parsed.success)throw new HttpError(400,'Variante o cantidad inválida.');const line=parsed.data;const sku=variantId(line.id,line.color,line.size);const db=database();
 const bag=await getBag(request,line.quantity>0);if(!bag)return Response.json({items:[]});
 if(await db.prepare("SELECT id FROM orders WHERE bag_id=? AND status='pending'").bind(bag).first())throw new HttpError(409,'Tienes un pago iniciado. Cancela la reserva desde la bolsa para modificarla.');
 if(line.quantity===0){await db.prepare('DELETE FROM bag_lines WHERE bag_id=? AND sku=?').bind(bag,sku).run()}
 else{const p=(await catalog()).find(p=>p.id===line.id);if(!p||!p.colors.some(c=>c.code===line.color)||!p.sizes.includes(line.size))throw new HttpError(400,'La variante ya no está disponible.');await initializeCatalog();const available=await db.prepare('SELECT stock FROM inventory WHERE sku=?').bind(sku).first<{stock:number}>();if(!available||available.stock<line.quantity)throw new HttpError(409,`No hay suficientes unidades de ${p.name} en talla ${line.size}. Disponibles: ${available?.stock??0}.`);const items=await bagContents(bag);if(items.length>=24&&!items.some(i=>i.sku===sku))throw new HttpError(400,'Máximo de 24 variantes por bolsa.');await db.prepare('INSERT INTO bag_lines (bag_id,sku,quantity) VALUES (?,?,?) ON CONFLICT(bag_id,sku) DO UPDATE SET quantity=excluded.quantity').bind(bag,sku,line.quantity).run()}
 await db.prepare('UPDATE bags SET updated=? WHERE id=?').bind(Date.now(),bag).run();return Response.json({items:await bagContents(bag)},{headers:{'Set-Cookie':cookie(bag,request),'Cache-Control':'no-store'}});
}catch(e){return responseError(e)}}
