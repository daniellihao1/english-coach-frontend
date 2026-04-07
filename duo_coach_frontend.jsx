// DUO Coach Frontend v1.0
// 支持：语音对话、文本交互、数学/代码教学、可配置 LLM
// 技术：React + KaTeX (数学) + highlight.js (代码) + Web Speech API (语音)

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── 样式 ──────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:        #080d1a;
  --bg2:       #0d1526;
  --bg3:       #111d33;
  --bg4:       #16233d;
  --border:    rgba(0,212,255,0.12);
  --border2:   rgba(0,212,255,0.22);
  --cyan:      #00d4ff;
  --cyan2:     #00a8cc;
  --amber:     #ffb347;
  --amber2:    #e8962e;
  --green:     #4ade80;
  --red:       #f87171;
  --text:      #e2eaf8;
  --text2:     #8ba3c7;
  --text3:     #4d6690;
  --mono:      'JetBrains Mono', monospace;
  --sans:      'Outfit', sans-serif;
  --radius:    10px;
  --shadow:    0 4px 24px rgba(0,0,0,0.5);
}

html, body, #root { height: 100%; background: var(--bg); color: var(--text); font-family: var(--sans); }

/* ── Layout ── */
.app { display: grid; grid-template-columns: 260px 1fr 280px; height: 100vh; overflow: hidden; }
@media (max-width: 1100px) { .app { grid-template-columns: 220px 1fr; } .right-panel { display: none; } }
@media (max-width: 720px)  { .app { grid-template-columns: 1fr; } .left-panel { display: none; } }

/* ── Panels ── */
.left-panel, .right-panel {
  background: var(--bg2); border: 1px solid var(--border);
  overflow-y: auto; display: flex; flex-direction: column;
}
.left-panel  { border-right: 1px solid var(--border); }
.right-panel { border-left: 1px solid var(--border); }

.panel-hdr {
  padding: 16px; border-bottom: 1px solid var(--border);
  font-size: 10px; font-weight: 600; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--text3); display: flex;
  align-items: center; gap: 8px;
}
.panel-hdr .dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--cyan);
  box-shadow: 0 0 8px var(--cyan);
}

/* ── Main chat area ── */
.main { display: flex; flex-direction: column; overflow: hidden; }

.topbar {
  padding: 14px 20px; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; gap: 12px; background: var(--bg2);
  flex-shrink: 0;
}
.topbar-title { font-size: 14px; font-weight: 600; color: var(--text); flex: 1; }
.topbar-sub { font-size: 11px; color: var(--text3); font-family: var(--mono); }
.icon-btn {
  background: transparent; border: 1px solid var(--border2); color: var(--text2);
  border-radius: 7px; padding: 7px 10px; cursor: pointer; font-size: 13px;
  transition: all 0.15s; display: flex; align-items: center; gap: 6px;
}
.icon-btn:hover { border-color: var(--cyan); color: var(--cyan); background: rgba(0,212,255,0.06); }
.icon-btn.active { border-color: var(--cyan); color: var(--cyan); background: rgba(0,212,255,0.1); }

/* ── Chat messages ── */
.chat-area { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.chat-area::-webkit-scrollbar { width: 4px; }
.chat-area::-webkit-scrollbar-track { background: transparent; }
.chat-area::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

.msg { display: flex; gap: 12px; max-width: 800px; animation: fadeUp 0.25s ease; }
.msg.user { align-self: flex-end; flex-direction: row-reverse; }
.msg.system { align-self: center; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

.msg-avatar {
  width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 14px;
  font-weight: 600;
}
.msg.assistant .msg-avatar { background: rgba(0,212,255,0.12); color: var(--cyan); border: 1px solid var(--border2); }
.msg.user .msg-avatar { background: rgba(255,179,71,0.15); color: var(--amber); border: 1px solid rgba(255,179,71,0.3); }

.msg-bubble {
  padding: 12px 16px; border-radius: var(--radius); font-size: 14px;
  line-height: 1.65; max-width: calc(100% - 48px);
}
.msg.assistant .msg-bubble { background: var(--bg3); border: 1px solid var(--border); }
.msg.user .msg-bubble { background: rgba(255,179,71,0.1); border: 1px solid rgba(255,179,71,0.2); color: var(--text); }
.msg.system .msg-bubble {
  background: rgba(0,212,255,0.05); border: 1px dashed var(--border2);
  color: var(--text2); font-size: 12px; text-align: center;
  font-family: var(--mono); padding: 8px 16px; border-radius: 6px;
}

/* ── Code blocks ── */
.msg-bubble pre {
  background: var(--bg); border: 1px solid var(--border2); border-radius: 7px;
  padding: 12px 14px; margin: 8px 0; overflow-x: auto; font-size: 12px;
  font-family: var(--mono); line-height: 1.5;
}
.msg-bubble code { font-family: var(--mono); font-size: 12px; }
.msg-bubble p { margin-bottom: 6px; }
.msg-bubble p:last-child { margin-bottom: 0; }
.msg-bubble ul, .msg-bubble ol { padding-left: 18px; margin: 6px 0; }

/* ── Math ── */
.katex-display { overflow-x: auto; margin: 8px 0; }
.math-inline .katex { font-size: 1em; }

/* ── Input area ── */
.input-area {
  padding: 16px 20px; border-top: 1px solid var(--border);
  background: var(--bg2); flex-shrink: 0;
}
.ttat-bar {
  display: flex; gap: 6px; margin-bottom: 12px;
}
.ttat-step {
  flex: 1; padding: 5px 4px; border-radius: 5px; font-size: 10px; font-weight: 600;
  letter-spacing: 0.06em; text-align: center; border: 1px solid var(--border);
  color: var(--text3); transition: all 0.2s;
}
.ttat-step.active { border-color: var(--cyan); color: var(--cyan); background: rgba(0,212,255,0.08); }
.ttat-step.done   { border-color: var(--green); color: var(--green); background: rgba(74,222,128,0.07); }

.input-row { display: flex; gap: 10px; align-items: flex-end; }
.chat-input {
  flex: 1; background: var(--bg3); border: 1px solid var(--border2);
  border-radius: 10px; padding: 12px 14px; color: var(--text); font-size: 14px;
  font-family: var(--sans); resize: none; min-height: 44px; max-height: 140px;
  overflow-y: auto; outline: none; transition: border-color 0.15s;
}
.chat-input:focus { border-color: var(--cyan); }
.chat-input::placeholder { color: var(--text3); }

.send-btn {
  background: var(--cyan); color: var(--bg); border: none; border-radius: 10px;
  width: 44px; height: 44px; cursor: pointer; font-size: 18px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; font-weight: 700;
}
.send-btn:hover { background: var(--cyan2); transform: scale(1.04); }
.send-btn:disabled { background: var(--bg4); color: var(--text3); cursor: not-allowed; transform: none; }

/* ── Voice button ── */
.voice-btn {
  width: 44px; height: 44px; border-radius: 10px; border: 1px solid var(--border2);
  background: var(--bg3); cursor: pointer; display: flex; align-items: center;
  justify-content: center; font-size: 18px; color: var(--text2);
  transition: all 0.15s; flex-shrink: 0;
}
.voice-btn:hover { border-color: var(--amber); color: var(--amber); }
.voice-btn.recording {
  border-color: var(--red); color: var(--red); background: rgba(248,113,113,0.1);
  animation: pulse 1s infinite;
}
@keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(248,113,113,0.4); } 50% { box-shadow: 0 0 0 8px rgba(248,113,113,0); } }

/* ── Voice waveform ── */
.waveform {
  height: 40px; display: flex; align-items: center; justify-content: center;
  gap: 3px; margin-bottom: 10px;
}
.wave-bar {
  width: 3px; border-radius: 2px; background: var(--red);
  animation: wave 0.8s ease-in-out infinite;
}
@keyframes wave { 0%,100% { height: 6px; opacity: 0.4; } 50% { height: 28px; opacity: 1; } }

/* ── Sidebar items ── */
.sidebar-section { padding: 12px; border-bottom: 1px solid var(--border); }
.sidebar-section:last-child { border-bottom: none; }
.sidebar-label { font-size: 10px; color: var(--text3); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; }

.duo-metric { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.duo-bar { flex: 1; height: 4px; background: var(--bg4); border-radius: 2px; overflow: hidden; }
.duo-fill { height: 100%; border-radius: 2px; transition: width 0.5s ease; }
.duo-fill.d { background: var(--green); }
.duo-fill.u { background: var(--cyan); }
.duo-fill.o { background: var(--amber); }
.duo-val { font-size: 11px; font-family: var(--mono); color: var(--text2); min-width: 32px; text-align: right; }
.duo-name { font-size: 11px; color: var(--text2); min-width: 14px; }

.state-chip {
  display: inline-flex; align-items: center; gap: 5px; padding: 4px 9px;
  border-radius: 5px; font-size: 11px; font-family: var(--mono);
  border: 1px solid var(--border); color: var(--text2); margin: 2px;
}
.state-chip.ok     { border-color: rgba(74,222,128,0.3); color: var(--green); background: rgba(74,222,128,0.06); }
.state-chip.warn   { border-color: rgba(255,179,71,0.3); color: var(--amber); background: rgba(255,179,71,0.06); }
.state-chip.active { border-color: var(--border2); color: var(--cyan); background: rgba(0,212,255,0.06); }

.task-card {
  background: var(--bg3); border: 1px solid var(--border); border-radius: 8px;
  padding: 10px 12px; margin-bottom: 8px;
}
.task-card-title { font-size: 12px; font-weight: 500; margin-bottom: 4px; }
.task-card-sub   { font-size: 10px; color: var(--text3); font-family: var(--mono); }

/* ── Modal / config ── */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 100;
  display: flex; align-items: center; justify-content: center; padding: 20px;
  backdrop-filter: blur(4px);
}
.modal {
  background: var(--bg2); border: 1px solid var(--border2); border-radius: 14px;
  padding: 28px; width: 100%; max-width: 520px; box-shadow: var(--shadow);
  animation: modalIn 0.2s ease;
}
@keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(-10px); } to { opacity: 1; transform: none; } }
.modal-title { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.modal-sub   { font-size: 12px; color: var(--text3); margin-bottom: 24px; }

.field { margin-bottom: 16px; }
.field label { display: block; font-size: 11px; color: var(--text2); margin-bottom: 6px; letter-spacing: 0.05em; }
.field input, .field select {
  width: 100%; background: var(--bg3); border: 1px solid var(--border2);
  border-radius: 8px; padding: 10px 12px; color: var(--text); font-size: 13px;
  font-family: var(--sans); outline: none; transition: border-color 0.15s;
}
.field input:focus, .field select:focus { border-color: var(--cyan); }
.field input::placeholder { color: var(--text3); }
.field select option { background: var(--bg2); }

.tabs { display: flex; gap: 4px; margin-bottom: 20px; background: var(--bg3); padding: 4px; border-radius: 8px; }
.tab {
  flex: 1; padding: 8px; border: none; background: transparent; color: var(--text3);
  font-size: 12px; font-weight: 500; border-radius: 6px; cursor: pointer; font-family: var(--sans);
  transition: all 0.15s;
}
.tab.active { background: var(--bg4); color: var(--cyan); border: 1px solid var(--border2); }

.btn {
  background: var(--cyan); color: var(--bg); border: none; border-radius: 8px;
  padding: 10px 20px; font-size: 13px; font-weight: 600; cursor: pointer;
  font-family: var(--sans); transition: all 0.15s;
}
.btn:hover { background: var(--cyan2); }
.btn.secondary {
  background: transparent; color: var(--text2); border: 1px solid var(--border2);
}
.btn.secondary:hover { border-color: var(--cyan); color: var(--cyan); background: rgba(0,212,255,0.06); }
.btn-row { display: flex; gap: 10px; margin-top: 4px; justify-content: flex-end; }

/* ── Subject mode selector ── */
.subject-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.subject-card {
  background: var(--bg3); border: 1px solid var(--border); border-radius: 8px;
  padding: 10px 6px; text-align: center; cursor: pointer; transition: all 0.15s;
  font-size: 11px; color: var(--text2);
}
.subject-card:hover { border-color: var(--border2); color: var(--text); }
.subject-card.selected { border-color: var(--cyan); color: var(--cyan); background: rgba(0,212,255,0.07); }
.subject-icon { font-size: 20px; margin-bottom: 4px; display: block; }

/* ── Score ring ── */
.score-ring { position: relative; width: 56px; height: 56px; flex-shrink: 0; }
.score-ring svg { transform: rotate(-90deg); }
.score-ring .ring-bg { stroke: var(--bg4); fill: none; stroke-width: 4; }
.score-ring .ring-fg { fill: none; stroke-width: 4; stroke-linecap: round; transition: stroke-dashoffset 0.6s ease; }
.score-center { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; font-family: var(--mono); }

/* ── Loading dots ── */
.typing { display: flex; gap: 4px; padding: 4px 0; }
.typing span {
  width: 6px; height: 6px; border-radius: 50%; background: var(--cyan);
  animation: blink 1.2s infinite;
}
.typing span:nth-child(2) { animation-delay: 0.2s; }
.typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink { 0%,80%,100% { opacity: 0.2; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }

/* ── Status bar ── */
.status-bar {
  height: 28px; background: var(--bg2); border-top: 1px solid var(--border);
  display: flex; align-items: center; padding: 0 16px; gap: 12px;
  font-size: 10px; font-family: var(--mono); color: var(--text3); flex-shrink: 0;
}
.status-dot { width: 5px; height: 5px; border-radius: 50%; }
.status-dot.green { background: var(--green); box-shadow: 0 0 6px var(--green); }
.status-dot.red   { background: var(--red); }
.status-dot.amber { background: var(--amber); }

/* ── Scrollbar global ── */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--bg4); border-radius: 2px; }
`;

// ─── Constants ──────────────────────────────────────────────────────
const BACKEND_DEFAULT = "https://english-coach-agent.onrender.com";
const LLM_PROVIDERS = [
  { id: "openai",    label: "OpenAI",     models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"] },
  { id: "anthropic", label: "Anthropic",  models: ["claude-sonnet-4-6", "claude-haiku-4-5-20251001"] },
  { id: "custom",    label: "Custom / Ollama", models: [] },
];
const SUBJECTS = [
  { id: "english",  label: "英语",   icon: "🗣️" },
  { id: "math",     label: "数学",   icon: "∑" },
  { id: "code",     label: "编程",   icon: "</>" },
  { id: "science",  label: "科学",   icon: "⚗️" },
  { id: "writing",  label: "写作",   icon: "✏️" },
  { id: "custom",   label: "自定义", icon: "★" },
];
const TTAT = ["Task", "Teach", "Assess", "Tune"];

// ─── Simple markdown + math parser ─────────────────────────────────
function parseContent(text) {
  // Extract code blocks first
  const parts = [];
  const codeRe = /```(\w*)\n?([\s\S]*?)```/g;
  let last = 0, m;
  while ((m = codeRe.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: "text", content: text.slice(last, m.index) });
    parts.push({ type: "code", lang: m[1] || "text", content: m[2].trim() });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: "text", content: text.slice(last) });
  return parts;
}

function TextContent({ text }) {
  // Inline formatting: bold, inline-code, math \(...\) and \[...\]
  const html = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, `<code>$1</code>`)
    .replace(/\n/g, "<br/>");
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function MsgContent({ content }) {
  const parts = parseContent(content);
  return (
    <div>
      {parts.map((p, i) =>
        p.type === "code" ? (
          <pre key={i}><code className={`language-${p.lang}`}>{p.content}</code></pre>
        ) : (
          <p key={i} style={{ marginBottom: 0 }}><TextContent text={p.content} /></p>
        )
      )}
    </div>
  );
}

// ─── Score Ring ─────────────────────────────────────────────────────
function ScoreRing({ value = 0, color = "#00d4ff", label }) {
  const r = 22, circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="score-ring">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle className="ring-bg" cx="28" cy="28" r={r} />
        <circle className="ring-fg" cx="28" cy="28" r={r}
          stroke={color} strokeDasharray={circ}
          strokeDashoffset={offset} />
      </svg>
      <div className="score-center" style={{ color }}>{Math.round(value)}</div>
    </div>
  );
}

// ─── Config Modal ───────────────────────────────────────────────────
function ConfigModal({ config, onSave, onClose }) {
  const [cfg, setCfg] = useState(config);
  const [tab, setTab] = useState("backend");
  const provider = LLM_PROVIDERS.find(p => p.id === cfg.llmProvider) || LLM_PROVIDERS[0];

  const update = (k, v) => setCfg(c => ({ ...c, [k]: v }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">⚙ 系统配置</div>
        <div className="modal-sub">配置后端服务地址和 LLM 提供商</div>

        <div className="tabs">
          {["backend", "llm", "subject"].map(t => (
            <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
              {{ backend: "后端服务", llm: "LLM 配置", subject: "学科模式" }[t]}
            </button>
          ))}
        </div>

        {tab === "backend" && <>
          <div className="field">
            <label>后端 API 地址</label>
            <input value={cfg.backendUrl} onChange={e => update("backendUrl", e.target.value)}
              placeholder="https://english-coach-agent.onrender.com" />
          </div>
          <div className="field">
            <label>访问令牌（可选，直接填 Bearer token）</label>
            <input type="password" value={cfg.accessToken || ""}
              onChange={e => update("accessToken", e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIs..." />
          </div>
          <div className="field">
            <label>OAuth 登录（若使用 OAuth 鉴权，点击下方按钮）</label>
            <button className="btn secondary" style={{ width: "100%" }}
              onClick={() => window.open(`${cfg.backendUrl}/auth/oauth/authorize?redirect_uri=${location.origin}`, "_blank")}>
              🔐 OAuth 登录（新标签页）
            </button>
          </div>
        </>}

        {tab === "llm" && <>
          <div className="field">
            <label>LLM 提供商</label>
            <select value={cfg.llmProvider} onChange={e => update("llmProvider", e.target.value)}>
              {LLM_PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>API Key</label>
            <input type="password" value={cfg.llmKey || ""}
              onChange={e => update("llmKey", e.target.value)}
              placeholder={cfg.llmProvider === "anthropic" ? "sk-ant-..." : "sk-..."}/>
          </div>
          {cfg.llmProvider === "custom" ? (
            <>
              <div className="field">
                <label>自定义 API Base URL（OpenAI 兼容）</label>
                <input value={cfg.llmBaseUrl || ""}
                  onChange={e => update("llmBaseUrl", e.target.value)}
                  placeholder="http://localhost:11434/v1" />
              </div>
              <div className="field">
                <label>模型名称</label>
                <input value={cfg.llmModel || ""}
                  onChange={e => update("llmModel", e.target.value)}
                  placeholder="llama3.2 / qwen2.5 / deepseek-r1" />
              </div>
            </>
          ) : (
            <div className="field">
              <label>模型</label>
              <select value={cfg.llmModel || provider.models[0]}
                onChange={e => update("llmModel", e.target.value)}>
                {provider.models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}
          <div className="field">
            <label>Temperature（创造性）</label>
            <input type="range" min="0" max="1" step="0.1"
              value={cfg.temperature ?? 0.7}
              onChange={e => update("temperature", parseFloat(e.target.value))} />
            <span style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)" }}>
              {(cfg.temperature ?? 0.7).toFixed(1)}
            </span>
          </div>
        </>}

        {tab === "subject" && <>
          <div className="sidebar-label">选择学科领域</div>
          <div className="subject-grid">
            {SUBJECTS.map(s => (
              <div key={s.id} className={`subject-card ${cfg.subject === s.id ? "selected" : ""}`}
                onClick={() => update("subject", s.id)}>
                <span className="subject-icon">{s.icon}</span>
                {s.label}
              </div>
            ))}
          </div>
          {cfg.subject === "custom" && (
            <div className="field" style={{ marginTop: 12 }}>
              <label>自定义学科名称</label>
              <input value={cfg.customSubject || ""}
                onChange={e => update("customSubject", e.target.value)}
                placeholder="量子力学 / 古汉语 / 乐理..." />
            </div>
          )}
        </>}

        <div className="btn-row">
          <button className="btn secondary" onClick={onClose}>取消</button>
          <button className="btn" onClick={() => onSave(cfg)}>保存配置</button>
        </div>
      </div>
    </div>
  );
}

// ─── API helper ─────────────────────────────────────────────────────
function makeApi(config) {
  const base = (config.backendUrl || BACKEND_DEFAULT).replace(/\/$/, "");
  const headers = () => {
    const h = { "Content-Type": "application/json" };
    if (config.accessToken) h["Authorization"] = `Bearer ${config.accessToken}`;
    return h;
  };
  const req = async (method, path, body) => {
    const r = await fetch(`${base}${path}`, {
      method, headers: headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return r.json();
  };
  return {
    getTeachingCurrent:     () => req("GET", "/teaching/current"),
    startSession:           () => req("POST", "/sessions/start"),
    endSession:      (id, b) => req("POST", `/sessions/${id}/end`, b),
    getActionPlan:          (domain="english_listening_speaking") =>
                             req("GET", `/domain-learning/action-plan/current?domain=${domain}`),
    submitTrace:     (sid, b) => req("POST", `/domain-learning/execution-trace/submit?session_id=${sid}`, b),
    getLatestEval:          () => req("GET", "/evaluations/latest"),
    getLatestOpt:           () => req("GET", "/optimizations/latest"),
    getDiagnosis:           () => req("GET", "/domain-learning/diagnosis/current"),
  };
}

// ─── LLM caller ─────────────────────────────────────────────────────
async function callLLM(config, messages) {
  const { llmProvider, llmKey, llmModel, llmBaseUrl, temperature } = config;
  const temp = temperature ?? 0.7;

  if (llmProvider === "anthropic") {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": llmKey, "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: llmModel || "claude-sonnet-4-6",
        max_tokens: 1024, temperature: temp,
        messages,
      }),
    });
    const d = await r.json();
    return d.content?.[0]?.text || "";
  }

  // OpenAI / Custom
  const base = llmProvider === "custom"
    ? (llmBaseUrl || "http://localhost:11434/v1")
    : "https://api.openai.com/v1";
  const r = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${llmKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: llmModel || "gpt-4o-mini",
      messages, temperature: temp, max_tokens: 1024,
    }),
  });
  const d = await r.json();
  return d.choices?.[0]?.message?.content || "";
}

// ─── System prompt builder ───────────────────────────────────────────
function buildSystemPrompt(config, actionPlan, subject) {
  const subjectLabel = subject === "custom" ? (config.customSubject || "通用") :
    (SUBJECTS.find(s => s.id === subject)?.label || "英语");

  return `你是 DUO Coach 的教学执行引擎，当前学科：${subjectLabel}。

【后端决策】（严格遵守，不得修改）
${actionPlan ? `
- 执行步骤：${JSON.stringify(actionPlan.action_plan?.execution_plan || [])}
- 教学策略：mode=${actionPlan.action_plan?.selected_strategy_action?.mode || "hybrid"}, support=${actionPlan.action_plan?.selected_strategy_action?.support_level || "medium"}
- 验证目标：${JSON.stringify(actionPlan.action_plan?.validation_targets || [])}
- 教学提示：${JSON.stringify(actionPlan.action_plan?.diagnosis_context?.teaching_hints || [])}
- 能力缺口：${JSON.stringify(actionPlan.action_plan?.diagnosis_context?.primary_capability_gap_ids || [])}
` : "（正在获取决策...）"}

【TTAT 执行框架】
- Task：清晰说明本步任务目标
- Teach：提供可理解输入（示例/解释/示范）
- Assess：要求学员输出（回答/练习/应用）
- Tune：根据输出纠错/提示/调整难度

【学科特殊规则】
${subject === "math" ? "- 数学表达式用 $...$ 行内或 $$...$$ 块级\n- 逐步推导，不直接给答案" : ""}
${subject === "code" ? "- 代码用 ```lang\n...\n``` 格式\n- 引导思考，不直接写完整代码" : ""}
${subject === "english" ? "- 坚持英语交流，中文只用于解释难点\n- 控制输入难度，确保可理解" : ""}

【约束】不跳任务 | 必须要求学员输出 | transcript 必须真实 | 每步后系统自动提交 trace`;
}

// ─── Main App ────────────────────────────────────────────────────────
export default function App() {
  // ── State ──
  const [config, setConfig] = useState(() => {
    try { return JSON.parse(localStorage.getItem("duo_config") || "{}"); } catch { return {}; }
  });
  const [showConfig, setShowConfig] = useState(!config.backendUrl && !config.llmKey);
  const [messages, setMessages] = useState([]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [status, setStatus]  = useState("idle"); // idle | session | ending
  const [sessionId, setSessionId] = useState(null);
  const [ttatStep, setTtatStep] = useState(0);
  const [actionPlan, setActionPlan] = useState(null);
  const [duoState, setDuoState] = useState({ d: 0, u: 0, o: 0 });
  const [currentTask, setCurrentTask] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [latestEval, setLatestEval] = useState(null);

  const chatRef    = useRef(null);
  const inputRef   = useRef(null);
  const mediaRef   = useRef(null);
  const chunksRef  = useRef([]);
  const recogRef   = useRef(null);

  const api = useMemo(() => makeApi(config), [config]);
  const subject = config.subject || "english";

  // ── Save config ──
  const saveConfig = (cfg) => {
    setConfig(cfg);
    localStorage.setItem("duo_config", JSON.stringify(cfg));
    setShowConfig(false);
  };

  // ── Scroll to bottom ──
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  // ── Add message ──
  const addMsg = useCallback((role, content) => {
    setMessages(m => [...m, { role, content, id: Date.now() + Math.random() }]);
    if (role !== "system") setTranscript(t => [...t, { role, text: content }]);
  }, []);

  const addSystem = useCallback((content) => {
    setMessages(m => [...m, { role: "system", content, id: Date.now() }]);
  }, []);

  // ── Bootstrap ──
  const bootstrap = useCallback(async () => {
    if (!config.backendUrl && !config.accessToken) {
      addSystem("请先配置后端服务地址和 LLM Key（点击右上角 ⚙ 图标）");
      return;
    }
    try {
      addSystem("正在连接后端...");
      const ctx = await api.getTeachingCurrent();
      if (ctx.current_task) {
        setCurrentTask(ctx.current_task);
        addSystem(`✓ 已恢复任务：${ctx.current_task?.task_payload?.title || "当前任务"}`);
        await startSession();
      } else if (ctx.active_plan) {
        addSystem("✓ 检测到学习计划，请开始今天的学习。发送任意消息进入执行。");
        setStatus("idle");
      } else {
        addSystem("未检测到学习计划。请通过 Builder GPT 完成初始设置，或发送消息开始对话。");
      }
    } catch (e) {
      addSystem(`⚠ 后端连接失败：${e.message}。请检查配置。`);
    }
  }, [config, api]);

  const startSession = useCallback(async () => {
    try {
      const r = await api.startSession();
      setSessionId(r.session_id);
      setStatus("session");
      setTtatStep(0);
      setTranscript([]);
      // Fetch action plan
      const ap = await api.getActionPlan();
      setActionPlan(ap);
      // Mock DUO state from action plan
      const os = ap?.action_plan?.object_state;
      if (os) {
        const caps = Object.values(os.capability_state || {});
        const dScore = caps.length ? caps.reduce((s, c) => s + (c.mastery_score || 0), 0) / caps.length : 60;
        setDuoState({ d: Math.min(100, dScore + 20), u: dScore, o: 75 });
      }
      addSystem(`✓ 会话已开始 | Session: ${r.session_id?.slice(0, 8)}...`);
      // Kick off first LLM turn
      await llmTurn([], ap, "task");
    } catch (e) {
      addSystem(`⚠ 会话启动失败：${e.message}`);
    }
  }, [api]);

  // ── LLM turn ──
  const llmTurn = useCallback(async (history, ap, ttat) => {
    if (!config.llmKey && config.llmProvider !== "custom") {
      addMsg("assistant", "（需要配置 LLM Key 才能进行 AI 对话）");
      return;
    }
    setLoading(true);
    try {
      const sysPrompt = buildSystemPrompt(config, ap || actionPlan, subject);
      const msgs = [
        { role: "user", content: sysPrompt + `\n\n当前 TTAT 阶段：${TTAT[ttatStep] || "Task"}` },
        ...history.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content })),
      ];
      if (history.length === 0) msgs.push({ role: "user", content: "请开始本次教学。" });

      const reply = await callLLM(config, msgs);
      addMsg("assistant", reply);

      // Advance TTAT
      setTtatStep(s => Math.min(s + 1, 3));
    } catch (e) {
      addMsg("assistant", `⚠ LLM 调用失败：${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [config, actionPlan, subject, ttatStep, addMsg]);

  // ── Send message ──
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    addMsg("user", text);

    if (status !== "session") {
      // Try to start session
      if (!sessionId) await startSession();
      return;
    }

    // Submit trace for current step
    if (sessionId) {
      api.submitTrace(sessionId, {
        schema_name: "teaching_execution_trace",
        schema_version: "teaching_execution_trace_v1",
        session_id: sessionId,
        steps_executed: [{
          step_id: `step_${ttatStep + 1}`,
          step_type: ["input_exposure", "guided_output", "micro_quiz", "error_feedback"][ttatStep] || "guided_output",
          ttat_phase: TTAT[ttatStep] || "Teach",
          user_response_quality: null,
          turn_count: 1,
        }],
      }).catch(() => {});
    }

    await llmTurn([...messages, { role: "user", content: text }], null, TTAT[ttatStep]);
  }, [input, loading, status, sessionId, messages, ttatStep, api, addMsg, llmTurn, startSession]);

  // ── End session ──
  const endSession = useCallback(async () => {
    if (!sessionId || status !== "session") return;
    setStatus("ending");
    try {
      addSystem("正在结束会话，触发评估...");
      await api.endSession(sessionId, {
        transcript,
        auto_evaluate: true,
        llm_turn_output: {
          teaching_quality_self_assessment: "partial",
          error_tags_observed: [],
        },
      });
      const ev = await api.getLatestEval().catch(() => null);
      setLatestEval(ev);
      addSystem(`✓ 会话结束 | 评估已触发${ev ? " | 查看右侧面板" : ""}`);
    } catch (e) {
      addSystem(`⚠ 结束会话失败：${e.message}`);
    } finally {
      setSessionId(null);
      setStatus("idle");
    }
  }, [sessionId, status, transcript, api, addSystem]);

  // ── Voice recording ──
  const toggleVoice = useCallback(async () => {
    if (recording) {
      // Stop
      if (recogRef.current) { recogRef.current.stop(); recogRef.current = null; }
      if (mediaRef.current) { mediaRef.current.getTracks().forEach(t => t.stop()); }
      setRecording(false);
      return;
    }

    // Try Web Speech API first
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const recog = new SR();
      recog.lang = subject === "english" ? "en-US" : "zh-CN";
      recog.continuous = false;
      recog.interimResults = false;
      recog.onresult = (e) => {
        const txt = e.results[0][0].transcript;
        setInput(p => p ? p + " " + txt : txt);
      };
      recog.onend = () => setRecording(false);
      recog.onerror = () => setRecording(false);
      recog.start();
      recogRef.current = recog;
      setRecording(true);
    } else {
      addSystem("⚠ 当前浏览器不支持语音识别，请使用 Chrome");
    }
  }, [recording, subject, addSystem]);

  // ── Keyboard handler ──
  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── KaTeX injection ──
  useEffect(() => {
    if (subject !== "math") return;
    const id = "katex-css";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id; link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
      document.head.appendChild(link);
    }
  }, [subject]);

  // ── Eval scores ──
  const evalScores = latestEval?.evaluation?.scores || {};

  return (
    <>
      <style>{CSS}</style>
      {showConfig && <ConfigModal config={config} onSave={saveConfig} onClose={() => setShowConfig(false)} />}

      <div className="app">
        {/* ── Left Panel ── */}
        <div className="left-panel">
          <div className="panel-hdr">
            <span className="dot" />
            DUO 状态
          </div>

          <div className="sidebar-section">
            <div className="sidebar-label">D / U / O 维度</div>
            {[
              { key: "d", label: "D 领域", cls: "d", val: duoState.d },
              { key: "u", label: "U 学员", cls: "u", val: duoState.u },
              { key: "o", label: "O 决策", cls: "o", val: duoState.o },
            ].map(({ key, label, cls, val }) => (
              <div className="duo-metric" key={key}>
                <span className="duo-name">{label[0]}</span>
                <div className="duo-bar"><div className={`duo-fill ${cls}`} style={{ width: `${val}%` }} /></div>
                <span className="duo-val">{Math.round(val)}</span>
              </div>
            ))}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-label">会话状态</div>
            <div>
              <span className={`state-chip ${status === "session" ? "ok" : status === "ending" ? "warn" : "active"}`}>
                {status === "session" ? "● 会话中" : status === "ending" ? "⏳ 结束中" : "○ 待机"}
              </span>
              {sessionId && <span className="state-chip">{sessionId.slice(0, 8)}</span>}
            </div>
          </div>

          {currentTask && (
            <div className="sidebar-section">
              <div className="sidebar-label">当前任务</div>
              <div className="task-card">
                <div className="task-card-title">
                  {currentTask.task_payload?.title || "当前任务"}
                </div>
                <div className="task-card-sub">
                  {currentTask.task_payload?.scene || "—"} ·{" "}
                  {currentTask.task_payload?.target_skill || "—"}
                </div>
              </div>
            </div>
          )}

          {actionPlan?.action_plan?.diagnosis_context?.teaching_hints?.length > 0 && (
            <div className="sidebar-section">
              <div className="sidebar-label">诊断提示</div>
              {actionPlan.action_plan.diagnosis_context.teaching_hints.slice(0, 2).map((h, i) => (
                <div key={i} style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.5, marginBottom: 6 }}>
                  · {h}
                </div>
              ))}
            </div>
          )}

          <div className="sidebar-section" style={{ flex: 1 }}>
            <div className="sidebar-label">学科</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {SUBJECTS.map(s => (
                <span key={s.id}
                  className={`state-chip ${config.subject === s.id ? "ok" : ""}`}
                  style={{ cursor: "pointer", fontSize: 10 }}
                  onClick={() => { const c = { ...config, subject: s.id }; setConfig(c); localStorage.setItem("duo_config", JSON.stringify(c)); }}>
                  {s.icon} {s.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main ── */}
        <div className="main">
          <div className="topbar">
            <div>
              <div className="topbar-title">
                {SUBJECTS.find(s => s.id === subject)?.icon} DUO Coach
                {" · "}<span style={{ color: "var(--cyan)", fontSize: 13 }}>
                  {SUBJECTS.find(s => s.id === subject)?.label}
                </span>
              </div>
              <div className="topbar-sub">
                {config.llmModel || "未配置 LLM"} · {config.backendUrl ? "✓ 已连接" : "未配置"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              {status === "idle" && messages.length === 0 && (
                <button className="icon-btn" onClick={bootstrap}>⚡ 连接</button>
              )}
              {status === "idle" && messages.length > 0 && (
                <button className="icon-btn" onClick={startSession}>▶ 开始</button>
              )}
              {status === "session" && (
                <button className="icon-btn" onClick={endSession} style={{ color: "var(--amber)", borderColor: "rgba(255,179,71,0.4)" }}>
                  ⬛ 结束
                </button>
              )}
              <button className="icon-btn" onClick={() => setShowConfig(true)}>⚙</button>
            </div>
          </div>

          <div className="chat-area" ref={chatRef}>
            {messages.length === 0 && (
              <div style={{ margin: "auto", textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>
                  {SUBJECTS.find(s => s.id === subject)?.icon || "🎓"}
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>DUO Coach</div>
                <div style={{ fontSize: 13, color: "var(--text3)", maxWidth: 360, margin: "0 auto 24px" }}>
                  基于 D+U+O 架构的智能教学引擎<br />
                  支持语音对话 · 文本交互 · 数学 · 编程
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <button className="btn" onClick={bootstrap}>⚡ 开始学习</button>
                  <button className="btn secondary" onClick={() => setShowConfig(true)}>⚙ 配置</button>
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={`msg ${msg.role}`}>
                {msg.role !== "system" && (
                  <div className="msg-avatar">
                    {msg.role === "assistant" ? "D" : "U"}
                  </div>
                )}
                <div className="msg-bubble">
                  {msg.role === "system"
                    ? msg.content
                    : <MsgContent content={msg.content} />
                  }
                </div>
              </div>
            ))}

            {loading && (
              <div className="msg assistant">
                <div className="msg-avatar">D</div>
                <div className="msg-bubble">
                  <div className="typing">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="input-area">
            {status === "session" && (
              <div className="ttat-bar">
                {TTAT.map((t, i) => (
                  <div key={t} className={`ttat-step ${i === ttatStep ? "active" : i < ttatStep ? "done" : ""}`}>
                    {i < ttatStep ? "✓" : ""} {t}
                  </div>
                ))}
              </div>
            )}

            {recording && (
              <div className="waveform">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.07}s` }} />
                ))}
              </div>
            )}

            <div className="input-row">
              <button className={`voice-btn ${recording ? "recording" : ""}`} onClick={toggleVoice}
                title={recording ? "点击停止录音" : "点击开始语音输入"}>
                {recording ? "⏹" : "🎙"}
              </button>
              <textarea
                ref={inputRef}
                className="chat-input"
                rows={1}
                placeholder={
                  status === "session"
                    ? "输入回答... (Enter 发送，Shift+Enter 换行)"
                    : "发送消息开始学习..."
                }
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKeyDown}
              />
              <button className="send-btn" onClick={sendMessage} disabled={!input.trim() || loading}>
                ↑
              </button>
            </div>
          </div>

          <div className="status-bar">
            <div className={`status-dot ${status === "session" ? "green" : config.backendUrl ? "amber" : "red"}`} />
            <span>{status === "session" ? `会话中 · ${transcript.length} 轮` : config.backendUrl ? "已配置" : "未配置后端"}</span>
            <span style={{ marginLeft: "auto" }}>
              {config.llmProvider || "—"} · {config.llmModel || "未选模型"}
            </span>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="right-panel">
          <div className="panel-hdr">
            <span className="dot" style={{ background: "var(--amber)", boxShadow: "0 0 8px var(--amber)" }} />
            评估与指标
          </div>

          {latestEval ? (
            <div className="sidebar-section">
              <div className="sidebar-label">最新评估得分</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                {Object.entries(evalScores).slice(0, 4).map(([k, v]) => (
                  <ScoreRing key={k} value={typeof v === "number" ? v * 100 : v}
                    color={v > 0.7 ? "var(--green)" : v > 0.4 ? "var(--amber)" : "var(--red)"}
                    label={k} />
                ))}
              </div>
              {Object.entries(evalScores).map(([k, v]) => (
                <div key={k} className="duo-metric">
                  <span style={{ fontSize: 11, color: "var(--text2)", minWidth: 90 }}>{k}</span>
                  <div className="duo-bar">
                    <div className="duo-fill d" style={{
                      width: `${(typeof v === "number" ? v * 100 : v)}%`,
                      background: v > 0.7 ? "var(--green)" : v > 0.4 ? "var(--amber)" : "var(--red)"
                    }} />
                  </div>
                  <span className="duo-val">{typeof v === "number" ? (v * 100).toFixed(0) : v}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="sidebar-section">
              <div style={{ fontSize: 12, color: "var(--text3)", padding: "8px 0" }}>
                完成一次会话后，评估结果将在此显示。
              </div>
            </div>
          )}

          {actionPlan && (
            <div className="sidebar-section">
              <div className="sidebar-label">当前决策</div>
              <div>
                <span className="state-chip active">
                  {actionPlan.action_plan?.selected_strategy_action?.mode || "—"}
                </span>
                <span className="state-chip">
                  支撑: {actionPlan.action_plan?.selected_strategy_action?.support_level || "—"}
                </span>
              </div>
              {actionPlan.action_plan?.explanation?.why?.slice(0, 2).map((w, i) => (
                <div key={i} style={{ fontSize: 11, color: "var(--text3)", marginTop: 6, lineHeight: 1.5 }}>· {w}</div>
              ))}
            </div>
          )}

          {actionPlan?.action_plan?.diagnosis_context && (
            <div className="sidebar-section">
              <div className="sidebar-label">诊断状态</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span className={`state-chip ${
                  actionPlan.action_plan.diagnosis_context.primary_severity === "high" ? "warn" :
                  actionPlan.action_plan.diagnosis_context.primary_severity === "critical" ? "" : "ok"
                }`}>
                  {actionPlan.action_plan.diagnosis_context.primary_severity || "low"}
                </span>
              </div>
              {actionPlan.action_plan.diagnosis_context.rising_error_keys?.slice(0, 3).map((k, i) => (
                <div key={i} style={{ fontSize: 10, color: "var(--amber)", marginTop: 4, fontFamily: "var(--mono)" }}>
                  ↑ {k}
                </div>
              ))}
            </div>
          )}

          <div className="sidebar-section">
            <div className="sidebar-label">对话轮次</div>
            <div style={{ fontSize: 24, fontWeight: 600, fontFamily: "var(--mono)", color: "var(--cyan)" }}>
              {transcript.filter(t => t.role === "user").length}
              <span style={{ fontSize: 12, color: "var(--text3)", marginLeft: 6, fontFamily: "var(--sans)", fontWeight: 400 }}>
                用户输出
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>
              共 {transcript.length} 轮 · TTAT 步骤 {ttatStep}/4
            </div>
          </div>

          <div className="sidebar-section" style={{ flex: 1 }}>
            <div className="sidebar-label">快速操作</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button className="icon-btn" onClick={() => api.getDiagnosis().then(d => addSystem(`诊断：${JSON.stringify(d.diagnosis?.primary_severity)} | 缺口：${d.diagnosis?.primary_capability_gap_ids?.join(", ")}`)).catch(e => addSystem(`诊断失败：${e.message}`))}>
                🔍 实时诊断
              </button>
              <button className="icon-btn" onClick={() => api.getLatestEval().then(d => setLatestEval(d)).catch(e => addSystem(`评估读取失败：${e.message}`))}>
                📊 刷新评估
              </button>
              <button className="icon-btn" onClick={endSession} disabled={status !== "session"}
                style={status === "session" ? { borderColor: "rgba(255,179,71,0.4)", color: "var(--amber)" } : {}}>
                ⬛ 结束会话
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
