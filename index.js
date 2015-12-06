function Texture(gl) {
    this.gl = gl;
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

Texture.prototype.bind = function(n, program, name) {
    var gl = this.gl;
    gl.activeTexture([gl.TEXTURE0, gl.TEXTURE1, gl.TEXTURE2][n]);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(gl.getUniformLocation(program, name), n);
}

Texture.prototype.fill = function(width, height, data) {
    var gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, width, height, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, data);
}

function setupCanvas(canvas, options) {
    var gl =
        canvas.getContext(
            "webgl",
            { preserveDrawingBuffer: Boolean(options.preserveDrawingBuffer) }
        );

    if (!gl)
        return gl;

    var program = gl.createProgram();
    var vertexShaderSource = [
        "attribute highp vec4 aVertexPosition;",
        "attribute vec2 aTextureCoord;",
        "varying highp vec2 vTextureCoord;",
        "void main(void) {",
        " gl_Position = aVertexPosition;",
        " vTextureCoord = aTextureCoord;",
        "}"
    ].join("\n");
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    var fragmentShaderSource = [
        "precision highp float;",
        "varying lowp vec2 vTextureCoord;",
        "uniform sampler2D YTexture;",
        "uniform sampler2D UTexture;",
        "uniform sampler2D VTexture;",
        "const mat4 YUV2RGB = mat4",
        "(",
        " 1.1643828125, 0, 1.59602734375, -.87078515625,",
        " 1.1643828125, -.39176171875, -.81296875, .52959375,",
        " 1.1643828125, 2.017234375, 0, -1.081390625,",
        " 0, 0, 0, 1",
        ");",
        "void main(void) {",
        " gl_FragColor = vec4( texture2D(YTexture, vTextureCoord).x, texture2D(UTexture, vTextureCoord).x, texture2D(VTexture, vTextureCoord).x, 1) * YUV2RGB;",
        "}"
    ].join("\n");

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log("Shader link failed.");
    }
    var vertexPositionAttribute = gl.getAttribLocation(program, "aVertexPosition");
    gl.enableVertexAttribArray(vertexPositionAttribute);
    var textureCoordAttribute = gl.getAttribLocation(program, "aTextureCoord");
    gl.enableVertexAttribArray(textureCoordAttribute);

    var verticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array([1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, -1.0, 0.0, -1.0, -1.0, 0.0]),
        gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    var texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0]),
        gl.STATIC_DRAW);
    gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

    gl.y = new Texture(gl);
    gl.u = new Texture(gl);
    gl.v = new Texture(gl);
    gl.y.bind(0, program, "YTexture");
    gl.u.bind(1, program, "UTexture");
    gl.v.bind(2, program, "VTexture");

    return gl;
}

function frameSetup(canvas, gl, width, height, pixelFormat) {
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
}

function renderFrame(gl, videoFrame) {
    gl.y.fill(videoFrame.width, videoFrame.height,
        videoFrame.subarray(0, videoFrame.uOffset));
    gl.u.fill(videoFrame.width >> 1, videoFrame.height >> 1,
        videoFrame.subarray(videoFrame.uOffset, videoFrame.vOffset));
    gl.v.fill(videoFrame.width >> 1, videoFrame.height >> 1,
        videoFrame.subarray(videoFrame.vOffset, videoFrame.length));
}

function fillBlack(gl) {
    var arr1 = new Uint8Array(1),
        arr2 = new Uint8Array(1);

    arr1[0] = 0;
    arr2[0] = 128;

    gl.y.fill(1, 1, arr1);
    gl.u.fill(1, 1, arr2);
    gl.v.fill(1, 1, arr2);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

module.exports = {
    init: function(canvas, source, options) {
        if (!canvas || !source) {
            return;
        }

        if (typeof canvas === 'string') {
            canvas = window.document.querySelector(canvas);
        }

        if (!options) {
            options = {
                preserveDrawingBuffer: false
            };
        }

        var glContext = setupCanvas(canvas, options);
        if (!glContext)
            return;

        var frameWidth = 0,
            frameheight =  0,
            framePixelFormat;

        canvas.addEventListener("webglcontextlost",
            function(event) {
                event.preventDefault();
                console.log("webgl context lost");
                glContext = null;
            });

        canvas.addEventListener("webglcontextrestored",
            function(event) {
                glContext = setupCanvas(canvas, options);
                if (glContext) {
                    if (frameWidth && frameHeight) {
                       frameSetup(canvas, glContext,
                                  frameWidth, frameHeight,
                                  framePixelFormat);
                    }
                    console.log("webgl context restored");
                } else {
                    console.log("fail restore webgl context");
                }
            });

        var drawLoop, newFrame;
        source.onFrameSetup =
            function(width, height, pixelFormat) {
                framwWidth = width;
                frameHeight = height;
                framePixelFormat = pixelFormat;

                if( !glContext )
                    return;

                frameSetup(canvas, glContext, width, height, pixelFormat);

                var draw = function() {
                    drawLoop =
                        window.requestAnimationFrame(function() {
                            if (glContext && newFrame)
                                glContext.drawArrays(glContext.TRIANGLE_STRIP, 0, 4);
                            newFrame = false;
                            draw();
                        });
                };
                draw();
            };

        source.onFrameReady =
            function(videoFrame) {
                if (glContext)
                    renderFrame(glContext, videoFrame);
                newFrame = true;
            };

        source.onFrameCleanup =
            function() {
                if (drawLoop) {
                    window.cancelAnimationFrame(drawLoop);
                    drawLoop = null;
                }
            };

        var renderContext = {
            canvas: canvas,
            clearCanvas: function() {
                fillBlack(glContext);
            }
        }

        return renderContext;
    },
};
