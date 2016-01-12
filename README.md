## Install

``
npm install webgl-video-renderer
``

## Usage example

https://github.com/RSATom/wcjs-ugly-demo

## JavaScript API

* `init(canvas, options) -> renderContext`: initiate the renderer. `canvas` - DOM node or selector (mandatory).
* `renderContext.render(frame, width, height, uOffset, vOffset)`: draws video frame with `I420` pixel format on canvas
* `renderContext.fillBlack()`: draws a single black frame on the canvas, should be used after stopping the player and/or when the media file has changes (otherwise the frame from the previous video will be kept on the canvas)
