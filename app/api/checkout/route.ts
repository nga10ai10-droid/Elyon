import {bagContents,database,getBag,HttpError,requireUser,publicConfig,rateLimit,responseError,sameOrigin,setting} from '@/lib/commerce';
import {reconcile,stripe} from '@/lib/stripe';
type Order={id:string;bag_id:string;total:number;shipping:number;created:number;session_id:string|null};
export async function POST(request:Request){try{
 sameOrigin(request);const user=await requireUser();const c=await publicConfig();if(!c.checkoutReady)throw new HttpError(503,'Las ventas aún no están abiertas.');
 const origin=new URL(setting('SITE_ORIGIN'));if(origin.protocol!=='https:'||origin.origin!==new URL(request.url).origin)throw new HttpError(503,'El dominio de pago necesita revisión.');
 await rateLimit(request,'checkout',6);const bag=await getBag(request);if(!bag)throw new HttpError(400,'Tu bolsa está vacía.');const db=database();
 let order=await db.prepare("SELECT * FROM orders WHERE bag_id=? AND status='pending'").bind(bag).first<Order>();
 if(order?.session_id){const session=await stripe(`checkout/sessions/${encodeURIComponent(order.session_id)}`);await reconcile(session);if(session.status==='open'&&session.url)return Response.json({url:session.url});if(session.status==='complete')return Response.json({url:origin.origin+'/checkout/success?session_id='+session.id});order=null;}
 if(!order){const items=await bagContents(bag);if(!items.length)throw new HttpError(400,'Tu bolsa está vacía.');
  for(const i of items){if(i.product.status!=='active'||!i.product.sizes.includes(i.size)||!i.product.colors.some(x=>x.code===i.color))throw new HttpError(409,`${i.product.name} aún no está disponible para venta.`);const available=await db.prepare('SELECT stock FROM inventory WHERE sku=?').bind(i.sku).first<{stock:number}>();if(!available||available.stock<i.quantity)throw new HttpError(409,`No hay suficientes unidades de ${i.product.name} en talla ${i.size}. Disponibles: ${available?.stock??0}. Actualiza tu bolsa.`)}
  const flat=Number(setting('SHIPPING_CENTS')||700),freeFrom=Number(setting('FREE_SHIPPING_FROM_CENTS')||6999);if(![flat,freeFrom].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000)||flat>10000)throw new HttpError(503,'Revisa la tarifa de envío.');
  const subtotal=items.reduce((a,i)=>a+Math.round(i.product.price*100)*i.quantity,0);// 7,00 € por defecto; gratis desde 69,99 € (mantener igual que lib/shipping.ts).
  const shipping=subtotal>=freeFrom?0:flat;
  const total=subtotal+shipping;order={id:crypto.randomUUID(),bag_id:bag,total,shipping,created:Date.now(),session_id:null};
  // Refuse new reservations until migration 0007 removes the legacy deduction trigger.
  if(await db.prepare("SELECT 1 FROM sqlite_master WHERE type='trigger' AND name='reserve_inventory'").first())throw new HttpError(503,'Estamos actualizando las existencias. Inténtalo de nuevo en unos minutos.');
  try{await db.batch([
   db.prepare('INSERT INTO orders (id,bag_id,user_id,status,total,shipping,created) VALUES (?,?,?,\'pending\',?,?,?)').bind(order.id,bag,user.id,total,shipping,order.created),
   ...items.flatMap(i=>[
    db.prepare('UPDATE inventory SET stock=stock-? WHERE sku=? AND stock>=?').bind(i.quantity,i.sku,i.quantity),
    // Keep this INSERT immediately after its UPDATE: changes() must be 1.
    // NULL violates quantity's NOT NULL constraint and rolls back the whole D1 batch.
    db.prepare('INSERT INTO order_lines (order_id,sku,name,quantity,unit_price) VALUES (?,?,?,CASE WHEN changes()=1 THEN ? ELSE NULL END,?)').bind(order!.id,i.sku,`${i.product.name} · ${i.product.colors.find(x=>x.code===i.color)!.name} · ${i.size}`,i.quantity,Math.round(i.product.price*100))
   ])
  ])}catch(error){
   if(error instanceof Error&&error.message.includes('NOT NULL constraint failed: order_lines.quantity'))throw new HttpError(409,'No hay suficientes unidades para completar tu pedido. Actualiza tu bolsa.');
   throw new HttpError(409,'No pudimos reservar todas las unidades. Revisa las existencias o reintenta para recuperar un pago ya iniciado.');
  }
 }
 // Do not create a second payment on network failure. Each order has one stable idempotency key.
 if(Date.now()-order.created>23*60*60*1000)throw new HttpError(409,'Esta reserva necesita revisión antes de continuar. Contacta con ELYON.');
 const {results:lines}=await db.prepare('SELECT name,quantity,unit_price FROM order_lines WHERE order_id=? ORDER BY sku').bind(order.id).all<{name:string;quantity:number;unit_price:number}>();
 const form=new URLSearchParams({mode:'payment',success_url:`${origin.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,cancel_url:`${origin.origin}/checkout/cancel`,locale:'es','payment_method_types[0]':'card','shipping_address_collection[allowed_countries][0]':'ES','metadata[order_id]':order.id,'consent_collection[terms_of_service]':'required','custom_text[terms_of_service_acceptance][message]':`Acepto las [condiciones de compra](${origin.origin}/legal/condiciones).`, 'shipping_options[0][shipping_rate_data][display_name]':order.shipping===0?'Envío gratuito (GLS)':'Envío GLS · España peninsular y Baleares','shipping_options[0][shipping_rate_data][type]':'fixed_amount','shipping_options[0][shipping_rate_data][fixed_amount][amount]':String(order.shipping),'shipping_options[0][shipping_rate_data][fixed_amount][currency]':'eur'});
 lines.forEach((i,n)=>{form.set(`line_items[${n}][price_data][currency]`,'eur');form.set(`line_items[${n}][price_data][unit_amount]`,String(i.unit_price));form.set(`line_items[${n}][price_data][product_data][name]`,i.name);form.set(`line_items[${n}][quantity]`,String(i.quantity))});
 const session=await stripe('checkout/sessions',form,`elyon-order-${order.id}`);if(!session.id||!session.url)throw new HttpError(502,'No se recibió el enlace de pago.');
 await db.prepare('UPDATE orders SET session_id=? WHERE id=? AND session_id IS NULL').bind(session.id,order.id).run();return Response.json({url:session.url});
}catch(e){return responseError(e)}}
