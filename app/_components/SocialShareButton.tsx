import React from "react";

interface SocialShareButtonProps {
  onClick?: () => void;
}

export default function SocialShareButton({ onClick }: SocialShareButtonProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white text-gray-700 rounded-full p-3 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
      aria-label="Copy link to clipboard"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
        aria-hidden="true"
      >
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
    </button>
  );
}
