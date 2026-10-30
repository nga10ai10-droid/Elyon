'use client';
import {useCallback,useEffect,useState} from 'react';
import {AccountAccess} from './account-access';
import {AccountPanel} from './account-panel';
import {getFirebaseUser,signOutFirebase,type FirebaseUser} from '@/lib/firebase-client';
import {safeReturnPath} from '@/lib/safe-return';

export function AccountClient({register=false,returnTo}:{register?:boolean;returnTo?:string}){
  const[user,setUser]=useState<FirebaseUser|null>(null),[loading,setLoading]=useState(true),[checkError,setCheckError]=useState('');
  const target=safeReturnPath(returnTo);
  const refresh=useCallback(async(force=false)=>{try{const next=await getFirebaseUser(force);setUser(next);setCheckError('');if(next?.emailVerified&&target)window.location.assign(target)}catch{setCheckError('No hemos podido comprobar tu sesión. Inténtalo de nuevo.')}finally{setLoading(false)}},[target]);
  useEffect(()=>{void refresh();const listener=()=>void refresh();window.addEventListener('elyon-auth-change',listener);return()=>window.removeEventListener('elyon-auth-change',listener)},[refresh]);
  useEffect(()=>{
    if(!user||user.emailVerified)return;
    let checking=false;
    const check=()=>{if(document.visibilityState!=='visible'||checking)return;checking=true;void refresh(true).finally(()=>{checking=false})};
    const timer=window.setInterval(check,4000);
    const onFocus=()=>check();
    window.addEventListener('focus',onFocus);
    document.addEventListener('visibilitychange',onFocus);
    return()=>{window.clearInterval(timer);window.removeEventListener('focus',onFocus);document.removeEventListener('visibilitychange',onFocus)};
  },[user?.uid,user?.emailVerified,refresh]);
  if(loading)return <main id="main" className="status-page"><p className="eyebrow">MI ELYON</p><h1>Preparando tu espacio.</h1><p role="status">Comprobando la sesión…</p></main>;
  if(!user||!user.emailVerified)return <AccountAccess register={register&&!user} currentUser={user} checkError={checkError} onRefresh={()=>void refresh(true)} onAuthenticated={next=>{setUser(next);if(next.emailVerified)window.location.assign(target||'/account')}}/>;
  return <AccountPanel email={user.email} displayName={user.displayName} onSignOut={()=>{signOutFirebase();setUser(null)}}/>;
}
