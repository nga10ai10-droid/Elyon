// Web Crypto verification keeps the original request bytes and supports key rotation.
export async function verifyStripeSignature(raw:string,header:string,secret:string,now=Date.now()){
 const fields=header.split(',').map(p=>p.split('='));const timestamp=fields.find(([k])=>k==='t')?.[1];
 if(!timestamp||!/^\d+$/.test(timestamp)||Math.abs(now/1000-Number(timestamp))>300)return false;
 const signatures=fields.filter(([k,v])=>k==='v1'&&/^[a-f0-9]{64}$/.test(v)).map(([,v])=>new Uint8Array(v.match(/../g)!.map(h=>parseInt(h,16))));
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 for(const signature of signatures){if(await crypto.subtle.verify('HMAC',key,signature,new TextEncoder().encode(`${timestamp}.${raw}`)))return true}return false;
}
