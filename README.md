## Install

``
npm install webgl-video-renderer
``

## Usage example

https://github.com/RSATom/wcjs-ugly-demo

## JavaScript API

* `init(canvas, source, options) -> renderContext`: initiate the renderer. `canvas` - DOM node or selector (mandatory).
* `renderContext.clearCanvas()`: draws a single black frame on the canvas, should be used after stopping the player and/or when the media file has changes (otherwise the frame from the previous video will be kept on the canvas)

### VideoSource

_Pixel formats:_
* `I420`:

_Callbacks:_
* `onFrameSetup( width, height, pixelFormat, videoFrame )`:
* `onFrameReady( videoFrame )`:
* `onFrameCleanup`:

### I420VideoFrame

_Read only properties:_
* `width`:
* `height`:
* `pixelFormat`: = I420
* `uOffset`:
* `vOffset`:
