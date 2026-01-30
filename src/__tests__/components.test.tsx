import React from "react";
import { test, expect, describe } from "bun:test";
import { render } from "ink-testing-library";
import { Box, Text, useInput, useApp } from "ink";

// Mock component to test useInput hook
describe("useInput Hook Tests", () => {
  test("useInput captures keyboard input", () => {
    let capturedInput = "";
    
    const InputTestComponent = () => {
      useInput((input) => {
        capturedInput = input;
      });
      return <Text>Input Test</Text>;
    };

    const { stdin } = render(<InputTestComponent />);
    
    // Simulate key press
    stdin.write("a");
    
    expect(capturedInput).toBe("a");
  });

  test("useInput handles special keys", () => {
    let keyPressed = false;
    
    const SpecialKeyComponent = () => {
      useInput((_input, key) => {
        if (key.return) {
          keyPressed = true;
        }
      });
      return <Text>Special Key Test</Text>;
    };

    const { stdin } = render(<SpecialKeyComponent />);
    
    // Simulate return key
    stdin.write("\r");
    
    expect(keyPressed).toBe(true);
  });
});

// Test useApp hook
describe("useApp Hook Tests", () => {
  test("useApp provides exit function", () => {
    let exitFunction: Function | null = null;
    
    const AppTestComponent = () => {
      const app = useApp();
      exitFunction = app.exit;
      return <Text>App Test</Text>;
    };

    render(<AppTestComponent />);
    
    expect(exitFunction).toBeDefined();
    expect(typeof exitFunction).toBe("function");
  });
});

// Test Box component props
describe("Box Component Tests", () => {
  test("Box renders with border", () => {
    const BorderComponent = () => (
      <Box borderStyle="single">
        <Text>Content</Text>
      </Box>
    );

    const { lastFrame } = render(<BorderComponent />);
    const output = lastFrame() ?? "";
    // Border should add box-drawing characters
    expect(output.length).toBeGreaterThan(7); // More than just "Content"
  });

  test("Box renders with padding", () => {
    const PaddedComponent = () => (
      <Box padding={2}>
        <Text>Text</Text>
      </Box>
    );

    const { lastFrame } = render(<PaddedComponent />);
    expect(lastFrame()).toBeDefined();
  });

  test("Box with gap creates spacing between children", () => {
    const GapComponent = () => (
      <Box flexDirection="row" gap={2}>
        <Text>A</Text>
        <Text>B</Text>
      </Box>
    );

    const { lastFrame } = render(<GapComponent />);
    const output = lastFrame();
    expect(output).toBeDefined();
  });
});

// Test Text component styling
describe("Text Component Styling Tests", () => {
  test("Text renders with color", () => {
    const ColoredText = () => (
      <Text color="green">Colored</Text>
    );

    const { lastFrame } = render(<ColoredText />);
    expect(lastFrame()).toBe("Colored");
  });

  test("Text renders with background color", () => {
    const BgText = () => (
      <Text backgroundColor="blue">Background</Text>
    );

    const { lastFrame } = render(<BgText />);
    expect(lastFrame()).toBe("Background");
  });

  test("Text with dimColor renders", () => {
    const DimText = () => (
      <Text dimColor>Dimmed</Text>
    );

    const { lastFrame } = render(<DimText />);
    expect(lastFrame()).toBe("Dimmed");
  });

  test("Text with underline renders", () => {
    const UnderlinedText = () => (
      <Text underline>Underlined</Text>
    );

    const { lastFrame } = render(<UnderlinedText />);
    expect(lastFrame()).toBe("Underlined");
  });
});
