from flask import Flask, render_template, request

app = Flask(__name__)
app.config["TEMPLATES_AUTO_RELOAD"] = True


@app.route("/", methods=["GET", "POST"])
def index():
    status = None
    if request.method == "POST":
        status = "Changes saved."

    return render_template("index.html", status=status)
