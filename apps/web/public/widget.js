(function(){"use strict";(async function(){const S=document.currentScript||document.querySelector('script[src*="widget.js"]');if(!S){console.error("Agentix Widget: Unable to locate the widget script tag.");return}const u=S.getAttribute("data-agent-id"),B=S.getAttribute("data-api-url"),$=window.AgentixWidgetConfig&&window.AgentixWidgetConfig.apiUrl,A=B||$||"http://localhost:3001/api/chat",_=`${A}/message`;if(!u){console.error("Agentix Widget: Missing data-agent-id attribute on script tag.");return}const T=`agentix_session_${u}`;let y=sessionStorage.getItem(T);y||(y="sess_"+Math.random().toString(36).substring(2,15),sessionStorage.setItem(T,y));const w=`agentix_history_${u}`;let o=[];try{const e=sessionStorage.getItem(w);e&&(o=JSON.parse(e))}catch{o=[]}const l=(e,t)=>{o.push({sender:e,text:t,timestamp:Date.now()}),o.length>100&&(o=o.slice(-100));try{sessionStorage.setItem(w,JSON.stringify(o))}catch{o=o.slice(-50),sessionStorage.setItem(w,JSON.stringify(o))}},j=()=>{o=[],sessionStorage.removeItem(w)};let v="AI Assistant",p="#4F46E5";try{const e=await fetch(`${A}/${u}`);if(e.ok){const t=await e.json();t.name&&(v=t.name),t.colorHex&&(p=t.colorHex)}}catch{console.warn("Agentix Widget: Could not fetch agent config, using defaults.")}const H=(e=>{const t=document.createElement("div");return t.textContent=e,t.innerHTML})(v),s=document.createElement("div");s.id="agentix-chat-widget-container",s.style.position="fixed",s.style.bottom="20px",s.style.right="20px",s.style.zIndex="999999",document.body.appendChild(s);const c=s.attachShadow({mode:"open"}),L=document.createElement("style");L.textContent=`
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    
    .chat-button {
      width: 60px; height: 60px; border-radius: 50%;
      background-color: ${p}; color: white;
      border: none; cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex; justify-content: center; align-items: center;
      transition: transform 0.2s ease; position: relative;
    }
    .chat-button:hover { transform: scale(1.05); }
    .chat-button svg { width: 28px; height: 28px; fill: currentColor; }
    
    .chat-button .unread-badge {
      position: absolute; top: -4px; right: -4px;
      width: 20px; height: 20px; border-radius: 50%;
      background: #EF4444; color: white; font-size: 11px; font-weight: bold;
      display: flex; align-items: center; justify-content: center;
      display: none;
    }
    .chat-button .unread-badge.visible { display: flex; }

    .chat-window {
      position: absolute; bottom: 80px; right: 0;
      width: 350px; height: 520px; max-height: 80vh;
      background: white; border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      display: flex; flex-direction: column; overflow: hidden;
      opacity: 0; pointer-events: none; transform: translateY(20px);
      transition: all 0.3s ease; border: 1px solid #e5e7eb;
    }
    .chat-window.open {
      opacity: 1; pointer-events: auto; transform: translateY(0);
    }

    .chat-header {
      background-color: ${p}; color: white; padding: 12px 16px;
      display: flex; justify-content: space-between; align-items: center;
      flex-shrink: 0;
    }
    .chat-header h3 { margin: 0; font-size: 15px; font-weight: 600; }
    .chat-header-actions { display: flex; align-items: center; gap: 8px; }
    .close-btn, .clear-btn { 
      background: none; border: none; color: white; cursor: pointer; 
      font-size: 18px; opacity: 0.7; padding: 2px 6px; border-radius: 4px;
      transition: opacity 0.2s, background 0.2s;
    }
    .close-btn:hover, .clear-btn:hover { opacity: 1; background: rgba(255,255,255,0.15); }
    .clear-btn { font-size: 14px; }

    .chat-messages {
      flex: 1; padding: 16px; overflow-y: auto; background: #f9fafb;
      display: flex; flex-direction: column; gap: 10px;
    }
    .chat-messages::-webkit-scrollbar { width: 5px; }
    .chat-messages::-webkit-scrollbar-track { background: transparent; }
    .chat-messages::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
    
    .message { 
      max-width: 85%; padding: 10px 14px; border-radius: 16px; 
      font-size: 14px; line-height: 1.4; word-wrap: break-word;
      animation: messageIn 0.3s ease;
    }
    @keyframes messageIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .message.user { 
      background: ${p}; color: white; align-self: flex-end; 
      border-bottom-right-radius: 4px; 
    }
    .message.bot { 
      background: white; color: #1f2937; align-self: flex-start; 
      border: 1px solid #e5e7eb; border-bottom-left-radius: 4px; 
    }
    .message.loading { color: #6b7280; font-style: italic; }
    .message.error { 
      background: #FEF2F2; color: #991B1B; align-self: flex-start; 
      border: 1px solid #FECACA; border-bottom-left-radius: 4px;
    }
    
    .chat-typing-indicator {
      display: flex; gap: 4px; padding: 8px 0;
      align-self: flex-start;
    }
    .chat-typing-indicator span {
      width: 7px; height: 7px; border-radius: 50%; background: #9ca3af;
      animation: typing 1.4s infinite;
    }
    .chat-typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
    .chat-typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-6px); opacity: 1; }
    }

    .chat-input-area {
      padding: 12px; border-top: 1px solid #e5e7eb; background: white; 
      display: flex; gap: 8px; flex-shrink: 0;
    }
    .chat-input {
      flex: 1; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 20px;
      font-size: 14px; outline: none; transition: border-color 0.2s;
    }
    .chat-input:focus { border-color: ${p}; }
    .chat-input:disabled { background: #f3f4f6; }
    .send-btn {
      background: ${p}; color: white; border: none; border-radius: 50%;
      width: 40px; height: 40px; cursor: pointer; display: flex; 
      justify-content: center; align-items: center; flex-shrink: 0;
      transition: opacity 0.2s;
    }
    .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `,c.appendChild(L);const r=document.createElement("div");r.className="chat-window",r.id="chat-window";const C=document.createElement("div");C.className="chat-header";const z=document.createElement("h3");z.textContent=H;const E=document.createElement("div");E.className="chat-header-actions";const b=document.createElement("button");b.className="clear-btn",b.title="Clear chat history",b.innerHTML="&#8635;";const f=document.createElement("button");f.className="close-btn",f.id="close-btn",f.textContent="×",E.appendChild(b),E.appendChild(f),C.appendChild(z),C.appendChild(E),r.appendChild(C);const n=document.createElement("div");if(n.className="chat-messages",n.id="chat-messages",o.length===0){const e=document.createElement("div");e.className="message bot",e.textContent=`Hello! I'm ${H}. How can I help you today?`,n.appendChild(e),l("bot",`Hello! I'm ${v}. How can I help you today?`)}else o.forEach(function(e){const t=document.createElement("div");t.className="message "+e.sender,t.textContent=e.text,n.appendChild(t)});r.appendChild(n);const g=document.createElement("form");g.className="chat-input-area",g.id="chat-form";const i=document.createElement("input");i.type="text",i.className="chat-input",i.id="chat-input",i.placeholder="Type your message...",i.autocomplete="off";const d=document.createElement("button");d.type="submit",d.className="send-btn",d.id="send-btn",d.innerHTML="&#10148;",g.appendChild(i),g.appendChild(d),r.appendChild(g);const h=document.createElement("button");h.className="chat-button",h.id="chat-button",h.innerHTML='<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';const m=document.createElement("span");m.className="unread-badge",h.appendChild(m),c.appendChild(r),c.appendChild(h);let k=!1;const M=function(){k=!k,k?(r.classList.add("open"),m.classList.remove("visible"),i.focus()):r.classList.remove("open")};h.addEventListener("click",M),f.addEventListener("click",M),b.addEventListener("click",function(){const e=c.getElementById("clear-confirm");e&&e.remove();const t=document.createElement("div");t.id="clear-confirm",t.style.cssText=`
    position: absolute; top: 50px; left: 16px; right: 16px;
    background: white; border: 1px solid #e5e7eb; border-radius: 12px;
    padding: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    z-index: 10; text-align: center;
  `,t.innerHTML=`
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #374151; font-weight: 500;">Clear all chat history?</p>
    <div style="display: flex; gap: 8px; justify-content: center;">
      <button id="confirm-clear-yes" style="
        padding: 8px 20px; background: #EF4444; color: white; border: none;
        border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500;
      ">Clear</button>
      <button id="confirm-clear-no" style="
        padding: 8px 20px; background: #f3f4f6; color: #374151; border: none;
        border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500;
      ">Cancel</button>
    </div>
  `;const a=c.getElementById("chat-window");a.style.position="relative",a.appendChild(t),c.getElementById("confirm-clear-yes").addEventListener("click",function(){n.innerHTML="",j();const x=document.createElement("div");x.className="message bot",x.textContent=`Hello! I'm ${H}. How can I help you today?`,n.appendChild(x),l("bot",`Hello! I'm ${v}. How can I help you today?`),t.remove()}),c.getElementById("confirm-clear-no").addEventListener("click",function(){t.remove()})});const I=function(e,t){const a=document.createElement("div");return a.className="message "+t,a.textContent=e,n.appendChild(a),n.scrollTop=n.scrollHeight,a},O=function(){const e=document.createElement("div");e.className="chat-typing-indicator",e.id="typing-indicator";for(var t=0;t<3;t++){var a=document.createElement("span");e.appendChild(a)}return n.appendChild(e),n.scrollTop=n.scrollHeight,e};g.addEventListener("submit",async function(e){e.preventDefault();var t=i.value.trim();if(t){I(t,"user"),l("user",t),i.value="",d.disabled=!0,i.disabled=!0;var a=O();try{var x=await fetch(_,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({agentId:u,message:t,sessionId:y})}),N=await x.json();if(a.remove(),N.reply){if(I(N.reply,"bot"),l("bot",N.reply),!k){var Y=parseInt(m.textContent||"0");m.textContent=Y+1,m.classList.add("visible")}}else{var P=I("Sorry, I encountered an error. Please try again.","bot error");l("bot","Sorry, I encountered an error. Please try again.")}}catch(F){console.error("Widget Error:",F),a.remove(),I("Could not connect to the server. Please try again.","bot error"),l("bot","Could not connect to the server. Please try again.")}finally{d.disabled=!1,i.disabled=!1,i.focus()}}}),o.length>0&&(n.scrollTop=n.scrollHeight)})()})();
