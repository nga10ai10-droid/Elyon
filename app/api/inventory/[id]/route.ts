import {responseError,stockFor} from '@/lib/commerce';
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;return Response.json({stock:await stockFor(id)},{headers:{'Cache-Control':'no-store'}})}catch(e){return responseError(e)}}
