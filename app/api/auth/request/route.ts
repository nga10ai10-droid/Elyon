import {HttpError,responseError,sameOrigin} from '@/lib/commerce';
// Intentionally closed until a supported public identity provider and email delivery
// are selected and verified. Do not persist addresses, queue codes or simulate a login.
export async function POST(request:Request){try{sameOrigin(request);throw new HttpError(503,'El acceso comercial por correo todavía no está activado. No se ha creado ninguna cuenta ni enviado ningún código.')}catch(e){return responseError(e)}}
