/**
 * Satori-shaped layers for the flattening tests: each one reproduces the markup
 * Satori emits for a given construct, so the assertions exercise the exact
 * shapes the pipeline meets.
 */

const svgOpen =
  '<svg width="40" height="20" viewBox="0 0 40 20" xmlns="http://www.w3.org/2000/svg">';

const icon = (extra: string): string =>
  encodeURIComponent(
    `<svg  aria-label="Icon" role="img" tw="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="null" height="null" viewBox="0 0 2 2">${extra}<path d="M0 0h2v2H0z" fill="#ff0000" tw="undefined"/></svg>`,
  );

const iconImage = (clip: string, extra = ""): string =>
  `<clipPath id="satori_cp-id-0"><rect x="${clip}" y="0" width="20" height="20"/></clipPath><mask id="satori_om-id-0"><rect x="20" y="0" width="20" height="20" fill="#fff"/></mask><image x="20" y="0" width="20" height="20" href="data:image/svg+xml;utf8,${icon(extra)}" preserveAspectRatio="none" style="filter:none" clip-path="url(#satori_cp-id-0)" mask="url(#satori_om-id-0)"/>`;

const Layers = {
  icon: `${svgOpen}${iconImage("20")}</svg>`,
  invisible: `${svgOpen}<defs><pattern id="satori_pattern_id_0" x="0" y="0" width="1" height="1" patternUnits="objectBoundingBox"><linearGradient id="satori_biid_0" x1="0" y1="0" x2="0" y2="1" spreadMethod="pad"><stop offset="0%" stop-color="transparent"/><stop offset="100%" stop-color="transparent"/></linearGradient><rect x="0" y="0" width="40" height="20" fill="url(#satori_biid_0)"/></pattern></defs><mask id="satori_ms-id-0" maskUnits="userSpaceOnUse"><rect x="0" y="0" width="40" height="20" fill="#fff"/><rect x="0" y="0" width="40" height="20" fill="#000"  stroke-width="0"/></mask><defs><filter id="satori_s-id-0" x="0%" y="0%" width="100%" height="100%"><feGaussianBlur stdDeviation="0" result="b"/><feFlood flood-color="transparent" in="SourceGraphic" result="f"/><feComposite in="f" in2="b" operator="in"/></filter></defs><g mask="url(#satori_ms-id-0)" filter="url(#satori_s-id-0)" opacity="1"><rect x="0" y="0" width="40" height="20" fill="#fff" stroke="#fff" stroke-width="0"/></g><mask id="satori_om-id"><rect x="0" y="0" width="40" height="20" fill="#fff"/></mask><rect x="0" y="0" width="40" height="20" fill="transparent" style="filter:none"/><rect x="0" y="0" width="40" height="20" fill="url(#satori_pattern_id_0)" style="filter:none"/><defs><filter id="satori_s-id-1"><feFlood flood-color="#000" result="f"/><feComposite in="f" in2="SourceAlpha" operator="in"/></filter></defs><rect x="10" y="5" width="10" height="10" fill="#00f" filter="url(#satori_s-id-1)"/><g opacity="0"></g><g><g opacity="0"> </g></g></svg>`,
  nonPortable: `${svgOpen}${iconImage("20", "<style>path{fill:blue}</style>")}</svg>`,
  styled: `${svgOpen}<style>.painted{stroke:#000}</style><rect x="0" y="0" width="40" height="20" fill="transparent" class="painted"/></svg>`,
  unclipped: `${svgOpen}${iconImage("10")}</svg>`,
} as const;

const Flatten = {
  prefix: "l0-",
  reference: /url\(#([^)]+)\)/g,
} as const;

export { Flatten, Layers };
