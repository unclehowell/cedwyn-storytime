/* Storytime engine v0.1.0 — one engine for the museum, Wales tour and Patagonia walk-round. Static, no outside scripts. — Sion's Tab agent */
(function(){
'use strict';
var C=window.STORYTIME||{};var V=C.variant||'museum';
var BCP={en:'en-GB',cy:'cy-GB',es:(V==='patagonia'?'es-AR':'es-ES'),fr:'fr-FR',de:'de-DE',it:'it-IT',pt:'pt-PT',nl:'nl-NL',pl:'pl-PL',ru:'ru-RU',uk:'uk-UA',tr:'tr-TR',sv:'sv-SE',ar:'ar-SA',hi:'hi-IN',bn:'bn-IN',zh:'zh-CN',ja:'ja-JP',ko:'ko-KR'};
var D,CAT,EN,T={},lang='en',idx=0,playing=false,started=false,segs=[],wordEls=[],cur=-1,chunkQ=[],speakGen=0,estTimer=null,boundarySeen=false,galIdx=0,galTimer=null,resumeAt=0;
var SS=window.speechSynthesis||null;
function $(s,r){return (r||document).querySelector(s);}
function el(t,a,h){var e=document.createElement(t);if(a)for(var k in a){if(k==='class')e.className=a[k];else if(k==='text')e.textContent=a[k];else e.setAttribute(k,a[k]);}if(h!=null)e.innerHTML=h;return e;}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function getj(u){return fetch(u,{cache:'no-cache'}).then(function(r){if(!r.ok)throw new Error(u+' '+r.status);return r.json();});}
function ui(k){return (T[lang]&&T[lang].ui&&T[lang].ui[k])||EN.ui[k]||k;}
function scene(){return D.scenes[idx];}
function sText(s){var t=T[lang];if(V==='wales'){var x=t&&t.scenes&&t.scenes[s.id];return {title:(x&&x.title)||s.title,when:(x&&x.when)||s.when,text:(x&&x.short)||s.text};}
 if(V==='patagonia'){var p=t&&t.patagonia&&t.patagonia[s.id];return {title:(p&&p.title)||s.title,when:s.when,text:(p&&p.text)||s.text};}
 return {title:s.title,when:s.when,text:s.text};}
/* ---- words ---- */
function segment(text){var out=[];
 if(window.Intl&&Intl.Segmenter){try{var sg=new Intl.Segmenter(lang,{granularity:'word'});var it=sg.segment(text);for(var s of it){out.push({t:s.segment,i:s.index,w:!!s.isWordLike||/[0-9]/.test(s.segment)});}return out;}catch(e){}}
 var re=/(\s+)/;var pos=0;text.split(re).forEach(function(p){if(!p)return;if(/^[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]+$/.test(p)){for(var k=0;k<p.length;k++){out.push({t:p[k],i:pos+k,w:true});}}else out.push({t:p,i:pos,w:!/^\s+$/.test(p)});pos+=p.length;});return out;}
function renderSub(text){var box=$('#st-sub');box.innerHTML='';wordEls=[];segs=segment(text);
 segs.forEach(function(s){if(s.w){var sp=el('span',{class:'w'});sp.textContent=s.t;sp.dataset.i=s.i;sp.dataset.e=s.i+s.t.length;box.appendChild(sp);wordEls.push(sp);}else box.appendChild(document.createTextNode(s.t));});cur=-1;}
function hiliteChar(ci){for(var k=0;k<wordEls.length;k++){var a=+wordEls[k].dataset.i,b=+wordEls[k].dataset.e;if(ci>=a&&ci<b){hiliteWord(k);return;}if(ci<a){hiliteWord(Math.max(0,k-1));return;}}}
function hiliteWord(k){if(k===cur)return;for(var j=0;j<wordEls.length;j++){wordEls[j].classList.toggle('on',j===k);wordEls[j].classList.toggle('done',j<k);}cur=k;var e=wordEls[k];if(e&&e.scrollIntoView&&!isVisible(e))e.scrollIntoView({block:'nearest'});}
function isVisible(e){var r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight-70;}
/* ---- speech ---- */
function pickVoice(){if(!SS)return null;var vs=SS.getVoices()||[];var b=BCP[lang]||lang;var l=b.toLowerCase();
 return vs.find(function(v){return v.lang&&v.lang.toLowerCase().replace('_','-')===l;})||vs.find(function(v){return v.lang&&v.lang.toLowerCase().indexOf(lang)===0;})||null;}
function chunks(text,from){var res=[],re=/[^.!?。！？؟।]+[.!?。！？؟।]*\s*/g,m;while((m=re.exec(text))){if(m.index+m[0].length<=from)continue;var st=Math.max(m.index,from);res.push({t:text.slice(st,m.index+m[0].length),o:st});}return res;}
function stopSpeech(){speakGen++;if(SS)try{SS.cancel();}catch(e){}clearInterval(estTimer);estTimer=null;}
function speakFrom(from){stopSpeech();var gen=speakGen;var text=sText(scene()).text;var v=pickVoice();
 $('#st-novoice').hidden=!!v;
 boundarySeen=false;var q=chunks(text,from);if(!q.length){done(gen);return;}
 if(!SS||!v){estimate(text,from,gen);return;}
 var n=0;function next(){if(gen!==speakGen)return;if(n>=q.length){done(gen);return;}var c=q[n++];var u=new SpeechSynthesisUtterance(c.t);u.voice=v;u.lang=v.lang;u.rate=V==='wales'?0.92:0.95;
  u.onboundary=function(e){if(gen!==speakGen)return;if(e.name&&e.name!=='word')return;boundarySeen=true;clearInterval(estTimer);estTimer=null;resumeAt=c.o+e.charIndex;hiliteChar(c.o+e.charIndex);};
  u.onstart=function(){if(gen!==speakGen)return;hiliteChar(c.o);setTimeout(function(){if(gen===speakGen&&!boundarySeen&&!estTimer)estimateChunk(c,gen);},900);};
  u.onend=function(){if(gen!==speakGen)return;clearInterval(estTimer);estTimer=null;resumeAt=c.o+c.t.length;next();};
  u.onerror=function(){if(gen!==speakGen)return;next();};
  try{SS.speak(u);}catch(e){estimate(text,from,gen);}}
 next();}
function perWordMs(){return /^(zh|ja|ko)$/.test(lang)?260:330;}
function estimateChunk(c,gen){var start=Date.now();var idxs=wordEls.map(function(w,k){return k;}).filter(function(k){var a=+wordEls[k].dataset.i;return a>=c.o&&a<c.o+c.t.length;});var k0=0;
 estTimer=setInterval(function(){if(gen!==speakGen){clearInterval(estTimer);return;}var k=Math.min(idxs.length-1,Math.floor((Date.now()-start+600)/perWordMs()));if(k>=0&&idxs[k]!=null){hiliteWord(idxs[k]);resumeAt=+wordEls[idxs[k]].dataset.i;}},120);}
function estimate(text,from,gen){var ks=wordEls.map(function(w,k){return k;}).filter(function(k){return +wordEls[k].dataset.i>=from;});var n=0;
 estTimer=setInterval(function(){if(gen!==speakGen){clearInterval(estTimer);return;}if(n>=ks.length){clearInterval(estTimer);estTimer=null;setTimeout(function(){done(gen);},700);return;}hiliteWord(ks[n]);resumeAt=+wordEls[ks[n]].dataset.i;n++;},perWordMs()+60);}
function done(gen){if(gen!==speakGen)return;wordEls.forEach(function(w){w.classList.remove('on');w.classList.add('done');});resumeAt=0;
 if(playing){if(idx<D.scenes.length-1){setTimeout(function(){if(gen===speakGen&&playing){go(idx+1,true);}},1600);}else{playing=false;syncBar();}}}
/* ---- stage ---- */
function imgs(s){return s.gallery&&s.gallery.length?s.gallery:[s.img];}
function showImage(s,g){var st=$('#st-stage');var im=imgs(s)[g]||imgs(s)[0];st.className='st-stage'+(im.holo?' st-holo':'')+(D.wireframe&&im.wire?' wf':'');st.innerHTML='';
 if(D.wireframe&&im.wire){var w=el('img',{class:'wire',alt:'',src:C.root+im.wire});st.appendChild(w);}
 var r=el('img',{class:'real',alt:im.alt||im.caption||'',src:C.root+im.src});st.appendChild(r);
 if(im.badge)st.appendChild(el('span',{class:'st-badge',text:im.badge}));
 st.appendChild(el('div',{class:'st-cap',text:im.caption||''}));
 if(D.wireframe&&im.wire){var n=0;function ok(){if(++n===2)setTimeout(function(){st.classList.add('go');},700);}w.onload=ok;r.onload=ok;if(w.complete)ok();if(r.complete)ok();}
 var gal=$('#st-gal');gal.innerHTML='';var list=imgs(s);if(list.length>1){list.forEach(function(x,k){var b=el('button',{type:'button','aria-label':(x.caption||'image '+(k+1)),'aria-current':String(k===g)});b.appendChild(el('img',{src:C.root+(x.thumb||x.src),alt:''}));b.onclick=function(){galIdx=k;clearInterval(galTimer);showImage(s,k);};gal.appendChild(b);});}}
function startGallery(s){clearInterval(galTimer);var list=imgs(s);if(list.length<2)return;var per=Math.max(7000,(sText(s).text.split(/\s+/).length*perWordMs())/list.length);galTimer=setInterval(function(){if(!playing)return;galIdx=(galIdx+1)%list.length;showImage(s,galIdx);},per);}
/* ---- render ---- */
function go(i,autoplay){stopSpeech();clearInterval(galTimer);idx=Math.max(0,Math.min(D.scenes.length-1,i));galIdx=0;resumeAt=0;var s=scene();var tx=sText(s);
 try{history.replaceState(null,'','#'+s.id);}catch(e){}
 $('#st-num').textContent=(V==='patagonia'?ui('location'):ui('scene'))+' '+(idx+1)+' '+ui('of')+' '+D.scenes.length;
 $('#st-h').textContent=tx.title;$('#st-when').textContent=tx.when||'';
 renderSub(tx.text);showImage(s,0);
 var tb=$('#st-test');tb.innerHTML='';if(s.testimony&&s.testimony.length){tb.hidden=false;tb.innerHTML='<b>'+esc(ui('testimony'))+'</b>'+s.testimony.map(function(t){return '<div>'+esc(t)+'</div>';}).join('');}else tb.hidden=true;
 document.querySelectorAll('#st-chips button').forEach(function(b,k){b.setAttribute('aria-current',String(k===idx));if(k===idx&&b.scrollIntoView)b.scrollIntoView({inline:'center',block:'nearest'});});
 $('#st-evn').textContent=s.items.length;$('#st-mt').hidden=(lang==='en');
 if(autoplay&&playing){speakFrom(0);startGallery(s);} syncBar();}
function syncBar(){var b=$('#st-pp');b.textContent=playing?ui('pause'):(resumeAt>0?ui('resume'):ui('play'));b.setAttribute('aria-pressed',String(playing));}
function play(){playing=true;started=true;$('#st-startwrap').hidden=true;speakFrom(resumeAt||0);startGallery(scene());syncBar();}
function pause(openEv){playing=false;var keep=resumeAt;stopSpeech();resumeAt=keep;clearInterval(galTimer);syncBar();if(openEv)openEvidence();}
function toggle(){if(playing)pause(true);else play();}
/* ---- evidence ---- */
function openEvidence(){var s=scene();var dlg=$('#st-ev');var ul=$('#st-items');ul.innerHTML='';$('#st-evtitle').textContent=ui('evidence')+' · '+sText(s).title+' ('+s.items.length+')';
 s.items.forEach(function(id){var it=CAT.items[id]||{id:id,title:id};var li=el('li',{class:'st-item'});
  var th=(V==='patagonia'?it.thumb_p:it.thumb);
  var title=(V==='patagonia'&&it.title_ar)?it.title_ar:it.title;
  li.innerHTML=(th?'<img class="th" loading="lazy" src="'+esc(C.root+th)+'" alt="">':'<div class="noth">'+esc(id)+'</div>')+
  '<div><div class="id">'+esc(id)+'</div><h3>'+esc(title)+'</h3><p class="lbl">'+esc(it.date||'')+'</p></div>'+
  '<div class="full"><p class="lbl">'+esc(ui('description'))+'</p><p>'+esc((V==='patagonia'&&it.description_ar)?it.description_ar:it.description||'')+'</p>'+
  '<p class="lbl">'+esc(ui('transcript'))+(it.transcript?' · '+esc(it.transcript_status):'')+'</p>'+(it.transcript&&!(V==='patagonia'&&it.money)?'<blockquote>'+esc(it.transcript)+'</blockquote>':'<p><i>'+esc(ui('transcript_pending'))+'</i></p>')+
  (it.page?'<p><a href="'+esc(it.page)+'">'+esc(ui('open_page'))+' →</a></p>':'')+'</div>';ul.appendChild(li);});
 if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','');setTimeout(function(){$('#st-evclose').focus();},30);}
function closeEvidence(){var d=$('#st-ev');if(d.close)d.close();else d.removeAttribute('open');$('#st-pp').focus();}
/* ---- languages ---- */
function setLang(l){lang=l;try{localStorage.setItem('st-lang-'+V,l);}catch(e){}document.documentElement.lang=l;var t=T[l];document.documentElement.dir=(t&&t.dir)||'ltr';
 var p=(l==='en'||T[l])?Promise.resolve():getj(C.root+'data/i18n/'+l+'.json').then(function(x){T[l]=x;document.documentElement.dir=x.dir||'ltr';});
 return p.then(function(){labels();var was=playing;go(idx,false);if(was){playing=true;speakFrom(0);startGallery(scene());syncBar();}}).catch(function(){lang='en';labels();go(idx,false);});}
function labels(){$('#st-prev').setAttribute('aria-label',ui('prev'));$('#st-next').setAttribute('aria-label',ui('next'));$('#st-evlbl').textContent=ui('evidence').split(' ')[0];$('#st-evclose').textContent=ui('close');$('#st-mt').textContent=ui('mt');$('#st-novoice').textContent=ui('voice_note');$('#st-start').textContent=ui('start');
 document.querySelectorAll('#st-chips button').forEach(function(b,k){var s=D.scenes[k];var tx=sText(s);b.textContent=(V==='patagonia'?(k+1)+' · '+tx.title:(s.chip||tx.when));});syncBar();}
/* ---- boot ---- */
function shell(){var root=$('#storytime');root.innerHTML=
 '<div class="st-top"><span class="st-kick">'+esc(D.kicker)+'</span>'+(D.langs&&D.langs.length>1?'<label class="st-lang"><span class="st-sr">Language</span><select id="st-langsel"></select></label>':'')+'</div>'+
 '<nav class="st-chips" dir="ltr" id="st-chips" aria-label="'+esc(V==='patagonia'?'Locations':'Scenes')+'"></nav>'+
 '<div class="st-stage" id="st-stage" aria-live="off"></div><div class="st-gal" id="st-gal"></div>'+
 '<p class="st-kick" id="st-num" style="margin:.6rem 0 0"></p><h1 class="st-h" id="st-h"></h1><p class="st-when" id="st-when"></p>'+
 '<div id="st-startwrap"><button class="st-start" id="st-start" type="button"></button></div>'+
 '<div class="st-sub" id="st-sub" aria-live="polite"></div><p class="st-mt" id="st-mt" hidden></p><p class="st-mt" id="st-novoice" hidden></p>'+
 '<div class="st-test" id="st-test" hidden></div>'+
 '<p class="st-foot">'+esc(D.foot||'')+'</p>'+
 '<div class="st-bar" dir="ltr" role="toolbar" aria-label="Player"><button id="st-prev" type="button">◀</button><button id="st-pp" class="pp" type="button" aria-pressed="false"></button><button id="st-evb" class="ev" type="button"><span id="st-evlbl"></span> (<span id="st-evn"></span>)</button><button id="st-next" type="button">▶</button></div>'+
 '<dialog class="st-ev" id="st-ev" aria-labelledby="st-evtitle"><div class="st-evh"><h2 id="st-evtitle"></h2><button id="st-evclose" type="button"></button></div><ul class="st-items" id="st-items"></ul></dialog>';
 var ch=$('#st-chips');D.scenes.forEach(function(s,k){var b=el('button',{type:'button'});b.onclick=function(){go(k,true);};ch.appendChild(b);});
 if($('#st-langsel')){var sel=$('#st-langsel');D.langs.forEach(function(l){var o=el('option',{value:l.code,text:l.name});sel.appendChild(o);});sel.value=lang;sel.onchange=function(){setLang(sel.value);};}
 $('#st-prev').onclick=function(){go(idx-1,true);};$('#st-next').onclick=function(){go(idx+1,true);};$('#st-pp').onclick=toggle;$('#st-evb').onclick=function(){pause(false);openEvidence();};$('#st-start').onclick=play;
 $('#st-evclose').onclick=closeEvidence;
 document.addEventListener('keydown',function(e){if($('#st-ev').open)return;if(e.target&&/^(SELECT|INPUT|TEXTAREA)$/.test(e.target.tagName))return;
  if(e.key===' '&&e.target.tagName!=='BUTTON'){e.preventDefault();toggle();}else if(e.key==='ArrowRight')go(idx+1,true);else if(e.key==='ArrowLeft')go(idx-1,true);else if(e.key==='e'||e.key==='E'){pause(false);openEvidence();}});
 var sx=null;$('#st-stage').addEventListener('touchstart',function(e){sx=e.touches[0].clientX;},{passive:true});$('#st-stage').addEventListener('touchend',function(e){if(sx==null)return;var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50)go(idx+(dx<0?1:-1),true);sx=null;});}
function boot(){C.root=C.root||'../';Promise.all([getj(C.root+'data/'+V+'.json'),getj(C.root+'data/catalogue.json'),getj(C.root+'data/i18n/en.json')]).then(function(r){D=r[0];CAT=r[1];EN=r[2];T.en=EN;
  var saved=null;try{saved=localStorage.getItem('st-lang-'+V);}catch(e){}var want=saved||D.defaultLang||'en';if(!D.langs||!D.langs.some(function(l){return l.code===want;}))want='en';lang=want;
  shell();var h=location.hash.slice(1);var k=D.scenes.findIndex(function(s){return s.id===h;});idx=k>=0?k:0;
  return setLang(lang);}).catch(function(e){$('#storytime').innerHTML='<p>The story could not be opened just now ('+esc(e.message)+').</p>';});
 if(SS&&SS.onvoiceschanged!==undefined){SS.onvoiceschanged=function(){};}
 if('serviceWorker' in navigator&&C.sw!==false){try{navigator.serviceWorker.register(C.root+'sw.js').catch(function(){});}catch(e){}}}
document.addEventListener('visibilitychange',function(){if(document.hidden&&playing)pause(false);});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
