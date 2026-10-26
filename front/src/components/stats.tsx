import "server-only"

import Script from "next/script";
import { connection } from "next/server"

export default async function Stats() {
  await connection();

  const scriptUrl = process.env.STATS_SCRIPT_URL;
  const websiteId = process.env.STATS_WEBSITE_ID;

  if (!scriptUrl || !websiteId) {
    return null;
  }

  return (
    <Script 
      id="umami"
      src={scriptUrl}
      data-website-id={websiteId}
      strategy="afterInteractive"
    />
  )
}
