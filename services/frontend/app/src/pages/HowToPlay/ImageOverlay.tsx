import { useEffect } from "react";
import styles from "./ImageOverlay.module.scss";

interface IImageOverlay
{
  src: string;
  alt: string;
  onClose: () => void;
}

// Shows a manual image full size on a dark backdrop. Click anywhere or press Escape to close.
export default function ImageOverlay( { src, alt, onClose } : IImageOverlay )
{
  useEffect(() => {
    function onKeyDown( e: KeyboardEvent )
    {
      if ( e.key === "Escape" )
        onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label={alt} onClick={onClose}>
      <img className={styles.image} src={src} alt={alt} />
    </div>
  );
}
