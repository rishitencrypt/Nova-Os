import { useState, useRef, useEffect } from "react";

import song1 from "../assets/music/song1.mp3";
import song2 from "../assets/music/song2.mp3";
import song3 from "../assets/music/song3.mp3";

import cover1 from "../assets/cover/song1.jpeg";
import cover2 from "../assets/cover/song2.jpeg";
import cover3 from "../assets/cover/song3.webp";

const playlist = [
  {
    title: "Track 01",
    artist: "Nova Music",
    file: song1,
    cover: cover1,
  },
  {
    title: "Track 02",
    artist: "Nova Music",
    file: song2,
    cover: cover2,
  },
  {
    title: "Track 03",
    artist: "Nova Music",
    file: song3,
    cover: cover3,
  },
];

function NovaMusic() {
  const audioRef = useRef(null);

  const [currentTrack, setCurrentTrack] =
    useState(0);

  const [playing, setPlaying] =
    useState(false);

  const [currentTime, setCurrentTime] =
    useState(0);

  const [duration, setDuration] =
    useState(0);

  const [volume, setVolume] =
    useState(0.7);

  const track = playlist[currentTrack];
const [bars, setBars] = useState(
  Array(20).fill(20)
);
useEffect(() => {
  if (!playing) return;

  const id = setInterval(() => {
    setBars(
      Array.from(
        { length: 20 },
        () =>
          15 +
          Math.random() * 45
      )
    );
  }, 120);

  return () => clearInterval(id);
}, [playing]);
  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    if (playing) {
      audio.play();
    } else {
      audio.pause();
    }
  }, [playing, currentTrack]);

  const togglePlay = () => {
    setPlaying(!playing);
  };

  const nextTrack = () => {
    setCurrentTrack(
      (prev) => (prev + 1) % playlist.length
    );

    setCurrentTime(0);
  };

  const prevTrack = () => {
    setCurrentTrack(
      (prev) =>
        prev === 0
          ? playlist.length - 1
          : prev - 1
    );

    setCurrentTime(0);
  };

  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);

    return `${mins}:${String(
      secs
    ).padStart(2, "0")}`;
  };

  return (
    <div className="nova-music">

      <audio
        ref={audioRef}
        src={track.file}
        onLoadedMetadata={(e) =>
          setDuration(
            e.target.duration
          )
        }
        onTimeUpdate={(e) =>
          setCurrentTime(
            e.target.currentTime
          )
        }
        onEnded={nextTrack}
      />

      <div
  className={`music-disc ${
    playing ? "spinning" : ""
  }`}
>
  <img
    src={track.cover}
    alt=""
    className="music-cover"
  />

  <div className="disc-center" />
</div>

      <h2>{track.title}</h2>

      <p>{track.artist}</p>

      <input
        type="range"
        min="0"
        max={duration || 0}
        value={currentTime}
        onChange={(e) => {
          audioRef.current.currentTime =
            e.target.value;

          setCurrentTime(
            e.target.value
          );
        }}
        className="music-progress"
      />

      <div className="music-times">
        <span>
          {formatTime(currentTime)}
        </span>

        <span>
          {formatTime(duration)}
        </span>
      </div>
      <div className="music-visualizer">
  {bars.map((height, i) => (
    <span
      key={i}
      className="music-bar"
      style={{
        height: `${height}px`,
      }}
    />
  ))}
</div>
      <div className="music-controls">

        <button
          onClick={prevTrack}
        >
          ⏮
        </button>

        <button
          onClick={togglePlay}
        >
          {playing
            ? "⏸"
            : "▶"}
        </button>

        <button
          onClick={nextTrack}
        >
          ⏭
        </button>

      </div>

      <div className="music-volume">

        <span>🔊</span>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => {
            const v =
              e.target.value;

            setVolume(v);

            audioRef.current.volume =
              v;
          }}
        />

      </div>

    </div>
  );
}

export default NovaMusic;