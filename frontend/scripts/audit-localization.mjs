import fs from 'node:fs';
import {parseAst} from 'rolldown/parseAst';
import {en} from '../src/translations/en.js'; import {mr} from '../src/translations/mr.js'; import {hi} from '../src/translations/hi.js';
const flatten=(obj,prefix='',out={})=>{for(const[k,v]of Object.entries(obj))typeof v==='string'?out[prefix+k]=v:flatten(v,prefix+k+'.',out);return out};
const flat={en:flatten(en),mr:flatten(mr),hi:flatten(hi)};
const known=new Map(); for(const[key,val]of Object.entries(flat.en)){if(!flat.mr[key]||!flat.hi[key])continue;const row=[val,flat.mr[key],flat.hi[key]];for(const text of row)known.set(text.replace(/\s+/g,' ').trim(),row);}
const files=['src/App.jsx',...fs.readdirSync('src/components').filter(f=>f.endsWith('.jsx')).map(f=>'src/components/'+f)];
const found=new Map();
const human=text=>/[A-Za-z\u0900-\u097f]/.test(text)&&!/(?:^#|rgba?\(|var\(--|gradient\(|^\d.*(?:px|rem|vh|vw|solid)|^[a-z]+(?:-[a-z]+)+$|^[\w.-]+@|^https?:|^\/?(?:api|assets)\/|^[.\w/-]+\.(?:png|svg|jpg)|^[A-Z]:|^[a-z]+[A-Z][a-z]|^\d+$)/.test(text)&&!['active','none','transparent','auto','block','flex','hidden','pointer','normal','relative','absolute','inline-flex','center','default','text','password','patient','doctor','admin','nurse','staff','cleaning','mr-IN','hi-IN','en-IN'].includes(text);
function add(text,file,kind){text=text.replace(/\s+/g,' ').trim();if(!human(text))return;const row=found.get(text)||{text,files:[],kinds:[],known:known.get(text)};if(!row.files.includes(file))row.files.push(file);if(!row.kinds.includes(kind))row.kinds.push(kind);found.set(text,row);}
for(const file of files){const ast=parseAst(fs.readFileSync(file,'utf8'),{lang:'jsx'},file);function walk(node,parent,key,ancestors=[]){if(!node||typeof node!=='object')return;
if(node.type==='JSXText')add(node.value,file,'text');
if(node.type==='JSXAttribute'&&['title','placeholder','aria-label','alt'].includes(node.name.name)&&node.value?.type==='Literal')add(node.value.value,file,'attr');
if(node.type==='Literal'&&typeof node.value==='string'&&parent?.type==='JSXExpressionContainer')add(node.value,file,'expression');
if(node.type==='Literal'&&typeof node.value==='string'&&parent?.type==='ConditionalExpression'&&key!=='test')add(node.value,file,'conditional');
if(node.type==='CallExpression'&&node.callee.name==='button'&&node.arguments[0]?.type==='Literal')add(node.arguments[0].value,file,'label');
if(node.type==='Property'&&['booked','waiting','called','in_consultation','skipped','completed','cancelled'].includes(node.key?.name)&&node.value?.type==='Literal')add(node.value.value,file,'label');
if(node.type==='Literal'&&typeof node.value==='string'&&parent?.type==='ArrayExpression'&&/[A-Z][a-z].* /.test(node.value))add(node.value,file,'label');
if(node.type==='Property'&&['label','title','subtitle','desc','description','text'].includes(node.key?.name)&&node.value?.type==='Literal')add(node.value.value,file,'label');
if(node.type==='TemplateLiteral'&&ancestors.some(a=>a.type==='JSXExpressionContainer')&&!ancestors.some(a=>a.type==='JSXAttribute'&&!['title','placeholder','aria-label','alt'].includes(a.name?.name))&&node.quasis.some(q=>/[A-Za-z\u0900-\u097f]/.test(q.value.cooked))){const text=node.quasis.map((q,i)=>q.value.cooked+(i<node.expressions.length?`{${i}}`:'')).join('');add(text,file,'template');}
for(const[k,v]of Object.entries(node)){if(Array.isArray(v))v.forEach(x=>walk(x,node,k,[...ancestors,node]));else if(v&&typeof v==='object')walk(v,node,k,[...ancestors,node]);}}walk(ast);}
const list=[...found.values()].map((r,i)=>({id:i,...r}));fs.writeFileSync('scripts/localization-inventory.json',JSON.stringify(list,null,2));
console.log(JSON.stringify({total:list.length,known:list.filter(x=>x.known).length,missing:list.filter(x=>!x.known).length}));
fs.writeFileSync('scripts/missing-localization.txt',list.filter(x=>!x.known).map(x=>x.id+'|'+x.text).join('\n'));
