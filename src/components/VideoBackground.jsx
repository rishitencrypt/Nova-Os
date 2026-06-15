import wallpaper from "../assets/wallpaper.mp4";

function VideoBackground() {
  return (
    <div className="video-background">

      <video
        autoPlay
        muted
        loop
        playsInline
      >
        <source
          src={wallpaper}
          type="video/mp4"
        />
      </video>

      <div className="video-overlay"></div>

    </div>
  );
}

export default VideoBackground;