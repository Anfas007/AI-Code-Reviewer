from app.services.auth_service import hash_password, verify_password
from app.core.security import create_access_token
from jose import jwt
from app.core.security import ALGORITHM, SECRET_KEY


def test_password_hash_is_verifiable_and_not_plaintext():
    password = "Correct Horse Battery Staple"
    password_hash = hash_password(password)

    assert password_hash != password
    assert verify_password(password, password_hash)
    assert not verify_password("wrong", password_hash)


def test_access_token_contains_user_subject_and_expiry():
    token = create_access_token({"sub": "42"})
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

    assert payload["sub"] == "42"
    assert "exp" in payload
