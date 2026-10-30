import {notFound,permanentRedirect} from 'next/navigation';
import {productAliases} from '@/lib/products';
import {catalog,publicConfig} from '@/lib/commerce';
import {ProductDetail} from '@/components/product-detail';
import {JsonLd} from '@/components/json-ld';
import {productBreadcrumb,productJsonLd,productMetadata} from '@/lib/seo';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{id:string}>}){
  const{id}=await params;const p=(await catalog()).find(p=>p.id===id);
  if(!p)return {title:'Prenda no encontrada',robots:{index:false,follow:true}};
  return productMetadata(p);
}
export default async function ProductPage({params}:{params:Promise<{id:string}>}){
  const{id}=await params;if(productAliases[id])permanentRedirect(`/product/${productAliases[id]}`);
  const p=(await catalog()).find(p=>p.id===id);if(!p)notFound();
  const c=await publicConfig();const sellable=c.mode==='live'&&c.checkoutReady&&p.status==='active';
  return <><JsonLd data={[productJsonLd(p,sellable),productBreadcrumb(p)]}/><ProductDetail product={p}/></>;
}
