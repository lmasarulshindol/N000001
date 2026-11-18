"""ひより CV オーディション: 同一台詞・同一 seed で声だけ変えて比較."""
import sys, time, subprocess
from pathlib import Path

ROOT = Path(r"c:\Users\lmasa\Cursor\VoiceActorLaboratory\elevenlabs")
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "scripts"))
from eleven_tts import ElevenV4Client  # noqa: E402
from run_rp_eleven_batch import load_api_key, mp3_to_wav  # noqa: E402

OUT = Path(__file__).parent / "out"
OUT.mkdir(exist_ok=True)

VOICES = {
    "H1_Hina": "lhTvHflPVOqgSWyuWQry",
    "H2_Kano": "OSwaPSNdfituxkWcjlkR",
    "H3_Sameno": "hMK7c1GPJmptCzI4bQIu",
    "H4_Aki": "ngvNHfiCrXLPAHcTrZK1",
    "H5_Yuki": "JTlYtJrcTzPC71hMLOxo",
}
SEED = 20261118
LINES = {
    "talk": (0.45, "[happily] あの、すみません！ここ、相席してもいいですか？……ほんとはぜんぜん空いてるの。[softly] お兄さんとお話ししたくて、来ちゃいました。えへへ。"),
    "whisper": (0.40, "[whispers] あのね、お兄さん。びっくりしないで聞いてね。……ひより、ほんとは、AVの撮影で来てるの。[shy] 逆ナン企画っていって、好みの人に声をかけるところから、全部撮るんだ。"),
    "sex": (0.20, "[breathy][moaning] あっ……そこ、だめ……っ。[panting] お兄さんの顔、見てたいのに……ひより、もう、イっちゃいそう……っ。その顔、ひより、大好き……。"),
}

client = ElevenV4Client(load_api_key(), model_id="eleven_v4")
for vname, vid in VOICES.items():
    for kind, (stab, text) in LINES.items():
        wav = OUT / f"{vname}_{kind}.wav"
        if wav.exists() and wav.stat().st_size > 800:
            continue
        mp3 = wav.with_suffix(".mp3")
        try:
            mp3.write_bytes(client.synthesize(text, vid, stability=stab, seed=SEED, language_code="ja"))
            mp3_to_wav(mp3, wav)
            print("saved", wav.name, flush=True)
        except Exception as e:  # noqa: BLE001
            print("fail", wav.name, e, flush=True)
        time.sleep(0.3)
