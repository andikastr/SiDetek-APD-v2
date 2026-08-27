import json
import base64
import asyncio
import cv2
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.onnx_engine import onnx_engine
from app.core.config import settings

router = APIRouter()

@router.websocket("/ws/stream")
async def websocket_stream_detect(websocket: WebSocket):
    """
    WebSocket endpoint for real-time local device webcam detection.
    Receives canvas frames from browser and returns BBoxes + K3 compliance evaluation.
    """
    await websocket.accept()
    engine = onnx_engine()
    
    try:
        while True:
            message = await websocket.receive()
            frame_bytes = None
            conf_threshold = settings.DEFAULT_CONF_THRESHOLD

            if "bytes" in message and message["bytes"]:
                frame_bytes = message["bytes"]
            elif "text" in message and message["text"]:
                try:
                    payload = json.loads(message["text"])
                    image_b64 = payload.get("image", "")
                    conf_threshold = float(payload.get("confidence", settings.DEFAULT_CONF_THRESHOLD))
                    
                    if "," in image_b64:
                        image_b64 = image_b64.split(",")[1]
                    frame_bytes = base64.b64decode(image_b64)
                except Exception as parse_err:
                    await websocket.send_json({
                        "status": "error",
                        "message": f"Invalid Base64 format: {str(parse_err)}"
                    })
                    continue

            if frame_bytes:
                try:
                    response = engine.predict_frame_bytes(
                        frame_bytes=frame_bytes,
                        conf_threshold=conf_threshold
                    )
                    await websocket.send_json(response.model_dump())
                except Exception as infer_err:
                    await websocket.send_json({
                        "status": "error",
                        "message": f"Inference error: {str(infer_err)}"
                    })
    except WebSocketDisconnect:
        print("[WebSocket] Client disconnected gracefully.")
    except Exception as e:
        print(f"[WebSocket] Error during streaming session: {e}")


@router.websocket("/ws/rtsp")
async def websocket_rtsp_stream(websocket: WebSocket):
    """
    WebSocket endpoint for RTSP IP Camera and network video streaming.
    Receives start/stop commands, fetches frames via OpenCV in executor,
    runs YOLOv11 detection, and pipes base64 frames + compliance metadata.
    """
    await websocket.accept()
    engine = onnx_engine()
    cap = None
    
    control_queue: asyncio.Queue = asyncio.Queue()

    async def receive_loop():
        try:
            while True:
                msg = await websocket.receive_text()
                await control_queue.put(json.loads(msg))
        except (WebSocketDisconnect, asyncio.CancelledError):
            pass
        except Exception:
            pass

    rx_task = asyncio.create_task(receive_loop())

    try:
        conf_threshold = settings.DEFAULT_CONF_THRESHOLD
        target_fps = 10.0
        sleep_delay = 0.1
        running = False
        
        while not rx_task.done():
            # Process control commands
            while not control_queue.empty():
                cmd = control_queue.get_nowait()
                action = cmd.get("action")
                
                if action == "start":
                    rtsp_url = cmd.get("rtsp_url", "")
                    conf_threshold = float(cmd.get("confidence", settings.DEFAULT_CONF_THRESHOLD))
                    target_fps = float(cmd.get("fps", 10.0))
                    sleep_delay = max(0.02, 1.0 / max(1.0, target_fps))
                    
                    if cap:
                        cap.release()
                        cap = None
                    
                    # Connect to RTSP / video file
                    loop = asyncio.get_event_loop()
                    cap = await loop.run_in_executor(None, lambda: cv2.VideoCapture(rtsp_url))
                    
                    if not cap.isOpened():
                        await websocket.send_json({
                            "status": "error",
                            "message": f"Failed to connect to RTSP stream: {rtsp_url}. Verify network host and RTSP credentials."
                        })
                        cap = None
                        running = False
                    else:
                        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                        running = True
                        await websocket.send_json({
                            "status": "connected",
                            "message": f"Connected to camera stream: {rtsp_url}"
                        })
                elif action == "stop":
                    running = False
                    if cap:
                        cap.release()
                        cap = None
                    await websocket.send_json({"status": "stopped", "message": "RTSP stream stopped."})
                elif action == "set_confidence":
                    conf_threshold = float(cmd.get("confidence", conf_threshold))
                elif action == "set_fps":
                    target_fps = float(cmd.get("fps", target_fps))
                    sleep_delay = max(0.02, 1.0 / max(1.0, target_fps))

            if running and cap and cap.isOpened():
                loop = asyncio.get_event_loop()
                ret, frame = await loop.run_in_executor(None, cap.read)
                
                if ret and frame is not None:
                    resp = engine.predict_cv2_frame(
                        frame_bgr=frame,
                        conf_threshold=conf_threshold,
                        include_annotated=True
                    )
                    await websocket.send_json(resp.model_dump())
                    # Dynamic FPS throttle based on user setting
                    await asyncio.sleep(sleep_delay)
                else:
                    # Video loop / EOF reset if applicable
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    await asyncio.sleep(0.05)
            else:
                await asyncio.sleep(0.05)
    except WebSocketDisconnect:
        print("[RTSP WebSocket] Client disconnected gracefully.")
    except Exception as e:
        print(f"[RTSP WebSocket] Stream error: {e}")
    finally:
        rx_task.cancel()
        if cap:
            cap.release()
