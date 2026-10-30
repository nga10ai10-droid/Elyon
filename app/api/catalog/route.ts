import {catalog,publicConfig,responseError} from '@/lib/commerce';
export async function GET(){try{return Response.json({products:await catalog(),config:await publicConfig()},{headers:{'Cache-Control':'no-store'}})}catch(e){return responseError(e)}}
