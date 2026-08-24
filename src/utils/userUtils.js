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
