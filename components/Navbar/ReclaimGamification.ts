import { ReclaimGamification } from "./ReclaimTypes";

export function loadGamification(): ReclaimGamification {
  return JSON.parse(localStorage.getItem("reclaimGamification") || '{"totalReclaimed":0,"reclaimCount":0,"badges":[],"level":1}');
}

export function saveGamification(data: ReclaimGamification) {
  localStorage.setItem("reclaimGamification", JSON.stringify(data));
}
