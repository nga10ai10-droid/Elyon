import assert from 'node:assert/strict';
import test from 'node:test';
import {products} from '../lib/products.ts';
import {matchesCatalogSearch} from '../lib/catalog-search.ts';

const results=query=>products.filter(product=>matchesCatalogSearch(product,query));

test('search by clothing type finds shirts across both departments',()=>{
 const shirts=results('camisetas');
 assert.equal(shirts.length,4);
 assert.equal(shirts.filter(product=>product.gender==='Hombre').length,3);
 assert.equal(results('camisetas de hombre').length,3);
});

test('search handles leggings and the common leggins spelling including short leggings',()=>{
 for(const query of ['leggings','leggins','mallas']){
  assert.deepEqual(results(query).map(product=>product.id),['form-high-waist-legging','form-biker-short']);
 }
});

test('search accepts accents and several terms without including unrelated products',()=>{
 assert.deepEqual(results('camiseta algodón').map(product=>product.id),['arc-oversized-tee']);
 assert.deepEqual(results('leggings cortos mujer').map(product=>product.id),['form-biker-short']);
 assert.equal(results('    ').length,products.length);
});
