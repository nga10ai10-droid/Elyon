import type {Product} from './products';

const searchNames:Record<Product['category'],string>={
  Camisetas:'camiseta camisetas tee t shirt',
  Pantalones:'pantalón pantalon pantalones bermuda bermudas',
  Tops:'top tops',
  Leggings:'legging leggings leggin leggins malla mallas',
  Shorts:'short shorts legging leggings leggin leggins malla mallas cortos cortas',
};

const normalize=(value:string)=>value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const fillerWords=new Set(['de','del','la','las','el','los','y','para','en']);

export function matchesCatalogSearch(product:Product,query:string){
 const terms=normalize(query).split(/\s+/).filter(term=>term&&!fillerWords.has(term));
 if(!terms.length)return true;
 const searchable=normalize([product.name,product.gender,product.category,product.description,product.fit,product.composition,searchNames[product.category],...product.colors.map(c=>c.name)].join(' '));
 return terms.every(term=>searchable.split(' ').some(word=>word.startsWith(term)));
}
