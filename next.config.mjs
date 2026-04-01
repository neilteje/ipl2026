/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.cricapi.com',
      },
      {
        protocol: 'https',
        hostname: 'cricbuzz-cricket.p.rapidapi.com',
      },
    ],
  },
};

export default nextConfig;
