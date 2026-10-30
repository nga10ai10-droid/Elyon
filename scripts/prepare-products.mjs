// Non-destructive web derivatives. Original source images are never overwritten.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
const root='/workspace/scratch/0a4af62a2fe2';
const files={
  'core-blanco-frontal':'exec-98fab617-1349-431b-ad71-06f26bcfbca0.png',
  'core-blanco-espalda':'exec-54d38c98-d4a0-4db1-b1de-e7d766883885.png',
  'core-negro-frontal':'exec-b5bbf8e1-aba7-43d2-9903-643405f213e2.png',
  'core-negro-espalda':'exec-cb4e9e62-dc22-4695-809f-f0bdf15772b7.png',
  'core-gris-frontal':'exec-2d9ef2cd-ea20-4f4f-a977-8d3c69702065.png',
  'core-gris-espalda':'exec-e60c4c93-e501-44d4-a781-5747bdbc0f55.png',
  'arc-blanco-frontal':'exec-7b410c9b-f8d4-407a-a919-30cf53e438f3.png',
  'arc-blanco-espalda':'exec-a46d2fb2-2a73-48df-9387-83d8f54f89ea.png',
  'arc-gris-frontal':'exec-255b1a00-8f69-455a-b8f6-25a329e886c5.png',
  'arc-gris-espalda':'exec-f12e4ea9-78dc-4d8c-95dc-aaa77d34169f.png',
  'arc-negro-frontal':'exec-32a7adac-1f11-4c12-beb3-c551d6bd82a6.png',
  'arc-negro-espalda':'exec-d1100beb-3dd4-496a-bcf7-66f565a97736.png',
};
const flats={
  'performance-negro-frontal':'714e3453-b583-4b7a-b4b2-14e0ab8b9cc8.jpeg',
  'performance-negro-espalda':'8bf6cde0-3e82-4608-969f-5b3c07784ab9.jpeg',
  'performance-blanco-frontal':'d612c72a-f7c4-4b66-851b-a5f47c58f528.jpeg',
  'performance-blanco-espalda':'aea8c6d0-7b2a-4c78-9137-dc7829fd334a.jpeg',
  'performance-gris-frontal':'540bf7a4-a3c5-4a2e-9951-31b5fd8bc257.jpeg',
  'performance-gris-espalda':'ee537bfc-74b7-4793-be7a-295a70563759.jpeg',
};
await mkdir('public/assets/products',{recursive:true});
for (const [name,file] of [...Object.entries(files).map(([n,f])=>[n,`${root}/generated_images/${f}`]),...Object.entries(flats).map(([n,f])=>[n,`${root}/upload/${f}`])]) {
  for (const [suffix,width] of [['',1000],['-small',480]]) {
    await sharp(file).rotate().resize({width,withoutEnlargement:true}).webp({quality:85}).toFile(`public/assets/products/${name}${suffix}.webp`);
  }
}
console.log('36 optimized product assets created; originals preserved.');
