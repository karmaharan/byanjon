(function(){
var API=(window.BY_API||"").replace(/\/$/,""),$=function(s,r){return(r||document).querySelector(s)};
var esc=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
var rs=function(p){return"\u20B9"+(p/100).toFixed(p%100?2:0)};
var CFG={delivery_fee_paise:0,min_order_paise:0},OPEN=true,SM=null,SKNOWN=false,snT=null,MENUMAP={},cart={},geo={},track=null,ws=null,poll=null,tick=null,pingT=null;
function api(path,o){o=o||{};var h={"Content-Type":"application/json"};if(o.gt)h["X-Guest-Token"]=o.gt;
 return fetch(API+path,{method:o.method||"GET",headers:h,body:o.body?JSON.stringify(o.body):undefined}).then(function(r){return r.json().catch(function(){return{}}).then(function(d){if(!r.ok)throw new Error(typeof d.detail==="string"?d.detail:(d.detail&&d.detail[0]&&d.detail[0].msg)||"Something went wrong");return d})})}
// ---- menu prices
window.__price=function(n){var m=MENUMAP[n];return m?'<b>'+rs(m.price_paise)+'</b><button class="add" data-n="'+esc(n)+'">Add</button>':""};
api("/menu").then(function(d){var by={};d.categories.forEach(function(c){by[c.name_en]=c;c.items.forEach(function(i){MENUMAP[i.name_en]=i})});
 // admin panel is the source of truth: names, descriptions, availability and prices come from the API
 (window.__MENU||[]).forEach(function(m){var s=m.en==="Today's Kitchen"?(d.featured.length?d.featured:null):(by[m.en]?by[m.en].items:null);if(s)m.items=s.map(function(i){return[i.name_en,i.name_bn,i.description]})});
 window.__refresh&&window.__refresh()}).catch(function(){});
api("/config").then(function(c){CFG=c;c.store&&applyStore(c.store)}).catch(function(){});

// ---- store open/closed (admin panel is the source of truth; orders already placed are never affected)
var sn=document.createElement("div");sn.id="sn";sn.setAttribute("role","status");sn.setAttribute("aria-live","polite");
sn.innerHTML='<i class="sd"></i><div class="sx"><b></b><span></span></div><button type="button" aria-label="Dismiss">\u00D7</button>';document.body.appendChild(sn);
function sget(){try{return sessionStorage.getItem("by_sn")}catch(e){return null}}function sset(v){try{sessionStorage.setItem("by_sn",v)}catch(e){}}
function skey(){return(OPEN?"1":"0")+"|"+(SM||"")}
function hideNote(remember){clearTimeout(snT);sn.classList.remove("on");if(remember)sset(skey())}
sn.querySelector("button").onclick=function(){hideNote(true)};
function showNote(force,wasClosed){clearTimeout(snT);
 if(OPEN&&!SM&&!wasClosed){hideNote();return}
 if(!force&&sget()===skey())return;
 var b=$("b",sn),t=$("span",sn);sn.className=OPEN?"open":"shut";
 if(OPEN){b.textContent=SM?"\u09B0\u09BE\u09A8\u09CD\u09A8\u09BE\u0998\u09B0 \u0996\u09CB\u09B2\u09BE":"\u09B0\u09BE\u09A8\u09CD\u09A8\u09BE\u0998\u09B0 \u0996\u09CB\u09B2\u09BE \u00B7 We\u2019re open again";t.textContent=SM||"Order away \u2014 the kitchen is taking orders."}
 else{b.textContent="\u09B0\u09BE\u09A8\u09CD\u09A8\u09BE\u0998\u09B0 \u098F\u0996\u09A8 \u09AC\u09A8\u09CD\u09A7 \u00B7 Not taking orders";t.textContent=SM||"The menu is open to browse \u2014 please check back soon."}
 requestAnimationFrame(function(){sn.classList.add("on")});
 if(OPEN)snT=setTimeout(function(){hideNote(true)},SM?11000:6000)}
function ctas(){document.querySelectorAll("[data-order]").forEach(function(a){var t=null;for(var n=a.firstChild;n;n=n.nextSibling)if(n.nodeType===3&&n.nodeValue.trim()){t=n;break}
 if(!t)return;if(a.dataset.o==null)a.dataset.o=t.nodeValue;t.nodeValue=OPEN?a.dataset.o:(a.closest(".hd")?"Closed":"Closed \u00B7 View menu");a.classList.toggle("shut",!OPEN)})}
function menuNote(){var n=$("#shutnote"),mn=$("#menu");if(!mn)return;
 if(OPEN){n&&n.remove();return}
 if(!n){n=document.createElement("div");n.id="shutnote";var tb=$("#tabs");tb?tb.parentNode.insertBefore(n,tb):mn.appendChild(n)}
 n.innerHTML='<b class="bn">\u09B0\u09BE\u09A8\u09CD\u09A8\u09BE\u0998\u09B0 \u098F\u0996\u09A8 \u09AC\u09A8\u09CD\u09A7</b><span>'+esc(SM||"We\u2019re not taking orders right now \u2014 browse the menu and come back soon.")+'</span>'}
function gate(){if(track)return;var g=$("#go");if(!g)return;var n=$("#cn");
 if(!OPEN){if(!n){n=document.createElement("div");n.id="cn";n.className="cn";var h=$("h3",P);h&&h.parentNode.insertBefore(n,h.nextSibling)}
  n.innerHTML='<b>Kitchen is closed right now</b>'+(SM?'<br>'+esc(SM):'<br>Your cart is saved \u2014 you can order as soon as we reopen.');g.classList.add("off");g.textContent="Closed right now"}
 else{n&&n.remove();g.classList.remove("off");g.textContent="Place order (COD)"}}
function applyStore(st){if(!st||typeof st.is_open!=="boolean")return;var was=OPEN,wasKnown=SKNOWN,msg=st.message||null;
 if(wasKnown&&was===st.is_open&&SM===msg)return;
 OPEN=st.is_open;SM=msg;SKNOWN=true;ctas();menuNote();barUpd();dr.classList.contains("on")&&gate();
 var first=!wasKnown,flip=wasKnown&&was!==OPEN;
 if(first){if(!OPEN||SM)setTimeout(function(){showNote(false)},2600)}  // let the hero intro play first
 else showNote(flip||false,flip&&OPEN)}
function syncStore(){return fetch(API+"/store",{cache:"no-store"}).then(function(r){return r.ok?r.json():null}).then(applyStore).catch(function(){})}
setInterval(syncStore,45000);document.addEventListener("visibilitychange",function(){document.hidden||syncStore()});
// ---- cart
function cnt(){var n=0,t=0;for(var k in cart){n+=cart[k].q;t+=cart[k].q*cart[k].p}return{n:n,t:t}}
var bar=document.createElement("div");bar.id="cbar";document.body.appendChild(bar);
var dr=document.createElement("div");dr.id="dr";dr.innerHTML='<div class="p"></div>';document.body.appendChild(dr);
var P=$(".p",dr);
window.__after=function(){barUpd()};function barUpd(){var c=cnt();bar.className=c.n&&!track&&OPEN?"on":"";bar.innerHTML='<span>'+c.n+' item'+(c.n>1?'s':'')+'</span><span>'+rs(c.t)+' \u00B7 Checkout \u2192</span>';
 document.querySelectorAll(".add").forEach(function(b){var m=MENUMAP[b.dataset.n];b.classList.toggle("shut",!OPEN);b.classList.toggle("on",OPEN&&!!(m&&cart[m.id]));b.textContent=!OPEN?"Closed":m&&cart[m.id]?"Added "+cart[m.id].q:"Add"})}
document.addEventListener("click",function(e){var a=e.target.closest(".add");if(a){e.preventDefault();if(!OPEN){showNote(true);return}var m=MENUMAP[a.dataset.n];if(!m)return;var l=cart[m.id]||(cart[m.id]={id:m.id,n:m.name_en,p:m.price_paise,q:0});if(l.q<20)l.q++;barUpd();return}
 var o=e.target.closest("[data-order]");if(o){e.preventDefault();if(track)return open();if(!OPEN){var m2=$("#menu");m2&&m2.scrollIntoView({behavior:"smooth"});showNote(true);return}if(cnt().n)return open();var mn=$("#menu");mn&&mn.scrollIntoView({behavior:"smooth"})}});
bar.onclick=function(){open()};dr.onclick=function(e){if(e.target===dr)close()};
function open(){dr.classList.add("on");track?viewTrack():viewCart()}function close(){dr.classList.remove("on")}
// ---- checkout
function viewCart(){var c=cnt(),fee=CFG.delivery_fee_paise,L="";
 for(var k in cart){var l=cart[k];L+='<div class="ln"><span>'+esc(l.n)+'<br><small>'+rs(l.p)+'</small></span><span class="q"><button data-d="-1" data-k="'+k+'">\u2212</button><span>'+l.q+'</span><button data-d="1" data-k="'+k+'">+</button></span></div>'}
 if(!c.n){P.innerHTML='<span class="x" id="cx">\u00D7</span><h3>Your order</h3><p>Cart is empty. Add dishes from the menu.</p>';$("#cx").onclick=close;return}
 P.innerHTML='<span class="x" id="cx">\u00D7</span><h3>\u0985\u09B0\u09CD\u09A1\u09BE\u09B0 \u00B7 Checkout</h3><small>Cash on delivery only</small>'+L+
 '<div class="tot"><span>Subtotal</span><span>'+rs(c.t)+'</span></div><div class="tot"><span>Delivery</span><span>'+rs(fee)+'</span></div><div class="tot b"><span>Pay in cash</span><span>'+rs(c.t+fee)+'</span></div>'+
 '<h4>Delivery details</h4><input id="fn" placeholder="Full name" autocomplete="name"><input id="fp" placeholder="Mobile number (10 digits)" inputmode="tel" autocomplete="tel"><input id="fe" placeholder="Email (optional)" type="email" autocomplete="email">'+
 '<textarea id="fa" rows="3" placeholder="Full address"></textarea><div class="btn alt" id="gps">\u25CE Use my current location</div><small id="gm"></small>'+
 '<input id="fk" placeholder="Note for kitchen (optional)"><input id="fd" placeholder="Note for rider (optional)"><div class="err" id="er"></div><div class="btn" id="go">Place order (COD)</div>';
 $("#cx").onclick=close;
 P.querySelectorAll(".q button").forEach(function(b){b.onclick=function(){var l=cart[b.dataset.k];l.q+=+b.dataset.d;if(l.q<1)delete cart[b.dataset.k];if(l.q>20)l.q=20;barUpd();viewCart()}});
 var f=JSON.parse(localStorage.getItem("by_f")||"{}");["fn","fp","fe"].forEach(function(i,n){$("#"+i).value=f[i]||""});
 $("#gps").onclick=function(){var g=$("#gm");if(!navigator.geolocation){g.textContent="GPS not available";return}g.textContent="Locating\u2026";
  navigator.geolocation.getCurrentPosition(function(p){geo={lat:p.coords.latitude,lng:p.coords.longitude};g.textContent="GPS locked \u2713 (OpenStreetMap)";
   api("/geo/reverse?lat="+geo.lat+"&lng="+geo.lng).then(function(r){if(!$("#fa").value)$("#fa").value=r.display_name}).catch(function(){})},function(){g.textContent="Location denied \u2014 type your address"},{enableHighAccuracy:true,timeout:12000})};
 $("#go").onclick=place;gate()}
function place(){var er=$("#er"),b=$("#go");er.textContent="";if(!OPEN){gate();return}var v=function(i){return $("#"+i).value.trim()};
 if(!v("fn")||!v("fp")||(!v("fa")&&geo.lat==null)){er.textContent="Name, mobile and address (or GPS) are required";return}
 localStorage.setItem("by_f",JSON.stringify({fn:v("fn"),fp:v("fp"),fe:v("fe")}));b.textContent="Placing\u2026";
 var body={items:Object.keys(cart).map(function(k){return{item_id:cart[k].id,qty:cart[k].q}}),name:v("fn"),phone:v("fp"),address:v("fa")||null,kitchen_note:v("fk")||null,delivery_note:v("fd")||null};
 if(v("fe"))body.email=v("fe");if(geo.lat!=null){body.lat=geo.lat;body.lng=geo.lng}
 api("/orders",{method:"POST",body:body}).then(function(o){track={code:o.code,gt:o.guest_token};localStorage.setItem("by_order",JSON.stringify(track));cart={};barUpd();show(o);connect()})
 .catch(function(e){er.textContent=e.message;b.textContent="Place order (COD)";syncStore().then(gate)})}
// ---- tracking
var STEPS=["PLACED","APPROVED","PREPARING","READY","OUT_FOR_DELIVERY","ARRIVED","OTP_VERIFIED","PAYMENT_COLLECTED","DELIVERED"];
var TXT={PLACED:["Waiting for kitchen","\u09B0\u09BE\u09A8\u09CD\u09A8\u09BE\u0998\u09B0\u09C7\u09B0 \u0985\u09AA\u09C7\u0995\u09CD\u09B7\u09BE"],APPROVED:["Order accepted","\u0997\u09CD\u09B0\u09B9\u09A3 \u0995\u09B0\u09BE \u09B9\u09DF\u09C7\u099B\u09C7"],PREPARING:["Cooking now","\u09B0\u09BE\u09A8\u09CD\u09A8\u09BE \u099A\u09B2\u099B\u09C7"],READY:["Food is ready","\u0996\u09BE\u09AC\u09BE\u09B0 \u09A4\u09C8\u09B0\u09BF"],OUT_FOR_DELIVERY:["On the way","\u09B0\u0993\u09A8\u09BE \u09B9\u09DF\u09C7\u099B\u09C7"],ARRIVED:["Rider arrived \u2014 share OTP","\u09B0\u09BE\u0987\u09A1\u09BE\u09B0 \u098F\u09B8\u09C7\u099B\u09C7"],OTP_VERIFIED:["OTP verified \u2014 pay cash","\u0985\u09CD\u09AF\u09BE\u09AE\u09CB\u09A6\u09BF\u09A4"],PAYMENT_COLLECTED:["Payment received","\u099F\u09BE\u0995\u09BE \u09AA\u09C7\u09DF\u09C7\u099B\u09BF"],DELIVERED:["Delivered. Enjoy!","\u09AA\u09CC\u0981\u099B\u09C7 \u0997\u09C7\u099B\u09C7"],REJECTED:["Kitchen declined","\u09AC\u09BE\u09A4\u09BF\u09B2"],EXPIRED:["Kitchen busy \u2014 try again","\u09B8\u09AE\u09DF \u09B6\u09C7\u09B7"],CANCELLED:["Cancelled","\u09AC\u09BE\u09A4\u09BF\u09B2"],FAILED:["Delivery failed","\u09AC\u09CD\u09AF\u09B0\u09CD\u09A5"]};
var DONE={DELIVERED:1,REJECTED:1,EXPIRED:1,CANCELLED:1,FAILED:1},last=null;
function viewTrack(){last?show(last):api("/orders/"+track.code,{gt:track.gt}).then(show).catch(function(){})}
function show(o){last=o;if(!track)return;barUpd();var t=TXT[o.status]||[o.status,""],i=STEPS.indexOf(o.status),done=!!DONE[o.status];
 var h='<span class="x" id="cx">\u00D7</span><small>Order</small><h3>'+esc(o.code)+'</h3><div class="big">'+esc(t[1])+'</div><div>'+esc(t[0])+'</div>';
 h+='<div class="st">'+STEPS.map(function(s,k){return'<i class="'+(k<=i?'d':'')+'"></i>'}).join("")+'</div>';
 if(o.status==="PLACED")h+='<small id="cd"></small>';
 if(o.reject_reason&&done)h+='<div class="err">'+esc(o.reject_reason)+'</div>';
 if(o.otp&&!done)h+='<h4>Your delivery OTP</h4><div class="otp">'+esc(o.otp)+'</div><small>Tell this to the rider at your door, then pay <b>'+rs(o.total_paise)+'</b> cash. The food is handed over only after both.</small>';
 if(o.rider)h+='<h4>Your rider</h4><div>'+esc(o.rider.name)+(o.rider.phone?' \u00B7 <a href="tel:'+esc(o.rider.phone)+'">'+esc(o.rider.phone)+'</a>':'')+'</div>';
 h+='<h4>Items</h4>'+o.items.map(function(x){return'<div class="ln"><span>'+x.qty+' \u00D7 '+esc(x.name)+'</span><span>'+rs(x.qty*x.unit_price_paise)+'</span></div>'}).join("")+'<div class="tot b"><span>Cash on delivery</span><span>'+rs(o.total_paise)+'</span></div>';
 if(o.status==="PLACED")h+='<div class="btn alt" id="cc">Cancel order</div>';
 if(done)h+='<div class="btn" id="nw">Order again</div><small>Your contact details were removed from our system after this order closed.</small>';
 P.innerHTML=h;$("#cx").onclick=close;var c=$("#cc");if(c)c.onclick=function(){api("/orders/"+track.code+"/cancel",{method:"POST",gt:track.gt}).then(viewTrack).catch(function(e){alert(e.message)})};
 var n=$("#nw");if(n)n.onclick=function(){stop();track=null;last=null;localStorage.removeItem("by_order");barUpd();close()};
 clearInterval(tick);if(o.status==="PLACED"&&o.approval_deadline){var dl=Date.parse(o.approval_deadline);tick=setInterval(function(){var e=$("#cd");if(!e)return;e.textContent="Kitchen confirms within "+Math.max(0,Math.round((dl-Date.now())/1000))+"s"},500)}
 if(done)stop();dr.classList.contains("on")||(dr.classList.add("on"))}
function stop(){clearInterval(poll);clearInterval(tick);clearInterval(pingT);if(ws){ws.onclose=null;ws.close();ws=null}}
function connect(){stop();if(!track)return;
 try{ws=new WebSocket(API.replace(/^http/,"ws")+"/ws/track/"+track.code+"?gt="+encodeURIComponent(track.gt));
  ws.onmessage=function(m){var d;try{d=JSON.parse(m.data)}catch(e){return}if(d.type==="order.updated")show(d.order);else if(d.type==="rider.location"&&last&&last.rider){last.rider.lat=d.lat;last.rider.lng=d.lng}};
  pingT=setInterval(function(){ws&&ws.readyState===1&&ws.send("ping")},25000)}catch(e){}
 poll=setInterval(function(){track&&api("/orders/"+track.code,{gt:track.gt}).then(function(o){if(!last||o.status!==last.status||o.updated_at!==last.updated_at)show(o)}).catch(function(e){if(/not found/i.test(e.message)){stop();track=null;localStorage.removeItem("by_order");barUpd()}})},5000)}
try{var s=JSON.parse(localStorage.getItem("by_order")||"null");if(s&&s.code){track=s;barUpd();bar.className="on";bar.innerHTML="<span>Track your order "+esc(s.code)+" \u2192</span>";bar.onclick=open;connect()}}catch(e){}
barUpd()})();
