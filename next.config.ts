<<<<<<< HEAD
import type { NextConfig } from "next";
=======
const isProd = process.env.NODE_ENV === 'production';
const shouldObfuscate = process.env.OBFUSCATE === 'true';
>>>>>>> 6feae503997c688b92f634f49d5eb352a43ce471

const isProd = process.env.NODE_ENV === 'production';
const internalHost = process.env.TAURI_DEV_HOST || 'localhost';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  assetPrefix: isProd ? undefined : `http://${internalHost}:3000`,
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
<<<<<<< HEAD
    if (!isServer && isProd) {
      const WebpackObfuscator = require("webpack-obfuscator");
      config.plugins.push(
        new WebpackObfuscator({
          compact: true,
          controlFlowFlattening: true,
          controlFlowFlatteningThreshold: 0.3,
          deadCodeInjection: true,
          deadCodeInjectionThreshold: 0.2,
          debugProtection: false,
          identifierNamesGenerator: "hexadecimal",
          rotateStringArray: true,
          selfDefending: true,
          shuffleStringArray: true,
          splitStrings: true,
          splitStringsChunkLength: 4,
          stringArray: true,
          stringArrayEncoding: ["base64"],
          stringArrayThreshold: 0.75,
          transformObjectKeys: true,
          unicodeEscapeSequence: false,
        }, ["**/*.js"])
      );
=======
    // Obfuscate client-side code when OBFUSCATE env var is set
    if (!isServer && shouldObfuscate) {
      try {
        const WebpackObfuscator = require('webpack-obfuscator');
        config.plugins.push(
          new WebpackObfuscator({
            compact: true,
            controlFlowFlattening: false,
            deadCodeInjection: false,
            debugProtection: false,
            disableConsoleOutput: false,
            identifierNamesGenerator: 'mangled',
            log: false,
            renameGlobals: false,
            selfDefending: false,
            simplify: true,
            stringArray: true,
            stringArrayThreshold: 0.5,
            stringArrayEncoding: [],
            unicodeEscapeSequence: false,
          }, [])
        );
      } catch (e) {
        console.warn('WebpackObfuscator not available, skipping obfuscation');
      }
>>>>>>> 6feae503997c688b92f634f49d5eb352a43ce471
    }
    return config;
  },
};

export default nextConfig;