import React from 'react';

/**
 * Get user initials from name
 * @param {string} name - User's full name
 * @returns {string} - User initials (max 2 characters)
 */
export const getUserInitials = (name) => {
  if (!name || typeof name !== 'string') {
    return 'U';
  }

  // Split name by spaces and take first letter of each word
  const words = name.trim().split(' ').filter(word => word.length > 0);
  
  if (words.length === 0) {
    return 'U';
  }

  if (words.length === 1) {
    // For single word names, take first 2 letters
    return words[0].substring(0, 2).toUpperCase();
  }

  // For multiple words, take first letter of first 2 words
  return words.slice(0, 2).map(word => word[0].toUpperCase()).join('');
};

/**
 * Generate user avatar with initials
 * @param {string} name - User's full name
 * @param {string} className - Additional CSS classes
 * @param {string} size - Size variant (sm, md, lg)
 * @returns {JSX.Element} - Avatar component with initials
 */
export const UserAvatar = ({ name, className = '', size = 'md' }) => {
  const initials = getUserInitials(name);
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  return (
    <div 
      className={`
        ${sizeClasses[size] || sizeClasses.md} 
        bg-gradient-to-br from-[#2f5d31] to-[#004a6b] 
        text-white 
        rounded-full 
        flex 
        items-center 
        justify-center 
        font-medium 
        shadow-sm
        ${className}
      `}
    >
      {initials}
    </div>
  );
};
