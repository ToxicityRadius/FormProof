import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [FormsModule],
  templateUrl: "./app.html"
})
export class App {
  displayName = "";
  status = "";

  handleSubmit(): void {
    const name = this.displayName.trim();
    this.status = name ? `Profile saved for ${name}.` : "Enter a display name.";
  }
}
