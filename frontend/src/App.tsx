import { FFmpeg } from "@ffmpeg/ffmpeg";
import { ChangeEvent, useEffect, useRef, useState } from "react";

function App() {
  const ffmpegRef = useRef(new FFmpeg());
  const [isLoaded, setLoaded] = useState(false);
  const [working, setWorking] = useState(false);
  const [video, setVideo] = useState<File>();

  const load = async () => {
    const ffmpeg = ffmpegRef.current;

    ffmpeg.on("log", (message) => {
      console.log("[FFMPEG]", message);
    });

    await ffmpeg.load({
      coreURL: "/ffmpeg-core.js",
      wasmURL: "/ffmpeg-core.wasm",
    });
    setLoaded(true);
  };

  // Loads FFMPEG files
  useEffect(() => {
    if (!isLoaded) {
      load();
    }
  }, [isLoaded]);

  const onFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const video = event.target.files?.[0];
    if (!video) {
      return;
    }
    setVideo(video);
  };

  const transcode = async () => {
    if (!video) {
      return;
    }

    setWorking(true);
    try {
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg) {
        return;
      }
      const videoArrayBuffer = await video.arrayBuffer();
      const toTranscodeFilename = "to_transcode.mov";

      console.log("Copying file to FFMPEG wasm space");
      await ffmpeg.writeFile(
        toTranscodeFilename,
        new Uint8Array(videoArrayBuffer),
      );

      console.log("Converting from .mov to .mp4");
      const result = await ffmpeg.exec([
        "-i",
        toTranscodeFilename,
        "-vcodec",
        "h264",
        "-acodec",
        "aac",
        "output.mp4",
      ]);
      if (result === 1) {
        throw new Error("Failed to transcode");
      }

      console.log("Reading converted file back into JS space");
      const data = await ffmpeg.readFile("output.mp4");

      console.log("Removing file in FFMPEG space");
      await ffmpeg.deleteFile(toTranscodeFilename);

      console.log("Triggering converted file download");
      const blob = new Blob([data], { type: "video/mp4" });
      triggerBlobDownload(blob, "converted.mp4");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
      <label htmlFor="video-to-transcode">Choose a video for transcoding</label>
      <input
        type="file"
        id="video-to-transcode"
        accept="video/mov"
        onChange={onFileUpload}
      />
      <div>
        {!working ? (
          <button onClick={transcode}>Transcode</button>
        ) : (
          <p>Transcoding...</p>
        )}
      </div>
    </div>
  );
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default App;
