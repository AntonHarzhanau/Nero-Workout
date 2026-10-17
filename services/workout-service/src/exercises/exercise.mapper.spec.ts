import { Exercise, ExerciseVisibility } from './entities/exercise.entity.js';
import { toExerciseValues, toExerciseView } from './exercise.mapper.js';

describe('Exercise mapper', () => {
  it('trims the title, supplies null defaults, and copies muscle group IDs', () => {
    const dto = { title: '  Squat  ', muscleGroups: ['legs', 'core'] };
    const result = toExerciseValues(dto, ExerciseVisibility.PRIVATE);
    expect(result).toEqual({
      title: 'Squat',
      description: null,
      equipment: null,
      visibility: ExerciseVisibility.PRIVATE,
      muscleGroupIds: ['legs', 'core'],
    });
    result.muscleGroupIds.push('back');
    expect(dto).toEqual({ title: '  Squat  ', muscleGroups: ['legs', 'core'] });
  });

  it.each([null, '', 'Details'])(
    'preserves optional text value %s',
    (value) => {
      expect(
        toExerciseValues(
          {
            title: 'Squat',
            muscleGroups: [],
            description: value,
            equipment: value,
          },
          ExerciseVisibility.PUBLIC,
        ),
      ).toEqual({
        title: 'Squat',
        muscleGroupIds: [],
        description: value,
        equipment: value,
        visibility: ExerciseVisibility.PUBLIC,
      });
    },
  );

  it('exposes public fields and muscle group details without internal relations', () => {
    const createdAt = new Date('2026-10-17T10:00:00Z');
    const updatedAt = new Date('2026-10-17T11:00:00Z');
    const exercise = Object.assign(new Exercise(), {
      id: 'exercise',
      ownerId: 'owner',
      title: 'Squat',
      description: 'Legs',
      equipment: 'Barbell',
      visibility: ExerciseVisibility.PUBLIC,
      createdAt,
      updatedAt,
      muscleGroupIds: ['legs'],
      muscleGroups: [{ id: 'legs', code: 'legs', name: 'Legs', exercises: [] }],
    });
    expect(toExerciseView(exercise)).toEqual({
      id: 'exercise',
      ownerId: 'owner',
      title: 'Squat',
      description: 'Legs',
      equipment: 'Barbell',
      visibility: ExerciseVisibility.PUBLIC,
      createdAt,
      updatedAt,
      muscleGroups: [{ id: 'legs', code: 'legs', name: 'Legs' }],
    });
  });

  it('returns an empty muscle group list', () => {
    expect(
      toExerciseView(Object.assign(new Exercise(), { muscleGroups: [] }))
        .muscleGroups,
    ).toEqual([]);
  });
});
