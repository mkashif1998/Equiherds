"use client";

import { useEffect, useRef, useState } from "react";
import { getUserData } from "../utils/localStorage";
import { getRequest, putRequest, uploadFile } from "@/service";

export default function MyProfile() {
  const tokenData = getUserData();
  const userId =  tokenData?.id || null;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyInfo, setCompanyInfo] = useState("");
  const [brandImage, setBrandImage] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const fileInputRef = useRef(null);

  // Read-only fields
  const [accountType, setAccountType] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState("");
  const [subscriptionExpiry, setSubscriptionExpiry] = useState("");

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (typeof window === "undefined") {
        return;
      }
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        const res = await getRequest(`/api/users?id=${userId}`);
        console.log("hhhhh");
        const user = res?.user || res;
        if (!ignore && user) {
          setFirstName(user.firstName || "");
          setLastName(user.lastName || "");
          setEmail(user.email || "");
          setPhoneNumber(user.phoneNumber || "");
          setCompanyName(user.companyName || "");
          setCompanyInfo(user.companyInfo || "");
          setBrandImage(user.brandImage || "");
          setImagePreview(user.brandImage || null);
          setAccountType(user.accountType || tokenData?.accountType || "");
          setSubscriptionStatus(user.subscriptionStatus || "");
          setSubscriptionExpiry(user.subscriptionExpiry || "");
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [userId]);

  async function handleImageChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    // Show quick preview and defer upload until Save Changes
    const localUrl = URL.createObjectURL(file);
    setSelectedImageFile(file);
    setImagePreview(localUrl);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    try {
      let imageUrl = brandImage;
      if (selectedImageFile) {
        try {
          imageUrl = await uploadFile(selectedImageFile);
        } catch (uploadErr) {
          // eslint-disable-next-line no-console
          console.error("Image upload failed", uploadErr);
        }
      }
      const payload = {
        firstName,
        lastName,
        email,
        phoneNumber,
        companyName,
        companyInfo,
        brandImage: imageUrl,
      };
      await putRequest(`/api/users?id=${userId}`, payload);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-brand">My Profile</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="w-24 h-24 rounded-full overflow-hidden border border-[color:var(--primary)] bg-white flex items-center justify-center"
            aria-label="Change profile image"
          >
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} alt="Profile" className="w-full h-full rounded-full object-cover object-center" />
            ) : (
              <span className="text-sm opacity-70">Upload</span>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            aria-hidden
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded border border-[color:var(--primary)] bg-white">
            <label className="block mb-1 text-sm opacity-80">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[color:var(--primary)] bg-white outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
              placeholder="Enter first name"
            />
          </div>
          <div className="p-4 rounded border border-[color:var(--primary)] bg-white">
            <label className="block mb-1 text-sm opacity-80">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[color:var(--primary)] bg-white outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
              placeholder="Enter last name"
            />
          </div>
          <div className="p-4 rounded border border-[color:var(--primary)] bg-white">
            <label className="block mb-1 text-sm opacity-80">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[color:var(--primary)] bg-white outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
              placeholder="Enter your email"
            />
          </div>
          <div className="p-4 rounded border border-[color:var(--primary)] bg-white">
            <label className="block mb-1 text-sm opacity-80">Phone</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[color:var(--primary)] bg-white outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
              placeholder="Enter your phone"
            />
          </div>
          <div className="p-4 rounded border border-[color:var(--primary)] bg-white">
            <label className="block mb-1 text-sm opacity-80">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[color:var(--primary)] bg-white outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
              placeholder="Company name"
            />
          </div>
          <div className="p-4 rounded border border-[color:var(--primary)] bg-white sm:col-span-2">
            <label className="block mb-1 text-sm opacity-80">Company Info</label>
            <textarea
              rows={4}
              value={companyInfo}
              onChange={(e) => setCompanyInfo(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[color:var(--primary)] bg-white outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
              placeholder="Tell us about your company"
            />
          </div>

          {/* Read-only fields */}
          <div className="p-4 rounded border border-[color:var(--primary)] bg-white">
            <label className="block mb-1 text-sm opacity-80">Account Type</label>
            <input
              type="text"
              value={accountType}
              disabled
              className="w-full px-3 py-2 rounded border border-[color:var(--primary)] bg-gray-50 text-gray-700"
            />
          </div>
          <div className="p-4 rounded border border-[color:var(--primary)] bg-white">
            <label className="block mb-1 text-sm opacity-80">Subscription Status</label>
            <input
              type="text"
              value={subscriptionStatus}
              disabled
              className="w-full px-3 py-2 rounded border border-[color:var(--primary)] bg-gray-50 text-gray-700"
            />
          </div>
          <div className="p-4 rounded border border-[color:var(--primary)] bg-white">
            <label className="block mb-1 text-sm opacity-80">Subscription Expiry</label>
            <input
              type="text"
              value={subscriptionExpiry}
              disabled
              className="w-full px-3 py-2 rounded border border-[color:var(--primary)] bg-gray-50 text-gray-700"
            />
          </div>
        </div>

        <div>
          <button disabled={saving || loading} type="submit" className="px-4 py-2 rounded bg-secondary text-white font-medium disabled:opacity-60">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}


