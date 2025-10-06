/**
 * Subscription Management Utilities
 * Handles automatic subscription detection, status checking, and amount calculation
 */

export const SUBSCRIPTION_STATES = {
  ACTIVE: 'active',
  EXPIRED: 'expired', 
  PENDING: 'pending',
  CANCELLED: 'cancelled'
};

export const SUBSCRIPTION_DURATION_DAYS = 30;
export const MONTHLY_AMOUNT_CENTS = 1200; // €12.00

/**
 * Check if subscription is active, expired, or needs renewal
 * @param {Object} user - User object with subscription data
 * @returns {Object} - Subscription status and details
 */
export const checkSubscriptionStatus = (user) => {
  if (!user || !user.subscriptionExpiry) {
    return {
      status: SUBSCRIPTION_STATES.EXPIRED,
      message: 'No subscription found',
      daysRemaining: 0,
      isExpired: true,
      needsRenewal: true
    };
  }

  const now = new Date();
  const expiryDate = new Date(user.subscriptionExpiry);
  const timeDiff = expiryDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  if (daysRemaining > 0) {
    return {
      status: SUBSCRIPTION_STATES.ACTIVE,
      message: `Subscription active for ${daysRemaining} more days`,
      daysRemaining: daysRemaining,
      isExpired: false,
      needsRenewal: false,
      expiryDate: expiryDate
    };
  } else {
    const daysOverdue = Math.abs(daysRemaining);
    return {
      status: SUBSCRIPTION_STATES.EXPIRED,
      message: `Subscription expired ${daysOverdue} days ago`,
      daysRemaining: 0,
      daysOverdue: daysOverdue,
      isExpired: true,
      needsRenewal: true,
      expiryDate: expiryDate
    };
  }
};

/**
 * Calculate payment amount based on subscription status
 * @param {Object} user - User object with subscription data
 * @returns {Object} - Payment details and amount
 */
export const calculatePaymentAmount = (user) => {
  const subscriptionStatus = checkSubscriptionStatus(user);
  
  if (subscriptionStatus.status === SUBSCRIPTION_STATES.ACTIVE) {
    // Early renewal - user is paying before expiry
    return {
      amount: MONTHLY_AMOUNT_CENTS,
      currency: 'eur',
      type: 'early_renewal',
      message: `Renew subscription (${subscriptionStatus.daysRemaining} days remaining)`,
      description: 'Extend your subscription by 30 days from today',
      isEarlyRenewal: true,
      daysRemaining: subscriptionStatus.daysRemaining
    };
  } else {
    // Expired subscription - needs immediate renewal
    return {
      amount: MONTHLY_AMOUNT_CENTS,
      currency: 'eur', 
      type: 'renewal',
      message: subscriptionStatus.daysOverdue > 0 
        ? `Renew expired subscription (${subscriptionStatus.daysOverdue} days overdue)`
        : 'Start new subscription',
      description: 'Activate your subscription for 30 days',
      isExpired: true,
      daysOverdue: subscriptionStatus.daysOverdue || 0
    };
  }
};

/**
 * Get subscription display information
 * @param {Object} user - User object with subscription data
 * @returns {Object} - Display information for UI
 */
export const getSubscriptionDisplayInfo = (user) => {
  const status = checkSubscriptionStatus(user);
  const paymentInfo = calculatePaymentAmount(user);
  
  return {
    status: status.status,
    message: status.message,
    daysRemaining: status.daysRemaining,
    daysOverdue: status.daysOverdue,
    isExpired: status.isExpired,
    needsRenewal: status.needsRenewal,
    expiryDate: status.expiryDate,
    paymentAmount: paymentInfo.amount,
    paymentMessage: paymentInfo.message,
    paymentDescription: paymentInfo.description,
    paymentType: paymentInfo.type,
    isEarlyRenewal: paymentInfo.isEarlyRenewal,
    formattedAmount: `€${(paymentInfo.amount / 100).toFixed(2)}`
  };
};

/**
 * Calculate new expiry date after payment
 * @param {Object} user - Current user object
 * @param {Date} paymentDate - Date of payment (defaults to now)
 * @returns {Date} - New expiry date
 */
export const calculateNewExpiryDate = (user, paymentDate = new Date()) => {
  const subscriptionStatus = checkSubscriptionStatus(user);
  
  if (subscriptionStatus.status === SUBSCRIPTION_STATES.ACTIVE && subscriptionStatus.daysRemaining > 0) {
    // Early renewal - extend from current expiry date
    return new Date(subscriptionStatus.expiryDate.getTime() + (SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000));
  } else {
    // Expired or new subscription - start from payment date
    return new Date(paymentDate.getTime() + (SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000));
  }
};

/**
 * Check if user should see renewal prompt
 * @param {Object} user - User object with subscription data
 * @returns {boolean} - Whether to show renewal prompt
 */
export const shouldShowRenewalPrompt = (user) => {
  const status = checkSubscriptionStatus(user);
  return status.needsRenewal || status.daysRemaining <= 3; // Show prompt 3 days before expiry
};

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
