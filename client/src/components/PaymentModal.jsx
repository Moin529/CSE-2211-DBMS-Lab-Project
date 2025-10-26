import React, { useState } from 'react';
import { X, CreditCard, Lock, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import Calendar from './Calendar';
import toast from 'react-hot-toast';

const PaymentModal = ({ isOpen, onClose, booking, onPaymentSuccess }) => {
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    email: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedExpiryDate, setSelectedExpiryDate] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number with spaces
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (formattedValue.length > 19) return; // Limit to 16 digits + 3 spaces
    }
    
    // Format expiry date (only allow manual input if not using calendar)
    if (name === 'expiryDate' && !showCalendar) {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.substring(0, 2) + '/' + formattedValue.substring(2, 4);
      }
      if (formattedValue.length > 5) return;
    }
    
    // Limit CVV to 3 digits
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 3);
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCalendarDateSelect = (date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const formattedDate = `${month}/${year}`;
    
    setFormData(prev => ({
      ...prev,
      expiryDate: formattedDate
    }));
    
    setSelectedExpiryDate(date);
    setShowCalendar(false);
    
    // Clear error when date is selected
    if (errors.expiryDate) {
      setErrors(prev => ({
        ...prev,
        expiryDate: ''
      }));
    }
  };

  const handleCalendarToggle = () => {
    setShowCalendar(!showCalendar);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length !== 16) {
      newErrors.cardNumber = 'Please enter a valid 16-digit card number';
    }

    if (!formData.expiryDate || formData.expiryDate.length !== 5) {
      newErrors.expiryDate = 'Please enter a valid expiry date (MM/YY)';
    } else {
      const [month, year] = formData.expiryDate.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      
      if (parseInt(month) < 1 || parseInt(month) > 12) {
        newErrors.expiryDate = 'Please enter a valid month (01-12)';
      } else if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        newErrors.expiryDate = 'Card has expired';
      }
    }

    if (!formData.cvv || formData.cvv.length !== 3) {
      newErrors.cvv = 'Please enter a valid 3-digit CVV';
    }

    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'Please enter the cardholder name';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email address';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate random payment success/failure (90% success rate)
      const isSuccess = Math.random() > 0.1;
      
      if (isSuccess) {
        toast.success('Payment processed successfully!');
        onPaymentSuccess(booking._id);
        onClose();
      } else {
        toast.error('Payment failed. Please try again or use a different card.');
      }
    } catch (error) {
      toast.error('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setFormData({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: '',
        email: ''
      });
      setErrors({});
      setSelectedExpiryDate(null);
      setShowCalendar(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4"
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        background: 'rgba(0, 0, 0, 0.2)'
      }}
    >
      <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Complete Payment</h2>
            </div>
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="text-gray-400 hover:text-white transition disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Booking Summary */}
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="font-medium mb-2">Booking Summary</h3>
            <div className="text-sm text-gray-300 space-y-1">
              <p><span className="text-gray-400">Movie:</span> {booking?.show?.movie?.title}</p>
              <p><span className="text-gray-400">Date:</span> {new Date(booking?.show?.showDateTime).toLocaleDateString()}</p>
              <p><span className="text-gray-400">Time:</span> {new Date(booking?.show?.showDateTime).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })}</p>
              <p><span className="text-gray-400">Seats:</span> {booking?.bookedSeats?.join(", ")}</p>
              <div className="flex justify-between items-center pt-2 border-t border-gray-600">
                <span className="text-gray-400">Total Amount:</span>
                <span className="text-lg font-semibold text-primary">${booking?.amount}</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Card Number */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Card Number
              </label>
              <input
                type="text"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleInputChange}
                placeholder="1234 5678 9012 3456"
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.cardNumber ? 'border-red-500' : 'border-gray-600'
                }`}
                disabled={isProcessing}
              />
              {errors.cardNumber && (
                <p className="text-red-400 text-xs mt-1">{errors.cardNumber}</p>
              )}
            </div>

            {/* Expiry and CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expiry Date
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    placeholder="MM/YY"
                    className={`w-full px-3 py-2 pr-10 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.expiryDate ? 'border-red-500' : 'border-gray-600'
                    }`}
                    disabled={isProcessing}
                  />
                  <button
                    type="button"
                    onClick={handleCalendarToggle}
                    disabled={isProcessing}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition disabled:opacity-50"
                  >
                    <CalendarIcon className="w-4 h-4" />
                  </button>
                </div>
                {errors.expiryDate && (
                  <p className="text-red-400 text-xs mt-1">{errors.expiryDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CVV
                </label>
                <input
                  type="text"
                  name="cvv"
                  value={formData.cvv}
                  onChange={handleInputChange}
                  placeholder="123"
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.cvv ? 'border-red-500' : 'border-gray-600'
                  }`}
                  disabled={isProcessing}
                />
                {errors.cvv && (
                  <p className="text-red-400 text-xs mt-1">{errors.cvv}</p>
                )}
              </div>
            </div>

            {/* Cardholder Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cardholder Name
              </label>
              <input
                type="text"
                name="cardholderName"
                value={formData.cardholderName}
                onChange={handleInputChange}
                
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.cardholderName ? 'border-red-500' : 'border-gray-600'
                }`}
                disabled={isProcessing}
              />
              {errors.cardholderName && (
                <p className="text-red-400 text-xs mt-1">{errors.cardholderName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.email ? 'border-red-500' : 'border-gray-600'
                }`}
                disabled={isProcessing}
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Security Notice */}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Lock className="w-4 h-4" />
              <span>Your payment information is secure and encrypted</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-primary hover:bg-primary-dull disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Pay ${booking?.amount}
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Calendar Modal */}
      <Calendar
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        onDateSelect={handleCalendarDateSelect}
        selectedDate={selectedExpiryDate}
        minDate={new Date()}
      />
    </div>
  );
};

export default PaymentModal;