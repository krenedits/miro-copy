import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

interface Point {
    x: number;
    y: number;
}
const initSet: Point[] = [];
const WIDTH = 800;
const HEIGHT = 600;

export default function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [newPoints, setNewPoints] = useState(new Set(initSet));
    const [undoEvent, setUndoEvent] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const toggleUndoEvent = () => {
        setUndoEvent((prev) => !prev);
    };

    const clear = (point: Point) => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!(canvas && context)) return;

        const { x, y } = point;

        if (context) {
            context.clearRect(x, y, 5, 5);
        }
    };

    const handleUndo = () => {
        newPoints.forEach(clear);
        socket.emit('clear', [...newPoints]);
        setNewPoints(new Set(initSet));
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = WIDTH;
            canvas.height = HEIGHT;
            canvas.style.width = `${WIDTH}px`;
            canvas.style.height = `${HEIGHT}px`;
            canvas.style.border = '1px solid black';
            canvas.style.margin = '0 auto';

            const context = canvas.getContext('2d');
            if (context) {
                context.lineCap = 'round';
                context.strokeStyle = 'black';
                context.lineWidth = 5;
                contextRef.current = context;
            }
        }

        socket.on('draw', (points: Point[]) => {
            const canvas = canvasRef.current;
            if (canvas) {
                const context = canvas.getContext('2d');
                if (context) {
                    points.forEach(draw);
                }
            }
        });

        socket.on('clear', (points: Point[]) => points.forEach(clear));

        return () => {
            socket.off('draw');
            socket.disconnect();
        };
    }, []);

    // on ctrl+z press undo
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 'z') {
                toggleUndoEvent();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        handleUndo();
    }, [undoEvent]);

    const handleMouseDown = () => {
        setNewPoints(new Set(initSet));
        setIsDrawing(true);
    };

    const draw = (point: Point) => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!(canvas && context)) return;

        const { x, y } = point;

        if (context) {
            context.fillRect(x, y, 5, 5);
        }
    };

    const handleMouseMove = (
        event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
    ) => {
        const canvas = canvasRef.current;
        if (canvas) {
            const context = canvas.getContext('2d');
            if (context) {
                const point = {
                    x: event.clientX - canvas.offsetLeft,
                    y: event.clientY - canvas.offsetTop,
                };
                setMousePosition(point);
                if (isDrawing) {
                    draw(point);
                    setNewPoints((prev) => new Set([...prev, point]));
                }
            }
        }
    };

    const handleMouseUp = () => {
        socket.emit('draw', [...newPoints]);
        setIsDrawing(false);
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
        >
            <button onClick={handleUndo}>Undo</button>
            <button onClick={() => setIsDeleting((prev) => !prev)}>
                {isDeleting ? 'Rajzolás' : 'Törlés'} mód
            </button>
            <canvas
                id='canvas'
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                // style={{
                //     cursor: 'none',
                // }}
            />
            {/* <div
                style={{
                    transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
                    position: 'fixed',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    border: '1px solid black',
                    zIndex: 1000,
                }}
            /> */}
        </div>
    );
}
