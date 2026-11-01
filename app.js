const K='casorio-mesas-v1',SEATS=10,$=s=>document.querySelector(s);
let S=JSON.parse(localStorage.getItem(K)||'null')||{tables:[...Array(17)].map((_,i)=>({name:'Mesa '+(i+1),seats:Array(SEATS).fill(null)})),pool:[]};
let sel=null; // {from:'pool',i} or {from:'t',t,s}
const save=()=>localStorage.setItem(K,JSON.stringify(S));
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function addNames(txt){const all=new Set([...S.pool,...S.tables.flatMap(t=>t.seats)].filter(Boolean).map(norm));let n=0;
 txt.split(/\r?\n/).map(l=>l.split(/[;,\t]/)[0].replace(/^\s*[\d]+[.)-]\s*/,'').replace(/^[-•*]\s*/,'').trim()).filter(Boolean).forEach(x=>{if(!all.has(norm(x))){all.add(norm(x));S.pool.push(x);n++}});
 save();render();alert(n+' convidado(s) adicionado(s).')}
function take(o){if(o.from==='pool')return S.pool.splice(o.i,1)[0];const v=S.tables[o.t].seats[o.s];S.tables[o.t].seats[o.s]=null;return v}
function toSeat(o,t,s){const cur=S.tables[t].seats[s];if(o.from==='t'&&o.t===t&&o.s===s)return;const g=take(o);
 if(cur){if(o.from==='pool')S.pool.push(cur);else S.tables[o.t].seats[o.s]=cur}S.tables[t].seats[s]=g;sel=null;save();render()}
function toPool(o){if(o.from==='pool')return;S.pool.push(take(o));sel=null;save();render()}
function render(){const q=norm($('#search').value);const tot=S.pool.length+S.tables.reduce((a,t)=>a+t.seats.filter(Boolean).length,0);const seated=tot-S.pool.length;
 $('#stats').textContent=`${seated} de ${tot} convidados sentados · ${S.tables.length} mesas · ${S.tables.length*SEATS} lugares`;
 $('#poolCount').textContent='('+S.pool.length+')';
 $('#poolList').innerHTML=S.pool.map((g,i)=>[g,i]).filter(([g])=>!q||norm(g).includes(q)).sort((a,b)=>a[0].localeCompare(b[0],'pt')).map(([g,i])=>`<li class="g${sel&&sel.from==='pool'&&sel.i===i?' sel':''}" draggable="true" data-i="${i}"><span>${esc(g)}</span><button class="x" data-del="${i}" title="Remover">×</button></li>`).join('')||'<li style="font-style:italic;opacity:.6;padding:8px">Nenhum convidado aqui</li>';
 $('#tables').innerHTML=S.tables.map((t,ti)=>{const c=t.seats.filter(Boolean).length;const hit=q&&t.seats.some(g=>g&&norm(g).includes(q));
 if(q&&!hit&&!norm(t.name).includes(q)&&!sel)return'';
 return `<article class="table frame2" data-t="${ti}"><header><h3 data-ren="${ti}">${esc(t.name)}</h3><span class="cnt${c===SEATS?' full':''}">${c}/${SEATS}</span></header><ol class="seats">${t.seats.map((g,si)=>`<li class="seat${g?'':' empty'}${sel&&!g?' target':''}${sel&&sel.from==='t'&&sel.t===ti&&sel.s===si?' g sel':''}" data-t="${ti}" data-s="${si}" ${g?'draggable="true"':''}><span class="n">${si+1}</span><span class="nm">${g?esc(g):'Lugar livre'}</span>${g?`<button class="x" data-un="${ti},${si}" title="Tirar da mesa">↩</button>`:''}</li>`).join('')}</ol><div class="tact"><button data-clr="${ti}">Esvaziar</button>${c===0&&S.tables.length>1?`<button data-rm="${ti}">Excluir mesa</button>`:''}</div></article>`}).join('');
 const h=$('#hint');if(sel){h.hidden=false;h.innerHTML=`Toque num lugar para sentar <b>${esc(sel.from==='pool'?S.pool[sel.i]:S.tables[sel.t].seats[sel.s])}</b> · <u data-cancel>cancelar</u>`}else h.hidden=true}
document.addEventListener('click',e=>{const d=e.target.closest('[data-del],[data-un],[data-clr],[data-rm],[data-ren],[data-cancel],.seat,#poolList .g');if(!d)return;const ds=d.dataset;
 if(ds.cancel!==undefined){sel=null;return render()}
 if(ds.del){if(confirm('Remover '+S.pool[ds.del]+' da lista?')){S.pool.splice(ds.del,1);sel=null;save();render()}return}
 if(ds.un){const[t,s]=ds.un.split(',').map(Number);return toPool({from:'t',t,s})}
 if(ds.clr){const t=S.tables[ds.clr];if(confirm('Esvaziar '+t.name+'?')){t.seats.forEach((g,i)=>{if(g)S.pool.push(g);t.seats[i]=null});save();render()}return}
 if(ds.rm){S.tables.splice(ds.rm,1);save();return render()}
 if(ds.ren){const n=prompt('Nome da mesa',S.tables[ds.ren].name);if(n&&n.trim()){S.tables[ds.ren].name=n.trim();save();render()}return}
 if(d.classList.contains('seat')){const t=+ds.t,s=+ds.s;if(sel)return toSeat(sel,t,s);if(S.tables[t].seats[s]){sel={from:'t',t,s};render()}return}
 const i=+ds.i;sel=sel&&sel.from==='pool'&&sel.i===i?null:{from:'pool',i};render();if(sel&&innerWidth<=720)document.querySelector('.tables').scrollIntoView({behavior:'smooth'})});
$('#pool').addEventListener('click',e=>{if(sel&&sel.from==='t'&&!e.target.closest('input'))toPool(sel)});
// drag & drop (desktop)
let drag=null;document.addEventListener('dragstart',e=>{const g=e.target.closest('[draggable]');if(!g)return;drag=g.dataset.i!==undefined?{from:'pool',i:+g.dataset.i}:{from:'t',t:+g.dataset.t,s:+g.dataset.s};e.dataTransfer.setData('text','x')});
document.addEventListener('dragover',e=>{const s=e.target.closest('.seat,#pool');if(s&&drag){e.preventDefault();document.querySelectorAll('.over').forEach(x=>x.classList.remove('over'));s.classList.add('over')}});
document.addEventListener('drop',e=>{e.preventDefault();const s=e.target.closest('.seat'),p=e.target.closest('#pool');if(!drag)return;if(s)toSeat(drag,+s.dataset.t,+s.dataset.s);else if(p)toPool(drag);drag=null});
$('#search').oninput=render;
$('#newGuest').onkeydown=e=>{if(e.key==='Enter'&&e.target.value.trim()){addNames(e.target.value);e.target.value=''}};
$('#file').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(/\.docx?$/i.test(f.name)){alert('Salve o documento como .txt (Texto sem formatação) ou use "Colar nomes".');return}addNames(await f.text());e.target.value=''};
$('#pasteBtn').onclick=()=>{$('#pasteTxt').value='';$('#pasteDlg').showModal()};
$('#pasteDlg').onclose=()=>{if($('#pasteDlg').returnValue==='ok')addNames($('#pasteTxt').value)};
$('#addTable').onclick=()=>{S.tables.push({name:'Mesa '+(S.tables.length+1),seats:Array(SEATS).fill(null)});save();render();scrollTo({top:document.body.scrollHeight,behavior:'smooth'})};
$('#resetBtn').onclick=()=>{if(confirm('Apagar tudo e recomeçar? (Exporte um backup antes)')){localStorage.removeItem(K);location.reload()}};
$('#exportBtn').onclick=()=>$('#exportDlg').showModal();
const dl=(n,t,m)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:m}));a.download=n;a.click()};
$('#exportDlg').onclick=e=>{const x=e.target.dataset.x;if(!x)return;
 if(x==='txt')dl('mapa-de-mesas.txt',S.tables.map(t=>t.name+'\n'+t.seats.map((g,i)=>`  ${i+1}. ${g||'—'}`).join('\n')).join('\n\n')+(S.pool.length?'\n\nSem mesa:\n'+S.pool.join('\n'):''),'text/plain');
 if(x==='csv')dl('mapa-de-mesas.csv','\ufeffMesa;Lugar;Convidado\n'+S.tables.flatMap(t=>t.seats.map((g,i)=>`${t.name};${i+1};${g||''}`)).concat(S.pool.map(g=>`Sem mesa;;${g}`)).join('\n'),'text/csv');
 if(x==='json')dl('casorio-backup.json',JSON.stringify(S,null,1),'application/json');
 if(x==='print'){$('#exportDlg').close();setTimeout(print,200)}};
$('#importJson').onchange=async e=>{try{const d=JSON.parse(await e.target.files[0].text());if(!d.tables)throw 0;S=d;save();render()}catch{alert('Arquivo inválido')}};
render();
