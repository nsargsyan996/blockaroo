// Reanimated 4.7's native entry hands its CSS event handler to JSReanimated on import, and JSReanimated (what Jest
// runs) rejects it, so every suite importing Reanimated failed to start. The game has no CSS animations; skip it.
const actual = jest.requireActual("react-native-reanimated/lib/module/css/native/index.js");

module.exports = { ...actual, setCSSEventHandler: () => undefined };
