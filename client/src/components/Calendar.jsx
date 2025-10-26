import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const Calendar = ({ isOpen, onClose, onDateSelect, selectedDate, minDate }) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth());
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateDisabled = (date) => {
    if (!minDate) return false;
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    return (
      date.getFullYear() < currentYear ||
      (date.getFullYear() === currentYear && date.getMonth() < currentMonth)
    );
  };

  const isDateSelected = (date) => {
    if (!selectedDate) return false;
    return (
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate()
    );
  };

  const handleDateClick = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (!isDateDisabled(date)) {
      onDateSelect(date);
      onClose();
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth()));
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-8 w-8"></div>
      );
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isDisabled = isDateDisabled(date);
      const isSelected = isDateSelected(date);
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          disabled={isDisabled}
          className={`
            h-8 w-8 rounded-lg text-sm font-medium transition
            ${isDisabled 
              ? 'text-gray-500 cursor-not-allowed' 
              : isSelected
                ? 'bg-primary text-white'
                : 'text-gray-300 hover:bg-gray-600 hover:text-white'
            }
          `}
        >
          {day}
        </button>
      );
    }

    return days;
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
      <div className="bg-gray-800 rounded-lg max-w-sm w-full">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Select Expiry Date</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition"
            >
              ×
            </button>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-gray-700 rounded transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="text-center">
              <h4 className="text-lg font-medium">
                {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h4>
            </div>
            
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-700 rounded transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {days.map(day => (
              <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {renderCalendar()}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleToday}
              className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition"
            >
              Today
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 border border-gray-600 text-gray-300 hover:bg-gray-700 rounded-lg text-sm transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;