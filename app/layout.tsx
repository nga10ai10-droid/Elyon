import type{Metadata,Viewport}from"next";import"./globals.css";import{StoreProvider,Header,Footer}from"@/components/store";
import{JsonLd}from"@/components/json-ld";
import{BRAND,SITE_DESCRIPTION,organizationJsonLd,siteOrigin,social}from"@/lib/seo";
export async function generateMetadata():Promise<Metadata>{
 const origin=siteOrigin();
 const title="ELYON | Ropa deportiva y streetwear · Evoluciona. Supérate.";
 return {
  metadataBase:new URL(origin),
  title:{default:title,template:`%s | ${BRAND}`},
  description:SITE_DESCRIPTION,
  applicationName:BRAND,
  generator:null,
  referrer:'strict-origin-when-cross-origin',
  formatDetection:{telephone:false,email:false,address:false},
  robots:{index:true,follow:true,googleBot:{index:true,follow:true,'max-image-preview':'large','max-snippet':-1,'max-video-preview':-1}},
  icons:{icon:[{url:'/favicon.ico',sizes:'48x48'},{url:'/icon-192.png',type:'image/png',sizes:'192x192'},{url:'/icon-512.png',type:'image/png',sizes:'512x512'}],apple:[{url:'/apple-touch-icon.png',sizes:'180x180'}]},
  manifest:'/manifest.webmanifest',
  ...social(title,SITE_DESCRIPTION,'/'),
 };
}
export const viewport:Viewport={themeColor:'#090909',colorScheme:'light'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es"><body><JsonLd data={organizationJsonLd()}/><StoreProvider><Header/>{children}<Footer/></StoreProvider></body></html>}
