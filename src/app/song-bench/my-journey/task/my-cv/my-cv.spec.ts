import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { MyCv } from './my-cv';
import { TaskService } from '../../task.service';

describe('MyCv', () => {
  let component: MyCv;
  let fixture: ComponentFixture<MyCv>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyCv],
      providers: [
        provideRouter([]),
        {
          provide: TaskService,
          useValue: {
            getTasks: () => of([]),
            updateTaskStatus: () => of({}),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyCv);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default state', () => {
    expect(component.isCompleted).toBeFalsy();
  });

  it('should clear completion when updateTask is called', () => {
    component.isCompleted = true;
    component.updateTask();
    expect(component.isCompleted).toBeFalsy();
  });
});
