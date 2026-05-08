// File: apps/widget/src/widget.js
(async function () {
  // 1. EXTRACT CONFIGURATION
  const currentScript =
    document.currentScript ||
    document.querySelector('script[src*="widget.js"]');

  if (!currentScript) {
    console.error("Agentix Widget: Unable to locate the widget script tag.");
    return;
  }

  const agentId = currentScript.getAttribute("data-agent-id");
  const scriptApiUrl = currentScript.getAttribute("data-api-url");
  const runtimeApiUrl =
    window.AgentixWidgetConfig && window.AgentixWidgetConfig.apiUrl;

  const BASE_API_URL =
    scriptApiUrl || runtimeApiUrl || "https://api.ilogicmagic.com/api/chat";
  const POST_MESSAGE_URL = `${BASE_API_URL}/message`;

  if (!agentId) {
    console.error(
      "Agentix Widget: Missing data-agent-id attribute on script tag.",
    );
    return;
  }

  // Generate or retrieve a persistent session ID
  const STORAGE_KEY = `agentix_session_${agentId}`;
  let sessionId = sessionStorage.getItem(STORAGE_KEY);
  if (!sessionId) {
    sessionId = "sess_" + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem(STORAGE_KEY, sessionId);
  }

  // Load chat history from session storage
  const HISTORY_KEY = `agentix_history_${agentId}`;
  let chatHistory = [];
  try {
    const stored = sessionStorage.getItem(HISTORY_KEY);
    if (stored) {
      chatHistory = JSON.parse(stored);
    }
  } catch (e) {
    chatHistory = [];
  }

  const saveHistory = (sender, text) => {
    chatHistory.push({ sender, text, timestamp: Date.now() });
    // Keep only last 100 messages to avoid storage limits
    if (chatHistory.length > 100) {
      chatHistory = chatHistory.slice(-100);
    }
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(chatHistory));
    } catch (e) {
      // Storage full — remove oldest messages
      chatHistory = chatHistory.slice(-50);
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(chatHistory));
    }
  };

  const clearHistory = () => {
    chatHistory = [];
    sessionStorage.removeItem(HISTORY_KEY);
  };

  // Fetch Agent Configuration (Name & Color)
  let agentName = "AI Assistant";
  let primaryColor = "#4F46E5";
  try {
    const configRes = await fetch(`${BASE_API_URL}/${agentId}`);
    if (configRes.ok) {
      const config = await configRes.json();
      if (config.name) agentName = config.name;
      if (config.colorHex) primaryColor = config.colorHex;
    }
  } catch (err) {
    console.warn(
      "Agentix Widget: Could not fetch agent config, using defaults.",
    );
  }

  // Sanitize agent name to prevent XSS
  const sanitizeText = (text) => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  };
  const safeAgentName = sanitizeText(agentName);

  // 2. CREATE THE SHADOW DOM CONTAINER
  const container = document.createElement("div");
  container.id = "agentix-chat-widget-container";
  container.style.position = "fixed";
  container.style.bottom = "20px";
  container.style.right = "20px";
  container.style.zIndex = "999999";
  document.body.appendChild(container);

  const shadow = container.attachShadow({ mode: "open" });

  // 3. INJECT ISOLATED STYLES
  const style = document.createElement("style");
  style.textContent = `
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    
    .chat-button {
      width: 60px; height: 60px; border-radius: 50%;
      background-color: ${primaryColor}; color: white;
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
      background-color: ${primaryColor}; color: white; padding: 12px 16px;
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
      background: ${primaryColor}; color: white; align-self: flex-end; 
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
    .chat-input:focus { border-color: ${primaryColor}; }
    .chat-input:disabled { background: #f3f4f6; }
    .send-btn {
      background: ${primaryColor}; color: white; border: none; border-radius: 50%;
      width: 40px; height: 40px; cursor: pointer; display: flex; 
      justify-content: center; align-items: center; flex-shrink: 0;
      transition: opacity 0.2s;
    }
    .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `;
  shadow.appendChild(style);

  // 4. BUILD THE HTML STRUCTURE (DOM-safe)
  const chatWindow = document.createElement("div");
  chatWindow.className = "chat-window";
  chatWindow.id = "chat-window";

  // Header
  const header = document.createElement("div");
  header.className = "chat-header";
  const headerTitle = document.createElement("h3");
  headerTitle.textContent = safeAgentName;
  const headerActions = document.createElement("div");
  headerActions.className = "chat-header-actions";

  const clearBtn = document.createElement("button");
  clearBtn.className = "clear-btn";
  clearBtn.title = "Clear chat history";
  clearBtn.innerHTML = "&#8635;";

  const closeBtn = document.createElement("button");
  closeBtn.className = "close-btn";
  closeBtn.id = "close-btn";
  closeBtn.textContent = "\u00D7";

  headerActions.appendChild(clearBtn);
  headerActions.appendChild(closeBtn);
  header.appendChild(headerTitle);
  header.appendChild(headerActions);
  chatWindow.appendChild(header);

  // Messages area
  const messagesArea = document.createElement("div");
  messagesArea.className = "chat-messages";
  messagesArea.id = "chat-messages";

  // Restore chat history
  if (chatHistory.length === 0) {
    const welcomeMsg = document.createElement("div");
    welcomeMsg.className = "message bot";
    welcomeMsg.textContent = `Hello! I'm ${safeAgentName}. How can I help you today?`;
    messagesArea.appendChild(welcomeMsg);
    saveHistory("bot", `Hello! I'm ${agentName}. How can I help you today?`);
  } else {
    chatHistory.forEach(function (msg) {
      const msgDiv = document.createElement("div");
      msgDiv.className = "message " + msg.sender;
      msgDiv.textContent = msg.text;
      messagesArea.appendChild(msgDiv);
    });
  }
  chatWindow.appendChild(messagesArea);

  // Input area
  const form = document.createElement("form");
  form.className = "chat-input-area";
  form.id = "chat-form";
  const input = document.createElement("input");
  input.type = "text";
  input.className = "chat-input";
  input.id = "chat-input";
  input.placeholder = "Type your message...";
  input.autocomplete = "off";
  const sendBtn = document.createElement("button");
  sendBtn.type = "submit";
  sendBtn.className = "send-btn";
  sendBtn.id = "send-btn";
  sendBtn.innerHTML = "&#10148;";
  form.appendChild(input);
  form.appendChild(sendBtn);
  chatWindow.appendChild(form);

  // Floating button with unread badge
  const chatButton = document.createElement("button");
  chatButton.className = "chat-button";
  chatButton.id = "chat-button";
  chatButton.innerHTML =
    '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';
  const unreadBadge = document.createElement("span");
  unreadBadge.className = "unread-badge";
  chatButton.appendChild(unreadBadge);

  shadow.appendChild(chatWindow);
  shadow.appendChild(chatButton);

  // 5. EVENT LISTENERS
  let isOpen = false;
  const toggleChat = function () {
    isOpen = !isOpen;
    if (isOpen) {
      chatWindow.classList.add("open");
      unreadBadge.classList.remove("visible");
      input.focus();
    } else {
      chatWindow.classList.remove("open");
    }
  };

  chatButton.addEventListener("click", toggleChat);
  closeBtn.addEventListener("click", toggleChat);

  // Clear history
  clearBtn.addEventListener("click", function () {
    // Remove any existing confirmation
    const existingConfirm = shadow.getElementById("clear-confirm");
    if (existingConfirm) existingConfirm.remove();

    // Create inline confirmation dialog
    const confirmDiv = document.createElement("div");
    confirmDiv.id = "clear-confirm";
    confirmDiv.style.cssText = `
    position: absolute; top: 50px; left: 16px; right: 16px;
    background: white; border: 1px solid #e5e7eb; border-radius: 12px;
    padding: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    z-index: 10; text-align: center;
  `;
    confirmDiv.innerHTML = `
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
  `;

    const chatWindowEl = shadow.getElementById("chat-window");
    chatWindowEl.style.position = "relative";
    chatWindowEl.appendChild(confirmDiv);

    shadow
      .getElementById("confirm-clear-yes")
      .addEventListener("click", function () {
        messagesArea.innerHTML = "";
        clearHistory();
        const welcomeMsg = document.createElement("div");
        welcomeMsg.className = "message bot";
        welcomeMsg.textContent = `Hello! I'm ${safeAgentName}. How can I help you today?`;
        messagesArea.appendChild(welcomeMsg);
        saveHistory(
          "bot",
          `Hello! I'm ${agentName}. How can I help you today?`,
        );
        confirmDiv.remove();
      });

    shadow
      .getElementById("confirm-clear-no")
      .addEventListener("click", function () {
        confirmDiv.remove();
      });
  });

  const appendMessage = function (text, sender) {
    const msgDiv = document.createElement("div");
    msgDiv.className = "message " + sender;
    msgDiv.textContent = text;
    messagesArea.appendChild(msgDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight;
    return msgDiv;
  };

  const showTypingIndicator = function () {
    const indicator = document.createElement("div");
    indicator.className = "chat-typing-indicator";
    indicator.id = "typing-indicator";
    for (var i = 0; i < 3; i++) {
      var dot = document.createElement("span");
      indicator.appendChild(dot);
    }
    messagesArea.appendChild(indicator);
    messagesArea.scrollTop = messagesArea.scrollHeight;
    return indicator;
  };

  // 6. HANDLE FORM SUBMISSION
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var message = input.value.trim();
    if (!message) return;

    appendMessage(message, "user");
    saveHistory("user", message);
    input.value = "";
    sendBtn.disabled = true;
    input.disabled = true;

    var typingIndicator = showTypingIndicator();

    try {
      var response = await fetch(POST_MESSAGE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: agentId,
          message: message,
          sessionId: sessionId,
        }),
      });

      var data = await response.json();
      typingIndicator.remove();

      if (data.reply) {
        appendMessage(data.reply, "bot");
        saveHistory("bot", data.reply);

        // Show unread badge if chat is closed
        if (!isOpen) {
          var count = parseInt(unreadBadge.textContent || "0");
          unreadBadge.textContent = count + 1;
          unreadBadge.classList.add("visible");
        }
      } else {
        var errorMsg = appendMessage(
          "Sorry, I encountered an error. Please try again.",
          "bot error",
        );
        saveHistory("bot", "Sorry, I encountered an error. Please try again.");
      }
    } catch (error) {
      console.error("Widget Error:", error);
      typingIndicator.remove();
      appendMessage(
        "Could not connect to the server. Please try again.",
        "bot error",
      );
      saveHistory("bot", "Could not connect to the server. Please try again.");
    } finally {
      sendBtn.disabled = false;
      input.disabled = false;
      input.focus();
    }
  });

  // Auto-scroll to bottom on load if there's history
  if (chatHistory.length > 0) {
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }
})();
