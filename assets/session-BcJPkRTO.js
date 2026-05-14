import{i as e,n as t,t as n}from"./db-C1dp_ztn.js";import{f as r,p as i,u as a}from"./index-CC1fCRH2.js";var o=1440*60*1e3,s=1.3;function c(e,t){return{word_id:e,easiness:2.5,interval:0,repetitions:0,due_at:t}}function l(e,t,n){let{easiness:r,repetitions:i,interval:a}=e;t<2?(i=0,a=1):(i+=1,a=i===1?1:i===2?3:Math.round(a*r));let c=t;return r=r+.1-(3-c)*(.08+(3-c)*.02),r<s&&(r=s),{word_id:e.word_id,easiness:r,repetitions:i,interval:a,due_at:n+a*o,last_grade:t,last_reviewed_at:n}}function u(e,t){let{word:n,choices:r,onPick:o}=t,s=performance.now(),c=document.createElement(`div`);c.className=`flex flex-col gap-4 px-5 py-6`,c.innerHTML=`
    <div class="flex items-baseline justify-center gap-2">
      <h2 class="text-4xl font-serif">${f(n.german)}</h2>
      <button id="speak" class="text-2xl" aria-label="发音">🔊</button>
    </div>
    ${n.article?`<div class="text-center text-sm text-gray-500">${n.article}${n.plural?` · ${f(n.plural)}`:``}</div>`:``}
    <div id="choices" class="flex flex-col gap-3 mt-4"></div>
  `;let l=c.querySelector(`#choices`);for(let[e,t]of r.entries()){let n=document.createElement(`button`);n.dataset.idx=String(e),n.className=`w-full rounded-2xl py-4 px-5 text-left text-base active:bg-gray-200 transition ${t.kind===`unknown`?`bg-gray-200 text-gray-600`:t.kind===`none`?`bg-gray-100 italic`:`bg-gray-100`}`,n.textContent=t.text,n.addEventListener(`click`,()=>{n.classList.remove(`bg-gray-100`,`bg-gray-200`),n.classList.add(t.correct?`bg-green-200`:`bg-red-200`);let e=performance.now()-s;setTimeout(()=>o({picked:t,ms:e}),250)}),l.appendChild(n)}return c.querySelector(`#speak`).addEventListener(`click`,()=>a(n.german,i().voice_rate)),e.appendChild(c),i().voice_enabled&&a(n.german,i().voice_rate),()=>{c.parentNode===e&&e.removeChild(c)}}function d(e,t,n,r){let i=document.createElement(`div`);i.className=`fixed inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl p-5 border-t`;let a=t.german_synonyms.length?`<p class="text-sm text-gray-600 italic">≈ ${t.german_synonyms.map(f).join(`, `)}</p>`:``,o=t.example?`<p class="text-sm mt-2">${f(t.example)}</p>`:``;return i.innerHTML=`
    <div class="flex items-baseline gap-2">
      ${t.article?`<span class="text-gray-500">${t.article}</span>`:``}
      <h3 class="text-2xl font-serif">${f(t.german)}</h3>
      ${t.plural?`<span class="text-gray-500">${f(t.plural)}</span>`:``}
    </div>
    <p class="text-base mt-1">${t.chinese.map(f).join(` · `)}</p>
    ${a}
    ${o}
    <p class="text-xs text-gray-400 mt-3">Lektion ${t.lektion}${t.page?` · `+t.page:``}</p>

    <div class="grid grid-cols-4 gap-2 mt-5">
      <button data-g="0" class="rounded-xl py-3 bg-red-100">不认识</button>
      <button data-g="1" class="rounded-xl py-3 bg-yellow-100">模糊</button>
      <button data-g="2" class="rounded-xl py-3 bg-green-100">认识</button>
      <button data-g="3" class="rounded-xl py-3 bg-blue-100">简单</button>
    </div>
    <p class="text-center text-xs text-gray-400 mt-2">默认: ${n===2?`认识 (2)`:`不认识 (0)`}</p>
  `,i.querySelectorAll(`button[data-g]`).forEach(e=>{e.addEventListener(`click`,()=>{r(Number(e.dataset.g))})}),e.appendChild(i),()=>{i.parentNode===e&&e.removeChild(i)}}function f(e){return e.replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}var p={0:[3,5],1:[8,10]};function m(e,t,n=Math.random){let r=t.filter(t=>t.id!==e.id);h(r,n);let i=[];for(let t of r){if(i.length>=2)break;let n=t.chinese[0];n&&(e.chinese.includes(n)||i.push({text:n,correct:!1,kind:`option`}))}let a={text:e.chinese[0],correct:!0,kind:`option`},o=[...i,a];return h(o,n),[...o,{text:`以上都不对`,correct:!1,kind:`none`},{text:`不认识`,correct:!1,kind:`unknown`}]}function h(e,t){for(let n=e.length-1;n>0;n--){let r=Math.floor(t()*(n+1));[e[n],e[r]]=[e[r],e[n]]}}function g(e,t,n,r,i=Math.random){let a=Math.min(t.length,r),o=[...e];h(o,i);let s=[...t].slice(0,a);return h(s,i),[...o,...s].slice(0,n)}function _(e,t,n,r,i=Math.random){if(n!==0&&n!==1||r>=2)return e;let a=e[t];if(!a)return e;let[o,s]=p[n],c=o+Math.floor(i()*(s-o+1)),l=Math.min(t+c,e.length),u=[...e];return u.splice(l,0,a),u}function v(e,t,n){if(e.length===0)return[];let r=new Map(t.map(e=>[e.word_id,e]));return[...e].sort((e,t)=>(r.get(e.id)?.due_at??0)-(r.get(t.id)?.due_at??0)).slice(0,n)}async function y(a){a.innerHTML=`<p class="p-5 text-gray-500">加载中…</p>`;let o=Date.now(),s=i(),f=await n.words.toArray(),p=new Map(f.map(e=>[e.id,e])),h=await n.review_state.toArray(),b=new Set(h.map(e=>e.word_id)),x=await t(o),S=[],C=[];for(let e of x){let t=p.get(e);t&&(b.has(e)?S.push(t):C.push(t))}let w=g(S,C,s.session_size,s.daily_new_target),T=!1;if(w.length===0&&(w=v(f,h,s.session_size),T=w.length>0),w.length===0){a.innerHTML=`
      <div class="p-8 text-center">
        <p class="text-2xl mb-4">📭</p>
        <p>词库还是空的，去添加一些单词吧。</p>
        <button id="back" class="mt-6 rounded-2xl bg-gray-900 text-white px-6 py-3">回首页</button>
      </div>`,a.querySelector(`#back`).addEventListener(`click`,()=>r(`#/home`));return}let E=0,D=new Map,O=null,k=null,A=document.createElement(`div`);A.className=`min-h-full flex flex-col`,A.innerHTML=`
    <div class="px-5 pt-4">
      <div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div id="bar" class="h-full bg-gray-900 transition-all" style="width:0%"></div>
      </div>
      <div class="flex justify-between text-xs text-gray-500 mt-1">
        <span id="mode">${T?`加练模式`:``}</span>
        <span id="counter"></span>
      </div>
    </div>
    <div id="card-host" class="flex-1"></div>
  `,a.innerHTML=``,a.appendChild(A);let j=A.querySelector(`#card-host`),M=A.querySelector(`#bar`),N=A.querySelector(`#counter`),P=()=>{M.style.width=`100%`,j.innerHTML=`
      <div class="p-8 text-center">
        <p class="text-3xl mb-4">✅</p>
        <p>${T?`加练完成`:`今日学习完成`} (${w.length} 张)</p>
        <div class="mt-6 flex flex-col gap-3 items-center">
          <button id="again" class="rounded-2xl bg-gray-900 text-white px-6 py-3">再来一组</button>
          <button id="back" class="rounded-2xl bg-gray-100 text-gray-900 px-6 py-3">回首页</button>
        </div>
      </div>`,j.querySelector(`#back`).addEventListener(`click`,()=>r(`#/home`)),j.querySelector(`#again`).addEventListener(`click`,()=>{y(a)})},F=async(t,r)=>{let i=Date.now(),a=await n.review_state.get(t.id)??c(t.id,i);await e(l(a,r,i),a.interval,r,i)},I=()=>{if(O?.(),O=null,k?.(),k=null,E>=w.length){P();return}let e=w[E],t=w.length;M.style.width=`${E/t*100}%`;let n=(D.get(e.id)??0)>0;N.textContent=`${E+1} / ${t}${n?` · 重学`:``}`;let r=f.filter(t=>t.lektion===e.lektion&&t.pos===e.pos);O=u(j,{word:e,choices:m(e,r.length>=3?r:f),onPick:({picked:t})=>{k=d(j,e,t.kind===`option`&&t.correct?2:0,async t=>{if(await F(e,t),t===0||t===1){let n=D.get(e.id)??0,r=w.length;w=_(w,E,t,n),w.length>r&&D.set(e.id,n+1)}E+=1,I()})}})};return I(),()=>{O?.(),k?.()}}export{y as renderSession};