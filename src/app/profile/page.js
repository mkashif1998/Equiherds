"use client";

import { useState } from "react";
import MyProfile from "./MyProfile";
import Stables from "./Stables";
import Subscription from "./Subscription";
import Training from "./Training";
import MyServices from "./MyServices";
import Client from "./Client";

const tabs = [
  { key: "profile", label: "My Profile" },
  { key: "subscription", label: "Subscription" },
  { key: "training", label: "Training" },
  { key: "stables", label: "Stables" },
  { key: "myServices", label: "My Services" },
  { key: "client", label: "Client" },
  { key: "logout", label: "Logout" },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");

  const handleLogout = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
    } catch {}
    window.location.href = "/login";
  };

  return (
    <div className="mx-auto max-w-8xl px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        <aside className="md:h-[calc(100dvh-200px)] md:sticky md:top-24 p-4 rounded border border-[color:var(--primary)] bg-white">
          <nav className="grid gap-2">
            {tabs.map((t) => {
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  className={`text-left px-3 py-2 rounded font-medium transition-colors border border-[color:var(--primary)] ${
                    isActive
                      ? "!text-white bg-[color:var(--primary)]"
                      : "text-brand hover:bg-[color:var(--primary)]/5"
                  }`}
                  onClick={() => (t.key === "logout" ? handleLogout() : setActiveTab(t.key))}
                >
                  {t.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="min-h-[320px] p-4 rounded border border-[color:var(--primary)] bg-white">
          {activeTab === "profile" && <MyProfile />}
          {activeTab === "subscription" && <Subscription />}
          {activeTab === "training" && <Training />}
          {activeTab === "stables" && <Stables />}
          {activeTab === "myServices" && <MyServices />}
          {activeTab === "client" && <Client />}
        </section>
      </div>
    </div>
  );
}
