import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function freePort(){const server=net.createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;await new Promise(r=>server.close(r));return port}
test('portable booth authorization, QR lifecycle, and durable recovery',async()=>{
 const data=await fs.mkdtemp(path.join(os.tmpdir(),'djs-booth-test-'));const password=crypto.randomBytes(20).toString('hex'),sessionSecret=crypto.randomBytes(32).toString('hex'),port=await freePort(),base='http://127.0.0.1:'+port;let child;
 async function launch(){child=spawn(process.execPath,['server.mjs'],{cwd:root,env:{...process.env,NODE_ENV:'test',BOOTH_ADMIN_PASSWORD:password,SESSION_SECRET:sessionSecret,DATA_DIR:data,PORT:String(port),APP_URL:base,PUBLIC_DELIVERY:'true'},stdio:'ignore'});for(let i=0;i<150;i++){if(child.exitCode!==null)throw Error('Server failed to start');try{const r=await fetch(base+'/healthz');if(r.ok)return}catch{}await delay(40)}throw Error('Server startup timed out')}
 async function stop(){if(!child||child.exitCode!==null)return;const exited=new Promise(r=>child.once('exit',r));child.kill('SIGTERM');await exited;child=null}
 try{await launch();assert.equal((await fetch(base+'/api/keepsakes')).status,403);assert.equal((await fetch(base+'/api/keepsakes',{headers:{'oai-authenticated-user-id':'owner'}})).status,403);assert.equal((await fetch(base+'/',{redirect:'manual'})).headers.get('location'),'/login');
 const wrong=await fetch(base+'/login',{method:'POST',headers:{origin:base,'content-type':'application/x-www-form-urlencoded'},body:'password=wrong',redirect:'manual'});assert.equal(wrong.status,401);
 const login=await fetch(base+'/login',{method:'POST',headers:{origin:base,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password}),redirect:'manual'});assert.equal(login.status,302);const setCookie=login.headers.get('set-cookie');assert.match(setCookie,/HttpOnly/);assert.match(setCookie,/SameSite=Strict/);const cookie=setCookie.split(';')[0];const headers={cookie,origin:base,'content-type':'application/json'};
 assert.equal((await fetch(base+'/',{headers:{cookie}})).status,200);assert.equal((await fetch(base+'/app.js',{headers:{cookie}})).status,200);assert.equal((await fetch(base+'/api/delivery-status',{headers:{cookie}})).status,200);
 assert.equal((await fetch(base+'/api/keepsakes',{method:'POST',headers:{...headers,origin:'https://evil.example'},body:'{}'})).status,403);
 assert.equal((await fetch(base+'/api/keepsakes',{method:'POST',headers,body:JSON.stringify({id:'../../outside'})})).status,400);
 assert.equal((await fetch(base+'/api/keepsakes',{method:'POST',headers,body:'not-json'})).status,400);
 const image='data:image/jpeg;base64,'+(await fs.readFile(path.join(root,'test','sample.jpg'))).toString('base64');const item={id:crypto.randomUUID(),business:'DJ’s Click',event:'Test demo',layout:'strip',created:new Date().toISOString(),image,demo:true};
 assert.equal((await fetch(base+'/api/keepsakes',{method:'POST',headers,body:JSON.stringify(item)})).status,200);
 const create=async()=>{const response=await fetch(base+'/api/delivery',{method:'POST',headers,body:JSON.stringify(item)});assert.equal(response.status,200);return response.json()};
 const link=await create();assert.match(link.qr,/<svg/);assert.equal(link.url,base+'/photo/'+link.token);assert.ok(Math.abs(Date.parse(link.expiresAt)-Date.now()-7*86400000)<3000);assert.equal((await fetch(link.url)).status,200);const jpg=await fetch(link.url+'/image?download=1');assert.equal(jpg.status,200);assert.match(jpg.headers.get('content-disposition'),/attachment/);assert.ok((await jpg.arrayBuffer()).byteLength>10000);
 await stop();await launch();assert.equal((await fetch(link.url)).status,200);const list=await(await fetch(base+'/api/keepsakes',{headers:{cookie}})).json();assert.equal(list.items.length,1);assert.equal(list.items[0].id,item.id);
 await fs.writeFile(path.join(data,'links',link.token+'.json'),JSON.stringify({id:item.id,expiresAt:new Date(Date.now()-1000).toISOString()}));assert.equal((await fetch(link.url)).status,404);
 const revoke=await create();assert.equal((await fetch(base+'/api/delivery?token='+revoke.token,{method:'DELETE',headers})).status,200);assert.equal((await fetch(revoke.url)).status,404);
 assert.equal((await fetch(base+'/api/keepsakes?id='+item.id,{method:'DELETE',headers})).status,200);assert.equal((await fetch(base+'/api/keepsakes?id='+item.id,{headers:{cookie}})).status,404);
 assert.equal((await fetch(base+'/logout',{method:'POST',headers,redirect:'manual'})).status,302);
 }finally{await stop();assert.ok(data.startsWith(path.join(os.tmpdir(),'djs-booth-test-')));await fs.rm(data,{recursive:true,force:true})}
});
