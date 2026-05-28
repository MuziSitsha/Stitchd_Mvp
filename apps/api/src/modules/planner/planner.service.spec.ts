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

  it('returns planner surface data and auto-pick suggestions for the requested event', () => {
    const service = new PlannerService();

    const surface = service.getSurfaceExperience('wedding');
    const autoPick = service.getAutoPickExperience('wedding');

    expect(surface.locationLabel).toBe('Lanseria, Gauteng');
    expect(surface.weather.forecast).toHaveLength(5);
    expect(surface.suppliers.shortlist.length).toBeGreaterThan(0);
    expect(surface.autoPick.core).toHaveLength(6);
    expect(autoPick.title).toBe('AI picked your squad');
    expect(autoPick.support).toHaveLength(3);
  });
});