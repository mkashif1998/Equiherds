"use client";

import { useEffect, useState } from "react";
import { Edit, Trash, Plus, X } from "lucide-react";
import { Checkbox, Tag, Input } from "antd";
import { getUserData } from "../utils/localStorage";
import { postRequest, uploadFiles, deleteRequest, putRequest } from "@/service";
import { toast } from "react-hot-toast";
import LocationPicker from "../components/LocationPicker";

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
        <svg key="half" className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
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
    location: "",
    coordinates: null,
    price: "",
    Experience: "",
    images: [],
    slots: [],
    status: "active",
    // Disciplines
    disciplines: {
      dressage: false,
      showJumping: false,
      eventing: false,
      endurance: false,
      western: false,
      vaulting: false,
      dressagePrice: "",
      showJumpingPrice: "",
      eventingPrice: "",
      endurancePrice: "",
      westernPrice: "",
      vaultingPrice: ""
    },
    // Training
    training: {
      onLocationLessons: false,
      lessonsOnTrainersLocation: false,
      onLocationLessonsPrice: "",
      lessonsOnTrainersLocationPrice: ""
    },
    // Competition coaching
    competitionCoaching: {
      onLocationCoaching: false,
      onLocationCoachingPrice: ""
    },
    // Diplomas
    diplomas: []
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [slotInput, setSlotInput] = useState({
    day: "",
    startTime: "",
    endTime: "",
  });
  const [diplomaInput, setDiplomaInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [editingId, setEditingId] = useState(null);
  // Store previous images for edit mode
  const [prevImages, setPrevImages] = useState([]);
  console.log("editingId", editingId);

  // Debug: Log form state changes
  useEffect(() => {
    console.log("Form state changed:", form);
  }, [form]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (fieldPath, checked) => {
    const pathParts = fieldPath.split('.');
    
    if (pathParts.length === 2) {
      const [section, field] = pathParts;
      setForm((prev) => ({
        ...prev,
        [section]: {
          dressage: false,
          showJumping: false,
          eventing: false,
          endurance: false,
          western: false,
          vaulting: false,
          dressagePrice: "",
          showJumpingPrice: "",
          eventingPrice: "",
          endurancePrice: "",
          westernPrice: "",
          vaultingPrice: "",
          onLocationLessons: false,
          lessonsOnTrainersLocation: false,
          onLocationLessonsPrice: "",
          lessonsOnTrainersLocationPrice: "",
          onLocationCoaching: false,
          onLocationCoachingPrice: "",
          ...prev[section],
          [field]: checked
        }
      }));
    }
  };

  const handleAddDiploma = () => {
    if (diplomaInput.trim() && !form.diplomas.includes(diplomaInput.trim())) {
      setForm((prev) => ({
        ...prev,
        diplomas: [...prev.diplomas, diplomaInput.trim()]
      }));
      setDiplomaInput("");
    }
  };

  const handleRemoveDiploma = (diplomaToRemove) => {
    setForm((prev) => ({
      ...prev,
      diplomas: prev.diplomas.filter(diploma => diploma !== diplomaToRemove)
    }));
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

  const handleAddStable = async (e) => {
    e.preventDefault();
    if (!form.title || !form.details || !form.location || !form.coordinates || !form.price) return;

    const tokenData = getUserData();
    const userId = tokenData?.id || tokenData?.sub || tokenData?._id || null;
    if (!userId) return;

    // Require at least one slot
    const allSlots = form.slots && form.slots.length > 0 ? form.slots : [];
    if (allSlots.length === 0 && (!slotInput.day || !slotInput.startTime || !slotInput.endTime)) {
      toast.error("Please add at least one schedule slot.");
      setSubmitting(false);
      return;
    }
    
    // Add current slotInput if it has values
    const finalSlots = [...allSlots];
    if (slotInput.day && slotInput.startTime && slotInput.endTime) {
      finalSlots.push(slotInput);
    }

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
        location: form.location,
        coordinates: form.coordinates ? {
          lat: form.coordinates.lat,
          lng: form.coordinates.lng
        } : null,
        price: Number(form.price),
        Experience: form.Experience,
        status: form.status || "active",
        schedule: finalSlots, // Send all slots as array to schedule field
        images: uploadedUrls,
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
                  status: payload.status,
                  rating: s.rating || 0,
                  images: payload.images,
                  slots: payload.schedule,
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
          experience: payload.Experience,
          status: payload.status,
          rating: 0,
          images: uploadedUrls,
          slots: payload.schedule,
        };
        setStables((prev) => [newStable, ...prev]);
        toast.success("Trainer created");
      }

      setEditingId(null);
      setForm({ 
        title: "", 
        details: "", 
        location: "", 
        coordinates: null, 
        price: "", 
        Experience: "", 
        images: [], 
        slots: [], 
        status: "active",
        disciplines: {
          dressage: false,
          showJumping: false,
          eventing: false,
          endurance: false,
          western: false,
          vaulting: false,
          dressagePrice: "",
          showJumpingPrice: "",
          eventingPrice: "",
          endurancePrice: "",
          westernPrice: "",
          vaultingPrice: ""
        },
        training: {
          onLocationLessons: false,
          lessonsOnTrainersLocation: false,
          onLocationLessonsPrice: "",
          lessonsOnTrainersLocationPrice: ""
        },
        competitionCoaching: {
          onLocationCoaching: false,
          onLocationCoachingPrice: ""
        },
        diplomas: []
      });
      setImagePreviews([]);
      setSlotInput({ day: "", startTime: "", endTime: "" });
      setDiplomaInput("");
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
    console.log("Editing stable data:", stable); // Debug log
    setForm({
      title: stable.title || "",
      details: stable.details || "",
      location: stable.location || "",
      coordinates: stable.coordinates || null,
      price: stable.price || "",
      Experience: stable.Experience || "",
      images: [],
      slots: stable.slots || [],
      status: stable.status || "active",
      disciplines: stable.disciplines || {
        dressage: false,
        showJumping: false,
        eventing: false,
        endurance: false,
        western: false,
        vaulting: false,
        dressagePrice: "",
        showJumpingPrice: "",
        eventingPrice: "",
        endurancePrice: "",
        westernPrice: "",
        vaultingPrice: ""
      },
      training: stable.training || {
        onLocationLessons: false,
        lessonsOnTrainersLocation: false,
        onLocationLessonsPrice: "",
        lessonsOnTrainersLocationPrice: ""
      },
      competitionCoaching: stable.competitionCoaching || {
        onLocationCoaching: false,
        onLocationCoachingPrice: ""
      },
      diplomas: stable.diplomas || []
    });
    setImagePreviews(stable.images || []);
    setPrevImages(stable.images || []);
    setSlotInput({ day: "", startTime: "", endTime: "" });
    setDiplomaInput("");
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
            location: t.location || "",
            coordinates: t.coordinates || null,
            price: t.price,
            Experience: t.Experience || "",
            status: t.status || "active",
            rating: 0,
            images: Array.isArray(t.images) ? t.images : [],
            slots: Array.isArray(t.schedule) ? t.schedule : [],
            disciplines: t.disciplines || {
              dressage: false,
              showJumping: false,
              eventing: false,
              endurance: false,
              western: false,
              vaulting: false,
              dressagePrice: "",
              showJumpingPrice: "",
              eventingPrice: "",
              endurancePrice: "",
              westernPrice: "",
              vaultingPrice: ""
            },
            training: t.training || {
              onLocationLessons: false,
              lessonsOnTrainersLocation: false,
              onLocationLessonsPrice: "",
              lessonsOnTrainersLocationPrice: ""
            },
            competitionCoaching: t.competitionCoaching || {
              onLocationCoaching: false,
              onLocationCoachingPrice: ""
            },
            diplomas: Array.isArray(t.diplomas) ? t.diplomas : []
          }));
          console.log("Mapped trainer data:", mapped); // Debug log
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
            {stable.location && (
              <p className="text-sm text-brand/70 mb-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {stable.location}
              </p>
            )}
            {stable.Experience && (
              <p className="text-xs text-brand/70 mb-2">
                <span className="font-semibold">Experience:</span> {stable.Experience}
              </p>
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="text-brand font-bold text-base">
                {stable.price ? `$. ${stable.price.toLocaleString()}` : ""}
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
            {/* Disciplines */}
            {(stable.disciplines && Object.values(stable.disciplines).some(option => option)) && (
              <div className="mt-2">
                <span className="text-xs font-semibold text-brand/70">Disciplines:</span>
                <div className="text-xs text-brand/80 mt-1 space-y-1">
                  {stable.disciplines.dressage && (
                    <div className="flex items-center justify-between">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Dressage</span>
                      {stable.disciplines.dressagePrice && (
                        <span className="text-blue-700 font-medium">${Number(stable.disciplines.dressagePrice).toLocaleString()}</span>
                      )}
                    </div>
                  )}
                  {stable.disciplines.showJumping && (
                    <div className="flex items-center justify-between">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Show Jumping</span>
                      {stable.disciplines.showJumpingPrice && (
                        <span className="text-green-700 font-medium">${Number(stable.disciplines.showJumpingPrice).toLocaleString()}</span>
                      )}
                    </div>
                  )}
                  {stable.disciplines.eventing && (
                    <div className="flex items-center justify-between">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">Eventing</span>
                      {stable.disciplines.eventingPrice && (
                        <span className="text-purple-700 font-medium">${Number(stable.disciplines.eventingPrice).toLocaleString()}</span>
                      )}
                    </div>
                  )}
                  {stable.disciplines.endurance && (
                    <div className="flex items-center justify-between">
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">Endurance</span>
                      {stable.disciplines.endurancePrice && (
                        <span className="text-orange-700 font-medium">${Number(stable.disciplines.endurancePrice).toLocaleString()}</span>
                      )}
                    </div>
                  )}
                  {stable.disciplines.western && (
                    <div className="flex items-center justify-between">
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded">Western</span>
                      {stable.disciplines.westernPrice && (
                        <span className="text-red-700 font-medium">${Number(stable.disciplines.westernPrice).toLocaleString()}</span>
                      )}
                    </div>
                  )}
                  {stable.disciplines.vaulting && (
                    <div className="flex items-center justify-between">
                      <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded">Vaulting</span>
                      {stable.disciplines.vaultingPrice && (
                        <span className="text-pink-700 font-medium">${Number(stable.disciplines.vaultingPrice).toLocaleString()}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Training */}
            {(stable.training && Object.values(stable.training).some(option => option)) && (
              <div className="mt-2">
                <span className="text-xs font-semibold text-brand/70">Training:</span>
                <div className="text-xs text-brand/80 mt-1 space-y-1">
                  {stable.training.onLocationLessons && (
                    <div className="flex items-center justify-between">
                      <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded">On Location Lessons</span>
                      {stable.training.onLocationLessonsPrice && (
                        <span className="text-indigo-700 font-medium">${Number(stable.training.onLocationLessonsPrice).toLocaleString()}</span>
                      )}
                    </div>
                  )}
                  {stable.training.lessonsOnTrainersLocation && (
                    <div className="flex items-center justify-between">
                      <span className="bg-teal-100 text-teal-800 px-2 py-1 rounded">Lessons on Trainer's Location</span>
                      {stable.training.lessonsOnTrainersLocationPrice && (
                        <span className="text-teal-700 font-medium">${Number(stable.training.lessonsOnTrainersLocationPrice).toLocaleString()}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Competition Coaching */}
            {(stable.competitionCoaching && Object.values(stable.competitionCoaching).some(option => option)) && (
              <div className="mt-2">
                <span className="text-xs font-semibold text-brand/70">Competition Coaching:</span>
                <div className="text-xs text-brand/80 mt-1 space-y-1">
                  {stable.competitionCoaching.onLocationCoaching && (
                    <div className="flex items-center justify-between">
                      <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded">On Location Coaching</span>
                      {stable.competitionCoaching.onLocationCoachingPrice && (
                        <span className="text-amber-700 font-medium">${Number(stable.competitionCoaching.onLocationCoachingPrice).toLocaleString()}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Diplomas */}
            {stable.diplomas && stable.diplomas.length > 0 && (
              <div className="mt-2">
                <span className="text-xs font-semibold text-brand/70">Diplomas:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {stable.diplomas.map((diploma, index) => (
                    <span key={index} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                      {diploma}
                    </span>
                  ))}
                </div>
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
                  title: "", 
                  details: "", 
                  location: "", 
                  coordinates: null, 
                  price: "", 
                  Experience: "", 
                  images: [], 
                  slots: [], 
                  status: "active",
                  disciplines: {
                    dressage: false,
                    showJumping: false,
                    eventing: false,
                    endurance: false,
                    western: false,
                    vaulting: false,
                    dressagePrice: "",
                    showJumpingPrice: "",
                    eventingPrice: "",
                    endurancePrice: "",
                    westernPrice: "",
                    vaultingPrice: ""
                  },
                  training: {
                    onLocationLessons: false,
                    lessonsOnTrainersLocation: false,
                    onLocationLessonsPrice: "",
                    lessonsOnTrainersLocationPrice: ""
                  },
                  competitionCoaching: {
                    onLocationCoaching: false,
                    onLocationCoachingPrice: ""
                  },
                  diplomas: []
                });
                setImagePreviews([]);
                setSlotInput({ day: "", startTime: "", endTime: "" });
                setDiplomaInput("");
                setPrevImages([]);
              }}
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-xl font-semibold text-brand mb-4">{editingId ? 'Edit Trainer' : 'Add New Trainer'}</h3>
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
                <label className="block text-sm font-medium text-brand mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] mb-3"
                  placeholder="Enter trainer location (e.g., City, State, Address)"
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
              
              {/* Disciplines Section */}
              <div className="border-t pt-4">
                <h4 className="text-lg font-semibold text-brand mb-3">Disciplines</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="space-y-3">
                      {/* Dressage */}
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={form.disciplines?.dressage || false}
                          onChange={(e) => handleCheckboxChange('disciplines.dressage', e.target.checked)}
                        >
                          <span className="text-sm text-brand">Dressage</span>
                        </Checkbox>
                        {form.disciplines?.dressage && (
                          <input
                            type="number"
                            name="disciplines.dressagePrice"
                            value={form.disciplines?.dressagePrice || ""}
                            onChange={handleInputChange}
                            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] w-24"
                            placeholder="Price"
                            min="0"
                          />
                        )}
                      </div>
                      
                      {/* Show Jumping */}
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={form.disciplines?.showJumping || false}
                          onChange={(e) => handleCheckboxChange('disciplines.showJumping', e.target.checked)}
                        >
                          <span className="text-sm text-brand">Show Jumping</span>
                        </Checkbox>
                        {form.disciplines?.showJumping && (
                          <input
                            type="number"
                            name="disciplines.showJumpingPrice"
                            value={form.disciplines?.showJumpingPrice || ""}
                            onChange={handleInputChange}
                            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] w-24"
                            placeholder="Price"
                            min="0"
                          />
                        )}
                      </div>
                      
                      {/* Eventing */}
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={form.disciplines?.eventing || false}
                          onChange={(e) => handleCheckboxChange('disciplines.eventing', e.target.checked)}
                        >
                          <span className="text-sm text-brand">Eventing</span>
                        </Checkbox>
                        {form.disciplines?.eventing && (
                          <input
                            type="number"
                            name="disciplines.eventingPrice"
                            value={form.disciplines?.eventingPrice || ""}
                            onChange={handleInputChange}
                            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] w-24"
                            placeholder="Price"
                            min="0"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="space-y-3">
                      {/* Endurance */}
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={form.disciplines?.endurance || false}
                          onChange={(e) => handleCheckboxChange('disciplines.endurance', e.target.checked)}
                        >
                          <span className="text-sm text-brand">Endurance</span>
                        </Checkbox>
                        {form.disciplines?.endurance && (
                          <input
                            type="number"
                            name="disciplines.endurancePrice"
                            value={form.disciplines?.endurancePrice || ""}
                            onChange={handleInputChange}
                            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] w-24"
                            placeholder="Price"
                            min="0"
                          />
                        )}
                      </div>
                      
                      {/* Western */}
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={form.disciplines?.western || false}
                          onChange={(e) => handleCheckboxChange('disciplines.western', e.target.checked)}
                        >
                          <span className="text-sm text-brand">Western</span>
                        </Checkbox>
                        {form.disciplines?.western && (
                          <input
                            type="number"
                            name="disciplines.westernPrice"
                            value={form.disciplines?.westernPrice || ""}
                            onChange={handleInputChange}
                            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] w-24"
                            placeholder="Price"
                            min="0"
                          />
                        )}
                      </div>
                      
                      {/* Vaulting */}
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={form.disciplines?.vaulting || false}
                          onChange={(e) => handleCheckboxChange('disciplines.vaulting', e.target.checked)}
                        >
                          <span className="text-sm text-brand">Vaulting</span>
                        </Checkbox>
                        {form.disciplines?.vaulting && (
                          <input
                            type="number"
                            name="disciplines.vaultingPrice"
                            value={form.disciplines?.vaultingPrice || ""}
                            onChange={handleInputChange}
                            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] w-24"
                            placeholder="Price"
                            min="0"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Training Section */}
              <div className="border-t pt-4">
                <h4 className="text-lg font-semibold text-brand mb-3">Training</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="space-y-3">
                      {/* On Location Lessons */}
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={form.training?.onLocationLessons || false}
                          onChange={(e) => handleCheckboxChange('training.onLocationLessons', e.target.checked)}
                        >
                          <span className="text-sm text-brand">On Location Lessons</span>
                        </Checkbox>
                        {form.training?.onLocationLessons && (
                          <input
                            type="number"
                            name="training.onLocationLessonsPrice"
                            value={form.training?.onLocationLessonsPrice || ""}
                            onChange={handleInputChange}
                            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] w-24"
                            placeholder="Price"
                            min="0"
                          />
                        )}
                      </div>
                      
                      {/* Lessons on Trainer's Location */}
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={form.training?.lessonsOnTrainersLocation || false}
                          onChange={(e) => handleCheckboxChange('training.lessonsOnTrainersLocation', e.target.checked)}
                        >
                          <span className="text-sm text-brand">Lessons on Trainer's Location</span>
                        </Checkbox>
                        {form.training?.lessonsOnTrainersLocation && (
                          <input
                            type="number"
                            name="training.lessonsOnTrainersLocationPrice"
                            value={form.training?.lessonsOnTrainersLocationPrice || ""}
                            onChange={handleInputChange}
                            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] w-24"
                            placeholder="Price"
                            min="0"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Competition Coaching */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h5 className="text-md font-semibold text-brand mb-3">Competition Coaching</h5>
                    <div className="space-y-3">
                      {/* On Location Coaching */}
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={form.competitionCoaching?.onLocationCoaching || false}
                          onChange={(e) => handleCheckboxChange('competitionCoaching.onLocationCoaching', e.target.checked)}
                        >
                          <span className="text-sm text-brand">On Location Coaching</span>
                        </Checkbox>
                        {form.competitionCoaching?.onLocationCoaching && (
                          <input
                            type="number"
                            name="competitionCoaching.onLocationCoachingPrice"
                            value={form.competitionCoaching?.onLocationCoachingPrice || ""}
                            onChange={handleInputChange}
                            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring focus:border-[color:var(--primary)] w-24"
                            placeholder="Price"
                            min="0"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Diplomas Section */}
              <div className="border-t pt-4">
                <h4 className="text-lg font-semibold text-brand mb-3">Diplomas Trainer</h4>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={diplomaInput}
                      onChange={(e) => setDiplomaInput(e.target.value)}
                      placeholder="Enter diploma name"
                      onPressEnter={handleAddDiploma}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddDiploma}
                      className="px-4 py-2 bg-[color:var(--primary)] text-white rounded hover:bg-[color:var(--primary)]/90 transition"
                    >
                      Add
                    </button>
                  </div>
                  {form.diplomas && form.diplomas.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {form.diplomas.map((diploma, index) => (
                        <Tag
                          key={index}
                          closable
                          onClose={() => handleRemoveDiploma(diploma)}
                          className="bg-blue-100 text-blue-800 border-blue-200"
                        >
                          {diploma}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
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
