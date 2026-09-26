export const runtime = "nodejs";

export async function POST(request) {
  try {
    const incoming = await request.formData();
    const audio = incoming.get("audio");

    if (!audio) {
      return Response.json({ error: "No audio received." }, { status: 400 });
    }

    const token = process.env.AUDD_API_TOKEN;

    if (!token) {
      return Response.json(
        { error: "AudD API token is not configured." },
        { status: 500 }
      );
    }

    const form = new FormData();
    form.append("api_token", token);
    form.append("file", audio, "clip.webm");
    form.append("return", "apple_music,spotify");

    const response = await fetch("https://api.audd.io/", {
      method: "POST",
      body: form,
    });

    const data = await response.json();

    if (data.status !== "success") {
      return Response.json(
        { error: data.error?.error_message || "Recognition failed." },
        { status: 502 }
      );
    }

    if (!data.result) {
      return Response.json({ result: null });
    }

    return Response.json({
      result: {
        title: data.result.title,
        artist: data.result.artist,
        album: data.result.album,
        song_link: data.result.song_link,
      },
    });
  } catch {
    return Response.json(
      { error: "Unable to process recording." },
      { status: 500 }
    );
  }
}
