from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Transaction
from ..schemas import TransactionResponse, FinancialStats
from ..services.transaction_service import transaction_service

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

@router.get("", response_model=List[TransactionResponse])
def get_transactions(
    type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)
    if type and type.upper() != "ALL":
        query = query.filter(Transaction.type == type.upper())
    if status and status.upper() != "ALL":
        query = query.filter(Transaction.status == status.upper())
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Transaction.description.ilike(search_pattern)) |
            (Transaction.reference_id.ilike(search_pattern)) |
            (Transaction.paypal_resource_id.ilike(search_pattern))
        )

    # Dynamic Sorting
    order_column = getattr(Transaction, sort_by, Transaction.created_at)
    if sort_order.lower() == "asc":
        query = query.order_by(order_column.asc())
    else:
        query = query.order_by(order_column.desc())

    return query.limit(limit).all()

@router.get("/stats", response_model=FinancialStats)
def get_stats(db: Session = Depends(get_db)):
    return transaction_service.get_financial_stats(db)

@router.get("/export")
def export_transactions(db: Session = Depends(get_db)):
    """Exports transactions in CSV format for tax and accounting integration"""
    txs = db.query(Transaction).order_by(Transaction.created_at.desc()).all()
    headers = ["Reference ID", "Date", "Type", "Status", "Amount", "Currency", "Fee", "Net Amount", "Source", "PayPal Resource ID", "Description"]
    
    rows = [",".join(headers)]
    for t in txs:
        date_str = t.created_at.strftime("%Y-%m-%d %H:%M:%S")
        desc_escaped = f'"{t.description.replace(chr(34), chr(34)+chr(34))}"'
        row = [
            t.reference_id,
            date_str,
            t.type,
            t.status,
            f"{t.amount:.2f}",
            t.currency,
            f"{t.fee:.2f}",
            f"{t.net_amount:.2f}",
            t.source,
            t.paypal_resource_id or "",
            desc_escaped
        ]
        rows.append(",".join(row))

    csv_content = "\n".join(rows)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=paypilot_transactions_ledger.csv"}
    )

@router.get("/{tx_id}", response_model=TransactionResponse)
def get_transaction(tx_id: int, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx
