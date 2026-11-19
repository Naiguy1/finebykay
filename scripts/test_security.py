import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('security', Path(__file__).with_name('check-security.py'))
security = importlib.util.module_from_spec(spec)
spec.loader.exec_module(security)


class SecretDetection(unittest.TestCase):
    def test_provider_keys_private_keys_and_credentials(self):
        for value in [b'ghp_' + b'a' * 36, b'AKIA' + b'A' * 16, b'sk_live_' + b'a' * 24,
                      b'-----BEGIN ' + b'PRIVATE KEY-----', b'https://name:' + b'credential@host/',
                      b'client_secret = ' + b'"random-looking-credential"']:
            self.assertEqual(security.findings(value), [1])

    def test_placeholders_and_environment_references(self):
        self.assertFalse(security.findings(b'password = "[CONTACT ADMIN]"'))
        self.assertFalse(security.findings(b'client_secret = process.env.CLIENT_SECRET'))
        self.assertTrue(security.forbidden_path('public/nested/.env.production'))
        self.assertTrue(security.forbidden_path('backup/customer.sqlite3'))
        self.assertFalse(security.forbidden_path('.env.example'))


if __name__ == '__main__':
    unittest.main()
