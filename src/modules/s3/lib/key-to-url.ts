const BASE_URL = (process.env.NEXT_PUBLIC_S3_PUBLIC_URL || "").replace(
  /\/+$/,
  ""
);

const ABSOLUTE_URL_PATTERN = /^(?:[a-z][a-z\d+\-.]*:)?\/\//i;

export const keyToUrl = (key: string | undefined | null) => {
  if (!key) {
    return "";
  }

  if (
    ABSOLUTE_URL_PATTERN.test(key) ||
    key.startsWith("data:") ||
    key.startsWith("blob:") ||
    key.startsWith("/")
  ) {
    return key;
  }

  const normalizedKey = key.replace(/^\/+/, "");

  return BASE_URL ? `${BASE_URL}/${normalizedKey}` : `/${normalizedKey}`;
};
