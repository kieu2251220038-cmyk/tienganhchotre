# Local Whisper setup

The speaking page uses `faster-whisper` on this computer. It does not use
Google Cloud, an API key, a service-account JSON file, or cloud billing.

## Install once

```powershell
cd D:\tienganhchotre\Backend
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements-local-whisper.txt
```

The first recognition downloads the selected model once. The default `small.en`
model is used because short letter names need better accuracy. Use `tiny.en` or
`base.en` on a slower computer; use `small.en` when more accuracy and RAM are
available.

## Backend/.env

```env
WHISPER_ENABLED=true
WHISPER_PYTHON=D:\\tienganhchotre\\Backend\\.venv\\Scripts\\python.exe
WHISPER_MODEL=small.en
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8
WHISPER_LANGUAGE=en
```

Remove old `GOOGLE_*` lines and restart the Backend:

```powershell
npm run dev
```

The browser records a short `.webm` clip and sends it to the Backend. A
persistent local Whisper worker returns the raw transcript, and the learning
page compares it with the target. A wrong transcript is never silently changed
into the expected answer.

For pronunciation scoring, the worker also maps the target and transcript to
local CMU phonemes. For example, `D/dee` produces `D IY`, while `D/bee`
produces `B IY` and cannot pass the 80% threshold. The transcript shown to the
child remains the original Whisper text.

Whisper is speech-to-text, not a phoneme-level pronunciation judge. Very short
letter names such as “ay” can still be confused with another word; strict text
comparison makes the result honest and allows the child to try again.
