"use client";

import { useEffect, useState } from "react";
import { getRequest } from "@/service";
import EditSubscriptionModal from "../components/EditSubscriptionModal";

export default function SubscriptionList() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  useEffect(() => {
    async function loadSubscriptions() {
      try {
        const res = await getRequest('/api/subscriptions');
        setSubscriptions(res.subscriptions || []);
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

  const handleEditSubscription = (subscription) => {
    setSelectedSubscription(subscription);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (updatedSubscription) => {
    // Update the subscription in the list
    setSubscriptions(prev => 
      prev.map(sub => 
        sub._id === updatedSubscription._id ? updatedSubscription : sub
      )
    );
    setIsEditModalOpen(false);
    setSelectedSubscription(null);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedSubscription(null);
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

  // Transform API data to subscription plans format
  const subscriptionPlans = subscriptions.map((subscription, index) => {
    const colors = [
      { color: "border-blue-200 bg-blue-50", buttonColor: "bg-blue-600 hover:bg-blue-700" },
      { color: "border-green-200 bg-green-50", buttonColor: "bg-green-600 hover:bg-green-700" },
      { color: "border-purple-200 bg-purple-50", buttonColor: "bg-purple-600 hover:bg-purple-700" }
    ];
    
    const colorScheme = colors[index % colors.length];
    
    return {
      id: subscription._id,
      name: subscription.name,
      price: subscription.price,
      period: "days",
      duration: subscription.duration,
      description: `Duration: ${subscription.duration} days`,
      features: [
        `Horses: ${subscription.description["No of Hourse"] || "N/A"}`,
        `Trainers: ${subscription.description["No of Trainer"] || "N/A"}`,
        `Stables: ${subscription.description["No Stables"] || subscription.description["No of Syables"] || "N/A"}`
      ],
      ...colorScheme,
      popular: index === 1 // Make the second plan popular
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-brand">Subscription Plans</h2>
      </div>
      
      {/* Subscription Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {subscriptionPlans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-lg border-2 p-6 transition-all duration-300 hover:shadow-lg ${
              plan.popular ? 'ring-2 ring-green-500 ring-opacity-50 scale-105' : ''
            } ${plan.color}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Most Popular
                </span>
              </div>
            )}
            
            {/* Edit Icon */}
            <button 
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => {
                // Find the original subscription data
                const originalSubscription = subscriptions.find(sub => sub._id === plan.id);
                if (originalSubscription) {
                  handleEditSubscription(originalSubscription);
                }
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="mb-2">
                <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                <span className="text-gray-600">/{plan.period}</span>
              </div>
              <p className="text-gray-600 text-sm">{plan.description}</p>
            </div>
            
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            
            <button className={`w-full py-2 px-4 rounded-lg text-white font-medium transition-colors duration-200 ${plan.buttonColor}`}>
              Choose {plan.name}
            </button>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-semibold text-brand">Available Subscription Plans</h2>
      
      <div className="rounded border border-[color:var(--primary)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[color:var(--primary)]/10 text-brand">
              <tr>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Plan Name</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Price</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Duration</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Horses</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Trainers</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Stables</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Users Count</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Created Date</th>
                <th className="px-4 py-3 border-b text-left text-brand/80 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-brand/60">
                    No subscription plans found
                  </td>
                </tr>
              ) : (
                subscriptions.map((subscription) => (
                  <tr key={subscription._id} className="border-t border-[color:var(--primary)]/20 hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap font-medium">
                      {subscription.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      ${subscription.price ? subscription.price.toLocaleString("en-US", { minimumFractionDigits: 0 }) : '0'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {subscription.duration ? `${subscription.duration} days` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {subscription.description["No of Hourse"] || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {subscription.description["No of Trainer"] || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {subscription.description["No Stables"] || subscription.description["No of Syables"] || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {subscription.userCount || 0} users
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {subscription.createdAt ? new Date(subscription.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors">
                        Select Plan
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Subscription Modal */}
      <EditSubscriptionModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
        subscriptionData={selectedSubscription}
      />
    </div>
  );
}
