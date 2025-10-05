"use client";

import { useEffect, useState } from "react";
import { getRequest } from "@/service";

export default function SubscriptionList() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubscriptions() {
      try {
        // This would be replaced with actual API call to get all subscriptions
        // const res = await getRequest('/api/subscriptions');
        // setSubscriptions(res.subscriptions || []);
        
        // Dummy data for now
        const dummySubscriptions = [
          {
            id: 1,
            userId: "user1",
            userName: "John Doe",
            userEmail: "john@example.com",
            subscriptionType: "Premium",
            status: "Active",
            startDate: "2024-01-01",
            endDate: "2024-12-31",
            amount: 1200,
            paymentStatus: "Paid"
          },
          {
            id: 2,
            userId: "user2", 
            userName: "Jane Smith",
            userEmail: "jane@example.com",
            subscriptionType: "Basic",
            status: "Expired",
            startDate: "2023-06-01",
            endDate: "2024-05-31",
            amount: 600,
            paymentStatus: "Paid"
          },
          {
            id: 3,
            userId: "user3",
            userName: "Bob Johnson", 
            userEmail: "bob@example.com",
            subscriptionType: "Premium",
            status: "Pending",
            startDate: "2024-03-01",
            endDate: "2025-02-28",
            amount: 1200,
            paymentStatus: "Pending"
          }
        ];
        
        setSubscriptions(dummySubscriptions);
      } catch (error) {
        console.error("Error loading subscriptions:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadSubscriptions();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "Expired":
        return "bg-red-100 text-red-700";
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-700";
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      case "Failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-brand">Subscription List</h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-brand">Loading subscriptions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-brand">Subscription List</h2>
      
      <div className="rounded border border-[color:var(--primary)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[color:var(--primary)]/10 text-brand">
              <tr>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">User</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Email</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Subscription Type</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Status</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Start Date</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">End Date</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Amount</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-brand/60">
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="border-t border-[color:var(--primary)]/20 hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap font-medium">
                      {subscription.userName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {subscription.userEmail}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {subscription.subscriptionType}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(subscription.status)}`}>
                        {subscription.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(subscription.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(subscription.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      ${subscription.amount.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(subscription.paymentStatus)}`}>
                        {subscription.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
