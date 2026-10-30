'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {AdminPanel} from './admin-panel';
import {getFirebaseUser,signOutFirebase,type FirebaseUser} from '@/lib/firebase-client';

export function AdminAccess(){
  const[user,setUser]=useState<FirebaseUser|null>(null),[loading,setLoading]=useState(true);
  useEffect(()=>{getFirebaseUser().then(setUser).finally(()=>setLoading(false))},[]);
  if(loading)return <main id="main" className="status-page"><p className="eyebrow">ELYON / GESTIÓN</p><h1>Comprobando acceso.</h1></main>;
  if(!user||!user.emailVerified||user.email.toLowerCase()!=='elyonwearspain@gmail.com')return <main id="main" className="status-page"><p className="eyebrow">ELYON / GESTIÓN</p><h1>Acceso restringido.</h1><p>{user?'Esta cuenta no está autorizada para gestionar la tienda.':'Entra con la cuenta administradora verificada.'}</p>{user&&<button className="text-button" onClick={()=>{signOutFirebase();setUser(null)}}>Cerrar esta sesión</button>}<Link href="/account" className="btn dark">Iniciar sesión</Link><Link href="/" className="text-button">Volver a la tienda</Link></main>;
  return <AdminPanel/>;
}
