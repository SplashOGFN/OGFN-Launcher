const WebpackObfuscator = require('webpack-obfuscator');

module.exports = {
  webpack: (config, { isServer }) => {
    // Only obfuscate client-side code
    if (!isServer) {
      config.plugins.push(
        new WebpackObfuscator({
          rotateStringArray: true,
          stringArray: true,
          stringArrayThreshold: 0.75,
          compact: true,
          controlFlowFlattening: true,
          controlFlowFlatteningThreshold: 0.75,
          deadCodeInjection: true,
          deadCodeInjectionThreshold: 0.4,
          debugProtection: false, // Set to true for production
          debugProtectionInterval: 0,
          disableConsoleOutput: true,
          identifierNamesGenerator: 'hexadecimal',
          log: false,
          numbersToExpressions: true,
          renameGlobals: false,
          selfDefending: true,
          simplify: true,
          splitStrings: true,
          splitStringsChunkLength: 10,
          stringArrayEncoding: ['rc4'],
          transformObjectKeys: true,
          unicodeEscapeSequence: false,
        }, [])
      );
    }
    return config;
  },
};
