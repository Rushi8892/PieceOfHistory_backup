import { lazy, Suspense, useEffect, useRef, useState } from 'react';

type RenderMode = 'checking' | 'static' | 'webgl';

const IceCrystalCanvas = lazy(() => import('./ice-crystal-canvas'));
const posterUrl = `${import.meta.env.BASE_URL}assets/faceted-ice-cluster.svg`;

export function IceCrystalAccent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderMode, setRenderMode] = useState<RenderMode>('checking');
  const [isInView, setIsInView] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const checkDevice = () => {
      const device = navigator as Navigator & {
        deviceMemory?: number;
        connection?: { saveData?: boolean };
      };
      const lowEndDevice =
        (typeof device.deviceMemory === 'number' && device.deviceMemory <= 4) ||
        navigator.hardwareConcurrency <= 2 ||
        device.connection?.saveData === true;

      let supportsWebGL = false;
      try {
        const testCanvas = document.createElement('canvas');
        const context =
          testCanvas.getContext('webgl2') ?? testCanvas.getContext('webgl');
        supportsWebGL = context !== null;
        context?.getExtension('WEBGL_lose_context')?.loseContext();
      } catch {
        supportsWebGL = false;
      }

      setRenderMode(
        reducedMotion.matches ||
          lowEndDevice ||
          !supportsWebGL ||
          !('IntersectionObserver' in window)
          ? 'static'
          : 'webgl',
      );
    };

    checkDevice();
    reducedMotion.addEventListener('change', checkDevice);
    return () => reducedMotion.removeEventListener('change', checkDevice);
  }, []);

  useEffect(() => {
    if (renderMode !== 'webgl' || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry?.isIntersecting ?? false;
        setIsInView(visible);
        if (!visible) setCanvasReady(false);
      },
      { threshold: 0.01 },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [renderMode]);

  const shouldRenderCanvas = renderMode === 'webgl' && isInView;
  const showPoster = !shouldRenderCanvas || !canvasReady;

  return (
    <div
      ref={containerRef}
      className="archive-crystal-accent"
      aria-hidden="true"
      data-testid="archive-ice-crystal"
    >
      {showPoster ? (
        <img className="ice-crystal-poster" src={posterUrl} alt="" />
      ) : null}
      {shouldRenderCanvas ? (
        <Suspense fallback={null}>
          <IceCrystalCanvas onReady={() => setCanvasReady(true)} />
        </Suspense>
      ) : null}
    </div>
  );
}