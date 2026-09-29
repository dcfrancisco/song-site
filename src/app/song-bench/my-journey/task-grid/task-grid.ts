import { Component, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { Task } from '../models/task';
import { TaskService } from '../task.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';

@Component({
 selector: 'app-task-grid',
 standalone: true,
 imports: [CommonModule, FormsModule],
 templateUrl: './task-grid.html',
 styleUrls: ['./task-grid.css']
})
export class TaskGrid {
 @Input() tasks: Task[] = [];
 @Input() allTrainingCompleted = false;
 @Output() tasksChanged = new EventEmitter<void>();
 selectedTask: any;
 errorMessage = '';
 busyTaskId: number | null = null;

 constructor(private taskService: TaskService, private router: Router, private modalService: NgbModal) { }

 openCompleteModal(content: TemplateRef<any>, task: any) {
   event?.stopPropagation();
   this.selectedTask = task;
   this.modalService.open(content, {
     windowClass: 'top-center-modal'
   });
 }

 confirmComplete(modal: any, event: Event) {
   event?.stopPropagation();
   this.completeTask(this.selectedTask, event);
   modal.close();
 }

 goToTask(task: Task) {
   this.router.navigate([task.url], { state: { task } });
 }

 startTask(task: Task, event?: Event) {
   event?.stopPropagation();
   this.errorMessage = '';
   this.busyTaskId = task.id;
   this.taskService.updateTaskStatus(task.id, 'start').subscribe({
     next: updated => {
       this.busyTaskId = null;
       this.router.navigate([task.url], { state: { task: updated } });
     },
     error: () => {
       this.busyTaskId = null;
       this.errorMessage = 'The task could not be started. Please try again.';
     }
   });
 }

 completeTask(task: Task, event?: Event) {
   event?.stopPropagation();
   this.errorMessage = '';
   this.busyTaskId = task.id;
   this.taskService.updateTaskStatus(task.id, 'complete').subscribe({
     next: () => {
       this.busyTaskId = null;
       this.tasksChanged.emit();
     },
     error: () => {
       this.busyTaskId = null;
       this.errorMessage = 'The task could not be completed. Please try again.';
     }
   });
 }

 updateTask(task: Task, event?: Event) {
   event?.stopPropagation();
   this.errorMessage = '';
   this.busyTaskId = task.id;
   this.taskService.updateTaskStatus(task.id, 'start').subscribe({
     next: () => {
       this.busyTaskId = null;
       this.tasksChanged.emit();
     },
     error: () => {
       this.busyTaskId = null;
       this.errorMessage = 'The task could not be reopened. Please try again.';
     }
   });
 }

 getStatus(status: string): string {
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
