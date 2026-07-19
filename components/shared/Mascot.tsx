// The Meffin muffin mascot, ported from the mobile app so web and app match.
export function Mascot({ size = 120, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* cup */}
      <path d="M62 118 H138 L129 172 Q128 182 118 182 H82 Q72 182 71 172 Z" fill="#E8935D" />
      <rect x={84} y={122} width={7} height={52} rx={3.5} fill="#D67F4F" />
      <rect x={109} y={122} width={7} height={52} rx={3.5} fill="#D67F4F" />
      {/* muffin top */}
      <circle cx={62} cy={88} r={26} fill="#F09663" />
      <circle cx={82} cy={70} r={26} fill="#F09663" />
      <circle cx={100} cy={62} r={28} fill="#F09663" />
      <circle cx={120} cy={70} r={26} fill="#F09663" />
      <circle cx={138} cy={88} r={26} fill="#F09663" />
      <rect x={36} y={86} width={128} height={36} rx={10} fill="#F09663" />
      {/* blueberry sprinkles */}
      <circle cx={60} cy={80} r={8} fill="#8B7BF0" />
      <circle cx={139} cy={70} r={7} fill="#8B7BF0" />
      <circle cx={56} cy={106} r={4} fill="#8B7BF0" />
      <circle cx={122} cy={106} r={4.5} fill="#8B7BF0" />
      {/* cheeks */}
      <circle cx={70} cy={104} r={9} fill="#F2808E" />
      <circle cx={130} cy={104} r={9} fill="#F2808E" />
      {/* eyes */}
      <circle cx={87} cy={94} r={7.5} fill="#17111F" />
      <circle cx={113} cy={94} r={7.5} fill="#17111F" />
      <circle cx={84.5} cy={91.5} r={2.6} fill="#FFFFFF" />
      <circle cx={110.5} cy={91.5} r={2.6} fill="#FFFFFF" />
      {/* smile */}
      <path d="M91 105 Q100 113 109 105" stroke="#17111F" strokeWidth={4.5} strokeLinecap="round" fill="none" />
    </svg>
  );
}
