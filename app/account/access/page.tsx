import {AccountClient} from '@/components/account-client';
export const metadata={title:'Acceso · Mi Elyon',robots:{index:false,follow:false}};
export default async function Access({searchParams}:{searchParams:Promise<{mode?:string}>}){const{mode}=await searchParams;return <AccountClient register={mode==='register'}/>}
