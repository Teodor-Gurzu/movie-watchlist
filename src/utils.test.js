// src/utils.test.js
import { expect, test } from 'vitest';
import { getRecommendation } from './utils';

test('Recomandă filmele cu rating 8 sau mai mare', () => {
  expect(getRecommendation("8.5")).toBe("good");
  expect(getRecommendation("8.0")).toBe("good");
});

test('Respinge filmele cu rating 5 sau mai mic', () => {
  expect(getRecommendation("4.2")).toBe("bad");
  expect(getRecommendation("5.0")).toBe("bad");
});

test('Oferă status neutru pentru filmele între 5 și 8', () => {
  expect(getRecommendation("7.2")).toBe("neutral");
});