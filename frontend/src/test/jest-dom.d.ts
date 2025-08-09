/// <reference types="@testing-library/jest-dom" />

import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
      toHaveStyle(css: string | object): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveValue(value: string | number): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeChecked(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toBeTruthy(): R;
      toBeFalsy(): R;
      toEqual(expected: any): R;
      toContain(item: any): R;
    }
  }
}