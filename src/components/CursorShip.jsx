import { useEffect, useState, useRef } from "react";

export default function CursorShip() {
  const [target, setTarget] = useState({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });

  const [pos, setPos] = useState({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });

  const animationRef = useRef();

  useEffect(() => {
    const handleMove = (e) => {
      setTarget({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener("mousemove", handleMove);

    return () => {
      window.removeEventListener("mousemove", handleMove);
    };
  }, []);

  useEffect(() => {
    const animate = () => {
      setPos((prev) => ({
        x: prev.x + (target.x - prev.x) * 0.06,
        y: prev.y + (target.y - prev.y) * 0.06,
      }));

      animationRef.current =
        requestAnimationFrame(animate);
    };

    animationRef.current =
      requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [target]);

  const moving =
    Math.abs(target.x - pos.x) > 8 ||
    Math.abs(target.y - pos.y) > 8;

  const angle =
    Math.atan2(
      target.y - pos.y,
      target.x - pos.x
    ) *
    (180 / Math.PI);

  return (
    <div
      className="cursor-ship"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: `translate(-50%, -50%) rotate(${angle + 90}deg)`,
      }}
    >
      <div className={`engine ${moving ? "active" : ""}`} />
      <div className="ship-body" />
    </div>
  );
}