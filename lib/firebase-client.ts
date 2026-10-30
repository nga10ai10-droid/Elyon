'use client';

const API_KEY='AIzaSyCZisspGNxMTt8xW9pvMSj1NlS18a74YbI';
const IDENTITY_URL='https://identitytoolkit.googleapis.com/v1';
const TOKEN_URL='https://securetoken.googleapis.com/v1/token';
const STORAGE_KEY='elyon-firebase-session-v1';

export type FirebaseUser={uid:string;email:string;displayName:string;emailVerified:boolean};
type StoredSession={idToken:string;refreshToken:string;expiresAt:number;user:FirebaseUser};

function decodeToken(token:string){
  try{return JSON.parse(decodeURIComponent(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')).split('').map(c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')))}catch{return {}}
}
function readSession():StoredSession|null{
  if(typeof window==='undefined')return null;
  try{const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');return value?.idToken&&value?.refreshToken&&value?.user?value:null}catch{return null}
}
function saveSession(session:StoredSession|null){
  if(typeof window==='undefined')return;
  if(session)localStorage.setItem(STORAGE_KEY,JSON.stringify(session));else localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('elyon-auth-change'));
}
async function call(path:string,body:Record<string,unknown>){
  const response=await fetch(`${IDENTITY_URL}/${path}?key=${API_KEY}`,{method:'POST',headers:{'Content-Type':'application/json',...(path==='accounts:sendOobCode'?{'X-Firebase-Locale':'es'}:{})},body:JSON.stringify(body)});
  const data=await response.json() as Record<string,any>;
  if(!response.ok){
    const code=String(data?.error?.message||'AUTH_ERROR').split(' : ')[0];
    const messages:Record<string,string>={EMAIL_EXISTS:'Ya existe una cuenta con este correo.',INVALID_LOGIN_CREDENTIALS:'Correo o contraseña incorrectos.',EMAIL_NOT_FOUND:'No existe una cuenta con este correo.',INVALID_PASSWORD:'Correo o contraseña incorrectos.',USER_DISABLED:'Esta cuenta está desactivada.',WEAK_PASSWORD:'La contraseña debe tener al menos 6 caracteres.',TOO_MANY_ATTEMPTS_TRY_LATER:'Demasiados intentos. Espera unos minutos y vuelve a probar.',INVALID_EMAIL:'Revisa el correo electrónico.'};
    throw new Error(messages[code]||'No se pudo completar el acceso. Inténtalo de nuevo.');
  }
  return data;
}
async function userFromToken(idToken:string):Promise<FirebaseUser>{
  const data=await call('accounts:lookup',{idToken});const item=data.users?.[0];
  if(!item)throw new Error('No se encontró la cuenta.');
  return {uid:item.localId,email:item.email,displayName:item.displayName||'',emailVerified:item.emailVerified===true};
}
function sessionFromResponse(data:Record<string,any>,user:FirebaseUser):StoredSession{
  return {idToken:data.idToken,refreshToken:data.refreshToken,expiresAt:Date.now()+Number(data.expiresIn||3600)*1000,user};
}
async function authApi(path:string,body:Record<string,unknown>,token?:string){
  const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)});
  const data=await response.json().catch(()=>({}) as Record<string,unknown>);
  if(!response.ok)throw new Error(String(data?.error||'No se pudo completar la solicitud.'));
  return data;
}
export async function registerWithPassword(email:string,password:string,name:string){
  const data=await call('accounts:signUp',{email,password,returnSecureToken:true});
  let idToken=String(data.idToken);
  if(name.trim()){const updated=await call('accounts:update',{idToken,displayName:name.trim().slice(0,80),returnSecureToken:true});idToken=String(updated.idToken||idToken);data.idToken=idToken;if(updated.refreshToken)data.refreshToken=updated.refreshToken}
  await authApi('/api/auth/verify-email',{},idToken);
  const claims=decodeToken(idToken);const user={uid:String(data.localId||claims.user_id),email:String(data.email||email),displayName:name.trim(),emailVerified:false};
  saveSession(sessionFromResponse(data,user));return user;
}
export async function signInWithPassword(email:string,password:string){
  const data=await call('accounts:signInWithPassword',{email,password,returnSecureToken:true});
  const user=await userFromToken(String(data.idToken));saveSession(sessionFromResponse(data,user));return user;
}
export async function sendPasswordReset(email:string){await authApi('/api/auth/password-reset',{email})}
export async function resendVerification(){const token=await getFirebaseToken();if(!token)throw new Error('Vuelve a iniciar sesión.');await authApi('/api/auth/verify-email',{},token)}
export function signOutFirebase(){saveSession(null)}
export async function getFirebaseToken(force=false):Promise<string|null>{
  let session=readSession();if(!session)return null;
  if(!force&&session.expiresAt>Date.now()+5*60*1000)return session.idToken;
  const response=await fetch(`${TOKEN_URL}?key=${API_KEY}`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:session.refreshToken})});
  const data=await response.json() as Record<string,any>;
  if(!response.ok){saveSession(null);return null}
  const idToken=String(data.id_token);const user=await userFromToken(idToken);
  session={idToken,refreshToken:String(data.refresh_token||session.refreshToken),expiresAt:Date.now()+Number(data.expires_in||3600)*1000,user};saveSession(session);return idToken;
}
export async function getFirebaseUser(force=false):Promise<FirebaseUser|null>{
  const token=await getFirebaseToken(force);if(!token)return null;
  if(!force)return readSession()?.user??null;
  const user=await userFromToken(token);
  const session=readSession();if(session)saveSession({...session,user});
  return user;
}
