"use client";

import { useState } from "react";
import MyProfile from "./MyProfile";
import AddServices from "./AddServices";

const tabs = [
  { key: "profile", label: "My Profile" },
  { key: "services", label: "Add Services" },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-brand mb-6">Profile</h1>
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
                      ? "[color:var(--primary)] bg-[color:var(--primary)]/10"
                      : "text-brand hover:bg-[color:var(--primary)]/5"
                  }`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="min-h-[320px] p-4 rounded border border-[color:var(--primary)] bg-white">
          {activeTab === "profile" && <MyProfile />}
          {activeTab === "services" && <AddServices />}
        </section>
      </div>
    </div>
  );
}
