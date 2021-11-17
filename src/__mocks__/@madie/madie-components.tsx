import React from "react";

export const TextInput = () => (
  <input data-testid="test-input" defaultValue="test" />
);
export const Label = () => <span data-testid="test-label">label</span>;
export const Button = () => <button data-testid="test-button">button</button>;
export const HelperText = () => <span data-testid="test-span">helperText</span>;
