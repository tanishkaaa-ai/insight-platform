import React, { useRef, useState, useEffect } from 'react';
import { Save, X, Eraser, RotateCcw, PenTool, Check } from 'lucide-react';

const CanvasAnnotation = ({ imageUrl, onSave, onCancel }) => {
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#FF0000'); // Default Red
    const [lineWidth, setLineWidth] = useState(3);
    const [tool, setTool] = useState('pen'); // pen, eraser
    const [loading, setLoading] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    // Initialize Canvas with Image
    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;

        img.onload = () => {
            // Set canvas size to match image (or max height/width logic if needed)
            // For simplicity, we match image dimensions scaling down if huge
            let width = img.width;
            let height = img.height;

            // Limit max display size but keep resolution high
            const MAX_WIDTH = window.innerWidth * 0.8;
            if (width > MAX_WIDTH) {
                const ratio = MAX_WIDTH / width;
                width = MAX_WIDTH;
                height = height * ratio;
            }

            canvas.width = width;
            canvas.height = height;

            // Draw image
            context.drawImage(img, 0, 0, width, height);

            // Setup drawing settings
            context.lineCap = 'round';
            context.strokeStyle = color;
            context.lineWidth = lineWidth;
            contextRef.current = context;
            setImageLoaded(true);
        };
    }, [imageUrl]);

    // Update drawing style when state changes
    useEffect(() => {
        if (contextRef.current) {
            contextRef.current.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
            contextRef.current.lineWidth = tool === 'eraser' ? 20 : lineWidth;
            contextRef.current.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';

            // Note: destination-out makes transparent. If we want white eraser on jpeg, use source-over with white color
            if (tool === 'eraser') {
                contextRef.current.globalCompositeOperation = 'source-over'; // Paint white
                contextRef.current.strokeStyle = '#FFFFFF';
            }
        }
    }, [color, lineWidth, tool]);

    const startDrawing = ({ nativeEvent }) => {
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const finishDrawing = () => {
        contextRef.current.closePath();
        setIsDrawing(false);
    };

    const draw = ({ nativeEvent }) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const canvas = canvasRef.current;
            canvas.toBlob(async (blob) => {
                // Create a standard File object to upload
                const file = new File([blob], "annotated_submission.jpg", { type: "image/jpeg" });
                await onSave(file);
                setLoading(false);
            }, 'image/jpeg', 0.8);
        } catch (error) {
            console.error("Save failed", error);
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 rounded-xl overflow-hidden">
            {/* Toolbar */}
            <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
                        <button
                            onClick={() => setTool('pen')}
                            className={`p-2 rounded-md transition-colors ${tool === 'pen' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}
                            title="Pen Tool"
                        >
                            <PenTool size={20} />
                        </button>
                        <button
                            onClick={() => setTool('eraser')}
                            className={`p-2 rounded-md transition-colors ${tool === 'eraser' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}
                            title="Eraser (Whiteout)"
                        >
                            <Eraser size={20} />
                        </button>
                    </div>

                    <div className="h-8 w-px bg-gray-300 mx-2"></div>

                    {/* Colors */}
                    <div className="flex gap-2">
                        {['#FF0000', '#00FF00', '#0000FF', '#000000'].map(c => (
                            <button
                                key={c}
                                onClick={() => { setColor(c); setTool('pen'); }}
                                className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c && tool === 'pen' ? 'scale-110 border-gray-400 shadow-md' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || !imageLoaded}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? <span className="animate-spin">⌛</span> : <Save size={18} />}
                        Save annotations
                    </button>
                </div>
            </div>

            {/* Canvas Container */}
            <div className="flex-1 overflow-auto bg-gray-500 flex justify-center p-4">
                <div className="bg-white shadow-2xl">
                    {!imageLoaded && <div className="p-20 text-white">Loading Image...</div>}
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseUp={finishDrawing}
                        onMouseMove={draw}
                        onMouseLeave={finishDrawing}
                        className="cursor-crosshair block"
                        style={{ display: imageLoaded ? 'block' : 'none' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default CanvasAnnotation;
