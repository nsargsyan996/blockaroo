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

// Reanimated 4 runs on react-native-worklets, whose native module does not exist under Jest.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must be synchronous
jest.mock("react-native-worklets", () => require("react-native-worklets/lib/module/mock"));
