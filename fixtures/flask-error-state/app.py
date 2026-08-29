from flask import Flask, render_template, request

app = Flask(__name__)
app.config["TEMPLATES_AUTO_RELOAD"] = True


@app.route("/", methods=["GET", "POST"])
def index():
    email = ""
    invalid = True
    status = None
    if request.method == "POST":
        email = request.form.get("email", "").strip()
        invalid = not email
        if not invalid:
            status = f"Subscription saved for {email}."

    return render_template("index.html", email=email, invalid=invalid, status=status)
