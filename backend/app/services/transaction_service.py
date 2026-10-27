import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models import Transaction, Invoice, PayoutRequest, User
from ..schemas import FinancialStats, CashFlowPoint, TransactionResponse

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

class TransactionService:
    @staticmethod
    def get_financial_stats(db: Session) -> FinancialStats:
        incoming_txs = db.query(Transaction).filter(
            Transaction.type == "INCOMING_PAYMENT",
            Transaction.status == "COMPLETED"
        ).all()
        total_in = sum(t.amount for t in incoming_txs)

        outgoing_txs = db.query(Transaction).filter(
            Transaction.type == "CONTRACTOR_PAYOUT",
            Transaction.status == "COMPLETED"
        ).all()
        total_out = sum(t.amount for t in outgoing_txs)

        net_bal = total_in - total_out

        pending_invoices = db.query(Invoice).filter(Invoice.status.in_(["SENT", "DRAFT"])).all()
        overdue_invoices = db.query(Invoice).filter(Invoice.status == "OVERDUE").all()
        pending_payouts = db.query(PayoutRequest).filter(PayoutRequest.status == "PENDING_APPROVAL").all()

        recent_txs = db.query(Transaction).order_by(Transaction.created_at.desc()).limit(8).all()

        # Generate cash-flow data points for visual Recharts
        today = utcnow().date()
        date_map = {}
        for i in range(6, -1, -1):
            d = (today - datetime.timedelta(days=i)).strftime("%b %d")
            date_map[d] = {"incoming": 0.0, "outgoing": 0.0}

        all_completed = db.query(Transaction).filter(Transaction.status == "COMPLETED").all()
        for tx in all_completed:
            d_str = tx.created_at.strftime("%b %d")
            if d_str in date_map:
                if tx.type == "INCOMING_PAYMENT":
                    date_map[d_str]["incoming"] += tx.amount
                elif tx.type == "CONTRACTOR_PAYOUT":
                    date_map[d_str]["outgoing"] += tx.amount

        cash_flow_points = [
            CashFlowPoint(
                date=k,
                incoming=v["incoming"],
                outgoing=v["outgoing"],
                net=round(v["incoming"] - v["outgoing"], 2)
            )
            for k, v in date_map.items()
        ]

        # Grounded AI business summary based on actual application records
        summary_lines = [
            f"Business health is operating with a recorded net cash flow of ${net_bal:,.2f} USD.",
            f"{len(pending_invoices)} customer invoice(s) pending collection (${sum(i.amount for i in pending_invoices):,.2f} USD).",
        ]
        if overdue_invoices:
            summary_lines.append(f"⚠️ Action Required: {len(overdue_invoices)} invoice(s) overdue totaling ${sum(i.amount for i in overdue_invoices):,.2f} USD.")
        else:
            summary_lines.append("✓ Receivables are healthy with 0 overdue invoices.")

        if pending_payouts:
            summary_lines.append(f"⏳ {len(pending_payouts)} contractor payout(s) awaiting operator authorization.")

        return FinancialStats(
            total_incoming=round(total_in, 2),
            total_outgoing=round(total_out, 2),
            net_balance=round(net_bal, 2),
            pending_invoices_count=len(pending_invoices),
            pending_invoices_amount=round(sum(i.amount for i in pending_invoices), 2),
            overdue_invoices_count=len(overdue_invoices),
            overdue_invoices_amount=round(sum(i.amount for i in overdue_invoices), 2),
            pending_payouts_count=len(pending_payouts),
            pending_payouts_amount=round(sum(p.amount for p in pending_payouts), 2),
            recent_transactions=[TransactionResponse.model_validate(t) for t in recent_txs],
            cash_flow_trends=cash_flow_points,
            ai_summary=" ".join(summary_lines)
        )

transaction_service = TransactionService()
