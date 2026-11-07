"""Persistent local faster-whisper worker using newline-delimited JSON."""

import json
import os
import re
import sys
from typing import Any

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


def error_result(request_id: str, message: str) -> None:
    print(json.dumps({"id": request_id, "ok": False, "error": message}, ensure_ascii=False), flush=True)


try:
    from faster_whisper import WhisperModel
except Exception as exc:  # pragma: no cover - setup error path
    WhisperModel = None  # type: ignore[assignment]
    IMPORT_ERROR = exc
else:
    IMPORT_ERROR = None

try:
    from phoneme_scoring import score_pronunciation
except Exception:  # pragma: no cover - setup error path
    score_pronunciation = None  # type: ignore[assignment]

# faster-whisper 1.2.x passes metadata_errors to av.open(), while newer PyAV
# removed that keyword. Keep the bundled FFmpeg decoder and discard only this
# obsolete option instead of requiring a system FFmpeg or a C++ build toolchain.
try:
    import av
    import numpy as np

    _av_open = av.open

    def _compatible_av_open(*args, **kwargs):
        kwargs.pop("metadata_errors", None)
        return _av_open(*args, **kwargs)

    av.open = _compatible_av_open
except Exception:
    pass


def has_audio_energy(audio_path: str) -> bool:
    """Avoid no-VAD Whisper hallucinations when the recording is actually silent."""
    try:
        with av.open(audio_path) as container:
            for frame in container.decode(audio=0):
                samples = frame.to_ndarray().astype(np.float32)
                if samples.size == 0:
                    continue
                peak = float(np.max(np.abs(samples)))
                if peak > 2.0:
                    samples /= 32768.0
                    peak /= 32768.0
                rms = float(np.sqrt(np.mean(np.square(samples))))
                if peak >= 0.02 or rms >= 0.004:
                    return True
        return False
    except Exception:
        # Let Whisper handle unusual codecs and report its own decoder error.
        return True


model = None

LETTER_PROMPT = (
    "The speaker says exactly one English letter name. Possible names are: "
    "ay, bee, bi, be, see, sea, dee, di, ee, ef, eff, gee, ji, aitch, eye, "
    "jay, kay, el, em, en, oh, pee, pi, cue, queue, are, ar, ess, es, tee, "
    "ti, you, vee, vi, double you, ex, why, zee, zed. Do not transcribe a sentence."
)
LETTER_HOTWORDS = (
    "ay bee bi be see sea dee di ee ef eff gee ji aitch eye jay kay el em en oh "
    "pee pi cue queue are ar ess es tee ti you vee vi double you ex why zee zed"
)


def is_letter_exercise(target_text: str) -> bool:
    return bool(re.fullmatch(r"[A-Za-z]", target_text.strip()))


def get_model():
    global model
    if model is not None:
        return model
    if WhisperModel is None:
        raise RuntimeError(
            "Chưa cài faster-whisper. Hãy chạy: py -3 -m pip install faster-whisper"
            f" ({IMPORT_ERROR})"
        )
    model = WhisperModel(
        os.getenv("WHISPER_MODEL", "small.en"),
        device=os.getenv("WHISPER_DEVICE", "cpu"),
        compute_type=os.getenv("WHISPER_COMPUTE_TYPE", "int8"),
    )
    return model


def transcribe(request: dict[str, Any]) -> dict[str, Any]:
    request_id = str(request.get("id", ""))
    audio_path = str(request.get("audioPath", ""))
    if not audio_path or not os.path.isfile(audio_path):
        return {"id": request_id, "ok": False, "error": "Không tìm thấy file ghi âm tạm thời."}

    try:
        letter_exercise = is_letter_exercise(str(request.get("targetText", "")))
        transcription_options: dict[str, Any] = {
            "language": os.getenv("WHISPER_LANGUAGE", "en"),
            "beam_size": 5,
            "temperature": 0.0,
            "compression_ratio_threshold": 2.4,
            "log_prob_threshold": -1.0,
            "no_speech_threshold": 0.6,
            "vad_filter": True,
            "vad_parameters": {"min_silence_duration_ms": 250},
            "condition_on_previous_text": False,
            "without_timestamps": True,
        }
        if letter_exercise:
            # Domain guidance only: list every letter name so the expected
            # answer is not forced and a wrong answer remains wrong.
            transcription_options.update({
                "initial_prompt": LETTER_PROMPT,
                "hotwords": LETTER_HOTWORDS,
                "max_new_tokens": 16,
                "chunk_length": 3,
                "hallucination_silence_threshold": 0.5,
            })

        segments, _info = get_model().transcribe(
            audio_path,
            **transcription_options,
        )
        segment_list = list(segments)
        text = " ".join(segment.text.strip() for segment in segment_list if segment.text.strip()).strip()
        if not text and has_audio_energy(audio_path):
            # Short letter names can be discarded by VAD as silence. Retry the
            # same recording without VAD before returning an empty transcript.
            retry_options = dict(transcription_options)
            retry_options["vad_filter"] = False
            retry_options["no_speech_threshold"] = 0.2
            retry_options.pop("vad_parameters", None)
            retry_segments, _retry_info = get_model().transcribe(audio_path, **retry_options)
            segment_list = list(retry_segments)
            text = " ".join(segment.text.strip() for segment in segment_list if segment.text.strip()).strip()
        log_probs = [float(segment.avg_logprob) for segment in segment_list if segment.avg_logprob is not None]
        confidence = None
        if log_probs:
            mean_logprob = sum(log_probs) / len(log_probs)
            confidence = max(0.0, min(1.0, 2.0 ** mean_logprob))
        phoneme_result = score_pronunciation(
            str(request.get("targetText", "")), text
        ) if score_pronunciation else {
            "score": None,
            "targetPhonemes": "",
            "recognizedPhonemes": "",
            "method": "unavailable",
        }
        return {
            "id": request_id,
            "ok": True,
            "text": text,
            "confidence": confidence,
            "phonemeScore": phoneme_result["score"],
            "targetPhonemes": phoneme_result["targetPhonemes"],
            "recognizedPhonemes": phoneme_result["recognizedPhonemes"],
            "phonemeMethod": phoneme_result["method"],
        }
    except Exception as exc:
        return {"id": request_id, "ok": False, "error": f"Whisper lỗi: {exc}"}


for line in sys.stdin:
    payload: dict[str, Any] = {}
    try:
        payload = json.loads(line)
        print(json.dumps(transcribe(payload), ensure_ascii=False), flush=True)
    except Exception as exc:
        error_result(str(payload.get("id", "")), f"Whisper không đọc được yêu cầu: {exc}")
