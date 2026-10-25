"""Entry point for Cloud Run Job executions:  python -m app.worker <job_id> <step> [arg]"""
import sys

from .engine import run
from .store import Store

if __name__ == "__main__":
    jid, step = sys.argv[1], sys.argv[2]
    arg = sys.argv[3] if len(sys.argv) > 3 else ""
    run(Store(), jid, step, arg)
