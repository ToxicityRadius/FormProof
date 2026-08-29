import unittest

from app import app


class NewsletterTest(unittest.TestCase):
    def setUp(self) -> None:
        app.config.update(TESTING=True)
        self.client = app.test_client()

    def test_get_renders_initial_invalid_state(self) -> None:
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b'aria-invalid="true"', response.data)
        self.assertIn(b'id="email-error"', response.data)

    def test_templates_reload_during_the_repair_experiment(self) -> None:
        self.assertTrue(app.config["TEMPLATES_AUTO_RELOAD"])

    def test_empty_post_keeps_error_state(self) -> None:
        response = self.client.post("/", data={"email": ""})

        self.assertIn(b'aria-invalid="true"', response.data)
        self.assertIn(b'id="email-error"', response.data)

    def test_valid_post_clears_error_and_confirms_subscription(self) -> None:
        response = self.client.post("/", data={"email": "ada@example.com"})

        self.assertEqual(response.status_code, 200)
        self.assertIn(b'aria-invalid="false"', response.data)
        self.assertNotIn(b'id="email-error"', response.data)
        self.assertIn(b"Subscription saved for ada@example.com.", response.data)


if __name__ == "__main__":
    unittest.main()
