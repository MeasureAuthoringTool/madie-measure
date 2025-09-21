/**
 * Test utilities for Rich Text Editor interactions
 *
 * These helpers provide adaptive timeouts based on environment:
 * - Local development: Shorter timeouts for faster feedback
 * - CI environment: Longer timeouts to handle slower infrastructure
 */

import { waitFor, screen, within } from "@testing-library/react";

/**
 * Environment detection for adaptive timeouts
 */
const isCI = () => {
  return (
    process.env.CI === "true" ||
    process.env.GITHUB_ACTIONS === "true" ||
    process.env.NODE_ENV === "ci"
  );
};

/**
 * Full rich text editor helper for interactive tests
 *
 * Use this when you need to:
 * - Type into the editor
 * - Click buttons within the editor
 * - Perform complex interactions
 *
 * @param testId The test-id of the rich text editor container
 * @returns Object with editor, content, and editableContent elements
 */
export const waitForRichTextEditor = async (testId: string) => {
  const timeout = isCI() ? 10000 : 3000; // 10s for CI, 3s for local

  let editor, content, editableContent;

  try {
    editor = await waitFor(() => screen.getByTestId(testId), { timeout });

    content = await waitFor(
      () => within(editor).getByTestId("rich-text-editor-content"),
      { timeout }
    );

    editableContent = await waitFor(
      () => within(content).getByRole("textbox"),
      { timeout }
    );
  } catch (error) {
    // Fallback for local development only
    if (!isCI()) {
      console.warn(
        "Rich text editor slow to load, retrying with extended timeout..."
      );

      const extendedTimeout = 8000;
      editor = await waitFor(() => screen.getByTestId(testId), {
        timeout: extendedTimeout,
      });

      content = await waitFor(
        () => within(editor).getByTestId("rich-text-editor-content"),
        { timeout: extendedTimeout }
      );

      editableContent = await waitFor(
        () => within(content).getByRole("textbox"),
        { timeout: extendedTimeout }
      );
    } else {
      throw error;
    }
  }

  return { editor, content, editableContent };
};

/**
 * Lightweight helper for content-only checks
 *
 * Use this when you only need to:
 * - Check text content
 * - Verify presence/absence
 * - Read-only operations
 *
 * @param testId The test-id of the rich text editor container
 * @returns Object with editor and content elements
 */
export const getRichTextEditorContent = async (testId: string) => {
  const timeout = isCI() ? 8000 : 2000; // Shorter timeouts for read-only

  const editor = await waitFor(() => screen.getByTestId(testId), { timeout });

  const content = await waitFor(
    () => within(editor).getByTestId("rich-text-editor-content"),
    { timeout }
  );

  return { editor, content };
};

/**
 * Quick check if rich text editor exists (fastest)
 *
 * Use this when you only need to:
 * - Verify the editor is present
 * - Check if editor is rendered
 *
 * @param testId The test-id of the rich text editor container
 * @returns The editor element
 */
export const checkRichTextEditorExists = async (testId: string) => {
  const timeout = isCI() ? 5000 : 1000; // Very short timeouts

  return await waitFor(() => screen.getByTestId(testId), { timeout });
};

/**
 * Usage examples:
 *
 * // For full interactions (typing, clicking, etc.)
 * const { content, editableContent } = await waitForRichTextEditor("my-editor");
 * fireEvent.input(editableContent, { target: { innerHTML: "test" } });
 *
 * // For content checks only
 * const { content } = await getRichTextEditorContent("my-editor");
 * expect(content).toHaveTextContent("expected text");
 *
 * // For existence checks only
 * const editor = await checkRichTextEditorExists("my-editor");
 * expect(editor).toBeInTheDocument();
 */
