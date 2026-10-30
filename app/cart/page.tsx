'use client';
import Link from 'next/link';
import {useStore,CartLines,CartSummary} from '@/components/store';
export default function Cart(){const{items,cartError,refresh}=useStore();return <main id="main" className="cart-page section-pad"><header className="page-heading"><p>MI SELECCIÓN</p><h1>Tu bolsa.</h1></header>{cartError&&<p role="alert">{cartError} <button onClick={refresh}>Reintentar</button></p>}{items.length?<div className="cart-layout"><CartLines/><CartSummary/></div>:<div className="empty"><h2>Todo empieza con una prenda.</h2><Link className="btn dark" href="/shop">Explorar la colección</Link></div>}</main>}
