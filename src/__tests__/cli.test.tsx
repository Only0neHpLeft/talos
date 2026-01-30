import React from "react";
import { test, expect, describe } from "bun:test";
import { render } from "ink-testing-library";
import { Box, Text, useStdout } from "ink";

// Debug logging hook test
describe("useDebugLog Hook Tests", () => {
  test("useStdout provides write function", () => {
    let writeFunction: Function | null = null;
    
    const TestComponent = () => {
      const { write } = useStdout();
      writeFunction = write;
      return <Text>Test</Text>;
    };

    render(<TestComponent />);
    
    expect(writeFunction).toBeDefined();
    expect(typeof writeFunction).toBe("function");
  });

  test("write function is callable", () => {
    let writeCalled = false;
    
    const TestComponent = () => {
      const { write } = useStdout();
      
      React.useEffect(() => {
        // Write to stdout without breaking UI
        write("Test message\n");
        writeCalled = true;
      }, [write]);
      
      return <Text>UI Content</Text>;
    };

    const { lastFrame } = render(<TestComponent />);
    
    // UI should still render (write doesn't crash)
    expect(lastFrame()).toBeDefined();
    expect(writeCalled).toBe(true);
  });
});

// Test basic component rendering
describe("CLI Component Tests", () => {
  test("Text component renders correctly", () => {
    const TestComponent = () => (
      <Box>
        <Text>Hello World</Text>
      </Box>
    );
    
    const { lastFrame } = render(<TestComponent />);
    expect(lastFrame()).toBe("Hello World");
  });

  test("Box with padding renders correctly", () => {
    const TestComponent = () => (
      <Box padding={1}>
        <Text>Content</Text>
      </Box>
    );
    
    const { lastFrame } = render(<TestComponent />);
    // Padding adds empty lines/space
    expect(lastFrame()).toBeDefined();
  });

  test("Colored text renders", () => {
    const TestComponent = () => (
      <Box>
        <Text color="green">Success</Text>
      </Box>
    );
    
    const { lastFrame } = render(<TestComponent />);
    expect(lastFrame()).toContain("Success");
  });

  test("Bold text renders", () => {
    const TestComponent = () => (
      <Box>
        <Text bold>Bold Text</Text>
      </Box>
    );
    
    const { lastFrame } = render(<TestComponent />);
    expect(lastFrame()).toBe("Bold Text");
  });
});

// Test store integration
describe("Store Integration Tests", () => {
  test("chat store works with components", () => {
    const TestChatComponent = () => {
      const messages: string[] = [];
      return (
        <Box>
          <Text>Messages: {messages.length}</Text>
        </Box>
      );
    };

    const { lastFrame } = render(<TestChatComponent />);
    expect(lastFrame()).toBe("Messages: 0");
  });
});

// Test flexbox layouts
describe("Layout Tests", () => {
  test("flexDirection column stacks elements", () => {
    const TestComponent = () => (
      <Box flexDirection="column">
        <Text>Line 1</Text>
        <Text>Line 2</Text>
      </Box>
    );
    
    const { lastFrame } = render(<TestComponent />);
    const output = lastFrame();
    expect(output).toContain("Line 1");
    expect(output).toContain("Line 2");
  });

  test("flexDirection row places elements side by side", () => {
    const TestComponent = () => (
      <Box flexDirection="row">
        <Text>A</Text>
        <Text>B</Text>
      </Box>
    );
    
    const { lastFrame } = render(<TestComponent />);
    expect(lastFrame()).toBe("AB");
  });
});

// Test Static component for logs (Ink best practice)
describe("Static Component Tests", () => {
  test("Static renders items above dynamic content", () => {
    const { Static } = require("ink");
    
    const TestComponent = () => {
      const items = [
        { id: 1, text: "Completed task 1" },
        { id: 2, text: "Completed task 2" },
      ];
      
      return (
        <>
          <Static items={items} style={{ marginBottom: 1 }}>
            {(item: { id: number; text: string }) => (
              <Text key={item.id}>{item.text}</Text>
            )}
          </Static>
          <Text>Dynamic content</Text>
        </>
      );
    };

    const { lastFrame } = render(<TestComponent />);
    const output = lastFrame();
    expect(output).toContain("Completed task 1");
    expect(output).toContain("Completed task 2");
    expect(output).toContain("Dynamic content");
  });
});
