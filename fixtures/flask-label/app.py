from flask import Flask, render_template, request

app = Flask(__name__)
app.config["TEMPLATES_AUTO_RELOAD"] = True


@app.route("/", methods=["GET", "POST"])
def index():
    status = None
    if request.method == "POST":
        display_name = request.form.get("display_name", "").strip()
        status = (
            f"Profile saved for {display_name}."
            if display_name
            else "Enter a display name."
        )

    return render_template("index.html", status=status)
