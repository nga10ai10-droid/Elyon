'use client';
import {useMemo,useState} from 'react';
import {formatPrice,type Product} from '@/lib/products';

export type AdminOrder={lines:{sku:string;name:string;quantity:number;unit_price:number}[];id:string;status:string;total:number;shipping?:number;email:string;address:string;tracking:string;created:number};

export const ORDER_STATUS:Record<string,string>={pending:'Pendiente de pago',paid:'Pagado · por enviar',shipped:'Enviado',delivered:'Entregado',returned:'Devuelto',canceled:'Cancelado',refunded:'Reembolsado',expired:'Caducado'};
const SOLD=new Set(['paid','shipped','delivered']);
const ref=(id:string)=>'ELY-'+id.slice(0,8).toUpperCase();
const euros=(c:number)=>formatPrice((c||0)/100);
const day=(t:number)=>new Date(t).toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'});

type Addr={name?:string;address?:{line1?:string;line2?:string;postal_code?:string;city?:string;state?:string;country?:string}};
function parseAddress(raw:string){try{const a=JSON.parse(raw) as Addr|null;if(!a)return null;const d=a.address||{};return {name:a.name||'',lines:[d.line1,d.line2,[d.postal_code,d.city].filter(Boolean).join(' '),[d.state,d.country].filter(Boolean).join(', ')].filter(Boolean) as string[]}}catch{return null}}
function addressText(raw:string){const a=parseAddress(raw);return a?[a.name,...a.lines].filter(Boolean).join(', '):''}

export function AdminSummary({orders,products,inventory,subscribers,messages,go}:{orders:AdminOrder[];products:Product[];inventory:{sku:string;stock:number}[];subscribers:number;messages:number;go:(t:string)=>void}){
 const now=new Date(),start=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime(),month=new Date(now.getFullYear(),now.getMonth(),1).getTime();
 const sold=orders.filter(o=>SOLD.has(o.status));
 const sum=(list:AdminOrder[])=>list.reduce((n,o)=>n+o.total,0);
 const today=sold.filter(o=>o.created>=start),thisMonth=sold.filter(o=>o.created>=month);
 const toShip=orders.filter(o=>o.status==='paid');
 const units=thisMonth.reduce((n,o)=>n+o.lines.reduce((m,l)=>m+l.quantity,0),0);
 const active=new Map(products.filter(p=>p.status==='active').map(p=>[p.id,p.name]));
 const low=inventory.filter(i=>active.has(i.sku.split(':')[0])&&i.stock<=2).sort((a,b)=>a.stock-b.stock);
 const best=new Map<string,number>();thisMonth.forEach(o=>o.lines.forEach(l=>best.set(l.name,(best.get(l.name)||0)+l.quantity)));
 const top=[...best].sort((a,b)=>b[1]-a[1]).slice(0,5);
 const card=(label:string,value:string|number,hint?:string)=><div className="admin-kpi"><span>{label}</span><strong>{value}</strong>{hint&&<small>{hint}</small>}</div>;
 return <section><h2>Resumen</h2>
  <div className="admin-kpis">
   {card('Ventas hoy',euros(sum(today)),`${today.length} pedidos`)}
   {card('Ventas este mes',euros(sum(thisMonth)),`${thisMonth.length} pedidos · ${units} prendas`)}
   {card('Ticket medio',euros(thisMonth.length?Math.round(sum(thisMonth)/thisMonth.length):0),'este mes')}
   {card('Por enviar',toShip.length,toShip.length?'Pedidos pagados pendientes':'Todo enviado')}
   {card('Suscriptores',subscribers)}
   {card('Consultas',messages)}
  </div>
  {toShip.length>0&&<p className="admin-alert">Tienes {toShip.length} {toShip.length===1?'pedido pagado':'pedidos pagados'} por enviar. <button className="text-button" onClick={()=>go('Pedidos')}>Ir a pedidos</button></p>}
  <h3>Stock bajo (2 o menos)</h3>
  {!active.size?<p>No hay prendas disponibles para venta.</p>:!low.length?<p>Todas las tallas disponibles tienen más de 2 unidades.</p>:<ul className="admin-list">{low.slice(0,30).map(i=>{const [id,color,size]=i.sku.split(':');return <li key={i.sku}><span>{active.get(id)} · {color} · {size}</span><strong className={i.stock===0?'admin-danger':''}>{i.stock===0?'Agotado':`${i.stock} uds.`}</strong></li>})}</ul>}
  {low.length>0&&<button className="text-button" onClick={()=>go('Prendas')}>Reponer existencias</button>}
  <h3>Más vendido este mes</h3>
  {!top.length?<p>Aún no hay ventas este mes.</p>:<ul className="admin-list">{top.map(([n,q])=><li key={n}><span>{n}</span><strong>{q} uds.</strong></li>)}</ul>}
 </section>
}

function exportCsv(list:AdminOrder[]){
 const esc=(v:unknown)=>{const s=String(v??'');return /[";\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
 const rows=[['Pedido','Fecha','Estado','Cliente','Dirección','Prendas','Unidades','Envío (€)','Total (€)','Seguimiento']];
 list.forEach(o=>rows.push([ref(o.id),day(o.created),ORDER_STATUS[o.status]||o.status,o.email||'',addressText(o.address||''),o.lines.map(l=>`${l.quantity}x ${l.name}`).join(' | '),String(o.lines.reduce((n,l)=>n+l.quantity,0)),((o.shipping||0)/100).toFixed(2).replace('.',','),(o.total/100).toFixed(2).replace('.',','),o.tracking||'']));
 const blob=new Blob(['﻿'+rows.map(r=>r.map(esc).join(';')).join('\n')],{type:'text/csv;charset=utf-8'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`pedidos-elyon-${new Date().toISOString().slice(0,10)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

const FILTERS:[string,string][]=[['todo','Todos'],['paid','Por enviar'],['shipped','Enviados'],['delivered','Entregados'],['returned','Devueltos'],['pending','Pendientes de pago'],['otros','Cancelados/caducados']];

export function AdminOrders({orders,busy,save}:{orders:AdminOrder[];busy:boolean;save:(b:unknown)=>Promise<boolean>}){
 const[filter,setFilter]=useState('paid'),[q,setQ]=useState('');
 const count=(f:string)=>orders.filter(o=>match(o,f)).length;
 function match(o:AdminOrder,f:string){return f==='todo'||(f==='otros'?['canceled','expired','refunded'].includes(o.status):o.status===f)}
 const list=useMemo(()=>{const t=q.trim().toLowerCase();return orders.filter(o=>match(o,filter)).filter(o=>!t||[ref(o.id),o.email,addressText(o.address||''),o.tracking,...o.lines.map(l=>l.name)].join(' ').toLowerCase().includes(t))},[orders,filter,q]);
 function setStatus(o:AdminOrder,status:'delivered'|'returned'){
  if(status==='returned'){if(!confirm(`¿Marcar ${ref(o.id)} como devuelto? Recuerda hacer el reembolso en Stripe.`))return;const restock=confirm('¿Devolver las prendas al stock? (Aceptar = sí, si llegan en buen estado)');save({action:'order-status',id:o.id,status,restock});return}
  save({action:'order-status',id:o.id,status});
 }
 return <section><h2>Pedidos</h2>
  <p>Los pagos se confirman solos con Stripe. Los reembolsos se hacen en Stripe; aquí solo marcas el pedido como devuelto.</p>
  <div className="admin-toolbar">
   <nav aria-label="Filtrar pedidos">{FILTERS.map(([k,l])=><button key={k} aria-pressed={filter===k} onClick={()=>setFilter(k)}>{l} ({count(k)})</button>)}</nav>
   <input type="search" placeholder="Buscar por pedido, email, nombre, prenda…" value={q} onChange={e=>setQ(e.target.value)} aria-label="Buscar pedidos"/>
   <button className="btn" onClick={()=>exportCsv(list)} disabled={!list.length}>Exportar CSV ({list.length})</button>
  </div>
  {!list.length&&<p>No hay pedidos {filter==='todo'&&!q?'todavía':'con este filtro'}.</p>}
  {list.map(o=>{const a=parseAddress(o.address||'');return <article className="admin-order" key={o.id}>
   <h3>{ref(o.id)} · {euros(o.total)} <span className={'admin-badge s-'+o.status}>{ORDER_STATUS[o.status]||o.status}</span></h3>
   <p><small>{day(o.created)}</small> · {o.email?<a className="text-button" href={'mailto:'+o.email}>{o.email}</a>:'Correo pendiente de pago'}</p>
   <ul>{o.lines.map(l=><li key={l.sku}>{l.quantity} × {l.name} <small>({l.sku.split(':').slice(1).join(' · ')})</small> · {euros(l.unit_price)}</li>)}{!!o.shipping&&<li>Envío · {euros(o.shipping)}</li>}</ul>
   {a&&<address style={{fontStyle:'normal'}}><strong>{a.name}</strong>{a.lines.map(l=><span key={l} style={{display:'block'}}>{l}</span>)}<button className="text-button" type="button" onClick={()=>navigator.clipboard?.writeText([a.name,...a.lines].join('\n'))}>Copiar dirección</button></address>}
   {o.tracking&&<p>Seguimiento GLS: <a className="text-button" target="_blank" rel="noreferrer" href={'https://gls-group.com/ES/es/seguimiento-envio?match='+encodeURIComponent(o.tracking)}>{o.tracking}</a></p>}
   {o.status==='paid'&&<form onSubmit={e=>{e.preventDefault();save({action:'ship',id:o.id,tracking:new FormData(e.currentTarget).get('tracking')})}}><label>Número de seguimiento GLS<input name="tracking" required minLength={3} maxLength={200}/></label><button className="btn dark" disabled={busy}>Marcar como enviado y avisar al cliente</button></form>}
   <div className="admin-actions">
    {o.status==='shipped'&&<button className="btn" disabled={busy} onClick={()=>setStatus(o,'delivered')}>Marcar entregado</button>}
    {['paid','shipped','delivered'].includes(o.status)&&<button className="text-button" disabled={busy} onClick={()=>setStatus(o,'returned')}>Registrar devolución</button>}
   </div>
  </article>})}
 </section>
}
