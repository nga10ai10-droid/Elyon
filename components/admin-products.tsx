'use client';
import {useMemo,useState,type FormEvent} from 'react';
import {api} from './store';
import {getFirebaseToken} from '@/lib/firebase-client';
import {formatPrice,variantId,type Category,type Colorway,type Gender,type Product} from '@/lib/products';

type Inventory={sku:string;stock:number}[];
type Status=Product['status'];
type Filter='all'|Status;

const STANDARD_SIZES=['XS','S','M','L','XL','XXL'];
const CATEGORIES:Category[]=['Camisetas','Pantalones','Tops','Leggings','Shorts'];
const GENDERS:Gender[]=['Hombre','Mujer'];
const STATUS:Record<Status,{label:string;hint:string}>={
  preview:{label:'Vista previa',hint:'Se ve en la tienda, pero no se puede comprar.'},
  active:{label:'A la venta',hint:'Se puede comprar si tiene existencias y las ventas están abiertas.'},
  hidden:{label:'Oculta',hint:'No aparece en la tienda.'},
};
const FILTER_LABEL:Record<Filter,string>={all:'Todas',active:'A la venta',preview:'Vista previa',hidden:'Ocultas'};
const PENDING=/pendiente|por confirmar|se publicarán/i;
const TECH_FIELDS=[['composition','Composición y tejido','Ej. 100 % algodón peinado, 240 g/m²'],['care','Cuidados','Ej. Lavar a 30 °C del revés. No usar secadora.'],['measurements','Medidas y guía de tallas','Ej. Talla M: largo 72 cm, ancho de pecho 58 cm.']] as const;

const slug=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const priceText=(n:number)=>n?String(n).replace('.',','):'';
const blank=():Product=>({id:'',name:'',gender:'Hombre',category:'Camisetas',price:0,description:'',fit:'',colors:[{name:'Negro',code:'negro',hex:'#111111',images:[]}],sizes:['S','M','L','XL'],status:'preview',composition:'',care:'',measurements:''});
const unitsOf=(p:Product,inv:Inventory)=>p.colors.reduce((sum,c)=>sum+p.sizes.reduce((s,size)=>s+(inv.find(i=>i.sku===variantId(p.id,c.code,size))?.stock??0),0),0);

function StatusPill({status}:{status:Status}){return <span className="pm-pill" data-status={status}>{STATUS[status].label}</span>}

export function ProductsManager({products,inventory,reload}:{products:Product[];inventory:Inventory;reload:()=>Promise<void>}){
  const[filter,setFilter]=useState<Filter>('all');
  const[draft,setDraft]=useState<Product|null>(null);
  const[isNew,setIsNew]=useState(false);
  const[baseline,setBaseline]=useState('');
  const[stock,setStock]=useState<Record<string,number>>({});
  const[price,setPrice]=useState('');
  const[idTouched,setIdTouched]=useState(false);
  const[lockedCodes,setLockedCodes]=useState<string[]>([]);
  const[confirmed,setConfirmed]=useState(false);
  const[busy,setBusy]=useState(false);
  const[status,setStatus]=useState('');

  const counts=useMemo(()=>({all:products.length,active:products.filter(p=>p.status==='active').length,preview:products.filter(p=>p.status==='preview').length,hidden:products.filter(p=>p.status==='hidden').length}),[products]);
  const totalUnits=useMemo(()=>products.reduce((s,p)=>s+unitsOf(p,inventory),0),[products,inventory]);
  const snapshot=(p:Product|null,s:Record<string,number>)=>JSON.stringify([p,s]);
  const dirty=!!draft&&snapshot(draft,stock)!==baseline;
  const savedStatus=products.find(p=>p.id===draft?.id)?.status;

  function stockFor(p:Product){return Object.fromEntries(p.colors.flatMap(c=>p.sizes.map(size=>{const sku=variantId(p.id,c.code,size);return [sku,inventory.find(i=>i.sku===sku)?.stock??0]})))}
  function open(p:Product){const copy=structuredClone(p);const s=stockFor(copy);setDraft(copy);setIsNew(false);setStock(s);setBaseline(snapshot(copy,s));setPrice(priceText(copy.price));setIdTouched(true);setLockedCodes(copy.colors.map(c=>c.code));setConfirmed(false);setStatus('');window.scrollTo({top:0})}
  function create(){const p=blank();setDraft(p);setIsNew(true);setStock({});setBaseline(snapshot(p,{}));setPrice('');setIdTouched(false);setLockedCodes([]);setConfirmed(false);setStatus('');window.scrollTo({top:0})}
  function back(){if(dirty&&!window.confirm('Hay cambios sin guardar. ¿Salir sin guardarlos?'))return;setDraft(null);setStatus('')}
  function update(patch:Partial<Product>){setDraft(d=>d?{...d,...patch}:d)}
  function updateColor(n:number,patch:Partial<Colorway>){setDraft(d=>{if(!d)return d;const colors=d.colors.map((c,i)=>{if(i!==n)return c;const next={...c,...patch};if(patch.name!==undefined&&!lockedCodes.includes(c.code)){const base=slug(patch.name).slice(0,26)||`color-${n+1}`;let code=base,k=2;while(d.colors.some((o,j)=>j!==n&&o.code===code))code=`${base}-${k++}`;next.code=code}return next});return {...d,colors}})}

  if(!draft)return <div className="pm">
    <div className="pm-head"><div><h2>Prendas</h2><p>{counts.all} prendas, {counts.active} a la venta y {totalUnits} unidades en stock.</p></div><button type="button" className="btn dark" onClick={create}>Nueva prenda</button></div>
    <div className="pm-filters" role="group" aria-label="Filtrar prendas">{(['all','active','preview','hidden'] as Filter[]).map(f=><button type="button" key={f} aria-pressed={filter===f} onClick={()=>setFilter(f)}>{FILTER_LABEL[f]}<span>{counts[f]}</span></button>)}</div>
    <ul className="pm-list">{products.filter(p=>filter==='all'||p.status===filter).map(p=>{const units=unitsOf(p,inventory);const cover=p.colors[0]?.images[0];return <li key={p.id}><button type="button" className="pm-row" onClick={()=>open(p)}>
      <span className="pm-thumb">{cover?<img src={cover} alt="" width={56} height={72} loading="lazy"/>:null}</span>
      <span className="pm-main"><strong>{p.name}</strong><small>{p.gender}, {p.category.toLowerCase()} · {p.colors.length} {p.colors.length===1?'color':'colores'}</small></span>
      <span className="pm-price">{formatPrice(p.price)}</span>
      <StatusPill status={p.status}/>
      <span className="pm-units" data-empty={units===0}>{units?`${units} uds`:'Sin stock'}</span>
    </button></li>})}</ul>
    {!products.length&&<p className="pm-empty">Aún no hay prendas. Crea la primera con «Nueva prenda».</p>}
  </div>;

  const p=draft;
  const pendingTech=TECH_FIELDS.filter(([key])=>!p[key].trim()||PENDING.test(p[key])).map(([,label])=>label.toLowerCase());
  const blockers=[...(!p.description.trim()||PENDING.test(p.description)?['descripción definitiva']:[]),...pendingTech,...(p.colors.some(c=>!c.images.length)?['una foto en cada color']:[])];
  const needsConfirm=p.status==='active'&&savedStatus!=='active';
  const invalid=!p.name.trim()||!p.id||!(p.price>0)||!p.sizes.length||p.colors.some(c=>!c.name.trim()||!c.images.length)||(p.status==='active'&&blockers.length>0);
  const sizes=[...STANDARD_SIZES,...p.sizes.filter(s=>!STANDARD_SIZES.includes(s))];

  async function upload(n:number,files:File[]){if(!files.length)return;setBusy(true);let added=0;try{const token=await getFirebaseToken();const room=6-(draft?.colors[n].images.length??6);for(const file of files.slice(0,Math.max(0,room))){const form=new FormData();form.set('file',file);const res=await fetch('/api/admin/upload',{method:'POST',body:form,credentials:'same-origin',headers:token?{Authorization:`Bearer ${token}`}:{}});const d=await res.json().catch(()=>({}));if(!res.ok)throw new Error(d.error||'No se pudo subir la foto.');setDraft(cur=>cur?{...cur,colors:cur.colors.map((c,j)=>j===n?{...c,images:[...c.images,d.url].slice(0,6)}:c)}:cur);added++}setStatus(added?`${added===1?'Foto subida':`${added} fotos subidas`}. Guarda los cambios para publicarla${added===1?'':'s'}.`:'Este color ya tiene 6 fotos.')}catch(e){setStatus((e as Error).message)}finally{setBusy(false)}}
  async function save(e:FormEvent){e.preventDefault();if(invalid)return;setBusy(true);setStatus('Guardando…');
    const clean:Product={...p,name:p.name.trim(),description:p.description.trim(),fit:p.fit.trim(),composition:p.composition.trim(),care:p.care.trim(),measurements:p.measurements.trim(),sizes:sizes.filter(s=>p.sizes.includes(s)),colors:p.colors.map(c=>({...c,name:c.name.trim()}))};
    try{
      await api('/api/admin',{action:'product',product:clean,confirmed:clean.status==='active'&&(confirmed||savedStatus==='active')});
      const items=clean.colors.flatMap(c=>clean.sizes.map(size=>{const sku=variantId(clean.id,c.code,size);return {sku,stock:Math.max(0,Math.floor(stock[sku]||0)),expected:inventory.find(i=>i.sku===sku)?.stock??0}})).filter(i=>i.stock!==i.expected);
      if(items.length)await api('/api/admin',{action:'stock',items});
      await reload();
      setDraft(clean);setBaseline(snapshot(clean,stock));setIsNew(false);setIdTouched(true);setLockedCodes(clean.colors.map(c=>c.code));setConfirmed(false);setStatus('✓ Cambios guardados');
    }catch(err){setStatus((err as Error).message)}finally{setBusy(false)}}

  return <div className="pe">
    <div className="pe-top"><button type="button" className="pe-back" onClick={back}>← Prendas</button>{!isNew&&<a className="pe-link" href={`/product/${p.id}`} target="_blank" rel="noreferrer">Ver en la tienda</a>}</div>
    <div className="pe-title"><h2>{p.name.trim()||'Nueva prenda'}</h2><StatusPill status={p.status}/></div>
    <form onSubmit={save} noValidate>
      <div className="pe-grid">
        <div className="pe-col">
          <fieldset className="pe-card"><legend>Información</legend>
            <label>Nombre<input value={p.name} maxLength={80} placeholder="Ej. CORE Tee" onChange={e=>{const name=e.target.value;update(isNew&&!idTouched?{name,id:slug(name).slice(0,80)}:{name})}}/></label>
            <div className="pe-two">
              <label>Precio<span className="pe-affix"><input inputMode="decimal" value={price} placeholder="29,95" onChange={e=>{const v=e.target.value.replace(/[^\d,.]/g,'');setPrice(v);update({price:Number(v.replace(',','.'))||0})}}/><span>€</span></span><small>IVA incluido</small></label>
              <label>Categoría<select value={p.category} onChange={e=>update({category:e.target.value as Category})}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label>
            </div>
            <div className="pe-field"><span className="pe-label">Línea</span><div className="pe-seg" role="radiogroup" aria-label="Línea">{GENDERS.map(g=><button type="button" key={g} role="radio" aria-checked={p.gender===g} onClick={()=>update({gender:g})}>{g}</button>)}</div></div>
            <label>Dirección web<span className="pe-affix pe-url"><span>elyonwear.com/product/</span><input value={p.id} disabled={!isNew} maxLength={80} onChange={e=>{setIdTouched(true);update({id:slug(e.target.value)})}}/></span>{!isNew&&<small>No se puede cambiar una vez creada, para no romper enlaces ni pedidos.</small>}</label>
          </fieldset>

          <fieldset className="pe-card"><legend>Descripción</legend>
            <label>Texto de la ficha<textarea rows={4} maxLength={1200} value={p.description} data-warn={PENDING.test(p.description)} onChange={e=>update({description:e.target.value})}/><small className="pe-count">{p.description.length}/1200</small></label>
            <label>Corte y ajuste<input maxLength={120} value={p.fit} placeholder="Ej. Oversized, hombro caído" onChange={e=>update({fit:e.target.value})}/></label>
          </fieldset>

          <fieldset className="pe-card"><legend>Ficha técnica</legend>
            {TECH_FIELDS.map(([key,label,hint])=><label key={key}>{label}<textarea rows={3} maxLength={1200} value={p[key]} placeholder={hint} data-warn={!p[key].trim()||PENDING.test(p[key])} onChange={e=>update({[key]:e.target.value} as Partial<Product>)}/>{PENDING.test(p[key])&&<small className="pe-warn">Texto provisional: sustitúyelo por el definitivo para poder vender la prenda.</small>}</label>)}
          </fieldset>

          <fieldset className="pe-card"><legend>Colores y fotos</legend>
            {p.colors.map((c,n)=><div className="pe-color" key={n}>
              <div className="pe-color-head">
                <label className="pe-swatch" title="Tono del color"><input type="color" value={c.hex} onChange={e=>updateColor(n,{hex:e.target.value})}/><span style={{background:c.hex}}/></label>
                <input aria-label={`Nombre del color ${n+1}`} value={c.name} maxLength={30} placeholder="Nombre del color" onChange={e=>updateColor(n,{name:e.target.value})}/>
                {p.colors.length>1&&<button type="button" className="pe-remove" onClick={()=>update({colors:p.colors.filter((_,i)=>i!==n)})}>Quitar color</button>}
              </div>
              <div className="pe-photos">
                {c.images.map((src,i)=><figure key={src}><img src={src} alt={`${c.name}, foto ${i+1}`} width={90} height={120}/>{i===0?<figcaption>Portada</figcaption>:<button type="button" className="pe-cover" onClick={()=>updateColor(n,{images:[src,...c.images.filter(x=>x!==src)]})}>Hacer portada</button>}<button type="button" className="pe-x" aria-label={`Quitar foto ${i+1}`} onClick={()=>updateColor(n,{images:c.images.filter(x=>x!==src)})}>×</button></figure>)}
                {c.images.length<6&&<label className="pe-upload"><input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={e=>{const files=Array.from(e.target.files||[]);e.target.value='';upload(n,files)}}/><span>+</span><small>Añadir foto</small></label>}
              </div>
              {!c.images.length&&<small className="pe-warn">Añade al menos una foto de este color.</small>}
            </div>)}
            {p.colors.length<8&&<button type="button" className="pe-add" onClick={()=>update({colors:[...p.colors,{name:'',code:`color-${p.colors.length+1}`,hex:'#777777',images:[]}]})}>+ Añadir color</button>}
            <small className="pe-note">Hasta 6 fotos por color, JPG, PNG o WebP de menos de 5 MB. La primera es la portada.</small>
          </fieldset>

          <fieldset className="pe-card"><legend>Existencias</legend>
            <p className="pe-note">Unidades disponibles para vender. Las reservas de pagos en curso ya están descontadas.</p>
            {p.colors.map(c=>{const total=p.sizes.reduce((s,size)=>s+(stock[variantId(p.id,c.code,size)]||0),0);return <div className="pe-stock" key={c.code}>
              <div className="pe-stock-head"><span style={{background:c.hex}}/><strong>{c.name||'Sin nombre'}</strong><small>{total} uds</small></div>
              <div className="pe-stock-grid">{sizes.filter(s=>p.sizes.includes(s)).map(size=>{const sku=variantId(p.id,c.code,size);return <label key={sku}>{size}<input type="number" inputMode="numeric" min={0} max={100000} value={stock[sku]??0} onChange={e=>setStock({...stock,[sku]:Math.max(0,Number(e.target.value)||0)})}/></label>})}</div>
            </div>})}
          </fieldset>
        </div>

        <div className="pe-col pe-side">
          <fieldset className="pe-card"><legend>Estado</legend>
            <div className="pe-status" role="radiogroup" aria-label="Estado">{(Object.keys(STATUS) as Status[]).map(s=><button type="button" key={s} role="radio" aria-checked={p.status===s} onClick={()=>{update({status:s});setConfirmed(false)}}><strong>{STATUS[s].label}</strong><small>{STATUS[s].hint}</small></button>)}</div>
            {p.status==='active'&&blockers.length>0&&<div className="pe-blockers"><strong>Para ponerla a la venta falta:</strong><ul>{blockers.map(b=><li key={b}>{b}</li>)}</ul></div>}
            {needsConfirm&&!blockers.length&&<label className="pe-check"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>He revisado fotos, tallas, textos y precio.</label>}
            <label className="pe-check"><input type="checkbox" checked={!!p.featured} onChange={e=>update({featured:e.target.checked})}/>Destacar en la página de inicio</label>
          </fieldset>
          <fieldset className="pe-card"><legend>Tallas</legend>
            <div className="pe-sizes">{sizes.map(s=><button type="button" key={s} aria-pressed={p.sizes.includes(s)} onClick={()=>update({sizes:p.sizes.includes(s)?p.sizes.filter(x=>x!==s):[...p.sizes,s]})}>{s}</button>)}</div>
            {!p.sizes.length&&<small className="pe-warn">Elige al menos una talla.</small>}
          </fieldset>
        </div>
      </div>

      <div className="pe-bar">
        <span role="status">{status||(p.status==='active'&&blockers.length?'Completa lo que falta en Estado para poder guardarla a la venta':p.colors.some(c=>!c.images.length)?'Cada color necesita al menos una foto':!p.name.trim()||!(p.price>0)?'Escribe el nombre y el precio':needsConfirm&&!confirmed?'Marca la casilla de revisión en Estado':dirty?'Cambios sin guardar':'Sin cambios')}</span>
        <button className="btn dark" disabled={busy||invalid||(needsConfirm&&!confirmed)||(!dirty&&!isNew)}>{busy?'Guardando…':'Guardar cambios'}</button>
      </div>
    </form>
  </div>;
}
