from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, UploadFile, File, Query, Header
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import bcrypt
import jwt
import requests
import re
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from bson import ObjectId

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ MOCK MONGO DB FALLBACK ============
import json
import copy

DB_FILE = ROOT_DIR / "mock_db_file.json"

class MockCursor:
    def __init__(self, data):
        self.data = data

    def sort(self, *args, **kwargs):
        if args:
            key = args[0]
            desc = len(args) > 1 and args[1] == -1
            def get_val(x):
                return x.get(key, "")
            try:
                self.data.sort(key=get_val, reverse=desc)
            except Exception:
                pass
        return self

    def skip(self, n):
        self.data = self.data[n:]
        return self

    def limit(self, n):
        self.data = self.data[:n]
        return self

    async def to_list(self, length=None):
        if length is not None:
            return self.data[:length]
        return self.data

class MockCollection:
    def __init__(self, db_client, name):
        self.db_client = db_client
        self.name = name

    @property
    def docs(self):
        state = self.db_client.load()
        if self.name not in state:
            state[self.name] = []
        return state[self.name]

    def save(self, docs):
        state = self.db_client.load()
        state[self.name] = docs
        self.db_client.save(state)

    async def create_index(self, *args, **kwargs):
        return ""

    async def count_documents(self, filter_dict):
        return len(self._filter_docs(filter_dict))

    async def insert_one(self, doc):
        docs = self.docs
        doc_copy = copy.deepcopy(doc)
        if "_id" not in doc_copy:
            doc_copy["_id"] = str(ObjectId())
        for k, v in list(doc_copy.items()):
            if isinstance(v, ObjectId):
                doc_copy[k] = str(v)
        docs.append(doc_copy)
        self.save(docs)
        class InsertResult:
            inserted_id = doc_copy["_id"]
        return InsertResult()

    async def find_one(self, filter_dict, projection=None):
        matched = self._filter_docs(filter_dict)
        if matched:
            return copy.deepcopy(matched[0])
        return None

    def find(self, filter_dict=None, projection=None):
        matched = self._filter_docs(filter_dict or {})
        return MockCursor(copy.deepcopy(matched))

    async def update_one(self, filter_dict, update_dict, upsert=False, **kwargs):
        docs = self.docs
        matched = self._filter_docs(filter_dict, docs)
        if matched:
            self._apply_update(matched[0], update_dict)
            self.save(docs)
            class UpdateResult:
                modified_count = 1
            return UpdateResult()
        elif upsert:
            new_doc = copy.deepcopy(filter_dict)
            if "_id" not in new_doc:
                new_doc["_id"] = str(ObjectId())
            self._apply_update(new_doc, update_dict)
            docs.append(new_doc)
            self.save(docs)
            class UpdateResult:
                modified_count = 1
            return UpdateResult()
        class UpdateResult:
            modified_count = 0
        return UpdateResult()

    async def update_many(self, filter_dict, update_dict, upsert=False, **kwargs):
        docs = self.docs
        matched = self._filter_docs(filter_dict, docs)
        count = 0
        for doc in matched:
            self._apply_update(doc, update_dict)
            count += 1
        if count > 0:
            self.save(docs)
        elif upsert:
            new_doc = copy.deepcopy(filter_dict)
            if "_id" not in new_doc:
                new_doc["_id"] = str(ObjectId())
            self._apply_update(new_doc, update_dict)
            docs.append(new_doc)
            self.save(docs)
            count = 1
        class UpdateResult:
            modified_count = count
        return UpdateResult()

    async def delete_one(self, filter_dict):
        docs = self.docs
        matched = self._filter_docs(filter_dict, docs)
        if matched:
            docs.remove(matched[0])
            self.save(docs)
            class DeleteResult:
                deleted_count = 1
            return DeleteResult()
        class DeleteResult:
            deleted_count = 0
        return DeleteResult()

    def aggregate(self, pipeline):
        is_best_selling = False
        is_revenue = False
        for step in pipeline:
            if "$group" in step:
                group = step["$group"]
                if "_id" in group and isinstance(group["_id"], str) and "items.product_id" in group["_id"]:
                    is_best_selling = True
                elif "_id" in group and isinstance(group["_id"], dict) and "$substr" in str(group["_id"]):
                    is_revenue = True
        
        if is_best_selling:
            return MockCursor([
                {"_id": "p1", "total_sold": 12, "name": "Adire Silk Maxi Dress"},
                {"_id": "p3", "total_sold": 8, "name": "Premium Leather Tote Bag"}
            ])
        if is_revenue:
            return MockCursor([
                {"_id": "2026-05", "revenue": 850000, "count": 10},
                {"_id": "2026-04", "revenue": 520000, "count": 7}
            ])
        return MockCursor([])

    def _filter_docs(self, filter_dict, custom_docs=None):
        docs_to_filter = custom_docs if custom_docs is not None else self.docs
        results = []
        for doc in docs_to_filter:
            match = True
            for k, v in filter_dict.items():
                if k == "_id" and isinstance(v, ObjectId):
                    v = str(v)
                doc_val = doc.get(k)
                if isinstance(doc_val, ObjectId):
                    doc_val = str(doc_val)

                if isinstance(v, dict):
                    if "$ne" in v:
                        target = str(v["$ne"]) if isinstance(v["$ne"], ObjectId) else v["$ne"]
                        if doc_val == target:
                            match = False
                            break
                else:
                    if doc_val != v:
                        match = False
                        break
            if match:
                results.append(doc)
        return results

    def _apply_update(self, doc, update_dict):
        if "$set" in update_dict:
            for k, v in update_dict["$set"].items():
                if isinstance(v, ObjectId):
                    v = str(v)
                doc[k] = v
        if "$unset" in update_dict:
            for k in update_dict["$unset"]:
                doc.pop(k, None)

class MockDBClient:
    def __init__(self):
        self._state = None
        self._load_state()

    def _load_state(self):
        if os.path.exists(DB_FILE):
            try:
                with open(DB_FILE, "r") as f:
                    self._state = json.load(f)
            except Exception:
                self._state = {}
        else:
            self._state = {}

    def load(self):
        if self._state is None:
            self._load_state()
        return self._state

    def save(self, state):
        self._state = state
        try:
            def serialize(obj):
                if isinstance(obj, dict):
                    return {k: serialize(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [serialize(x) for x in obj]
                elif isinstance(obj, ObjectId):
                    return str(obj)
                return obj
            with open(DB_FILE, "w") as f:
                json.dump(serialize(self._state), f, indent=2)
        except Exception as e:
            print(f"Error saving mock db: {e}")

    def __getitem__(self, name):
        return MockCollection(self, name)

    def __getattr__(self, name):
        return self[name]

    def close(self):
        pass

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'nenath_db')

if not mongo_url:
    logger.info("MONGO_URL not found in environment, falling back to local file-based Mock MongoDB")
    client = MockDBClient()
    db = client
else:
    try:
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        logger.info("Connected to MongoDB using MONGO_URL")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB, falling back to Mock MongoDB. Error: {e}")
        client = MockDBClient()
        db = client


# JWT config
JWT_ALGORITHM = "HS256"
def get_jwt_secret():
    return os.environ.get("JWT_SECRET", "super-secret-jwt-token-key-for-local-development-nenath")

# Object Storage config
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "nenath-affordable"
storage_key = None

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key

def put_object(path, data, content_type):
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path):
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# Password helpers
def hash_password(password):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# JWT helpers
def create_access_token(user_id, email, role="user"):
    payload = {
        "sub": user_id, "email": email, "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id):
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

# ============ EMAIL SERVICE ============

GMAIL_USER = os.environ.get("GMAIL_USER", "")
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD", "")
STORE_NAME = "NENATH AFFORDABLE"
STORE_URL = os.environ.get("FRONTEND_URL", "")

def send_email(to_email, subject, html_body):
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        logger.warning("Gmail credentials not configured, skipping email")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{STORE_NAME} <{GMAIL_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_USER, to_email, msg.as_string())
        logger.info(f"Email sent to {to_email}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Email send failed to {to_email}: {e}")
        return False

def email_header():
    return f"""
    <div style="background:#0A0A0A;padding:24px 32px;text-align:center;">
        <h1 style="color:#FFFFFF;font-family:'Georgia',serif;font-size:24px;margin:0;letter-spacing:2px;">{STORE_NAME}</h1>
        <p style="color:#C6A85B;font-size:11px;letter-spacing:3px;margin:4px 0 0;text-transform:uppercase;">Luxury Within Reach, Style Without Limits</p>
    </div>"""

def email_footer():
    return f"""
    <div style="background:#F5F1EB;padding:20px 32px;text-align:center;font-family:Arial,sans-serif;">
        <p style="font-size:12px;color:#555;margin:0;">Garki Ultra Modern Market, Ado Bayero Block, Shop 67, Abuja, Nigeria</p>
        <p style="font-size:12px;color:#555;margin:4px 0 0;">Phone: 09133487799 | WhatsApp: <a href="https://wa.me/2349133487799" style="color:#25D366;">Chat with us</a></p>
        <p style="font-size:11px;color:#999;margin:8px 0 0;">&copy; 2026 {STORE_NAME}. All rights reserved.</p>
    </div>"""

def send_welcome_email(name, email):
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;">
        {email_header()}
        <div style="padding:32px;">
            <h2 style="font-family:'Georgia',serif;font-size:22px;color:#0A0A0A;">Welcome, {name}!</h2>
            <p style="color:#555;font-size:14px;line-height:1.6;">Thank you for joining NENATH AFFORDABLE. We're thrilled to have you as part of our fashion community.</p>
            <p style="color:#555;font-size:14px;line-height:1.6;">Explore our premium collections — from Ready-to-Wear Traditional outfits to elegant Suits, Bags, Shoes, and Accessories.</p>
            <div style="text-align:center;margin:24px 0;">
                <a href="{STORE_URL}/shop" style="background:#0A0A0A;color:#fff;padding:14px 32px;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;">SHOP NOW</a>
            </div>
            <p style="color:#C6A85B;font-size:13px;font-style:italic;text-align:center;">"Quality you can trust. Style you deserve."</p>
        </div>
        {email_footer()}
    </div>"""
    send_email(email, f"Welcome to {STORE_NAME}!", html)

def send_order_confirmation_email(order):
    items_html = ""
    for item in order.get("items", []):
        size_str = f"({item.get('size', '')})" if item.get("size") else ""
        name = item["name"]
        qty = item["quantity"]
        total = item["item_total"]
        items_html += f'<tr><td style="padding:8px;border-bottom:1px solid #eee;font-size:13px;">{name} {size_str} x{qty}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-size:13px;">&#8358;{total:,.0f}</td></tr>'

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;">
        {email_header()}
        <div style="padding:32px;">
            <h2 style="font-family:'Georgia',serif;font-size:22px;color:#0A0A0A;">Order Confirmed!</h2>
            <p style="color:#555;font-size:14px;">Thank you for your order. Here are your details:</p>
            <div style="background:#F5F1EB;padding:16px;margin:16px 0;">
                <p style="margin:0;font-size:13px;"><strong>Order ID:</strong> #{order["order_id"][:8].upper()}</p>
                <p style="margin:4px 0 0;font-size:13px;"><strong>Date:</strong> {datetime.now(timezone.utc).strftime("%B %d, %Y")}</p>
            </div>
            <table style="width:100%;border-collapse:collapse;">
                <thead><tr><th style="padding:8px;border-bottom:2px solid #0A0A0A;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Item</th><th style="padding:8px;border-bottom:2px solid #0A0A0A;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Amount</th></tr></thead>
                <tbody>{items_html}</tbody>
                <tfoot><tr><td style="padding:12px 8px;font-weight:bold;font-size:15px;">Total</td><td style="padding:12px 8px;text-align:right;font-weight:bold;font-size:15px;">&#8358;{order["total"]:,.0f}</td></tr></tfoot>
            </table>
            <div style="background:#FFF8E7;border-left:4px solid #C6A85B;padding:16px;margin:20px 0;">
                <p style="margin:0;font-size:13px;font-weight:bold;color:#0A0A0A;">Payment Instructions</p>
                <p style="margin:8px 0 0;font-size:13px;color:#555;">Please transfer &#8358;{order["total"]:,.0f} to complete your order. Bank details are available on your order page.</p>
                <div style="text-align:center;margin-top:12px;">
                    <a href="{STORE_URL}/order-confirmation/{order['order_id']}" style="background:#0A0A0A;color:#fff;padding:10px 24px;text-decoration:none;font-size:11px;letter-spacing:2px;text-transform:uppercase;">VIEW ORDER & PAY</a>
                </div>
            </div>
            <div style="margin-top:16px;">
                <p style="font-size:13px;color:#555;"><strong>Shipping to:</strong> {order.get("customer_name","")}</p>
                <p style="font-size:13px;color:#555;">{order.get("shipping_address","")}{f", {order.get('city','')}" if order.get('city') else ""}{f", {order.get('state','')}" if order.get('state') else ""}</p>
            </div>
        </div>
        {email_footer()}
    </div>"""
    send_email(order.get("customer_email", ""), f"Order Confirmed - #{order['order_id'][:8].upper()}", html)

def send_order_status_email(order, new_status):
    status_messages = {
        "payment_received": "We've received your payment. Your order is being prepared.",
        "processing": "Your order is now being processed and will be shipped soon.",
        "delivered": "Your order has been delivered! We hope you love your purchase.",
        "cancelled": "Your order has been cancelled. Please contact us if you have questions."
    }
    message = status_messages.get(new_status, f"Your order status has been updated to: {new_status.replace('_',' ').title()}")
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;">
        {email_header()}
        <div style="padding:32px;">
            <h2 style="font-family:'Georgia',serif;font-size:22px;color:#0A0A0A;">Order Update</h2>
            <div style="background:#F5F1EB;padding:16px;margin:16px 0;">
                <p style="margin:0;font-size:13px;"><strong>Order:</strong> #{order["order_id"][:8].upper()}</p>
                <p style="margin:4px 0 0;font-size:13px;"><strong>Status:</strong> <span style="color:#C6A85B;font-weight:bold;text-transform:uppercase;">{new_status.replace('_',' ')}</span></p>
            </div>
            <p style="color:#555;font-size:14px;line-height:1.6;">{message}</p>
            <div style="text-align:center;margin:24px 0;">
                <a href="{STORE_URL}/order-confirmation/{order['order_id']}" style="background:#0A0A0A;color:#fff;padding:12px 28px;text-decoration:none;font-size:11px;letter-spacing:2px;text-transform:uppercase;">TRACK ORDER</a>
            </div>
            <p style="color:#555;font-size:13px;">Need help? Contact us on <a href="https://wa.me/2349133487799" style="color:#25D366;">WhatsApp</a> or call 09133487799.</p>
        </div>
        {email_footer()}
    </div>"""
    send_email(order.get("customer_email", ""), f"Order #{order['order_id'][:8].upper()} - {new_status.replace('_',' ').title()}", html)

# Auth helper
async def get_current_user(request):
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        # Check for Emergent Google Auth session
        session_token = request.cookies.get("session_token")
        if not session_token:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                session_token = auth_header[7:]
        if session_token:
            session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
            if session:
                expires_at = session.get("expires_at")
                if isinstance(expires_at, str):
                    expires_at = datetime.fromisoformat(expires_at)
                if expires_at and expires_at.replace(tzinfo=timezone.utc) > datetime.now(timezone.utc):
                    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
                    if user:
                        user.pop("password_hash", None)
                        return user
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(request):
    user = await get_current_user(request)
    if user.get("role") not in ["admin", "superadmin", "staff"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# Create app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============ AUTH ENDPOINTS ============

class RegisterInput(BaseModel):
    name: str
    email: str
    password: str
    phone: str = ""
    state: str = ""
    country: str = "Nigeria"

class LoginInput(BaseModel):
    email: str
    password: str

@api_router.post("/auth/register")
async def register(input_data: RegisterInput, response: Response):
    email = input_data.email.lower().strip()
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "name": input_data.name,
        "email": email,
        "password_hash": hash_password(input_data.password),
        "phone": input_data.phone,
        "state": input_data.state,
        "country": input_data.country,
        "role": "user",
        "wishlist": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    access_token = create_access_token(user_id, email, "user")
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    user_doc.pop("password_hash")
    user_doc.pop("_id", None)
    # Send welcome email (non-blocking)
    try:
        send_welcome_email(input_data.name, email)
    except Exception as e:
        logger.error(f"Welcome email failed: {e}")
    return {"user": user_doc, "access_token": access_token}

@api_router.post("/auth/login")
async def login(input_data: LoginInput, request: Request, response: Response):
    email = input_data.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    # Brute force check
    attempt = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    if attempt and attempt.get("count", 0) >= 5:
        last_attempt = attempt.get("last_attempt", "")
        if isinstance(last_attempt, str):
            last_attempt = datetime.fromisoformat(last_attempt)
        if last_attempt and (datetime.now(timezone.utc) - last_attempt.replace(tzinfo=timezone.utc)).total_seconds() < 900:
            raise HTTPException(status_code=429, detail="Too many login attempts. Try again in 15 minutes.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})

    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(input_data.password, user.get("password_hash", "")):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"last_attempt": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await db.login_attempts.delete_one({"identifier": identifier})
    access_token = create_access_token(user["user_id"], email, user.get("role", "user"))
    refresh_token = create_refresh_token(user["user_id"])
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    user.pop("password_hash", None)
    return {"user": user, "access_token": access_token}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return {"user": user}

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access_token = create_access_token(user["user_id"], user["email"], user.get("role", "user"))
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
        return {"access_token": access_token}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# Google Auth Session
@api_router.post("/auth/google-session")
async def google_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")
    try:
        resp = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}, timeout=30
        )
        resp.raise_for_status()
        google_data = resp.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to verify Google session: {str(e)}")

    email = google_data["email"].lower()
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"email": email}, {"$set": {
            "name": google_data.get("name", existing.get("name")),
            "picture": google_data.get("picture", "")
        }})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id, "email": email,
            "name": google_data.get("name", ""), "picture": google_data.get("picture", ""),
            "phone": "", "state": "", "country": "Nigeria",
            "role": "user", "password_hash": "", "wishlist": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    session_token = google_data.get("session_token", str(uuid.uuid4()))
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    access_token = create_access_token(user_id, email, "user")
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    user.pop("password_hash", None)
    return {"user": user, "access_token": access_token}

# ============ FILE UPLOAD ============

@api_router.post("/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    user = await get_current_user(request)
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    path = f"{APP_NAME}/uploads/{user['user_id']}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    content_type = file.content_type or "application/octet-stream"
    result = put_object(path, data, content_type)
    file_doc = {
        "file_id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "uploaded_by": user["user_id"],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.files.insert_one(file_doc)
    return {"file_id": file_doc["file_id"], "storage_path": result["path"], "url": f"/api/files/{result['path']}"}

@api_router.post("/upload/public")
async def upload_file_public(request: Request, file: UploadFile = File(...)):
    user = await get_admin_user(request)
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    path = f"{APP_NAME}/public/{uuid.uuid4()}.{ext}"
    data = await file.read()
    content_type = file.content_type or "application/octet-stream"
    result = put_object(path, data, content_type)
    file_doc = {
        "file_id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "uploaded_by": user["user_id"],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.files.insert_one(file_doc)
    return {"file_id": file_doc["file_id"], "storage_path": result["path"], "url": f"/api/files/{result['path']}"}

@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    try:
        data, content_type = get_object(path)
        return Response(content=data, media_type=content_type)
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")

# ============ CATEGORIES ============

@api_router.get("/categories")
async def get_categories():
    cats = await db.categories.find({}, {"_id": 0}).to_list(100)
    return {"categories": cats}

@api_router.post("/categories")
async def create_category(request: Request):
    user = await get_admin_user(request)
    body = await request.json()
    cat_id = str(uuid.uuid4())
    slug = re.sub(r'[^a-z0-9]+', '-', body["name"].lower()).strip('-')
    cat_doc = {
        "category_id": cat_id, "name": body["name"], "slug": slug,
        "description": body.get("description", ""),
        "image": body.get("image", ""),
        "gender": body.get("gender", "all"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.categories.insert_one(cat_doc)
    cat_doc.pop("_id", None)
    return {"category": cat_doc}

@api_router.put("/categories/{cat_id}")
async def update_category(cat_id: str, request: Request):
    await get_admin_user(request)
    body = await request.json()
    update_data = {k: v for k, v in body.items() if k not in ["category_id", "_id"]}
    if "name" in update_data:
        update_data["slug"] = re.sub(r'[^a-z0-9]+', '-', update_data["name"].lower()).strip('-')
    await db.categories.update_one({"category_id": cat_id}, {"$set": update_data})
    cat = await db.categories.find_one({"category_id": cat_id}, {"_id": 0})
    return {"category": cat}

@api_router.delete("/categories/{cat_id}")
async def delete_category(cat_id: str, request: Request):
    await get_admin_user(request)
    await db.categories.delete_one({"category_id": cat_id})
    return {"message": "Category deleted"}

# ============ PRODUCTS ============

@api_router.get("/products")
async def get_products(
    category: str = None, search: str = None,
    sort: str = "newest", min_price: float = None, max_price: float = None,
    page: int = 1, limit: int = 20, badge: str = None
):
    query = {"status": {"$ne": "deleted"}}
    if category:
        query["category_id"] = category
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price
    if badge:
        query["badge"] = badge

    sort_map = {
        "newest": [("created_at", -1)],
        "price_low": [("price", 1)],
        "price_high": [("price", -1)],
        "popular": [("views", -1)]
    }
    sort_order = sort_map.get(sort, [("created_at", -1)])

    skip = (page - 1) * limit
    total = await db.products.count_documents(query)
    products = await db.products.find(query, {"_id": 0}).sort(sort_order).skip(skip).limit(limit).to_list(limit)
    return {"products": products, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    # Increment views
    await db.products.update_one({"product_id": product_id}, {"$inc": {"views": 1}})
    # Get related products
    related = await db.products.find(
        {"category_id": product.get("category_id"), "product_id": {"$ne": product_id}, "status": {"$ne": "deleted"}},
        {"_id": 0}
    ).limit(4).to_list(4)
    return {"product": product, "related": related}

@api_router.post("/products")
async def create_product(request: Request):
    await get_admin_user(request)
    body = await request.json()
    product_id = str(uuid.uuid4())
    slug = re.sub(r'[^a-z0-9]+', '-', body["name"].lower()).strip('-')
    product_doc = {
        "product_id": product_id, "name": body["name"], "slug": slug,
        "description": body.get("description", ""),
        "features": body.get("features", []),
        "rules": body.get("rules", ""),
        "care_instructions": body.get("care_instructions", ""),
        "promotional_text": body.get("promotional_text", ""),
        "price": body.get("price", 0),
        "discount_price": body.get("discount_price"),
        "category_id": body.get("category_id", ""),
        "sizes": body.get("sizes", []),
        "colors": body.get("colors", []),
        "images": body.get("images", []),
        "video_url": body.get("video_url", ""),
        "stock": body.get("stock", 0),
        "badge": body.get("badge"),
        "status": body.get("status", "in_stock"),
        "views": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.products.insert_one(product_doc)
    product_doc.pop("_id", None)
    return {"product": product_doc}

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, request: Request):
    await get_admin_user(request)
    body = await request.json()
    update_data = {k: v for k, v in body.items() if k not in ["product_id", "_id"]}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    if "name" in update_data:
        update_data["slug"] = re.sub(r'[^a-z0-9]+', '-', update_data["name"].lower()).strip('-')
    await db.products.update_one({"product_id": product_id}, {"$set": update_data})
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    return {"product": product}

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, request: Request):
    await get_admin_user(request)
    await db.products.update_one({"product_id": product_id}, {"$set": {"status": "deleted"}})
    return {"message": "Product deleted"}

# ============ CART ============

@api_router.get("/cart")
async def get_cart(request: Request):
    user = await get_current_user(request)
    cart = await db.carts.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not cart:
        return {"cart": {"items": [], "total": 0}}
    # Batch fetch all products
    product_ids = [item["product_id"] for item in cart.get("items", [])]
    products_list = await db.products.find({"product_id": {"$in": product_ids}}, {"_id": 0}).to_list(len(product_ids))
    product_map = {p["product_id"]: p for p in products_list}
    items = []
    total = 0
    for item in cart.get("items", []):
        product = product_map.get(item["product_id"])
        if product:
            price = product.get("discount_price") or product["price"]
            item_total = price * item["quantity"]
            total += item_total
            items.append({**item, "product": product, "item_total": item_total})
    return {"cart": {"items": items, "total": total}}

@api_router.post("/cart")
async def add_to_cart(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    product_id = body["product_id"]
    quantity = body.get("quantity", 1)
    size = body.get("size", "")
    color = body.get("color", "")

    cart = await db.carts.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not cart:
        await db.carts.insert_one({
            "user_id": user["user_id"],
            "items": [{"product_id": product_id, "quantity": quantity, "size": size, "color": color}]
        })
    else:
        existing_idx = None
        for i, item in enumerate(cart.get("items", [])):
            if item["product_id"] == product_id and item.get("size") == size and item.get("color") == color:
                existing_idx = i
                break
        if existing_idx is not None:
            cart["items"][existing_idx]["quantity"] += quantity
        else:
            cart["items"].append({"product_id": product_id, "quantity": quantity, "size": size, "color": color})
        await db.carts.update_one({"user_id": user["user_id"]}, {"$set": {"items": cart["items"]}})
    return {"message": "Added to cart"}

@api_router.put("/cart/{product_id}")
async def update_cart_item(product_id: str, request: Request):
    user = await get_current_user(request)
    body = await request.json()
    quantity = body.get("quantity", 1)
    size = body.get("size", "")
    color = body.get("color", "")
    cart = await db.carts.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if cart:
        for item in cart.get("items", []):
            if item["product_id"] == product_id and item.get("size") == size and item.get("color") == color:
                item["quantity"] = quantity
                break
        await db.carts.update_one({"user_id": user["user_id"]}, {"$set": {"items": cart["items"]}})
    return {"message": "Cart updated"}

@api_router.delete("/cart/{product_id}")
async def remove_from_cart(product_id: str, request: Request, size: str = "", color: str = ""):
    user = await get_current_user(request)
    cart = await db.carts.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if cart:
        cart["items"] = [i for i in cart.get("items", []) if not (i["product_id"] == product_id and i.get("size", "") == size and i.get("color", "") == color)]
        await db.carts.update_one({"user_id": user["user_id"]}, {"$set": {"items": cart["items"]}})
    return {"message": "Removed from cart"}

# ============ WISHLIST ============

@api_router.get("/wishlist")
async def get_wishlist(request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    wishlist_ids = user_doc.get("wishlist", [])
    products = await db.products.find({"product_id": {"$in": wishlist_ids}}, {"_id": 0}).to_list(len(wishlist_ids)) if wishlist_ids else []
    return {"wishlist": products}

@api_router.post("/wishlist/{product_id}")
async def toggle_wishlist(product_id: str, request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    wishlist = user_doc.get("wishlist", [])
    if product_id in wishlist:
        wishlist.remove(product_id)
        action = "removed"
    else:
        wishlist.append(product_id)
        action = "added"
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"wishlist": wishlist}})
    return {"action": action, "wishlist": wishlist}

# ============ ORDERS ============

@api_router.post("/orders")
async def create_order(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    cart = await db.carts.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")

    items = []
    total = 0
    # Batch fetch all products
    product_ids = [item["product_id"] for item in cart["items"]]
    products_list = await db.products.find({"product_id": {"$in": product_ids}}, {"_id": 0}).to_list(len(product_ids))
    product_map = {p["product_id"]: p for p in products_list}
    for item in cart["items"]:
        product = product_map.get(item["product_id"])
        if product:
            price = product.get("discount_price") or product["price"]
            item_total = price * item["quantity"]
            total += item_total
            items.append({
                "product_id": item["product_id"],
                "name": product["name"],
                "price": price,
                "quantity": item["quantity"],
                "size": item.get("size", ""),
                "color": item.get("color", ""),
                "image": product.get("images", [""])[0] if product.get("images") else "",
                "item_total": item_total
            })

    order_id = str(uuid.uuid4())
    order_doc = {
        "order_id": order_id,
        "user_id": user["user_id"],
        "customer_name": body.get("customer_name", user.get("name", "")),
        "customer_email": user.get("email", ""),
        "customer_phone": body.get("phone", user.get("phone", "")),
        "shipping_address": body.get("address", ""),
        "city": body.get("city", ""),
        "state": body.get("state", ""),
        "items": items,
        "total": total,
        "status": "pending",
        "payment_status": "pending",
        "payment_proof": None,
        "notes": body.get("notes", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order_doc)
    # Clear cart
    await db.carts.delete_one({"user_id": user["user_id"]})
    # Create notification
    await db.notifications.insert_one({
        "notification_id": str(uuid.uuid4()),
        "type": "new_order",
        "message": f"New order #{order_id[:8]} from {user.get('name', 'Customer')}",
        "order_id": order_id,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    order_doc.pop("_id", None)
    # Send order confirmation email (non-blocking)
    try:
        send_order_confirmation_email(order_doc)
    except Exception as e:
        logger.error(f"Order confirmation email failed: {e}")
    return {"order": order_doc}

@api_router.get("/orders")
async def get_user_orders(request: Request):
    user = await get_current_user(request)
    orders = await db.orders.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"orders": orders}

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, request: Request):
    user = await get_current_user(request)
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["user_id"] != user["user_id"] and user.get("role") not in ["admin", "superadmin", "staff"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return {"order": order}

@api_router.post("/orders/{order_id}/payment-proof")
async def upload_payment_proof(order_id: str, request: Request, file: UploadFile = File(...)):
    user = await get_current_user(request)
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order or order["user_id"] != user["user_id"]:
        raise HTTPException(status_code=404, detail="Order not found")
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    path = f"{APP_NAME}/payments/{order_id}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "image/jpeg")
    await db.orders.update_one({"order_id": order_id}, {"$set": {
        "payment_proof": result["path"],
        "payment_status": "submitted",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    await db.notifications.insert_one({
        "notification_id": str(uuid.uuid4()),
        "type": "payment_upload",
        "message": f"Payment proof uploaded for order #{order_id[:8]}",
        "order_id": order_id,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Payment proof uploaded", "path": result["path"]}


# ============ REVIEWS / COMMENTS ============

@api_router.get("/products/{product_id}/reviews")
async def get_product_reviews(product_id: str):
    reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    avg_rating = 0
    if reviews:
        avg_rating = sum(r.get("rating", 0) for r in reviews) / len(reviews)
    return {"reviews": reviews, "total": len(reviews), "average_rating": round(avg_rating, 1)}

@api_router.post("/products/{product_id}/reviews")
async def create_review(product_id: str, request: Request):
    user = await get_current_user(request)
    body = await request.json()
    # Check if user already reviewed this product
    existing = await db.reviews.find_one({"product_id": product_id, "user_id": user["user_id"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this product")
    review_doc = {
        "review_id": str(uuid.uuid4()),
        "product_id": product_id,
        "user_id": user["user_id"],
        "user_name": user.get("name", "Customer"),
        "rating": min(5, max(1, int(body.get("rating", 5)))),
        "comment": body.get("comment", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reviews.insert_one(review_doc)
    review_doc.pop("_id", None)
    return {"review": review_doc}

@api_router.delete("/reviews/{review_id}")
async def delete_review(review_id: str, request: Request):
    user = await get_current_user(request)
    review = await db.reviews.find_one({"review_id": review_id}, {"_id": 0})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review["user_id"] != user["user_id"] and user.get("role") not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.reviews.delete_one({"review_id": review_id})
    return {"message": "Review deleted"}

# ============ SETTINGS ============

@api_router.get("/settings")
async def get_settings():
    settings = await db.settings.find_one({"setting_id": "global"}, {"_id": 0})
    if not settings:
        settings = {
            "setting_id": "global",
            "bank_name": "",
            "account_name": "",
            "account_number": "",
            "whatsapp_number": "2349133487799",
            "contact_phone": "09133487799",
            "ceo_name": "Nenzab David Bunshak",
            "homepage_text": "Luxury Within Reach, Style Without Limits.",
            "banner_images": [],
            "address": "Garki Ultra Modern Market, Ado Bayero Block, Shop 67, Abuja, Nigeria"
        }
        await db.settings.insert_one(settings)
        settings.pop("_id", None)
    return {"settings": settings}

@api_router.put("/settings")
async def update_settings(request: Request):
    await get_admin_user(request)
    body = await request.json()
    update_data = {k: v for k, v in body.items() if k not in ["setting_id", "_id"]}
    await db.settings.update_one({"setting_id": "global"}, {"$set": update_data}, upsert=True)
    settings = await db.settings.find_one({"setting_id": "global"}, {"_id": 0})
    return {"settings": settings}

# ============ VISITOR TRACKING ============

@api_router.post("/track-visit")
async def track_visit(request: Request):
    """Track a page visit (called from frontend on page load)"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")
    body = {}
    try:
        body = await request.json()
    except:
        pass
    await db.visitor_logs.insert_one({
        "date": today,
        "ip": ip,
        "page": body.get("page", "/"),
        "user_agent": user_agent,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    return {"ok": True}

@api_router.get("/admin/visitor-stats")
async def admin_visitor_stats(request: Request):
    await get_admin_user(request)
    # Last 30 days
    stats = []
    for i in range(30):
        date = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
        count = await db.visitor_logs.count_documents({"date": date})
        unique = len(await db.visitor_logs.distinct("ip", {"date": date}))
        stats.append({"date": date, "visits": count, "unique_visitors": unique})
    total_all_time = await db.visitor_logs.count_documents({})
    return {"daily_stats": stats, "total_all_time": total_all_time}

# ============ SALES / REVENUE CALCULATOR ============

@api_router.post("/admin/sales")
async def record_sale(request: Request):
    await get_admin_user(request)
    body = await request.json()
    record = {
        "sale_id": str(uuid.uuid4()),
        "amount": float(body.get("amount", 0)),
        "description": body.get("description", ""),
        "order_id": body.get("order_id", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.sales_records.insert_one(record)
    record.pop("_id", None)
    return {"sale": record}

@api_router.get("/admin/sales")
async def get_sales(request: Request):
    await get_admin_user(request)
    records = await db.sales_records.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    total = sum(r.get("amount", 0) for r in records)
    # Projected from orders
    all_orders = await db.orders.find({"status": {"$ne": "cancelled"}}, {"_id": 0, "total": 1, "payment_status": 1}).to_list(10000)
    projected = sum(o.get("total", 0) for o in all_orders)
    confirmed = sum(o.get("total", 0) for o in all_orders if o.get("payment_status") == "approved")
    return {"records": records, "total_recorded": total, "projected_revenue": projected, "confirmed_revenue": confirmed}

@api_router.delete("/admin/sales/{sale_id}")
async def delete_sale(sale_id: str, request: Request):
    await get_admin_user(request)
    await db.sales_records.delete_one({"sale_id": sale_id})
    return {"message": "Sale record deleted"}

# ============ LIVE CHAT / SUPPORT ============

@api_router.post("/chat/messages")
async def send_chat_message(request: Request):
    body = await request.json()
    # Try to get user, but allow anonymous
    user = None
    try:
        user = await get_current_user(request)
    except:
        pass
    
    msg = {
        "message_id": str(uuid.uuid4()),
        "chat_id": body.get("chat_id", str(uuid.uuid4())),
        "sender_type": "customer",
        "sender_id": user["user_id"] if user else body.get("guest_id", "anonymous"),
        "sender_name": user.get("name", "") if user else body.get("guest_name", "Guest"),
        "message": body.get("message", ""),
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.chat_messages.insert_one(msg)
    msg.pop("_id", None)
    # Notify admin
    await db.notifications.insert_one({
        "notification_id": str(uuid.uuid4()),
        "type": "new_chat",
        "message": f"New message from {msg['sender_name']}: {msg['message'][:50]}",
        "chat_id": msg["chat_id"],
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": msg}

@api_router.get("/chat/messages/{chat_id}")
async def get_chat_messages(chat_id: str):
    messages = await db.chat_messages.find({"chat_id": chat_id}, {"_id": 0}).sort("created_at", 1).to_list(200)
    return {"messages": messages}

@api_router.get("/admin/chats")
async def admin_get_chats(request: Request):
    await get_admin_user(request)
    # Get unique chat_ids with latest message
    pipeline = [
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": "$chat_id",
            "last_message": {"$first": "$message"},
            "sender_name": {"$first": "$sender_name"},
            "sender_type": {"$first": "$sender_type"},
            "unread": {"$sum": {"$cond": [{"$and": [{"$eq": ["$read", False]}, {"$eq": ["$sender_type", "customer"]}]}, 1, 0]}},
            "created_at": {"$first": "$created_at"}
        }},
        {"$sort": {"created_at": -1}},
        {"$limit": 50}
    ]
    chats = await db.chat_messages.aggregate(pipeline).to_list(50)
    for c in chats:
        c["chat_id"] = c.pop("_id")
    return {"chats": chats}

@api_router.post("/admin/chat/reply")
async def admin_reply_chat(request: Request):
    user = await get_admin_user(request)
    body = await request.json()
    msg = {
        "message_id": str(uuid.uuid4()),
        "chat_id": body["chat_id"],
        "sender_type": "admin",
        "sender_id": user["user_id"],
        "sender_name": user.get("name", "Support"),
        "message": body.get("message", ""),
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.chat_messages.insert_one(msg)
    msg.pop("_id", None)
    # Mark customer messages as read
    await db.chat_messages.update_many({"chat_id": body["chat_id"], "sender_type": "customer", "read": False}, {"$set": {"read": True}})
    return {"message": msg}

# ============ ADMIN ENDPOINTS ============

@api_router.get("/admin/dashboard")
async def admin_dashboard(request: Request):
    await get_admin_user(request)
    total_products = await db.products.count_documents({"status": {"$ne": "deleted"}})
    total_orders = await db.orders.count_documents({})
    pending_payments = await db.orders.count_documents({"payment_status": {"$in": ["pending", "submitted"]}})
    low_stock = await db.products.count_documents({"stock": {"$lte": 5}, "status": {"$ne": "deleted"}})
    # Revenue
    orders = await db.orders.find({"payment_status": "approved"}, {"_id": 0, "total": 1}).to_list(10000)
    total_revenue = sum(o.get("total", 0) for o in orders)
    # Recent orders
    recent_orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    # Low stock products
    low_stock_products = await db.products.find({"stock": {"$lte": 5}, "status": {"$ne": "deleted"}}, {"_id": 0}).limit(10).to_list(10)
    # Projected revenue from all orders
    all_orders = await db.orders.find({}, {"_id": 0, "total": 1}).to_list(10000)
    projected_revenue = sum(o.get("total", 0) for o in all_orders)
    # User tracking
    total_users = await db.users.count_documents({"role": "user"})
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_visits = await db.visitor_logs.count_documents({"date": today})
    # Sales records
    sales_records = await db.sales_records.find({}, {"_id": 0}).sort("created_at", -1).limit(20).to_list(20)
    recorded_revenue = sum(s.get("amount", 0) for s in sales_records)
    return {
        "total_products": total_products,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "projected_revenue": projected_revenue,
        "recorded_revenue": recorded_revenue,
        "pending_payments": pending_payments,
        "low_stock_count": low_stock,
        "total_users": total_users,
        "today_visits": today_visits,
        "recent_orders": recent_orders,
        "low_stock_products": low_stock_products,
        "sales_records": sales_records
    }

@api_router.get("/admin/orders")
async def admin_orders(request: Request, status: str = None, page: int = 1, limit: int = 20):
    await get_admin_user(request)
    query = {}
    if status:
        query["status"] = status
    total = await db.orders.count_documents(query)
    skip = (page - 1) * limit
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {"orders": orders, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.put("/admin/orders/{order_id}")
async def update_order_status(order_id: str, request: Request):
    await get_admin_user(request)
    body = await request.json()
    update_data = {}
    if "status" in body:
        update_data["status"] = body["status"]
    if "payment_status" in body:
        update_data["payment_status"] = body["payment_status"]
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.orders.update_one({"order_id": order_id}, {"$set": update_data})
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    # Send status update email (non-blocking)
    if "status" in body and order and order.get("customer_email"):
        try:
            send_order_status_email(order, body["status"])
        except Exception as e:
            logger.error(f"Order status email failed: {e}")
    return {"order": order}

@api_router.get("/admin/customers")
async def admin_customers(request: Request, page: int = 1, limit: int = 20):
    await get_admin_user(request)
    total = await db.users.count_documents({"role": "user"})
    skip = (page - 1) * limit
    customers = await db.users.find({"role": "user"}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {"customers": customers, "total": total, "page": page}

@api_router.get("/admin/customers/{user_id}")
async def admin_customer_detail(user_id: str, request: Request):
    await get_admin_user(request)
    customer = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    orders = await db.orders.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"customer": customer, "orders": orders}

@api_router.get("/admin/analytics")
async def admin_analytics(request: Request):
    await get_admin_user(request)
    # Most viewed products
    most_viewed = await db.products.find({"status": {"$ne": "deleted"}}, {"_id": 0}).sort("views", -1).limit(10).to_list(10)
    # Best selling - aggregate order items
    pipeline = [
        {"$unwind": "$items"},
        {"$group": {"_id": "$items.product_id", "total_sold": {"$sum": "$items.quantity"}, "name": {"$first": "$items.name"}}},
        {"$sort": {"total_sold": -1}},
        {"$limit": 10}
    ]
    best_selling = await db.orders.aggregate(pipeline).to_list(10)
    for item in best_selling:
        item["product_id"] = item.pop("_id")
    # Revenue by month
    rev_pipeline = [
        {"$match": {"payment_status": "approved"}},
        {"$group": {"_id": {"$substr": ["$created_at", 0, 7]}, "revenue": {"$sum": "$total"}, "count": {"$sum": 1}}},
        {"$sort": {"_id": -1}},
        {"$limit": 12}
    ]
    revenue_trends = await db.orders.aggregate(rev_pipeline).to_list(12)
    for item in revenue_trends:
        item["month"] = item.pop("_id")
    return {"most_viewed": most_viewed, "best_selling": best_selling, "revenue_trends": revenue_trends}

@api_router.get("/admin/notifications")
async def admin_notifications(request: Request):
    await get_admin_user(request)
    notifications = await db.notifications.find({}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    unread_count = await db.notifications.count_documents({"read": False})
    return {"notifications": notifications, "unread_count": unread_count}

@api_router.put("/admin/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, request: Request):
    await get_admin_user(request)
    await db.notifications.update_one({"notification_id": notification_id}, {"$set": {"read": True}})
    return {"message": "Marked as read"}

@api_router.put("/admin/notifications/read-all")
async def mark_all_notifications_read(request: Request):
    await get_admin_user(request)
    await db.notifications.update_many({"read": False}, {"$set": {"read": True}})
    return {"message": "All marked as read"}

# Admin user management
@api_router.put("/admin/users/{user_id}/role")
async def update_user_role(user_id: str, request: Request):
    user = await get_admin_user(request)
    if user.get("role") != "superadmin":
        raise HTTPException(status_code=403, detail="Only super admin can change roles")
    body = await request.json()
    new_role = body.get("role")
    if new_role not in ["user", "staff", "admin", "superadmin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    await db.users.update_one({"user_id": user_id}, {"$set": {"role": new_role}})
    return {"message": "Role updated"}

# ============ SEED DATA ============

async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "nenathaffordable@gmail.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "nendbuns12#")
    existing = await db.users.find_one({"email": admin_email}, {"_id": 0})
    if existing is None:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id, "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Nenath Admin", "role": "superadmin",
            "phone": "09133487799", "state": "FCT", "country": "Nigeria",
            "wishlist": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin seeded: {admin_email}")
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated")

async def seed_categories():
    count = await db.categories.count_documents({})
    if count > 0:
        return
    categories = [
        {"name": "Ready-to-Wear Traditional", "gender": "women", "description": "Premium African traditional wear for women"},
        {"name": "Bags", "gender": "women", "description": "Luxury handbags and accessories for women"},
        {"name": "Shoes", "gender": "all", "description": "Premium footwear for men, women and children"},
        {"name": "Suits", "gender": "all", "description": "Elegant suits for men and women"},
        {"name": "Underwear", "gender": "all", "description": "Comfortable underwear for men, women and children"},
        {"name": "Clothing", "gender": "all", "description": "Fashionable clothing for men, women and children"},
        {"name": "Accessories", "gender": "all", "description": "Fashion accessories to complete your look"}
    ]
    images = [
        "https://images.unsplash.com/photo-1757140448054-2aeb0bf3003e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwdHJhZGl0aW9uYWwlMjBkcmVzcyUyMGZhc2hpb24lMjB3b21lbnxlbnwwfHx8fDE3NzU5NjAzMjl8MA&ixlib=rb-4.1.0&q=85",
        "https://images.unsplash.com/photo-1709281961493-a9acb8558177?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBmYXNoaW9uJTIwaGFuZGJhZ3xlbnwwfHx8fDE3NzU5NjAzMTh8MA&ixlib=rb-4.1.0&q=85",
        "https://images.unsplash.com/photo-1713471519808-f9f7bd7c0e19?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwyfHxwcmVtaXVtJTIwZWxlZ2FudCUyMHNob2VzJTIwc3R1ZGlvfGVufDB8fHx8MTc3NTk2MDMyOXww&ixlib=rb-4.1.0&q=85",
        "https://images.unsplash.com/photo-1774636500128-5338eb2f09c9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTJ8MHwxfHNlYXJjaHwxfHxtZW5zJTIwZWxlZ2FudCUyMHN1aXQlMjBzdHVkaW98ZW58MHx8fHwxNzc1OTYwMzE4fDA&ixlib=rb-4.1.0&q=85",
        "https://images.unsplash.com/photo-1630780564223-0aae7795126b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwZmFzaGlvbiUyMGNsb3RoaW5nJTIwbW9kZWx8ZW58MHx8fHwxNzc1OTYwMzI5fDA&ixlib=rb-4.1.0&q=85",
        "https://images.unsplash.com/photo-1630780565118-511258d74d08?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHwyfHxtaW5pbWFsaXN0JTIwZmFzaGlvbiUyMGNsb3RoaW5nJTIwbW9kZWx8ZW58MHx8fHwxNzc1OTYwMzI5fDA&ixlib=rb-4.1.0&q=85",
        "https://images.unsplash.com/photo-1758900728131-32b8fa6fcda4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwZWRpdG9yaWFsJTIwd29tZW4lMjBzdHVkaW98ZW58MHx8fHwxNzc1OTYwMzE4fDA&ixlib=rb-4.1.0&q=85"
    ]
    for i, cat in enumerate(categories):
        cat["category_id"] = str(uuid.uuid4())
        cat["slug"] = re.sub(r'[^a-z0-9]+', '-', cat["name"].lower()).strip('-')
        cat["image"] = images[i] if i < len(images) else ""
        cat["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.categories.insert_one(cat)
    logger.info("Categories seeded")

async def seed_products():
    count = await db.products.count_documents({})
    if count > 0:
        return
    cats = await db.categories.find({}, {"_id": 0}).to_list(100)
    cat_map = {c["name"]: c["category_id"] for c in cats}

    product_images = [
        "https://images.unsplash.com/photo-1758900728131-32b8fa6fcda4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHwyfHxmYXNoaW9uJTIwZWRpdG9yaWFsJTIwd29tZW4lMjBzdHVkaW98ZW58MHx8fHwxNzc1OTYwMzE4fDA&ixlib=rb-4.1.0&q=85",
        "https://images.unsplash.com/photo-1761646238914-2dad041491e2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjBmYXNoaW9uJTIwaGFuZGJhZ3xlbnwwfHx8fDE3NzU5NjAzMTh8MA&ixlib=rb-4.1.0&q=85",
        "https://images.unsplash.com/photo-1775036423115-b0f46d5b5694?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTJ8MHwxfHNlYXJjaHwyfHxtZW5zJTIwZWxlZ2FudCUyMHN1aXQlMjBzdHVkaW98ZW58MHx8fHwxNzc1OTYwMzE4fDA&ixlib=rb-4.1.0&q=85",
        "https://images.unsplash.com/photo-1630780565118-511258d74d08?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHwyfHxtaW5pbWFsaXN0JTIwZmFzaGlvbiUyMGNsb3RoaW5nJTIwbW9kZWx8ZW58MHx8fHwxNzc1OTYwMzI5fDA&ixlib=rb-4.1.0&q=85"
    ]

    sample_products = [
        {"name": "Adire Silk Maxi Dress", "category": "Ready-to-Wear Traditional", "price": 45000, "discount_price": 38000, "badge": "new", "description": "Stunning hand-dyed Adire silk maxi dress featuring intricate traditional patterns. This masterpiece blends African heritage with contemporary fashion, perfect for special occasions and elegant outings.", "features": ["Premium Adire silk fabric", "Hand-dyed traditional patterns", "Flattering maxi silhouette", "Breathable and lightweight"], "sizes": ["S", "M", "L", "XL"], "colors": ["Indigo", "White", "Brown"], "stock": 15, "images": [product_images[0]]},
        {"name": "Ankara Print Wrap Dress", "category": "Ready-to-Wear Traditional", "price": 35000, "badge": "hot", "description": "A beautifully crafted Ankara print wrap dress that celebrates African textile artistry. Features a flattering wrap design that suits all body types.", "features": ["100% African Ankara print", "Adjustable wrap design", "Durable stitching", "Machine washable"], "sizes": ["S", "M", "L", "XL", "XXL"], "colors": ["Multi-color", "Blue", "Red"], "stock": 22, "images": [product_images[0]]},
        {"name": "Premium Leather Tote Bag", "category": "Bags", "price": 55000, "discount_price": 48000, "badge": "limited", "description": "Handcrafted premium leather tote bag with gold-tone hardware. Spacious interior with multiple compartments for everyday luxury.", "features": ["Genuine leather", "Gold-tone hardware", "Multiple compartments", "Adjustable shoulder strap"], "sizes": ["One Size"], "colors": ["Black", "Brown", "Tan"], "stock": 8, "images": [product_images[1]]},
        {"name": "Crossbody Mini Bag", "category": "Bags", "price": 28000, "description": "Sleek crossbody mini bag perfect for on-the-go. Crafted from high-quality faux leather with a minimalist design.", "features": ["High-quality faux leather", "Adjustable strap", "Secure zip closure", "Compact yet spacious"], "sizes": ["One Size"], "colors": ["Black", "Cream", "Burgundy"], "stock": 30, "images": [product_images[1]]},
        {"name": "Oxford Classic Leather Shoes", "category": "Shoes", "price": 42000, "discount_price": 36000, "badge": "new", "description": "Classic Oxford leather shoes with a modern twist. Perfect for formal occasions and business meetings.", "features": ["Full-grain leather", "Cushioned insole", "Non-slip sole", "Classic Oxford design"], "sizes": ["40", "41", "42", "43", "44", "45"], "colors": ["Black", "Brown"], "stock": 18, "images": [product_images[2]]},
        {"name": "Stiletto Heel Pumps", "category": "Shoes", "price": 32000, "badge": "hot", "description": "Elegant stiletto heel pumps that add sophistication to any outfit. Premium suede finish with cushioned footbed.", "features": ["Premium suede material", "4-inch stiletto heel", "Cushioned footbed", "Pointed toe design"], "sizes": ["36", "37", "38", "39", "40", "41"], "colors": ["Black", "Red", "Nude"], "stock": 25, "images": [product_images[2]]},
        {"name": "Italian Slim-Fit Suit", "category": "Suits", "price": 85000, "discount_price": 72000, "badge": "limited", "description": "Impeccably tailored Italian slim-fit suit in premium wool blend. A statement piece for the modern gentleman.", "features": ["Premium wool blend", "Italian slim-fit cut", "Fully lined jacket", "Flat-front trousers"], "sizes": ["38", "40", "42", "44", "46"], "colors": ["Navy", "Charcoal", "Black"], "stock": 10, "images": [product_images[2]]},
        {"name": "Women Power Suit Set", "category": "Suits", "price": 68000, "badge": "new", "description": "Boss-worthy power suit set for the modern woman. Tailored blazer with matching straight-leg trousers.", "features": ["Tailored fit", "Premium poly-blend fabric", "Matching set", "Professional elegance"], "sizes": ["S", "M", "L", "XL"], "colors": ["Black", "White", "Blush Pink"], "stock": 14, "images": [product_images[3]]},
        {"name": "Premium Cotton Boxer Set (3 Pack)", "category": "Underwear", "price": 12000, "description": "Ultra-comfortable premium cotton boxer set. Breathable fabric with elastic waistband for all-day comfort.", "features": ["100% premium cotton", "Breathable fabric", "Elastic waistband", "3-pack value"], "sizes": ["S", "M", "L", "XL", "XXL"], "colors": ["Assorted"], "stock": 50, "images": [product_images[3]]},
        {"name": "Cashmere Blend Sweater", "category": "Clothing", "price": 38000, "discount_price": 32000, "badge": "new", "description": "Luxuriously soft cashmere blend sweater perfect for cool evenings. Classic crew neck design with ribbed cuffs.", "features": ["Cashmere-wool blend", "Crew neck design", "Ribbed cuffs and hem", "Machine washable"], "sizes": ["S", "M", "L", "XL"], "colors": ["Camel", "Grey", "Navy", "Cream"], "stock": 20, "images": [product_images[3]]},
        {"name": "Linen Summer Shirt", "category": "Clothing", "price": 22000, "badge": "hot", "description": "Breathable linen summer shirt with a relaxed fit. Perfect for tropical weather and casual outings.", "features": ["100% premium linen", "Relaxed fit", "Button-front design", "Breathable fabric"], "sizes": ["S", "M", "L", "XL", "XXL"], "colors": ["White", "Sky Blue", "Sage Green"], "stock": 35, "images": [product_images[3]]},
        {"name": "Gold-Plated Chain Necklace", "category": "Accessories", "price": 18000, "badge": "limited", "description": "Elegant gold-plated chain necklace that adds a touch of luxury to any outfit. Hypoallergenic and tarnish-resistant.", "features": ["18K gold-plated", "Hypoallergenic", "Tarnish-resistant", "Adjustable length"], "sizes": ["One Size"], "colors": ["Gold"], "stock": 40, "images": [product_images[0]]},
    ]

    rules = "No refund after purchase (unless damaged). Exchange allowed within 48 hours (conditions apply). Customers must confirm size before ordering. Payment must be completed before processing. Delivery timeline depends on location."
    care = "Do not bleach. Hand wash or dry clean recommended. Iron at low temperature. Store in a cool, dry place."

    for p in sample_products:
        cat_name = p.pop("category")
        p["product_id"] = str(uuid.uuid4())
        p["slug"] = re.sub(r'[^a-z0-9]+', '-', p["name"].lower()).strip('-')
        p["category_id"] = cat_map.get(cat_name, "")
        p["rules"] = rules
        p["care_instructions"] = care
        p["promotional_text"] = "Limited stock available - order now."
        p.setdefault("features", [])
        p.setdefault("discount_price", None)
        p.setdefault("badge", None)
        p["status"] = "in_stock"
        p["views"] = 0
        p["created_at"] = datetime.now(timezone.utc).isoformat()
        p["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.products.insert_one(p)
    logger.info("Products seeded")

async def seed_settings():
    existing = await db.settings.find_one({"setting_id": "global"})
    if not existing:
        await db.settings.insert_one({
            "setting_id": "global",
            "bank_name": "",
            "account_name": "",
            "account_number": "",
            "whatsapp_number": "2349133487799",
            "contact_phone": "09133487799",
            "ceo_name": "Nenzab David Bunshak",
            "homepage_text": "Luxury Within Reach, Style Without Limits.",
            "banner_images": [],
            "address": "Garki Ultra Modern Market, Ado Bayero Block, Shop 67, Abuja, Nigeria"
        })

# ============ STARTUP ============

@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.products.create_index("product_id", unique=True)
    await db.products.create_index("category_id")
    await db.categories.create_index("category_id", unique=True)
    await db.orders.create_index("order_id", unique=True)
    await db.orders.create_index("user_id")
    await db.notifications.create_index("notification_id")
    await db.login_attempts.create_index("identifier")
    await seed_admin()
    await seed_categories()
    await seed_products()
    await seed_settings()
    # Write test credentials
    try:
        memory_dir = "/app/memory"
        if not os.path.exists(memory_dir):
            try:
                os.makedirs(memory_dir, exist_ok=True)
            except Exception:
                # Fallback to local memory folder in workspace
                memory_dir = str(ROOT_DIR.parent / "memory")
                os.makedirs(memory_dir, exist_ok=True)
        with open(os.path.join(memory_dir, "test_credentials.md"), "w") as f:
            f.write(f"# Test Credentials\n\n")
            f.write(f"## Admin\n- Email: {os.environ.get('ADMIN_EMAIL')}\n- Password: {os.environ.get('ADMIN_PASSWORD')}\n- Role: superadmin\n\n")
            f.write(f"## Auth Endpoints\n- POST /api/auth/register\n- POST /api/auth/login\n- POST /api/auth/logout\n- GET /api/auth/me\n")
    except Exception as e:
        logger.error(f"Failed to write test credentials: {e}")
    logger.info("Startup complete")

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
