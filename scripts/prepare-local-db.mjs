// Local preview only. Applies committed migrations to the preview's local D1 binding.
import {Miniflare} from 'miniflare';
import {readFile,readdir} from 'node:fs/promises';
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("local")}}',d1Databases:{DB:'00000000-0000-4000-8000-000000000000'},d1Persist:'.wrangler/state/v3/d1'});
try{const db=await mf.getD1Database('DB');await db.prepare('CREATE TABLE IF NOT EXISTS elyon_local_migrations (name TEXT PRIMARY KEY)').run();for(const name of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort()){if(await db.prepare('SELECT name FROM elyon_local_migrations WHERE name=?').bind(name).first())continue;const sql=await readFile('drizzle/'+name,'utf8');await db.batch([...sql.split('--> statement-breakpoint').filter(s=>s.trim()).map(s=>db.prepare(s)),db.prepare('INSERT INTO elyon_local_migrations VALUES (?)').bind(name)]);console.log('Applied local migration:',name)}}finally{await mf.dispose()}
