from typing import Any
from urllib.parse import quote

import httpx

from app.config import settings

APIFY_API_BASE_URL = "https://api.apify.com/v2"


class ApifyConfigError(Exception):
    """Raised when Apify API configuration is missing."""


class ApifyAPIError(Exception):
    def __init__(self, status_code: int, detail: str) -> None:
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


def require_apify_token() -> str:
    token = settings.resolved_apify_api_token
    if not token:
        raise ApifyConfigError("APIFY_API_TOKEN is not configured")
    return token


async def run_actor_and_get_items(
    *,
    actor_id: str,
    run_input: dict[str, Any],
    wait_secs: int | None = None,
    max_items: int | None = None,
) -> list[dict[str, Any]]:
    actor_path = quote(actor_id.replace("/", "~"), safe="")
    wait_for_finish = wait_secs if wait_secs is not None else settings.apify_wait_secs
    token = require_apify_token()

    try:
        async with httpx.AsyncClient(timeout=max(wait_for_finish + 20, 30)) as client:
            run_response = await client.post(
                f"{APIFY_API_BASE_URL}/acts/{actor_path}/runs",
                params={"token": token, "waitForFinish": wait_for_finish},
                json=run_input,
            )
            if run_response.is_error:
                raise ApifyAPIError(
                    run_response.status_code,
                    _extract_error_detail(run_response),
                )

            run = _extract_run(run_response.json())
            status = run.get("status")
            if status != "SUCCEEDED":
                raise ApifyAPIError(
                    504 if status in {"RUNNING", "READY"} else 502,
                    f"Apify actor run did not succeed: {status or 'unknown'}",
                )

            dataset_id = run.get("defaultDatasetId")
            if not dataset_id:
                raise ApifyAPIError(502, "Apify actor run did not return a dataset")

            dataset_response = await client.get(
                f"{APIFY_API_BASE_URL}/datasets/{dataset_id}/items",
                params={
                    "token": token,
                    "clean": "true",
                    **({"limit": max_items} if max_items else {}),
                },
            )
            if dataset_response.is_error:
                raise ApifyAPIError(
                    dataset_response.status_code,
                    _extract_error_detail(dataset_response),
                )
    except httpx.TimeoutException as exc:
        raise ApifyAPIError(504, "Apify API request timed out") from exc
    except httpx.RequestError as exc:
        raise ApifyAPIError(502, "Could not reach Apify API") from exc

    payload = dataset_response.json()
    if not isinstance(payload, list):
        raise ApifyAPIError(502, "Apify dataset response was not a list")
    return [item for item in payload if isinstance(item, dict)]


def _extract_run(payload: dict[str, Any]) -> dict[str, Any]:
    data = payload.get("data")
    if isinstance(data, dict):
        return data
    return payload


def _extract_error_detail(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        return response.text or "Apify API request failed"

    error = payload.get("error")
    if isinstance(error, dict):
        message = error.get("message")
        if isinstance(message, str) and message:
            return message

    message = payload.get("message")
    if isinstance(message, str) and message:
        return message

    return "Apify API request failed"
