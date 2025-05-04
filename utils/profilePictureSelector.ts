// filepath: /home/tr-ggr/NerdProjects/nextjs/ai-moderation/utils/profilePictureSelector.ts
// Utility function to get a random profile picture path

import fs from "fs";
import path from "path";

// Enum of all available profile picture filenames
export const PROFILE_PICTURES = [
  "AdrianTSajulga_profile.jpeg",
  "FielLouisLOmas-as_profile.jpeg",
  "MauriceRTañeca_profile.jpeg",
  "AlecGiuseppeKSo_profile.jpeg",
  "FrancisWedemeyerNDayagro_profile.jpeg",
  "MorielEdgarDeandreBien_profile.jpeg",
  "AlessandraBeatrizAKisteria_profile.jpeg",
  "JetherVOmictin_profile.jpeg",
  "RanzMatheuMLumayno_profile.jpeg",
  "AntonioMUbaldo_profile.jpeg",
  "JianLevCOlamit_profile.jpeg",
  "RoddneilBGemina_profile.jpeg",
  "ArdelTiocoJeffLLauron_profile.jpeg",
  "JorashJonathanCRobillos_profile.jpeg",
  "SimonLysterPEscaño_profile.jpeg",
  "AvrilNigelMChua_profile.jpeg",
  "JuliaLaineGSegundo_profile.jpeg",
  "StephenClintDSales_profile.jpeg",
  "BasilXavierBMendoza_profile.jpeg",
  "KarlChristianPAjero_profile.jpeg",
  "TheodoreALadera_profile.jpeg",
  "ChrisJordanGAliac_profile.jpeg",
  "KayeAizernerEvangelista_profile.jpeg",
  "ThomasDanjoMManulat_profile.jpeg",
  "ChristianGeloDCadavos_profile.jpeg",
  "KeiruVentCabili_profile.jpeg",
  "TristanJameYTolentino_profile.jpeg",
  "DechieASullano_profile.jpeg",
  "KevinJoshRAtay_profile.jpeg",
  "ValMykelCevenCBolante_profile.jpeg",
  "DerrickCBinangbang_profile.jpeg",
  "KyleAngelaMar_profile.jpeg",
  "VanWoodroePerpetua_profile.jpeg",
  "EllydhoreGabrylleSBelleza_profile.jpeg",
  "MaltJohnVianneyCSolon_profile.jpeg",
  "ZakOFloreta_profile.jpeg",
  "ErinAsia_profile.jpeg",
  "MarkAdrianBBaring_profile.jpeg",
  "ZedricMarcDTabinas_profile.jpeg",
  "FelicityVOrate_profile.jpeg",
  "MarsLBenitez_profile.jpeg",
  "ZyleGeraldeLDelaPeña_profile.jpeg",
  "FelisaMelanieFayGBascug_profile.jpeg",
  "MaryKarylleGDelosReyes_profile.jpeg",
];

/**
 * Gets a random profile picture filename from the profiles enum
 * @returns Path to a random profile picture relative to the public directory
 */
export function getRandomProfilePicture(): string {
  try {
    // Select a random profile picture from the enum
    const randomIndex = Math.floor(Math.random() * PROFILE_PICTURES.length);
    const randomProfileFile = PROFILE_PICTURES[randomIndex];

    // Return the path relative to the public directory
    return `/profiles/${randomProfileFile}`;
  } catch (error) {
    console.error("Error getting random profile picture:", error);
    // Return a default profile picture path if there's an error
    return "/profiles/default_profile.jpeg";
  }
}

/**
 * Server-side function to get all available profile pictures
 * @returns Array of paths to all profile pictures
 */
export function getAllProfilePictures(): string[] {
  return PROFILE_PICTURES.map((file) => `/profiles/${file}`);
}

/**
 * Client-side function to get saved profile picture from local storage
 * @returns The saved profile picture path or null if none is saved
 */
export function getSavedProfilePicture(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("profilePicture");
  }
  return null;
}

/**
 * Client-side function to save a profile picture path to local storage
 * @param profilePath The profile picture path to save
 */
export function saveProfilePicture(profilePath: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("profilePicture", profilePath);
  }
}

/**
 * Client-side function to get the current profile picture or generate a new one if none exists
 * @returns The current profile picture path
 */
export function getCurrentProfilePicture(): string {
  if (typeof window !== "undefined") {
    const savedProfilePicture = getSavedProfilePicture();
    if (savedProfilePicture) {
      return savedProfilePicture;
    }
    // Generate a new one on the client side
    // We can't use fs on client side, so we'll need to handle this differently
  }
  return "/profiles/default_profile.jpeg";
}

/**
 * Client-side function to fetch a random profile picture from the API
 * @returns Promise that resolves to a random profile picture path
 */
export async function fetchRandomProfilePicture(): Promise<string> {
  try {
    const response = await fetch("/api/profile/random");
    const data = await response.json();
    return data.profilePicture;
  } catch (error) {
    console.error("Error fetching random profile picture:", error);
    return "/profiles/default_profile.jpeg";
  }
}

/**
 * Client-side function to refresh the profile picture with a new randomly generated one
 * @returns Promise that resolves to the new profile picture path
 */
export async function refreshProfilePicture(): Promise<string> {
  const newProfilePicture = await fetchRandomProfilePicture();
  saveProfilePicture(newProfilePicture);
  return newProfilePicture;
}
