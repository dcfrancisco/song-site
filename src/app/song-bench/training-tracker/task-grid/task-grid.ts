import { Component, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { TrainingTask } from '../models/training-task';
import { TrainingTaskService } from '../training-task.service';
import { TaskService } from '../../my-journey/task.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-task-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-grid.html',
  styleUrls: ['./task-grid.css']
})
export class TaskGrid {
  @Input() tasks: TrainingTask[] = [];
  @Output() tasksChanged = new EventEmitter<void>();
  selectedTask: any;
  errorMessage = '';
  busyTaskId: number | null = null;

  // ID of the "Complete all Training trackers" card in my-journey tasks
  private readonly mainTrainingTaskId = 12;

  constructor(
    private taskService: TrainingTaskService,
    private mainTaskService: TaskService,
    private router: Router,
    private modalService: NgbModal
  ) {}

  openCompleteModal(content: TemplateRef<any>, task: any) {
    event?.stopPropagation();
    this.selectedTask = task;
    this.modalService.open(content, { windowClass: 'top-center-modal' });
  }

  confirmComplete(modal: any, event: Event) {
    event?.stopPropagation();
    this.completeTask(this.selectedTask, event);
    modal.close();
  }

  goToTask(url: string) {
    window.open(url, '_blank');
  }

  startTask(task: TrainingTask, event?: Event) {
    event?.stopPropagation();
    this.errorMessage = '';
    this.busyTaskId = task.id;
    this.taskService.updateTaskStatus(task.id, 'start').subscribe({
      next: () => {
        this.busyTaskId = null;
        window.open(task.url, '_blank');
        this.tasksChanged.emit();
      },
      error: () => {
        this.busyTaskId = null;
        this.errorMessage = 'The training task could not be started. Please try again.';
      }
    });
  }

  completeTask(task: TrainingTask, event?: Event) {
    event?.stopPropagation();
    this.errorMessage = '';
    this.busyTaskId = task.id;
    this.taskService.updateTaskStatus(task.id, 'complete').subscribe({
      next: () => this.syncParentTask(),
      error: () => {
        this.busyTaskId = null;
        this.errorMessage = 'The training task could not be completed. Please try again.';
      }
    });
  }

  updateTask(task: TrainingTask, event?: Event) {
    event?.stopPropagation();
    this.errorMessage = '';
    this.busyTaskId = task.id;
    this.taskService.updateTaskStatus(task.id, 'start').subscribe({
      next: () => {
        this.mainTaskService.getTasks().subscribe({
          next: mainTasks => {
        const mainTask = mainTasks.find(t => t.id === this.mainTrainingTaskId);
        if (mainTask?.status === 'Completed') {
          this.mainTaskService.updateTaskStatus(this.mainTrainingTaskId, 'start').subscribe({
            next: () => this.finishMutation(),
            error: () => this.failMutation('The parent training task could not be reopened. Please try again.')
          });
        } else {
          this.finishMutation();
        }
          },
          error: () => this.failMutation('The parent training task could not be checked. Please try again.')
        });
      },
      error: () => this.failMutation('The training task could not be reopened. Please try again.')
    });
  }

  private syncParentTask(): void {
    this.taskService.getTasks().subscribe({
      next: trainingTasks => {
        const allTrainingCompleted = trainingTasks.length > 0 && trainingTasks.every(task => task.status === 'Completed');
        if (!allTrainingCompleted) {
          this.finishMutation();
          return;
        }

        this.mainTaskService.getTasks().subscribe({
          next: mainTasks => {
            const mainTask = mainTasks.find(task => task.id === this.mainTrainingTaskId);
            if (!mainTask || mainTask.status === 'Completed') {
              this.finishMutation();
              return;
            }
            this.mainTaskService.updateTaskStatus(this.mainTrainingTaskId, 'complete').subscribe({
              next: () => this.finishMutation(),
              error: () => this.failMutation('The parent training task could not be completed. Please try again.')
            });
          },
          error: () => this.failMutation('The parent training task could not be checked. Please try again.')
        });
      },
      error: () => this.failMutation('Training progress could not be refreshed. Please try again.')
    });
  }

  private finishMutation(): void {
    this.busyTaskId = null;
    this.tasksChanged.emit();
  }

  private failMutation(message: string): void {
    this.busyTaskId = null;
    this.errorMessage = message;
  }

  getTrainingStatus(status: string): string {
    switch (status) {
      case 'In Progress': return 'inprogress';
      case 'Completed': return 'completed';
      default: return 'notstarted';
    }
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    return `${hours} hr ${mins} min`;
  }
}
