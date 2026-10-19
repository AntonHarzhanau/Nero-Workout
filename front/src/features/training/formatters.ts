type ExerciseSets = { sets: { weightKg: string | number; reps: number }[] };
const numberFormat = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 2,
});
export function formatWeight(value: number | string) {
  return numberFormat.format(Number(value));
}
export function trainingTotals(exercises: ExerciseSets[]) {
  return exercises.reduce(
    (total, exercise) => ({
      exercises: total.exercises + 1,
      sets: total.sets + exercise.sets.length,
      volume:
        total.volume +
        exercise.sets.reduce(
          (sum, set) => sum + Number(set.weightKg) * set.reps,
          0,
        ),
    }),
    { exercises: 0, sets: 0, volume: 0 },
  );
}
