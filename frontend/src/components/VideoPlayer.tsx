import { useRef, useEffect } from 'react';

interface Props {
  src: string;
  poster?: string;
}

export default function VideoPlayer({ src, poster }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      // Clean up object URL when component unmounts
      if (src.startsWith('blob:')) {
        URL.revokeObjectURL(src);
      }
    };
  }, [src]);

  return (
    <div className="rounded-xl overflow-hidden bg-black border border-gray-800">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls
        className="w-full"
        style={{ maxHeight: '70vh' }}
        playsInline
      >
        Your browser does not support the video element.
      </video>
    </div>
  );
}
