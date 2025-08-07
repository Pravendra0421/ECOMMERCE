/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Use remotePatterns for more robust and flexible configuration
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**", // Allow any path on placehold.co
      },
      {
        // This is the one you need to add for Cloudinary
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**', 
      },
      {
        protocol: "https",
        hostname: "example.com", // If you still use this
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com", // <--- Add this
        port: "",
        pathname: "/images/**", // This path matches your example URL: /images/I/
      },
      {
        // <-- Add this new pattern for Facebook
        protocol: "https",
        hostname: "www.facebook.com",
        port: "",
        pathname: "/tr/**", // Specifically for the Meta Pixel tracking image path
      },
      // If you have other image domains, add them here following the same structure
    ],
  },
};

export default nextConfig;
