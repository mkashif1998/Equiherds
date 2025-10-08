"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { putRequest } from "../../service";

export default function EditSubscriptionModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  subscriptionData = null
}) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    discount: "",
    duration: "",
    description: {}
  });
  
  const [descriptionFields, setDescriptionFields] = useState([
    { key: "", value: "" }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens/closes or when subscriptionData changes
  useEffect(() => {
    if (isOpen) {
      if (subscriptionData) {
        // Populate form with existing subscription data
        setFormData({
          name: subscriptionData.name || "",
          price: subscriptionData.price || "",
          discount: subscriptionData.discount || "",
          duration: subscriptionData.duration || "",
          description: subscriptionData.description || {}
        });
        
        // Convert description object to fields array
        const fields = Object.entries(subscriptionData.description || {}).map(([key, value]) => ({
          key,
          value: String(value)
        }));
        setDescriptionFields(fields.length > 0 ? fields : [{ key: "", value: "" }]);
      } else {
        // Reset form for new subscription
        setFormData({
          name: "",
          price: "",
          discount: "",
          duration: "",
          description: {}
        });
        setDescriptionFields([{ key: "", value: "" }]);
      }
    }
  }, [isOpen, subscriptionData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDescriptionFieldChange = (index, field, value) => {
    const newFields = [...descriptionFields];
    newFields[index][field] = value;
    setDescriptionFields(newFields);
  };

  const addDescriptionField = () => {
    setDescriptionFields([...descriptionFields, { key: "", value: "" }]);
  };

  const removeDescriptionField = (index) => {
    if (descriptionFields.length > 1) {
      const newFields = descriptionFields.filter((_, i) => i !== index);
      setDescriptionFields(newFields);
    }
  };

  const buildDescriptionObject = () => {
    const description = {};
    descriptionFields.forEach(field => {
      if (field.key.trim() && field.value.trim()) {
        description[field.key.trim()] = field.value.trim();
      }
    });
    return description;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error("Please enter subscription name");
      return;
    }
    
    if (!formData.price || formData.price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    
    if (!formData.duration || formData.duration <= 0) {
      toast.error("Please enter a valid duration");
      return;
    }

    setIsLoading(true);
    
    try {
      const description = buildDescriptionObject();
      
      const payload = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        discount: formData.discount ? parseFloat(formData.discount) : 0,
        duration: parseInt(formData.duration),
        description: description
      };

      console.log("Updating subscription with payload:", payload);
      
      const response = await putRequest(`/api/subscriptions/${subscriptionData._id}`, payload);
      
      if (response.message && response.subscription) {
        toast.success("Subscription updated successfully!");
        onSuccess(response.subscription);
        onClose();
      } else {
        toast.error(response.message || "Failed to update subscription");
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast.error(error.message || "Failed to update subscription");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            {subscriptionData ? "Edit Subscription" : "Add New Subscription"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subscription Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Premium Plan"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="99.99"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.discount}
                onChange={(e) => handleInputChange("discount", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (Days) *
              </label>
              <input
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => handleInputChange("duration", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="30"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Description Fields */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Description Details
              </label>
              <button
                type="button"
                onClick={addDescriptionField}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                disabled={isLoading}
              >
                <Plus className="w-4 h-4" />
                Add Field
              </button>
            </div>
            
            <div className="space-y-3">
              {descriptionFields.map((field, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={field.key}
                    onChange={(e) => handleDescriptionFieldChange(index, "key", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Field name (e.g., total horses)"
                    disabled={isLoading}
                  />
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => handleDescriptionFieldChange(index, "value", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Value (e.g., 5)"
                    disabled={isLoading}
                  />
                  {descriptionFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDescriptionField(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={isLoading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Add custom fields to describe subscription details (e.g., "total horses": "5", "quantity": "5")
            </p>
          </div>

          {/* Preview */}
          {descriptionFields.some(field => field.key.trim() && field.value.trim()) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Description Preview:</h4>
              <pre className="text-xs text-gray-600 bg-white p-2 rounded border overflow-x-auto">
                {JSON.stringify(buildDescriptionObject(), null, 2)}
              </pre>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (subscriptionData ? "Updating..." : "Creating...") : (subscriptionData ? "Update Subscription" : "Create Subscription")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
