'use client';
export type Payments={stripeKey:'test'|'live'|null;webhook:boolean;siteOrigin:boolean;shipping:boolean;forcedByEnv:boolean;open:boolean};
export function LaunchCenter({emailQueue,payments,mode,busy,save}:{emailQueue:Record<string,number>;payments:Payments;mode:string;busy:boolean;save:(body:unknown)=>Promise<boolean>}){
 const connected=!!payments.stripeKey&&payments.webhook&&payments.siteOrigin;
 const reqs=[
  {ok:!!payments.stripeKey,label:'Clave secreta de Stripe',detail:payments.stripeKey==='live'?'Cobros reales (sk_live_)':payments.stripeKey==='test'?'Modo prueba (sk_test_)':'Falta STRIPE_SECRET_KEY en Cloudflare'},
  {ok:payments.webhook,label:'Webhook de Stripe',detail:payments.webhook?'Conectado (whsec_)':'Falta STRIPE_WEBHOOK_SECRET en Cloudflare'},
  {ok:payments.siteOrigin,label:'Dirección de la tienda',detail:payments.siteOrigin?'SITE_ORIGIN configurado':'Falta SITE_ORIGIN en Cloudflare'},
 ];
 return <>
  <section className="payments-card"><h2>Correos de pedido</h2><div className="email-queue"><span><strong>{emailQueue.pending||0}</strong> pendientes</span><span><strong>{emailQueue.sent||0}</strong> enviados</span><span><strong>{emailQueue.failed||0}</strong> fallidos</span></div><button className="btn ghost" type="button" disabled={busy} onClick={()=>save({action:'process-email'})}>Procesar correos pendientes</button></section>
  <section className="payments-card">
   <div className="payments-head"><h2>Pagos</h2><p>Stripe cobra con tarjeta, Apple Pay o Google Pay y te ingresa el dinero en tu banco. Las claves están guardadas en Cloudflare; aquí ves si funcionan y abres o cierras las ventas.</p></div>
   <ul className="payments-reqs">{reqs.map(r=><li key={r.label} data-ok={r.ok}><span aria-hidden="true">{r.ok?'✓':'○'}</span><div><strong>{r.label}</strong><small>{r.detail}</small></div></li>)}</ul>
   <label className="payments-switch"><input type="checkbox" role="switch" checked={payments.open} disabled={busy||payments.forcedByEnv||(!connected&&!payments.open)} onChange={e=>save({action:'sales',open:e.target.checked})}/><span aria-hidden="true"/><div><strong>{payments.open?'Ventas abiertas':'Ventas cerradas'}</strong><small>{payments.forcedByEnv?'Lo controla la variable COMMERCE_MODE de Cloudflare. Bórrala para usar este interruptor.':!connected?'Se activa cuando los tres puntos de arriba estén en verde.':payments.open?(mode==='live'?'Los clientes pueden comprar y se les cobra de verdad.':'Modo prueba: nadie paga de verdad.'):'La tienda se ve, pero no se puede comprar.'}</small></div></label>
   {payments.stripeKey==='test'&&<p className="payments-note">Para probar una compra usa la tarjeta 4242 4242 4242 4242, cualquier fecha futura y cualquier CVC. Cuando quieras cobrar de verdad, cambia en Cloudflare las dos claves por las de modo real (sk_live_ y el whsec_ del webhook real).</p>}
  </section>
 </>
}
