"use client";

import React, { useEffect, useState } from "react";

type YaiUser = {
  name: string;
  email: string;
  password: string;
};

type TabKey = "chat" | "images" | "account";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const LOCAL_USER_KEY = "yai_user_v1";

function loadUser(): YaiUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as YaiUser;
    if (!parsed.email || !parsed.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveUser(user: YaiUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
}

function clearUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOCAL_USER_KEY);
}

export default function AppPage() {
  const [user, setUser] = useState<YaiUser | null>(null);
  const [authMode, setAuthMode] = useState<"register" | "login">("register");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<TabKey>("chat");

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [imagePrompt, setImagePrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    const existing = loadUser();
    if (existing) {
      setUser(existing);
      setAuthEmail(existing.email);
      setAuthName(existing.name);
    }
  }, []);

  const handleAuthSubmit = async () => {
    setAuthError(null);

    if (!authEmail || !authPassword || (authMode === "register" && !authName)) {
      setAuthError("Please fill in all required fields.");
      return;
    }

    setAuthLoading(true);

    try {
      if (authMode === "register") {
        const newUser: YaiUser = {
          name: authName.trim(),
          email: authEmail.trim(),
          password: authPassword
        };
        saveUser(newUser);
        setUser(newUser);
      } else {
        const existing = loadUser();
        if (!existing || existing.email !== authEmail.trim()) {
          setAuthError("Account not found. Please create a new account.");
          return;
        }
        if (existing.password !== authPassword) {
          setAuthError("Incorrect password.");
          return;
        }
        setUser(existing);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearUser();
    setUser(null);
    setChatMessages([]);
    setChatInput("");
  };

  const handleSendChat = async () => {
    const content = chatInput.trim();
    if (!content) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content
    };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setChatLoading(true);

    try {
const res = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [{ role: "user", content }]
  })
});

const data = await res.json();

let replyText: string;

if (typeof data.reply === "string") {
  replyText = data.reply;
} else if (typeof data.error === "string") {
  replyText = `YAI error: ${data.error}`;
} else {
  replyText = "YAI could not generate a reply.";
}


      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: replyText
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (e) {
      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: "Error talking to YAI backend. Please try again."
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    const prompt = imagePrompt.trim();
    if (!prompt) return;

    setImageLoading(true);
    setImageUrl(null);

    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      const data = await res.json();
      const url = typeof data.url === "string" ? data.url : null;

      if (!url) {
        throw new Error("No image URL returned");
      }

      setImageUrl(url);
    } catch (e) {
      setImageUrl(null);
    } finally {
      setImageLoading(false);
    }
  };

  // ---------- AUTH SCREEN ----------
  if (!user) {
    return (
      <div className="yai-auth-screen">
        <div className="yai-auth-card">
          <div className="yai-auth-header">
            <div className="yai-logo">
              <div className="yai-logo-mark">Y</div>
              <div>
                <div className="yai-logo-text-title">YAI</div>
                <div className="yai-logo-text-sub">
                  Personal AI assistant beta
                </div>
              </div>
            </div>
            <div>
              <div className="yai-auth-title">
                {authMode === "register"
                  ? "Create your YAI account"
                  : "Welcome back to YAI"}
              </div>
              <div className="yai-auth-subtitle">
                Sign in with your email. Google login will be added later.
              </div>
            </div>
          </div>

          <div className="yai-auth-toggle">
            <button
              type="button"
              className={authMode === "register" ? "active" : ""}
              onClick={() => setAuthMode("register")}
            >
              Sign up
            </button>
            <button
              type="button"
              className={authMode === "login" ? "active" : ""}
              onClick={() => setAuthMode("login")}
            >
              Sign in
            </button>
          </div>

          {authError && <div className="yai-auth-error">{authError}</div>}

          <div className="yai-auth-form">
            {authMode === "register" && (
              <div>
                <div className="yai-auth-label">Full name</div>
                <input
                  className="yai-auth-input"
                  value={authName}
                  onChange={e => setAuthName(e.target.value)}
                  placeholder="Example: Yazan Nasrallah"
                />
              </div>
            )}
            <div>
              <div className="yai-auth-label">Email</div>
              <input
                className="yai-auth-input"
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
              />
            </div>
            <div>
              <div className="yai-auth-label">Password</div>
              <input
                className="yai-auth-input"
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                placeholder="********"
                type="password"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={authLoading}
            onClick={handleAuthSubmit}
            className="yai-button-primary"
          >
            {authLoading
              ? "Processing…"
              : authMode === "register"
              ? "Create account"
              : "Sign in"}
          </button>

          <div style={{ fontSize: 10, color: "#9ca3af" }}>
            In this beta, your account is stored only in your browser (no
            external database yet).
          </div>
        </div>
      </div>
    );
  }

  // ---------- MAIN UI AFTER LOGIN ----------
  const initials =
    user.name
      .split(" ")
      .map(p => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "Y";

  return (
    <div className="yai-shell">
      <aside className="yai-sidebar">
        <div className="yai-logo">
          <div className="yai-logo-mark">Y</div>
          <div>
            <div className="yai-logo-text-title">YAI</div>
            <div className="yai-logo-text-sub">Beta workspace</div>
          </div>
        </div>

        <div>
          <div className="yai-nav-section-title">Workspace</div>
          <div className="yai-nav-list">
            <button
              type="button"
              className={
                "yai-nav-item" + (activeTab === "chat" ? " active" : "")
              }
              onClick={() => setActiveTab("chat")}
            >
              <span className="yai-nav-item-icon">💬</span>
              <span className="yai-nav-label">Chat</span>
              <span className="yai-nav-badge">YAI model</span>
            </button>
            <button
              type="button"
              className={
                "yai-nav-item" + (activeTab === "images" ? " active" : "")
              }
              onClick={() => setActiveTab("images")}
            >
              <span className="yai-nav-item-icon">🖼️</span>
              <span className="yai-nav-label">Image Lab</span>
            </button>
            <button
              type="button"
              className={
                "yai-nav-item" + (activeTab === "account" ? " active" : "")
              }
              onClick={() => setActiveTab("account")}
            >
              <span className="yai-nav-item-icon">👤</span>
              <span className="yai-nav-label">Account</span>
            </button>
          </div>
        </div>

        <div className="yai-sidebar-footer">
          <div className="yai-sidebar-user">
            <div className="yai-avatar">{initials}</div>
            <div className="yai-sidebar-user-main">
              <div className="yai-sidebar-user-name">{user.name}</div>
              <div className="yai-sidebar-user-email">{user.email}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              className="yai-sidebar-pill"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </div>
      </aside>

      <main className="yai-main">
        <header className="yai-main-header">
          <div>
            <div className="yai-main-title">
              {activeTab === "chat"
                ? "Chat with YAI"
                : activeTab === "images"
                ? "Image generation lab"
                : "Account & settings"}
            </div>
            <div className="yai-main-subtitle">
              {activeTab === "chat"
                ? "Ask anything. YAI will reply in natural language."
                : activeTab === "images"
                ? "Describe an image and YAI will try to create it."
                : "Manage your profile in this beta version."}
            </div>
          </div>
          <div className="yai-main-header-right">
            <div className="yai-dot" />
            <span>Connected</span>
            <span className="yai-tag">Beta</span>
          </div>
        </header>

        <section className="yai-main-body">
          {activeTab === "chat" && (
            <div className="yai-panel">
              <div className="yai-panel-header">
                <div className="yai-panel-title">Conversation</div>
                <div className="yai-panel-badge">
                  Messages: {chatMessages.length}
                </div>
              </div>
              <div className="yai-chat-history">
                {chatMessages.length === 0 && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#9ca3af",
                      padding: "4px 2px"
                    }}
                  >
                    Start by asking YAI about your project, ideas, or anything
                    else.
                  </div>
                )}
                {chatMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={
                      "yai-chat-message " +
                      (msg.role === "user" ? "user" : "assistant")
                    }
                  >
                    {msg.content}
                  </div>
                ))}
              </div>
              <div className="yai-chat-input-row">
                <textarea
                  className="yai-textarea"
                  placeholder="Write a message to YAI..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                />
                <button
                  type="button"
                  className="yai-button-primary"
                  disabled={chatLoading || !chatInput.trim()}
                  onClick={handleSendChat}
                >
                  {chatLoading ? "Thinking…" : "Send"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "images" && (
            <div className="yai-panel">
              <div className="yai-panel-header">
                <div className="yai-panel-title">Image Lab</div>
                <div className="yai-panel-badge">
                  Experimental image generation
                </div>
              </div>
              <div className="yai-image-panel-body">
                <textarea
                  className="yai-image-prompt"
                  placeholder="Describe the image you want YAI to generate..."
                  value={imagePrompt}
                  onChange={e => setImagePrompt(e.target.value)}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="yai-button-primary"
                    disabled={imageLoading || !imagePrompt.trim()}
                    onClick={handleGenerateImage}
                  >
                    {imageLoading ? "Creating…" : "Generate image"}
                  </button>
                  <button
                    type="button"
                    className="yai-button-ghost"
                    onClick={() => {
                      setImagePrompt("");
                      setImageUrl(null);
                    }}
                  >
                    Clear
                  </button>
                </div>
                <div className="yai-image-preview">
                  {imageLoading && (
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>
                      YAI is generating your image…
                    </div>
                  )}
                  {!imageLoading && imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="Generated by YAI" />
                  )}
                  {!imageLoading && !imageUrl && (
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      No image yet. Enter a description and click{" "}
                      <strong>Generate image</strong>.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "account" && (
            <div className="yai-panel">
              <div className="yai-panel-header">
                <div className="yai-panel-title">Account</div>
                <div className="yai-panel-badge">Local-only beta</div>
              </div>
              <div className="yai-account-body">
                <div className="yai-account-row">
                  <div>Name</div>
                  <input
                    className="yai-input"
                    value={user.name}
                    onChange={e => {
                      const updated = { ...user, name: e.target.value };
                      setUser(updated);
                      saveUser(updated);
                    }}
                  />
                </div>
                <div className="yai-account-row">
                  <div>Email</div>
                  <input
                    className="yai-input"
                    value={user.email}
                    onChange={e => {
                      const updated = { ...user, email: e.target.value };
                      setUser(updated);
                      saveUser(updated);
                    }}
                  />
                </div>
                <div className="yai-account-row">
                  <div>Change password (local only)</div>
                  <input
                    className="yai-input"
                    type="password"
                    placeholder="New password"
                    onChange={e => {
                      const updated = { ...user, password: e.target.value };
                      setUser(updated);
                      saveUser(updated);
                    }}
                  />
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>
                    This beta stores your password only in your browser. No
                    external database is connected yet.
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="yai-panel">
            <div className="yai-panel-header">
              <div className="yai-panel-title">Notes</div>
              <div className="yai-panel-badge">Beta information</div>
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.5 }}>
              <p>
                This is a beta interface of <strong>YAI</strong>. In the next
                iterations we can:
              </p>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                <li>Connect a real database for accounts and history.</li>
                <li>Add chat history with multiple conversations.</li>
                <li>
                  Add usage limits and subscription plans (free vs plus), as you
                  requested.
                </li>
                <li>Integrate Google / Gmail login.</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
