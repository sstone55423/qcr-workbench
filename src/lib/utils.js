import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 


export const isIframe = window.self !== window.top;

// Count occurrences of a value across items. `key` is a property name; omit it
// to count the items themselves (lodash countBy replacement).
export function countBy(items, key) {
  const counts = {};
  for (const item of items) {
    const value = key ? item[key] : item;
    counts[value] = (counts[value] || 0) + 1;
  }
  return counts;
}
