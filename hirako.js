javascript:(function(){
var H=function(){
var V='1.0.0',$={},E=[];
var T=function(t,e){
for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}
};
var $1=function(t,e,n){
return e&&T(t.prototype,e),n&&T(t,n),t
};
var _=function t(e,n,r){null===e&&(e=Function.prototype);var i=Object.create(e&&e.prototype);return i&&(n&&$1(i,n,r)),i};
var L=function(t){return!!t&&"object"==typeof t};
var I=function(t,e){for(var n in e)t[n]=e[n];return t};
var C=function(t,e){for(var n in e)t[n]=e[n];return t};
var D=function(t,e,n){t.addEventListener(e,n)};
var N=function(t){t.parentNode&&t.parentNode.removeChild(t)};
var S=document.createElement.bind(document);
var R=function(t){return document.querySelector(t)};
var O=function(t){return document.querySelectorAll(t)};
var B=function(t){return Array.from(t)};
var q=function(t,e){for(var n=0;n<t.length;n++)t[n]===e&&t.splice(n,1)};
var z=function(t){var e="";return t&&(e=t.replace(/[&<>]/g,function(t){
return{'&':'&amp;','<':'&lt;','>':'&gt;'}[t]})),e};
var U=function(t,e,n){for(var r=0;r<t.length;r++)if(t[r]===e)return r;return-1};
var F=function(){return(new Date).toLocaleTimeString()};
var G=function(t){try{return JSON.parse(t)}catch(e){return t}};
var H=function(t){try{return JSON.stringify(t,null,2)}catch(e){return t+""}};
var M={};
var X={init:function(){
if(M.active)return;
M.panel=document.createElement('div');
M.panel.id='hirako-v2';
M.panel.style.cssText='position:fixed;bottom:0;left:0;right:0;background:#1e1e2e;color:#fff;z-index:999999;font-family:monospace;font-size:12px;border-top:3px solid #ff6b6b;box-shadow:0 -2px 10px rgba(0,0,0,0.3);transition:all 0.3s ease;';
M.panel.innerHTML='<div style="display:flex;background:#2a2a3a;padding:8px;border-bottom:1px solid #3a3a4a;"><div style="flex:1;display:flex;gap:10px;"><button data-tab="inspect" class="htab active" style="background:#ff6b6b;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">🔍 Inspect</button><button data-tab="console" class="htab" style="background:#3a3a4a;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">📝 Console</button><button data-tab="elements" class="htab" style="background:#3a3a4a;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">📄 DOM</button><button data-tab="storage" class="htab" style="background:#3a3a4a;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">💾 Storage</button><button data-tab="info" class="htab" style="background:#3a3a4a;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">ℹ️ Info</button></div><div><button id="hclose" style="background:#ff6b6b;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">✖</button></div></div><div id="hcontent" style="height:250px;overflow:auto;padding:10px;background:#1e1e2e;"></div><div style="background:#2a2a3a;padding:5px;font-size:10px;border-top:1px solid #3a3a4a;"><span>🎯 Hirako v1.0</span><span style="margin-left:15px;">⚡ Tap elements to inspect</span></div>';
document.body.appendChild(M.panel);
M.active=true;
M.el=M.panel;
document.querySelectorAll('.htab').forEach(function(t){
t.onclick=function(){M.switchTab(t.dataset.tab)}
});
document.getElementById('hclose').onclick=function(){M.destroy()};
M.switchTab('inspect');
},switchTab:function(t){
document.querySelectorAll('.htab').forEach(function(e){
e.style.background='#3a3a4a'
});
document.querySelector('[data-tab="'+t+'"]').style.background='#ff6b6b';
if(t==='inspect')M.showInspect();
if(t==='console')M.showConsole();
if(t==='elements')M.showElements();
if(t==='storage')M.showStorage();
if(t==='info')M.showInfo();
},showInspect:function(){
var c=document.getElementById('hcontent');
c.innerHTML='<div style="margin-bottom:10px;"><button id="hpick" style="background:#ff6b6b;color:#fff;border:none;padding:8px;border-radius:5px;margin-right:5px;cursor:pointer;">🎯 Pilih Elemen</button><button id="hhighlight" style="background:#4a6bff;color:#fff;border:none;padding:8px;border-radius:5px;cursor:pointer;">✨ Highlight Semua</button><button id="hclear" style="background:#6b6b6b;color:#fff;border:none;padding:8px;border-radius:5px;cursor:pointer;">🗑 Clear</button></div><div id="hresult" style="background:#2a2a3a;padding:10px;border-radius:5px;font-size:11px;"><i>Klik "Pilih Elemen" lalu tap elemen di halaman</i></div><div id="hcss" style="margin-top:10px;background:#2a2a3a;padding:10px;border-radius:5px;display:none;"><b>🎨 CSS</b><div id="hcssc" style="font-size:11px;margin-top:5px;"></div></div>';
document.getElementById('hpick').onclick=function(){M.pickElement()};
document.getElementById('hhighlight').onclick=function(){M.highlightAll()};
document.getElementById('hclear').onclick=function(){
document.getElementById('hresult').innerHTML='<i>Ready to inspect...</i>';
document.getElementById('hcss').style.display='none';
};
},pickElement:function(){
var ov=S('div');
ov.id='hpoverlay';
ov.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(255,107,107,0.1);z-index:1000000;cursor:crosshair;';
document.body.appendChild(ov);
var tip=S('div');
tip.id='hptip';
tip.style.cssText='position:fixed;background:#ff6b6b;color:#fff;padding:5px 10px;border-radius:5px;font-size:12px;z-index:1000001;pointer-events:none;';
document.body.appendChild(tip);
var hover=function(e){
var el=e.target;
tip.innerHTML=el.tagName+(el.id?'#'+el.id:'')+(el.className?'.'+el.className.split(' ')[0]:'');
tip.style.left=(e.clientX+15)+'px';
tip.style.top=(e.clientY+15)+'px';
el.style.outline='2px solid #ff6b6b';
setTimeout(function(){if(el.style.outline)el.style.outline=''},100);
};
var pick=function(e){
e.preventDefault();
e.stopPropagation();
var el=e.target;
var info='<b>📦 Element:</b> '+el.tagName+'<br>';
info+='<b>🆔 ID:</b> '+ (el.id||'-')+'<br>';
info+='<b>📝 Class:</b> '+ (el.className||'-')+'<br>';
info+='<b>📐 Size:</b> '+Math.round(el.offsetWidth)+'x'+Math.round(el.offsetHeight)+'px<br>';
info+='<b>👶 Children:</b> '+el.children.length+'<br>';
info+='<b>📄 InnerHTML:</b> <span style="color:#ffa500;">'+z(el.innerHTML.substring(0,100))+'</span><br>';
info+='<button id="hviewcss" style="background:#4a6bff;color:#fff;border:none;padding:5px;border-radius:3px;margin-top:5px;cursor:pointer;">🎨 Lihat CSS</button> ';
info+='<button id="hedithtml" style="background:#ffa500;color:#fff;border:none;padding:5px;border-radius:3px;margin-top:5px;cursor:pointer;">✏️ Edit HTML</button>';
document.getElementById('hresult').innerHTML=info;
document.getElementById('hviewcss')&&(document.getElementById('hviewcss').onclick=function(){
var s=getComputedStyle(el);
var css='';
for(var i=0;i<s.length;i++){var p=s[i];var v=s.getPropertyValue(p);if(v&&v!=='normal'&&v!=='auto'&&v!=='none')css+=p+': '+v+';\n';}
document.getElementById('hcssc').innerHTML='<pre style="margin:0;color:#4ecdc4;">'+css.substring(0,1000)+'</pre>';
document.getElementById('hcss').style.display='block';
});
document.getElementById('hedithtml')&&(document.getElementById('hedithtml').onclick=function(){
var nh=prompt('Edit HTML:',el.outerHTML);
if(nh){el.outerHTML=nh;M.pickElement();}
});
document.removeEventListener('mouseover',hover);
document.removeEventListener('click',pick);
ov.remove();
tip.remove();
};
document.addEventListener('mouseover',hover);
document.addEventListener('click',pick);
},highlightAll:function(){
var els=document.querySelectorAll('*');
var c=0;
els.forEach(function(el){
if(el!==M.panel&&!el.id?.includes('hirako')){
el.style.outline='1px solid #ff6b6b';
c++;
}
});
setTimeout(function(){
els.forEach(function(el){
if(el.style.outline==='1px solid #ff6b6b')el.style.outline='';
});
},2000);
},logs:[],
origLog:{log:null,error:null,warn:null,info:null},
showConsole:function(){
var c=document.getElementById('hcontent');
c.innerHTML='<div style="margin-bottom:10px;"><button id="hclearconsole" style="background:#ff6b6b;color:#fff;border:none;padding:5px;border-radius:3px;cursor:pointer;">Clear</button><button id="hrunjs" style="background:#4a6bff;color:#fff;border:none;padding:5px;border-radius:3px;margin-left:5px;cursor:pointer;">Run JS</button></div><div id="hconsoleout" style="background:#0a0a0f;height:180px;overflow:auto;padding:5px;font-size:10px;border-radius:5px;"></div><div style="margin-top:5px;"><input type="text" id="hjsinput" placeholder="JavaScript code..." style="width:70%;background:#2a2a3a;color:#fff;border:1px solid #ff6b6b;padding:5px;border-radius:3px;"><button id="hexec" style="background:#4a6bff;color:#fff;border:none;padding:5px;border-radius:3px;cursor:pointer;">Execute</button></div>';
M.captureConsole();
M.updateConsole();
document.getElementById('hclearconsole').onclick=function(){M.logs=[];M.updateConsole();};
document.getElementById('hrunjs').onclick=function(){
var code=document.getElementById('hjsinput').value;
if(code)M.execJS(code);
};
document.getElementById('hexec').onclick=function(){
var code=document.getElementById('hjsinput').value;
if(code)M.execJS(code);
};
},captureConsole:function(){
if(M.origLog.log)return;
M.origLog.log=console.log;
M.origLog.error=console.error;
M.origLog.warn=console.warn;
M.origLog.info=console.info;
var self=M;
console.log=function(){self.logs.push(['📝 LOG',F(),Array.from(arguments).join(' ')]);M.origLog.log.apply(console,arguments);self.updateConsole();};
console.error=function(){self.logs.push(['❌ ERROR',F(),Array.from(arguments).join(' ')]);M.origLog.error.apply(console,arguments);self.updateConsole();};
console.warn=function(){self.logs.push(['⚠️ WARN',F(),Array.from(arguments).join(' ')]);M.origLog.warn.apply(console,arguments);self.updateConsole();};
console.info=function(){self.logs.push(['ℹ️ INFO',F(),Array.from(arguments).join(' ')]);M.origLog.info.apply(console,arguments);self.updateConsole();};
},updateConsole:function(){
var out=document.getElementById('hconsoleout');
if(out){
out.innerHTML=M.logs.map(function(l){
var col=l[0].includes('ERROR')?'#ff6b6b':(l[0].includes('WARN')?'#ffa500':(l[0].includes('INFO')?'#4ecdc4':'#fff'));
return '<div style="border-bottom:1px solid #2a2a3a;padding:3px;"><span style="color:'+col+';">'+l.join(' ')+'</span></div>';
}).join('')||'<i>No logs...</i>';
out.scrollTop=out.scrollHeight;
}
},execJS:function(code){
try{
var res=eval(code);
M.logs.push(['▶ EXEC',F(),code,'→',res]);
M.updateConsole();
}catch(e){
M.logs.push(['❌ ERROR',F(),e.message]);
M.updateConsole();
}
},showElements:function(){
var c=document.getElementById('hcontent');
c.innerHTML='<div style="margin-bottom:5px;"><button id="hrefreshdom" style="background:#4a6bff;color:#fff;border:none;padding:5px;border-radius:3px;cursor:pointer;">🔄 Refresh</button><span style="margin-left:10px;color:#4ecdc4;">Total: '+document.querySelectorAll('*').length+'</span></div><div id="hdomtree" style="background:#0a0a0f;height:200px;overflow:auto;padding:5px;font-size:11px;border-radius:5px;">'+M.genDOMTree(document.body,0)+'</div>';
document.getElementById('hrefreshdom').onclick=function(){
document.getElementById('hdomtree').innerHTML=M.genDOMTree(document.body,0);
};
},genDOMTree:function(n,l){
if(n.nodeType===1&&!n.id?.includes('hirako')){
var sp='  '.repeat(l);
var tag=n.tagName.toLowerCase();
var id=n.id?'#'+n.id:'';
var cls=n.className?'.'+n.className.toString().split(' ')[0]:'';
var html=sp+'<span style="color:#ff6b6b;">&lt;'+tag+id+cls+'&gt;</span>\n';
for(var i=0;i<n.children.length;i++){
if(!n.children[i].id?.includes('hirako')){
html+=M.genDOMTree(n.children[i],l+1);
}
}
if(n.children.length===0&&n.textContent.trim()){
var txt=n.textContent.trim().substring(0,50);
if(txt)html+=sp+'  '+'<span style="color:#4ecdc4;">"'+z(txt)+'"</span>\n';
}
html+=sp+'<span style="color:#ff6b6b;">&lt;/'+tag+'&gt;</span>\n';
return html;
}
return '';
},showStorage:function(){
var c=document.getElementById('hcontent');
var ls=localStorage;
var ss=sessionStorage;
var lsd={},ssd={};
try{for(var i=0;i<ls.length;i++){var k=ls.key(i);lsd[k]=ls.getItem(k);}}catch(e){}
try{for(var j=0;j<ss.length;j++){var sk=ss.key(j);ssd[sk]=ss.getItem(sk);}}catch(e){}
var lh='',sh='';
for(var lk in lsd){lh+='<tr><td style="color:#ffa500;">'+z(lk)+'</td><td style="color:#4ecdc4;">'+z(lsd[lk].substring(0,100))+'</td></tr>';}
for(var skk in ssd){sh+='<tr><td style="color:#ffa500;">'+z(skk)+'</td><td style="color:#4ecdc4;">'+z(ssd[skk].substring(0,100))+'</td></tr>';}
c.innerHTML='<div style="margin-bottom:10px;"><button id="hclearallstorage" style="background:#ff6b6b;color:#fff;border:none;padding:5px;border-radius:3px;cursor:pointer;">🗑 Clear All</button></div><div style="background:#0a0a0f;height:200px;overflow:auto;padding:5px;font-size:10px;border-radius:5px;"><b>💾 Local Storage:</b><br><table style="width:100%">'+lh+'</table><hr><b>💿 Session Storage:</b><br><table style="width:100%">'+sh+'</table><hr><b>🍪 Cookies:</b><br><pre style="color:#4ecdc4;">'+z(document.cookie||'(empty)')+'</pre></div>';
document.getElementById('hclearallstorage').onclick=function(){
if(confirm('Clear all storage?')){
localStorage.clear();
sessionStorage.clear();
M.showStorage();
}
};
},showInfo:function(){
var c=document.getElementById('hcontent');
var ua=navigator.userAgent;
var scr=screen;
var info='<div style="background:#0a0a0f;padding:10px;border-radius:5px;font-size:11px;">';
info+='<b>🔧 System Info:</b><br><br>';
info+='🌐 User Agent: <span style="color:#4ecdc4;">'+z(ua.substring(0,200))+'</span><br>';
info+='📱 Screen: <span style="color:#4ecdc4;">'+scr.width+'x'+scr.height+'</span><br>';
info+='👁️ Viewport: <span style="color:#4ecdc4;">'+window.innerWidth+'x'+window.innerHeight+'</span><br>';
info+='🔍 Pixel Ratio: <span style="color:#4ecdc4;">'+window.devicePixelRatio+'</span><br>';
info+='📄 URL: <span style="color:#4ecdc4;word-break:break-all;">'+z(location.href)+'</span><br>';
info+='⏰ Time: <span style="color:#4ecdc4;">'+new Date().toLocaleString()+'</span><br>';
info+='💾 Memory: <span style="color:#4ecdc4;">'+(performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576)+' MB':'N/A')+'</span><br>';
info+='📊 DOM Elements: <span style="color:#4ecdc4;">'+document.querySelectorAll('*').length+'</span><br>';
info+='</div>';
c.innerHTML=info;
},destroy:function(){
if(M.panel)M.panel.remove();
if(M.origLog.log){
console.log=M.origLog.log;
console.error=M.origLog.error;
console.warn=M.origLog.warn;
console.info=M.origLog.info;
}
M.active=false;
}
};
return X;
}();
H.init();
window.hirako=H;
})();
