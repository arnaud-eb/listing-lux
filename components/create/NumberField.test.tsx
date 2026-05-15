import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import NumberField from "./NumberField";

/**
 * Controlled wrapper that mirrors how the parent (`page.tsx` via
 * `usePropertyForm`) drives the field — value/onChange round-trip. Several
 * behaviors only manifest when the prop value actually reflects the emitted
 * value (e.g. backspace, blur cleanup), so we can't just hand a `vi.fn()` and
 * keep `value` static.
 */
function Controlled({
  initial = "",
  allowNegative = false,
  onChangeSpy,
}: {
  initial?: number | "";
  allowNegative?: boolean;
  onChangeSpy?: (v: number | "") => void;
}) {
  const [value, setValue] = useState<number | "">(initial);
  return (
    <NumberField
      id="test"
      label="Test"
      value={value}
      onChange={(v) => {
        onChangeSpy?.(v);
        setValue(v);
      }}
      allowNegative={allowNegative}
    />
  );
}

describe("NumberField", () => {
  it("renders the label and an empty input for value=''", () => {
    render(<Controlled />);
    expect(screen.getByLabelText("Test")).toHaveValue("");
  });

  it("renders the stringified initial number", () => {
    render(<Controlled initial={1998} />);
    expect(screen.getByLabelText("Test")).toHaveValue("1998");
  });

  it("uses inputMode=numeric on a text input (avoids type=number scrollwheel/locale pitfalls)", () => {
    render(<Controlled />);
    const input = screen.getByLabelText("Test");
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("inputmode", "numeric");
  });

  it("emits an integer for typed digits", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(<Controlled onChangeSpy={spy} />);
    await user.type(screen.getByLabelText("Test"), "1998");
    // Last emission carries the full integer; intermediate keystrokes emit
    // partial values (1, 19, 199), which we don't assert on.
    expect(spy).toHaveBeenLastCalledWith(1998);
    expect(screen.getByLabelText("Test")).toHaveValue("1998");
  });

  it("strips thousand separators from a pasted value ('1,998' → 1998)", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(<Controlled onChangeSpy={spy} />);
    await user.click(screen.getByLabelText("Test"));
    await user.paste("1,998");
    expect(spy).toHaveBeenLastCalledWith(1998);
    expect(screen.getByLabelText("Test")).toHaveValue("1998");
  });

  it("strips European thousand separator from a pasted value ('1.998' → 1998)", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(<Controlled onChangeSpy={spy} />);
    await user.click(screen.getByLabelText("Test"));
    await user.paste("1.998");
    expect(spy).toHaveBeenLastCalledWith(1998);
  });

  it("strips a minus sign when allowNegative is false", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(<Controlled onChangeSpy={spy} />);
    await user.click(screen.getByLabelText("Test"));
    await user.paste("-1998");
    expect(spy).toHaveBeenLastCalledWith(1998);
    expect(screen.getByLabelText("Test")).toHaveValue("1998");
  });

  it("strips letters and punctuation from a paste ('abc1.5xyz' → 15)", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(<Controlled onChangeSpy={spy} />);
    await user.click(screen.getByLabelText("Test"));
    await user.paste("abc1.5xyz");
    expect(spy).toHaveBeenLastCalledWith(15);
  });

  it("emits a negative integer when allowNegative is true", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(<Controlled allowNegative onChangeSpy={spy} />);
    await user.type(screen.getByLabelText("Test"), "-1");
    expect(spy).toHaveBeenLastCalledWith(-1);
    expect(screen.getByLabelText("Test")).toHaveValue("-1");
  });

  it("preserves a transient '-' on display while emitting '' (so the user can keep typing)", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(<Controlled allowNegative onChangeSpy={spy} />);
    await user.type(screen.getByLabelText("Test"), "-");
    // The input visibly holds "-" so the next keystroke can complete a negative
    // number; the emitted state value is "" because "-" isn't a number.
    expect(screen.getByLabelText("Test")).toHaveValue("-");
    expect(spy).toHaveBeenLastCalledWith("");
  });

  it("collapses multiple minus signs into a single leading one", async () => {
    const user = userEvent.setup();
    render(<Controlled allowNegative />);
    await user.click(screen.getByLabelText("Test"));
    await user.paste("--1-2-3");
    expect(screen.getByLabelText("Test")).toHaveValue("-123");
  });

  it("clears a dangling '-' on blur", async () => {
    const user = userEvent.setup();
    render(<Controlled allowNegative />);
    const input = screen.getByLabelText("Test");
    await user.type(input, "-");
    expect(input).toHaveValue("-");
    await user.tab(); // blur
    expect(input).toHaveValue("");
  });

  it("supports clearing the value (backspace through digits)", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(<Controlled initial={42} onChangeSpy={spy} />);
    const input = screen.getByLabelText("Test");
    await user.clear(input);
    expect(spy).toHaveBeenLastCalledWith("");
    expect(input).toHaveValue("");
  });

  it("syncs the displayed value when the prop value changes externally (RESET case)", async () => {
    function Resettable() {
      const [value, setValue] = useState<number | "">(1998);
      return (
        <>
          <NumberField
            id="t"
            label="T"
            value={value}
            onChange={setValue}
          />
          <button onClick={() => setValue("")}>reset</button>
        </>
      );
    }
    const user = userEvent.setup();
    render(<Resettable />);
    const input = screen.getByLabelText("T");
    expect(input).toHaveValue("1998");
    await user.click(screen.getByText("reset"));
    expect(input).toHaveValue("");
  });
});
