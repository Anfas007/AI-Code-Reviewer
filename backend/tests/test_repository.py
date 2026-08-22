from app.services.review_repository import create_review


class FakeDatabase:
    def __init__(self):
        self.added = None
        self.commits = 0
        self.refreshes = 0
        self.rollbacks = 0

    def add(self, value):
        self.added = value
        self.added.id = 17

    def commit(self):
        self.commits += 1

    def refresh(self, value):
        self.refreshes += 1

    def rollback(self):
        self.rollbacks += 1


def test_create_review_persists_normalized_review_data():
    db = FakeDatabase()
    result = {
        "valid": True,
        "score": 5,
        "metrics": {"functions": 3},
        "issues": [{"severity": "high"}],
        "summary": {"high": 1, "medium": 0, "low": 0},
        "ai_review": {"security": []},
    }

    review = create_review(db, user_id=9, filename=" sample.py ", result=result)

    assert review.id == 17
    assert review.user_id == 9
    assert review.filename == "sample.py"
    assert review.score == 5
    assert review.metrics == {"functions": 3}
    assert db.commits == 1
    assert db.refreshes == 1
