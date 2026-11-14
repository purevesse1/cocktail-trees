/* Cocktail Trees site shell: hash routes to a base tree, shared "My bar",
   top-bar base pills (active + TBA) and an info modal.
   To add a base: drop data/<base>.js next to the others, add one <script> tag, drop it from PLANNED. */
(function(){
var BASES=window.COCKTAIL_BASES||{},IDS=Object.keys(BASES);
var PLANNED=['Tequila/Mezcal','Brandy'];
var KEY='cocktail-bar-v1',DEFAULT=['gin','sweet vermouth','Campari','orange bitters'];
var LOG=[
  ['14 Nov 2026','Vodka, rum and whiskey trees added: Moscow Mule to Espresso Martini, Rum & Coke to Mai Tai, Old Fashioned to Paper Plane.'],
  ['13 Nov 2026','Gin tree published: 46 drinks, from Pink Gin out to the Ramos Gin Fizz.']
];
var FALLBACK=IDS[0]||'';
var view=document.getElementById('view'),nav=document.getElementById('navlist'),tree=null,mem=null;

function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function getBar(){
  if(mem)return mem;
  try{var s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.length)return (mem=s);}catch(e){}
  return (mem=DEFAULT.slice());
}
function setBar(list){mem=list;try{localStorage.setItem(KEY,JSON.stringify(list));}catch(e){}}

function buildNav(active){
  var parts=IDS.map(function(id){
    return '<li><a class="navlink'+(id===active?' active':'')+'" href="#'+esc(id)+'">'+esc(BASES[id].name)+'</a></li>';
  });
  PLANNED.forEach(function(name){
    parts.push('<li><span class="navlink soon" role="button" aria-disabled="true" title="To be added">'+esc(name)+'</span></li>');
  });
  nav.innerHTML=parts.join('');
}

function buildLog(){
  document.getElementById('info-log').innerHTML=LOG.map(function(l){
    return '<li><time>'+esc(l[0])+'</time><span>'+esc(l[1])+'</span></li>';
  }).join('');
}

function showTree(id){
  if(tree){tree.destroy();tree=null;}
  var D=BASES[id],bar=getBar();
  var chips=D.ings.map(function(i,k){return '<label class="chip"><input type="checkbox" id="ing-'+k+'" value="'+esc(i)+'"'+(bar.indexOf(i)>-1?' checked':'')+'><span>'+esc(i)+'</span></label>';}).join('');
  view.innerHTML='<div class="treeview"><header class="thead"><div class="thead__inner">'+
    '<h1>'+esc(D.title)+'</h1>'+
    '<p>Start from '+esc(D.id)+' in the centre. Each arrow lists what to add (+) or drop (−) compared with the drink it starts from. Tap a drink to open its recipe.</p>'+
    '<div class="row"><ul class="key"><li><span class="sw have"></span>You have everything</li><li><span class="sw"></span>Something is missing</li></ul>'+
    '<div class="zoom"><button id="zout" type="button" aria-label="Zoom out">−</button><button id="zin" type="button" aria-label="Zoom in">+</button><button id="zfit" type="button">Fit</button></div></div>'+
    '<details id="bar"><summary>My bar: <span id="count"></span></summary><div class="chips">'+chips+'</div></details>'+
    '</div>'+
    '<button class="thead__toggle" id="thead-toggle" type="button" aria-label="Collapse info panel" aria-expanded="true">'+
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 15 L12 9 L18 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'+
    '</button>'+
    '</header>'+
    '<div class="stage" id="stage"><figure><svg id="tree" viewBox="0 0 '+D.W+' '+D.H+'" role="group" aria-label="Radial tree of '+D.nodes.length+' '+esc(D.id)+' cocktails. Each arrow lists the ingredients added to, or removed from, the drink it starts from."></svg>'+
    '<figcaption>'+D.nodes.length+' '+esc(D.id)+' cocktails branching outward by added ingredients, filled black where every ingredient is ticked in My bar. Each drink opens into a recipe card.</figcaption></figure></div></div>';
  var g=function(i){return document.getElementById(i);};
  tree=window.CocktailTree.mount(D,{svg:g('tree'),stage:g('stage'),zin:g('zin'),zout:g('zout'),zfit:g('zfit')});
  var boxes=[].slice.call(view.querySelectorAll('.chip input'));
  function paint(){
    var all=getBar(),made=tree.paint(all),mine=boxes.filter(function(b){return b.checked;}).length;
    g('count').textContent=mine+' of '+boxes.length+' ingredients, '+made+' of '+D.nodes.length+' drinks';
  }
  boxes.forEach(function(b){b.addEventListener('change',function(){
    var all=getBar().filter(function(i){return i!==b.value;});if(b.checked)all.push(b.value);
    setBar(all);paint();
  });});
  g('bar').addEventListener('toggle',function(){if(tree)tree.apply();});
  var head=view.querySelector('.thead'),inner=head.querySelector('.thead__inner'),toggleBtn=g('thead-toggle');
  toggleBtn.addEventListener('click',function(){
    var collapsed=head.classList.toggle('collapsed');
    toggleBtn.setAttribute('aria-expanded',collapsed?'false':'true');
    toggleBtn.setAttribute('aria-label',collapsed?'Expand info panel':'Collapse info panel');
  });
  inner.addEventListener('transitionend',function(e){if(e.propertyName==='max-height'&&tree)tree.apply();});
  paint();
}

function route(){
  var id=(location.hash||'').replace(/^#/,'');
  if(!BASES[id]){
    if(FALLBACK&&id!==FALLBACK){location.replace('#'+FALLBACK);return;}
    return;
  }
  buildNav(id);
  showTree(id);
}

/* info modal */
var modal=document.getElementById('info'),infobtn=document.getElementById('infobtn'),closeBtn=document.getElementById('info-close');
function openInfo(){modal.hidden=false;closeBtn.focus();}
function closeInfo(){modal.hidden=true;infobtn.focus();}
infobtn.addEventListener('click',openInfo);
closeBtn.addEventListener('click',closeInfo);
modal.addEventListener('click',function(e){if(e.target.hasAttribute('data-close'))closeInfo();});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!modal.hidden)closeInfo();});
buildLog();

window.addEventListener('hashchange',route);
window.addEventListener('resize',function(){if(tree)tree.apply();});
route();
})();
