import { TestBed, inject } from '@angular/core/testing';

import { SpriteMakerService } from './sprite-maker.service';

describe('SpriteMakerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SpriteMakerService]
    });
  });

  it('should be created', inject([SpriteMakerService], (service: SpriteMakerService) => {
    expect(service).toBeTruthy();
  }));
});
