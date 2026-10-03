"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [status, setStatus] = useState(
    "Tap Listen and let me hear the music for 10 seconds."
  );
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("songFinderHistory") || "[]");
      setHistory(saved);
    } catch {
      setHistory([]);
    }
  }, []);

  function saveSong(song) {
    const newSong = {
      title: song.title,
      artist: song.artist,
      album: song.album || "",
      song_link: song.song_link || "",
      foundAt: Date.now(),
    };

    setHistory((current) => {
      // Remove an older copy if the same song was already identified.
      const withoutDuplicate = current.filter(
        (item) =>
          !(
            item.title?.toLowerCase() === newSong.title?.toLowerCase() &&
            item.artist?.toLowerCase() === newSong.artist?.toLowerCase()
          )
      );

      // Keep only the 10 most recent songs.
      const updated = [newSong, ...withoutDuplicate].slice(0, 10);

      localStorage.setItem("songFinderHistory", JSON.stringify(updated));
      return updated;
    });
  }

  function clearHistory() {
    localStorage.removeItem("songFinderHistory");
    setHistory([]);
  }

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

          if (!response.ok) {
            throw new Error(data.error || "Recognition failed.");
          }

          if (!data.result) {
            setStatus("No match found. Try again closer to the music.");
          } else {
            setResult(data.result);
            saveSong(data.result);
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
              <a
                href={result.song_link}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Song
              </a>
            )}
          </div>
        )}

        {history.length > 0 && (
          <div className="history">
            <div className="historyHeader">
              <h2>Recent Songs</h2>

              <button className="clearButton" onClick={clearHistory}>
                Clear
              </button>
            </div>

            {history.map((song, index) => (
              <div className="historySong" key={`${song.title}-${song.artist}-${index}`}>
                {song.song_link ? (
                  <a
                    href={song.song_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <strong>{song.title}</strong>
                    <span>{song.artist}</span>
                  </a>
                ) : (
                  <>
                    <strong>{song.title}</strong>
                    <span>{song.artist}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
