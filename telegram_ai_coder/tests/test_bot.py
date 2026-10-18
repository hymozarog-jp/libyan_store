import os
import unittest

os.environ.setdefault("TELEGRAM_BOT_TOKEN", "test-token")
os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault("GITHUB_TOKEN", "test-github-token")
os.environ.setdefault("ALLOWED_TELEGRAM_USER_IDS", "123456789")

from bot import parse_model_json, safe_path


class SafePathTests(unittest.TestCase):
    def test_allows_source_files(self):
        for path in ("app.js", "src/main.ts", "styles/site.css", "README.md"):
            with self.subTest(path=path):
                self.assertTrue(safe_path(path))

    def test_blocks_traversal_and_sensitive_paths(self):
        for path in ("../app.js", "/tmp/app.js", ".env", ".github/workflows/deploy.yml",
                     "package.json", "package-lock.json", "wrangler.jsonc",
                     "migrations/001.sql", "node_modules/pkg/index.js"):
            with self.subTest(path=path):
                self.assertFalse(safe_path(path))


class ModelResponseTests(unittest.TestCase):
    def test_parses_json(self):
        result = parse_model_json('{"title":"Fix button","summary":"Small fix","files":[{"path":"app.js","content":"ok"}]}')
        self.assertEqual(result["title"], "Fix button")
        self.assertEqual(result["files"][0]["path"], "app.js")

    def test_rejects_non_object_or_missing_files(self):
        with self.assertRaises((ValueError, TypeError)):
            parse_model_json('{"title":"No changes"}')


if __name__ == "__main__":
    unittest.main()
