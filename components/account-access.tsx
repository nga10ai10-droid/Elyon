'use client';
import Link from 'next/link';
import {useState} from 'react';
import {registerWithPassword,resendVerification,sendPasswordReset,signInWithPassword,type FirebaseUser} from '@/lib/firebase-client';

export function AccountAccess({register=false,currentUser,checkError='',onAuthenticated,onRefresh}:{register?:boolean;currentUser?:FirebaseUser|null;checkError?:string;onAuthenticated?:(user:FirebaseUser)=>void;onRefresh?:()=>void}){
  const[mode,setMode]=useState<'login'|'register'|'reset'>(register?'register':'login'),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
  async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();const form=new FormData(event.currentTarget),email=String(form.get('email')||'').trim(),password=String(form.get('password')||''),name=String(form.get('name')||'').trim();setBusy(true);setError('');setMessage('');try{
    if(mode==='reset'){await sendPasswordReset(email);setMessage('Te hemos enviado un enlace para crear una nueva contraseña. Revisa también la carpeta de spam.');return}
    if(mode==='register'){const user=await registerWithPassword(email,password,name);setMessage('Cuenta creada. Te hemos enviado un correo de verificación. Abre el enlace antes de comprar.');onAuthenticated?.(user);return}
    const user=await signInWithPassword(email,password);if(!user.emailVerified)setMessage('Tu cuenta existe, pero falta verificar el correo. Revisa tu bandeja de entrada.');onAuthenticated?.(user);
  }catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  async function resend(){setBusy(true);setError('');try{await resendVerification();setMessage('Correo de verificación enviado de nuevo.')}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  const title=mode==='register'?'Hazlo tuyo.':mode==='reset'?'Recupera tu acceso.':'Vuelve a tu ritmo.';
  return <main id="main" className="member-access">
    <aside className="member-editorial"><p className="eyebrow">MI ELYON</p><h1>El siguiente nivel<br/>empieza contigo.</h1><p>Tu colección. Tus pedidos. Tu espacio.</p><div className="member-benefits"><span>01 · Compra y seguimiento en un solo lugar</span><span>02 · Verificación segura por correo</span><span>03 · Tú controlas tus datos</span></div></aside>
    <section className="member-form"><nav aria-label="Acceso a Elyon"><button type="button" className="auth-tab" aria-current={mode==='login'?'page':undefined} onClick={()=>{setMode('login');setError('');setMessage('')}}>Iniciar sesión</button><button type="button" className="auth-tab" aria-current={mode==='register'?'page':undefined} onClick={()=>{setMode('register');setError('');setMessage('')}}>Crear cuenta</button></nav>
      <h2>{title}</h2><p>{mode==='register'?'Crea tu cuenta con correo y contraseña.':mode==='reset'?'Recibirás un enlace seguro para elegir una contraseña nueva.':'Accede con tu correo y contraseña.'}</p>
      {currentUser&&!currentUser.emailVerified&&<div className="form-message"><strong>Verifica tu correo para continuar.</strong><p>Enviamos el enlace a {currentUser.email}. Al verificarlo, esta página actualizará tu acceso automáticamente.</p><button type="button" className="text-button" disabled={busy} onClick={onRefresh}>Ya he verificado mi correo</button><button type="button" className="text-button" disabled={busy} onClick={resend}>Volver a enviar el correo</button></div>}
      {checkError&&<p className="error" role="status">{checkError}</p>}{error&&<p className="error" role="alert">{error}</p>}{message&&<p className="success-message" role="status">{message}</p>}
      <form onSubmit={submit}>{mode==='register'&&<label>Tu nombre<input name="name" autoComplete="name" minLength={2} maxLength={80} required placeholder="Nombre"/></label>}<label>Correo electrónico<input name="email" type="email" autoComplete="email" required maxLength={200} placeholder="tu@correo.com"/></label>{mode!=='reset'&&<label>Contraseña<input name="password" type="password" autoComplete={mode==='register'?'new-password':'current-password'} minLength={6} maxLength={128} required placeholder="Mínimo 6 caracteres"/></label>}<button className="btn dark" disabled={busy}>{busy?'Un momento…':mode==='register'?'Crear mi cuenta':mode==='reset'?'Enviar enlace':'Entrar en mi cuenta'}</button></form>
      {mode==='login'&&<button type="button" className="text-button" onClick={()=>{setMode('reset');setError('');setMessage('')}}>He olvidado mi contraseña</button>}{mode==='reset'&&<button type="button" className="text-button" onClick={()=>setMode('login')}>Volver a iniciar sesión</button>}
      <p className="account-note">Crear una cuenta no te suscribe a publicidad. Consulta la <Link className="text-button" href="/legal/privacidad">política de privacidad</Link>.</p><Link href="/shop" className="text-button">Seguir explorando la colección →</Link>
    </section>
  </main>
}
