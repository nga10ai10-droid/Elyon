import 'server-only';
import type {Metadata} from 'next';
import {setting} from './commerce';
import type {Product} from './products';

export const BRAND='ELYON';
export const DEFAULT_ORIGIN='https://www.elyonwear.com';
export const SITE_DESCRIPTION='ELYON es una marca española de ropa deportiva y streetwear. Camisetas oversized, athletic y performance, leggings, tops y shorts. Descubre First Drop.';
export const OG_IMAGE={url:'/og-image.jpg',width:1200,height:630,alt:'ELYON — ropa deportiva y streetwear'};

export const GENDERS=['Hombre','Mujer'] as const;
export const CATEGORIES=['Camisetas','Tops','Leggings','Shorts','Pantalones'] as const;
const CATEGORY_LABEL:Record<string,{plural:string;singular:string}>={
  Camisetas:{plural:'Camisetas deportivas',singular:'Camiseta deportiva'},
  Tops:{plural:'Tops deportivos',singular:'Top deportivo'},
  Leggings:{plural:'Leggings',singular:'Leggings'},
  Shorts:{plural:'Leggings cortos y shorts',singular:'Short deportivo'},
  Pantalones:{plural:'Pantalones y shorts',singular:'Short deportivo'},
};

/** Canonical origin (no trailing slash). Everything absolute in the SEO layer is built from here. */
export function siteOrigin(){
  const raw=setting('SITE_ORIGIN').trim().replace(/\/+$/,'');
  try{const u=new URL(raw);if(u.protocol==='https:')return u.origin}catch{}
  return DEFAULT_ORIGIN;
}
export const absoluteUrl=(path:string)=>path.startsWith('http')?path:`${siteOrigin()}${path.startsWith('/')?'':'/'}${path}`;

const genderSuffix=(g:string)=>g==='Mujer'?'de mujer':g==='Hombre'?'de hombre':'';
function clip(text:string,max=158){const t=text.replace(/\s+/g,' ').trim();if(t.length<=max)return t;const cut=t.slice(0,max-1);return cut.slice(0,cut.lastIndexOf(' '))+'…'}
const euro=(n:number)=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(n);

/** Shared Open Graph / Twitter block so every page previews correctly on WhatsApp, Instagram, X… */
export function social(title:string,description:string,path:string,image:{url:string;width?:number;height?:number;alt?:string}=OG_IMAGE):Pick<Metadata,'openGraph'|'twitter'>{
  const img={...image,url:absoluteUrl(image.url)};
  return {
    openGraph:{type:'website',locale:'es_ES',siteName:BRAND,title,description,url:absoluteUrl(path),images:[img]},
    twitter:{card:'summary_large_image',title,description,images:[img.url]},
  };
}
export function pageMetadata(input:{title:string;description:string;path:string;absoluteTitle?:boolean;image?:typeof OG_IMAGE}):Metadata{
  const full=input.absoluteTitle?input.title:`${input.title} | ${BRAND}`;
  return {
    title:input.absoluteTitle?{absolute:input.title}:input.title,
    description:input.description,
    alternates:{canonical:absoluteUrl(input.path)},
    ...social(full,input.description,input.path,input.image),
  };
}

/* ---------- Shop landing pages (gender / category) ---------- */
export function shopFilters(params:Record<string,string|string[]|undefined>){
  const pick=(v:unknown)=>typeof v==='string'?v:Array.isArray(v)?String(v[0]):'';
  const gender=(GENDERS as readonly string[]).includes(pick(params.gender))?pick(params.gender):'';
  const category=(CATEGORIES as readonly string[]).includes(pick(params.category))?pick(params.category):'';
  return {gender,category};
}
export function shopPath(gender:string,category:string){
  const q=new URLSearchParams();if(gender)q.set('gender',gender);if(category)q.set('category',category);
  const s=q.toString();return s?`/shop?${s}`:'/shop';
}
export function shopMetadata(gender:string,category:string):Metadata{
  const cat=category?CATEGORY_LABEL[category]?.plural||category:'';
  const title=cat&&gender?`${cat} ${genderSuffix(gender)}`:cat?cat:gender?`Ropa deportiva ${genderSuffix(gender)}`:'Tienda de ropa deportiva — First Drop';
  const description=cat||gender
    ?clip(`${title} ELYON: diseño minimalista, cortes pensados para entrenar y para el día a día. Colección First Drop en negro, blanco y gris.`)
    :'Compra la colección First Drop de ELYON: camisetas oversized, athletic y performance, tops, leggings y shorts. Ropa deportiva española con diseño minimalista.';
  return pageMetadata({title,description,path:shopPath(gender,category)});
}

/* ---------- Product pages ---------- */
export function productPath(p:Product){return `/product/${p.id}`}
export function productTitle(p:Product){
  const kind=CATEGORY_LABEL[p.category]?.singular||p.category;
  return `${p.name} · ${kind} ${genderSuffix(p.gender)}`.trim();
}
export function productDescription(p:Product){
  const colors=p.colors.map(c=>c.name).join(', ');
  const suffix=` ${euro(p.price)}${colors?` · ${colors}`:''}.`;
  const room=158-suffix.length;let text='';
  for(const sentence of p.description.replace(/\s+/g,' ').trim().split(/(?<=\.)\s+/)){if((text?text+' ':'').length+sentence.length>room)break;text=text?`${text} ${sentence}`:sentence}
  return (text||clip(p.description,room)).replace(/\.$/,'')+'.'+suffix;
}
export function productImages(p:Product){return [...new Set(p.colors.flatMap(c=>c.images))].map(absoluteUrl)}
export function productMetadata(p:Product):Metadata{
  const first=p.colors[0]?.images[0];
  return pageMetadata({title:productTitle(p),description:productDescription(p),path:productPath(p),image:first?{url:first,width:1000,height:1500,alt:`${p.name} ${BRAND}`}:OG_IMAGE});
}
export function productJsonLd(p:Product,sellable:boolean){
  const url=absoluteUrl(productPath(p));
  return {
    '@context':'https://schema.org','@type':'Product',
    name:p.name,description:p.description,sku:p.id,url,
    image:productImages(p),
    brand:{'@type':'Brand',name:BRAND},
    category:`Ropa deportiva > ${p.category}`,
    ...(p.colors.length===1?{color:p.colors[0].name}:{}),
    audience:{'@type':'PeopleAudience',suggestedGender:p.gender==='Mujer'?'female':'male'},
    offers:{
      '@type':'Offer',url,priceCurrency:'EUR',price:p.price.toFixed(2),
      itemCondition:'https://schema.org/NewCondition',
      // Honest availability: only "InStock" once the shop is live and the garment is on sale.
      availability:sellable?'https://schema.org/InStock':'https://schema.org/OutOfStock',
      seller:{'@type':'Organization',name:BRAND},
    },
  };
}
export function breadcrumbJsonLd(items:{name:string;path:string}[]){
  return {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:items.map((it,i)=>({'@type':'ListItem',position:i+1,name:it.name,item:absoluteUrl(it.path)}))};
}
export function productBreadcrumb(p:Product){
  return breadcrumbJsonLd([
    {name:'Inicio',path:'/'},
    {name:p.gender,path:shopPath(p.gender,'')},
    {name:p.category,path:shopPath(p.gender,p.category)},
    {name:p.name,path:productPath(p)},
  ]);
}

/* ---------- Brand entity (disambiguates ELYON from other "Elyon" sites) ---------- */
export function organizationJsonLd(){
  const origin=siteOrigin();
  const instagram=setting('INSTAGRAM_URL').trim();
  const email=setting('SUPPORT_EMAIL').trim();
  return {
    '@context':'https://schema.org','@type':'OnlineStore','@id':`${origin}/#organization`,
    name:BRAND,alternateName:['Elyon Wear','ELYON Wear','elyonwear'],
    url:`${origin}/`,
    logo:{'@type':'ImageObject',url:`${origin}/icon-512.png`,width:512,height:512},
    image:`${origin}/og-image.jpg`,
    description:SITE_DESCRIPTION,
    slogan:'Evoluciona. Supérate.',
    areaServed:'ES',
    ...(/^https:\/\//.test(instagram)?{sameAs:[instagram]}:{}),
    ...(email.includes('@')?{contactPoint:{'@type':'ContactPoint',contactType:'customer support',email,availableLanguage:['es']}}:{}),
  };
}
export function websiteJsonLd(){
  const origin=siteOrigin();
  return {
    '@context':'https://schema.org','@type':'WebSite','@id':`${origin}/#website`,
    name:BRAND,alternateName:['Elyon Wear','elyonwear.com'],
    url:`${origin}/`,inLanguage:'es-ES',
    publisher:{'@id':`${origin}/#organization`},
  };
}
