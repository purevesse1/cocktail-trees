/* Cocktail tree engine: draws one base's radial tree into an <svg>, opens recipe cards,
   and runs the small spring-and-collision simulation that moves neighbours aside.
   A node with step:1 is a shared step (e.g. "+ pineapple juice"): a dashed pill holding its own change lines (t),
   with no label on its incoming arrow, no recipe card and no click. It is not counted as a drink. */
(function(){
var NS='http://www.w3.org/2000/svg';

/* animation tunables — lower damping = less wiggle; lower stiffness = softer/slower return.
   Rule of thumb for critical damping: DAMP ≈ 1 − 2·√STIFF. */
var NODE_DAMP=0.78,   NODE_STIFF=0.08;   // tree boxes springing back to home
var LABEL_DAMP=0.75,  LABEL_STIFF=0.18;  // edge labels sliding along their edge
var OPEN_EASE=0.32;                      // card open/close rate per frame (0..1)
var OPEN_SNAP=0.003;                     // when |target−s| falls below this, snap to target

function el(tag,attrs,parent,text){var e=document.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);if(text!=null)e.textContent=text;if(parent)parent.appendChild(e);return e;}

/* "+ X" or "− X" → ingredient name, matching gen.py's stripping of a trailing " rim". */
function labelIng(t){if(!t||t.length<3)return null;var c=t.charAt(0);if(c!=='+'&&c!=='−')return null;return t.slice(2).replace(/ rim$/,'');}

function mount(D,ui){
  var svg=ui.svg,stage=ui.stage,dead=false;
  /* slim filled darts with a notched back, sized in px so thick (highlighted) lines don't blow them up;
     refX sits a little behind the tip so the line's square end is hidden inside the dart */
  el('defs',{},svg).innerHTML=
    '<marker id="arrow" viewBox="0 0 14 7" refX="11" refY="3.5" markerWidth="14" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0 L14 3.5 L0 7 L3.5 3.5 Z" fill="currentColor"/></marker>'+
    '<marker id="arrowHot" viewBox="0 0 18 10" refX="11" refY="5" markerWidth="18" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0 L18 5 L0 10 L4.5 5 Z" fill="currentColor"/></marker>';
  var gE=el('g',{},svg),gL=el('g',{},svg),gN=el('g',{},svg);
  var hub=D.hub,N=D.nodes.map(function(o){var c={};for(var k in o)c[k]=o[k];return c;});
  var still=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var have=[];

  /* wrap one "+ X" / "− X" line in a clickable <g class="labline"> whose click toggles X in My bar.
     A transparent hit rect widens the target so the whole line, not just the glyphs, is clickable. */
  function labLine(parent,text,x,y,hitX,hitY,hitW,hitH,textClass,anchor){
    var ing=labelIng(text),line=el('g',{'class':'labline'},parent);
    el('rect',{'class':'labhit',x:hitX,y:hitY,width:hitW,height:hitH,rx:3},line);
    var attrs={x:x,y:y};if(textClass)attrs['class']=textClass;if(anchor)attrs['text-anchor']=anchor;
    var tx=el('text',attrs,line,text);
    if(ing&&ui.onIngredient){
      line.setAttribute('role','button');line.setAttribute('tabindex','0');line.setAttribute('aria-label','Toggle '+ing+' in My bar');
      line.addEventListener('click',function(e){e.stopPropagation();ui.onIngredient(ing);});
      line.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();ui.onIngredient(ing);}});
    }
    return tx;
  }

  N.forEach(function(d,i){
    d.hx=d.x;d.hy=d.y;d.px=d.x;d.py=d.y;d.cwid=d.w;d.chei=d.h;d.s=0;d.open=false;d.tw=0;
    d.line=el('line',{'class':'edge','marker-end':'url(#arrow)'},gE);
    d.lg=el('g',{'class':'lab'},gL);
    el('rect',{'class':'labbg',x:-d.lw/2,y:-d.lh/2,width:d.lw,height:d.lh},d.lg);
    d.lab.forEach(function(t,k){
      var y=-(d.lab.length-1)*8.5+k*17;
      labLine(d.lg,t,0,y,-d.lw/2+2,y-8.5,Math.max(0,d.lw-4),17);
    });
    d.L={x:0,y:0,px:0,py:0,w:d.lw,h:d.lh};
    if(d.step){
      d.g=el('g',{'class':'n step','aria-label':'Shared step: '+d.n},gN);
      d.box=el('rect',{'class':'box',x:0,y:0,width:d.w,height:d.h,rx:d.h/2},d.g);
      d.t.forEach(function(t,k){
        var y=d.h/2-(d.t.length-1)*8.5+k*17;
        var tx=labLine(d.g,t,d.w/2,y,2,y-8.5,Math.max(0,d.w-4),17,'title','middle');
        if(!k)d.title=tx;
      });
      d.card=el('g',{'class':'card',opacity:0},d.g);
      return;
    }
    d.g=el('g',{'class':'n',tabindex:'0',role:'button','aria-expanded':'false','aria-label':d.n+', show recipe'},gN);
    d.box=el('rect',{'class':'box',x:0,y:0,width:d.w,height:d.h,rx:4},d.g);
    d.title=el('text',{'class':'title',x:d.w/2,y:21,'text-anchor':'middle'},d.g,d.n);
    d.card=el('g',{'class':'card',opacity:0},d.g);
    d.g.addEventListener('click',function(){toggle(i);});
    d.g.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle(i);}});
  });
  var hubG=el('g',{'class':'hubg'},svg);
  var hubEl=el('circle',{'class':'hub',cx:hub.x,cy:hub.y,r:hub.r},hubG);
  var hubTxt=el('text',{'class':'hubtxt',x:hub.x,y:hub.y},hubG,hub.t);
  if(ui.onIngredient){
    hubG.setAttribute('role','button');hubG.setAttribute('tabindex','0');hubG.setAttribute('aria-label','Toggle '+D.name+' in My bar');
    hubG.addEventListener('click',function(e){e.stopPropagation();ui.onIngredient(D.id);});
    hubG.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();ui.onIngredient(D.id);}});
  }

  /* geometry */
  function anchor(d){return [d.x+d.w/2,d.y+d.h/2];}
  function exitPt(d,to,gap){
    var a=anchor(d),dx=to[0]-a[0],dy=to[1]-a[1],len=Math.hypot(dx,dy)||1;
    var tx=dx>0?(d.x+d.cwid-a[0])/dx:dx<0?(d.x-a[0])/dx:1e9;
    var ty=dy>0?(d.y+d.chei-a[1])/dy:dy<0?(d.y-a[1])/dy:1e9;
    var t=Math.min(tx,ty)+gap/len;
    return [a[0]+dx*t,a[1]+dy*t];
  }
  function edge(d){
    var s,a=anchor(d);
    if(d.p<0){var ang=Math.atan2(a[1]-hub.y,a[0]-hub.x);s=[hub.x+(hub.r+4)*Math.cos(ang),hub.y+(hub.r+4)*Math.sin(ang)];}
    else s=exitPt(N[d.p],a,3);
    return [s,exitPt(d,s,10)];
  }

  /* recipe card. Each ingredient row is a <g class="rowline"> whose click toggles that ingredient in My bar;
     stopPropagation keeps the click from bubbling up to the node's own toggle (which would close the card). */
  function fillCard(d){
    while(d.card.firstChild)d.card.removeChild(d.card.firstChild);
    el('text',{'class':'x',x:d.cw-16,y:20,'aria-hidden':'true'},d.card,'×');
    el('line',{'class':'rule',x1:15,y1:42,x2:d.cw-15,y2:42},d.card);
    d.rows.forEach(function(r,k){
      var y=56+k*20,owned=have.indexOf(r[1])>-1;
      var row=el('g',{'class':'rowline',role:'button',tabindex:'0','aria-label':(owned?'Remove ':'Add ')+r[1]+(owned?' from My bar':' to My bar')},d.card);
      /* transparent full-width rect gives a hit target across the whole row, not just the glyphs */
      el('rect',{'class':'rowhit',x:12,y:y-10,width:Math.max(0,d.cw-24),height:18,rx:3},row);
      el('circle',{'class':owned?'dot on':'dot',cx:20,cy:y,r:4},row);
      el('text',{'class':'amt',x:32,y:y},row,r[0]);
      el('text',{'class':'ing',x:44+d.aw,y:y},row,r[1]);
      row.addEventListener('click',function(e){
        e.stopPropagation();
        if(ui.onIngredient)ui.onIngredient(r[1]);
      });
      row.addEventListener('keydown',function(e){
        if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(ui.onIngredient)ui.onIngredient(r[1]);}
      });
    });
    d.m.forEach(function(t,k){el('text',{'class':'how',x:15,y:46+d.rows.length*20+17+k*18},d.card,t);});
  }
  function toggle(i){
    var d=N[i],willOpen=!d.open;
    N.forEach(function(o){o.hot=false;if(o.open){o.open=false;o.g.setAttribute('aria-expanded','false');}});
    if(willOpen){
      d.open=true;d.g.setAttribute('aria-expanded','true');
      try{d.tw=d.title.getComputedTextLength();}catch(e){d.tw=d.w-30;}
      fillCard(d);gN.appendChild(d.g);
      for(var c=d;c;c=c.p>=0?N[c.p]:null)c.hot=true;
    }
    run();
  }

  /* physics: springs home, a downward shift under an open card, rigid boxes that shove each other */
  var bodies=[];N.forEach(function(d){bodies.push(d);});N.forEach(function(d){if(d.lab.length)bodies.push(d.L);});
  function rect(b){return b.lw!==undefined?[b.x,b.y,b.cwid,b.chei]:[b.x-b.w/2,b.y-b.h/2,b.w,b.h];}
  function shiftFor(b){
    var sh=0;
    for(var i=0;i<N.length;i++){var c=N[i];if(!(c.s>0)||c===b)continue;
      if(b.hy+b.h/2<=c.y+c.h+1)continue;
      var gx=Math.max(0,b.hx-(c.x+c.cwid+14),(c.x-14)-(b.hx+b.w)),dy=Math.max(0,b.hy-(c.y+c.h));
      sh+=((c.chei-c.h)+26*c.s)*Math.exp(-gx/80)*Math.exp(-dy/520);
    }
    return sh;
  }
  function hits(r,c,m){return r[0]<c[0]+c[2]+m&&c[0]-m<r[0]+r[2]&&r[1]<c[1]+c[3]+m&&c[1]-m<r[1]+r[3];}
  function step(){
    var moved=0,S=0,hot=null;
    N.forEach(function(d){
      var t=d.open?1:0,ds=(t-d.s)*OPEN_EASE;d.s+=ds;if(Math.abs(t-d.s)<OPEN_SNAP)d.s=t;else moved=1;
      d.fixed=d.s>0;if(d.s>S)S=d.s;if(d.open)hot=d;
      d.cwid=d.w+(d.cw-d.w)*d.s;d.chei=d.h+(d.ch-d.h)*d.s;
      if(d.fixed){
        var tx=Math.max(8,Math.min(d.hx,D.W-d.cw-8)),ty=Math.max(8,Math.min(d.hy,D.H-d.ch-8));
        d.x=d.hx+(tx-d.hx)*d.s;d.y=d.hy+(ty-d.hy)*d.s;d.px=d.x;d.py=d.y;
      }
    });
    N.forEach(function(d){
      if(d.fixed)return;
      var ty=d.hy+shiftFor(d),vx=(d.x-d.px)*NODE_DAMP,vy=(d.y-d.py)*NODE_DAMP;d.px=d.x;d.py=d.y;
      d.x+=vx+(d.hx-d.x)*NODE_STIFF;d.y+=vy+(ty-d.y)*NODE_STIFF;
    });
    N.forEach(function(d){
      var e=edge(d),L=d.L,f=d.f;
      if(d.fixed){
        var cr=[d.x,d.y,d.cwid,d.chei];
        for(;f>0.12;f-=0.04){
          var qx=e[0][0]+(e[1][0]-e[0][0])*f,qy=e[0][1]+(e[1][1]-e[0][1])*f;
          if(!hits([qx-L.w/2,qy-L.h/2,L.w,L.h],cr,10))break;
        }
      }
      var hx=e[0][0]+(e[1][0]-e[0][0])*f,hy=e[0][1]+(e[1][1]-e[0][1])*f;
      var vx=(L.x-L.px)*LABEL_DAMP,vy=(L.y-L.py)*LABEL_DAMP;L.px=L.x;L.py=L.y;
      L.x+=vx+(hx-L.x)*LABEL_STIFF;L.y+=vy+(hy-L.y)*LABEL_STIFF;
    });
    var MN=5+8*S,MC=5+19*S;
    for(var it=0;it<6;it++){
      for(var i=0;i<bodies.length;i++){
        var a=bodies[i],ra=rect(a);
        for(var j=i+1;j<bodies.length;j++){
          var b=bodies[j];if(a.fixed&&b.fixed)continue;
          var rb=rect(b),M=(a.fixed||b.fixed)?MC:MN;
          if((a.fixed&&b===a.L)||(b.fixed&&a===b.L))M=8;
          var ox=Math.min(ra[0]+ra[2],rb[0]+rb[2])-Math.max(ra[0],rb[0])+M;if(ox<=0)continue;
          var oy=Math.min(ra[1]+ra[3],rb[1]+rb[3])-Math.max(ra[1],rb[1])+M;if(oy<=0)continue;
          var cxa=ra[0]+ra[2]/2,cya=ra[1]+ra[3]/2,cxb=rb[0]+rb[2]/2,cyb=rb[1]+rb[3]/2,mx=0,my=0;
          if(ox<oy)mx=cxb>=cxa?ox:-ox;else my=cyb>=cya?oy:-oy;
          var wa=a.fixed?0:b.fixed?1:0.5,wb=1-wa;
          a.x-=mx*wa;a.y-=my*wa;b.x+=mx*wb;b.y+=my*wb;
          if(wa)ra=rect(a);
        }
      }
      if(hot){
        var e=edge(hot),p=e[0],q=e[1],sx=q[0]-p[0],sy=q[1]-p[1],sl=sx*sx+sy*sy||1,sn=Math.sqrt(sl);
        for(var k=0;k<bodies.length;k++){
          var o=bodies[k];if(o===hot||o===hot.L||o.fixed||(hot.p>=0&&o===N[hot.p]))continue;
          var r=rect(o),cx=r[0]+r[2]/2,cy=r[1]+r[3]/2;
          var tt=Math.max(0,Math.min(1,((cx-p[0])*sx+(cy-p[1])*sy)/sl));
          var vx=cx-(p[0]+sx*tt),vy=cy-(p[1]+sy*tt),dist=Math.hypot(vx,vy);
          if(dist<0.01){vx=-sy/sn;vy=sx/sn;dist=0.01;}else{vx/=dist;vy/=dist;}
          var need=Math.abs(vx)*r[2]/2+Math.abs(vy)*r[3]/2+9;
          if(dist<need){var push=(need-dist)*hot.s;o.x+=vx*push;o.y+=vy*push;}
        }
      }
    }
    for(var k3=0;k3<N.length;k3++){var w=N[k3];if(w.fixed)continue;
      w.x=Math.max(6,Math.min(w.x,D.W-w.w-6));w.y=Math.max(6,Math.min(w.y,D.H-w.h-6));}
    for(var k2=0;k2<bodies.length;k2++){var u=bodies[k2];if(Math.abs(u.x-u.px)+Math.abs(u.y-u.py)>0.08)moved=1;}
    return moved;
  }
  function render(){
    N.forEach(function(d){
      d.g.setAttribute('transform','translate('+d.x.toFixed(1)+','+d.y.toFixed(1)+')');
      d.box.setAttribute('width',d.cwid.toFixed(1));d.box.setAttribute('height',d.chei.toFixed(1));
      if(d.s>0){
        d.title.setAttribute('text-anchor','start');
        d.title.setAttribute('x',((d.w-d.tw)/2+(15-(d.w-d.tw)/2)*d.s).toFixed(1));
        d.card.setAttribute('opacity',Math.max(0,(d.s-0.55)/0.45).toFixed(2));
      }else{
        d.title.setAttribute('text-anchor','middle');d.title.setAttribute('x',d.w/2);
        d.card.setAttribute('opacity',0);
        if(d.card.firstChild&&!d.open){while(d.card.firstChild)d.card.removeChild(d.card.firstChild);}
      }
      d.line.setAttribute('class',d.hot?'edge hot':'edge');d.lg.setAttribute('class',d.hot?'lab hot':'lab');
      var e=edge(d);
      d.line.setAttribute('x1',e[0][0].toFixed(1));d.line.setAttribute('y1',e[0][1].toFixed(1));
      d.line.setAttribute('x2',e[1][0].toFixed(1));d.line.setAttribute('y2',e[1][1].toFixed(1));
      d.lg.setAttribute('transform','translate('+d.L.x.toFixed(1)+','+d.L.y.toFixed(1)+')');
    });
  }
  var raf=0;
  function run(){
    if(still){for(var i=0;i<600&&step();i++){}render();return;}
    if(raf)return;
    (function tick(){if(dead)return;var m=step();render();raf=m?requestAnimationFrame(tick):0;})();
  }
  N.forEach(function(d){var e=edge(d);d.L.x=d.L.px=e[0][0]+(e[1][0]-e[0][0])*d.f;d.L.y=d.L.py=e[0][1]+(e[1][1]-e[0][1])*d.f;});
  render();

  /* which drinks the bar can make: returns the count.
     Also flips the hub: filled when the base spirit is missing from the bar, outlined when it is in. */
  function paint(list){
    have=list;var made=0;
    var hasBase=list.indexOf(D.id)>-1;
    hubEl.setAttribute('class',hasBase?'hub have':'hub');
    hubTxt.setAttribute('class',hasBase?'hubtxt have':'hubtxt');
    N.forEach(function(d){
      var ok=d.ing.every(function(i){return have.indexOf(i)>-1;});
      d.g.setAttribute('class',d.step?'n step':'n'+(ok?' have':''));if(ok&&!d.step)made++;
      if(d.open)fillCard(d);
    });
    return made;
  }

  /* camera: the svg is sized by zoom and placed with a free translate, so it never snaps to scroll limits */
  var z=1,zt=1,za=0,tx=0,ty=0,cw=0,ax,ay,centering=false,ratio=D.H/D.W;
  function sw(){return stage.clientWidth||360;}
  function sh(){return stage.clientHeight||sw();}
  function base(){return Math.min(sw(),sh()/ratio);}
  /* soft boundary: the tree may be dragged past its limits with growing resistance, then springs back.
     Limits per axis: the tree edge may sit up to 15% of the view inside the frame; a tree smaller than
     the view may drift 8% from centre. */
  function lim(v,c){var p=0.15*v,s=0.08*v,k=(v-c)/2;return [Math.min(k-s,v-c-p),Math.max(k+s,p)];}
  function bounds(){var bx=lim(sw(),cw),by=lim(sh(),cw*ratio);return [bx[0],bx[1],by[0],by[1]];}
  function rub(v,lo,hi,R){if(v>hi){var o=v-hi;return hi+o*R/(o+R);}if(v<lo){var u=lo-v;return lo-u*R/(u+R);}return v;}
  function unrub(v,lo,hi,R){if(v>hi){var f=Math.min(v-hi,R*0.98);return hi+f*R/(R-f);}if(v<lo){var g=Math.min(lo-v,R*0.98);return lo-g*R/(R-g);}return v;}
  function grab(o){var b=bounds();o.rx=unrub(tx,b[0],b[1],0.18*sw());o.ry=unrub(ty,b[2],b[3],0.18*sh());}
  function drag(o,dx,dy){var b=bounds();tx=rub(o.rx+dx,b[0],b[1],0.18*sw());ty=rub(o.ry+dy,b[2],b[3],0.18*sh());place();}
  var st=0;
  function holding(){return (pan&&pan.on)||(tp&&tp.on)||d0;}
  function settle(){if(!st&&!dead)st=requestAnimationFrame(stick);}
  function stick(){
    st=0;if(dead||holding())return;
    var b=bounds(),gx=Math.max(b[0],Math.min(b[1],tx)),gy=Math.max(b[2],Math.min(b[3],ty));
    if(still||(Math.abs(gx-tx)<0.4&&Math.abs(gy-ty)<0.4)){if(gx!==tx||gy!==ty){tx=gx;ty=gy;place(true);}return;}
    tx+=(gx-tx)*0.22;ty+=(gy-ty)*0.22;place(true);
    st=requestAnimationFrame(stick);
  }
  function place(noSettle){
    var h=cw*ratio;
    svg.style.width=cw.toFixed(2)+'px';svg.style.height=h.toFixed(2)+'px';
    svg.style.transform='translate('+tx.toFixed(2)+'px,'+ty.toFixed(2)+'px)';
    if(!noSettle)settle();
  }
  function apply(nz,fx,fy){
    if(nz==null)nz=z;
    fx=fx==null?sw()/2:fx;fy=fy==null?sh()/2:fy;
    var u=cw?(fx-tx)/cw:0.5,v=cw?(fy-ty)/(cw*ratio):0.5;
    z=Math.max(1,Math.min(16,nz));
    cw=base()*z;tx=fx-u*cw;ty=fy-v*cw*ratio;
    place();
    if(!za)zt=z;
  }
  /* eased zoom: a quarter of the remaining distance (in log scale) per frame, holding the anchor point still */
  function zoomTo(nz,fx,fy,toCentre){
    zt=Math.max(1,Math.min(16,nz));ax=fx;ay=fy;centering=!!toCentre;
    if(still){apply(zt,fx,fy);if(centering){tx=(sw()-cw)/2;ty=(sh()-cw*ratio)/2;place();}return;}
    if(!za)za=requestAnimationFrame(ztick);
  }
  function ztick(){
    if(dead){za=0;return;}
    var r=zt/z,done=Math.abs(Math.log(r))<0.004;
    apply(done?zt:z*Math.pow(r,0.25),ax,ay);
    if(centering){
      var cx=(sw()-cw)/2,cy=(sh()-cw*ratio)/2,near=Math.abs(cx-tx)<0.5&&Math.abs(cy-ty)<0.5;
      if(done&&near){tx=cx;ty=cy;}else{tx+=(cx-tx)*0.25;ty+=(cy-ty)*0.25;done=false;}
      place();
    }
    if(done){za=0;zt=z;centering=false;return;}
    za=requestAnimationFrame(ztick);
  }
  ui.zin.addEventListener('click',function(){zoomTo(zt*1.6);});
  ui.zout.addEventListener('click',function(){zoomTo(zt/1.6);});
  ui.zfit.addEventListener('click',function(){zoomTo(1,null,null,true);});

  /* mouse: wheel zooms on the cursor; holding the middle button (or dragging with the left) pans */
  stage.addEventListener('wheel',function(e){
    e.preventDefault();
    var r=stage.getBoundingClientRect(),dy=e.deltaMode===1?e.deltaY*32:e.deltaMode===2?e.deltaY*400:e.deltaY;
    zoomTo(zt*Math.exp(-Math.max(-240,Math.min(240,dy))*0.0022),e.clientX-r.left,e.clientY-r.top);
  },{passive:false});
  var pan=null,dragged=false;
  stage.addEventListener('mousedown',function(e){
    if(e.button!==0&&e.button!==1)return;
    if(e.button===1)e.preventDefault();
    pan={x:e.clientX,y:e.clientY,on:e.button===1};dragged=false;grab(pan);
    if(pan.on){centering=false;stage.style.cursor='grabbing';}
  });
  function onMove(e){
    if(!pan)return;
    var dx=e.clientX-pan.x,dy=e.clientY-pan.y;
    if(!pan.on){if(Math.abs(dx)+Math.abs(dy)<5)return;pan.on=true;dragged=true;centering=false;stage.style.cursor='grabbing';
      pan.x=e.clientX;pan.y=e.clientY;grab(pan);dx=dy=0;}
    e.preventDefault();
    drag(pan,dx,dy);
  }
  function onUp(){if(pan){pan=null;stage.style.cursor='';settle();}}
  window.addEventListener('mousemove',onMove);
  window.addEventListener('mouseup',onUp);
  stage.addEventListener('auxclick',function(e){if(e.button===1)e.preventDefault();});
  stage.addEventListener('click',function(e){if(dragged){e.stopPropagation();e.preventDefault();dragged=false;}},true);

  /* touch: one finger pans, two fingers pinch-zoom around their midpoint */
  var tp=null,d0=0,z0=1,mid=null;
  function dist2(t){return Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);}
  function midOf(t){var r=stage.getBoundingClientRect();return [(t[0].clientX+t[1].clientX)/2-r.left,(t[0].clientY+t[1].clientY)/2-r.top];}
  function one(t){tp={x:t.clientX,y:t.clientY,on:false};grab(tp);}
  stage.addEventListener('touchstart',function(e){
    dragged=false;
    if(e.touches.length===1)one(e.touches[0]);
    else if(e.touches.length===2){tp=null;d0=dist2(e.touches);z0=z;mid=midOf(e.touches);centering=false;}
  },{passive:true});
  stage.addEventListener('touchmove',function(e){
    if(e.touches.length===2&&d0){
      e.preventDefault();dragged=true;
      var m=midOf(e.touches);tx+=m[0]-mid[0];ty+=m[1]-mid[1];mid=m;
      apply(z0*dist2(e.touches)/d0,m[0],m[1]);
    }else if(e.touches.length===1&&tp){
      var dx=e.touches[0].clientX-tp.x,dy=e.touches[0].clientY-tp.y;
      if(!tp.on){if(Math.abs(dx)+Math.abs(dy)<6)return;tp.on=true;dragged=true;centering=false;
        tp.x=e.touches[0].clientX;tp.y=e.touches[0].clientY;grab(tp);dx=dy=0;}
      e.preventDefault();
      drag(tp,dx,dy);
    }
  },{passive:false});
  stage.addEventListener('touchend',function(e){
    d0=0;
    if(e.touches.length===1)one(e.touches[0]);else tp=null;
    settle();
  },{passive:true});
  cw=base();tx=(sw()-cw)/2;ty=(sh()-cw*ratio)/2;place();

  /* search landing: open a drink by name and centre the camera on it */
  function centerOnNode(idx){
    var d=N[idx];
    z=zt=2;cw=base()*z;
    var wx=d.hx+d.cw/2,wy=d.hy+d.ch/2,b=bounds();
    tx=Math.max(b[0],Math.min(b[1],sw()/2-wx*cw/D.W));
    ty=Math.max(b[2],Math.min(b[3],sh()/2-wy*cw/D.W));
    place();
  }
  function openByName(name){
    for(var k=0;k<N.length;k++){
      if(!N[k].step&&N[k].n===name){
        if(!N[k].open)toggle(k);
        centerOnNode(k);
        return true;
      }
    }
    return false;
  }

  return {paint:paint,apply:apply,open:openByName,destroy:function(){dead=true;if(st)cancelAnimationFrame(st);window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp);},
    _t:{N:N,step:step,toggle:toggle,rect:rect,bodies:bodies,edge:edge,D:D}};
}
window.CocktailTree={mount:mount};
})();
