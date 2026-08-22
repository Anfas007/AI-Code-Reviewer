import pytest
from fastapi import HTTPException

from app.api.review import MAX_FILE_SIZE, validate_python_code


def test_valid_python_is_accepted():
    validate_python_code("print('ok')")


def test_invalid_python_is_rejected():
    with pytest.raises(HTTPException) as error:
        validate_python_code("def broken(:")

    assert error.value.status_code == 400


def test_empty_python_is_rejected():
    with pytest.raises(HTTPException) as error:
        validate_python_code("   \n")

    assert error.value.status_code == 400


def test_upload_limit_is_one_megabyte():
    assert MAX_FILE_SIZE == 1024 * 1024
