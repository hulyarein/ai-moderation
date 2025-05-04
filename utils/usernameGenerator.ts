// Utility function to generate random usernames
// Combines adjectives and nouns to create a friendly, random username
const adjectives = [
  "Makulit",
  "Tamad",
  "Bibo",
  "Gutom",
  "Kalog",
  "Chill",
  "Pogi",
  "Kulot",
  "Tisoy",
  "Arte",
  "Kuripot",
  "Wais",
  "Maepal",
  "Lodi",
  "Petmalu",
  "Badjao",
  "WalangHiya",
  "Bangag",
];

const nouns = [
  "Manok",
  "Baboy",
  "Kalabaw",
  "Tambay",
  "Jeprox",
  "Tarsier",
  "Tikbalang",
  "Aswang",
  "Kapre",
  "Nuno",
  "Daga",
  "Adik",
  "KwekKwek",
  "Palaka",
  "Beki",
  "KutongLupa",
  "Tambaloslos",
  "Manananggal",
];

export function generateRandomUsername(): string {
  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${randomAdjective}${randomNoun}`;
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
