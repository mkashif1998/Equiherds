/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lms-api.wiserbee.ca',
      },
    ],
  },
};

export default nextConfig;
