"""Offline phoneme scorer for local pronunciation checking."""

import re
from typing import Any

import pronouncing


LETTER_ALIASES = {
    "a": ["ay", "a"], "b": ["bee", "be", "bi", "b"],
    "c": ["see", "sea", "si", "c"], "d": ["dee", "di", "d"],
    "e": ["ee", "e"], "f": ["ef", "eff", "f"],
    "g": ["gee", "ji", "g"], "h": ["aitch", "h"],
    "i": ["eye", "i"], "j": ["jay", "j"], "k": ["kay", "k"],
    "l": ["el", "ell", "l"], "m": ["em", "m"], "n": ["en", "n"],
    "o": ["oh", "o"], "p": ["pee", "pi", "p"],
    "q": ["cue", "queue", "kyu", "q"], "r": ["are", "ar", "r"],
    "s": ["ess", "es", "s"], "t": ["tee", "ti", "t"],
    "u": ["you", "yu", "u"], "v": ["vee", "vi", "v"],
    "w": ["double you", "double u", "w"],
    "x": ["ex", "eks", "x"], "y": ["why", "wai", "y"],
    "z": ["zee", "zed", "z"],
}

LETTER_CANONICAL = {
    "a": "ay", "b": "bee", "c": "see", "d": "dee", "e": "ee",
    "f": "ef", "g": "gee", "h": "aitch", "i": "eye", "j": "jay",
    "k": "kay", "l": "el", "m": "em", "n": "en", "o": "oh",
    "p": "pee", "q": "cue", "r": "ar", "s": "ess", "t": "tee",
    "u": "you", "v": "vee", "w": "double you", "x": "ex",
    "y": "why", "z": "zee",
}


def _tokens(text: str) -> list[str]:
    normalized = text.lower().replace("đ", "d")
    return re.findall(r"[a-z]+", normalized)


def _phones_for_word(word: str) -> list[str]:
    pronunciations = pronouncing.phones_for_word(word)
    if not pronunciations:
        return []
    return re.findall(r"[A-Z]+", pronunciations[0].upper())


def phones_for_text(text: str) -> list[str]:
    phones: list[str] = []
    for token in _tokens(text):
        phones.extend(_phones_for_word(token))
    return phones


def _phones_for_letter_alias(text: str) -> list[str] | None:
    normalized = " ".join(_tokens(text))
    for letter, aliases in LETTER_ALIASES.items():
        if normalized in aliases:
            return phones_for_text(LETTER_CANONICAL[letter])
    return None


def _distance(left: list[str], right: list[str]) -> int:
    matrix = [[0] * (len(right) + 1) for _ in range(len(left) + 1)]
    for row in range(len(left) + 1):
        matrix[row][0] = row
    for column in range(len(right) + 1):
        matrix[0][column] = column
    for row in range(1, len(left) + 1):
        for column in range(1, len(right) + 1):
            matrix[row][column] = min(
                matrix[row - 1][column] + 1,
                matrix[row][column - 1] + 1,
                matrix[row - 1][column - 1] + (left[row - 1] != right[column - 1]),
            )
    return matrix[-1][-1]


def _similarity(left: list[str], right: list[str]) -> int:
    if not left or not right:
        return 0
    return round((1 - _distance(left, right) / max(len(left), len(right))) * 100)


def score_pronunciation(target_text: str, recognized_text: str) -> dict[str, Any]:
    target = target_text.strip().lower()
    recognized = recognized_text.strip().lower()
    if not target or not recognized:
        return {"score": None, "targetPhonemes": "", "recognizedPhonemes": "", "method": "cmudict"}

    if re.fullmatch(r"[a-z]", target):
        target_options = [phones_for_text(LETTER_CANONICAL.get(target, target))]
    else:
        target_phones = phones_for_text(target)
        target_options = [target_phones] if target_phones else []

    recognized_phones = _phones_for_letter_alias(recognized) or phones_for_text(recognized)
    if not target_options or not recognized_phones:
        return {"score": None, "targetPhonemes": "", "recognizedPhonemes": "", "method": "cmudict"}

    best_target = max(target_options, key=lambda option: _similarity(option, recognized_phones))
    return {
        "score": _similarity(best_target, recognized_phones),
        "targetPhonemes": " ".join(best_target),
        "recognizedPhonemes": " ".join(recognized_phones),
        "method": "cmudict-phoneme",
    }
