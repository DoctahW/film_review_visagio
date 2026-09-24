import pytest

from app.scripts.seed import unescape_title


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ('"call Sign ""banderas"""', 'Call Sign "Banderas"'),
        ('"""blessed"""', '"Blessed"'),
        (
            '"how Viktor ""the Garlic"" Took Alexey ""the Stud"" To The Nursing Home"',
            'How Viktor "The Garlic" Took Alexey "The Stud" To The Nursing Home',
        ),
        ('"operation ""new Year""!"', 'Operation "New Year"!'),
        ('"ángela Aguilar ""bolero"""', 'Ángela Aguilar "Bolero"'),
        ('"headwind""21"', 'Headwind"21'),
        ('8\' 19""', "8' 19\""),
    ],
)
def test_unescapes_double_escaped_title(raw: str, expected: str) -> None:
    assert unescape_title(raw) == expected


@pytest.mark.parametrize("title", ["eXistenZ", "#21xoxo", 'O "Auto" da Compadecida'])
def test_keeps_regular_title(title: str) -> None:
    assert unescape_title(title) == title
