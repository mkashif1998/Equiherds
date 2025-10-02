"use client";

import { useEffect, useState } from "react";
import { Edit, Trash, Plus, X } from "lucide-react";
import { Checkbox } from "antd";
import { getRequest, postRequest, putRequest, deleteRequest, uploadFiles } from "@/service";
import { getUserData } from "@/app/utils/localStorage";
import LocationPicker from "../components/LocationPicker";

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
    location: "",
    coordinates: null,
    images: [],
    slots: [],
    priceRates: [],
    status: "active",
    // Short term stay pricing
    shortTermStay: {
      inStableStraw: false,
      inStableShavings: false,
      inFieldAlone: false,
      inFieldHerd: false,
      inStableStrawPrice: "",
      inStableShavingsPrice: "",
      inFieldAlonePrice: "",
      inFieldHerdPrice: ""
    },
    // Long term stay options
    longTermStay: {
      inStableStraw: false,
      inStableShavings: false,
      inFieldAlone: false,
      inFieldHerd: false,
      // Long term stay pricing
      inStableStrawPrice: "",
      inStableShavingsPrice: "",
      inFieldAlonePrice: "",
      inFieldHerdPrice: ""
    },
    // Stallions
    stallionsAccepted: false,
    stallionsPrice: "",
    // Event pricing
    eventPricing: {
      eventingCourse: false,
      canterTrack: false,
      jumpingTrack: false,
      dressageTrack: false,
      eventingCoursePrice: "",
      canterTrackPrice: "",
      jumpingTrackPrice: "",
      dressageTrackPrice: ""
    }
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
    console.log('Input change:', name, value); // Debug log
    
    // Handle nested field names like "shortTermStay.inStableStrawPrice"
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setForm((prev) => {
        const newForm = {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value
          }
        };
        console.log('Updated form:', newForm); // Debug log
        return newForm;
      });
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (fieldPath, checked) => {
    const pathParts = fieldPath.split('.');
    
    if (pathParts.length === 2) {
      const [section, field] = pathParts;
      setForm((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: checked
        }
      }));
    } else if (fieldPath === 'stallionsAccepted') {
      setForm((prev) => ({
        ...prev,
        stallionsAccepted: checked,
        stallionsPrice: checked ? prev.stallionsPrice : ""
      }));
    }
  };

  const handleLocationChange = (coordinates) => {
    setForm((prev) => ({ ...prev, coordinates }));
  };

  const handleLocationTextChange = (locationText) => {
    setForm((prev) => ({ ...prev, location: locationText }));
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
      !form.details ||
      !form.location ||
      !form.coordinates
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
        location: String(form.location).trim(),
        coordinates: form.coordinates ? {
          lat: form.coordinates.lat,
          lng: form.coordinates.lng
        } : null,
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
        // New fields
        shortTermStay: {
          inStableStraw: Boolean(form.shortTermStay.inStableStraw),
          inStableShavings: Boolean(form.shortTermStay.inStableShavings),
          inFieldAlone: Boolean(form.shortTermStay.inFieldAlone),
          inFieldHerd: Boolean(form.shortTermStay.inFieldHerd),
          inStableStrawPrice: form.shortTermStay.inStableStraw && form.shortTermStay.inStableStrawPrice ? Number(form.shortTermStay.inStableStrawPrice) : null,
          inStableShavingsPrice: form.shortTermStay.inStableShavings && form.shortTermStay.inStableShavingsPrice ? Number(form.shortTermStay.inStableShavingsPrice) : null,
          inFieldAlonePrice: form.shortTermStay.inFieldAlone && form.shortTermStay.inFieldAlonePrice ? Number(form.shortTermStay.inFieldAlonePrice) : null,
          inFieldHerdPrice: form.shortTermStay.inFieldHerd && form.shortTermStay.inFieldHerdPrice ? Number(form.shortTermStay.inFieldHerdPrice) : null
        },
        longTermStay: {
          inStableStraw: Boolean(form.longTermStay.inStableStraw),
          inStableShavings: Boolean(form.longTermStay.inStableShavings),
          inFieldAlone: Boolean(form.longTermStay.inFieldAlone),
          inFieldHerd: Boolean(form.longTermStay.inFieldHerd),
          // Long term stay pricing
          inStableStrawPrice: form.longTermStay.inStableStraw && form.longTermStay.inStableStrawPrice ? Number(form.longTermStay.inStableStrawPrice) : null,
          inStableShavingsPrice: form.longTermStay.inStableShavings && form.longTermStay.inStableShavingsPrice ? Number(form.longTermStay.inStableShavingsPrice) : null,
          inFieldAlonePrice: form.longTermStay.inFieldAlone && form.longTermStay.inFieldAlonePrice ? Number(form.longTermStay.inFieldAlonePrice) : null,
          inFieldHerdPrice: form.longTermStay.inFieldHerd && form.longTermStay.inFieldHerdPrice ? Number(form.longTermStay.inFieldHerdPrice) : null
        },
        stallionsAccepted: Boolean(form.stallionsAccepted),
        stallionsPrice: form.stallionsAccepted && form.stallionsPrice ? Number(form.stallionsPrice) : null,
        eventPricing: {
          eventingCourse: Boolean(form.eventPricing.eventingCourse),
          canterTrack: Boolean(form.eventPricing.canterTrack),
          jumpingTrack: Boolean(form.eventPricing.jumpingTrack),
          dressageTrack: Boolean(form.eventPricing.dressageTrack),
          eventingCoursePrice: form.eventPricing.eventingCourse && form.eventPricing.eventingCoursePrice ? Number(form.eventPricing.eventingCoursePrice) : null,
          canterTrackPrice: form.eventPricing.canterTrack && form.eventPricing.canterTrackPrice ? Number(form.eventPricing.canterTrackPrice) : null,
          jumpingTrackPrice: form.eventPricing.jumpingTrack && form.eventPricing.jumpingTrackPrice ? Number(form.eventPricing.jumpingTrackPrice) : null,
          dressageTrackPrice: form.eventPricing.dressageTrack && form.eventPricing.dressageTrackPrice ? Number(form.eventPricing.dressageTrackPrice) : null
        }
      };

      // Safety: ensure no stray top-level fields leak into payload
      // In case something upstream added these accidentally
      if (Object.prototype.hasOwnProperty.call(payload, 'RateType')) delete payload.RateType;
      // ensure array shape
      if (!Array.isArray(payload.PriceRate)) payload.PriceRate = [];

      let saved;
      if (editingId) {
        console.log("payload",payload);
        saved = await putRequest(`/api/stables/${editingId}`, payload);
      } else {
        saved = await postRequest("/api/stables", payload);
      }

      // Always refresh from server to avoid any local mismatches
      await loadStables();

      setForm({ 
        title: "", details: "", location: "", coordinates: null, images: [], slots: [], priceRates: [], status: "active",
        shortTermStay: {
          inStableStraw: false,
          inStableShavings: false,
          inFieldAlone: false,
          inFieldHerd: false,
          inStableStrawPrice: "",
          inStableShavingsPrice: "",
          inFieldAlonePrice: "",
          inFieldHerdPrice: ""
        },
        longTermStay: {
          inStableStraw: false,
          inStableShavings: false,
          inFieldAlone: false,
          inFieldHerd: false,
          inStableStrawPrice: "",
          inStableShavingsPrice: "",
          inFieldAlonePrice: "",
          inFieldHerdPrice: ""
        },
        stallionsAccepted: false,
        stallionsPrice: "",
        eventPricing: {
          eventingCourse: false,
          canterTrack: false,
          jumpingTrack: false,
          dressageTrack: false,
          eventingCoursePrice: "",
          canterTrackPrice: "",
          jumpingTrackPrice: "",
          dressageTrackPrice: ""
        }
      });
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
      location: stable.location || "",
      coordinates: stable.coordinates || null,
      images: [],
      slots: stable.slots || [],
      priceRates: stable.priceRates || [],
      status: stable.status || "active",
      shortTermStay: stable.shortTermStay || {
        inStableStraw: false,
        inStableShavings: false,
        inFieldAlone: false,
        inFieldHerd: false,
        inStableStrawPrice: "",
        inStableShavingsPrice: "",
        inFieldAlonePrice: "",
        inFieldHerdPrice: ""
      },
      longTermStay: stable.longTermStay || {
        inStableStraw: false,
        inStableShavings: false,
        inFieldAlone: false,
        inFieldHerd: false,
        inStableStrawPrice: "",
        inStableShavingsPrice: "",
        inFieldAlonePrice: "",
        inFieldHerdPrice: ""
      },
      stallionsAccepted: stable.stallionsAccepted || false,
      stallionsPrice: stable.stallionsPrice || "",
      eventPricing: stable.eventPricing || {
        eventingCourse: false,
        canterTrack: false,
        jumpingTrack: false,
        dressageTrack: false,
        eventingCoursePrice: "",
        canterTrackPrice: "",
        jumpingTrackPrice: "",
        dressageTrackPrice: ""
      }
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
      
      // Only use the query parameter style to get stables by userId
      let data = await getRequest(`/api/stables?userId=${userId}`);
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
        location: s?.Location || s?.location || "",
        coordinates: s?.Coordinates || s?.coordinates || null,
        images: Array.isArray(s?.image) ? s.image : [],
        rating: typeof s?.Rating === "number" ? s.Rating : 0,
        // Derive display price from PriceRate if available
        price,
        priceRates,
        status: s?.status || "active",
        slots: Array.isArray(s?.Slotes)
          ? s.Slotes.map((sl) => ({ day: sl?.date || "", startTime: sl?.startTime || "", endTime: sl?.endTime || "" }))
          : [],
        // New fields
        shortTermStay: s?.shortTermStay || {
          inStableStraw: false,
          inStableShavings: false,
          inFieldAlone: false,
          inFieldHerd: false,
          inStableStrawPrice: "",
          inStableShavingsPrice: "",
          inFieldAlonePrice: "",
          inFieldHerdPrice: ""
        },
        longTermStay: s?.longTermStay || {
          inStableStraw: false,
          inStableShavings: false,
          inFieldAlone: false,
          inFieldHerd: false,
          inStableStrawPrice: "",
          inStableShavingsPrice: "",
          inFieldAlonePrice: "",
          inFieldHerdPrice: ""
        },
        stallionsAccepted: s?.stallionsAccepted || false,
        stallionsPrice: s?.stallionsPrice || "",
        eventPricing: s?.eventPricing || {
          eventingCourse: false,
          canterTrack: false,
          jumpingTrack: false,
          dressageTrack: false,
          eventingCoursePrice: "",
          canterTrackPrice: "",
          jumpingTrackPrice: "",
          dressageTrackPrice: ""
        }
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
            setForm({ 
        title: "", details: "", location: "", coordinates: null, images: [], slots: [], priceRates: [], status: "active",
        shortTermStay: {
          inStableStraw: false,
          inStableShavings: false,
          inFieldAlone: false,
          inFieldHerd: false,
          inStableStrawPrice: "",
          inStableShavingsPrice: "",
          inFieldAlonePrice: "",
          inFieldHerdPrice: ""
        },
        longTermStay: {
          inStableStraw: false,
          inStableShavings: false,
          inFieldAlone: false,
          inFieldHerd: false,
          inStableStrawPrice: "",
          inStableShavingsPrice: "",
          inFieldAlonePrice: "",
          inFieldHerdPrice: ""
        },
        stallionsAccepted: false,
        stallionsPrice: "",
        eventPricing: {
          eventingCourse: false,
          canterTrack: false,
          jumpingTrack: false,
          dressageTrack: false,
          eventingCoursePrice: "",
          canterTrackPrice: "",
          jumpingTrackPrice: "",
          dressageTrackPrice: ""
        }
      });
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
            {stable.location && (
              <p className="text-sm text-brand/70 mb-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {stable.location}
              </p>
            )}
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
            
            {/* Short Term Stay Pricing */}
            {(stable.shortTermStay && Object.values(stable.shortTermStay).some(option => option)) && (
              <div className="mt-2">
                <span className="text-xs font-semibold text-brand/70">Short Term Stay:</span>
                <div className="text-xs text-brand/80 mt-1 space-y-1">
                  {stable.shortTermStay.inStableStraw && (
                    <div className="flex items-center justify-between">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Stable (straw)</span>
                      {stable.shortTermStay.inStableStrawPrice && (
                        <span className="text-blue-700 font-medium">${Number(stable.shortTermStay.inStableStrawPrice).toLocaleString()}/day</span>
                      )}
                    </div>
                  )}
                  {stable.shortTermStay.inStableShavings && (
                    <div className="flex items-center justify-between">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Stable (shavings)</span>
                      {stable.shortTermStay.inStableShavingsPrice && (
                        <span className="text-blue-700 font-medium">${Number(stable.shortTermStay.inStableShavingsPrice).toLocaleString()}/day</span>
                      )}
                    </div>
                  )}
                  {stable.shortTermStay.inFieldAlone && (
                    <div className="flex items-center justify-between">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Field (alone)</span>
                      {stable.shortTermStay.inFieldAlonePrice && (
                        <span className="text-blue-700 font-medium">${Number(stable.shortTermStay.inFieldAlonePrice).toLocaleString()}/day</span>
                      )}
                    </div>
                  )}
                  {stable.shortTermStay.inFieldHerd && (
                    <div className="flex items-center justify-between">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Field (herd)</span>
                      {stable.shortTermStay.inFieldHerdPrice && (
                        <span className="text-blue-700 font-medium">${Number(stable.shortTermStay.inFieldHerdPrice).toLocaleString()}/day</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Long Term Stay Options */}
            {(stable.longTermStay && Object.values(stable.longTermStay).some(option => option)) && (
              <div className="mt-2">
                <span className="text-xs font-semibold text-brand/70">Long Term Available:</span>
                <div className="text-xs text-brand/80 mt-1 space-y-1">
                  {stable.longTermStay.inStableStraw && (
                    <div className="flex items-center justify-between">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Stable (straw)</span>
                      {stable.longTermStay.inStableStrawPrice && (
                        <span className="text-green-700 font-medium">${Number(stable.longTermStay.inStableStrawPrice).toLocaleString()}</span>
                      )}
                    </div>
                  )}
                  {stable.longTermStay.inStableShavings && (
                    <div className="flex items-center justify-between">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Stable (shavings)</span>
                      {stable.longTermStay.inStableShavingsPrice && (
                        <span className="text-green-700 font-medium">${Number(stable.longTermStay.inStableShavingsPrice).toLocaleString()}</span>
                      )}
                    </div>
                  )}
                  {stable.longTermStay.inFieldAlone && (
                    <div className="flex items-center justify-between">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Field (alone)</span>
                      {stable.longTermStay.inFieldAlonePrice && (
                        <span className="text-green-700 font-medium">${Number(stable.longTermStay.inFieldAlonePrice).toLocaleString()}</span>
                      )}
                    </div>
                  )}
                  {stable.longTermStay.inFieldHerd && (
                    <div className="flex items-center justify-between">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Field (herd)</span>
                      {stable.longTermStay.inFieldHerdPrice && (
                        <span className="text-green-700 font-medium">${Number(stable.longTermStay.inFieldHerdPrice).toLocaleString()}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Stallions */}
            {stable.stallionsAccepted && (
              <div className="mt-2">
                <span className="text-xs font-semibold text-brand/70">Stallions:</span>
                <span className="text-xs text-brand/80 ml-1">
                  Accepted {stable.stallionsPrice ? `(+$${Number(stable.stallionsPrice).toLocaleString()})` : ''}
                </span>
              </div>
            )}
            
            {/* Event Pricing */}
            {(stable.eventPricing && Object.values(stable.eventPricing).some(option => option)) && (
              <div className="mt-2">
                <span className="text-xs font-semibold text-brand/70">Events:</span>
                <div className="text-xs text-brand/80 mt-1 space-y-1">
                  {stable.eventPricing.eventingCourse && (
                    <div className="flex items-center justify-between">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">Eventing Course</span>
                      {stable.eventPricing.eventingCoursePrice && (
                        <span className="text-purple-700 font-medium">${Number(stable.eventPricing.eventingCoursePrice).toLocaleString()}</span>
                      )}
                    </div>
                  )}
                  {stable.eventPricing.canterTrack && (
                    <div className="flex items-center justify-between">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">Canter Track</span>
                      {stable.eventPricing.canterTrackPrice && (
                        <span className="text-purple-700 font-medium">${Number(stable.eventPricing.canterTrackPrice).toLocaleString()}</span>
                      )}
                    </div>
                  )}
                  {stable.eventPricing.jumpingTrack && (
                    <div className="flex items-center justify-between">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">Jumping Track</span>
                      {stable.eventPricing.jumpingTrackPrice && (
                        <span className="text-purple-700 font-medium">${Number(stable.eventPricing.jumpingTrackPrice).toLocaleString()}</span>
                      )}
                    </div>
                  )}
                  {stable.eventPricing.dressageTrack && (
                    <div className="flex items-center justify-between">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">Dressage Track</span>
                      {stable.eventPricing.dressageTrackPrice && (
                        <span className="text-purple-700 font-medium">${Number(stable.eventPricing.dressageTrackPrice).toLocaleString()}</span>
                      )}
                    </div>
                  )}
                </div>
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
          <div className="bg-white rounded-lg shadow-lg py-8 px-4 w-full max-w-4xl relative overflow-x-hidden">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => {
                setShowModal(false);
                setForm({ 
        title: "", details: "", location: "", coordinates: null, images: [], slots: [], priceRates: [], status: "active",
        shortTermStay: {
          inStableStraw: false,
          inStableShavings: false,
          inFieldAlone: false,
          inFieldHerd: false,
          inStableStrawPrice: "",
          inStableShavingsPrice: "",
          inFieldAlonePrice: "",
          inFieldHerdPrice: ""
        },
        longTermStay: {
          inStableStraw: false,
          inStableShavings: false,
          inFieldAlone: false,
          inFieldHerd: false,
          inStableStrawPrice: "",
          inStableShavingsPrice: "",
          inFieldAlonePrice: "",
          inFieldHerdPrice: ""
        },
        stallionsAccepted: false,
        stallionsPrice: "",
        eventPricing: {
          eventingCourse: false,
          canterTrack: false,
          jumpingTrack: false,
          dressageTrack: false,
          eventingCoursePrice: "",
          canterTrackPrice: "",
          jumpingTrackPrice: "",
          dressageTrackPrice: ""
        }
      });
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
                    placeholder="Price per day"
                    min={0}
                  />
                  <select
                    name="rateType"
                    value={priceRateInput.rateType}
                    onChange={handlePriceRateInputChange}
                    className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] flex-1 min-w-0"
                  >
                    <option value="">Select Rate</option>
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
              
              {/* Stay Pricing - 4 Box Layout */}
              <div className="border-t pt-4">
                <h4 className="text-lg font-semibold text-brand mb-3">Stay Pricing</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Short Term Stay Pricing */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h5 className="text-md font-semibold text-brand mb-3">Short Term Stay</h5>
                    <div className="space-y-3">
                      {/* In Stable (on straw) */}
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={form.shortTermStay?.inStableStraw || false}
                          onChange={(e) => handleCheckboxChange('shortTermStay.inStableStraw', e.target.checked)}
                        >
                          <span className="text-sm text-brand">In Stable (on straw)</span>
                        </Checkbox>
                        {form.shortTermStay?.inStableStraw && (
                          <input
                            type="number"
                            name="shortTermStay.inStableStrawPrice"
                            value={form.shortTermStay.inStableStrawPrice || ""}
                            onChange={handleInputChange}
                            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] w-32"
                            placeholder="Price per day"
                            min="0"
                          />
                        )}
                      </div>
                      
                      {/* In Stable (on shavings) */}
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={form.shortTermStay?.inStableShavings || false}
                          onChange={(e) => handleCheckboxChange('shortTermStay.inStableShavings', e.target.checked)}
                        >
                          <span className="text-sm text-brand">In Stable (on shavings)</span>
                        </Checkbox>
                        {form.shortTermStay?.inStableShavings && (
                          <input
                            type="number"
                            name="shortTermStay.inStableShavingsPrice"
                            value={form.shortTermStay.inStableShavingsPrice || ""}
                            onChange={handleInputChange}
                            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] w-32"
                            placeholder="Price per day"
                            min="0"
                          />
                        )}
                      </div>
                      
                      {/* In Field (alone) */}
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={form.shortTermStay?.inFieldAlone || false}
                          onChange={(e) => handleCheckboxChange('shortTermStay.inFieldAlone', e.target.checked)}
                        >
                          <span className="text-sm text-brand">In Field (alone)</span>
                        </Checkbox>
                        {form.shortTermStay?.inFieldAlone && (
                          <input
                            type="number"
                            name="shortTermStay.inFieldAlonePrice"
                            value={form.shortTermStay.inFieldAlonePrice || ""}
                            onChange={handleInputChange}
                            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] w-32"
                            placeholder="Price per day"
                            min="0"
                          />
                        )}
                      </div>
                      
                      {/* In Field (herd) */}
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={form.shortTermStay?.inFieldHerd || false}
                          onChange={(e) => handleCheckboxChange('shortTermStay.inFieldHerd', e.target.checked)}
                        >
                          <span className="text-sm text-brand">In Field (herd)</span>
                        </Checkbox>
                        {form.shortTermStay?.inFieldHerd && (
                          <input
                            type="number"
                            name="shortTermStay.inFieldHerdPrice"
                            value={form.shortTermStay.inFieldHerdPrice || ""}
                            onChange={handleInputChange}
                            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] w-32"
                            placeholder="Price per day"
                            min="0"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Long Term Stay Options */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h5 className="text-md font-semibold text-brand mb-3">Long Term Stay Options</h5>
                    <div className="space-y-3">
                      {/* In Stable (on straw) */}
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={form.longTermStay?.inStableStraw || false}
                          onChange={(e) => handleCheckboxChange('longTermStay.inStableStraw', e.target.checked)}
                        >
                          <span className="text-sm text-brand">In Stable (on straw)</span>
                        </Checkbox>
                        {form.longTermStay?.inStableStraw && (
                          <input
                            type="number"
                            name="longTermStay.inStableStrawPrice"
                            value={form.longTermStay.inStableStrawPrice || ""}
                            onChange={handleInputChange}
                            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] w-32"
                            placeholder="Price per day"
                            min="0"
                          />
                        )}
                      </div>
                      
                      {/* In Stable (on shavings) */}
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={form.longTermStay?.inStableShavings || false}
                          onChange={(e) => handleCheckboxChange('longTermStay.inStableShavings', e.target.checked)}
                        >
                          <span className="text-sm text-brand">In Stable (on shavings)</span>
                        </Checkbox>
                        {form.longTermStay?.inStableShavings && (
                          <input
                            type="number"
                            name="longTermStay.inStableShavingsPrice"
                            value={form.longTermStay.inStableShavingsPrice || ""}
                            onChange={handleInputChange}
                            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] w-32"
                            placeholder="Price per day"
                            min="0"
                          />
                        )}
                      </div>
                      
                      {/* In Field (alone) */}
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={form.longTermStay?.inFieldAlone || false}
                          onChange={(e) => handleCheckboxChange('longTermStay.inFieldAlone', e.target.checked)}
                        >
                          <span className="text-sm text-brand">In Field (alone)</span>
                        </Checkbox>
                        {form.longTermStay?.inFieldAlone && (
                          <input
                            type="number"
                            name="longTermStay.inFieldAlonePrice"
                            value={form.longTermStay.inFieldAlonePrice || ""}
                            onChange={handleInputChange}
                            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] w-32"
                            placeholder="Price per day"
                            min="0"
                          />
                        )}
                      </div>
                      
                      {/* In Field (herd) */}
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={form.longTermStay?.inFieldHerd || false}
                          onChange={(e) => handleCheckboxChange('longTermStay.inFieldHerd', e.target.checked)}
                        >
                          <span className="text-sm text-brand">In Field (herd)</span>
                        </Checkbox>
                        {form.longTermStay?.inFieldHerd && (
                          <input
                            type="number"
                            name="longTermStay.inFieldHerdPrice"
                            value={form.longTermStay.inFieldHerdPrice || ""}
                            onChange={handleInputChange}
                            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] w-32"
                            placeholder="Price per day"
                            min="0"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              {/* Additional Services - 2 Box Layout */}
              <div className="border-t pt-4">
                <h4 className="text-lg font-semibold text-brand mb-3">Additional Services</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Stallions */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h5 className="text-md font-semibold text-brand mb-3">Stallions</h5>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={form.stallionsAccepted || false}
                          onChange={(e) => handleCheckboxChange('stallionsAccepted', e.target.checked)}
                        >
                          <span className="text-sm text-brand">Stallions Accepted</span>
                        </Checkbox>
                        {form.stallionsAccepted && (
                          <input
                            type="number"
                            name="stallionsPrice"
                            value={form.stallionsPrice || ""}
                            onChange={handleInputChange}
                            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] w-32"
                            placeholder="Price per day"
                            min="0"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Event Pricing */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h5 className="text-md font-semibold text-brand mb-3">Event Pricing</h5>
                    <div className="space-y-3">
                      {/* Eventing Course */}
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={form.eventPricing?.eventingCourse || false}
                          onChange={(e) => handleCheckboxChange('eventPricing.eventingCourse', e.target.checked)}
                        >
                          <span className="text-sm text-brand">Eventing Course</span>
                        </Checkbox>
                        {form.eventPricing?.eventingCourse && (
                          <input
                            type="number"
                            name="eventPricing.eventingCoursePrice"
                            value={form.eventPricing.eventingCoursePrice || ""}
                            onChange={handleInputChange}
                            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] w-32"
                            placeholder="Price per day"
                            min="0"
                          />
                        )}
                      </div>
                      
                      {/* Canter Track */}
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={form.eventPricing?.canterTrack || false}
                          onChange={(e) => handleCheckboxChange('eventPricing.canterTrack', e.target.checked)}
                        >
                          <span className="text-sm text-brand">Canter Track</span>
                        </Checkbox>
                        {form.eventPricing?.canterTrack && (
                          <input
                            type="number"
                            name="eventPricing.canterTrackPrice"
                            value={form.eventPricing.canterTrackPrice || ""}
                            onChange={handleInputChange}
                            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] w-32"
                            placeholder="Price per day"
                            min="0"
                          />
                        )}
                      </div>
                      
                      {/* Jumping Track */}
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={form.eventPricing?.jumpingTrack || false}
                          onChange={(e) => handleCheckboxChange('eventPricing.jumpingTrack', e.target.checked)}
                        >
                          <span className="text-sm text-brand">Jumping Track</span>
                        </Checkbox>
                        {form.eventPricing?.jumpingTrack && (
                          <input
                            type="number"
                            name="eventPricing.jumpingTrackPrice"
                            value={form.eventPricing.jumpingTrackPrice || ""}
                            onChange={handleInputChange}
                            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] w-32"
                            placeholder="Price per day"
                            min="0"
                          />
                        )}
                      </div>
                      
                      {/* Dressage Track */}
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={form.eventPricing?.dressageTrack || false}
                          onChange={(e) => handleCheckboxChange('eventPricing.dressageTrack', e.target.checked)}
                        >
                          <span className="text-sm text-brand">Dressage Track</span>
                        </Checkbox>
                        {form.eventPricing?.dressageTrack && (
                          <input
                            type="number"
                            name="eventPricing.dressageTrackPrice"
                            value={form.eventPricing.dressageTrackPrice || ""}
                            onChange={handleInputChange}
                            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] w-32"
                            placeholder="Price per day"
                            min="0"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] mb-3"
                  placeholder="Enter stable location (e.g., City, State, Address)"
                  required
                />
                <LocationPicker
                  onLocationChange={handleLocationChange}
                  onLocationTextChange={handleLocationTextChange}
                  initialLocation={form.coordinates}
                  initialLocationText={form.location}
                  height="250px"
                />
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
