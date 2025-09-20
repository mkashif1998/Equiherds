"use client";

import { useState } from "react";
import {Edit, Trash} from "lucide-react";

const dummyStables = [
  {
    id: "1",
    title: "Luxury Stable 1",
    details: "Spacious stable with modern amenities and 24/7 care.",
    price: 25000,
    rating: 4.5,
    images: [
      "/trainer/5.jpg"
    ],
  },
  {
    id: "2",
    title: "Premium Stable 2",
    details: "Well-ventilated stable with attached paddock.",
    price: 18000,
    rating: 4.0,
    images: [
      "/trainer/1.jpg",
    ],
  },
];

function StarRating({ rating }) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.561-.955L10 0l2.951 5.955 6.561.955-4.756 4.635 1.122 6.545z" />
        </svg>
      ))}
      {halfStar && (
        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.561-.955L10 0l2.951 5.955 6.561.955-4.756 4.635 1.122 6.545z" fill="url(#half)" />
        </svg>
      )}
      <span className="ml-1 text-xs text-brand/70">{rating.toFixed(1)}</span>
    </span>
  );
}

export default function Trainer() {
  const [stables, setStables] = useState(dummyStables);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    details: "",
    price: "",
    images: [],
  });
  const [imagePreviews, setImagePreviews] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setForm((prev) => ({ ...prev, images: files }));
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleAddStable = (e) => {
    e.preventDefault();
    if (!form.title || !form.details || !form.price || form.images.length === 0) return;
    const newStable = {
      id: Date.now().toString(),
      title: form.title,
      details: form.details,
      price: Number(form.price),
      rating: 0,
      images: imagePreviews,
    };
    setStables((prev) => [newStable, ...prev]);
    setForm({ title: "", details: "", price: "", images: [] });
    setImagePreviews([]);
    setShowModal(false);
  };

  const handleDelete = (id) => {
    setStables((prev) => prev.filter((s) => s.id !== id));
  };

  // For simplicity, edit just fills the form and removes the old one
  const handleEdit = (stable) => {
    setForm({
      title: stable.title,
      details: stable.details,
      price: stable.price,
      images: [],
    });
    setImagePreviews(stable.images);
    setStables((prev) => prev.filter((s) => s.id !== stable.id));
    setShowModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-brand">Trainer</h2>
          <p className="text-sm text-brand/80">Information about your stables.</p>
        </div>
        <button
          className="px-4 py-2 rounded bg-[color:var(--primary)] !text-white font-medium hover:bg-[color:var(--primary)]/90 transition cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          + Add New
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {stables.map((stable) => (
          <div key={stable.id} className="bg-white rounded-lg border border-[color:var(--primary)] shadow-sm p-4 relative">
            <div className="relative w-full h-40 mb-3 rounded overflow-hidden bg-gray-100">
              {stable.images && stable.images.length > 0 ? (
                <img
                  src={stable.images[0]}
                  alt={stable.title}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-brand/40">No Image</div>
              )}
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  className="p-1 rounded hover:bg-gray-100"
                  title="Edit"
                  onClick={() => handleEdit(stable)}
                >
                  <Edit className="w-5 h-5 text-blue-600 cursor-pointer" />
                </button>
                <button
                  className="p-1 rounded hover:bg-gray-100"
                  title="Delete"
                  onClick={() => handleDelete(stable.id)}
                >
                  <Trash className="w-5 h-5 text-red-600  cursor-pointer" />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-brand">{stable.title}</h3>
            <p className="text-sm text-brand/80 mb-2">{stable.details}</p>
            <div className="flex items-center justify-between">
              <span className="text-brand font-bold text-base">
                {stable.price ? `Rs. ${stable.price.toLocaleString()}` : ""}
              </span>
              <StarRating rating={stable.rating} />
            </div>
            {stable.images && stable.images.length > 1 && (
              <div className="flex gap-1 mt-2">
                {stable.images.slice(1, 4).map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Stable ${stable.title} ${idx + 2}`}
                    className="w-8 h-8 object-cover rounded border"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => {
                setShowModal(false);
                setForm({ title: "", details: "", price: "", images: [] });
                setImagePreviews([]);
              }}
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-xl font-semibold text-brand mb-4">Add New Trainer</h3>
            <form onSubmit={handleAddStable} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand mb-1">Details</label>
                <textarea
                  name="details"
                  value={form.details}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)]"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand mb-1">Price</label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)]"
                  min={0}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand mb-1">Images</label>
                <input
                  type="file"
                  name="images"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="w-full text-sm"
                  required={imagePreviews.length === 0}
                />
                {imagePreviews.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {imagePreviews.map((src, idx) => (
                      <img
                        key={idx}
                        src={src}
                        alt={`Preview ${idx + 1}`}
                        className="w-14 h-14 object-cover rounded border"
                      />
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded bg-[color:var(--primary)] text-white font-medium hover:bg-[color:var(--primary)]/90 transition"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
