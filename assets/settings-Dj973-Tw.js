import{t as e}from"./db-C1dp_ztn.js";import{c as t,l as n,m as r,n as i,p as a,r as o}from"./index-CC1fCRH2.js";async function s(s){let c=a();s.innerHTML=`
    <div class="min-h-full">
      <header class="px-5 pt-6 pb-3 flex items-center gap-3">
        <a href="#/home" class="text-gray-500">←</a>
        <h1 class="text-2xl font-serif">设置</h1>
      </header>
      <main class="px-5 flex flex-col gap-4">
        <label class="flex justify-between items-center">
          <span>每日新词数</span>
          <input id="daily" type="number" min="0" max="100" value="${c.daily_new_target}" class="w-20 rounded bg-gray-100 px-2 py-1 text-right">
        </label>
        <label class="flex justify-between items-center">
          <span>单次卡片数</span>
          <input id="size" type="number" min="1" max="100" value="${c.session_size}" class="w-20 rounded bg-gray-100 px-2 py-1 text-right">
        </label>
        <label class="flex justify-between items-center">
          <span>语音</span>
          <input id="voice" type="checkbox" ${c.voice_enabled?`checked`:``}>
        </label>
        <label class="flex justify-between items-center">
          <span>语速 ${c.voice_rate.toFixed(1)}</span>
          <input id="rate" type="range" min="0.5" max="1.3" step="0.1" value="${c.voice_rate}">
        </label>

        <hr class="my-3">

        <h3 class="text-sm font-semibold">Qwen-VL-Max（推荐 · 视觉直解）</h3>
        <label class="text-sm">
          <span class="text-gray-500">DashScope API key（仅存本机 localStorage，导出 JSON 不含）</span>
          <input id="qkey" type="password" class="w-full mt-1 rounded-lg bg-gray-100 px-3 py-2 font-mono text-xs" placeholder="sk-..." value="${o()}">
        </label>
        <div class="flex gap-2 items-center">
          <button id="qkey-save" class="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-medium">保存 key</button>
          <button id="qkey-clear" class="rounded-xl bg-gray-100 text-gray-600 px-3 py-2 text-sm">清除</button>
          <span id="qkey-status" class="text-sm text-gray-500"></span>
        </div>
        <p class="text-xs text-gray-400">拿 key: <a href="https://bailian.console.aliyun.com/?apiKey=1" target="_blank" class="text-blue-600 underline">bailian.console.aliyun.com</a> · 当前: ${o()?`<span class="text-green-700">已配置</span>`:`<span class="text-gray-400">未配置</span>`}</p>

        <hr class="my-3">

        <h3 class="text-sm font-semibold">DeepSeek API（备用 · OCR→文本解析路径）</h3>
        <label class="text-sm">
          <span class="text-gray-500">API key（仅存本机 localStorage，导出 JSON 不含）</span>
          <input id="dkey" type="password" class="w-full mt-1 rounded-lg bg-gray-100 px-3 py-2 font-mono text-xs" placeholder="sk-..." value="${i()}">
        </label>
        <div class="flex gap-2 items-center">
          <button id="dkey-save" class="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-medium">保存 key</button>
          <button id="dkey-clear" class="rounded-xl bg-gray-100 text-gray-600 px-3 py-2 text-sm">清除</button>
          <span id="dkey-status" class="text-sm text-gray-500"></span>
        </div>
        <p class="text-xs text-gray-400">拿 key: <a href="https://platform.deepseek.com/api_keys" target="_blank" class="text-blue-600 underline">platform.deepseek.com/api_keys</a> · 当前: ${i()?`<span class="text-green-700">已配置</span>`:`<span class="text-gray-400">未配置</span>`}</p>

        <hr class="my-3">

        <h3 class="text-sm font-semibold">数据</h3>
        <button id="export" class="rounded-xl bg-gray-100 py-2">导出 JSON</button>
        <input id="importFile" type="file" accept="application/json" class="hidden">
        <button id="import" class="rounded-xl bg-gray-100 py-2">导入 JSON</button>
        <button id="reset" class="rounded-xl bg-red-100 py-2 text-red-700">清空数据库（危险）</button>
        <p id="msg" class="text-sm text-gray-500"></p>
      </main>
    </div>
  `;let l=s.querySelector(`#msg`),u=async()=>{await r({daily_new_target:Number(s.querySelector(`#daily`).value),session_size:Number(s.querySelector(`#size`).value),voice_enabled:s.querySelector(`#voice`).checked,voice_rate:Number(s.querySelector(`#rate`).value)}),l.textContent=`已保存`,setTimeout(()=>l.textContent=``,1500)};s.querySelectorAll(`input`).forEach(e=>{e.id===`qkey`||e.id===`dkey`||e.addEventListener(`change`,u)});let d=(e,t,n,r,i)=>{let a=s.querySelector(`#${e}`),o=s.querySelector(`#${r}`),c=(e,t=!0)=>{o.textContent=e,o.className=`text-sm ${t?`text-green-700`:`text-red-600`}`,setTimeout(()=>o.textContent=``,3e3)};s.querySelector(`#${t}`).addEventListener(`click`,()=>{let e=a.value.trim();if(!e){c(`未输入 key`,!1);return}i(e),c(`✓ 已保存（${e.slice(0,8)}…）`)}),s.querySelector(`#${n}`).addEventListener(`click`,()=>{i(``),a.value=``,c(`已清除`)})};d(`qkey`,`qkey-save`,`qkey-clear`,`qkey-status`,n),d(`dkey`,`dkey-save`,`dkey-clear`,`dkey-status`,t),s.querySelector(`#export`).addEventListener(`click`,async()=>{let t={words:await e.words.toArray(),review_state:await e.review_state.toArray(),review_log:await e.review_log.toArray(),settings:await e.settings.toArray(),exported_at:Date.now()},n=new Blob([JSON.stringify(t,null,2)],{type:`application/json`}),r=document.createElement(`a`);r.href=URL.createObjectURL(n),r.download=`german-b2-backup-${new Date().toISOString().slice(0,10)}.json`,r.click(),URL.revokeObjectURL(r.href)});let f=s.querySelector(`#importFile`);s.querySelector(`#import`).addEventListener(`click`,()=>f.click()),f.addEventListener(`change`,async()=>{let t=f.files?.[0];if(!t)return;let n=await t.text(),r=JSON.parse(n);await e.transaction(`rw`,e.words,e.review_state,e.review_log,e.settings,async()=>{await e.words.clear(),await e.review_state.clear(),await e.review_log.clear(),await e.settings.clear(),await e.words.bulkAdd(r.words??[]),await e.review_state.bulkAdd(r.review_state??[]),await e.review_log.bulkAdd(r.review_log??[]),await e.settings.bulkAdd(r.settings??[])}),l.textContent=`导入完成，刷新页面`}),s.querySelector(`#reset`).addEventListener(`click`,async()=>{confirm(`确认清空所有数据？`)&&(await e.delete(),location.reload())})}export{s as renderSettings};