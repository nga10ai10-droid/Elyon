import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare} from 'miniflare';
import ts from 'typescript';

const sku='core-tee:negro:M';
const otherSku='core-tee:negro:L';
const root='https://test.example';
const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const compilerOptions={module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022};
const {HttpError}=await import(moduleUrl(ts.transpileModule(await readFile('lib/http-error.ts','utf8'),{compilerOptions}).outputText));
const item=(sku,size='M',quantity=1)=>({sku,size,quantity,color:'negro',product:{id:'core-tee',name:'CORE',status:'active',price:25,sizes:['M','L'],colors:[{code:'negro',name:'Negro'}]}});

// Exercise the actual checkout route against real D1 batches. Authentication,
// configuration and Stripe are isolated dependencies; no external payment is sent.
async function checkoutFixture({stock=1,items=[item(sku)],legacy=false}={}){
  const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-05-15',d1Databases:['DB']});
  const key='checkoutTest_'+crypto.randomUUID();
  try{
    const db=await mf.getD1Database('DB');
    for(const file of (await readdir('drizzle')).filter(file=>file.endsWith('.sql')&&(!legacy||file<'0007')).sort()){
      const sql=await readFile('drizzle/'+file,'utf8');
      await db.batch(sql.split('--> statement-breakpoint').filter(s=>s.trim()).map(s=>db.prepare(s)));
    }
    await db.prepare('UPDATE inventory SET stock=? WHERE sku=?').bind(stock,sku).run();
    const state={afterStockRead:null,beforeBatch:null,stripeRequests:[],stockReads:[]};
    const wrappedDb={
      prepare(sql){
        const statement=db.prepare(sql);
        return {
          first:()=>statement.first(),
          bind(...args){
            const bound=statement.bind(...args);
            if(sql==='SELECT stock FROM inventory WHERE sku=?')return {async first(){
              const result=await bound.first();
              state.stockReads.push(result?.stock);
              if(state.afterStockRead)await state.afterStockRead();
              return result;
            }};
            return bound;
          }
        };
      },
      async batch(statements){
        if(state.beforeBatch)await state.beforeBatch();
        return db.batch(statements);
      }
    };
    globalThis[key]={
      bagContents:async()=>items,database:()=>wrappedDb,getBag:async request=>request.headers.get('x-test-bag'),HttpError,
      requireUser:async()=>({id:'verified-customer',emailVerified:true}),publicConfig:async()=>({checkoutReady:true}),
      rateLimit:async()=>{},sameOrigin:()=>{},setting:name=>({SITE_ORIGIN:root,SHIPPING_CENTS:'0'})[name]??'',
      responseError:error=>Response.json({error:error.message},{status:error instanceof HttpError?error.status:503}),
      reconcile:async()=>{throw new Error('Unexpected reconciliation in a new checkout');},
      stripe:async(path,form,idempotency)=>{
        state.stripeRequests.push({path,form,idempotency});
        return {id:'cs_'+form.get('metadata[order_id]'),url:'https://checkout.stripe.com/test'};
      }
    };
    const commerceModule=moduleUrl(`export const {bagContents,database,getBag,HttpError,requireUser,publicConfig,rateLimit,responseError,sameOrigin,setting}=globalThis[${JSON.stringify(key)}];`);
    const stripeModule=moduleUrl(`export const {reconcile,stripe}=globalThis[${JSON.stringify(key)}];`);
    const source=(await readFile('app/api/checkout/route.ts','utf8')).replace("'@/lib/commerce'",JSON.stringify(commerceModule)).replace("'@/lib/stripe'",JSON.stringify(stripeModule));
    const compiled=ts.transpileModule(source,{compilerOptions}).outputText;
    const {POST}=await import(moduleUrl(compiled));
    return {db,state,post:bag=>POST(new Request(root+'/api/checkout',{method:'POST',headers:{origin:root,'x-test-bag':bag}})),async close(){delete globalThis[key];await mf.dispose();}};
  }catch(error){delete globalThis[key];await mf.dispose();throw error;}
}

test('two concurrent checkouts for the last unit cannot both create an order or payment',async()=>{
  const f=await checkoutFixture();
  try{
    let reads=0,release;
    const barrier=new Promise(resolve=>{release=resolve;});
    const timeout=setTimeout(()=>release(),5000);
    f.state.afterStockRead=async()=>{if(++reads===2){clearTimeout(timeout);release();}await barrier;};
    // Both requests read stock=1 before either can start its creation batch.
    const responses=await Promise.all([f.post('bag-a'),f.post('bag-b')]);
    clearTimeout(timeout);
    assert.equal(reads,2);
    assert.deepEqual(f.state.stockReads,[1,1]);
    assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);
    assert.match((await responses.find(r=>r.status===409).json()).error,/No hay suficientes unidades/);
    assert.equal((await f.db.prepare('SELECT COUNT(*) AS n FROM orders').first()).n,1);
    assert.equal((await f.db.prepare('SELECT COUNT(*) AS n FROM order_lines').first()).n,1);
    assert.equal((await f.db.prepare('SELECT stock FROM inventory WHERE sku=?').bind(sku).first()).stock,0);
    assert.equal(f.state.stripeRequests.length,1);
  }finally{await f.close();}
});

test('a failed second SKU rolls back the order, all lines and earlier stock deductions',async()=>{
  const f=await checkoutFixture({stock:3,items:[item(sku),item(otherSku,'L')]});
  try{
    await f.db.prepare('UPDATE inventory SET stock=1 WHERE sku=?').bind(otherSku).run();
    // A different buyer takes the second SKU after validation but before the batch.
    f.state.beforeBatch=()=>f.db.prepare('UPDATE inventory SET stock=0 WHERE sku=?').bind(otherSku).run();
    const response=await f.post('bag-a');
    assert.equal(response.status,409);
    assert.match((await response.json()).error,/No hay suficientes unidades/);
    assert.equal((await f.db.prepare('SELECT COUNT(*) AS n FROM orders').first()).n,0);
    assert.equal((await f.db.prepare('SELECT COUNT(*) AS n FROM order_lines').first()).n,0);
    assert.equal((await f.db.prepare('SELECT stock FROM inventory WHERE sku=?').bind(sku).first()).stock,3);
    assert.equal((await f.db.prepare('SELECT stock FROM inventory WHERE sku=?').bind(otherSku).first()).stock,0);
    assert.equal(f.state.stripeRequests.length,0);
  }finally{await f.close();}
});

test('checkout deducts exactly once and the existing cancellation restores exactly once',async()=>{
  const f=await checkoutFixture({stock:3,items:[item(sku,'M',2)]});
  try{
    assert.equal((await f.post('bag-a')).status,200);
    assert.equal((await f.db.prepare('SELECT stock FROM inventory WHERE sku=?').bind(sku).first()).stock,1);
    await f.db.prepare("UPDATE orders SET status='canceled'").run();
    await f.db.prepare("UPDATE orders SET status='canceled'").run();
    assert.equal((await f.db.prepare('SELECT stock FROM inventory WHERE sku=?').bind(sku).first()).stock,3);
  }finally{await f.close();}
});

test('an unmigrated database cannot double-deduct stock through the legacy trigger',async()=>{
  const f=await checkoutFixture({stock:3,legacy:true});
  try{
    assert.equal((await f.post('bag-a')).status,503);
    assert.equal((await f.db.prepare('SELECT stock FROM inventory WHERE sku=?').bind(sku).first()).stock,3);
    assert.equal((await f.db.prepare('SELECT COUNT(*) AS n FROM orders').first()).n,0);
    assert.equal(f.state.stripeRequests.length,0);
  }finally{await f.close();}
});
