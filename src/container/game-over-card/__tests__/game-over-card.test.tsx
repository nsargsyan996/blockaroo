import "@i18n";
import { fireEvent, render } from "@test-utils";

import { GameOverCard } from "../game-over-card";

const baseProps = {
    score: 1240,
    best: 2000,
    isNewBest: false,
    canRevive: false,
    reviving: false,
    onRevive: jest.fn(),
    onPlayAgain: jest.fn(),
    onHome: jest.fn(),
};

describe("GameOverCard", () => {
    it("shows the score and best, and starts a new game", () => {
        const onPlayAgain = jest.fn();
        const { getByText } = render(<GameOverCard {...baseProps} onPlayAgain={onPlayAgain} />);
        expect(getByText("No more room!")).toBeTruthy();
        expect(getByText("1,240")).toBeTruthy();
        expect(getByText("2,000")).toBeTruthy();
        fireEvent.press(getByText("Play again"));
        expect(onPlayAgain).toHaveBeenCalled();
    });

    it("offers the revive video only when one is available", () => {
        const onRevive = jest.fn();
        const { queryByText, rerender, getByText } = render(<GameOverCard {...baseProps} onRevive={onRevive} />);
        expect(queryByText("Watch a video to keep going")).toBeNull();

        rerender(<GameOverCard {...baseProps} canRevive onRevive={onRevive} />);
        fireEvent.press(getByText("Watch a video to keep going"));
        expect(onRevive).toHaveBeenCalled();
    });

    it("celebrates a new best score", () => {
        const { getByText } = render(<GameOverCard {...baseProps} score={2500} best={2500} isNewBest />);
        expect(getByText("New best score!")).toBeTruthy();
    });
});
