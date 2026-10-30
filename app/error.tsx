'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main id="main" className="status-page"><h1>Un momento.</h1><span>No hemos podido cargar esta página. Tu bolsa sigue guardada en el servidor.</span><button className="btn dark" onClick={reset}>Volver a intentar</button></main>}
