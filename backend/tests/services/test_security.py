from app.core.security import hash_password, verify_password, create_access_token, decode_token


def test_password_hash_and_verify():
    hashed = hash_password("Secret@123")
    assert verify_password("Secret@123", hashed)
    assert not verify_password("WrongPass1", hashed)


def test_access_token_encode_decode():
    token = create_access_token("some-user-id")
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == "some-user-id"
    assert payload["type"] == "access"


def test_invalid_token_returns_none():
    result = decode_token("not.a.valid.token")
    assert result is None
