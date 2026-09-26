"use client";

import { useState } from "react";

export default function Home() {
  const [status, setStatus] = useState(
    "Tap Listen and let me hear the music for 10 seconds."
  );
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState(null);

  async function identify() {
    setResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setStatus("Identifying…");

        const audio = new Blob(chunks, {
          type: recorder.mimeType || "audio/webm",
        });

        const form = new FormData();
        form.append("audio", audio, "clip.webm");

        try {
          const response = await fetch("/api/recognize", {
            method: "POST",
            body: form,
          });

          const data = await response.json();

          if (!response.ok) throw new Error(data.error);

          if (!data.result) {
            setStatus("No match found. Try again closer to the music.");
          } else {
            setResult(data.result);
            setStatus("Found it!");
          }
        } catch {
          setStatus("Couldn't identify that song. Try again.");
        }

        setListening(false);
      };

      recorder.start();
      setListening(true);
      setStatus("Listening…");

      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 10000);
    } catch {
      setListening(false);
      setStatus("Please allow microphone access and try again.");
    }
  }

  return (
    <main>
      <div className="card">
        <div className="note">♪</div>

        <h1>Song Finder</h1>

        <p>{status}</p>

        <button onClick={identify} disabled={listening}>
          {listening ? "Listening…" : "Listen"}
        </button>

        {result && (
          <div className="result">
            <h2>{result.title}</h2>
            <p>{result.artist}</p>
            {result.album && <small>{result.album}</small>}

            {result.song_link && (
              <a href={result.song_link} target="_blank">
                Open Song
              </a>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
