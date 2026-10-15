jest.mock("expo-haptics", () => ({
    impactAsync: jest.fn(),
    notificationAsync: jest.fn(),
    selectionAsync: jest.fn(),
    ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
    NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

jest.mock("expo-audio", () => ({
    createAudioPlayer: jest.fn(() => ({ play: jest.fn(), seekTo: jest.fn(), remove: jest.fn(), volume: 1 })),
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));
