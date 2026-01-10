
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

      const replyText: string =
        typeof data.reply === "string"
          ? data.reply
          : "YAI could not generate a reply.";

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

if (!user) {
  return (
    <div className="yai-auth-screen" style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      flexDirection: "column",
      gap: "12px"
    }}>
      <h1 style={{ fontSize: "26px", marginBottom: "5px" }}>
        Welcome to YAI 🚀
      </h1>

      <div style={{
        background: "#0f172a",
        padding: "20px",
        borderRadius: "12px",
        width: "300px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        border: "1px solid #334155"
      }}>
        
        {authMode === "register" && (
          <input
            placeholder="Full name"
            value={authName}
            onChange={(e) => setAuthName(e.target.value)}
            style={{ padding: "8px", borderRadius: "6px" }}
          />
        )}

        <input
          placeholder="Email"
          value={authEmail}
          onChange={(e) => setAuthEmail(e.target.value)}
          style={{ padding: "8px", borderRadius: "6px" }}
        />

        <input
          placeholder="Password"
          type="password"
          value={authPassword}
          onChange={(e) => setAuthPassword(e.target.value)}
          style={{ padding: "8px", borderRadius: "6px" }}
        />

        {authError && (
          <div style={{ color: "salmon", fontSize: "12px" }}>
            {authError}
          </div>
        )}

        <button
          onClick={handleAuthSubmit}
          disabled={authLoading}
          style={{
            padding: "8px",
            borderRadius: "6px",
            background: "#22c55e",
            color: "black",
            cursor: "pointer",
            marginTop: "6px"
          }}
        >
          {authMode === "register" ? "Create account" : "Sign in"}
        </button>

        <button
          onClick={() => setAuthMode(authMode === "register" ? "login" : "register")}
          style={{
            fontSize: "12px",
            background: "transparent",
            color: "#38bdf8",
            cursor: "pointer",
            border: "none",
            marginTop: "4px"
          }}
        >
          {authMode === "register"
            ? "Already have an account? Sign in"
            : "No account? Create one"}
        </button>
      </div>
    </div>
  );
}


  return (
    <div className="yai-shell">
      YAI main UI (shortened in this cell)
    </div>
  );
}
