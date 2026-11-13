/* Cocktail Trees site shell: hash routes (#home, #gin, ...), the shared "My bar", and the two views.
   To add a base: drop data/<base>.js next to the others and add one <script> tag for it in index.html. */
(function(){
var BASES=window.COCKTAIL_BASES||{},IDS=Object.keys(BASES);
var PLANNED=['Whiskey','Rum','Tequila and mezcal','Vodka','Brandy'];
var KEY='cocktail-bar-v1',DEFAULT=['gin','sweet vermouth','Campari','orange bitters'];
var LOG=[['13 Nov 2026','Gin tree published: 46 drinks, from Pink Gin out to the Ramos Gin Fizz.']];
var view=document.getElementById('view'),crumb=document.getElementById('crumb'),tree=null,mem=null;

function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function getBar(){
  if(mem)return mem;
  try{var s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.length)return (mem=s);}catch(e){}
  return (mem=DEFAULT.slice());
}
function setBar(list){mem=list;try{localStorage.setItem(KEY,JSON.stringify(list));}catch(e){}}
function canMake(base,bar){return base.nodes.filter(function(n){return n.ing.every(function(i){return bar.indexOf(i)>-1;});}).length;}

function home(){
  if(tree){tree.destroy();tree=null;}
  var bar=getBar();
  crumb.textContent='';
  document.body.className='at-home';
  var rows=IDS.map(function(id){var b=BASES[id],n=canMake(b,bar);
    return '<li><a class="base" href="#'+esc(id)+'"><span class="bname">'+esc(b.name)+'</span>'+
      '<span class="bmeta">'+b.nodes.length+' drinks · '+n+' you can make now</span>'+
      '<span class="bblurb">'+esc(b.blurb)+'</span><span class="go" aria-hidden="true">→</span></a></li>';}).join('');
  view.innerHTML='<div class="home" id="home"><article>'+
    '<header class="hero"><p class="kicker">Cocktail Trees</p>'+
    '<h1 class="chain" aria-label="Gin, plus sweet vermouth, is a Gin and It. Plus Campari, a Negroni.">'+
    '<span class="solid">Gin</span><span class="plus">+ sweet vermouth</span><span class="solid">Gin &amp; It</span>'+
    '<span class="plus">+ Campari</span><span class="solid">Negroni</span></h1>'+
    '<p class="lede">This is my personal cocktail recipe collection, organised in tree form.</p></header>'+
    '<section><h2>Trees</h2><ul class="bases">'+rows+'</ul>'+
    '<p class="planned">Planned: '+PLANNED.map(esc).join(', ')+'.</p></section>'+
    '<section><h2>Reading a tree</h2><dl class="reading">'+
    '<dt>Arrows</dt><dd>Each one lists what to add (+) or drop (−) compared with the drink it starts from. Follow them from the centre and you have the recipe.</dd>'+
    '<dt>Black and white</dt><dd>A black box means your bar has everything for that drink. Tick what you own under My bar on any tree and the boxes update.</dd>'+
    '<dt>Recipes</dt><dd>Tap a drink to open its card with quantities and method. The neighbours move aside and drift back when you close it.</dd></dl></section>'+
    '<section><h2>Log</h2><ul class="log">'+LOG.map(function(l){return '<li><time>'+esc(l[0])+'</time><span>'+esc(l[1])+'</span></li>';}).join('')+'</ul></section>'+
    '</article></div>';
}

function showTree(id){
  if(tree){tree.destroy();tree=null;}
  var D=BASES[id],bar=getBar();
  crumb.textContent=D.name;
  document.body.className='at-tree';
  var chips=D.ings.map(function(i,k){return '<label class="chip"><input type="checkbox" id="ing-'+k+'" value="'+esc(i)+'"'+(bar.indexOf(i)>-1?' checked':'')+'><span>'+esc(i)+'</span></label>';}).join('');
  view.innerHTML='<div class="treeview"><header class="thead">'+
    '<h1>'+esc(D.title)+'</h1>'+
    '<p>Start from '+esc(D.id)+' in the centre. Each arrow lists what to add (+) or drop (−) compared with the drink it starts from. Tap a drink to open its recipe.</p>'+
    '<div class="row"><ul class="key"><li><span class="sw have"></span>You have everything</li><li><span class="sw"></span>Something is missing</li></ul>'+
    '<div class="zoom"><button id="zout" type="button" aria-label="Zoom out">−</button><button id="zin" type="button" aria-label="Zoom in">+</button><button id="zfit" type="button">Fit</button></div></div>'+
    '<details id="bar"><summary>My bar: <span id="count"></span></summary><div class="chips">'+chips+'</div></details></header>'+
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
  paint();
}

function route(){
  var id=(location.hash||'').replace(/^#/,'');
  if(BASES[id])showTree(id);else home();
}
window.addEventListener('hashchange',route);
window.addEventListener('resize',function(){if(tree)tree.apply();});
route();
})();
