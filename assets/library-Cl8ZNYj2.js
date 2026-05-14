const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/src-DIWfyxTF.js","assets/chunk-jRWAZmH_.js"])))=>i.map(i=>d[i]);
import{o as e}from"./chunk-jRWAZmH_.js";import{t}from"./db-C1dp_ztn.js";import{a as n,f as r,i,o as a,s as o,t as s}from"./index-CC1fCRH2.js";var c=null;async function l(t){if(!c){t?.(`加载 OCR 引擎`,0);let n=await s(()=>import(`./src-DIWfyxTF.js`).then(t=>e(t.default,1)),__vite__mapDeps([0,1]));c=(async()=>await n.createWorker([`deu`],1,{logger:e=>{t&&t(e.status===`recognizing text`?`识别中`:e.status===`loading language traineddata`?`下载德语模型 (首次约 10MB)`:e.status,Math.round(e.progress*100))}}))()}return c}async function u(e,t,n={}){let r=await l(t),i=URL.createObjectURL(e),a=n.cropAnnotations??!1;try{if(n.columns===2){let[e,n]=await p(i);if(a){let t=await m(e,.62),r=await m(n,.62);URL.revokeObjectURL(e),URL.revokeObjectURL(n),e=t,n=r}try{t?.(a?`识别左栏（去手写）`:`识别左栏`,0);let i=await d(r,e);t?.(a?`识别右栏（去手写）`:`识别右栏`,50);let o=await d(r,n);return t?.(`识别完成`,100),i.trim()+`

=== 右栏 ===

`+o.trim()}finally{URL.revokeObjectURL(e),URL.revokeObjectURL(n)}}if(a){let e=await m(i,.62);try{return await d(r,e)}finally{URL.revokeObjectURL(e)}}return await d(r,i)}finally{URL.revokeObjectURL(i)}}async function d(e,t){let n=await f(t);try{let{data:t}=await e.recognize(n);return t.text}finally{URL.revokeObjectURL(n)}}async function f(e){let t=await h(e),n=Math.floor(t.naturalWidth*2),r=Math.floor(t.naturalHeight*2),i=document.createElement(`canvas`);i.width=n,i.height=r;let a=i.getContext(`2d`);if(!a)throw Error(`canvas 2d context unavailable`);a.imageSmoothingEnabled=!0,a.imageSmoothingQuality=`high`,a.drawImage(t,0,0,n,r);let o=a.getImageData(0,0,n,r),s=o.data,c=255,l=0;for(let e=0;e<s.length;e+=4){let t=(s[e]+s[e+1]+s[e+2])/3;t<c&&(c=t),t>l&&(l=t)}let u=c+(l-c)*.02,d=l-(l-c)*.02,f=Math.max(1,d-u);for(let e=0;e<s.length;e+=4){let t=(s[e]+s[e+1]+s[e+2])/3,n=Math.max(0,Math.min(255,Math.round((t-u)/f*255)));s[e]=n,s[e+1]=n,s[e+2]=n}return a.putImageData(o,0,0),new Promise((e,t)=>{i.toBlob(n=>{if(!n)return t(Error(`canvas toBlob failed`));e(URL.createObjectURL(n))},`image/png`)})}async function p(e){let t=await h(e),n=t.naturalWidth,r=t.naturalHeight,i=Math.round(n*.03),a=Math.floor(n/2),o=Math.min(n,a+i),s=Math.max(0,a-i);return[await g(t,0,0,o,r),await g(t,s,0,n-s,r)]}async function m(e,t){let n=await h(e);return g(n,0,0,Math.floor(n.naturalWidth*t),n.naturalHeight)}function h(e){return new Promise((t,n)=>{let r=new Image;r.onload=()=>t(r),r.onerror=e=>n(e),r.src=e})}async function g(e,t,n,r,i){let a=document.createElement(`canvas`);a.width=r,a.height=i;let o=a.getContext(`2d`);if(!o)throw Error(`canvas 2d context unavailable`);return o.drawImage(e,t,n,r,i,0,0,r,i),new Promise((e,t)=>{a.toBlob(n=>{if(!n)return t(Error(`canvas toBlob failed`));e(URL.createObjectURL(n))},`image/png`)})}function _(e){let{defaultLektion:r,onSaved:s}=e,c=document.createElement(`div`);c.className=`fixed inset-0 bg-black/40 z-50 flex items-end justify-center`,c.innerHTML=`
    <div class="bg-white w-full max-w-md max-h-[92vh] rounded-t-3xl overflow-y-auto">
      <header class="sticky top-0 bg-white px-5 py-3 border-b flex items-center gap-3">
        <button id="cancel" class="text-gray-500">取消</button>
        <h2 class="flex-1 text-center font-medium">添加单词</h2>
        <button id="save" class="text-blue-600 font-medium">保存</button>
      </header>

      <div class="px-5 py-4 flex flex-col gap-3">
        <label class="rounded-xl bg-gray-100 py-2 px-3 text-sm flex items-center justify-center cursor-pointer">
          📷 拍照 / 相册
          <input id="img" type="file" accept="image/*" class="hidden">
        </label>
        <button id="vision" class="rounded-xl bg-blue-600 text-white py-2.5 px-3 text-sm font-medium">🖼️ Qwen-VL 视觉直解（推荐）</button>
        <details class="text-xs text-gray-500">
          <summary class="cursor-pointer">备用：OCR + DeepSeek 文本路径</summary>
          <div class="flex flex-col gap-2 mt-2 pl-2 border-l-2 border-gray-200">
            <button id="parse" class="rounded-xl bg-blue-100 text-blue-800 py-2 px-3 text-sm">🤖 OCR → DeepSeek 解析</button>
            <label class="text-xs text-gray-600 flex items-center gap-2">
              <input id="twocol" type="checkbox" checked>
              双栏切分（2 列课本页必勾）
            </label>
            <label class="text-xs text-gray-600 flex items-center gap-2">
              <input id="croprhs" type="checkbox" checked>
              截除右侧手写笔记（Lernwortschatz 页带答题划线时勾上）
            </label>
          </div>
        </details>
        <div id="ocr-status" class="text-xs text-gray-500 hidden"></div>
        <textarea id="ocr" class="rounded-xl bg-gray-50 border p-2 text-sm font-mono" rows="4" placeholder="OCR 原始文本，或直接粘贴德语词列表"></textarea>

        <div id="candidates" class="hidden flex flex-col gap-2"></div>

        <hr class="my-1" id="divider">

        <details id="manual" class="text-sm">
          <summary class="text-gray-500 mb-2 cursor-pointer">手动添加一个</summary>
          <div class="flex flex-col gap-3">
            <label class="text-sm">
              <span class="text-gray-500">德语 *</span>
              <input id="german" class="w-full mt-1 rounded-lg bg-gray-100 px-3 py-2" placeholder="z.B. Angabe">
            </label>

            <div class="grid grid-cols-2 gap-2">
              <label class="text-sm">
                <span class="text-gray-500">冠词</span>
                <select id="article" class="w-full mt-1 rounded-lg bg-gray-100 px-2 py-2">
                  <option value="">—</option>
                  <option value="der">der</option>
                  <option value="die">die</option>
                  <option value="das">das</option>
                </select>
              </label>
              <label class="text-sm">
                <span class="text-gray-500">复数</span>
                <input id="plural" class="w-full mt-1 rounded-lg bg-gray-100 px-3 py-2" placeholder="-n / -e">
              </label>
            </div>

            <label class="text-sm">
              <span class="text-gray-500">词性</span>
              <select id="pos" class="w-full mt-1 rounded-lg bg-gray-100 px-2 py-2">
                <option value="noun">noun</option>
                <option value="verb">verb</option>
                <option value="adj">adj</option>
                <option value="adv">adv</option>
                <option value="phrase">phrase</option>
              </select>
            </label>

            <label class="text-sm">
              <span class="text-gray-500">中文释义 * (/ 或换行分隔)</span>
              <textarea id="chinese" class="w-full mt-1 rounded-lg bg-gray-100 px-3 py-2" rows="2"></textarea>
            </label>

            <label class="text-sm">
              <span class="text-gray-500">德德同义词</span>
              <textarea id="syn" class="w-full mt-1 rounded-lg bg-gray-100 px-3 py-2" rows="1"></textarea>
            </label>
          </div>
        </details>

        <div class="grid grid-cols-3 gap-2 items-end">
          <label class="text-sm">
            <span class="text-gray-500">Lektion</span>
            <input id="lektion" type="number" min="1" max="20" value="${r}" class="w-full mt-1 rounded-lg bg-gray-100 px-3 py-2">
          </label>
          <label class="text-sm">
            <span class="text-gray-500">页码</span>
            <input id="page" class="w-full mt-1 rounded-lg bg-gray-100 px-3 py-2" placeholder="S.54">
          </label>
          <label class="text-sm flex items-center gap-1 mb-2">
            <input id="irregular" type="checkbox">
            不规则*
          </label>
        </div>

        <p id="err" class="text-sm text-red-600 hidden"></p>
      </div>
    </div>
  `,document.body.appendChild(c);let l=()=>{c.parentNode===document.body&&document.body.removeChild(c)},d=e=>c.querySelector(e),f=e=>{let t=d(`#err`);t.textContent=e,t.classList.remove(`hidden`),setTimeout(()=>t.classList.add(`hidden`),6e3)};d(`#cancel`).addEventListener(`click`,l),c.addEventListener(`click`,e=>{e.target===c&&l()});let p=d(`#img`);p.addEventListener(`change`,()=>{let e=p.files?.[0];if(!e)return;let t=d(`#ocr-status`);t.classList.remove(`hidden`),t.textContent=`已选照片（${(e.size/1024).toFixed(0)} KB）。点 🖼️ 视觉直解 或展开备用 OCR 路径。`}),d(`#vision`).addEventListener(`click`,async()=>{if(!n()){f(`未配置 Qwen API key — 去 Settings 填`);return}let e=p.files?.[0];if(!e){f(`先选一张照片`);return}let t=Number(d(`#lektion`).value)||r,i=d(`#ocr-status`);i.classList.remove(`hidden`),i.textContent=`🖼️ Qwen-VL 识别中…（视图 + 解析一步完成，10–30 秒）`;try{let n=await o(e,t);i.textContent=`识别出 ${n.length} 个词条。`,await m(n,`qwen-vl`)}catch(e){i.textContent=`识别失败：`+String(e)}}),d(`#parse`).addEventListener(`click`,async()=>{if(!i()){f(`未配置 DeepSeek API key — 去 Settings 填`);return}let e=d(`#ocr-status`);e.classList.remove(`hidden`);let t=d(`#ocr`).value.trim(),n=p.files?.[0];if(!t&&n){let r=d(`#twocol`).checked,i=d(`#croprhs`).checked;try{t=(await u(n,(t,n)=>{e.textContent=`${t} ${n}%`},{columns:r?2:1,cropAnnotations:i})).trim(),d(`#ocr`).value=t}catch(t){e.textContent=`OCR 失败：`+String(t);return}}if(!t){f(`先选张照片或粘贴 OCR 文本`);return}let o=Number(d(`#lektion`).value)||r;e.textContent=`🤖 DeepSeek 解析中…`;try{let n=await a(t,o);e.textContent=`解析出 ${n.length} 个词条。`,await m(n,`deepseek`)}catch(t){e.textContent=`解析失败：`+String(t)}});let m=async(e,n)=>{let i=Number(d(`#lektion`).value)||r,a=await t.words.toArray(),o=new Map(a.map(e=>[e.german.toLowerCase(),e])),c=d(`#candidates`);c.classList.remove(`hidden`),c.innerHTML=`
      <div class="flex items-center justify-between text-sm mb-1">
        <span class="text-gray-500">${e.length} 个候选</span>
        <div class="flex gap-2">
          <button id="all" class="text-blue-600 text-xs">全选</button>
          <button id="none" class="text-gray-500 text-xs">取消</button>
        </div>
      </div>
      <ul class="flex flex-col gap-1.5 max-h-[40vh] overflow-y-auto">
        ${e.map((e,t)=>{let n=o.get(e.german.toLowerCase()),r=e.article?`${e.article} ${e.german}`:e.german,i=e.plural?`, ${v(e.plural)}`:``;return`
            <li class="flex items-start gap-2 py-1.5 px-2 rounded ${n?`bg-yellow-50`:`bg-gray-50`}">
              <input type="checkbox" data-i="${t}" ${n?``:`checked`} class="mt-1">
              <div class="flex-1 text-sm">
                <div class="font-serif">${v(r)}${i} <span class="text-xs text-gray-400">${e.pos}${e.irregular?` *`:``}</span></div>
                <div class="text-xs text-gray-600">${e.chinese.map(v).join(` · `)}</div>
                ${e.german_synonyms?.length?`<div class="text-xs text-gray-500 italic">≈ ${e.german_synonyms.map(v).join(`, `)}</div>`:``}
                ${n?`<div class="text-xs text-yellow-700">⚠️ 已存在</div>`:``}
              </div>
            </li>`}).join(``)}
      </ul>
      <button id="bulk" class="rounded-xl bg-gray-900 text-white py-3 mt-2 font-medium">导入选中</button>
    `;let u=e=>c.querySelectorAll(`input[type=checkbox]`).forEach(t=>t.checked=e);c.querySelector(`#all`).addEventListener(`click`,()=>u(!0)),c.querySelector(`#none`).addEventListener(`click`,()=>u(!1)),c.querySelector(`#bulk`).addEventListener(`click`,async()=>{let r=[...c.querySelectorAll(`input[type=checkbox]:checked`)].map(t=>e[Number(t.dataset.i)]),a=d(`#page`).value.trim(),o=Date.now(),u=r.map(e=>({id:`u-`+(crypto.randomUUID?.()??String(o)+Math.random().toString(36).slice(2)),german:e.german,...e.article?{article:e.article}:{},...e.plural?{plural:e.plural}:{},pos:e.pos,chinese:e.chinese,german_synonyms:e.german_synonyms??[],lektion:i,...a?{page:a}:{},...e.irregular?{irregular:!0}:{},source:n,created_at:o}));if(!u.length){f(`没选中任何条目`);return}try{await t.words.bulkPut(u),l(),s()}catch(e){f(`导入失败：`+String(e))}})};return d(`#save`).addEventListener(`click`,async()=>{let e=d(`#german`).value.trim(),n=d(`#chinese`).value.trim();if(!e)return f(`德语不能为空（或用 🤖 Gemini 批量导入）`);if(!n)return f(`中文释义不能为空`);let i=n.split(/[/\n,，;]+/).map(e=>e.trim()).filter(Boolean),a=d(`#syn`).value.trim(),o=a?a.split(/[/\n,，;]+/).map(e=>e.trim()).filter(Boolean):[],c=d(`#article`).value,u=d(`#plural`).value.trim(),p=d(`#pos`).value,m=Number(d(`#lektion`).value)||r,h=d(`#page`).value.trim(),g=d(`#irregular`).checked,_={id:`u-`+(crypto.randomUUID?.()??Date.now().toString(36)+Math.random().toString(36).slice(2)),german:e,...c?{article:c}:{},...u?{plural:u}:{},pos:p,chinese:i,german_synonyms:o,lektion:m,...h?{page:h}:{},...g?{irregular:!0}:{},source:`user`,created_at:Date.now()};try{await t.words.add(_),l(),s()}catch(e){f(`保存失败：`+String(e))}}),l}function v(e){return e.replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}async function y(e){let n=await t.words.toArray(),i=await t.review_state.toArray(),a=new Map(i.map(e=>[e.word_id,e])),o=n.reduce((e,t)=>Math.max(e,t.lektion),7);e.innerHTML=`
    <div class="min-h-full flex flex-col relative">
      <header class="px-5 pt-6 pb-3 flex items-center gap-3">
        <a href="#/home" class="text-gray-500">←</a>
        <h1 class="text-2xl font-serif">词库</h1>
        <span class="text-sm text-gray-400 ml-auto">${n.length} 词</span>
      </header>
      <div class="px-5 pb-3 flex gap-2">
        <input id="q" class="flex-1 rounded-xl bg-gray-100 px-4 py-2" placeholder="搜索德语 / 中文" />
        <select id="filter" class="rounded-xl bg-gray-100 px-2">
          <option value="all">全部</option>
          <option value="due">到期</option>
          <option value="new">未学</option>
          <option value="leech">困难 (≥3 失败)</option>
        </select>
      </div>
      <ul id="list" class="px-3 flex-1 overflow-auto pb-24"></ul>
      <button id="fab" class="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gray-900 text-white text-3xl shadow-lg flex items-center justify-center" aria-label="添加单词">+</button>
    </div>
  `;let s=e.querySelector(`#list`),c=e.querySelector(`#q`),l=e.querySelector(`#filter`),u=await x(),d=()=>{let e=c.value.trim().toLowerCase(),t=l.value,r=Date.now();s.innerHTML=n.filter(n=>{if(e&&!(n.german.toLowerCase().includes(e)||n.chinese.some(t=>t.includes(e))))return!1;let i=a.get(n.id);return t===`due`?i?i.due_at<=r:!0:t===`new`?!i:t===`leech`?(u.get(n.id)??0)>=3:!0}).map(e=>b(e,a.get(e.id))).join(``)},f=e=>{let t=e.target.closest(`li[data-id]`);t&&r(`#/word/${t.dataset.id}`)};s.addEventListener(`click`,f),c.addEventListener(`input`,d),l.addEventListener(`change`,d),d();let p=e.querySelector(`#fab`),m=()=>{_({defaultLektion:o,onSaved:()=>r(`#/library`)})};return p.addEventListener(`click`,m),()=>{s.removeEventListener(`click`,f),p.removeEventListener(`click`,m)}}function b(e,t){let n=t?`<span class="text-xs text-gray-400">EF ${t.easiness.toFixed(1)} · ${t.repetitions}×</span>`:`<span class="text-xs text-blue-500">未学</span>`,r=e.article?`${e.article} ${e.german}`:e.german;return`
    <li data-id="${e.id}" class="px-2 py-3 border-b border-gray-100 flex items-center gap-3">
      <div class="flex-1">
        <div class="font-serif">${S(r)}</div>
        <div class="text-xs text-gray-500">${e.chinese.map(S).join(` · `)}</div>
      </div>
      ${n}
    </li>`}async function x(){let e=await t.review_log.toArray(),n=new Map;for(let t of e)t.grade<2&&n.set(t.word_id,(n.get(t.word_id)??0)+1);return n}function S(e){return e.replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}export{y as renderLibrary};