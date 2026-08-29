import unittest

from app import app


class AccountSettingsTest(unittest.TestCase):
    def setUp(self) -> None:
        app.config.update(TESTING=True)
        self.client = app.test_client()

    def test_get_renders_both_actions(self) -> None:
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b'id="legacy-export"', response.data)
        self.assertIn(b'id="save-changes"', response.data)

    def test_templates_reload_during_the_repair_experiment(self) -> None:
        self.assertTrue(app.config["TEMPLATES_AUTO_RELOAD"])

    def test_post_confirms_changes_saved(self) -> None:
        response = self.client.post("/")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Changes saved.", response.data)


if __name__ == "__main__":
    unittest.main()
