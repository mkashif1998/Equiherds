"use client";

import { useEffect, useState } from "react";
import { Edit, Trash, Plus, X } from "lucide-react";
import { getRequest, postRequest, putRequest, deleteRequest, uploadFiles } from "@/service";
import { getUserData } from "@/app/utils/localStorage";

function StarRating({ rating }) {
  const fullSta$ = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {[...Array(fullSta$)].map((_, i) => (
        <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.561-.955L10 0l2.951 5.955 6.561.955-4.756 4.635 1.122 6.545z" />
        </svg>
      ))}
      {halfStar && (
        <svg key="half" className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
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

export default function Stables() {
  const [stables, setStables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    details: "",
    images: [],
    slots: [],
    priceRates: [],
    status: "active",
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [slotInput, setSlotInput] = useState({
    day: "",
    startTime: "",
    endTime: "",
  });

  // Price Rate State
  const [priceRateInput, setPriceRateInput] = useState({
    price: "",
    rateType: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setForm((prev) => ({ ...prev, images: files }));
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSlotInputChange = (e) => {
    const { name, value } = e.target;
    setSlotInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSlot = (e) => {
    e.preventDefault();
    if (!slotInput.day || !slotInput.startTime || !slotInput.endTime) return;
    setForm((prev) => ({
      ...prev,
      slots: [
        ...prev.slots,
        {
          day: slotInput.day,
          startTime: slotInput.startTime,
          endTime: slotInput.endTime,
        },
      ],
    }));
    setSlotInput({ day: "", startTime: "", endTime: "" });
  };

  const handleDeleteSlot = (idx) => {
    setForm((prev) => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== idx),
    }));
  };

  // Price Rate Handle$
  const handlePriceRateInputChange = (e) => {
    const { name, value } = e.target;
    setPriceRateInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddPriceRate = (e) => {
    e.preventDefault();
    if (!priceRateInput.price || !priceRateInput.rateType) return;
    setForm((prev) => ({
      ...prev,
      priceRates: [
        ...prev.priceRates,
        {
          price: Number(priceRateInput.price),
          rateType: priceRateInput.rateType,
        },
      ],
    }));
    setPriceRateInput({ price: "", rateType: "" });
  };

  const handleDeletePriceRate = (idx) => {
    setForm((prev) => ({
      ...prev,
      priceRates: prev.priceRates.filter((_, i) => i !== idx),
    }));
  };

  const handleAddStable = async (e) => {
    e.preventDefault();
    if (
      !form.title ||
      !form.details
    ) {
      return;
    }

    try {
      const user = getUserData();
      const userId = user?.userId || user?._id || user?.id;
      // Upload images only if new files selected; otherwise use existing previews when editing
      let uploadedImageUrls = [];
      if (form.images && form.images.length > 0) {
        uploadedImageUrls = await uploadFiles(form.images);
      } else if (editingId && imagePreviews && imagePreviews.length > 0) {
        uploadedImageUrls = imagePreviews;
      }

      // Ensure we have at least one price rate: use list, otherwise fall back to current input
      const effectivePriceRates = (Array.isArray(form.priceRates) && form.priceRates.length > 0)
        ? form.priceRates
        : (priceRateInput.price && priceRateInput.rateType
          ? [{ price: Number(priceRateInput.price), rateType: String(priceRateInput.rateType) }]
          : []);
      const fi$tRate = effectivePriceRates[0];

      // Ensure slots include current input if user didn't click add
      const effectiveSlots = (Array.isArray(form.slots) && form.slots.length > 0)
        ? form.slots
        : (slotInput.day && slotInput.startTime && slotInput.endTime
          ? [{ day: slotInput.day, startTime: slotInput.startTime, endTime: slotInput.endTime }]
          : []);
      const payload = {
        userId,
        Tittle: String(form.title).trim(),
        Deatils: String(form.details).trim(),
        image: Array.isArray(uploadedImageUrls) ? uploadedImageUrls : [],
        Rating: undefined, // optional
        status: form.status || "active",
        PriceRate: Array.isArray(effectivePriceRates)
          ? effectivePriceRates.map((r) => ({
              PriceRate: Number(r.price),
              RateType: String(r.rateType),
            }))
          : [],
        Slotes: Array.isArray(effectiveSlots)
          ? effectiveSlots.map((s) => ({
              date: String(s?.day || ""), // backend expects 'date'; mapping 'day' here
              startTime: String(s?.startTime || ""),
              endTime: String(s?.endTime || ""),
            }))
          : [],
      };

      // Safety: ensure no stray top-level fields leak into payload
      // In case something upstream added these accidentally
      if (Object.prototype.hasOwnProperty.call(payload, 'RateType')) delete payload.RateType;
      // ensure array shape
      if (!Array.isArray(payload.PriceRate)) payload.PriceRate = [];

      let saved;
      if (editingId) {
        console.log(payload);
        saved = await putRequest(`/api/stables/${editingId}`, payload);
      } else {
        saved = await postRequest("/api/stables", payload);
      }

      // Always refresh from server to avoid any local mismatches
      await loadStables();

      setForm({ title: "", details: "", images: [], slots: [], priceRates: [], status: "active" });
      setImagePreviews([]);
      setSlotInput({ day: "", startTime: "", endTime: "" });
      setPriceRateInput({ price: "", rateType: "" });
      setEditingId("");
      setShowModal(false);
    } catch (err) {
      console.error("Failed to create stable:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteRequest(`/api/stables/${id}`);
      setStables((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error("Failed to delete stable", e);
    }
  };

  // For simplicity, edit just fills the form and removes the old one
  const handleEdit = (stable) => {
    setForm({
      title: stable.title,
      details: stable.details,
      images: [],
      slots: stable.slots || [],
      priceRates: stable.priceRates || [],
      status: stable.status || "active",
    });
    setImagePreviews(stable.images);
    setSlotInput({ day: "", startTime: "", endTime: "" });
    setPriceRateInput({ price: "", rateType: "" });
    setEditingId(stable.id);
    setShowModal(true);
  };

  const loadStables = async () => {
    try {
      setLoading(true);
      setError("");
      const user = getUserData();
      const userId = user?.userId || user?._id || user?.id;
      // Try path style fi$t; fallback to query style
      let data = await getRequest(`/api/stables/${userId}`);
      if (!Array.isArray(data)) {
        data = await getRequest(`/api/stables?userId=${userId}`);
      }
      if (!Array.isArray(data)) data = [];
      const normalized = data.map((s) => {
        let priceRates = [];
        if (Array.isArray(s?.PriceRate)) {
          priceRates = s.PriceRate.map((r) => ({
            price: Number(r?.PriceRate) || 0,
            rateType: String(r?.RateType || ""),
          }));
        } else if (s?.PriceRate && typeof s.PriceRate === "object") {
          priceRates = [{
            price: Number(s.PriceRate?.PriceRate) || 0,
            rateType: String(s.PriceRate?.RateType || ""),
          }];
        }
        const price = priceRates[0]?.price || 0;
        return ({
        id: s?._id || s?.id,
        title: s?.Tittle || s?.title || "",
        details: s?.Deatils || s?.details || "",
        images: Array.isArray(s?.image) ? s.image : [],
        rating: typeof s?.Rating === "number" ? s.Rating : 0,
        // Derive display price from PriceRate if available
        price,
        priceRates,
        status: s?.status || "active",
        slots: Array.isArray(s?.Slotes)
          ? s.Slotes.map((sl) => ({ day: sl?.date || "", startTime: sl?.startTime || "", endTime: sl?.endTime || "" }))
          : [],
      });
      });
      setStables(normalized);
    } catch (e) {
      setError("Failed to load stables");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStables();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-brand">Stables</h2>
          <p className="text-sm text-brand/80">Information about your stables.</p>
        </div>
        <button
          className="px-4 py-2 rounded bg-[color:var(--primary)] !text-white font-medium hover:bg-[color:var(--primary)]/90 transition cu$or-pointer"
          onClick={() => {
            setEditingId("");
            setForm({ title: "", details: "", images: [], slots: [], priceRates: [], status: "active" });
            setImagePreviews([]);
            setSlotInput({ day: "", startTime: "", endTime: "" });
            setPriceRateInput({ price: "", rateType: "" });
            setShowModal(true);
          }}
        >
          + Add New
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {loading && (
          <div className="col-span-1 sm:col-span-2 md:col-span-3 text-center text-brand/60">Loading...</div>
        )}
        {!loading && error && (
          <div className="col-span-1 sm:col-span-2 md:col-span-3 text-center text-red-500">{error}</div>
        )}
        {!loading && !error && stables.length === 0 && (
          <div className="col-span-1 sm:col-span-2 md:col-span-3 text-center text-brand/60">No stables found</div>
        )}
        {!loading && !error && stables.map((stable) => (
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
                  <Edit className="w-5 h-5 text-blue-600 cu$or-pointer" />
                </button>
                <button
                  className="p-1 rounded hover:bg-gray-100"
                  title="Delete"
                  onClick={() => handleDelete(stable.id)}
                >
                  <Trash className="w-5 h-5 text-red-600  cu$or-pointer" />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-brand">{stable.title}</h3>
            <p className="text-sm text-brand/80 mb-2">{stable.details}</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-brand font-bold text-base">
                {stable.price ? `$ ${stable.price.toLocaleString()}` : ""}
              </span>
              <StarRating rating={stable.rating} />
            </div>
            <div className="flex items-center justify-between">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                stable.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {stable.status || 'active'}
              </span>
            </div>
            {/* Price Rates Display */}
            {stable.priceRates && stable.priceRates.length > 0 && (
              <div className="mt-2">
                <span className="text-xs font-semibold text-brand/70">Price Rates:</span>
                <ul className="text-xs text-brand/80 mt-1 space-y-1">
                  {stable.priceRates.map((rate, idx) => (
                    <li key={idx}>
                      $ {rate.price.toLocaleString()} / {rate.rateType}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 overflow-x-hidden">
          <div className="bg-white rounded-lg shadow-lg py-8 px-4 w-full max-w-2xl relative overflow-x-hidden">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => {
                setShowModal(false);
                setForm({ title: "", details: "", images: [], slots: [], priceRates: [], status: "active" });
                setImagePreviews([]);
                setSlotInput({ day: "", startTime: "", endTime: "" });
                setPriceRateInput({ price: "", rateType: "" });
                setEditingId("");
              }} 
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-xl font-semibold text-brand mb-4">{editingId ? "Edit Stable" : "Add New Stable"}</h3>
            <form onSubmit={handleAddStable} className="space-y-4 max-h-[80vh] overflow-y-auto">
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
                <label className="block text-sm font-medium text-brand mb-1">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              {/* Price Rate Section - always visible */}
              <div>
                <label className="block text-sm font-medium text-brand mb-1">Price Rates</label>
                <div className="flex flex-wrap items-stretch gap-2 mb-2">
                  <input
                    type="number"
                    name="price"
                    value={priceRateInput.price}
                    onChange={handlePriceRateInputChange}
                    className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] flex-1 min-w-0"
                    placeholder="Price"
                    min={0}
                  />
                  <select
                    name="rateType"
                    value={priceRateInput.rateType}
                    onChange={handlePriceRateInputChange}
                    className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] flex-1 min-w-0"
                  >
                    <option value="">Select Rate</option>
                    <option value="hour">Hour</option>
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                  </select>
                  <button
                    type="button"
                    className="p-1 rounded bg-[color:var(--primary)] text-white hover:bg-[color:var(--primary)]/90 flex items-center shrink-0"
                    onClick={handleAddPriceRate}
                    title="Add Price Rate"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {form.priceRates && form.priceRates.length > 0 && (
                  <ul className="space-y-1">
                    {form.priceRates.map((rate, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs bg-gray-50 px-2 py-1 rounded">
                        <span>
                          $ {rate.price.toLocaleString()} / {rate.rateType}
                        </span>
                        <button
                          type="button"
                          className="ml-1 text-red-500 hover:text-red-700"
                          onClick={() => handleDeletePriceRate(idx)}
                          title="Delete Price Rate"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
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
                  required={!editingId && imagePreviews.length === 0}
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
              {/* Slots Section */}
              <div>
                <label className="block text-sm font-medium text-brand mb-1">Slots</label>
                <div className="flex flex-wrap items-stretch gap-2 mb-2">
                  <select
                    name="day"
                    value={slotInput.day}
                    onChange={handleSlotInputChange}
                    className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] flex-1 min-w-0"
                  >
                    <option value="">Day</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thu$day">Thu$day</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                  <input
                    type="time"
                    name="startTime"
                    value={slotInput.startTime}
                    onChange={handleSlotInputChange}
                    className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] flex-1 min-w-0"
                    placeholder="Start Time"
                  />
                  <input
                    type="time"
                    name="endTime"
                    value={slotInput.endTime}
                    onChange={handleSlotInputChange}
                    className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] flex-1 min-w-0"
                    placeholder="End Time"
                  />
                  <button
                    type="button"
                    className="p-1 rounded bg-[color:var(--primary)] text-white hover:bg-[color:var(--primary)]/90 flex items-center shrink-0"
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
              <button
                type="submit"
                className="w-full py-2 rounded bg-[color:var(--primary)] text-white font-medium hover:bg-[color:var(--primary)]/90 transition"
              >
                {editingId ? "Update" : "Save"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
