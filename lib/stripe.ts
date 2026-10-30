import 'server-only';
import {database,setting,HttpError,stripeMode} from './commerce';
export type CheckoutSession={id:string;url:string|null;status:string;payment_status:string;currency:string;amount_total:number;livemode:boolean;metadata?:{order_id?:string};customer_details?:{email?:string};shipping_details?:unknown;collected_information?:{shipping_details?:unknown}};
export async function stripe(path:string,body?:URLSearchParams,idempotency?:string):Promise<CheckoutSession>{
 const secret=setting('STRIPE_SECRET_KEY');if(!secret)throw new HttpError(503,'Stripe no está conectado.');
 if(!stripeMode())throw new HttpError(503,'La clave de Stripe debe empezar por sk_test_ o sk_live_.');
 let r:Response;try{r=await fetch(`https://api.stripe.com/v1/${path}`,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${secret}`,'Stripe-Version':'2025-02-24.acacia',...(body?{'Content-Type':'application/x-www-form-urlencoded'}:{}),...(idempotency?{'Idempotency-Key':idempotency}:{})},body,signal:AbortSignal.timeout(18000)})}catch{throw new HttpError(502,'No pudimos confirmar la respuesta de Stripe. Reintenta para recuperar el mismo pago.');}
 if(!r.ok)throw new HttpError(502,'Stripe no pudo completar la operación. Tu pedido no se ha marcado como pagado.');return r.json();
}
export async function reconcile(session:CheckoutSession){
 const db=database();const order=await db.prepare('SELECT id,total,status,session_id FROM orders WHERE session_id=? OR id=?').bind(session.id,session.metadata?.order_id||'').first<{id:string;total:number;status:string;session_id:string|null}>();
 if(!order)return;
 if(order.session_id&&order.session_id!==session.id)throw new HttpError(400,'La sesión no coincide con el pedido.');
 if(session.metadata?.order_id!==order.id||session.currency!=='eur'||session.amount_total!==order.total||session.livemode!==(stripeMode()==='live'))throw new HttpError(400,'Los datos de pago no coinciden con el pedido.');
 // Checkout reserves and deducts stock atomically when creating the order in app/api/checkout/route.ts; marking paid must not deduct it again.
 if(session.status==='complete'&&session.payment_status==='paid')await db.prepare("UPDATE orders SET status='paid',session_id=?,email=?,address=? WHERE id=? AND status='pending'").bind(session.id,session.customer_details?.email||null,JSON.stringify(session.collected_information?.shipping_details||session.shipping_details||null),order.id).run();
 else if(session.status==='expired')await db.prepare("UPDATE orders SET status='canceled',session_id=? WHERE id=? AND status='pending'").bind(session.id,order.id).run();
 return order.id;
}
