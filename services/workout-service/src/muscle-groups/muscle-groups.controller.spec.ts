import { Test, TestingModule } from '@nestjs/testing';
import { MuscleGroupsController } from './muscle-groups.controller.js';

describe('MuscleGroupsController', () => {
  let controller: MuscleGroupsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MuscleGroupsController],
    }).compile();

    controller = module.get<MuscleGroupsController>(MuscleGroupsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
