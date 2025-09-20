"use client";

const dummyClients = [
  {
    id: "1",
    name: "Ayesha Khan",
    phone: "+92 300 1234567",
    status: "Active",
    startDate: "2025-01-10",
    endDate: "2025-04-10",
    serviceType: "Training",
  },
  {
    id: "2",
    name: "Bilal Ahmed",
    phone: "+92 302 7654321",
    status: "Completed",
    startDate: "2024-11-05",
    endDate: "2025-02-05",
    serviceType: "Stables",
  },
  {
    id: "3",
    name: "Sara Malik",
    phone: "+92 301 1112233",
    status: "Pending",
    startDate: "2025-09-01",
    endDate: "2025-12-01",
    serviceType: "Training",
  },
  {
    id: "4",
    name: "Usman Ali",
    phone: "+92 345 9988776",
    status: "Active",
    startDate: "2025-08-15",
    endDate: "2025-11-15",
    serviceType: "Stables",
  },
];

export default function Client() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-brand">Clients</h2>
      <div className="rounded border border-[color:var(--primary)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[color:var(--primary)]/10 text-brand">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Phone Number</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Start Date</th>
                <th className="px-4 py-3 text-left font-medium">End Date</th>
                <th className="px-4 py-3 text-left font-medium">Service Type</th>
              </tr>
            </thead>
            <tbody>
              {dummyClients.map((c) => (
                <tr key={c.id} className="border-t border-[color:var(--primary)]/20">
                  <td className="px-4 py-3 whitespace-nowrap">{c.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{c.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      c.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : c.status === "Completed"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{c.startDate}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{c.endDate}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{c.serviceType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
