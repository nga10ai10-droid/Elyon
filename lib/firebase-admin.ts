import 'server-only';
import {setting} from './commerce';
import {HttpError} from './http-error';
import {PROJECT_ID} from './firebase-server';

const TOKEN_URL='https://oauth2.googleapis.com/token';
const SCOPE='https://www.googleapis.com/auth/cloud-platform';
let cached:{token:string;expires:number}|null=null;

function pemToBytes(pem:string){
  const clean=pem.replace(/-----BEGIN PRIVATE KEY-----/,'').replace(/-----END PRIVATE KEY-----/,'').replace(/\s+/g,'');
  const raw=atob(clean);
  return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
function base64url(input:ArrayBuffer|string){
  const bytes=typeof input==='string'?new TextEncoder().encode(input):new Uint8Array(input);
  let str='';for(const b of bytes)str+=String.fromCharCode(b);
  return btoa(str).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

/** Signs a short-lived JWT with the service account's private key (RS256) — no external library needed. */
async function signedAssertion(clientEmail:string,privateKey:string){
  const now=Math.floor(Date.now()/1000);
  const header=base64url(JSON.stringify({alg:'RS256',typ:'JWT'}));
  const claims=base64url(JSON.stringify({iss:clientEmail,scope:SCOPE,aud:TOKEN_URL,iat:now,exp:now+3600}));
  const unsigned=`${header}.${claims}`;
  const key=await crypto.subtle.importKey('pkcs8',pemToBytes(privateKey),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
  const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(unsigned));
  return `${unsigned}.${base64url(signature)}`;
}

async function accessToken(){
  if(cached&&cached.expires>Date.now()+30000)return cached.token;
  // Tolerate copy-paste artefacts: surrounding spaces/quotes/commas and escaped \n from the JSON file.
  const clean=(v:string)=>v.trim().replace(/,$/,'').replace(/^["']|["']$/g,'').trim();
  const clientEmail=clean(setting('FIREBASE_CLIENT_EMAIL'));
  const privateKey=clean(setting('FIREBASE_PRIVATE_KEY')).replace(/\\n/g,'\n');
  if(!clientEmail||!privateKey)throw new HttpError(503,'El servicio de cuentas no está disponible. Inténtalo de nuevo más tarde.');
  let assertion:string;try{assertion=await signedAssertion(clientEmail,privateKey)}catch{throw new HttpError(503,'La clave privada de Firebase no es válida. Vuelve a subir FIREBASE_PRIVATE_KEY.')}
  const response=await fetch(TOKEN_URL,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion}),signal:AbortSignal.timeout(10000)});
  if(!response.ok){const detail=await response.json().catch(()=>({})) as {error?:string;error_description?:string};console.error('firebase-admin token',response.status,detail);throw new HttpError(503,`No se pudo autenticar el servicio de cuentas (${detail.error||response.status}${detail.error_description?': '+detail.error_description:''}).`)}
  const data=await response.json() as {access_token:string;expires_in:number};
  cached={token:data.access_token,expires:Date.now()+data.expires_in*1000};
  return cached.token;
}

/**
 * Generates a verification/password-reset link WITHOUT letting Firebase send its own
 * default email (returnOobLink suppresses Firebase's built-in send). We deliver the
 * link ourselves via Resend using the branded template, from our own domain, so the
 * message doesn't come from a generic firebaseapp.com sender.
 * Returns null if the account doesn't exist (caller should not reveal this to avoid
 * leaking which emails are registered).
 */
export async function generateActionLink(requestType:'VERIFY_EMAIL'|'PASSWORD_RESET',email:string):Promise<string|null>{
  const token=await accessToken();
  const response=await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:sendOobCode`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({requestType,email,returnOobLink:true}),signal:AbortSignal.timeout(10000)});
  const data=await response.json() as {oobLink?:string;error?:{message?:string}};
  if(!response.ok||!data.oobLink){
    if(data.error?.message==='EMAIL_NOT_FOUND')return null;
    throw new HttpError(503,'No se pudo generar el enlace. Inténtalo de nuevo.');
  }
  return data.oobLink;
}
