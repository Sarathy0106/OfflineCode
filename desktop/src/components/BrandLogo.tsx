import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark'; // light background vs dark background
  showIllustration?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'light',
  showIllustration = false
}) => {
  const isDark = variant === 'dark';

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28'
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Sunburst / Lotus Emblem SVG */}
      <svg
        viewBox="0 0 120 100"
        className={`${iconSizes[size]} transition-transform duration-200 hover:scale-105`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Golden Sunburst Petals (Top) */}
        <g fill="#F5A623">
          {/* Center Petal */}
          <path d="M60 4 C63 18 63 26 60 36 C57 26 57 18 60 4 Z" />
          {/* Inner Left 1 */}
          <path d="M50 10 C56 22 55 29 48 37 C44 28 45 20 50 10 Z" />
          {/* Inner Right 1 */}
          <path d="M70 10 C65 20 66 28 72 37 C65 29 64 22 70 10 Z" />
          {/* Middle Left 2 */}
          <path d="M38 18 C47 28 48 35 38 42 C32 35 34 26 38 18 Z" />
          {/* Middle Right 2 */}
          <path d="M82 18 C86 26 88 35 82 42 C72 35 73 28 82 18 Z" />
          {/* Outer Left 3 */}
          <path d="M26 30 C37 36 39 44 28 48 C21 43 21 35 26 30 Z" />
          {/* Outer Right 3 */}
          <path d="M94 30 C99 35 99 43 92 48 C81 44 83 36 94 30 Z" />
          {/* Low Outer Left 4 */}
          <path d="M18 44 C29 46 32 52 22 56 C14 53 13 47 18 44 Z" />
          {/* Low Outer Right 4 */}
          <path d="M102 44 C107 47 106 53 98 56 C88 52 91 46 102 44 Z" />
        </g>

        {/* Navy Lotus Base Bowl with Grid Lines */}
        <g fill="#2B3B82" stroke={isDark ? '#4A5D9E' : '#FFFFFF'} strokeWidth="1.8">
          {/* Curved Base Shape */}
          <path
            d="M20 54 Q60 52 100 54 C98 78 84 94 60 96 C36 94 22 78 20 54 Z"
            strokeLinejoin="round"
          />
          {/* Center Vertical Grid Line */}
          <path d="M60 53 L60 96" />
          {/* Left Angle Grid Line */}
          <path d="M42 53 Q44 76 60 96" />
          {/* Right Angle Grid Line */}
          <path d="M78 53 Q76 76 60 96" />
          {/* Horizontal Arc Grid Line */}
          <path d="M22 70 Q60 67 98 70" />
        </g>
      </svg>

      {/* Typography: Student Management Portal */}
      <div className="text-center mt-2.5">
        <h2
          className={`font-black tracking-tight ${
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-base' : 'text-xl'
          } ${isDark ? 'text-white' : 'text-[#2B3B82]'}`}
        >
          Student Management
        </h2>
        <div className="flex items-center justify-center space-x-2 mt-0.5">
          <div className={`h-[1px] w-6 ${isDark ? 'bg-slate-700' : 'bg-blue-200'}`} />
          <span
            className={`font-black tracking-wider uppercase ${
              size === 'sm' ? 'text-[9px]' : size === 'md' ? 'text-xs' : 'text-sm'
            } text-[#E69500]`}
          >
            Portal
          </span>
          <div className={`h-[1px] w-6 ${isDark ? 'bg-slate-700' : 'bg-blue-200'}`} />
        </div>
      </div>

      {/* Optional Graduation Cap & Books Illustration (like in image) */}
      {showIllustration && (
        <div className="mt-6 flex flex-col items-center">
          <svg viewBox="0 0 160 110" className="w-36 h-28" fill="none">
            {/* Background Decorative Leaves */}
            <path d="M30 75 Q20 60 25 45 Q35 55 36 68 Z" fill="#D3E4F8" />
            <path d="M22 68 Q10 58 16 46 Q25 54 28 64 Z" fill="#E2EEFC" />
            <path d="M130 75 Q140 60 135 45 Q125 55 124 68 Z" fill="#D3E4F8" />

            {/* Bottom Book (Navy) */}
            <path
              d="M32 82 C32 80 42 78 80 78 C118 78 128 80 128 82 L128 92 C128 94 118 96 80 96 C42 96 32 94 32 92 Z"
              fill="#2B3B82"
            />
            {/* Book Pages White Edge */}
            <path d="M34 83 C34 81 44 79 80 79 C116 79 126 81 126 83 L126 89 C126 91 116 93 80 93 C44 93 34 91 34 89 Z" fill="#FFFFFF" />

            {/* Middle Book (Gold) */}
            <path
              d="M38 72 C38 70 48 68 80 68 C112 68 122 70 122 72 L122 81 C122 83 112 85 80 85 C48 85 38 83 38 81 Z"
              fill="#F5A623"
            />
            <path d="M40 73 C40 71 50 69 80 69 C110 69 120 71 120 73 L120 78 C120 80 110 82 80 82 C50 82 40 80 40 78 Z" fill="#FFF8E7" />

            {/* Graduation Cap (Mortarboard) */}
            <g>
              {/* Cap Skull Underlayer */}
              <ellipse cx="80" cy="58" rx="20" ry="8" fill="#1F2A5C" />
              {/* Mortarboard Rhombus Top */}
              <polygon points="80,36 128,48 80,60 32,48" fill="#2B3B82" stroke="#FFFFFF" strokeWidth="0.8" />
              {/* Center Button */}
              <circle cx="80" cy="48" r="3.2" fill="#F5A623" />
              {/* Golden Tassel String */}
              <path d="M80 48 Q98 50 108 60 L110 74" stroke="#F5A623" strokeWidth="2.2" strokeLinecap="round" />
              {/* Tassel Fringe */}
              <path d="M107 72 L113 74 L109 82 Z" fill="#F5A623" />
            </g>
          </svg>
        </div>
      )}
    </div>
  );
};
