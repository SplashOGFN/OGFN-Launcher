# Code Obfuscation Guide

This project includes multiple layers of obfuscation to protect the codebase from reverse engineering.

## Frontend Obfuscation (Next.js)

The frontend uses `webpack-obfuscator` to obfuscate JavaScript/TypeScript code in production builds.

### Features Enabled:
- String array rotation and encoding (RC4)
- Control flow flattening
- Dead code injection
- Debug protection
- Console output disabled
- Self-defending code
- Compact output
- Hexadecimal identifier names

### Building with Obfuscation:

```bash
# Install dependencies first
npm install

# Build with obfuscation (production only)
npm run build:obfuscated

# Or build the full Tauri app with obfuscation
npm run tauri:build
```

**Note:** Obfuscation only runs in production mode (`NODE_ENV=production`). Development builds are not obfuscated for easier debugging.

## Backend Obfuscation (Rust)

The Rust backend uses aggressive compiler optimizations to make reverse engineering difficult.

### Release Profile Settings:
- `opt-level = "z"`: Optimize for size
- `lto = true`: Link-time optimization
- `codegen-units = 1`: Single codegen unit for better optimization
- `panic = "abort"`: Abort on panic (no stack traces)
- `strip = true`: Strip debug symbols
- `incremental = false`: Disable incremental compilation

### Building the Rust Backend:

```bash
# Build with release optimizations
cd src-tauri
cargo build --release

# Or use the Tauri CLI
npm run tauri:build
```

## Environment Variables

### Frontend (Next.js)
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

### Backend (Rust)
Set the `BACKEND_URL` environment variable before building:

```bash
# Windows (PowerShell)
$env:BACKEND_URL="https://your-backend-url.com"
npm run tauri:build

# Windows (CMD)
set BACKEND_URL=https://your-backend-url.com
npm run tauri:build

# Linux/Mac
export BACKEND_URL=https://your-backend-url.com
npm run tauri:build
```

## Security Notes

1. **Obfuscation is not encryption**: It makes reverse engineering harder but not impossible.
2. **Server-side validation**: Always validate requests on your backend, never trust the client.
3. **API keys**: Never hardcode API keys in the frontend. Use environment variables.
4. **Debug protection**: The obfuscation includes debug protection that will detect if the code is being debugged.
5. **Console disabled**: All console.log statements are removed in production builds.

## Additional Recommendations

1. **Code signing**: Sign your executable to prevent tampering
2. **Anti-debugging**: Consider adding additional anti-debugging measures
3. **Packaging**: Use UPX or similar packers to further compress and obfuscate the binary
4. **Regular updates**: Update your obfuscation techniques regularly as tools improve

## Troubleshooting

If the build fails after obfuscation:
1. Try reducing obfuscation settings in `next.config.ts`
2. Check if all dependencies are compatible with obfuscation
3. Test without obfuscation first to ensure the build works
