/* Cocktail Trees site shell: hash routes to #<base> or #<base>/<drink>, shared "My bar" across all bases,
   a master index of drinks + ingredient use counts built at load from window.COCKTAIL_BASES,
   a categorised My bar dropdown, a top-right search pill, and the info modal.
   To add a base: drop data/<base>.js, add one <script> tag, drop it from PLANNED. */
(function(){
var BASES=window.COCKTAIL_BASES||{},IDS=Object.keys(BASES);
var PLANNED=['Tequila/Mezcal','Brandy'];
var KEY='cocktail-bar-v1';
/* main spirits are seeded so the four base pages share the same cabinet without re-ticking */
var DEFAULT=['gin','vodka','rum','whiskey','sweet vermouth','Campari','orange bitters'];
var LOG=[
  ['14 Nov 2026','Vodka, rum and whiskey trees added: Moscow Mule to Espresso Martini, Daiquiri to Zombie, Old Fashioned to Penicillin.'],
  ['13 Nov 2026','Gin tree published: 46 drinks, from Pink Gin out to the Ramos Gin Fizz.']
];
/* My bar columns: every ingredient in the corpus lives in one of these.
   Within each column we sort by total uses across all bases, ties alphabetically. */
var CATEGORIES=[
  ['Spirits',            ['gin','vodka','rum','whiskey','cognac']],
  ['Fortified & sparkling',['dry vermouth','sweet vermouth','Lillet Blanc','Dubonnet','Champagne','red wine']],
  ['Liqueurs',           ['Campari','Cointreau','maraschino','crème de cacao','crème de mûre','crème de violette','Fernet-Branca','green Chartreuse','yellow Chartreuse','Suze','orange curaçao','blue curaçao','Chambord','coffee liqueur','Irish cream','Drambuie','Bénédictine','Cherry Heering','Averna','Aperol','Amaro Nonino','apricot liqueur','peach schnapps','passion fruit liqueur','amaretto','white crème de menthe','Galliano','falernum','crème de cassis']],
  ['Juices',             ['lemon juice','lime juice','orange juice','grapefruit juice','cranberry juice','pineapple juice','tomato juice','apple juice','Clamato','passion fruit purée']],
  ['Mixers',             ['tonic water','soda water','ginger beer','ginger ale','cola','lemonade','coffee','espresso','hot water']],
  ['Syrups & sweeteners',['sugar syrup','honey syrup','grenadine','raspberry syrup','passion fruit syrup','vanilla syrup','cinnamon syrup','ginger syrup','orgeat','orange flower water','coconut cream','brown sugar','sugar','orange marmalade']],
  ['Bitters',            ['Angostura bitters','orange bitters',"Peychaud's bitters"]],
  ['Fresh & other',      ['absinthe','egg white','cream','mint','basil','cucumber','green grapes','olive brine','salt','cocktail onion','butter','black pepper','celery salt','Worcestershire sauce','Tabasco','lime']]
];

var FALLBACK=IDS[0]||'';
var view=document.getElementById('view'),nav=document.getElementById('navlist');
var tree=null,mem=null,currentBase=null;

/* master recipe index built once from the already-loaded per-base data: drive search + bar counts */
var DRINKS=[],ING_USE={};
IDS.forEach(function(bid){
  BASES[bid].nodes.forEach(function(n){
    if(n.step)return;
    DRINKS.push({base:bid,name:n.n,ings:n.ing});
    n.ing.forEach(function(i){ING_USE[i]=(ING_USE[i]||0)+1;});
  });
});
DRINKS.sort(function(a,b){return a.name.localeCompare(b.name,undefined,{sensitivity:'base'});});

function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function getBar(){
  if(mem)return mem;
  try{var s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.length)return(mem=s);}catch(e){}
  return (mem=DEFAULT.slice());
}
function setBar(list){mem=list;try{localStorage.setItem(KEY,JSON.stringify(list));}catch(e){}}

/* categorised chips: every known ingredient in CATEGORIES order, sorted by use count inside each group.
   Anything that slipped through the categories table (future recipes) lands in a trailing Other group. */
function barHTML(bar){
  var seen={},html='';
  CATEGORIES.forEach(function(cat){
    var items=cat[1].slice();
    items.sort(function(a,b){var d=(ING_USE[b]||0)-(ING_USE[a]||0);return d||a.localeCompare(b,undefined,{sensitivity:'base'});});
    html+='<div class="bargroup"><h3>'+esc(cat[0])+'</h3><div class="chipset">';
    items.forEach(function(i){
      seen[i]=1;
      html+='<label class="chip"><input type="checkbox" value="'+esc(i)+'"'+(bar.indexOf(i)>-1?' checked':'')+'><span>'+esc(i)+'</span></label>';
    });
    html+='</div></div>';
  });
  var rest=Object.keys(ING_USE).filter(function(i){return !seen[i];});
  if(rest.length){
    rest.sort(function(a,b){var d=(ING_USE[b]||0)-(ING_USE[a]||0);return d||a.localeCompare(b,undefined,{sensitivity:'base'});});
    html+='<div class="bargroup"><h3>Other</h3><div class="chipset">';
    rest.forEach(function(i){
      html+='<label class="chip"><input type="checkbox" value="'+esc(i)+'"'+(bar.indexOf(i)>-1?' checked':'')+'><span>'+esc(i)+'</span></label>';
    });
    html+='</div></div>';
  }
  return html;
}

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

function showTree(id,drink){
  if(tree){tree.destroy();tree=null;}
  var D=BASES[id],bar=getBar(),drinks=D.nodes.filter(function(n){return !n.step;}).length;
  view.innerHTML='<div class="treeview"><header class="thead"><div class="thead__inner">'+
    '<h1>'+esc(D.title)+'</h1>'+
    '<p>Start from '+esc(D.id)+' in the centre. Each arrow lists what to add (+) or drop (−) compared with the drink it starts from. Tap a drink to open its recipe.</p>'+
    '<div class="row"><ul class="key"><li><span class="sw have"></span>You have everything</li><li><span class="sw"></span>Something is missing</li></ul>'+
    '<div class="zoom"><button id="zout" type="button" aria-label="Zoom out">−</button><button id="zin" type="button" aria-label="Zoom in">+</button><button id="zfit" type="button">Fit</button></div></div>'+
    '<details id="bar"><summary>My bar: <span id="count"></span></summary><div class="bargrid">'+barHTML(bar)+'</div></details>'+
    '</div>'+
    '<button class="thead__toggle" id="thead-toggle" type="button" aria-label="Collapse info panel" aria-expanded="true">'+
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 15 L12 9 L18 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'+
    '</button>'+
    '</header>'+
    '<div class="stage" id="stage"><figure><svg id="tree" viewBox="0 0 '+D.W+' '+D.H+'" role="group" aria-label="Radial tree of '+drinks+' '+esc(D.id)+' cocktails. Each arrow lists the ingredients added to, or removed from, the drink it starts from."></svg>'+
    '<figcaption>'+drinks+' '+esc(D.id)+' cocktails branching outward by added ingredients, filled black where every ingredient is ticked in My bar. Each drink opens into a recipe card.</figcaption></figure></div></div>';
  var g=function(i){return document.getElementById(i);};
  tree=window.CocktailTree.mount(D,{svg:g('tree'),stage:g('stage'),zin:g('zin'),zout:g('zout'),zfit:g('zfit')});
  var countEl=g('count');
  function paint(){
    var all=getBar(),made=tree.paint(all);
    countEl.textContent=all.length+' ingredients, '+made+' of '+drinks+' drinks on this tree';
  }
  var barEl=g('bar');
  /* event delegation so adding/removing chip groups does not need listener bookkeeping */
  barEl.addEventListener('change',function(e){
    var b=e.target;
    if(!b||b.type!=='checkbox')return;
    var all=getBar().filter(function(i){return i!==b.value;});
    if(b.checked)all.push(b.value);
    setBar(all);paint();
  });
  barEl.addEventListener('toggle',function(){if(tree)tree.apply();});
  var head=view.querySelector('.thead'),inner=head.querySelector('.thead__inner'),toggleBtn=g('thead-toggle');
  toggleBtn.addEventListener('click',function(){
    var collapsed=head.classList.toggle('collapsed');
    toggleBtn.setAttribute('aria-expanded',collapsed?'false':'true');
    toggleBtn.setAttribute('aria-label',collapsed?'Expand info panel':'Collapse info panel');
  });
  inner.addEventListener('transitionend',function(e){if(e.propertyName==='max-height'&&tree)tree.apply();});
  paint();
  if(drink)tree.open(drink);
}

/* hash forms: "#<base>" or "#<base>/<drink>" (both components percent-encoded) */
function parseHash(){
  var h=(location.hash||'').replace(/^#/,'');
  var i=h.indexOf('/');
  var dec=function(s){try{return decodeURIComponent(s);}catch(e){return s;}};
  if(i<0)return {id:dec(h),drink:''};
  return {id:dec(h.substring(0,i)),drink:dec(h.substring(i+1))};
}
function route(){
  var p=parseHash();
  if(!BASES[p.id]){
    if(FALLBACK&&p.id!==FALLBACK){location.replace('#'+FALLBACK);return;}
    return;
  }
  if(p.id!==currentBase){
    buildNav(p.id);
    showTree(p.id,p.drink);
    currentBase=p.id;
  }else if(p.drink&&tree){
    tree.open(p.drink);
  }
}

/* search pill: filter the drink index by substring, arrow-key the dropdown, Enter or click to navigate */
function setupSearch(){
  var input=document.getElementById('search'),list=document.getElementById('searchlist'),wrap=input.parentNode;
  var sel=-1,items=[];
  function render(){
    if(!items.length){list.hidden=true;list.innerHTML='';wrap.setAttribute('aria-expanded','false');sel=-1;return;}
    list.innerHTML=items.map(function(d,i){
      return '<li role="option" data-idx="'+i+'"'+(i===sel?' aria-selected="true"':'')+'><span>'+esc(d.name)+'</span><small>'+esc(BASES[d.base].name)+'</small></li>';
    }).join('');
    list.hidden=false;wrap.setAttribute('aria-expanded','true');
  }
  function filter(q){
    q=(q||'').trim().toLowerCase();
    if(!q){items=[];sel=-1;render();return;}
    items=[];
    for(var i=0;i<DRINKS.length&&items.length<12;i++){
      if(DRINKS[i].name.toLowerCase().indexOf(q)>-1)items.push(DRINKS[i]);
    }
    sel=items.length?0:-1;render();
  }
  function select(i){
    sel=i;
    [].forEach.call(list.children,function(li,k){li.setAttribute('aria-selected',k===sel?'true':'false');if(k===sel)li.scrollIntoView({block:'nearest'});});
  }
  function go(i){
    var d=items[i];if(!d)return;
    input.value='';items=[];render();input.blur();
    var newHash='#'+encodeURIComponent(d.base)+'/'+encodeURIComponent(d.name);
    /* same URL fires no hashchange, so drive the open directly */
    if(location.hash===newHash)route();else location.hash=newHash;
  }
  input.addEventListener('input',function(){filter(input.value);});
  input.addEventListener('focus',function(){if(input.value)filter(input.value);});
  input.addEventListener('keydown',function(e){
    if(e.key==='ArrowDown'){e.preventDefault();if(items.length)select((sel+1)%items.length);}
    else if(e.key==='ArrowUp'){e.preventDefault();if(items.length)select((sel-1+items.length)%items.length);}
    else if(e.key==='Enter'){if(sel>-1){e.preventDefault();go(sel);}}
    else if(e.key==='Escape'){input.value='';items=[];render();input.blur();}
  });
  /* mousedown fires before the input's blur, so the click still runs even when the list is dismissed on blur */
  list.addEventListener('mousedown',function(e){
    var li=e.target.closest('li');if(!li)return;
    e.preventDefault();go(+li.getAttribute('data-idx'));
  });
  document.addEventListener('click',function(e){
    if(!wrap.contains(e.target)){items=[];render();}
  });
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
setupSearch();

window.addEventListener('hashchange',route);
window.addEventListener('resize',function(){if(tree)tree.apply();});
route();
})();
