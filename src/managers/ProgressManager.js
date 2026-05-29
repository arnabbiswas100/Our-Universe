/**
 * ProgressManager — Tracks visited planets using localStorage
 * Determines which paths are solid vs dotted.
 */
export class ProgressManager {
  constructor() {
    this.storageKey = 'our-universe-progress';
    this._load();
  }

  _load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      this.data = data ? JSON.parse(data) : { visited: [] };
    } catch {
      this.data = { visited: [] };
    }
  }

  _save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Progress save failed:', e);
    }
  }

  /** Mark a planet as visited */
  markVisited(planetId) {
    if (!this.data.visited.includes(planetId)) {
      this.data.visited.push(planetId);
      this._save();
    }
  }

  /** Check if a planet has been visited */
  isVisited(planetId) {
    return this.data.visited.includes(planetId);
  }

  /** Get all visited planet IDs */
  getVisited() {
    return [...this.data.visited];
  }

  /** Check if a path between two planets should be solid
   *  Path from planet[index] to planet[index+1] is solid
   *  if planet[index] has been visited
   */
  isPathSolid(planetId) {
    return this.isVisited(planetId);
  }

  /** Reset all progress */
  reset() {
    this.data = { visited: [] };
    this._save();
  }
}
