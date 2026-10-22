/**
 * The house's colours, in one place.
 *
 * Goan houses are bold: each room gets its own lime-wash colour, with white
 * trim, blue-and-white azulejo tiles, red-oxide floors and green shutters.
 * The colour comes from paint, tile and sunlight, never from glowing (emissive)
 * materials, which is what keeps it vibrant without looking like neon.
 */
export const palette = {
  // Wall colours, one per room
  turmeric: '#EDB23E', // entrance and hallway
  cobalt: '#2756A6', // work room
  rose: '#D98A8E', // poetry room
  teal: '#1F6F6A', // music room

  // Shared materials
  limeWhite: '#F3ECDD', // trim, ceilings, window frames
  redOxide: '#9A3B27', // floor tiles, terracotta
  azulejoBlue: '#1E4E9C',
  shutterGreen: '#2F6B4F',
  teak: '#7A4A28',

  // Flowers
  bougainvillea: '#D2207A',
  bougainvilleaLight: '#EE5AA0',
  leaf: '#3E7A33',
  leafDark: '#2C5A25',

  // Light
  sky: '#A9D6EC', // the afternoon sky seen through windows
  sun: '#FFD9A3',
  skyFill: '#FFE8C7',
  groundFill: '#8A4A2E',
} as const
