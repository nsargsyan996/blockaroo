import { createAdventureGame, createGame, getLevel } from "@engine";
import "@i18n";
import { fireEvent, render } from "@test-utils";

import { GameOverCard } from "../game-over-card";
import { LevelCompleteCard } from "../level-complete-card";

const handlers = () => ({ onRevive: jest.fn(), onPlayAgain: jest.fn(), onHome: jest.fn() });

describe("GameOverCard", () => {
    it("shows score and best in classic and starts a new game", () => {
        const props = handlers();
        const game = { ...createGame(1), score: 1240 };
        const { getByText } = render(
            <GameOverCard game={game} best={2000} isNewBest={false} canRevive={false} reviving={false} {...props} />
        );
        expect(getByText("Out of space")).toBeTruthy();
        expect(getByText("1,240")).toBeTruthy();
        expect(getByText("2,000")).toBeTruthy();
        fireEvent.press(getByText("Play again"));
        expect(props.onPlayAgain).toHaveBeenCalled();
    });

    it("offers the revive video only when one is available", () => {
        const props = handlers();
        const game = createGame(1);
        const { queryByText, rerender, getByText } = render(
            <GameOverCard game={game} best={0} isNewBest={false} canRevive={false} reviving={false} {...props} />
        );
        expect(queryByText("Keep playing")).toBeNull();
        rerender(<GameOverCard game={game} best={0} isNewBest={false} canRevive reviving={false} {...props} />);
        fireEvent.press(getByText("Keep playing"));
        expect(props.onRevive).toHaveBeenCalled();
    });

    it("lists the goals left in adventure and offers a retry", () => {
        const props = handlers();
        const game = createAdventureGame(getLevel(1), 1);
        const { getByText } = render(
            <GameOverCard game={game} best={0} isNewBest={false} canRevive={false} reviving={false} {...props} />
        );
        expect(getByText("Goals left")).toBeTruthy();
        fireEvent.press(getByText("Try again"));
        expect(props.onPlayAgain).toHaveBeenCalled();
        fireEvent.press(getByText("Levels"));
        expect(props.onHome).toHaveBeenCalled();
    });
});

describe("LevelCompleteCard", () => {
    it("shows the stars, moves and next level", () => {
        const onNext = jest.fn();
        const { getByText, getByLabelText } = render(
            <LevelCompleteCard
                levelId={4}
                stars={2}
                moves={14}
                par={12}
                isLastLevel={false}
                onNext={onNext}
                onReplay={jest.fn()}
                onLevels={jest.fn()}
            />
        );
        expect(getByText("Level complete!")).toBeTruthy();
        expect(getByText("14 moves")).toBeTruthy();
        expect(getByLabelText("2 / 3")).toBeTruthy();
        fireEvent.press(getByText("Next level"));
        expect(onNext).toHaveBeenCalled();
    });

    it("has no next level after the last one", () => {
        const { queryByText, getByText } = render(
            <LevelCompleteCard
                levelId={60}
                stars={3}
                moves={1}
                par={12}
                isLastLevel
                onNext={jest.fn()}
                onReplay={jest.fn()}
                onLevels={jest.fn()}
            />
        );
        expect(getByText("You finished every level!")).toBeTruthy();
        expect(queryByText("Next level")).toBeNull();
    });
});
