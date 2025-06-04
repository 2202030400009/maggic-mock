
// Utility function to check if a URL is a valid image URL
export const isValidImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  // Check if it's a valid URL format
  try {
    new URL(url);
  } catch {
    return false;
  }
  
  // Check if it has an image extension or is from common image hosting services
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
  const lowerUrl = url.toLowerCase();
  
  // Check for direct image extensions
  if (imageExtensions.some(ext => lowerUrl.includes(ext))) {
    return true;
  }
  
  // Check for common image hosting services
  const imageHosts = [
    'imgur.com',
    'i.imgur.com',
    'images.unsplash.com',
    'unsplash.com',
    'pixabay.com',
    'pexels.com',
    'flickr.com',
    'googleusercontent.com',
    'cloudinary.com',
    'amazonaws.com'
  ];
  
  return imageHosts.some(host => lowerUrl.includes(host));
};
