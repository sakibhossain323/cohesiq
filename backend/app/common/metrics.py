"""Custom Prometheus metrics for Cohesiq.

These domain counters/histograms are exposed on the same `/metrics` endpoint
that `prometheus-fastapi-instrumentator` mounts (see app.main). Grafana scrapes
them via the `prometheus` Compose service (profile `ai`).

Import is side-effect-free and dependency-light: if `prometheus_client` is not
installed the no-op fallbacks keep the app running, so observability is purely
additive and can never break a request path.
"""

from __future__ import annotations

from contextlib import contextmanager
from time import perf_counter

try:
    from prometheus_client import Counter, Histogram

    _ENABLED = True
except Exception:  # pragma: no cover - prometheus_client always present in prod image
    _ENABLED = False

    class _NoopMetric:
        def labels(self, *_args, **_kwargs):
            return self

        def inc(self, *_args, **_kwargs):
            return None

        def observe(self, *_args, **_kwargs):
            return None

    def Counter(*_args, **_kwargs):  # type: ignore[misc]
        return _NoopMetric()

    def Histogram(*_args, **_kwargs):  # type: ignore[misc]
        return _NoopMetric()


# Number of times the 6-factor matching engine was run, by outcome.
MATCHING_RUNS = Counter(
    "cohesiq_matching_runs_total",
    "Total campaign matching-engine runs",
    ["outcome"],
)

# Number of creators scored across all matching runs.
MATCHING_CREATORS_SCORED = Counter(
    "cohesiq_matching_creators_scored_total",
    "Total creators scored by the matching engine",
)

# Wall-clock duration of a full matching run.
MATCHING_DURATION = Histogram(
    "cohesiq_matching_run_duration_seconds",
    "Duration of a full campaign matching run",
    buckets=(0.1, 0.25, 0.5, 1, 2, 5, 10, 30),
)

# LLM calls made by the platform, by provider + purpose (e.g. rationale, assistant).
LLM_CALLS = Counter(
    "cohesiq_llm_calls_total",
    "Total LLM API calls",
    ["provider", "purpose"],
)


def record_llm_call(provider: str, purpose: str) -> None:
    """Increment the LLM-call counter. Safe to call anywhere."""
    LLM_CALLS.labels(provider=provider, purpose=purpose).inc()


@contextmanager
def track_matching_run():
    """Context manager that records duration + outcome of a matching run.

    Usage:
        with track_matching_run() as record:
            matches = await run(...)
            record(len(matches))
    """
    start = perf_counter()
    scored = {"count": 0}

    def _record(creator_count: int) -> None:
        scored["count"] = int(creator_count or 0)

    try:
        yield _record
    except Exception:
        MATCHING_RUNS.labels(outcome="error").inc()
        MATCHING_DURATION.observe(perf_counter() - start)
        raise
    else:
        MATCHING_RUNS.labels(outcome="success").inc()
        MATCHING_CREATORS_SCORED.inc(scored["count"])
        MATCHING_DURATION.observe(perf_counter() - start)
