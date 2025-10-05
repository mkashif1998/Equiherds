"use client";

import { useEffect, useState } from "react";
import MyProfile from "./MyProfile";
import Stables from "./Stables";
import Subscription from "./Subscription";
import SubscriptionList from "./SubscriptionList";
import Training from "./Training";
import MyServices from "./MyServices";
import Client from "./Client";
import SellersAccounts from "./SellersAccounts";
import UsersManagement from "./UsersManagement";
import { getUserData } from "../utils/localStorage";



export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  const userData = isMounted ? getUserData() : null;

  const sellerTabs = [
    { key: "profile", label: "My Profile" },
    { key: "subscription", label: "Subscription" },
    { key: "training", label: "Training" },
    { key: "stables", label: "Stables" },
    { key: "client", label: "Client" },
    { key: "logout", label: "Logout" },
  ];

  const buyerTabs = [
    { key: "profile", label: "My Profile" },
    { key: "myServices", label: "My Services" },
    { key: "logout", label: "Logout" },
  ];

  const superAdminTabs = [
    { key: "profile", label: "My Profile" },
    { key: "subscription", label: "SubscriptionList" },
    { key: "sellersAccounts", label: "Sellers Accounts" },
    { key: "usersManagement", label: "Users Management" },
    { key: "training", label: "Training" },
    { key: "stables", label: "Stables" },
    { key: "client", label: "Client" },
    { key: "logout", label: "Logout" },
  ];

  const getTabs = () => {
    if (userData?.accountType === "superAdmin") {
      return superAdminTabs;
    } else if (userData?.accountType === "seller") {
      return sellerTabs;
    } else {
      return buyerTabs;
    }
  };

  const tabs = getTabs();
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
          {isMounted && activeTab === "profile" && <MyProfile />}
          {isMounted && activeTab === "subscription" && userData?.accountType === "superAdmin" && <SubscriptionList />}
          {isMounted && activeTab === "subscription" && userData?.accountType !== "superAdmin" && <Subscription />}
          {isMounted && activeTab === "sellersAccounts" && <SellersAccounts />}
          {isMounted && activeTab === "usersManagement" && <UsersManagement />}
          {isMounted && activeTab === "training" && <Training />}
          {isMounted && activeTab === "stables" && <Stables />}
          {isMounted && activeTab === "myServices" && <MyServices />}
          {isMounted && activeTab === "client" && <Client />}
        </section>
      </div>
    </div>
  );
}
