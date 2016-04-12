window.onload = function(){
  var c = document.getElementById('canvas');

  c.width = 512;
  c.height = 512;

  var gl = c.getContext('webgl');

  if (!gl)
  {
    alert('not found');
    return;
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  gl.clearDepth(1.0);

  var vertexSource = document.getElementById('vs').textContent;
  var fragmentSource = document.getElementById('fs').textContent;

  var programs = shaderProgram(vertexSource, fragmentSource);

  var uniLocation = {};
  uniLocation.mvpMatrix = gl.getUniformLocation(programs, 'mvpMatrix');
  uniLocation.texture = gl.getUniformLocation(programs, 'texture');

  var sphereData = sphere(16, 16, 1.0);

  var vPositionBuffer = createVBO(sphereData.p);
  var vTexturebuffer = createVBO(sphereData.t);
  var vboList = [vPositionBuffer, vTexturebuffer];

  var attLocation = [];
  attLocation[0] = gl.getAttribLocation(programs, 'position');
  attLocation[1] = gl.getAttribLocation(programs, 'texCoord');

  var attStride = [];
  attStride[0] = 3;
  attStride[1] = 2;

  var ibo = createIBO(sphereData.i);

  setAttribute(vboList, attLocation, attStride, ibo);

  var mat = new matIV();
  var mMatrix = mat.identity(mat.create());
  var vMatrix = mat.identity(mat.create());
  var pMatrix = mat.identity(mat.create());
  var vpMatrix = mat.identity(mat.create());
  var mvpMatrix = mat.identity(mat.create());
  var invMatrix = mat.identity(mat.create());

  var move = [0.5, 0.5, 0.0];
  mat.translate(mMatrix, move, mMatrix);

  var cameraPosition = [0.0, 0.0, 3.0];
  var centerPoint = [0.0, 0.0, 0.0];
  var cameraUp = [0.0, 1.0, 0.0];
  mat.lookAt(cameraPosition, centerPoint, cameraUp, vMatrix);

  var fovy = 45;
  var aspect = canvas.width / canvas.height;
  var near = 0.1;
  var far = 10.0;
  mat.perspective(fovy, aspect, near, far, pMatrix);

  mat.multiply(pMatrix, vMatrix, vpMatrix);

  var count = 0;

  var lightDirection = [1.0, 1.0, 1.0];

  var ambientColor = [0.5, 0.0, 0.0, 1.0];

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  var texture = null;
  createTexture('./lupan.jpg');

  loadCheck();
    function loadCheck()
    {
        if(texture != null)
        {
            gl.bindTexture(gl.TEXTURE_2D, texture);

            render();

            return;
        }
        setTimeout(loadCheck, 100);
    }

  function render()
  {
    count++;

    var radians = (count % 360) * Math.PI / 180;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat.identity(mMatrix);

    var axis = [0.0, 0.0, 1.0];
    mat.rotate(mMatrix, radians, axis, mMatrix);

    mat.multiply(vpMatrix, mMatrix, mvpMatrix);

    mat.inverse(mMatrix, invMatrix);

    gl.uniformMatrix4fv(uniLocation.mvpMatrix, false, mvpMatrix);
    gl.uniform1i(uniLocation.texture, 0);
    
    gl.drawElements(gl.TRIANGLES, sphereData.i.length, gl.UNSIGNED_SHORT, 0);

    gl.flush();

    requestAnimationFrame(render);
  }

  function shaderProgram(vertexSource, fragmentSource)
  {
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexSource);
    gl.compileShader(vertexShader);
    gl.shaderSource(fragmentShader, fragmentSource);
    gl.compileShader(fragmentShader);

    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
    {
      alert(gl.getShaderInfoLog(vertexShader));
      return null;
    }
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
    {
      alert(gl.getShaderInfoLog(fragmentShader));
			return null;
    }

    var programs = gl.createProgram();
    gl.attachShader(programs, vertexShader);
    gl.attachShader(programs, fragmentShader);
    gl.linkProgram(programs);

    if(!gl.getProgramParameter(programs, gl.LINK_STATUS))
    {
      alert(gl.getProgramInfoLog(programs));
      return null;
    }
    gl.useProgram(programs);

    return programs;
  }
  
  function createVBO(data)
  {
    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return vbo;
  }

  function createIBO(data)
  {
    var ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return ibo;
  }

  function setAttribute(vbos, attLocation, attStride, ibo)
  {
    for(var i in vbos)
    {
      gl.bindBuffer(gl.ARRAY_BUFFER, vbos[i]);
      gl.enableVertexAttribArray(attLocation[i]);
      gl.vertexAttribPointer(attLocation[i], attStride[i], gl.FLOAT, false, 0, 0);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  }
  
  function createTexture(source)
  {
      var img = new Image();
      img.onload = function() {
          texture = gl.createTexture();

          gl.bindTexture(gl.TEXTURE_2D, texture);

          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

          gl.generateMipmap(gl.TEXTURE_2D);

          gl.bindTexture(gl.TEXTURE_2D, null);
      };
      img.src = source;
  }
  

};
