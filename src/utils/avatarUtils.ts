/**
 * Generates an SVG avatar string or React JSX based on a seed or index,
 * ensuring students get delightful, unique, high-contrast avatars without external requests.
 */

const AVATAR_COLORS = [
  '#F87171', '#FBBF24', '#34D399', '#60A5FA', 
  '#A78BFA', '#F472B6', '#38BDF8', '#FB7185',
  '#4ADE80', '#FB923C', '#2DD4BF', '#C084FC'
];

const EYE_TYPES = [
  // Happy/normal
  '<ellipse cx="35" cy="45" rx="4" ry="6" fill="#1E293B" /><ellipse cx="65" cy="45" rx="4" ry="6" fill="#1E293B" />',
  // Glasses
  '<circle cx="35" cy="45" r="8" fill="none" stroke="#1E293B" stroke-width="3" /><circle cx="65" cy="45" r="8" fill="none" stroke="#1E293B" stroke-width="3" /><path d="M43 45 h14" stroke="#1E293B" stroke-width="3" />',
  // Joyful squinting
  '<path d="M28 47 q7-5 14 0" fill="none" stroke="#1E293B" stroke-width="4" stroke-linecap="round" /><path d="M58 47 q7-5 14 0" fill="none" stroke="#1E293B" stroke-width="4" stroke-linecap="round" />',
  // Winked
  '<path d="M28 47 q7-5 14 0" fill="none" stroke="#1E293B" stroke-width="4" stroke-linecap="round" /><ellipse cx="65" cy="45" rx="4" ry="6" fill="#1E293B" />',
  // Surprised/round
  '<circle cx="35" cy="45" r="5" fill="#1E293B" /><circle cx="65" cy="45" r="5" fill="#1E293B" />'
];

const MOUTH_TYPES = [
  // Happy Smile
  '<path d="M35 62 q15 12 30 0" fill="none" stroke="#1E293B" stroke-width="4" stroke-linecap="round" />',
  // Open Laughing
  '<path d="M35 60 q15 15 30 0 Z" fill="#1E293B" />',
  // Shy smirk
  '<path d="M38 62 q12 4 24 -2" fill="none" stroke="#1E293B" stroke-width="4" stroke-linecap="round" />',
  // Whistle / Surprised
  '<circle cx="50" cy="62" r="5" fill="#1E293B" />',
  // Big grin
  '<path d="M32 58 q18 18 36 0" fill="none" stroke="#1E293B" stroke-width="4" stroke-linecap="round" /><path d="M32 58 h36" stroke="#1E293B" stroke-width="2" />'
];

const TOP_DECORATIONS = [
  // Cap/Hat
  '<path d="M25 30 q25-15 50 0 L70 20 L30 20 Z" fill="#1E293B" /><path d="M15 30 h70" stroke="#1E293B" stroke-width="4" stroke-linecap="round" />',
  // Cute hair spikes
  '<path d="M35 25 L40 12 L47 23 L53 10 L60 23 L65 14 L70 26" fill="none" stroke="#1E293B" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" />',
  // Halo / Star
  '<circle cx="50" cy="18" r="8" fill="none" stroke="#FBBF24" stroke-width="3" /><line x1="50" y1="5" x2="50" y2="10" stroke="#FBBF24" stroke-width="2" />',
  // Cat Ears
  '<path d="M25 28 L15 10 L35 20" fill="#1E293B" /><path d="M75 28 L85 10 L65 20" fill="#1E293B" />',
  // None
  ''
];

export function generateAvatarSvg(seed: string): string {
  // Simple deterministic hash
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const bgColor = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  const eyes = EYE_TYPES[hash % EYE_TYPES.length];
  const mouth = MOUTH_TYPES[hash % MOUTH_TYPES.length];
  const top = TOP_DECORATIONS[hash % TOP_DECORATIONS.length];

  return `
    <svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <!-- Background Circle -->
      <circle cx="50" cy="50" r="45" fill="${bgColor}" />
      
      <!-- Head Details / Hair / Accessories -->
      ${top}
      
      <!-- Cheeks -->
      <circle cx="28" cy="52" r="4" fill="#E11D48" opacity="0.3" />
      <circle cx="72" cy="52" r="4" fill="#E11D48" opacity="0.3" />
      
      <!-- Eyes -->
      ${eyes}
      
      <!-- Mouth -->
      ${mouth}
    </svg>
  `.trim();
}

export function getRandomSeed(): string {
  return Math.random().toString(36).substring(2, 9);
}
