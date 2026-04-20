// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   experimental: {
//     serverActions: true,
//   },
//   images: {
//     remotePatterns: [
//       {
//         protocol: 'https',
//         hostname: 'res.cloudinary.com',
//         pathname: `/${process.env.CLOUDINARY_CLOUD_NAME}/**`,
//       },
//     ],
//   },
//   webpack: (config) => {
//     config.externals.push({
//       "utf-8-validate": "commonjs utf-8-validate",
//       bufferutil: "commonjs bufferutil",
//     });
//     return config;
//   },
// };

// module.exports = nextConfig;


cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil",
    });
    return config;
  },
};
module.exports = nextConfig;
EOF