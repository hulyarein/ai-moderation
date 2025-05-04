// Utility function to generate random usernames
// Combines adjectives and nouns to create a friendly, random username
const adjectives = [
  "PaasaPlays", // Baits you, but never commits
  "LagNaPuso", // Heart lag, delayed feelings
  "OneTapLang", // Quick to fall (or to move on)
  "WalangSignal", // Can't read signs or feelings
  "GhostKing", // Disappears after a good run
  "RecoilSaFeelings", // Can't control the emotional kickback
  "PushLangNangPush", // Aggressive kahit walang assurance
  "LowBatNaHeart", // Drained from past matches (and loves)
  "AFKSaUsapan", // Absent when it matters
  "DisconnectNa", // Gave up on love (or match)
  "ClutchPagKailangan", // Only appears in dire moments
  "ReloadMuna", // Needs time to heal
  "NasprayLang", // Nagkagusto pero hindi sinadya
  "RushBabe", // Rushes into love like B site
  "TamangEmoteLang", // All feelings, no action
  "SlowPeekLang", // Careful, slow to commit
  "BannedNaSaPuso", // No longer welcome
  "CamperSaChat", // Lurker sa convo
  "FriendlyFire", // Hurts the team unintentionally
  "WalangRespawn", // Once it's over, it's over
  "Mabilis", // Fast
  "Swabe", // Smooth, clean plays
  "Bangis", // Fierce, dominant
  "LusotMaster", // Clutch or sneaky (gets through)
  "MatikNa", // Automatic win / guaranteed
  "GalawanPro", // Pro-level moves
  "TamangTimon", // Good decision-making ("right steering")
  "PanaPanalo", // Always hits (pana = arrow)
  "Ultihin", // Refers to "ulti" (ultimate), like clutch finisher
  "KampihanGod", // Teamplay god (Kampihan = team mode)
  "RankedReady", // Always ready for ranked
  "WalangMintis", // Never misses
  "HeadshotKing", // FPS-inspired
  "DriftLord", // Racing or stylish movement
  "ComboLodi", // Fighting game vibe
  "TapikLang", // Light tap but effective (like baiting)
  "SugodBoss", // Aggressive initiator
  "PabuhatPro", // Carries the team subtly
];

const nouns = [
  "Aloria",
  "Aliac",
  "Binangbang",
  "Cadavos",
  "Dayagro",
  "Omas-as",
  "Chua",
  "Olamit",
  "Asia",
  "Tolentino",
  "Evangelista",
  "Lauron",
  "Reyes",
  "Bascug",
  "So",
  "Tabinas",
  "Robillos",
  "Mendoza",
  "Kisteria",
  "Belleza",
  "Omictin",
  "Bien",
  "Ladera",
  "Escaño",
  "Tañeca",
  "Sales",
  "Baring",
  "Floreta",
  "Orate",
  "Mar",
  "Cabili",
  "Ubaldo",
  "Benitez",
  "Atay",
  "Solon",
  "Peña",
  "Sajulga",
  "Manulat",
  "Lumayno",
  "Sullano",
  "Gemina",
  "Ajero",
  "Bolante",
  "Segundo",
  "Perpetua",
];

export function generateRandomUsername(): string {
  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${randomAdjective} ${randomNoun}`;
}

// Function to check if a username is already stored in local storage
export function getSavedUsername(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("randomUsername");
  }
  return null;
}

// Function to save a username to local storage
export function saveUsername(username: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("randomUsername", username);
  }
}
