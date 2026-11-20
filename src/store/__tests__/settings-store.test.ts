import { useSettingsStore } from "../settings-store";

describe("settings store", () => {
    it("records the first launch once and keeps it", () => {
        useSettingsStore.setState({ firstOpenedAt: null });
        jest.spyOn(Date, "now").mockReturnValue(1_000);
        useSettingsStore.getState().markFirstOpened();
        expect(useSettingsStore.getState().firstOpenedAt).toBe(1_000);

        jest.spyOn(Date, "now").mockReturnValue(9_000);
        useSettingsStore.getState().markFirstOpened();
        expect(useSettingsStore.getState().firstOpenedAt).toBe(1_000);
    });

    it("follows the phone's language until the player picks one", () => {
        expect(useSettingsStore.getState().language).toBeNull();
        useSettingsStore.getState().setLanguage("hy");
        expect(useSettingsStore.getState().language).toBe("hy");
    });

    it("remembers that the turn tip was seen", () => {
        expect(useSettingsStore.getState().turnTipSeen).toBe(false);
        useSettingsStore.getState().markTurnTipSeen();
        expect(useSettingsStore.getState().turnTipSeen).toBe(true);
    });
});
