"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import IMask from "imask";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from "react-hot-toast";
import { images } from "../const/images";
import { getUserData } from "../utils/localStorage";
import { postRequest, getRequest } from "../../service/index";
import { 
    getSubscriptionDisplayInfo, 
    calculateNewExpiryDate, 
    shouldShowRenewalPrompt,
    formatDate,
    SUBSCRIPTION_STATES 
} from "../utils/subscriptionUtils";

const dummyHistory = [
    { month: "January", year: 2024, price: 1200, status: "Paid" },
    { month: "February", year: 2024, price: 1200, status: "Paid" },
    { month: "March", year: 2024, price: 1200, status: "Paid" },
    { month: "April", year: 2024, price: 1200, status: "Paid" },
    { month: "May", year: 2024, price: 1200, status: "Pending" },
];

// Stripe Elements Payment Form Component
function PaymentForm({ name, setName, flipped, setFlipped, subscriptionInfo, userData }) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePayment = async (e) => {
        e.preventDefault();
        
        if (!stripe || !elements) {
            console.error('Stripe not initialized');
            return;
        }

        if (!name.trim()) {
            console.error('Please enter cardholder name');
            toast.error('Please enter cardholder name');
            return;
        }

        setIsProcessing(true);
        console.log('Starting payment process with Stripe Elements...');

        try {
            // Get smart payment amount based on subscription status
            const paymentAmount = subscriptionInfo?.paymentAmount || 1200;
            const currency = subscriptionInfo?.currency || 'eur';
            
            // Create payment intent
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: paymentAmount,
                    currency: currency
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
            } else if (paymentIntent.status === 'succeeded') {
                console.log('Payment succeeded:', paymentIntent);
                
                // Save payment record to user account
                try {
                    const localUserData = getUserData();
                    if (localUserData && localUserData.id) {
                        // Calculate smart expiry date based on current subscription status
                        const newExpiryDate = calculateNewExpiryDate(userData);
                        
                        const paymentData = {
                            userId: localUserData.id,
                            paymentId: paymentIntent.id,
                            amount: paymentAmount,
                            currency: currency,
                            status: 'succeeded',
                            subscriptionId: null, // Can be set if you have subscription logic
                            subscriptionStatus: 'Active',
                            subscriptionExpiry: newExpiryDate.toISOString()
                        };

                        const paymentResponse = await postRequest('/api/users/payments', paymentData);

                        if (paymentResponse && paymentResponse.user) {
                            toast.success('Payment successful! Your subscription has been activated and payment recorded.');
                            // Refresh payment data
                            fetchUserPayments();
                        } else {
                            toast.success('Payment successful! Your subscription has been activated.');
                            console.warn('Failed to record payment in user account');
                        }
                    } else {
                        toast.success('Payment successful! Your subscription has been activated.');
                        console.warn('User data not found, payment not recorded');
                    }
                } catch (recordError) {
                    console.error('Error recording payment:', recordError);
                    toast.success('Payment successful! Your subscription has been activated.');
                }
            }
        } catch (err) {
            console.error('Payment error:', err);
            toast.error('An error occurred during payment. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form className="space-y-4" onSubmit={handlePayment}>
            <div>
                <label className="block text-sm font-medium text-brand mb-1">Cardholder Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value.toUpperCase())}
                    onFocus={() => setFlipped(false)}
                    className="w-full border border-[color:var(--primary)] rounded px-3 py-2 text-sm focus:outline-none"
                    placeholder="JOHN DOE"
                    autoComplete="cc-name"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-brand mb-1">Card Details</label>
                <div className="border border-[color:var(--primary)] rounded px-3 py-2">
                    <CardElement
                        options={{
                            hidePostalCode: true,
                            style: {
                                base: {
                                    fontSize: '14px',
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
                        onFocus={() => setFlipped(false)}
                        onBlur={() => setFlipped(false)}
                    />
                </div>
            </div>
            <button
                type="submit"
                disabled={isProcessing || !stripe}
                className={`px-4 py-2 rounded bg-[color:var(--primary)] !text-white font-medium ${
                    isProcessing || !stripe ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
                {isProcessing ? 'Processing...' : `Pay ${subscriptionInfo?.formattedAmount || '€12.00'}`}
            </button>
        </form>
    );
}

export default function Subscription() {
    const [name, setName] = useState("");
    const [number, setNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");
    const [flipped, setFlipped] = useState(false);
    const [stripePromise, setStripePromise] = useState(null);
    const [userPayments, setUserPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [subscriptionInfo, setSubscriptionInfo] = useState(null);

    const numberRef = useRef(null);
    const expiryRef = useRef(null);
    const cvcRef = useRef(null);

    // Fetch user payment data and subscription info
    const fetchUserPayments = async () => {
        try {
            const localUserData = getUserData();
            if (localUserData && localUserData.id) {
                const response = await getRequest(`/api/users?id=${localUserData.id}`);
                if (response && response.user) {
                    const user = response.user;
                    setUserData(user);
                    setUserPayments(user.payments || []);
                    
                    // Calculate subscription info
                    const subInfo = getSubscriptionDisplayInfo(user);
                    setSubscriptionInfo(subInfo);
                    
                    // Show renewal prompt if needed
                    if (shouldShowRenewalPrompt(user)) {
                        if (subInfo.isExpired) {
                            toast.error(`Your subscription expired ${subInfo.daysOverdue} days ago. Please renew to continue.`);
                        } else if (subInfo.daysRemaining <= 3) {
                            toast.warning(`Your subscription expires in ${subInfo.daysRemaining} days. Consider renewing now.`);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching user payments:', error);
            toast.error('Failed to load payment history');
        } finally {
            setLoading(false);
        }
    };

    // Fetch user payments on component mount
    useEffect(() => {
        fetchUserPayments();
    }, []);

    // Initialize Stripe
    useEffect(() => {
        const initializeStripe = async () => {
            const stripeInstance = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
            setStripePromise(stripeInstance);
            console.log('Stripe initialized:', stripeInstance ? 'Success' : 'Failed');
        };
        initializeStripe();
    }, []);

    // Input masks
    useEffect(() => {
        if (!numberRef.current) return;
        const mask = IMask(numberRef.current, {
            mask: [
                { mask: "0000 000000 00000", regex: "^3[47]\\d{0,13}", cardtype: "amex" },
                { mask: "0000 0000 0000 0000", regex: "^(?:6011|65\\d{0,2}|64[4-9]\\d?)\\d{0,12}", cardtype: "discover" },
                { mask: "0000 000000 0000", regex: "^3(?:0([0-5]|9)|[689]\\d?)\\d{0,11}", cardtype: "diners" },
                { mask: "0000 0000 0000 0000", regex: "^(5[1-5]\\d{0,2}|22[2-9]\\d{0,1}|2[3-7]\\d{0,2})\\d{0,12}", cardtype: "mastercard" },
                { mask: "0000 000000 00000", regex: "^(?:2131|1800)\\d{0,11}", cardtype: "jcb15" },
                { mask: "0000 0000 0000 0000", regex: "^(?:35\\d{0,2})\\d{0,12}", cardtype: "jcb" },
                { mask: "0000 0000 0000 0000", regex: "^(?:5[0678]\\d{0,2}|6304|67\\d{0,2})\\d{0,12}", cardtype: "maestro" },
                { mask: "0000 0000 0000 0000", regex: "^4\\d{0,15}", cardtype: "visa" },
                { mask: "0000 0000 0000 0000", regex: "^62\\d{0,14}", cardtype: "unionpay" },
                { mask: "0000 0000 0000 0000", cardtype: "unknown" },
            ],
            dispatch: (appended, dynamicMasked) => {
                const nmbr = (dynamicMasked.value + appended).replace(/\D/g, "");
                for (let i = 0; i < dynamicMasked.compiledMasks.length; i++) {
                    const re = new RegExp(dynamicMasked.compiledMasks[i].regex);
                    if (re.test(nmbr)) return dynamicMasked.compiledMasks[i];
                }
                return dynamicMasked.compiledMasks[dynamicMasked.compiledMasks.length - 1];
            },
        });
        mask.on("accept", () => setNumber(mask.value));
        return () => mask.destroy();
    }, []);

    useEffect(() => {
        if (!expiryRef.current) return;
        const mask = IMask(expiryRef.current, {
            mask: "MM{/}YY",
            blocks: {
                YY: { mask: IMask.MaskedRange, from: 0, to: 99 },
                MM: { mask: IMask.MaskedRange, from: 1, to: 12 },
            },
        });
        mask.on("accept", () => setExpiry(mask.value));
        return () => mask.destroy();
    }, []);

    useEffect(() => {
        if (!cvcRef.current) return;
        const mask = IMask(cvcRef.current, { mask: "0000" });
        mask.on("accept", () => setCvc(mask.value));
        return () => mask.destroy();
    }, []);

    const formattedName = useMemo(() => (name.trim() ? name : "MATTHEW EHORN"), [name]);
    const formattedNumber = useMemo(() => (number || "0123 4567 8910 1112"), [number]);
    const formattedExpiry = useMemo(() => (expiry || "01/23"), [expiry]);
    const formattedCvc = useMemo(() => (cvc || "985"), [cvc]);

    // Format payment data for display
    const formatPaymentData = (payments) => {
        return payments.map(payment => {
            const date = new Date(payment.date);
            return {
                month: date.toLocaleString('default', { month: 'long' }),
                year: date.getFullYear(),
                price: payment.amount,
                status: payment.status === 'succeeded' ? 'Paid' : 'Pending',
                date: payment.date,
                paymentId: payment.paymentId,
                currency: payment.currency
            };
        }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date, newest first
    };


    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-brand">Subscription</h2>
            
            {/* Subscription Status Dashboard */}
            {subscriptionInfo && (
                <div className="bg-white rounded-lg border border-[color:var(--primary)]/20 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-brand">Subscription Status</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            subscriptionInfo.status === SUBSCRIPTION_STATES.ACTIVE 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                        }`}>
                            {subscriptionInfo.status === SUBSCRIPTION_STATES.ACTIVE ? 'Active' : 'Expired'}
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Status Message</p>
                            <p className="font-medium text-brand">{subscriptionInfo.message}</p>
                        </div>
                        
                        {subscriptionInfo.status === SUBSCRIPTION_STATES.ACTIVE ? (
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Days Remaining</p>
                                <p className="font-medium text-green-600">{subscriptionInfo.daysRemaining} days</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Days Overdue</p>
                                <p className="font-medium text-red-600">{subscriptionInfo.daysOverdue} days</p>
                            </div>
                        )}
                        
                        {subscriptionInfo.expiryDate && (
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Expiry Date</p>
                                <p className="font-medium text-brand">{formatDate(subscriptionInfo.expiryDate)}</p>
                            </div>
                        )}
                        
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Next Payment</p>
                            <p className="font-medium text-brand">{subscriptionInfo.formattedAmount}</p>
                        </div>
                    </div>
                    
                    {subscriptionInfo.paymentDescription && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-700">{subscriptionInfo.paymentDescription}</p>
                        </div>
                    )}
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Card Preview */}
                <div className="relative h-56 w-[360px] sm:w-[400px] mx-auto [perspective:1000px]">
                    <div
                        className={`creditcard relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""
                            }`}
                    >
                        {/* Front */}
                        <div className="absolute inset-0 rounded-2xl shadow-lg bg-gradient-to-br from-blue-700 to-blue-900 text-white p-6 [backface-visibility:hidden]">
                            <div className="flex items-center justify-between">
                                <img
                                    src={images.chip}
                                    alt="chip"
                                    className="h-6 w-8 object-contain"
                                />
                                <span className="text-2xl font-bold">VISA</span>
                            </div>
                            <div className="mt-6 text-sm opacity-80">card number</div>
                            <div id="svgnumber" className="text-2xl tracking-[0.2em] font-semibold mt-1">
                                {formattedNumber}
                            </div>
                            <div className="flex items-end justify-between mt-6">
                                <div>
                                    <div className="text-xs opacity-80">cardholder name</div>
                                    <div id="svgname" className="font-semibold">
                                        {formattedName}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs opacity-80">expiration</div>
                                    <div id="svgexpire" className="font-semibold">
                                        {formattedExpiry}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Back */}
                        <div className="absolute inset-0 rounded-2xl shadow-lg bg-gradient-to-br from-blue-700 to-blue-900 text-white p-6 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                            <div className="h-10 -mx-6 bg-black/70" />
                            <div className="mt-6">
                                <div className="text-xs opacity-80">Security Code</div>
                                <div className="bg-white text-black rounded px-3 py-2 w-28 mt-1 text-right">
                                    <span id="svgsecurity">{formattedCvc}</span>
                                </div>
                            </div>
                            <div className="absolute bottom-4 right-6 text-2xl font-bold">VISA</div>
                        </div>
                    </div>
                </div>

                {/* Stripe Elements Form */}
                {stripePromise && (
                    <Elements stripe={stripePromise}>
                        <PaymentForm 
                            name={name} 
                            setName={setName} 
                            flipped={flipped} 
                            setFlipped={setFlipped}
                            subscriptionInfo={subscriptionInfo}
                            userData={userData}
                        />
                    </Elements>
                )}
            </div>

            {/* Payment History Table */}
            <div className="mt-10">
                <h3 className="text-xl font-semibold text-brand mb-4">Payment History</h3>
                <div className="rounded border border-[color:var(--primary)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-[color:var(--primary)]/10 text-brand">
                                <tr>
                                    <th className="px-4 py-2 border-b text-left text-brand/80 font-medium">Month</th>
                                    <th className="px-4 py-2 border-b text-left text-brand/80 font-medium">Year</th>
                                    <th className="px-4 py-2 border-b text-left text-brand/80 font-medium">Price</th>
                                    <th className="px-4 py-2 border-b text-left text-brand/80 font-medium">Status</th>
                                    <th className="px-4 py-2 border-b text-left text-brand/80 font-medium">Payment ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                            Loading payment history...
                                        </td>
                                    </tr>
                                ) : userPayments.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                            No payment history found
                                        </td>
                                    </tr>
                                ) : (
                                    formatPaymentData(userPayments).map((payment, idx) => (
                                        <tr key={payment.paymentId} className="border-t border-[color:var(--primary)]/20">
                                            <td className="px-4 py-3 whitespace-nowrap">{payment.month}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{payment.year}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {payment.currency === 'eur' ? '€' : '$'}{(payment.price / 100).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    payment.status === "Paid"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                }`}>
                                                    {payment.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                                                {payment.paymentId}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
