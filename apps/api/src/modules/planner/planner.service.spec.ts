import { PlannerService } from './planner.service';

describe('PlannerService', () => {
  it('returns planner data for the requested event type and persona', () => {
    const service = new PlannerService();

    const payload = service.getMvpExperience('lobola', 'coach');

    expect(payload.eventType).toBe('lobola');
    expect(payload.persona).toBe('coach');
    expect(payload.coach.name).toBe('Nono Dube');
    expect(payload.squad.core).toHaveLength(6);
    expect(payload.onboardingSteps).toHaveLength(6);
    expect(payload.personas.map((item) => item.id)).toContain('supplier');
  });
});