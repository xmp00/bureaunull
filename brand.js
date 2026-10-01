(function(){
'use strict';
var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var finePointer = window.matchMedia('(pointer:fine)').matches;

/* ---------- grain + progress (inject if missing) ---------- */
if(!document.querySelector('.noise') && !document.querySelector('.bn-noise')){
  var n=document.createElement('div');n.className='bn-noise';document.body.appendChild(n);
}
var prog=document.createElement('div');prog.className='bn-progress';document.body.appendChild(prog);
function updProg(){
  var h=document.documentElement;
  var max=h.scrollHeight-h.clientHeight;
  prog.style.width=(max>0?(h.scrollTop/max)*100:0)+'%';
}
window.addEventListener('scroll',updProg,{passive:true});updProg();

/* ---------- mini boot loader (only when page has none) ---------- */
if(!document.querySelector('.loader') && !reduced){
  var l=document.createElement('div');l.className='bn-loader';
  l.textContent='> BOOTING BUREAU_NULL … 00%';
  document.body.appendChild(l);
  var p=0,iv=setInterval(function(){
    p+=Math.ceil(Math.random()*22);
    if(p>=100){p=100;clearInterval(iv);
      setTimeout(function(){l.classList.add('done');setTimeout(function(){l.remove();},500);},120);}
    l.textContent='> BOOTING BUREAU_NULL … '+(p<10?'0':'')+p+'%';
  },55);
}

/* ---------- magnetic buttons (subtle, native cursor kept) ---------- */
if(finePointer && !reduced){
  document.querySelectorAll('.btn,.nav-cta').forEach(function(b){
    b.addEventListener('mousemove',function(e){
      var r=b.getBoundingClientRect();
      var dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
      b.style.transform='translate('+dx*.10+'px,'+dy*.16+'px)';
    });
    b.addEventListener('mouseleave',function(){b.style.transform='';});
  });
}

/* ---------- scramble headings ---------- */
var CHARS='!<>-_\\/[]{}—=+*^?#$%&@01';
function scramble(el){
  if(el.dataset.scrambled)return; el.dataset.scrambled='1';
  var original=el.dataset.text||el.textContent; el.dataset.text=original;
  if(reduced){el.textContent=original;return;}
  var frame=0,total=Math.max(18,original.length*1.6);
  (function tick(){
    var out='',done=Math.floor((frame/total)*original.length);
    for(var i=0;i<original.length;i++){
      var ch=original[i];
      if(i<done||ch===' '||ch==='\n')out+=ch;
      else out+=CHARS[Math.floor(Math.random()*CHARS.length)];
    }
    el.textContent=out;
    if(frame++<total)requestAnimationFrame(tick);else el.textContent=original;
  })();
}
var scObs=new IntersectionObserver(function(es){
  es.forEach(function(en){if(en.isIntersecting){scramble(en.target);scObs.unobserve(en.target);}});
},{threshold:.4});
document.querySelectorAll('[data-scramble]').forEach(function(el){scObs.observe(el);});

/* ---------- ticker: duplicate track for seamless loop ---------- */
document.querySelectorAll('.bn-ticker-track').forEach(function(tr){tr.innerHTML+=tr.innerHTML;});

/* ---------- info popovers ---------- */
document.addEventListener('click',function(e){
  var b=e.target.closest('.info-btn[data-pop]');
  if(!b)return;
  e.preventDefault();
  var pop=document.getElementById(b.getAttribute('data-pop'));
  if(!pop)return;
  var open=pop.classList.toggle('open');
  b.classList.toggle('active',open);
  b.textContent=open?'×':'i';
});

/* ---------- wheel step-scroll (opt-in via body[data-step]) ---------- */
if(document.body.hasAttribute('data-step') && finePointer && !reduced && innerWidth>1024){
  var secs=Array.prototype.slice.call(document.querySelectorAll('section.step'));
  var footer=document.querySelector('footer.footer');
  if(footer)secs.push(footer);
  if(secs.length>2){
    /* JS owns the wheel on step pages — kill CSS snap so they don't fight */
    document.documentElement.classList.add('step-lock');
    var animating=false,acc=0,accT=0;
    var SNAP=96; /* must match scroll-margin-top on sections */
    function curIdx(){
      var y=window.scrollY,idx=0;
      for(var i=0;i<secs.length;i++){if(secs[i].offsetTop<=y+SNAP+24)idx=i;}
      return idx;
    }
    function go(i){
      i=Math.max(0,Math.min(secs.length-1,i));
      animating=true;
      window.scrollTo({top:Math.max(0,secs[i].offsetTop-SNAP),behavior:'smooth'});
      setTimeout(function(){animating=false;},900);
    }
    window.addEventListener('wheel',function(e){
      if(animating){e.preventDefault();return;}
      if(e.target.closest('.modal-overlay,.modal,select,textarea,.calc-container'))return;
      var now=Date.now();
      if(now-accT>250)acc=0; accT=now; acc+=e.deltaY;
      if(Math.abs(acc)<28)return;
      var dir=acc>0?1:-1; acc=0;
      var i=curIdx(),s=secs[i],vh=innerHeight,y=window.scrollY;
      if(dir>0){
        var bottom=s.offsetTop+s.offsetHeight;
        if(bottom-(y+vh)>16)return;          // tall section: native scroll inside
        e.preventDefault();go(i+1);
      }else{
        if(y-s.offsetTop>16)return;          // native scroll back to section top
        e.preventDefault();go(i-1);
      }
    },{passive:false});
  }
}

/* ---------- JS/GSAP availability flags ---------- */
document.documentElement.classList.remove('no-js');
if(typeof window.gsap==='undefined'){document.documentElement.classList.add('no-gsap');}

/* ---------- loader safety: never trap the page ---------- */
setTimeout(function(){
  document.querySelectorAll('.loader').forEach(function(l){
    if(getComputedStyle(l).display==='none')return;
    l.style.transition='opacity .5s';l.style.opacity='0';
    setTimeout(function(){l.style.display='none';},520);
  });
},1200);

/* ---------- burger + mobile menu (fully injected) ---------- */
(function(){
  var navInner=document.querySelector('nav .nav-inner');
  var navLinks=document.querySelector('nav .nav-links');
  if(!navInner||!navLinks)return;
  var burger=document.createElement('button');
  burger.className='bn-burger';burger.type='button';
  burger.setAttribute('aria-label','Open menu');
  burger.setAttribute('aria-expanded','false');
  burger.setAttribute('aria-controls','bnMobileMenu');
  burger.innerHTML='<span></span><span></span><span></span>';
  navInner.appendChild(burger);

  var menu=document.createElement('div');
  menu.className='bn-mobilemenu';menu.id='bnMobileMenu';
  menu.setAttribute('role','dialog');menu.setAttribute('aria-modal','true');menu.setAttribute('aria-label','Site menu');
  Array.prototype.forEach.call(navLinks.querySelectorAll('a'),function(a){
    var c=document.createElement('a');
    c.href=a.getAttribute('href');c.textContent=a.textContent;
    if(a.classList.contains('nav-cta'))c.className='mm-cta';
    menu.appendChild(c);
  });
  document.body.appendChild(menu);

  var open=false;
  function setOpen(v){
    open=v;
    burger.setAttribute('aria-expanded',v?'true':'false');
    burger.setAttribute('aria-label',v?'Close menu':'Open menu');
    menu.classList.toggle('open',v);
    document.body.style.overflow=v?'hidden':'';
    if(v){var f=menu.querySelector('a');if(f)f.focus();}
    else{burger.focus();}
  }
  burger.addEventListener('click',function(){setOpen(!open);});
  menu.addEventListener('click',function(e){if(e.target===menu||e.target.tagName==='A')setOpen(false);});
  document.addEventListener('keydown',function(e){
    if(!open)return;
    if(e.key==='Escape'){setOpen(false);return;}
    if(e.key==='Tab'){ /* basic focus trap */
      var items=Array.prototype.slice.call(menu.querySelectorAll('a'));items.unshift(burger);
      var first=items[0],last=items[items.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
  /* reset state if viewport grows past the breakpoint */
  window.matchMedia('(min-width: 961px)').addEventListener('change',function(m){if(m.matches&&open)setOpen(false);});
})();

/* ---------- global copy-mail buttons (.copy-mail[data-copy]) ---------- */
document.addEventListener('click',function(e){
  var b=e.target.closest('.copy-mail');
  if(!b)return;
  e.preventDefault();
  var v=b.getAttribute('data-copy')||'';
  if(!b.dataset.label)b.dataset.label=b.textContent;
  function done(){
    b.textContent='> ADDRESS COPIED';
    b.classList.add('copied');
    setTimeout(function(){b.textContent=b.dataset.label;b.classList.remove('copied');},2000);
  }
  function fallback(){
    var ta=document.createElement('textarea');
    ta.value=v;ta.setAttribute('readonly','');
    ta.style.position='fixed';ta.style.opacity='0';ta.style.pointerEvents='none';
    document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy');}catch(err){}
    document.body.removeChild(ta);done();
  }
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(v).then(done,fallback);
  }else fallback();
});

/* ---------- sticky pill injection (pages that have none of their own) ---------- */
(function(){
  if(document.getElementById('stickyPill')||document.querySelector('.bn-pill,.sticky-pill'))return;
  var path=location.pathname;
  var isSecurity=/(^|\/)security\.html$/.test(path);
  var isListed=isSecurity||/(^|\/)(work|about|careers|journal)\.html$/.test(path)||path.indexOf('/journal/')!==-1;
  if(!isListed)return;
  var inSubdir=path.indexOf('/journal/')!==-1;
  var a=document.createElement('a');
  a.className='bn-pill';a.id='bnPill';
  if(isSecurity){a.textContent='CONFIGURE YOUR AUDIT →';a.href='#configure';}
  else{a.textContent='START YOUR PROJECT →';a.href=(inSubdir?'../':'')+'index.html#pricing';}
  document.body.appendChild(a);
  var target=isSecurity?document.getElementById('configure'):null;
  if(target){
    a.addEventListener('click',function(e){e.preventDefault();target.scrollIntoView({behavior:reduced?'auto':'smooth'});});
  }
  function updPill(){
    var show=window.scrollY>window.innerHeight*0.9;
    if(show&&target){
      var r=target.getBoundingClientRect();
      if(r.top<window.innerHeight&&r.bottom>0)show=false;
    }else if(show){
      var h=document.documentElement;
      if(h.scrollHeight-(h.scrollTop+h.clientHeight)<h.clientHeight*0.6)show=false;
    }
    a.classList.toggle('show',show);
  }
  window.addEventListener('scroll',updPill,{passive:true});
  window.addEventListener('resize',updPill);
  updPill();
})();
})();


try{
  console.log("%cBN://null%c — you open the hood. good.%c\nseven fragments sleep in the source of seven pages.\nwalk the path a client walks. start where machines are told not to go.",
    "color:#00e676;font-weight:bold","color:#9a9aa8","color:#6b6b78");
}catch(e){}
