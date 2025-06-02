import React from 'react';
import { BookOpen } from 'lucide-react'; // Of een andere loader

const LoadingSpinner = ({ message = "Laden..."}) => {
  return (
    <div className="fixed inset-0 bg-gray-100 bg-opacity-75 flex flex-col items-center justify-center z-[100]">
      <BookOpen className="w-16 h-16 text-emerald-600 animate-spin mb-4" />
      <p className="text-lg font-semibold text-gray-700">{message}</p>
    </div>
  );
};

export default LoadingSpinner;