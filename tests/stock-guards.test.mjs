import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {Miniflare} from 'miniflare';

test('the server refuses bag quantities above live inventory without changing the bag',async()=>{
  const files=(await readdir('dist/server',{recursive:true})).filter(file=>file.endsWith('.js')).sort((a,b)=>a==='index.js'?-1:b==='index.js'?1:a.localeCompare(b));
  const mf=new Miniflare({modules:files.map(path=>({type:'ESModule',path:resolve('dist/server',path)})),modulesRoot:resolve('dist/server'),compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],r2Buckets:['BUCKET'],bindings:{COMMERCE_MODE:'preview'},serviceBindings:{ASSETS:()=>new Response('Not found',{status:404})}});
  try{
    const db=await mf.getD1Database('DB');
    for(const file of (await readdir('drizzle')).filter(file=>file.endsWith('.sql')).sort()){
      const sql=await readFile('drizzle/'+file,'utf8');
      await db.batch(sql.split('--> statement-breakpoint').filter(statement=>statement.trim()).map(statement=>db.prepare(statement)));
    }
    const sku='core-tee:negro:M';
    await db.prepare('UPDATE inventory SET stock=1 WHERE sku=?').bind(sku).run();
    const root='https://test.example';
    const post=(quantity,cookie)=>mf.dispatchFetch(root+'/api/cart',{method:'POST',headers:{origin:root,'Content-Type':'application/json',...(cookie?{cookie}:{})},body:JSON.stringify({id:'core-tee',color:'negro',size:'M',quantity})});

    let response=await post(2);
    assert.equal(response.status,409);
    assert.match((await response.json()).error,/Disponibles: 1/);
    assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM bag_lines').first()).count,0);

    response=await post(1);
    assert.equal(response.status,200);
    const cookie=response.headers.get('set-cookie').split(';')[0];
    response=await post(2,cookie);
    assert.equal(response.status,409);
    const bag=await mf.dispatchFetch(root+'/api/cart',{headers:{cookie}});
    assert.equal((await bag.json()).items[0].quantity,1);
    assert.equal((await db.prepare('SELECT stock FROM inventory WHERE sku=?').bind(sku).first()).stock,1);
  }finally{await mf.dispose()}
});
