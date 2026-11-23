const PREFIX="Filebase-";
const CACHE="Filebase-v1795004483000";
// Nom volontairement sans le préfixe "Filebase-" : sinon le nettoyage de l'activation supprimerait ce cache
const SHARE_CACHE="share-Filebase";
const ASSETS=['./','./index.html','./manifest.json','./icon.png','./icon-192.png'];
self.addEventListener('install',e=>{
self.skipWaiting();
e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate',e=>{
e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
const req=e.request;
const url=new URL(req.url);
// Fichiers reçus par le menu "Partager" : stockés puis redirection vers la page
if(req.method==='POST'&&url.origin===self.location.origin&&url.pathname.endsWith('/share-target')){
e.respondWith((async()=>{
try{
const form=await req.formData();
const files=form.getAll('files').filter(f=>typeof f!=='string');
const cache=await caches.open(SHARE_CACHE);
for(const k of await cache.keys())await cache.delete(k);
let i=0;
for(const f of files){
await cache.put('./shared-'+String(i++).padStart(3,'0'),new Response(f,{headers:{'Content-Type':f.type||'application/octet-stream','X-Filename':encodeURIComponent(f.name||'fichier')}}));
}
}catch(err){}
return Response.redirect(new URL('./?shared=1',self.registration.scope).href,303);
})());
return;
}
if(req.method!=='GET'||url.origin!==self.location.origin)return;
e.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res;}).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html'))));
});