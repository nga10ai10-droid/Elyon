import {catalog,database} from '@/lib/commerce';
import {absoluteUrl,productImages,productPath,shopPath} from '@/lib/seo';
type Entry={url:string;lastModified?:Date;changeFrequency?:'daily'|'weekly'|'monthly'|'yearly';priority?:number;images?:string[]};
export default async function sitemap():Promise<Entry[]>{
  const products=(await catalog()).filter(p=>p.status!=='hidden');
  let updated=new Map<string,number>();
  try{const {results}=await database().prepare('SELECT id,updated FROM catalog').all<{id:string;updated:number}>();updated=new Map(results.map(r=>[r.id,r.updated]))}catch{}
  const newest=Math.max(0,...updated.values());const now=newest?new Date(newest):new Date();
  const landings=new Set<string>();
  for(const p of products){landings.add(shopPath(p.gender,''));landings.add(shopPath(p.gender,p.category))}
  return [
    {url:absoluteUrl('/'),lastModified:now,changeFrequency:'weekly',priority:1,images:[absoluteUrl('/assets/hero.webp')]},
    {url:absoluteUrl('/shop'),lastModified:now,changeFrequency:'weekly',priority:0.9},
    ...[...landings].map(path=>({url:absoluteUrl(path),lastModified:now,changeFrequency:'weekly' as const,priority:0.7})),
    ...products.map(p=>({url:absoluteUrl(productPath(p)),lastModified:updated.get(p.id)?new Date(updated.get(p.id)!):now,changeFrequency:'weekly' as const,priority:0.8,images:productImages(p)})),
    {url:absoluteUrl('/about'),changeFrequency:'monthly',priority:0.5},
    {url:absoluteUrl('/help'),changeFrequency:'monthly',priority:0.4},
    {url:absoluteUrl('/contact'),changeFrequency:'yearly',priority:0.3},
  ];
}
