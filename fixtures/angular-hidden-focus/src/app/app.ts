import { Component } from "@angular/core";

@Component({
  selector: "app-root",
  standalone: true,
  templateUrl: "./app.html"
})
export class App {
  status = "";

  saveChanges(): void {
    this.status = "Changes saved.";
  }
}
