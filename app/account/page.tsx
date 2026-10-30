import {AccountClient} from '@/components/account-client';
export const dynamic='force-dynamic';
export const metadata={title:'Mi cuenta',robots:{index:false,follow:false}};
export default async function Account({searchParams}:{searchParams:Promise<{mode?:string;return?:string}>}){
  const{mode,return:returnTo}=await searchParams;return <AccountClient register={mode==='register'} returnTo={returnTo}/>;
}
