import{n as e,t}from"./db-C1dp_ztn.js";import{f as n}from"./index-CC1fCRH2.js";var r=1440*60*1e3;function i(e){return Math.floor(e/r)}function a(e,t){if(e.length===0)return 0;let n=new Set(e.map(i)),r=i(t),a=0,o=r;for(n.has(o)||(o=r-1);n.has(o);)a+=1,--o;return a}function o(r){r.innerHTML=`
    <div class="min-h-full flex flex-col">
      <header class="px-5 pt-8 pb-4">
        <h1 class="text-3xl font-serif font-semibold">Deutsch B2</h1>
        <p class="text-sm text-gray-500" id="subtitle">…</p>
      </header>
      <main class="px-5 flex-1 flex flex-col gap-4">
        <div class="grid grid-cols-3 gap-3">
          <div class="rounded-2xl bg-gray-100 p-4 text-center">
            <div class="text-3xl font-semibold" id="due">–</div>
            <div class="text-xs text-gray-500 mt-1">今日待复习</div>
          </div>
          <div class="rounded-2xl bg-gray-100 p-4 text-center">
            <div class="text-3xl font-semibold" id="newcount">–</div>
            <div class="text-xs text-gray-500 mt-1">未学新词</div>
          </div>
          <div class="rounded-2xl bg-gray-100 p-4 text-center">
            <div class="text-3xl font-semibold" id="streak">–</div>
            <div class="text-xs text-gray-500 mt-1">连续天数</div>
          </div>
        </div>
        <button id="start" class="mt-4 rounded-2xl bg-gray-900 text-white py-5 text-lg font-medium">
          开始今日学习
        </button>
        <p class="text-xs text-gray-400 text-center -mt-2" id="hint"></p>
        <nav class="mt-auto py-4 flex justify-around text-sm text-gray-600">
          <a href="#/library">📚 词库</a>
          <a href="#/settings">⚙️ 设置</a>
        </nav>
      </main>
    </div>
  `,(async()=>{let n=Date.now(),i=await e(n),o=await t.review_state.toArray(),s=new Set(o.map(e=>e.word_id)),c=await t.words.toCollection().primaryKeys(),l=c.filter(e=>!s.has(e)).length,u=i.filter(e=>s.has(e)).length,d=a((await t.review_log.toArray()).map(e=>e.timestamp),n);r.querySelector(`#due`).textContent=String(u),r.querySelector(`#newcount`).textContent=String(l),r.querySelector(`#streak`).textContent=String(d);let f=r.querySelector(`#subtitle`),p=r.querySelector(`#hint`),m=r.querySelector(`#start`);i.length>0?(f.textContent=`${i.length} 张卡待学`,p.textContent=``):c.length>0?(f.textContent=`今日已完成 · 词库 ${c.length} 词`,m.textContent=`开始加练`,p.textContent=`今日待复习已清空，加练即将到期的单词`):(f.textContent=`词库还是空的`,m.disabled=!0,m.classList.add(`opacity-50`),p.textContent=`去词库添加单词`)})();let i=()=>n(`#/session`);return r.querySelector(`#start`).addEventListener(`click`,i),()=>r.querySelector(`#start`)?.removeEventListener(`click`,i)}export{o as renderHome};