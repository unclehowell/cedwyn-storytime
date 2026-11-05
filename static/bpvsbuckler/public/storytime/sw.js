/* Storytime offline cache v0.1.0 — keeps what you have opened so the tour still plays with a weak signal. — Sion's Tab agent */
var CACHE='storytime-v0.1.0';
self.addEventListener('install',function(e){self.skipWaiting();});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k.indexOf('storytime-')===0&&k!==CACHE;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener('fetch',function(e){var r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
 e.respondWith(caches.open(CACHE).then(function(c){return c.match(r).then(function(hit){var net=fetch(r).then(function(res){if(res&&res.ok)c.put(r,res.clone());return res;}).catch(function(){return hit;});return hit||net;});}));});
