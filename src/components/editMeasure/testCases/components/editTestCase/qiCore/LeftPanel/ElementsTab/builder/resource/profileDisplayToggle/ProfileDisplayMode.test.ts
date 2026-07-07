import {
  ProfileDisplayMode,
  getProfileDisplayModeStorageKey,
  getProfileDisplayMode,
  saveProfileDisplayMode,
} from "./ProfileDisplayMode";

describe("ProfileDisplayMode utilities", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getProfileDisplayModeStorageKey", () => {
    it("returns a measure-specific key", () => {
      expect(getProfileDisplayModeStorageKey("measure-1")).toBe(
        "available-elements-profile-mode-measure-1"
      );
    });

    it("uses different keys for different measures", () => {
      const key1 = getProfileDisplayModeStorageKey("measure-1");
      const key2 = getProfileDisplayModeStorageKey("measure-2");
      expect(key1).not.toBe(key2);
    });
  });

  describe("getProfileDisplayMode", () => {
    it("defaults to RELEVANT when no localStorage value exists", () => {
      expect(getProfileDisplayMode("measure-1")).toBe(
        ProfileDisplayMode.RELEVANT
      );
    });

    it("returns ALL when saved value is ALL", () => {
      localStorage.setItem("available-elements-profile-mode-measure-1", "ALL");
      expect(getProfileDisplayMode("measure-1")).toBe(ProfileDisplayMode.ALL);
    });

    it("returns RELEVANT when saved value is RELEVANT", () => {
      localStorage.setItem(
        "available-elements-profile-mode-measure-1",
        "RELEVANT"
      );
      expect(getProfileDisplayMode("measure-1")).toBe(
        ProfileDisplayMode.RELEVANT
      );
    });

    it("falls back to RELEVANT for invalid localStorage values", () => {
      localStorage.setItem(
        "available-elements-profile-mode-measure-1",
        "INVALID"
      );
      expect(getProfileDisplayMode("measure-1")).toBe(
        ProfileDisplayMode.RELEVANT
      );
    });

    it("falls back to RELEVANT when localStorage is cleared", () => {
      localStorage.setItem("available-elements-profile-mode-measure-1", "ALL");
      localStorage.clear();
      expect(getProfileDisplayMode("measure-1")).toBe(
        ProfileDisplayMode.RELEVANT
      );
    });

    it("does not reuse mode across different measures", () => {
      localStorage.setItem("available-elements-profile-mode-measure-1", "ALL");
      expect(getProfileDisplayMode("measure-2")).toBe(
        ProfileDisplayMode.RELEVANT
      );
    });
  });

  describe("saveProfileDisplayMode", () => {
    it("saves mode to localStorage using measure-specific key", () => {
      saveProfileDisplayMode("measure-1", ProfileDisplayMode.ALL);
      expect(
        localStorage.getItem("available-elements-profile-mode-measure-1")
      ).toBe("ALL");
    });

    it("saves RELEVANT mode correctly", () => {
      saveProfileDisplayMode("measure-1", ProfileDisplayMode.RELEVANT);
      expect(
        localStorage.getItem("available-elements-profile-mode-measure-1")
      ).toBe("RELEVANT");
    });

    it("saves modes independently per measure", () => {
      saveProfileDisplayMode("measure-1", ProfileDisplayMode.ALL);
      saveProfileDisplayMode("measure-2", ProfileDisplayMode.RELEVANT);

      expect(
        localStorage.getItem("available-elements-profile-mode-measure-1")
      ).toBe("ALL");
      expect(
        localStorage.getItem("available-elements-profile-mode-measure-2")
      ).toBe("RELEVANT");
    });
  });
});
