const S3_PUBLIC_URL = (process.env.NEXT_PUBLIC_S3_PUBLIC_URL || "").replace(
  /\/+$/,
  ""
);

const normalizeSrc = (src: string) => {
  if (S3_PUBLIC_URL && src.startsWith(`${S3_PUBLIC_URL}/`)) {
    return src.slice(S3_PUBLIC_URL.length + 1);
  }

  return src.startsWith("/") ? src.slice(1) : src;
};

export default function cloudflareLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  if (!S3_PUBLIC_URL || src.startsWith("/")) {
    return src;
  }
  // if (process.env.NODE_ENV === "development") {
  //   return src;
  // }
  const params = [`width=${width}`];
  if (quality) {
    params.push(`quality=${quality}`);
  }
  const paramsString = params.join(",");

  return `${S3_PUBLIC_URL}/cdn-cgi/image/${paramsString}/${normalizeSrc(src)}`;
}
