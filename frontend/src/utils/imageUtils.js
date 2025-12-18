const getBaseUrl = () => {
  const rawBase = process.env.REACT_APP_PUBLIC_FOLDER || "http://localhost:8800";
  return rawBase.replace(/\/+$/, "").replace(/\/images$/i, "");
};

// Utility function to get the correct image URL
export const getImageUrl = (imagePath, defaultImage = "person/noAvatar.png") => {
  const ensureImagesPath = (path) => {
    if (path.startsWith("/images/")) return path;
    if (path.startsWith("/")) return `/images${path}`;
    return `/images/${path}`;
  };

  if (!imagePath) {
    return `${getBaseUrl()}${ensureImagesPath(defaultImage)}`;
  }

  // Already absolute URL
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  const normalizedPath = ensureImagesPath(imagePath);
  return `${getBaseUrl()}${normalizedPath}`;
};

export const getImageBaseUrl = getBaseUrl;

// Utility for cover images
export const getCoverImageUrl = (coverPath) => {
  return getImageUrl(coverPath, "person/noCover.png");
};

// Utility for profile images  
export const getProfileImageUrl = (profilePath) => {
  return getImageUrl(profilePath, "person/noAvatar.png");
};