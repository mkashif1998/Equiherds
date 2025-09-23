"use client";

import { useEffect, useState } from "react";
import { Edit, Trash, Plus, X } from "lucide-react";
import { getUserData } from "../utils/localStorage";
import { postRequest, uploadFiles, deleteRequest, putRequest } from "@/service";
import { toast } from "react-hot-toast";

const dummyStables = [];

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
          <path
            d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.561-.955L10 0l2.951 5.955 6.561.955-4.756 4.635 1.122 6.545z"
            fill="url(#half)"
          />
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
    Experience: "",
    images: [],
    slots: [],
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [slotInput, setSlotInput] = useState({
    day: "",
    startTime: "",
    endTime: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [editingId, setEditingId] = useState(null);
  // Store previous images for edit mode
  const [prevImages, setPrevImages] = useState([]);
  console.log("editingId", editingId);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setForm((prev) => ({ ...prev, images: files }));
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleAddStable = async (e) => {
    e.preventDefault();
    if (!form.title || !form.details || !form.price) return;

    const tokenData = getUserData();
    const userId = tokenData?.id || tokenData?.sub || tokenData?._id || null;
    if (!userId) return;

    // Require at least one slot to map to API schedule schema
    const scheduleSource = form.slots && form.slots.length > 0 ? form.slots[0] : slotInput;
    if (!scheduleSource.day || !scheduleSource.startTime || !scheduleSource.endTime) return;

    setSubmitting(true);
    try {
      let uploadedUrls = [];
      // If editing, allow keeping previous images if no new images are selected
      if (editingId) {
        if (form.images && form.images.length > 0) {
          // New images selected, upload them
          uploadedUrls = await uploadFiles(form.images);
        } else if (prevImages && prevImages.length > 0) {
          // No new images, keep previous images
          uploadedUrls = prevImages;
        } else {
          // No images at all, show error and abort
          toast.error("Please provide at least one image.");
          setSubmitting(false);
          return;
        }
      } else {
        // Creating new: must have images
        if (!form.images || form.images.length === 0) {
          toast.error("Please provide at least one image.");
          setSubmitting(false);
          return;
        }
        uploadedUrls = await uploadFiles(form.images);
      }

      // Add Experience to payload as requested
      const payload = {
        userId,
        title: form.title,
        details: form.details,
        price: Number(form.price),
        Experience: form.Experience, // Experience is already included here
        schedule: {
          day: scheduleSource.day,
          startTime: scheduleSource.startTime,
          endTime: scheduleSource.endTime,
        },
        images: uploadedUrls,
        Experience: form.Experience, // Add Experience (capital E) as well
      };

      if (editingId) {
        const updated = await putRequest(`/api/trainer/${editingId}`, payload);
        setStables((prev) =>
          prev.map((s) =>
            s.id === editingId
              ? {
                  id: editingId,
                  title: payload.title,
                  details: payload.details,
                  price: payload.price,
                  Experience: payload.Experience,
                  rating: s.rating || 0,
                  images: payload.images,
                  slots: [payload.schedule],
                }
              : s
          )
        );
        toast.success("Trainer updated");
      } else {
        const created = await postRequest("/api/trainer", payload);
        const newStable = {
          title: payload.title,
          details: payload.details,
          price: payload.price,
          Experience: payload.Experience,
          rating: 0,
          images: uploadedUrls,
          slots: [payload.schedule],
        };
        setStables((prev) => [newStable, ...prev]);
        toast.success("Trainer created");
      }

      setEditingId(null);
      setForm({ title: "", details: "", price: "", Experience: "", images: [], slots: [] });
      setImagePreviews([]);
      setSlotInput({ day: "", startTime: "", endTime: "" });
      setPrevImages([]);
      setShowModal(false);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to submit trainer", err);
      // Show more specific error if it's the "No files provided" error
      if (
        err &&
        typeof err.message === "string" &&
        err.message.toLowerCase().includes("no files provided")
      ) {
        toast.error("Please provide at least one image.");
      } else {
        toast.error("Action failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteRequest(`/api/trainer/${id}`);
      setStables((prev) => prev.filter((s) => s.id !== id));
      toast.success("Trainer deleted");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to delete trainer", e);
      toast.error("Delete failed");
    }
  };

  // For simplicity, edit just fills the form and removes the old one
  const handleEdit = (stable) => {
    setForm({
      title: stable.title,
      details: stable.details,
      price: stable.price,
      Experience: stable.Experience || "",
      images: [],
      slots: stable.slots || [],
    });
    setImagePreviews(stable.images);
    setPrevImages(stable.images || []);
    setSlotInput({ day: "", startTime: "", endTime: "" });
    setEditingId(stable.id);
    setShowModal(true);
  };

  // Load trainers by current user
  useEffect(() => {
    async function loadByUser() {
      const tokenData = getUserData();
      const userId = tokenData?.id || null;
      if (!userId) return;
      try {
        setLoadingList(true);
        const res = await fetch(`/api/trainer?userId=${userId}`);
        const list = await res.json();
        if (Array.isArray(list)) {
          const mapped = list.map((t) => ({
            id: t._id,
            title: t.title,
            details: t.details,
            price: t.price,
            Experience: t.Experience || "",
            rating: 0,
            images: Array.isArray(t.images) ? t.images : [],
            slots: t.schedule ? [t.schedule] : [],
          }));
          setStables(mapped);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load trainers", e);
      } finally {
        setLoadingList(false);
      }
    }
    loadByUser();
  }, []);

  // Slot input handlers
  const handleSlotInputChange = (e) => {
    const { name, value } = e.target;
    setSlotInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSlot = () => {
    if (!slotInput.day || !slotInput.startTime || !slotInput.endTime) return;
    setForm((prev) => ({
      ...prev,
      slots: [...(prev.slots || []), { ...slotInput }],
    }));
    setSlotInput({ day: "", startTime: "", endTime: "" });
  };

  const handleDeleteSlot = (idx) => {
    setForm((prev) => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== idx),
    }));
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
          <div
            key={stable.id}
            className="bg-white rounded-lg border border-[color:var(--primary)] shadow-sm p-4 relative"
          >
            <div className="relative w-full h-40 mb-3 rounded overflow-hidden bg-gray-100">
              {stable.images && stable.images.length > 0 ? (
                <img
                  src={stable.images[0]}
                  alt={stable.title}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-brand/40">
                  No Image
                </div>
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
            {stable.Experience && (
              <p className="text-xs text-brand/70 mb-2">
                <span className="font-semibold">Experience:</span> {stable.Experience}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-brand font-bold text-base">
                {stable.price ? `$. ${stable.price.toLocaleString()}` : ""}
              </span>
              <StarRating rating={stable.rating} />
            </div>
            {stable.slots && stable.slots.length > 0 && (
              <div className="mt-2">
                <span className="text-xs font-semibold text-brand/70">Slots:</span>
                <ul className="text-xs text-brand/80 mt-1 space-y-1">
                  {stable.slots.map((slot, idx) => (
                    <li key={idx}>
                      {slot.day} - {slot.startTime} to {slot.endTime}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
                setForm({ title: "", details: "", price: "", Experience: "", images: [], slots: [] });
                setImagePreviews([]);
                setSlotInput({ day: "", startTime: "", endTime: "" });
                setPrevImages([]);
              }}
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-xl font-semibold text-brand mb-4">{editingId ? 'Edit Trainer' : 'Add New Trainer'}</h3>
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
                <label className="block text-sm font-medium text-brand mb-1">Experience</label>
                <input
                  type="text"
                  name="Experience"
                  value={form.Experience}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)]"
                  placeholder="e.g. 5 years, 2 years with horses, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand mb-1">Price/hour</label>
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
              {/* Slots Field */}
              <div>
                <label className="block text-sm font-medium text-brand mb-1">Slots</label>
                <div className="flex gap-2 mb-2">
                  <select
                    name="day"
                    value={slotInput.day}
                    onChange={handleSlotInputChange}
                    className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)]"
                  >
                    <option value="">Day</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                  <input
                    type="time"
                    name="startTime"
                    value={slotInput.startTime}
                    onChange={handleSlotInputChange}
                    className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)]"
                    placeholder="Start Time"
                  />
                  <input
                    type="time"
                    name="endTime"
                    value={slotInput.endTime}
                    onChange={handleSlotInputChange}
                    className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)]"
                    placeholder="End Time"
                  />
                  <button
                    type="button"
                    className="p-1 rounded bg-[color:var(--primary)] text-white hover:bg-[color:var(--primary)]/90 flex items-center"
                    onClick={handleAddSlot}
                    title="Add Slot"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {form.slots && form.slots.length > 0 && (
                  <ul className="space-y-1">
                    {form.slots.map((slot, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs bg-gray-50 px-2 py-1 rounded">
                        <span>
                          {slot.day} - {slot.startTime} to {slot.endTime}
                        </span>
                        <button
                          type="button"
                          className="ml-1 text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteSlot(idx)}
                          title="Delete Slot"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {/* End Slots Field */}
              <div>
                <label className="block text-sm font-medium text-brand mb-1">Images</label>
                <input
                  type="file"
                  name="images"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="w-full text-sm"
                  required={!editingId ? imagePreviews.length === 0 : false}
                />
                {(imagePreviews.length > 0 || (editingId && prevImages.length > 0)) && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {(imagePreviews.length > 0 ? imagePreviews : prevImages).map((src, idx) => (
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
                disabled={submitting}
                className="w-full py-2 rounded bg-[color:var(--primary)] text-white font-medium hover:bg-[color:var(--primary)]/90 transition disabled:opacity-60"
              >
                {submitting ? "Saving…" : editingId ? "Update" : "Save"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
