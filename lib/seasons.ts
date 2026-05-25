export const CURRENT_SEASON_ID = "season_1";

export const CURRENT_SEASON_NAME = "Stagione 1";

export function getCurrentSeason() {
  return {
    id: CURRENT_SEASON_ID,
    name: CURRENT_SEASON_NAME,
    status: "active",
  };
}