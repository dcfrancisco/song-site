import { CommonModule } from "@angular/common";
import { Component, ChangeDetectorRef } from "@angular/core";
import { TaskGrid } from "./task-grid/task-grid";
import { TrainingTask } from "./models/training-task";
import { TrainingTaskService } from "./training-task.service";
import { Navbar } from "../../navbar/navbar";
import { Footer } from "../../footer/footer";

@Component({
  standalone: true,
  imports: [CommonModule, TaskGrid, Navbar, Footer],
  templateUrl: './training-tracker.html',
  styleUrls: ['./training-tracker.css']
})
export class TrainingTracker {

  tasks: TrainingTask[] = [];
  showCongratsModal = false;
  congratsDismissed = false;

  constructor(private taskService: TrainingTaskService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks(showCongrats = false) {
    this.taskService.getTasks().subscribe(data => {
      this.tasks = data;
      if (showCongrats && !this.congratsDismissed && this.tasks.length > 0 && this.tasks.every(task => task.status === 'Completed')) {
        this.showCongratsModal = true;
      }
      this.cdr.detectChanges();
    });
  }

  closeCongratsModal() {
    this.showCongratsModal = false;
    this.congratsDismissed = true;
    this.cdr.detectChanges();
  }

  getCompletedCount(): number {
    return this.tasks.filter(
      task => task.status === 'Completed'
    ).length;
  }
}
