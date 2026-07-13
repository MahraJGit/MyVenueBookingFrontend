export function isPrivateS3Url(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes(".s3.") && host.endsWith(".amazonaws.com");
  } catch {
    return false;
  }
}
