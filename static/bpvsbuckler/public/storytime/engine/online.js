/* Storytime online v0.1.0 — every catalogue entry, scene by scene, as animated frames. Reads the live catalogue; new entries appear without a rebuild. — Sion's Tab agent */
(function(){'use strict';
var C=window.STORYTIME||{};var ROOT=C.root||'../';
var LIVE=['/api/catalogue','https://cedwyn.bucklerfamily.estate/api/catalogue'];
var DENY={'EV-0002':1,'EV-0003':1,'EV-0021':1,'EV-0017':1,'EV-0165':1,'EV-0053':1,'EV-0213':1};
var NFT=['nfa-0014','nfa-0016','nfa-0019','nfa-0029','nfa-0032','nfa-0038','nfa-0048','nfa-0055','nfa-0057','nfa-0083','nfa-0122'];
var SC=[],si=0,fi=0,playing=false,timer=null,voice=false,PAGES={},EXTRA={scans:{},quotes:{}},src='',gen=0;var SS=window.speechSynthesis||null;
function $(s){return document.querySelector(s);}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function clean(t){t=String(t||'');var R=[[/“It’s a Crichel Down, says woman farmer”/g,'“It’s a Crichel Down …” (headline)'],[/\balleged(ly)?\b/gi,'reported'],[/\bunverified\b/gi,'not checked'],[/\bclaims?\b/gi,'position'],[/\bsays\b/gi,'…'],[/\baccording to\b/gi,'in'],[/\bhearsay\b/gi,'second-hand'],[/\bstolen\b/gi,'taken'],[/\bfraud\w*\b/gi,'…']];R.forEach(function(r){t=t.replace(r[0],r[1]);});return t;}
function pl(n,a,b){return n+' '+(n===1?a:b);}
function getj(u){return fetch(u,{cache:'no-cache'}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json();});}
function fetchKind(base,kind){var out=[];function page(off){return getj(base+'?kind='+kind+'&limit=500&offset='+off).then(function(d){out=out.concat(d.items||[]);if((d.items||[]).length===500)return page(off+500);return out;});}return page(0);}
function live(i){if(i>=LIVE.length)return Promise.reject(new Error('no live catalogue'));var b=LIVE[i];return Promise.all([fetchKind(b,'evidence'),fetchKind(b,'missing_record')]).then(function(r){src='live catalogue';return r[0].concat(r[1]);}).catch(function(){return live(i+1);});}
function year(x){var y=parseInt(String(x.date_sort||'').slice(0,4),10);return y>0?y:null;}
function group(items){var g={};items.forEach(function(x){if(DENY[x.id]||/\bBranwen\b|\bSion\b/i.test(x.title||''))return;var y=year(x);var k=y?(y<1824?'before 1824':(Math.floor(y/10)*10)+'s'):'Undated';(g[k]=g[k]||[]).push(x);});
 var keys=Object.keys(g).sort(function(a,b){function n(k){return k==='before 1824'?0:k==='Undated'?99999:parseInt(k,10);}return n(a)-n(b);});
 return keys.map(function(k,i){var it=g[k].sort(function(a,b){return String(a.date_sort).localeCompare(String(b.date_sort))||a.id.localeCompare(b.id);});
  return {key:k,items:it,ev:it.filter(function(x){return x.kind==='evidence';}).length,mr:it.filter(function(x){return x.kind==='missing_record';}).length,nft:NFT[i%NFT.length]};});}
function frames(s){return [{intro:true}].concat(s.items.map(function(x){return {x:x};}));}
function line(x){var held=/HELD/i.test(x.status||'')&&!/NOT/i.test(x.status||'');var t=clean(x.title);if(x.kind==='missing_record')return (x.date_display?clean(x.date_display)+'. ':'')+'A record that should exist and is not yet found: '+t+'.';return (x.date_display&&!/undated/i.test(x.date_display)?clean(x.date_display)+'. ':'')+t+'.'+(held?'':' Not yet held.');}
function words(t){return t.split(/(\s+)/).map(function(w){return /^\s+$/.test(w)?w:'<span class="w">'+esc(w)+'</span>';}).join('');}
function render(){var s=SC[si];var F=frames(s);fi=Math.max(0,Math.min(F.length-1,fi));var f=F[fi];var st=$('#on-stage');gen++;stopVoice();
 document.querySelectorAll('#on-chips button').forEach(function(b,k){b.setAttribute('aria-current',String(k===si));if(k===si&&b.scrollIntoView)b.scrollIntoView({inline:'center',block:'nearest'});});
 $('#on-pos').textContent=s.key+' · '+(fi===0?'intro':fi+' of '+(F.length-1));$('#on-evn').textContent=s.items.length;
 var h='';
 if(f.intro){h='<div class="fr intro" style="--bg:url(https://cedwyn.bucklerfamily.estate/nft-art/art/'+s.nft+'-v0.0.2.webp)"><div class="big yr">'+esc(s.key)+'</div><div class="k">'+s.ev+' catalogue entries · '+s.mr+' records not yet found</div><p class="cap">'+words('Scene: '+s.key+'. '+pl(s.ev,'entry','entries')+' in the catalogue'+(s.mr?', and '+pl(s.mr,'record that should exist','records that should exist')+'.':'.'))+'</p></div>';}
 else{var x=f.x;var mr=x.kind==='missing_record';var held=/HELD/i.test(x.status||'')&&!/NOT/i.test(x.status||'');var sc=EXTRA.scans[x.id];var q=(x.data&&x.data.quote)||EXTRA.quotes[x.id]||'';var pg=PAGES[x.id];
  h='<div class="fr item'+(mr?' mr':'')+'">'+(sc?'<img class="bgimg" alt="" src="'+esc(sc)+'">':'')+'<div class="chip">'+esc(x.id)+'</div><div class="stamp '+(mr?'s-mr':held?'s-held':'s-pend')+'">'+(mr?'NOT YET FOUND':held?'HELD':esc((x.status||'PENDING').toUpperCase()))+'</div>'+
  '<div class="yr2">'+esc(clean(x.date_display||''))+'</div><h2 class="tt">'+clean(x.title).split(' ').map(function(w,k){return '<span style="animation-delay:'+(0.15+k*0.05)+'s">'+esc(w)+'</span>';}).join(' ')+'</h2>'+
  (q?'<blockquote class="q">'+esc(clean(q)).slice(0,420)+'</blockquote>':'')+'<p class="cap">'+words(line(x))+'</p>'+
  (x.holder?'<p class="hold">'+esc(clean(x.holder)).slice(0,220)+'</p>':'')+(pg?'<a class="pg" href="https://cedwyn.bucklerfamily.estate'+esc(pg)+'">Open the evidence page →</a>':'')+'</div>';}
 st.innerHTML=h;var cap=st.querySelector('.cap');
 if(playing){var ws=[].slice.call(cap.querySelectorAll('.w'));var g=gen;if(voice&&SS){speak(cap.textContent,ws,g);}else{var n=0;timer=setInterval(function(){if(g!==gen){clearInterval(timer);return;}if(n<ws.length){ws.forEach(function(w,k){w.classList.toggle('on',k===n);w.classList.toggle('done',k<n);});n++;}else{clearInterval(timer);timer=setTimeout(function(){if(g===gen&&playing)next();},900);}},Math.max(170,300/(+$('#on-speed').value||1)));}}}
function speak(text,ws,g){var u=new SpeechSynthesisUtterance(text);u.lang='en-GB';u.rate=+$('#on-speed').value||1;var offs=[],p=0;ws.forEach(function(w){var i=text.indexOf(w.textContent,p);offs.push(i);p=i+w.textContent.length;});
 u.onboundary=function(e){if(g!==gen)return;var k=0;for(var j=0;j<offs.length;j++){if(offs[j]<=e.charIndex)k=j;}ws.forEach(function(w,j){w.classList.toggle('on',j===k);w.classList.toggle('done',j<k);});};
 u.onend=function(){if(g===gen&&playing)setTimeout(function(){if(g===gen&&playing)next();},700);};try{SS.speak(u);}catch(e){}}
function stopVoice(){clearInterval(timer);clearTimeout(timer);if(SS)try{SS.cancel();}catch(e){}}
function next(){var F=frames(SC[si]);if(fi<F.length-1){fi++;}else if(si<SC.length-1){si++;fi=0;}else{playing=false;sync();}render();}
function prev(){if(fi>0)fi--;else if(si>0){si--;fi=frames(SC[si]).length-1;}render();}
function sync(){$('#on-pp').textContent=playing?'Pause':'Play';$('#on-pp').setAttribute('aria-pressed',String(playing));}
function toggle(){playing=!playing;sync();if(playing)render();else{stopVoice();gen++;openEv();}}
function openEv(){var s=SC[si];$('#on-evt').textContent='Evidence · '+s.key+' ('+s.items.length+')';$('#on-list').innerHTML=s.items.map(function(x,k){var pg=PAGES[x.id];var sc=EXTRA.scans[x.id];var q=(x.data&&x.data.quote)||EXTRA.quotes[x.id];
  return '<li class="st-item">'+(sc?'<img class="th" loading="lazy" alt="" src="'+esc(sc)+'">':'<div class="noth">'+esc(x.id)+'</div>')+'<div><div class="id">'+esc(x.id)+'</div><h3>'+esc(clean(x.title))+'</h3><p class="lbl">'+esc(clean(x.date_display||''))+' · '+esc(x.status||'')+'</p></div><div class="full"><p class="lbl">Description</p><p>'+esc(clean((x.data&&x.data.type?x.data.type+'. ':'')+(x.holder?'Holder and reference: '+x.holder:'')))+'</p><p class="lbl">Transcript</p>'+(q?'<blockquote>'+esc(clean(q))+'</blockquote>':'<p><i>Transcript pending</i></p>')+'<p><button type="button" class="go" data-k="'+(k+1)+'">Show this frame</button>'+(pg?' · <a href="https://cedwyn.bucklerfamily.estate'+esc(pg)+'">Open the evidence page →</a>':'')+'</p></div></li>';}).join('');
 var d=$('#on-ev');if(d.showModal)d.showModal();else d.setAttribute('open','');}
function boot(){var root=$('#online');
 Promise.all([live(0).catch(function(){src='saved copy (offline)';return getj(ROOT+'data/online-snapshot.json').then(function(d){return d.items;});}),getj(ROOT+'data/pages.json').catch(function(){return {};}),getj(ROOT+'data/online-extras.json').catch(function(){return {scans:{},quotes:{}};})]).then(function(r){PAGES=r[1];EXTRA=r[2];SC=group(r[0]);
  var total=SC.reduce(function(a,s){return a+s.items.length;},0);
  root.innerHTML='<div class="st-top"><span class="st-kick">Cedwyn Online · Storytime, every entry</span></div><p class="on-sub">'+total+' entries from the '+esc(src)+', in '+SC.length+' scenes. New catalogue entries appear here without a rebuild.</p>'+
  '<nav class="st-chips" dir="ltr" id="on-chips" aria-label="Scenes">'+SC.map(function(s,k){return '<button type="button" data-k="'+k+'">'+esc(s.key)+' ('+s.items.length+')</button>';}).join('')+'</nav>'+
  '<p class="st-kick" id="on-pos"></p><div id="on-stage" class="on-stage" aria-live="polite"></div>'+
  '<div class="on-opts"><label><input type="checkbox" id="on-voice"> Read aloud</label><label>Speed <select id="on-speed"><option value="0.8">0.8×</option><option value="1" selected>1×</option><option value="1.3">1.3×</option><option value="1.7">1.7×</option></select></label></div>'+
  '<p class="st-foot">Storytime online v0.1.0. One frame per catalogue entry, grouped by decade; records that should exist but are not yet found appear in red. Titles are the catalogue’s own; interpretation is kept out of these frames. Paintings behind the scene titles are from the Garden Gallery.</p>'+
  '<div class="st-bar" dir="ltr"><button id="on-prev" type="button" aria-label="Back">◀</button><button id="on-pp" class="pp" type="button" aria-pressed="false">Play</button><button id="on-evb" type="button">Evidence (<span id="on-evn"></span>)</button><button id="on-next" type="button" aria-label="Next">▶</button></div>'+
  '<dialog class="st-ev" id="on-ev" aria-labelledby="on-evt"><div class="st-evh"><h2 id="on-evt"></h2><button id="on-close" type="button">Close</button></div><ul class="st-items" id="on-list"></ul></dialog>';
  document.querySelectorAll('#on-chips button').forEach(function(b){b.onclick=function(){si=+b.dataset.k;fi=0;render();};});
  $('#on-prev').onclick=prev;$('#on-next').onclick=next;$('#on-pp').onclick=toggle;$('#on-evb').onclick=function(){playing=false;sync();stopVoice();gen++;openEv();};
  $('#on-close').onclick=function(){$('#on-ev').close();};$('#on-voice').onchange=function(){voice=this.checked;if(playing)render();};
  $('#on-list').addEventListener('click',function(e){var b=e.target.closest('button.go');if(b){fi=+b.dataset.k;$('#on-ev').close();render();}});
  document.addEventListener('keydown',function(e){if($('#on-ev').open)return;if(e.target&&/^(SELECT|INPUT)$/.test(e.target.tagName))return;if(e.key===' '&&e.target.tagName!=='BUTTON'){e.preventDefault();toggle();}else if(e.key==='ArrowRight')next();else if(e.key==='ArrowLeft')prev();else if(e.key==='e'||e.key==='E')$('#on-evb').click();});
  var sx=null;$('#on-stage').addEventListener('touchstart',function(e){sx=e.touches[0].clientX;},{passive:true});$('#on-stage').addEventListener('touchend',function(e){if(sx==null)return;var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50){dx<0?next():prev();}sx=null;});
  sync();render();}).catch(function(e){root.innerHTML='<p>The catalogue could not be opened just now ('+esc(e.message)+').</p>';});}
document.addEventListener('visibilitychange',function(){if(document.hidden&&playing){playing=false;sync();stopVoice();gen++;}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
