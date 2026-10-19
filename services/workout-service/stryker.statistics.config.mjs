import base from './stryker.config.mjs';

/** Mutation checks for the Statistics export and the write paths that capture its snapshots. */
export default {
  ...base,
  ignoreStatic: false,
  concurrency: 2,
  mutate: [
    'src/internal-auth/internal-token.guard.ts',
    'src/workouts/dto/find-workout-statistics.dto.ts',
    'src/workouts/workout-statistics.controller.ts',
    'src/workouts/workout-statistics.service.ts',
    'src/workouts/workout.mapper.ts',
    'src/workouts/workouts.repository.ts',
    'src/workouts/workouts.service.ts',
  ],
  thresholds: { high: 100, low: 100, break: 100 },
  reporters: ['progress', 'clear-text', 'html', 'json'],
  htmlReporter: { fileName: 'reports/mutation/statistics.html' },
  jsonReporter: { fileName: 'reports/mutation/statistics.json' },
};
