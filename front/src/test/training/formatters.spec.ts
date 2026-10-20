import { trainingTotals } from "@/features/training/formatters";
import { describe, expect, test } from "vitest";

describe("trainingTotals", () => {
  test("should return zero totals for an empty workout", () => {
    expect(trainingTotals([])).toEqual({
      exercises: 0,
      sets: 0,
      volume: 0,
    });
  });

  test("should calculate totals using numeric and string weights", () => {
    const exercises = [
      {
        sets: [
          { weightKg: "12.50", reps: 8 },
          { weightKg: 10, reps: 10 },
        ],
      },
      {
        sets: [{ weightKg: "20.00", reps: 5 }],
      },
    ];

    expect(trainingTotals(exercises)).toEqual({
      exercises: 2,
      sets: 3,
      volume: 300,
    });
  });

  test("should count an exercise without sets", () => {
    expect(trainingTotals([{ sets: [] }])).toEqual({
      exercises: 1,
      sets: 0,
      volume: 0,
    });
  });
});
