"use client";

export default function AddServices() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-brand">Add Services</h2>
      <form className="space-y-4 max-w-xl">
        <div className="p-4 rounded border border-[color:var(--primary)] bg-white">
          <label className="block mb-1 text-sm opacity-80">Service Title</label>
          <input
            type="text"
            className="w-full px-3 py-2 rounded border border-[color:var(--primary)] bg-white outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
            placeholder="Enter service title"
          />
        </div>
        <div className="p-4 rounded border border-[color:var(--primary)] bg-white">
          <label className="block mb-1 text-sm opacity-80">Description</label>
          <textarea
            rows={4}
            className="w-full px-3 py-2 rounded border border-[color:var(--primary)] bg-white outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
            placeholder="Describe your service"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded border border-[color:var(--primary)] bg-white">
            <label className="block mb-1 text-sm opacity-80">Category</label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded border border-[color:var(--primary)] bg-white outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
              placeholder="e.g., Training"
            />
          </div>
          <div className="p-4 rounded border border-[color:var(--primary)] bg-white">
            <label className="block mb-1 text-sm opacity-80">Price</label>
            <input
              type="number"
              className="w-full px-3 py-2 rounded border border-[color:var(--primary)] bg-white outline-none focus:ring-2 focus:ring-[color:var(--primary)]/40"
              placeholder="e.g., 5000"
            />
          </div>
        </div>
        <button type="button" className="px-4 py-2 rounded bg-secondary text-white font-medium">Save</button>
      </form>
    </div>
  );
}


