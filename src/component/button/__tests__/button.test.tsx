import { fireEvent, render } from "@test-utils";

import { Button } from "../button";

describe("Button", () => {
    it("shows its title and reports presses", () => {
        const onPress = jest.fn();
        const { getByText, getByRole } = render(<Button title="Play" onPress={onPress} />);
        expect(getByText("Play")).toBeTruthy();
        fireEvent.press(getByRole("button", { name: "Play" }));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("ignores presses while disabled", () => {
        const onPress = jest.fn();
        const { getByRole } = render(<Button title="Play" onPress={onPress} disabled />);
        fireEvent.press(getByRole("button", { name: "Play" }));
        expect(onPress).not.toHaveBeenCalled();
    });
});
