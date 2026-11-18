'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {api} from './store';
import {formatPrice,type Product} from '@/lib/products';
import {PrivacyRequests} from './privacy-requests';
import {LaunchCenter,type Payments} from './launch-center';
import {ProductsManager} from './admin-products';
import {AdminSummary,AdminOrders} from './admin-orders';
type Order={lines:{sku:string;name:string;quantity:number;unit_price:number}[];id:string;status:string;total:number;shipping:number;email:string;address:string;tracking:string;created:number};
type Message={id:string;name:string;email:string;topic:string;message:string;created:number};
type Data={products:Product[];inventory:{sku:string;stock:number}[];orders:Order[];messages:Message[];subscribers:number;launchChecklist:{id:string;label:string;ready:boolean;detail:string}[];emailQueue:Record<string,number>;payments:Payments;config:{checkoutReady:boolean;contactReady:boolean;customerAuthReady:boolean;emailReady:boolean;mode:string}};
export function AdminPanel(){const[data,setData]=useState<Data|null>(null),[tab,setTab]=useState('Resumen'),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function load(){const d=await api('/api/admin');setData(d)}useEffect(()=>{let active=true;api('/api/admin').then(d=>{if(active)setData(d)}).catch(e=>{if(active)setMessage(e.message)});return()=>{active=false}},[]);
 async function save(body:unknown){setBusy(true);setMessage('');let saved=false;try{await api('/api/admin',body);saved=true;await load();setMessage('Cambios guardados.');return true}catch(e){setMessage(saved?'Cambios guardados, pero no se pudo recargar el panel. Recarga la página.':(e as Error).message);return saved}finally{setBusy(false)}}
 return <main id="main" className="admin-page"><header className="adm-head"><div><h1>Panel de tienda</h1><span className="adm-state" data-open={!!data?.config.checkoutReady}>{!data?'Cargando…':data.config.checkoutReady?(data.config.mode==='live'?'Ventas abiertas · cobros reales':'Ventas abiertas · modo prueba'):'Ventas cerradas'}</span></div><Link className="text-button" href="/shop">Ver tienda</Link></header>{message&&<p role="status" className="adm-msg">{message}</p>}{!data?<button onClick={()=>load().catch(e=>setMessage(e.message))} className="btn dark">Reintentar</button>:<><nav aria-label="Gestión">{['Resumen','Pedidos','Prendas','Pagos','Contacto'].map(t=><button key={t} aria-pressed={tab===t} onClick={()=>setTab(t)}>{t}</button>)}</nav>
 {tab==='Resumen'&&<AdminSummary orders={data.orders} products={data.products} inventory={data.inventory} subscribers={data.subscribers} messages={data.messages.length} go={setTab}/>}
 {tab==='Pagos'&&<LaunchCenter emailQueue={data.emailQueue} payments={data.payments} mode={data.config.mode} busy={busy} save={save}/>}
 {tab==='Prendas'&&<ProductsManager products={data.products} inventory={data.inventory} reload={load}/>}
 {tab==='Pedidos'&&<AdminOrders orders={data.orders} busy={busy} save={save}/>}
 {tab==='Contacto'&&<section><h2>Consultas recibidas</h2><p>{data.subscribers} suscripciones registradas. Aquí aparecen las últimas 100 consultas; el envío de correos aún requiere un proveedor conectado.</p>{!data.messages.length&&<p>No hay consultas.</p>}{data.messages.map(m=><article className="admin-order" key={m.id}><h3>{m.topic}</h3><p>{m.name} · <a className="text-button" href={'mailto:'+m.email}>{m.email}</a></p><p style={{whiteSpace:'pre-wrap'}}>{m.message}</p><small>{new Date(m.created).toLocaleString('es-ES')} · {m.id.slice(0,8)}</small></article>)}</section>}{tab==='Contacto'&&<PrivacyRequests/>}
 </>}</main>
}
