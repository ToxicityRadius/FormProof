import unittest

from app import app


class ProfileFormTest(unittest.TestCase):
    def setUp(self) -> None:
        app.config.update(TESTING=True)
        self.client = app.test_client()

    def test_get_renders_profile_form(self) -> None:
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b'name="display_name"', response.data)
        self.assertIn(b">Save</button>", response.data)

    def test_templates_reload_during_the_repair_experiment(self) -> None:
        self.assertTrue(app.config["TEMPLATES_AUTO_RELOAD"])

    def test_post_confirms_saved_display_name(self) -> None:
        response = self.client.post("/", data={"display_name": "  Ada  "})

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Profile saved for Ada.", response.data)

    def test_post_rejects_blank_display_name(self) -> None:
        response = self.client.post("/", data={"display_name": "   "})

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Enter a display name.", response.data)


if __name__ == "__main__":
    unittest.main()
