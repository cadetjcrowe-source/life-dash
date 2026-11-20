import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 24, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconToday = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
  </Base>
);
export const IconTasks = (p: P) => (
  <Base {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    <path d="m8 12.2 2.8 2.8L16.2 9.4" />
  </Base>
);
export const IconHabits = (p: P) => (
  <Base {...p}>
    <path d="M12 21s-7.5-4.6-7.5-10.4A4.4 4.4 0 0 1 12 8a4.4 4.4 0 0 1 7.5 2.6C19.5 16.4 12 21 12 21Z" />
  </Base>
);
export const IconProjects = (p: P) => (
  <Base {...p}>
    <rect x="3.5" y="4" width="7" height="7" rx="2" />
    <rect x="13.5" y="4" width="7" height="7" rx="2" />
    <rect x="3.5" y="14" width="7" height="6.5" rx="2" />
    <rect x="13.5" y="14" width="7" height="6.5" rx="2" />
  </Base>
);
export const IconJournal = (p: P) => (
  <Base {...p}>
    <path d="M6 3.5h10.5a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6z" />
    <path d="M6 3.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2M9.5 8.5h5.5M9.5 12h5.5" />
  </Base>
);
export const IconCalendar = (p: P) => (
  <Base {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Base>
);
export const IconReview = (p: P) => (
  <Base {...p}>
    <path d="M4 19.5V10M10 19.5V4.5M16 19.5v-7M21 19.5H3" />
  </Base>
);
export const IconSettings = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
  </Base>
);
export const IconPlus = (p: P) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);
export const IconMinus = (p: P) => (
  <Base {...p}>
    <path d="M5 12h14" />
  </Base>
);
export const IconClose = (p: P) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Base>
);
export const IconChevronLeft = (p: P) => (
  <Base {...p}>
    <path d="m15 5-7 7 7 7" />
  </Base>
);
export const IconChevronRight = (p: P) => (
  <Base {...p}>
    <path d="m9 5 7 7-7 7" />
  </Base>
);
export const IconChevronUp = (p: P) => (
  <Base {...p}>
    <path d="m5 15 7-7 7 7" />
  </Base>
);
export const IconChevronDown = (p: P) => (
  <Base {...p}>
    <path d="m5 9 7 7 7-7" />
  </Base>
);
export const IconInbox = (p: P) => (
  <Base {...p}>
    <path d="M3.5 13.5 6 5.5a2 2 0 0 1 1.9-1.4h8.2A2 2 0 0 1 18 5.5l2.5 8" />
    <path d="M3.5 13.5V18a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-4.5h-5a3 3 0 0 1-6 0z" />
  </Base>
);
export const IconTrash = (p: P) => (
  <Base {...p}>
    <path d="M4.5 7h15M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4.5h6V7" />
  </Base>
);
export const IconSearch = (p: P) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </Base>
);
export const IconPin = (p: P) => (
  <Base {...p}>
    <path d="m12 3 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.4l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z" />
  </Base>
);
export const IconMapPin = (p: P) => (
  <Base {...p}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.3" />
  </Base>
);
export const IconRepeat = (p: P) => (
  <Base {...p}>
    <path d="M17 2.5 20.5 6 17 9.5" />
    <path d="M3.5 11.5V10a4 4 0 0 1 4-4h13M7 21.5 3.5 18 7 14.5" />
    <path d="M20.5 12.5V14a4 4 0 0 1-4 4h-13" />
  </Base>
);
export const IconArchive = (p: P) => (
  <Base {...p}>
    <rect x="3" y="4" width="18" height="4.5" rx="1.5" />
    <path d="M5 8.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5M10 12.5h4" />
  </Base>
);
export const IconDownload = (p: P) => (
  <Base {...p}>
    <path d="M12 4v11M7 10.5l5 5 5-5M4.5 20h15" />
  </Base>
);
export const IconLogout = (p: P) => (
  <Base {...p}>
    <path d="M14.5 4.5h3a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-3M10 16.5 14.5 12 10 7.5M14.5 12H4" />
  </Base>
);
export const IconMore = (p: P) => (
  <Base {...p}>
    <circle cx="5.5" cy="12" r="1.2" fill="currentColor" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    <circle cx="18.5" cy="12" r="1.2" fill="currentColor" />
  </Base>
);
export const IconArrowRight = (p: P) => (
  <Base {...p}>
    <path d="M4.5 12h15M13.5 6l6 6-6 6" />
  </Base>
);
export const IconCamera = (p: P) => (
  <Base {...p}>
    <path d="M4.5 7.5h3l1.6-2.3a1 1 0 0 1 .8-.4h4.2a1 1 0 0 1 .8.4l1.6 2.3h3a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2V9.5a2 2 0 0 1 2-2Z" />
    <circle cx="12" cy="13.5" r="3.5" />
  </Base>
);
export const IconChecklist = (p: P) => (
  <Base {...p}>
    <path d="m4 6.5 1.5 1.5 3-3M4 13.5 5.5 15l3-3M11.5 7h8.5M11.5 14h8.5M4.5 19.5h15" />
  </Base>
);
export const IconDumbbell = (p: P) => (
  <Base {...p}>
    <path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11" />
  </Base>
);
export const IconGrid = (p: P) => (
  <Base {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
    <path d="M9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17" />
  </Base>
);
export const IconSun = (p: P) => (
  <Base {...p}>
    <path d="M3 17.5h18M6.5 17.5a5.5 5.5 0 0 1 11 0M12 6.5V4.5M5.6 9.6 4.2 8.2M18.4 9.6l1.4-1.4M7 21h10" />
  </Base>
);
export const IconBell = (p: P) => (
  <Base {...p}>
    <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" />
  </Base>
);
export const IconLink = (p: P) => (
  <Base {...p}>
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  </Base>
);
export const IconRefresh = (p: P) => (
  <Base {...p}>
    <path d="M20 11.5A8 8 0 0 0 5.6 6.8L4 8.5M4 4v4.5h4.5M4 12.5a8 8 0 0 0 14.4 4.7l1.6-1.7M20 20v-4.5h-4.5" />
  </Base>
);
export const IconTimetable = (p: P) => (
  <Base {...p}>
    <rect x="3.5" y="4.5" width="17" height="16" rx="3.5" />
    <path d="M3.5 9.5h17M9 9.5v11M15 9.5v11M8 2.5v4M16 2.5v4" />
  </Base>
);
