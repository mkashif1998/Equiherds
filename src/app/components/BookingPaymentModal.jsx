"use client";

import { useState, useEffect } from "react";
import { Modal, Form, Input, Button, Spin, Alert, Divider } from "antd";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from "react-hot-toast";
import { postRequest } from "../../service/index";
import { getUserData } from "../utils/localStorage";

// Stripe Elements Payment Form Component
function PaymentForm({ 
  name, 
  setName, 
  bookingData, 
  onPaymentSuccess, 
  onPaymentError,
  isProcessing,
  setIsProcessing 
}) {
  const stripe = useStripe();
  const elements = useElements();

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      console.error('Stripe not initialized');
      return;
    }

    if (!name.trim()) {
      toast.error('Please enter cardholder name');
      return;
    }

    setIsProcessing(true);
    console.log('Starting booking payment process...');

    try {
      // Create payment intent for booking
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(bookingData.totalPrice * 100), // Convert to cents
          currency: 'eur',
          metadata: {
            type: 'booking',
            stableId: bookingData.stableId,
            bookingType: bookingData.bookingType,
            numberOfDays: bookingData.numberOfDays
          }
        }),
      });

      const { clientSecret, paymentIntentId } = await response.json();
      console.log('Payment intent created:', paymentIntentId);

      // Get the card element
      const cardElement = elements.getElement(CardElement);

      // Confirm payment with Stripe Elements
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: name,
          },
        },
      });

      if (error) {
        console.error('Payment failed:', error);
        toast.error(`Payment failed: ${error.message}`);
        onPaymentError(error);
      } else if (paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent);
        
          // First create the booking, then record payment if booking is successful
        try {
          const bookingPayload = {
            ...bookingData,
            paymentId: paymentIntent.id,
            paymentStatus: 'completed',
            paymentAmount: bookingData.totalPrice,
            paymentCurrency: 'eur'
          };

          console.log('Creating booking with payment info:', bookingPayload);
          
          // Determine which API endpoint to use based on booking type
          const apiEndpoint = bookingData.trainerId ? '/api/bookingTrainers' : '/api/bookingStables';
          const bookingResponse = await postRequest(apiEndpoint, bookingPayload);

          if (bookingResponse.success) {
            // Booking created successfully, now record the payment
            const userData = getUserData();
            if (userData && userData.id) {
              const paymentResponse = await postRequest('/api/users/payments', {
                userId: userData.id,
                paymentId: paymentIntent.id,
                amount: Math.round(bookingData.totalPrice * 100),
                currency: 'eur',
                status: 'succeeded',
                subscriptionId: null,
                subscriptionStatus: null,
                subscriptionExpiry: null
              });

              if (paymentResponse && paymentResponse.user) {
                toast.success('Payment successful! Your booking has been confirmed and payment recorded.');
                onPaymentSuccess(bookingResponse, paymentIntent);
              } else {
                toast.success('Payment successful! Your booking has been confirmed.');
                console.warn('Failed to record payment in user account');
                onPaymentSuccess(bookingResponse, paymentIntent);
              }
            } else {
              toast.success('Payment successful! Your booking has been confirmed.');
              console.warn('User data not found, payment not recorded');
              onPaymentSuccess(bookingResponse, paymentIntent);
            }
          } else {
            // Booking failed, but payment was successful - this is a problem
            toast.error('Payment successful but booking failed. Please contact support with payment ID: ' + paymentIntent.id);
            onPaymentError(new Error('Booking creation failed after payment'));
          }
        } catch (bookingError) {
          console.error('Error creating booking:', bookingError);
          toast.error('Payment successful but booking failed. Please contact support with payment ID: ' + paymentIntent.id);
          onPaymentError(bookingError);
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error('An error occurred during payment. Please try again.');
      onPaymentError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handlePayment}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
        <Input
          size="large"
          value={name}
          onChange={(e) => setName(e.target.value.toUpperCase())}
          placeholder="JOHN DOE"
          autoComplete="cc-name"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Card Details</label>
        <div className="border border-gray-300 rounded-lg px-3 py-2">
          <CardElement
            options={{
              hidePostalCode: true,
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>
      
      <Button
        type="primary"
        htmlType="submit"
        size="large"
        loading={isProcessing}
        disabled={isProcessing || !stripe}
        className="w-full"
        style={{ 
          backgroundColor: '#1890ff',
          borderColor: '#1890ff',
          height: '48px',
          fontSize: '16px',
          fontWeight: '600'
        }}
      >
        {isProcessing ? 'Processing Payment...' : `Pay €${bookingData.totalPrice.toFixed(2)}`}
      </Button>
    </form>
  );
}

export default function BookingPaymentModal({ 
  visible, 
  onCancel, 
  bookingData, 
  onBookingSuccess 
}) {
  const [name, setName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripePromise, setStripePromise] = useState(null);

  // Initialize Stripe
  useEffect(() => {
    const initializeStripe = async () => {
      const stripeInstance = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
      setStripePromise(stripeInstance);
    };
    initializeStripe();
  }, []);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible) {
      setName("");
      setIsProcessing(false);
    }
  }, [visible]);

  const handlePaymentSuccess = (bookingResponse, paymentIntent) => {
    onBookingSuccess(bookingResponse, paymentIntent);
    onCancel();
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    // Error handling is done in the form component
  };

  const formatBookingSummary = () => {
    if (!bookingData) return null;
    
    return (
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-gray-800 mb-3">Booking Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">{bookingData.trainerId ? 'Trainer:' : 'Stable:'}</span>
            <span className="font-medium">{bookingData.trainerTitle || bookingData.stableTitle || 'Selected Service'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Booking Type:</span>
            <span className="font-medium capitalize">{bookingData.bookingType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Duration:</span>
            <span className="font-medium">{bookingData.numberOfDays} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{bookingData.startDate === bookingData.endDate ? 'Date:' : 'Date Range:'}</span>
            <span className="font-medium">
              {bookingData.startDate === bookingData.endDate ? 
                bookingData.startDate : 
                `${bookingData.startDate} - ${bookingData.endDate}`
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Number of Horses:</span>
            <span className="font-medium">{bookingData.numberOfHorses}</span>
          </div>
          {bookingData.additionalServiceCosts > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Additional Services:</span>
              <span className="font-medium">€{bookingData.additionalServiceCosts.toFixed(2)}</span>
            </div>
          )}
          <Divider className="my-2" />
          <div className="flex justify-between text-lg font-bold">
            <span>Total Amount:</span>
            <span className="text-green-600">€{bookingData.totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal
      title={`Complete Your ${bookingData?.trainerId ? 'Training' : 'Stable'} Booking Payment`}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
      centered
      maskClosable={false}
      closable={!isProcessing}
    >
      <div className="space-y-6">
        {formatBookingSummary()}
        
        <Alert
          message="Secure Payment"
          description="Your payment is processed securely through Stripe. We accept all major credit cards."
          type="info"
          showIcon
          className="mb-4"
        />
        
        {stripePromise ? (
          <Elements stripe={stripePromise}>
            <PaymentForm 
              name={name} 
              setName={setName} 
              bookingData={bookingData}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />
          </Elements>
        ) : (
          <div className="flex justify-center items-center py-8">
            <Spin size="large" />
            <span className="ml-3">Loading payment form...</span>
          </div>
        )}
        
        <div className="text-center text-xs text-gray-500">
          <p>By completing this payment, you agree to our terms of service.</p>
          <p>Your booking will be confirmed immediately after successful payment.</p>
        </div>
      </div>
    </Modal>
  );
}
