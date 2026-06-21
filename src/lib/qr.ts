import QRCode from "qrcode";

export async function generateQrDataUrl(url: string, color = "#0a3d2b"): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 512,
    color: { dark: color, light: "#ffffff" },
  });
}

export function buildPortalUrl(shopCode: string): string {
  const baseUrl = import.meta.env.VITE_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  return `${normalizedBaseUrl}/order/${shopCode}`;
}
