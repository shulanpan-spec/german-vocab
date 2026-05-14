import{t as e}from"./db-C1dp_ztn.js";import{d as t,f as n,u as r}from"./index-CC1fCRH2.js";async function i(i){let{id:o}=t(),s=await e.words.get(o);if(!s){i.innerHTML=`<p class="p-5">单词不存在</p>`;return}let c=await e.review_state.get(o),l=(await e.review_log.where(`word_id`).equals(o).toArray()).sort((e,t)=>t.timestamp-e.timestamp).slice(0,20);i.innerHTML=`
    <div class="min-h-full flex flex-col">
      <header class="px-5 pt-6 pb-3 flex items-center gap-3">
        <a href="#/library" class="text-gray-500">←</a>
        <h1 class="text-xl">单词详情</h1>
      </header>
      <main class="px-5 flex-1 flex flex-col gap-4">
        <div class="flex items-baseline gap-2">
          ${s.article?`<span class="text-gray-500">${s.article}</span>`:``}
          <h2 class="text-3xl font-serif">${a(s.german)}</h2>
          ${s.plural?`<span class="text-gray-500">${a(s.plural)}</span>`:``}
          <button id="speak" class="ml-2 text-2xl">🔊</button>
        </div>
        <p>${s.chinese.map(a).join(` · `)}</p>
        ${s.german_synonyms.length?`<p class="text-sm italic text-gray-600">≈ ${s.german_synonyms.map(a).join(`, `)}</p>`:``}
        ${s.example?`<p class="text-sm">${a(s.example)}</p>`:``}
        <p class="text-xs text-gray-400">Lektion ${s.lektion}${s.page?` · `+s.page:``} · ${s.pos}</p>

        <h3 class="mt-4 text-sm font-semibold">复习状态</h3>
        ${c?`<dl class="text-sm grid grid-cols-2 gap-y-1">
              <dt class="text-gray-500">Easiness</dt><dd>${c.easiness.toFixed(2)}</dd>
              <dt class="text-gray-500">Interval</dt><dd>${c.interval} d</dd>
              <dt class="text-gray-500">Repetitions</dt><dd>${c.repetitions}</dd>
              <dt class="text-gray-500">Due</dt><dd>${new Date(c.due_at).toLocaleString()}</dd>
            </dl>
            <button id="forceDue" class="self-start text-xs text-blue-600">立即设为到期</button>`:`<p class="text-sm text-gray-500">还未学过</p>`}

        <h3 class="mt-4 text-sm font-semibold">最近 ${l.length} 次复习</h3>
        <ul class="text-sm">
          ${l.map(e=>`
            <li class="flex justify-between border-b border-gray-100 py-1">
              <span>${new Date(e.timestamp).toLocaleString()}</span>
              <span>grade ${e.grade} · ${e.prev_interval}d → ${e.next_interval}d</span>
            </li>`).join(``)}
        </ul>
      </main>
    </div>
  `,i.querySelector(`#speak`).addEventListener(`click`,()=>r(s.german)),i.querySelector(`#forceDue`)?.addEventListener(`click`,async()=>{await e.review_state.update(o,{due_at:Date.now()}),n(`#/library`)})}function a(e){return e.replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}export{i as renderWordDetail};