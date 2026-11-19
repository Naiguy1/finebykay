"""Dependency-free secret scan. Never prints matching credential values."""
import argparse
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
SIGNATURES = [
    re.compile(rb"(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{70,})"),
    re.compile(rb"(?:AKIA|ASIA)[A-Z0-9]{16}"),
    re.compile(rb"(?:sk|rk)_live_[A-Za-z0-9]{20,}|whsec_[A-Za-z0-9]{20,}"),
    re.compile(rb"AIza[A-Za-z0-9_-]{35}|SG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}"),
    re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----"),
    re.compile(rb"https?://[^\s/:@]+:[^\s/@]+@"),
]
ASSIGNMENT = re.compile(rb'''(?i)(?:api[_-]?key|client[_-]?secret|password|access[_-]?token|auth[_-]?token|secret[_-]?key)\s*[=:]\s*["']([^"'\r\n]{12,})["']''')
PLACEHOLDER = re.compile(rb"(?i)^(?:\[.*\]|your[-_ ].*|test[-_ ].*|example[-_ ].*|placeholder.*|\$\{.*\})$")


def findings(data):
    result = []
    for number, line in enumerate(data.splitlines(), 1):
        signature = any(pattern.search(line) for pattern in SIGNATURES)
        assignments = [m.group(1) for m in ASSIGNMENT.finditer(line)]
        if signature or any(not PLACEHOLDER.fullmatch(value) for value in assignments):
            result.append(number)
    return result


def forbidden_path(path):
    p = Path(path)
    return ((p.name.startswith('.env') and p.name != '.env.example')
            or p.name in ('.npmrc', 'id_rsa', 'id_ed25519')
            or p.suffix.lower() in ('.pem', '.key', '.p12', '.pfx', '.sqlite', '.sqlite3', '.db'))


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def scan(history=False):
    issues = []
    # Include untracked files so newly added secrets cannot evade the local gate.
    paths = git('ls-files', '-z', '--cached', '--others', '--exclude-standard').decode().split('\0')
    for path in filter(None, paths):
        if forbidden_path(path):
            issues.append(f'{path}: credential/private-data file must not be committed')
        file = ROOT / path
        if file.is_file():
            issues.extend(f'{path}:{line}: potential credential; review without logging its value' for line in findings(file.read_bytes()))
    checked = set()
    if history:
        for revision in git('rev-list', '--all').decode().splitlines():
            for row in git('ls-tree', '-rz', revision).split(b'\0'):
                if not row:
                    continue
                metadata, raw_path = row.split(b'\t', 1)
                _mode, kind, sha = metadata.split()
                path = raw_path.decode(errors='replace')
                if kind != b'blob' or sha in checked:
                    continue
                checked.add(sha)
                if forbidden_path(path):
                    issues.append(f'{revision[:12]}:{path}: historical credential/private-data file')
                # Scan binary blobs too: secrets can be embedded in assets.
                issues.extend(f'{revision[:12]}:{path}:{line}: potential historical credential' for line in findings(git('cat-file', 'blob', sha.decode())))
    return sorted(set(issues)), len(checked)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--history', action='store_true', help='Also scan every unique blob reachable from fetched refs')
    args = parser.parse_args()
    problems, blobs = scan(args.history)
    if problems:
        print('\n'.join(problems))
        sys.exit(1)
    print(f'Secret scan passed (working files; {blobs} historical blobs). Pattern scanning cannot prove absence of secrets.')
