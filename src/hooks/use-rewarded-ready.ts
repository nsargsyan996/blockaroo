import { useEffect, useState } from "react";

import { ads } from "@service/ads";

export const useRewardedReady = () => {
    const [ready, setReady] = useState(ads.isRewardedReady());
    useEffect(() => ads.onRewardedReadyChange(setReady), []);
    return ready;
};
