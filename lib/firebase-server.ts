import 'server-only';
import {headers} from 'next/headers';
import {HttpError} from './http-error';

export const PROJECT_ID='elyon-store-36627';
const ISSUER=`https://securetoken.google.com/${PROJECT_ID}`;
const JWK_URL='https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
type Claims={aud:string;iss:string;sub:string;exp:number;iat:number;email?:string;email_verified?:boolean;user_id?:string};
type Jwk=JsonWebKey&{kid?:string};
type KeySet={keys:Jwk[]};
let cachedKeys:{expires:number;keys:Jwk[]}|null=null;

function bytes(value:string){const input=value.replace(/-/g,'+').replace(/_/g,'/');const raw=atob(input.padEnd(Math.ceil(input.length/4)*4,'='));return Uint8Array.from(raw,c=>c.charCodeAt(0))}
function jsonPart(value:string){try{return JSON.parse(new TextDecoder().decode(bytes(value)))}catch{throw new HttpError(401,'La sesión no es válida. Vuelve a iniciar sesión.')}}
async function keys(){
  if(cachedKeys&&cachedKeys.expires>Date.now())return cachedKeys.keys;
  const response=await fetch(JWK_URL,{headers:{Accept:'application/json'}});if(!response.ok)throw new HttpError(503,'No se pudo validar la sesión. Inténtalo de nuevo.');
  const data=await response.json() as KeySet;const maxAge=Number(/max-age=(\d+)/.exec(response.headers.get('cache-control')||'')?.[1]||300);
  cachedKeys={keys:data.keys||[],expires:Date.now()+Math.min(maxAge,3600)*1000};return cachedKeys.keys;
}
export async function firebaseIdentity(){
  const header=(await headers()).get('authorization')||'';const match=/^Bearer ([A-Za-z0-9._-]+)$/.exec(header);if(!match)return {id:null,email:null,emailVerified:false};
  const token=match[1],parts=token.split('.');if(parts.length!==3)throw new HttpError(401,'La sesión no es válida. Vuelve a iniciar sesión.');
  const head=jsonPart(parts[0]) as {alg?:string;kid?:string},claims=jsonPart(parts[1]) as Claims;
  if(head.alg!=='RS256'||!head.kid)throw new HttpError(401,'La sesión no es válida.');
  const jwk=(await keys()).find(key=>key.kid===head.kid);if(!jwk)throw new HttpError(401,'La sesión ha caducado. Vuelve a iniciar sesión.');
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  const valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,bytes(parts[2]),new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  const now=Math.floor(Date.now()/1000);if(!valid||claims.aud!==PROJECT_ID||claims.iss!==ISSUER||!claims.sub||claims.sub.length>128||claims.exp<=now||claims.iat>now+60)throw new HttpError(401,'La sesión ha caducado. Vuelve a iniciar sesión.');
  return {id:claims.sub,email:claims.email||null,emailVerified:claims.email_verified===true};
}
