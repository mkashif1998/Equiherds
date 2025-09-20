"use client";

export default function MyServices() {
  const myServices = [
    {
      id: "s1",
      serviceType: "Training",
      startDate: "2025-08-01",
      endDate: "2025-10-01",
      status: "Active",
      price: 15000,
    },
    {
      id: "s2",
      serviceType: "Stables",
      startDate: "2025-06-15",
      endDate: "2025-09-15",
      status: "Completed",
      price: 22000,
    },
    {
      id: "s3",
      serviceType: "Training",
      startDate: "2025-09-10",
      endDate: "2025-12-10",
      status: "Pending",
      price: 18000,
    },
  ];

  const formatPrice = (value) => `$ ${value.toLocaleString()}`;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-brand">My Services</h2>
      <div className="rounded border border-[color:var(--primary)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[color:var(--primary)]/10 text-brand">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Service Type</th>
                <th className="px-4 py-3 text-left font-medium">Start Date</th>
                <th className="px-4 py-3 text-left font-medium">End Date</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {myServices.map((s) => (
                <tr key={s.id} className="border-t border-[color:var(--primary)]/20">
                  <td className="px-4 py-3 whitespace-nowrap">{s.serviceType}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{s.startDate}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{s.endDate}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      s.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : s.status === "Completed"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatPrice(s.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
