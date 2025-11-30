'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle, Loader2, CreditCard, User, Mail, Phone, Gift } from 'lucide-react';
import { ticketsApi, paymentsApi } from '@/lib/api/tickets';
import { useAuth } from '@/hooks/useAuth';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [step, setStep] = useState(1); // 1: Details, 2: Payment, 3: Confirmation
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState(0);

  // Form data
  const [formData, setFormData] = useState({
    attendee_name: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : '',
    attendee_email: user?.email || '',
    attendee_phone: user?.phone_number || '',
  });

  const [transactionId, setTransactionId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  useEffect(() => {
    // Load checkout data from session
    const data = sessionStorage.getItem('checkout_data');
    if (!data) {
      console.warn('⚠️ [CHECKOUT] No checkout data found, redirecting to events');
      router.push('/events');
      return;
    }
    console.log('🎟️ [CHECKOUT] Loaded checkout data:', JSON.parse(data));
    const parsedData = JSON.parse(data);
    setCheckoutData(parsedData);

    // Validate promoter code if present
    if (parsedData.promoterCode && parsedData.event?.id) {
      validatePromoterCode(parsedData.promoterCode, parsedData.event.id);
    }

    // Cleanup: clear polling interval on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [router, pollingInterval]);

  const validatePromoterCode = async (code: string, eventId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/promoters/codes/validate?code=${code}&event_id=${eventId}`);
      const result = await response.json();

      if (result.success && result.valid) {
        setDiscountPercentage(result.data.discount_percentage);
        console.log('✅ [CHECKOUT] Promoter code validated:', result.data);
      } else {
        console.warn('⚠️ [CHECKOUT] Invalid promoter code:', result.data.message);
      }
    } catch (err) {
      console.error('❌ [CHECKOUT] Failed to validate promoter code:', err);
    }
  };

  const getSubtotal = () => {
    if (!checkoutData) return 0;
    return Object.entries(checkoutData.selectedTickets).reduce((total: number, [typeId, qty]: any) => {
      const ticketType = checkoutData.ticketTypes.find((t: any) => t.id === typeId);
      return total + (ticketType ? parseFloat(ticketType.price) * qty : 0);
    }, 0);
  };

  const getDiscountAmount = () => {
    if (!discountPercentage) return 0;
    return (getSubtotal() * discountPercentage) / 100;
  };

  const getTotalAmount = () => {
    return getSubtotal() - getDiscountAmount();
  };

  const getTotalTickets = () => {
    if (!checkoutData) return 0;
    return Object.values(checkoutData.selectedTickets).reduce((sum: number, qty: any) => sum + qty, 0);
  };

  const handlePurchase = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🎟️ [CHECKOUT] Starting cart purchase with data:', checkoutData.selectedTickets);

      // Build cart items array
      const cartItems = Object.entries(checkoutData.selectedTickets).map(([typeId, qty]) => ({
        ticket_type_id: typeId,
        quantity: qty as number,
      }));

      console.log('🎟️ [CHECKOUT] Cart items:', cartItems);

      // Create cart purchase request
      const cartPurchaseData = {
        items: cartItems,
        promoter_code: checkoutData.promoterCode || undefined,
        attendee_name: formData.attendee_name,
        attendee_email: formData.attendee_email,
        attendee_phone: formData.attendee_phone,
        use_loyalty_credits: false,
      };

      // Call cart purchase API (creates ONE transaction for ALL ticket types)
      console.log('🎟️ [CHECKOUT] Calling cart purchase API...');
      const purchaseResponse = await ticketsApi.purchaseCart(cartPurchaseData);
      console.log('🎟️ [CHECKOUT] Cart purchase response:', purchaseResponse);

      // Extract transaction ID
      const txId = purchaseResponse.transaction_id;
      console.log('🎟️ [CHECKOUT] Transaction ID:', txId);
      console.log('🎟️ [CHECKOUT] Total tickets created:', purchaseResponse.tickets.length);
      console.log('🎟️ [CHECKOUT] Amount to pay:', purchaseResponse.amount, 'KES');

      setTransactionId(txId);

      // Move to payment step
      setStep(2);

      // Initiate M-Pesa payment
      await initiateMpesaPayment(txId);

    } catch (err: any) {
      console.error('❌ [CHECKOUT] Purchase failed:', err);
      console.error('❌ [CHECKOUT] Error details:', err.response?.data);
      setError(err.response?.data?.detail || err.message || 'Failed to create purchase');
    } finally {
      setLoading(false);
    }
  };

  const initiateMpesaPayment = async (txId: string) => {
    try {
      setPaymentStatus('processing');

      console.log('💰 [PAYMENT] Initiating M-Pesa for transaction:', txId);
      console.log('💰 [PAYMENT] Phone number:', formData.attendee_phone);

      // Initiate M-Pesa STK Push
      const mpesaResponse = await paymentsApi.initiateMpesa(txId);
      console.log('💰 [PAYMENT] M-Pesa response:', mpesaResponse);

      if (mpesaResponse.success) {
        console.log('✅ [PAYMENT] M-Pesa STK push sent successfully');
        // Start polling for payment status
        pollPaymentStatus(txId);
      } else {
        console.error('❌ [PAYMENT] M-Pesa initiation failed:', mpesaResponse);
        setPaymentStatus('failed');
        setError('Failed to initiate M-Pesa payment');
      }
    } catch (err: any) {
      console.error('❌ [PAYMENT] M-Pesa initiation error:', err);
      console.error('❌ [PAYMENT] Error response:', err.response?.data);
      setPaymentStatus('failed');
      setError(err.response?.data?.detail || err.message || 'Payment initiation failed');
    }
  };

  const pollPaymentStatus = async (txId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // Poll for 5 minutes (10s intervals)

    console.log('🔄 [PAYMENT] Starting to poll payment status...');

    const interval = setInterval(async () => {
      try {
        attempts++;
        console.log(`🔄 [PAYMENT] Polling attempt ${attempts}/${maxAttempts}`);

        const status = await paymentsApi.getTransactionStatus(txId);
        console.log('🔄 [PAYMENT] Transaction status:', status);

        if (status.status === 'completed') {
          clearInterval(interval);
          setPollingInterval(null);
          console.log('✅ [PAYMENT] Payment completed successfully!');
          setPaymentStatus('success');
          setStep(3);

          // Clear checkout data
          sessionStorage.removeItem('checkout_data');
        } else if (status.status === 'failed' || status.status === 'cancelled' || attempts >= maxAttempts) {
          clearInterval(interval);
          setPollingInterval(null);
          console.error('❌ [PAYMENT] Payment failed or timed out');
          setPaymentStatus('failed');
          setError(status.status === 'cancelled' ? 'Payment was cancelled' : 'Payment failed or timed out. Please try again.');
        }
      } catch (err) {
        console.warn('⚠️ [PAYMENT] Polling error (will retry):', err);
        // Continue polling
      }
    }, 10000); // Poll every 10 seconds

    setPollingInterval(interval);
  };

  const handleConfirmPayment = async () => {
    if (!transactionId || checkingPayment) return;

    setCheckingPayment(true);
    console.log('✅ [PAYMENT] User clicked confirm payment, checking status immediately...');

    try {
      const status = await paymentsApi.getTransactionStatus(transactionId);
      console.log('✅ [PAYMENT] Manual check result:', status);

      if (status.status === 'completed') {
        // Stop polling
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }

        console.log('✅ [PAYMENT] Payment confirmed!');
        setPaymentStatus('success');
        setStep(3);

        // Clear checkout data
        sessionStorage.removeItem('checkout_data');
      } else if (status.status === 'failed' || status.status === 'cancelled') {
        // Stop polling
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }

        setPaymentStatus('failed');
        setError(status.status === 'cancelled' ? 'Payment was cancelled' : 'Payment verification failed. Please ensure you completed the M-Pesa payment.');
      } else {
        // Still pending - show message
        setError('Payment is still processing. Please complete the M-Pesa prompt on your phone first.');
      }
    } catch (err: any) {
      console.error('❌ [PAYMENT] Manual check error:', err);
      setError('Failed to verify payment. Please try again.');
    } finally {
      setCheckingPayment(false);
    }
  };

  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#EB7D30]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-comfortaa text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your ticket purchase</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#EB7D30]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-[#EB7D30] text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="font-semibold hidden sm:inline">Details</span>
            </div>
            <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-[#EB7D30]' : 'bg-gray-300'}`} />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#EB7D30]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-[#EB7D30] text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="font-semibold hidden sm:inline">Payment</span>
            </div>
            <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-[#EB7D30]' : 'bg-gray-300'}`} />
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-[#EB7D30]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-[#EB7D30] text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="font-semibold hidden sm:inline">Confirm</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              {/* Step 1: Attendee Details */}
              {step === 1 && (
                <>
                  <h2 className="font-comfortaa text-2xl font-bold text-gray-900 mb-6">Attendee Information</h2>
                  
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <User className="inline w-4 h-4 mr-1" />
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={formData.attendee_name}
                        onChange={(e) => setFormData({ ...formData, attendee_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EB7D30]"
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Mail className="inline w-4 h-4 mr-1" />
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={formData.attendee_email}
                        onChange={(e) => setFormData({ ...formData, attendee_email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EB7D30]"
                        placeholder="john@example.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Phone className="inline w-4 h-4 mr-1" />
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={formData.attendee_phone}
                        onChange={(e) => setFormData({ ...formData, attendee_phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EB7D30]"
                        placeholder="+254712345678"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">M-Pesa payment will be sent to this number</p>
                    </div>
                  </div>

                  <button
                    onClick={handlePurchase}
                    disabled={loading || !formData.attendee_name || !formData.attendee_email || !formData.attendee_phone}
                    className="w-full mt-8 py-4 bg-[#EB7D30] text-white font-bold rounded-full hover:bg-[#d66d20] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Proceed to Payment
                      </>
                    )}
                  </button>
                </>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <div className="text-center py-8">
                  {paymentStatus === 'processing' && (
                    <>
                      <div className="w-20 h-20 bg-[#EB7D30]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Loader2 className="w-10 h-10 text-[#EB7D30] animate-spin" />
                      </div>
                      <h2 className="font-comfortaa text-2xl font-bold text-gray-900 mb-3">
                        Complete Payment on Your Phone
                      </h2>
                      <p className="text-gray-600 mb-6">
                        Please check your phone for the M-Pesa prompt and enter your PIN to complete the payment.
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto mb-6">
                        <p className="text-blue-900 text-sm">
                          <strong>Amount:</strong> KSh {getTotalAmount().toLocaleString()}<br />
                          <strong>Phone:</strong> {formData.attendee_phone}
                        </p>
                      </div>

                      {/* Confirm Payment Button */}
                      <div className="max-w-md mx-auto">
                        <button
                          onClick={handleConfirmPayment}
                          disabled={checkingPayment}
                          className="w-full px-6 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {checkingPayment ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Verifying Payment...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-5 h-5" />
                              I've Completed the Payment
                            </>
                          )}
                        </button>
                        <p className="text-xs text-gray-500 text-center mt-3">
                          Click this button after you've entered your PIN and completed the payment on your phone
                        </p>
                      </div>
                    </>
                  )}

                  {paymentStatus === 'failed' && (
                    <>
                      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-red-600" />
                      </div>
                      <h2 className="font-comfortaa text-2xl font-bold text-gray-900 mb-3">
                        Payment Failed
                      </h2>
                      <p className="text-gray-600 mb-6">{error}</p>
                      <button
                        onClick={() => {
                          setStep(1);
                          setPaymentStatus('pending');
                          setError('');
                        }}
                        className="px-6 py-3 bg-[#EB7D30] text-white font-bold rounded-full hover:bg-[#d66d20] transition-colors"
                      >
                        Try Again
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Step 3: Confirmation */}
              {step === 3 && paymentStatus === 'success' && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="font-comfortaa text-2xl font-bold text-gray-900 mb-3">
                    Payment Successful!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Your tickets have been sent to <strong>{formData.attendee_email}</strong>
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => router.push('/dashboard/tickets')}
                      className="px-6 py-3 bg-[#EB7D30] text-white font-bold rounded-full hover:bg-[#d66d20] transition-colors"
                    >
                      View My Tickets
                    </button>
                    <button
                      onClick={() => router.push('/events')}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-full hover:border-[#EB7D30] transition-colors"
                    >
                      Browse More Events
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 className="font-comfortaa text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              
              {/* Event Info */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-900 mb-1">{checkoutData.event.title}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(checkoutData.event.start_datetime).toLocaleDateString()}
                </p>
              </div>

              {/* Tickets */}
              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                {Object.entries(checkoutData.selectedTickets).map(([typeId, qty]: any) => {
                  const ticketType = checkoutData.ticketTypes.find((t: any) => t.id === typeId);
                  if (!ticketType) return null;
                  
                  return (
                    <div key={typeId} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {qty}x {ticketType.name}
                      </span>
                      <span className="font-semibold">
                        KSh {(parseFloat(ticketType.price) * qty).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Promoter Code & Pricing */}
              <div className="space-y-3">
                {/* Subtotal */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">KSh {getSubtotal().toLocaleString()}</span>
                </div>

                {/* Promoter Code Discount */}
                {checkoutData.promoterCode && discountPercentage > 0 && (
                  <>
                    <div className="flex items-center justify-between text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4" />
                        <span>
                          <strong>{checkoutData.promoterCode}</strong> ({discountPercentage}% off)
                        </span>
                      </div>
                      <span className="font-semibold">-KSh {getDiscountAmount().toLocaleString()}</span>
                    </div>
                  </>
                )}

                {/* Show commission-only code (no discount for customer) */}
                {checkoutData.promoterCode && discountPercentage === 0 && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-lg">
                    <Gift className="w-4 h-4" />
                    <span>
                      Supporting promoter: <strong>{checkoutData.promoterCode}</strong>
                    </span>
                  </div>
                )}

                {/* Total */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-900 font-semibold">Total</span>
                    <span className="font-bold text-2xl text-[#EB7D30]">
                      KSh {getTotalAmount().toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 text-right">
                    {getTotalTickets()} ticket(s)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}