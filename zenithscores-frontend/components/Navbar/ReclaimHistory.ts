import { ReclaimHistoryEntry } from "./ReclaimTypes";

export function loadHistory(): ReclaimHistoryEntry[] {
  return JSON.parse(localStorage.getItem("reclaimHistory") || "[]");
}

export function saveHistory(entry: ReclaimHistoryEntry) {
  const history = loadHistory();
  history.push(entry);
  localStorage.setItem("reclaimHistory", JSON.stringify(history));
}
