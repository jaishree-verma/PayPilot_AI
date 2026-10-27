import time
import httpx
import logging
from typing import Optional, Dict, Any, Tuple
from ..config import settings

logger = logging.getLogger("paypal_service")

class PayPalService:
    def __init__(self):
        self.api_base = settings.PAYPAL_API_BASE
        self.client_id = settings.PAYPAL_CLIENT_ID
        self.client_secret = settings.PAYPAL_CLIENT_SECRET
        self._access_token: Optional[str] = None
        self._token_expires_at: float = 0

    def is_configured(self) -> bool:
        return bool(self.client_id and self.client_secret)

    async def get_access_token(self) -> Tuple[Optional[str], Optional[str]]:
        """
        Retrieves OAuth2 access token from PayPal Sandbox.
        Returns (access_token, error_message).
        """
        if not self.is_configured():
            return None, "PayPal Client ID and Secret are not configured in environment."

        # Return cached token if valid
        if self._access_token and time.time() < (self._token_expires_at - 60):
            return self._access_token, None

        token_url = f"{self.api_base}/v1/oauth2/token"
        headers = {
            "Accept": "application/json",
            "Accept-Language": "en_US"
        }
        data = {"grant_type": "client_credentials"}

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    token_url,
                    auth=(self.client_id, self.client_secret),
                    headers=headers,
                    data=data
                )

                if res.status_code == 200:
                    token_data = res.json()
                    self._access_token = token_data.get("access_token")
                    expires_in = token_data.get("expires_in", 3600)
                    self._token_expires_at = time.time() + expires_in
                    logger.info("Successfully fetched fresh PayPal Sandbox access token.")
                    return self._access_token, None
                else:
                    err_msg = f"PayPal Auth Failed ({res.status_code}): {res.text}"
                    logger.error(err_msg)
                    return None, err_msg
        except Exception as e:
            err_msg = f"Network exception contacting PayPal OAuth: {str(e)}"
            logger.error(err_msg)
            return None, err_msg

    async def test_connection(self) -> Dict[str, Any]:
        """Tests live sandbox credentials against PayPal OAuth"""
        if not self.is_configured():
            return {
                "connected": False,
                "message": "PayPal Client ID and Secret are not configured. Running in Demo Mode.",
                "mode": settings.PAYPAL_MODE,
                "api_base": self.api_base
            }

        token, err = await self.get_access_token()
        if token:
            return {
                "connected": True,
                "message": "Successfully authenticated with official PayPal Sandbox API.",
                "mode": settings.PAYPAL_MODE,
                "api_base": self.api_base,
                "client_id_preview": f"{self.client_id[:6]}...{self.client_id[-4:]}"
            }
        else:
            return {
                "connected": False,
                "message": f"Authentication failed: {err}",
                "mode": settings.PAYPAL_MODE,
                "api_base": self.api_base
            }

    async def create_order(
        self,
        invoice_number: str,
        amount: float,
        currency: str,
        description: str,
        return_url: str = "http://localhost:5173/invoices",
        cancel_url: str = "http://localhost:5173/invoices"
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        """
        Creates a PayPal Order via official /v2/checkout/orders API.
        Returns (order_response_dict, error_message).
        """
        token, err = await self.get_access_token()
        if not token:
            # If not configured, provide simulated sandbox response with clear label
            order_id = f"SIM-PAYPAL-ORD-{int(time.time())}"
            logger.warning("PayPal not configured; returning simulated sandbox order.")
            return {
                "id": order_id,
                "status": "CREATED",
                "simulated": True,
                "links": [
                    {"rel": "approve", "href": f"http://localhost:5173/checkout-simulated?order_id={order_id}&amount={amount}&currency={currency}"}
                ]
            }, None

        url = f"{self.api_base}/v2/checkout/orders"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
            "PayPal-Request-Id": f"REQ-{invoice_number}-{int(time.time())}"
        }
        payload = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "reference_id": invoice_number,
                    "description": description[:120],
                    "amount": {
                        "currency_code": currency,
                        "value": f"{amount:.2f}"
                    }
                }
            ],
            "application_context": {
                "brand_name": "PayPilot AI",
                "landing_page": "BILLING",
                "user_action": "PAY_NOW",
                "return_url": return_url,
                "cancel_url": cancel_url
            }
        }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code in (200, 201):
                    data = res.json()
                    logger.info(f"PayPal Sandbox Order created: {data.get('id')}")
                    return data, None
                else:
                    return None, f"PayPal Order Error ({res.status_code}): {res.text}"
        except Exception as e:
            return None, f"PayPal Order Exception: {str(e)}"

    async def capture_order(self, order_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        """
        Captures a PayPal Order via official /v2/checkout/orders/{id}/capture API.
        Returns (capture_response_dict, error_message).
        """
        if order_id.startswith("SIM-PAYPAL-ORD-"):
            # Simulated sandbox capture
            capture_id = f"SIM-CAPTURE-{int(time.time())}"
            return {
                "id": order_id,
                "status": "COMPLETED",
                "simulated": True,
                "purchase_units": [
                    {
                        "payments": {
                            "captures": [
                                {
                                    "id": capture_id,
                                    "status": "COMPLETED",
                                    "seller_receivable_breakdown": {
                                        "paypal_fee": {"value": "0.45", "currency_code": "USD"},
                                        "net_amount": {"value": "99.55", "currency_code": "USD"}
                                    }
                                }
                            ]
                        }
                    }
                ]
            }, None

        token, err = await self.get_access_token()
        if not token:
            return None, f"Cannot capture order without PayPal credentials: {err}"

        url = f"{self.api_base}/v2/checkout/orders/{order_id}/capture"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
            "PayPal-Request-Id": f"CAP-{order_id}-{int(time.time())}"
        }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.post(url, headers=headers)
                if res.status_code in (200, 201):
                    data = res.json()
                    logger.info(f"PayPal Sandbox Order {order_id} captured successfully.")
                    return data, None
                else:
                    return None, f"PayPal Capture Error ({res.status_code}): {res.text}"
        except Exception as e:
            return None, f"PayPal Capture Exception: {str(e)}"

    async def execute_payout(
        self,
        payout_ref: str,
        recipient_email: str,
        amount: float,
        currency: str,
        purpose: str
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str], str]:
        """
        Executes a payout using official PayPal Payouts API /v1/payments/payouts.
        Returns (result_dict, error_message, mode_used).
        mode_used is either 'LIVE_SANDBOX_API' or 'SIMULATED_SANDBOX'.
        """
        token, err = await self.get_access_token()
        if not token:
            # Clearly labeled simulated sandbox
            batch_id = f"SIM-BATCH-{int(time.time())}"
            item_id = f"SIM-ITEM-{int(time.time())}"
            return {
                "batch_header": {
                    "payout_batch_id": batch_id,
                    "batch_status": "SUCCESS"
                },
                "item_id": item_id,
                "simulated": True,
                "note": "Executed in Sandbox Simulation Mode (Configure PayPal Client ID/Secret for Live Sandbox API calls)"
            }, None, "SIMULATED_SANDBOX"

        url = f"{self.api_base}/v1/payments/payouts"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
        payload = {
            "sender_batch_header": {
                "sender_batch_id": f"BATCH-{payout_ref}-{int(time.time())}",
                "email_subject": "You received a payment via PayPilot AI",
                "email_message": f"Payment for: {purpose}"
            },
            "items": [
                {
                    "recipient_type": "EMAIL",
                    "amount": {
                        "value": f"{amount:.2f}",
                        "currency": currency
                    },
                    "note": purpose[:100],
                    "sender_item_id": payout_ref,
                    "receiver": recipient_email
                }
            ]
        }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code in (200, 201):
                    data = res.json()
                    logger.info(f"PayPal Sandbox Payout executed: {data.get('batch_header', {}).get('payout_batch_id')}")
                    return data, None, "LIVE_SANDBOX_API"
                elif res.status_code == 403:
                    # Specific to Sandbox developer accounts without Payouts feature activated
                    err_msg = "PayPal Payouts API requires special account permission in Sandbox. Account does not have Payouts enabled. To demonstrate this workflow without permission block, use the fallback."
                    logger.warning(err_msg)
                    return None, err_msg, "LIVE_SANDBOX_API"
                else:
                    return None, f"PayPal Payouts Error ({res.status_code}): {res.text}", "LIVE_SANDBOX_API"
        except Exception as e:
            return None, f"PayPal Payouts Exception: {str(e)}", "LIVE_SANDBOX_API"

paypal_service = PayPalService()
