export const arcComposition = '100 % algodón · 240 g/m² aprox.';
export const arcMeasurements = 'Medidas orientativas de ARC en centímetros y con la prenda extendida; pendientes de comprobar con una muestra física.';
const legacyArcMeasurements = /^Medidas de referencia del fabricante [A-Z]{2,10} [A-Z0-9]{4,20}, en centímetros y con la prenda extendida\.$/;
export type Gender = 'Hombre' | 'Mujer';
export type Category = 'Camisetas' | 'Pantalones' | 'Tops' | 'Leggings' | 'Shorts';
export type Colorway = { name: string; code: string; hex: string; images: string[] };
export type Product = {
  id: string; name: string; gender: Gender; category: Category; price: number;
  description: string; fit: string; colors: Colorway[]; sizes: string[];
  status: 'preview' | 'active' | 'hidden'; featured?: boolean;
  composition: string; care: string; measurements: string;
};
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const pending = { composition: 'Composición y gramaje pendientes de validar con la muestra de fabricación.', care: 'Las instrucciones definitivas de lavado se publicarán con la etiqueta de composición.', measurements: 'Guía de medidas pendiente de verificar sobre la prenda fabricada.' };
const colorways = (family: string): Colorway[] => [
  {name:'Negro',code:'negro',hex:'#101010',images:[`/assets/products/${family}-negro-frontal.webp`,`/assets/products/${family}-negro-espalda.webp`]},
  {name:'Blanco',code:'blanco',hex:'#f6f6f6',images:[`/assets/products/${family}-blanco-frontal.webp`,`/assets/products/${family}-blanco-espalda.webp`]},
  {name:'Gris',code:'gris',hex:'#818184',images:[`/assets/products/${family}-gris-frontal.webp`,`/assets/products/${family}-gris-espalda.webp`]},
];
const womenColors = (family:string,bottom=false):Colorway[] => ['negro',...(bottom?[]:['blanco']),'gris'].map(code=>({name:({negro:'Negro',blanco:'Blanco',gris:'Gris'} as Record<string,string>)[code],code,hex:({negro:'#101010',blanco:'#f6f6f6',gris:'#818184'} as Record<string,string>)[code],images:[`/assets/products/women/${family}-${code}-frontal.webp`,`/assets/products/women/${family}-${code}-espalda.webp`]}));
const seededProducts: Product[] = [
  {id:'arc-oversized-tee',name:'ARC Oversized Tee',gender:'Hombre',category:'Camisetas',price:37.95,description:'Volumen con intención. Hombro caído, cuerpo amplio y ELYON recorriendo la espalda. Un diseño para llevar dentro y fuera del entrenamiento.',fit:'Oversized · hombro caído',colors:colorways('arc'),sizes,status:'preview',featured:true,...pending},
  {id:'core-tee',name:'CORE Tee',gender:'Hombre',category:'Camisetas',price:29.95,description:'La básica, afinada. Mangas próximas al bíceps y un cuerpo algo más ancho con caída recta. Logo pequeño en el pecho y espalda limpia.',fit:'Athletic relaxed · manga ajustada',colors:colorways('core'),sizes,status:'preview',featured:true,...pending},
  {id:'performance-tee',name:'PERFORMANCE Tee',gender:'Hombre',category:'Camisetas',price:34.95,description:'Silueta atlética, manga raglán y símbolo centrado en el pecho. Costuras que dibujan el movimiento, con un pequeño logo bajo el cuello en la espalda.',fit:'Atlético · manga raglán',colors:colorways('performance'),sizes,status:'preview',featured:true,...pending},
  {id:'essential-training-short',name:'ESSENTIAL 7″ Short',gender:'Hombre',category:'Pantalones',price:39.95,description:'Un largo equilibrado, cintura elástica y una silueta limpia. La propuesta de short de siete pulgadas del primer drop.',fit:'Regular · largo medio',colors:[{name:'Negro',code:'negro',hex:'#101010',images:['/assets/products/essential-negro-frontal.webp','/assets/products/essential-negro-espalda.webp']}],sizes,status:'preview',featured:true,...pending},
  {id:'elevate-performance-tee',name:'ELEVATE Tee',gender:'Mujer',category:'Camisetas',price:34.95,description:'Propuesta de camiseta para la colección de mujer. Patronaje, tejido y tallas pendientes de validar antes de su lanzamiento.',fit:'Propuesta de corte atlético',colors:[{name:'Negro',code:'negro',hex:'#101010',images:['/assets/products/women/elevate-negro-frontal.webp','/assets/products/women/elevate-negro-espalda.webp']}],sizes,status:'preview',...pending},
  {id:'core-racer-top',name:'CORE Racer Top',gender:'Mujer',category:'Tops',price:29.95,description:'Tirantes anchos, escote redondeado y espalda deportiva. Una silueta de líneas limpias con banda inferior ancha para combinar con la colección FORM.',fit:'Largo bajo el pecho · tirantes anchos',colors:womenColors('core-racer-top'),sizes,status:'preview',...pending},
  {id:'flow-square-top',name:'FLOW Square Top',gender:'Mujer',category:'Tops',price:32.95,description:'Escote cuadrado, tirantes finos dobles y cuerpo alargado. Un segundo corte minimalista para tus conjuntos de entrenamiento.',fit:'Longline · escote cuadrado',colors:womenColors('flow-square-top'),sizes,status:'preview',...pending},
  {id:'form-high-waist-legging',name:'FORM Legging Largo',gender:'Mujer',category:'Leggings',price:49.95,description:'Cintura alta, pierna hasta el tobillo y acabado visual mate. Logo en la cadera y ELYON centrado en la cintura trasera. Disponible en negro y gris.',fit:'Cintura alta · largo hasta el tobillo',colors:womenColors('form-legging',true),sizes,status:'preview',...pending},
  {id:'form-biker-short',name:'FORM Short',gender:'Mujer',category:'Shorts',price:34.95,description:'Cintura alta y corte corto ajustado. Logo en la cadera y ELYON discreto en la cintura trasera. Disponible en negro y gris.',fit:'Cintura alta · corte corto',colors:womenColors('form-biker',true),sizes,status:'preview',...pending},
];
const updatedPrices:Record<string,number>={
  'arc-oversized-tee':34.95,'core-tee':24.95,'performance-tee':29.95,
  'essential-training-short':32.95,'elevate-performance-tee':29.95,
  'core-racer-top':26.95,'flow-square-top':29.95,
  'form-high-waist-legging':39.95,'form-biker-short':29.95,
};
export const products:Product[]=seededProducts.map(p=>currentProductPrice({...p,price:updatedPrices[p.id]??p.price}));
// Previously saved catalogue entries retain the launch prices unless the owner
// has edited them; normalize only the unchanged preview price on every read.
export function currentProductPrice(p:Product):Product{
  const previous=seededProducts.find(original=>original.id===p.id);
  const updated=updatedPrices[p.id];
  const product=p.status==='preview'&&previous&&updated!==undefined&&p.price===previous.price?{...p,price:updated}:p;
  if(product.id!=='arc-oversized-tee')return product;
  return {...product,
    composition:product.composition===pending.composition?arcComposition:product.composition,
    measurements:product.measurements===pending.measurements||legacyArcMeasurements.test(product.measurements)?arcMeasurements:product.measurements,
  };
}
export const formatPrice = (price:number) => new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(price);
export const variantId = (id:string,color:string,size:string) => `${id}:${color}:${size}`;
export const productAliases: Record<string,string> = {'ascend-oversized-tee':'arc-oversized-tee','core-performance-tee':'performance-tee','discipline-tee':'core-tee','evolution-tee':'arc-oversized-tee','focus-training-tee':'performance-tee','motion-training-tee':'elevate-performance-tee','sculpt-training-legging':'form-high-waist-legging','endure-training-short':'essential-training-short','core-gym-short':'essential-training-short','strength-training-short':'essential-training-short','everyday-athletic-short':'essential-training-short'};
