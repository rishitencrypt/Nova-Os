import wallpaper from "../assets/wallpaper.mp4";

import w1 from "../assets/wallpapers/w1.mp4";
import w2 from "../assets/wallpapers/w2.mp4";
import w3 from "../assets/wallpapers/w3.mp4";
import w4 from "../assets/wallpapers/w4.mp4";

function VideoBackground({
  wallpaperName = "default",
}) {
  const videos = {
    default: wallpaper,
    wallpaper1: w1,
    wallpaper2: w2,
    wallpaper3: w3,
    wallpaper4: w4,
  };

  return (
    <div className="video-background">
      <video
        key={wallpaperName}
        autoPlay
        muted
        loop
        playsInline
      >
        <source
          src={
            videos[wallpaperName] ||
            wallpaper
          }
          type="video/mp4"
        />
      </video>

      <div className="video-overlay" />
    </div>
  );
}

export default VideoBackground;