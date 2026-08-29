import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [FormsModule],
  templateUrl: "./app.html"
})
export class App {
  email = "";
  showError = true;
  status = "";

  handleSubmit(input: HTMLInputElement): void {
    if (!input.validity.valid) {
      this.showError = true;
      this.status = "";
      return;
    }

    this.showError = false;
    this.status = `Subscription saved for ${this.email}.`;
  }
}
