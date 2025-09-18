"use client";

import { useState } from "react";

export default function MyProfile() {
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [phone, setPhone] = useState("+1 234 567 890");
  const [location, setLocation] = useState("Lahore, PK");
  const [bio, setBio] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  function handleImageChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }

  function handleSubmit(e) {
    e.preventDefault();
    console.log({ name, email, phone, location, bio, imagePreview });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-brand">My Profile</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-24 h-24 rounded-full overflow-hidden border border-[color:var(--primary)] bg-white flex items-center justify-center">
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm opacity-70">No image</span>
            )}
          </div>
          <div>
            <label className="block mb-2 text-sm opacity-80">Profile Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded border border-[color:var(--primary)] bg-white">
            <label className="block mb-1 text-sm opacity-80">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[color:var(--primary)] bg-white outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
              placeholder="Enter your name"
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
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[color:var(--primary)] bg-white outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
              placeholder="Enter your phone"
            />
          </div>
          <div className="p-4 rounded border border-[color:var(--primary)] bg-white">
            <label className="block mb-1 text-sm opacity-80">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[color:var(--primary)] bg-white outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
              placeholder="City, Country"
            />
          </div>
          <div className="p-4 rounded border border-[color:var(--primary)] bg-white sm:col-span-2">
            <label className="block mb-1 text-sm opacity-80">Bio</label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[color:var(--primary)] bg-white outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
              placeholder="Tell us about yourself"
            />
          </div>
        </div>

        <div>
          <button type="submit" className="px-4 py-2 rounded bg-secondary text-white font-medium">Save Changes</button>
        </div>
      </form>
    </div>
  );
}


