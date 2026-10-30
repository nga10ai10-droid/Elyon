import {ShopClient} from '@/components/shop-client';
import {shopFilters,shopMetadata} from '@/lib/seo';
export const dynamic='force-dynamic';
type Params=Promise<Record<string,string|string[]|undefined>>;
export async function generateMetadata({searchParams}:{searchParams:Params}){const{gender,category}=shopFilters(await searchParams);return shopMetadata(gender,category)}
export default function Shop(){return <ShopClient/>}
