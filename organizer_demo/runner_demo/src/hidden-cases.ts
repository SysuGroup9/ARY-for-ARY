export interface HiddenSortCase {
  expected: number[];
  input: number[];
  name: string;
}

function sortAscending(values: number[]): number[] {
  return [...values].sort((left, right) => left - right);
}

const largeSample = Array.from({ length: 64 }, (_, index) =>
  index % 2 === 0 ? 64 - index : index - 32,
);

export const SORT_HIDDEN_CASES: HiddenSortCase[] = [
  {
    expected: sortAscending([]),
    input: [],
    name: "empty array",
  },
  {
    expected: sortAscending([7]),
    input: [7],
    name: "single element",
  },
  {
    expected: sortAscending([1, 2, 3, 4, 5]),
    input: [1, 2, 3, 4, 5],
    name: "already sorted",
  },
  {
    expected: sortAscending([9, 7, 5, 3, 1]),
    input: [9, 7, 5, 3, 1],
    name: "reverse order",
  },
  {
    expected: sortAscending([4, 2, 2, 4, 1]),
    input: [4, 2, 2, 4, 1],
    name: "duplicates",
  },
  {
    expected: sortAscending([0, -3, 2, -1]),
    input: [0, -3, 2, -1],
    name: "negative numbers",
  },
  {
    expected: sortAscending([10, 0, -2, 5, 5, 3]),
    input: [10, 0, -2, 5, 5, 3],
    name: "mixed values",
  },
  {
    expected: sortAscending(largeSample),
    input: largeSample,
    name: "large sample",
  },
];
