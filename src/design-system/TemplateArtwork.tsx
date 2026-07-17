import type { TemplateKey } from "@/domain/template-keys";

export function TemplateArtwork({
  templateKey,
  className = "",
}: {
  templateKey: TemplateKey;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 160 112"
      className={className}
      role="img"
      aria-label={`${templateKey.replaceAll("-", " ")} illustration`}
    >
      <rect width="160" height="112" rx="18" fill="var(--fw-color-primary-subtle)" />
      <Artwork templateKey={templateKey} />
    </svg>
  );
}

function Artwork({ templateKey }: { templateKey: TemplateKey }) {
  const ink = "var(--fw-color-ink)";
  const blue = "var(--fw-color-primary)";
  const coral = "var(--fw-color-coral)";
  const white = "var(--fw-color-surface)";

  switch (templateKey) {
    case "wheel":
      return (
        <g transform="translate(80 58)">
          <path d="M0 0 L0 -38 A38 38 0 0 1 32.9 19 Z" fill={blue} />
          <path d="M0 0 L32.9 19 A38 38 0 0 1 -32.9 19 Z" fill={coral} />
          <path d="M0 0 L-32.9 19 A38 38 0 0 1 0 -38 Z" fill="#20a47a" />
          <circle r="8" fill={white} stroke={ink} strokeWidth="3" />
          <path d="M0 -49 l-6 10 h12z" fill={ink} />
        </g>
      );
    case "matching-pairs":
      return (
        <g stroke={ink} strokeWidth="2.5">
          <rect x="31" y="25" width="42" height="58" rx="8" fill={white} transform="rotate(-7 52 54)" />
          <rect x="87" y="29" width="42" height="58" rx="8" fill={white} transform="rotate(6 108 58)" />
          <path d="M46 53 h15 M53.5 45.5 v15" stroke={blue} strokeWidth="6" strokeLinecap="round" />
          <path d="M100 53 l7 7 13-16" stroke={coral} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "gameshow-quiz":
      return (
        <g>
          <rect x="24" y="22" width="112" height="68" rx="12" fill={ink} />
          <circle cx="40" cy="36" r="4" fill={coral} />
          <circle cx="52" cy="36" r="4" fill="#ffd36a" />
          <rect x="40" y="50" width="80" height="8" rx="4" fill={white} />
          <rect x="40" y="66" width="36" height="10" rx="5" fill={blue} />
          <rect x="84" y="66" width="36" height="10" rx="5" fill={coral} />
          <path d="M62 90 v9 M98 90 v9" stroke={ink} strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case "wordsearch":
      return (
        <g transform="translate(43 20)">
          {[0, 1, 2, 3].flatMap((row) =>
            [0, 1, 2, 3].map((col) => (
              <rect
                key={`${row}-${col}`}
                x={col * 19}
                y={row * 19}
                width="16"
                height="16"
                rx="4"
                fill={row === 2 ? blue : white}
                stroke={row === 2 ? blue : "var(--fw-color-border-strong)"}
              />
            )),
          )}
          <path d="M7 46 h61" stroke={coral} strokeWidth="4" strokeLinecap="round" opacity=".9" />
        </g>
      );
    case "image-quiz":
      return (
        <g>
          <rect x="29" y="21" width="102" height="70" rx="10" fill={white} stroke={ink} strokeWidth="2.5" />
          <circle cx="53" cy="43" r="9" fill="#ffd36a" />
          <path d="M38 78 l24-23 15 14 12-10 32 19z" fill={blue} opacity=".88" />
          <path d="M80 21 v70 M29 56 h102" stroke={white} strokeWidth="4" />
          <circle cx="123" cy="86" r="13" fill={coral} stroke={white} strokeWidth="4" />
        </g>
      );
    case "true-false":
      return (
        <g>
          <rect x="24" y="29" width="112" height="56" rx="14" fill={white} stroke={ink} strokeWidth="2.5" />
          <path d="M80 30 v54" stroke="var(--fw-color-border)" strokeWidth="2" />
          <path d="M43 56 l8 8 15-19" stroke={blue} strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M99 48 l16 16 M115 48 L99 64" stroke={coral} strokeWidth="7" strokeLinecap="round" />
        </g>
      );
    default: {
      const exhaustive: never = templateKey;
      return exhaustive;
    }
  }
}
