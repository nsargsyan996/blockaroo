const listeners = () => {
    const map = new Map();
    return {
        addAdEventListener: jest.fn((type, cb) => {
            map.set(type, cb);
            return () => map.delete(type);
        }),
        emit: (type, payload) => map.get(type)?.(payload),
    };
};

const createAd = () => ({ ...listeners(), load: jest.fn(), show: jest.fn(() => Promise.resolve()), loaded: false });

module.exports = {
    __esModule: true,
    default: () => ({
        initialize: jest.fn(() => Promise.resolve([])),
        setRequestConfiguration: jest.fn(() => Promise.resolve()),
    }),
    MaxAdContentRating: { G: "G", PG: "PG", T: "T", MA: "MA" },
    TestIds: { REWARDED: "test-rewarded", INTERSTITIAL: "test-interstitial" },
    AdEventType: { LOADED: "loaded", ERROR: "error", OPENED: "opened", CLOSED: "closed" },
    RewardedAdEventType: { LOADED: "rewarded_loaded", EARNED_REWARD: "rewarded_earned_reward" },
    RewardedAd: { createForAdRequest: jest.fn(createAd) },
    InterstitialAd: { createForAdRequest: jest.fn(createAd) },
};
