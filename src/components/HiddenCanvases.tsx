import { MutableRefObject } from 'react';

interface HiddenCanvasesProps {
    canvasRefs: MutableRefObject<(HTMLCanvasElement | null)[]>;
    previewCanvasRefs: MutableRefObject<(HTMLCanvasElement | null)[]>;
}

export default function HiddenCanvases({ canvasRefs, previewCanvasRefs }: HiddenCanvasesProps) {
    return (
        <>
            {[0, 1, 2].map((index) => (
                <div key={index}>
                    <canvas
                        ref={(el) => { canvasRefs.current[index] = el; }}
                        style={{ display: 'none' }}
                    />
                    <canvas
                        ref={(el) => { previewCanvasRefs.current[index] = el; }}
                        style={{ display: 'none' }}
                    />
                </div>
            ))}
        </>
    );
}
