import assert from 'node:assert/strict';
import test from 'node:test';
import {Miniflare} from 'miniflare';
import {readdir} from 'node:fs/promises';
import {resolve} from 'node:path';

test('renders the Spanish storefront with public indexing enabled in the Worker runtime',async()=>{
 const files=(await readdir('dist/server',{recursive:true})).filter(f=>f.endsWith('.js')).sort((a,b)=>a==='index.js'?-1:b==='index.js'?1:a.localeCompare(b));
 const mf=new Miniflare({modules:files.map(path=>({type:'ESModule',path:resolve('dist/server',path)})),modulesRoot:resolve('dist/server'),compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],serviceBindings:{ASSETS:()=>new Response('Not found',{status:404})}});
 try {
  const response=await mf.dispatchFetch('https://test.example/',{headers:{accept:'text/html'}});
  assert.equal(response.status,200);
  assert.match(response.headers.get('content-type')??'',/^text\/html/);
  const html=await response.text();
  assert.match(html,/<html lang="es"/);
  assert.match(html,/<meta name="robots" content="index, follow"/);
  assert.match(html,/ARC Oversized Tee/);
  assert.match(html,/CORE Tee/);
  assert.match(html,/id="main"/);
 }finally{await mf.dispose()}
});
