import Link from 'next/link';
import {notFound} from 'next/navigation';
import {isLegalSlug,legalPages,legalSections,LEGAL_UPDATED} from '@/lib/legal';
import {PrintButton} from '@/components/print-button';
export const metadata={title:'Información legal',robots:{index:false,follow:true}};
export default async function Legal({params}:{params:Promise<{slug:string}>}){
  const{slug}=await params;if(!isLegalSlug(slug))notFound();
  const doc=legalPages[slug];const sections=legalSections(doc.body);
  return <main id="main" className="legal-page">
    <p className="eyebrow">ELYON / INFORMACIÓN</p><h1>{doc.title}</h1>
    <nav className="legal-doc-nav" aria-label="Documentos legales">{Object.entries(legalPages).map(([s,d])=><Link aria-current={s===slug?'page':undefined} key={s} href={'/legal/'+s}>{d.title}</Link>)}</nav>
    <div className="legal-tools"><span>Actualizado: {LEGAL_UPDATED}</span><PrintButton/></div>
    <nav className="legal-index" aria-label="Contenido del documento">{sections.map((s,i)=>s.heading&&<a key={i} href={'#apartado-'+i}>{s.heading}</a>)}</nav>
    <div className="legal-sections">{sections.map((s,i)=><section id={'apartado-'+i} key={i}>{s.heading&&<h2>{s.heading}</h2>}{s.paragraphs.map((p,n)=><p key={n}>{p}</p>)}</section>)}</div>
  </main>
}
