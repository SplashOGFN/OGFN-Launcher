const BASE_URL =
  process.env.NODE_ENV === "development"
    ? "https://overpower-irritate-dealt.ngrok-free.dev"
    : "https://overpower-irritate-dealt.ngrok-free.dev";

export const endpoints = {
  GET_BASE_URL: BASE_URL,
  GET_DISCORD_URI: `${BASE_URL}/api/auth/discord/url`,
  GET_LAUNCHER: `${BASE_URL}/launcher/status`,
  GET_LAUNCHER_TRAILER: `${BASE_URL}/launcher/trailer`,
  GET_LAUNCHER_NEWS: `${BASE_URL}/launcher/news`,
  GET_SHOP: `${BASE_URL}/shop/items`,
  GET_COMMITS: `${BASE_URL}/launcher/commits`,
  GET_GENERATE_ACCOUNT_RESP: `${BASE_URL}/splash/api/v2/launcher/account`,
  GET_ACTIVE_CHECK: `${BASE_URL}/splash/api/v2/launcher/account/active`,
  POST_EDIT_DISPLAYNAME: `${BASE_URL}/splash/api/v2/launcher/account/edit/display`,
} as const;
