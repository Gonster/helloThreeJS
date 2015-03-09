/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.SpriteCanvasMaterial = function ( parameters ) {

	THREE.Material.call( this );

	this.type = 'SpriteCanvasMaterial';

	this.color = new THREE.Color( 0xffffff );
	this.program = function ( context, color ) {};

	this.setValues( parameters );

};

THREE.SpriteCanvasMaterial.prototype = Object.create( THREE.Material.prototype );
THREE.SpriteCanvasMaterial.prototype.constructor = THREE.SpriteCanvasMaterial;

THREE.SpriteCanvasMaterial.prototype.clone = function () {

	var material = new THREE.SpriteCanvasMaterial();

	THREE.Material.prototype.clone.call( this, material );

	material.color.copy( this.color );
	material.program = this.program;

	return material;

};

//

THREE.CanvasRenderer = function ( parameters ) {

	console.log( 'THREE.CanvasRenderer', THREE.REVISION );

	var smoothstep = THREE.Math.smoothstep;

	parameters = parameters || {};

	var _this = this,
	_renderData, _elements, _lights,
	_projector = new THREE.Projector(),

	_canvas = parameters.canvas !== undefined
			 ? parameters.canvas
			 : document.createElement( 'canvas' ),

	_canvasWidth = _canvas.width,
	_canvasHeight = _canvas.height,
	_canvasWidthHalf = Math.floor( _canvasWidth / 2 ),
	_canvasHeightHalf = Math.floor( _canvasHeight / 2 ),

	_viewportX = 0,
	_viewportY = 0,
	_viewportWidth = _canvasWidth,
	_viewportHeight = _canvasHeight,

	pixelRatio = 1,

	_context = _canvas.getContext( '2d', {
		alpha: parameters.alpha === true
	} ),

	_clearColor = new THREE.Color( 0x000000 ),
	_clearAlpha = parameters.alpha === true ? 0 : 1,

	_contextGlobalAlpha = 1,
	_contextGlobalCompositeOperation = 0,
	_contextStrokeStyle = null,
	_contextFillStyle = null,
	_contextLineWidth = null,
	_contextLineCap = null,
	_contextLineJoin = null,
	_contextLineDash = [],

	_camera,

	_v1, _v2, _v3, _v4,
	_v5 = new THREE.RenderableVertex(),
	_v6 = new THREE.RenderableVertex(),

	_v1x, _v1y, _v2x, _v2y, _v3x, _v3y,
	_v4x, _v4y, _v5x, _v5y, _v6x, _v6y,

	_color = new THREE.Color(),
	_color1 = new THREE.Color(),
	_color2 = new THREE.Color(),
	_color3 = new THREE.Color(),
	_color4 = new THREE.Color(),

	_diffuseColor = new THREE.Color(),
	_emissiveColor = new THREE.Color(),

	_lightColor = new THREE.Color(),

	_patterns = {},

	_image, _uvs,
	_uv1x, _uv1y, _uv2x, _uv2y, _uv3x, _uv3y,

	_clipBox = new THREE.Box2(),
	_clearBox = new THREE.Box2(),
	_elemBox = new THREE.Box2(),

	_ambientLight = new THREE.Color(),
	_directionalLights = new THREE.Color(),
	_pointLights = new THREE.Color(),

	_vector3 = new THREE.Vector3(), // Needed for PointLight
	_centroid = new THREE.Vector3(),
	_normal = new THREE.Vector3(),
	_normalViewMatrix = new THREE.Matrix3();

	// dash+gap fallbacks for Firefox and everything else

	if ( _context.setLineDash === undefined ) {

		_context.setLineDash = function () {}

	}

	this.domElement = _canvas;

	this.autoClear = true;
	this.sortObjects = true;
	this.sortElements = true;

	this.info = {

		render: {

			vertices: 0,
			faces: 0

		}

	}

	// WebGLRenderer compatibility

	this.supportsVertexTextures = function () {};
	this.setFaceCulling = function () {};

	//

	this.getPixelRatio = function () {

		return pixelRatio;

	};

	this.setPixelRatio = function ( value ) {

		pixelRatio = value;

	};

	this.setSize = function ( width, height, updateStyle ) {

		_canvasWidth = width * pixelRatio;
		_canvasHeight = height * pixelRatio;

		_canvas.width = _canvasWidth;
		_canvas.height = _canvasHeight;

		_canvasWidthHalf = Math.floor( _canvasWidth / 2 );
		_canvasHeightHalf = Math.floor( _canvasHeight / 2 );

		if ( updateStyle !== false ) {

			_canvas.style.width = width + 'px';
			_canvas.style.height = height + 'px';

		}

		_clipBox.min.set( -_canvasWidthHalf, -_canvasHeightHalf ),
		_clipBox.max.set(   _canvasWidthHalf,   _canvasHeightHalf );

		_clearBox.min.set( - _canvasWidthHalf, - _canvasHeightHalf );
		_clearBox.max.set(   _canvasWidthHalf,   _canvasHeightHalf );

		_contextGlobalAlpha = 1;
		_contextGlobalCompositeOperation = 0;
		_contextStrokeStyle = null;
		_contextFillStyle = null;
		_contextLineWidth = null;
		_contextLineCap = null;
		_contextLineJoin = null;

		this.setViewport( 0, 0, width, height );

	};

	this.setViewport = function ( x, y, width, height ) {

		_viewportX = x * pixelRatio;
		_viewportY = y * pixelRatio;

		_viewportWidth = width * pixelRatio;
		_viewportHeight = height * pixelRatio;

	};

	this.setScissor = function () {};
	this.enableScissorTest = function () {};

	this.setClearColor = function ( color, alpha ) {

		_clearColor.set( color );
		_clearAlpha = alpha !== undefined ? alpha : 1;

		_clearBox.min.set( - _canvasWidthHalf, - _canvasHeightHalf );
		_clearBox.max.set(   _canvasWidthHalf,   _canvasHeightHalf );

	};

	this.setClearColorHex = function ( hex, alpha ) {

		console.warn( 'THREE.CanvasRenderer: .setClearColorHex() is being removed. Use .setClearColor() instead.' );
		this.setClearColor( hex, alpha );

	};

	this.getClearColor = function () {

		return _clearColor;

	};

	this.getClearAlpha = function () {

		return _clearAlpha;

	};

	this.getMaxAnisotropy = function () {

		return 0;

	};

	this.clear = function () {

		if ( _clearBox.empty() === false ) {

			_clearBox.intersect( _clipBox );
			_clearBox.expandByScalar( 2 );

			_clearBox.min.x = _clearBox.min.x + _canvasWidthHalf;
			_clearBox.min.y =  - _clearBox.min.y + _canvasHeightHalf;		// higher y value !
			_clearBox.max.x = _clearBox.max.x + _canvasWidthHalf;
			_clearBox.max.y =  - _clearBox.max.y + _canvasHeightHalf;		// lower y value !

			if ( _clearAlpha < 1 ) {

				_context.clearRect(
					_clearBox.min.x | 0,
					_clearBox.max.y | 0,
					( _clearBox.max.x - _clearBox.min.x ) | 0,
					( _clearBox.min.y - _clearBox.max.y ) | 0
				);

			}

			if ( _clearAlpha > 0 ) {

				setBlending( THREE.NormalBlending );
				setOpacity( 1 );

				setFillStyle( 'rgba(' + Math.floor( _clearColor.r * 255 ) + ',' + Math.floor( _clearColor.g * 255 ) + ',' + Math.floor( _clearColor.b * 255 ) + ',' + _clearAlpha + ')' );

				_context.fillRect(
					_clearBox.min.x | 0,
					_clearBox.max.y | 0,
					( _clearBox.max.x - _clearBox.min.x ) | 0,
					( _clearBox.min.y - _clearBox.max.y ) | 0
				);

			}

			_clearBox.makeEmpty();

		}

	};

	// compatibility

	this.clearColor = function () {};
	this.clearDepth = function () {};
	this.clearStencil = function () {};

	this.render = function ( scene, camera ) {

		if ( camera instanceof THREE.Camera === false ) {

			console.error( 'THREE.CanvasRenderer.render: camera is not an instance of THREE.Camera.' );
			return;

		}

		if ( this.autoClear === true ) this.clear();

		_this.info.render.vertices = 0;
		_this.info.render.faces = 0;

		_context.setTransform( _viewportWidth / _canvasWidth, 0, 0, - _viewportHeight / _canvasHeight, _viewportX, _canvasHeight - _viewportY );
		_context.translate( _canvasWidthHalf, _canvasHeightHalf );

		_renderData = _projector.projectScene( scene, camera, this.sortObjects, this.sortElements );
		_elements = _renderData.elements;
		_lights = _renderData.lights;
		_camera = camera;

		_normalViewMatrix.getNormalMatrix( camera.matrixWorldInverse );

		/* DEBUG
		setFillStyle( 'rgba( 0, 255, 255, 0.5 )' );
		_context.fillRect( _clipBox.min.x, _clipBox.min.y, _clipBox.max.x - _clipBox.min.x, _clipBox.max.y - _clipBox.min.y );
		*/

		calculateLights();

		for ( var e = 0, el = _elements.length; e < el; e ++ ) {

			var element = _elements[ e ];

			var material = element.material;

			if ( material === undefined || material.opacity === 0 ) continue;

			_elemBox.makeEmpty();

			if ( element instanceof THREE.RenderableSprite ) {

				_v1 = element;
				_v1.x *= _canvasWidthHalf; _v1.y *= _canvasHeightHalf;

				renderSprite( _v1, element, material );

			} else if ( element instanceof THREE.RenderableLine ) {

				_v1 = element.v1; _v2 = element.v2;

				_v1.positionScreen.x *= _canvasWidthHalf; _v1.positionScreen.y *= _canvasHeightHalf;
				_v2.positionScreen.x *= _canvasWidthHalf; _v2.positionScreen.y *= _canvasHeightHalf;

				_elemBox.setFromPoints( [
					_v1.positionScreen,
					_v2.positionScreen
				] );

				if ( _clipBox.isIntersectionBox( _elemBox ) === true ) {

					renderLine( _v1, _v2, element, material );

				}

			} else if ( element instanceof THREE.RenderableFace ) {

				_v1 = element.v1; _v2 = element.v2; _v3 = element.v3;

				if ( _v1.positionScreen.z < - 1 || _v1.positionScreen.z > 1 ) continue;
				if ( _v2.positionScreen.z < - 1 || _v2.positionScreen.z > 1 ) continue;
				if ( _v3.positionScreen.z < - 1 || _v3.positionScreen.z > 1 ) continue;

				_v1.positionScreen.x *= _canvasWidthHalf; _v1.positionScreen.y *= _canvasHeightHalf;
				_v2.positionScreen.x *= _canvasWidthHalf; _v2.positionScreen.y *= _canvasHeightHalf;
				_v3.positionScreen.x *= _canvasWidthHalf; _v3.positionScreen.y *= _canvasHeightHalf;

				if ( material.overdraw > 0 ) {

					expand( _v1.positionScreen, _v2.positionScreen, material.overdraw );
					expand( _v2.positionScreen, _v3.positionScreen, material.overdraw );
					expand( _v3.positionScreen, _v1.positionScreen, material.overdraw );

				}

				_elemBox.setFromPoints( [
					_v1.positionScreen,
					_v2.positionScreen,
					_v3.positionScreen
				] );

				if ( _clipBox.isIntersectionBox( _elemBox ) === true ) {

					renderFace3( _v1, _v2, _v3, 0, 1, 2, element, material );

				}

			}

			/* DEBUG
			setLineWidth( 1 );
			setStrokeStyle( 'rgba( 0, 255, 0, 0.5 )' );
			_context.strokeRect( _elemBox.min.x, _elemBox.min.y, _elemBox.max.x - _elemBox.min.x, _elemBox.max.y - _elemBox.min.y );
			*/

			_clearBox.union( _elemBox );

		}

		/* DEBUG
		setLineWidth( 1 );
		setStrokeStyle( 'rgba( 255, 0, 0, 0.5 )' );
		_context.strokeRect( _clearBox.min.x, _clearBox.min.y, _clearBox.max.x - _clearBox.min.x, _clearBox.max.y - _clearBox.min.y );
		*/

		_context.setTransform( 1, 0, 0, 1, 0, 0 );

	};

	//

	function calculateLights() {

		_ambientLight.setRGB( 0, 0, 0 );
		_directionalLights.setRGB( 0, 0, 0 );
		_pointLights.setRGB( 0, 0, 0 );

		for ( var l = 0, ll = _lights.length; l < ll; l ++ ) {

			var light = _lights[ l ];
			var lightColor = light.color;

			if ( light instanceof THREE.AmbientLight ) {

				_ambientLight.add( lightColor );

			} else if ( light instanceof THREE.DirectionalLight ) {

				// for sprites

				_directionalLights.add( lightColor );

			} else if ( light instanceof THREE.PointLight ) {

				// for sprites

				_pointLights.add( lightColor );

			}

		}

	}

	function calculateLight( position, normal, color ) {

		for ( var l = 0, ll = _lights.length; l < ll; l ++ ) {

			var light = _lights[ l ];

			_lightColor.copy( light.color );

			if ( light instanceof THREE.DirectionalLight ) {

				var lightPosition = _vector3.setFromMatrixPosition( light.matrixWorld ).normalize();

				var amount = normal.dot( lightPosition );

				if ( amount <= 0 ) continue;

				amount *= light.intensity;

				color.add( _lightColor.multiplyScalar( amount ) );

			} else if ( light instanceof THREE.PointLight ) {

				var lightPosition = _vector3.setFromMatrixPosition( light.matrixWorld );

				var amount = normal.dot( _vector3.subVectors( lightPosition, position ).normalize() );

				if ( amount <= 0 ) continue;

				amount *= light.distance == 0 ? 1 : 1 - Math.min( position.distanceTo( lightPosition ) / light.distance, 1 );

				if ( amount == 0 ) continue;

				amount *= light.intensity;

				color.add( _lightColor.multiplyScalar( amount ) );

			}

		}

	}

	function renderSprite( v1, element, material ) {

		setOpacity( material.opacity );
		setBlending( material.blending );

		var scaleX = element.scale.x * _canvasWidthHalf;
		var scaleY = element.scale.y * _canvasHeightHalf;

		var dist = 0.5 * Math.sqrt( scaleX * scaleX + scaleY * scaleY ); // allow for rotated sprite
		_elemBox.min.set( v1.x - dist, v1.y - dist );
		_elemBox.max.set( v1.x + dist, v1.y + dist );

		if ( material instanceof THREE.SpriteMaterial ) {

			var texture = material.map;

			if ( texture !== null && texture.image !== undefined ) {

				if ( texture.hasEventListener( 'update', onTextureUpdate ) === false ) {

					if ( texture.image.width > 0 ) {

						textureToPattern( texture );

					}

					texture.addEventListener( 'update', onTextureUpdate );

				}

				var pattern = _patterns[ texture.id ];

				if ( pattern !== undefined ) {

					setFillStyle( pattern );

				} else {

					setFillStyle( 'rgba( 0, 0, 0, 1 )' );

				}

				//

				var bitmap = texture.image;

				var ox = bitmap.width * texture.offset.x;
				var oy = bitmap.height * texture.offset.y;

				var sx = bitmap.width * texture.repeat.x;
				var sy = bitmap.height * texture.repeat.y;

				var cx = scaleX / sx;
				var cy = scaleY / sy;

				_context.save();
				_context.translate( v1.x, v1.y );
				if ( material.rotation !== 0 ) _context.rotate( material.rotation );
				_context.translate( - scaleX / 2, - scaleY / 2 );
				_context.scale( cx, cy );
				_context.translate( - ox, - oy );
				_context.fillRect( ox, oy, sx, sy );
				_context.restore();

			} else {

				// no texture

				setFillStyle( material.color.getStyle() );

				_context.save();
				_context.translate( v1.x, v1.y );
				if ( material.rotation !== 0 ) _context.rotate( material.rotation );
				_context.scale( scaleX, - scaleY );
				_context.fillRect( - 0.5, - 0.5, 1, 1 );
				_context.restore();

			}

		} else if ( material instanceof THREE.SpriteCanvasMaterial ) {

			setStrokeStyle( material.color.getStyle() );
			setFillStyle( material.color.getStyle() );

			_context.save();
			_context.translate( v1.x, v1.y );
			if ( material.rotation !== 0 ) _context.rotate( material.rotation );
			_context.scale( scaleX, scaleY );

			material.program( _context );

			_context.restore();

		}

		/* DEBUG
		setStrokeStyle( 'rgb(255,255,0)' );
		_context.beginPath();
		_context.moveTo( v1.x - 10, v1.y );
		_context.lineTo( v1.x + 10, v1.y );
		_context.moveTo( v1.x, v1.y - 10 );
		_context.lineTo( v1.x, v1.y + 10 );
		_context.stroke();
		*/

	}

	function renderLine( v1, v2, element, material ) {

		setOpacity( material.opacity );
		setBlending( material.blending );

		_context.beginPath();
		_context.moveTo( v1.positionScreen.x, v1.positionScreen.y );
		_context.lineTo( v2.positionScreen.x, v2.positionScreen.y );

		if ( material instanceof THREE.LineBasicMaterial ) {

			setLineWidth( material.linewidth );
			setLineCap( material.linecap );
			setLineJoin( material.linejoin );

			if ( material.vertexColors !== THREE.VertexColors ) {

				setStrokeStyle( material.color.getStyle() );

			} else {

				var colorStyle1 = element.vertexColors[ 0 ].getStyle();
				var colorStyle2 = element.vertexColors[ 1 ].getStyle();

				if ( colorStyle1 === colorStyle2 ) {

					setStrokeStyle( colorStyle1 );

				} else {

					try {

						var grad = _context.createLinearGradient(
							v1.positionScreen.x,
							v1.positionScreen.y,
							v2.positionScreen.x,
							v2.positionScreen.y
						);
						grad.addColorStop( 0, colorStyle1 );
						grad.addColorStop( 1, colorStyle2 );

					} catch ( exception ) {

						grad = colorStyle1;

					}

					setStrokeStyle( grad );

				}

			}

			_context.stroke();
			_elemBox.expandByScalar( material.linewidth * 2 );

		} else if ( material instanceof THREE.LineDashedMaterial ) {

			setLineWidth( material.linewidth );
			setLineCap( material.linecap );
			setLineJoin( material.linejoin );
			setStrokeStyle( material.color.getStyle() );
			setLineDash( [ material.dashSize, material.gapSize ] );

			_context.stroke();

			_elemBox.expandByScalar( material.linewidth * 2 );

			setLineDash( [] );

		}

	}

	function renderFace3( v1, v2, v3, uv1, uv2, uv3, element, material ) {

		_this.info.render.vertices += 3;
		_this.info.render.faces ++;

		setOpacity( material.opacity );
		setBlending( material.blending );

		_v1x = v1.positionScreen.x; _v1y = v1.positionScreen.y;
		_v2x = v2.positionScreen.x; _v2y = v2.positionScreen.y;
		_v3x = v3.positionScreen.x; _v3y = v3.positionScreen.y;

		drawTriangle( _v1x, _v1y, _v2x, _v2y, _v3x, _v3y );

		if ( ( material instanceof THREE.MeshLambertMaterial || material instanceof THREE.MeshPhongMaterial ) && material.map === null ) {

			_diffuseColor.copy( material.color );
			_emissiveColor.copy( material.emissive );

			if ( material.vertexColors === THREE.FaceColors ) {

				_diffuseColor.multiply( element.color );

			}

			_color.copy( _ambientLight );

			_centroid.copy( v1.positionWorld ).add( v2.positionWorld ).add( v3.positionWorld ).divideScalar( 3 );

			calculateLight( _centroid, element.normalModel, _color );

			_color.multiply( _diffuseColor ).add( _emissiveColor );

			material.wireframe === true
				 ? strokePath( _color, material.wireframeLinewidth, material.wireframeLinecap, material.wireframeLinejoin )
				 : fillPath( _color );

		} else if ( material instanceof THREE.MeshBasicMaterial ||
				    material instanceof THREE.MeshLambertMaterial ||
				    material instanceof THREE.MeshPhongMaterial ) {

			if ( material.map !== null ) {

				var mapping = material.map.mapping;

				if ( mapping === THREE.UVMapping ) {

					_uvs = element.uvs;
					patternPath( _v1x, _v1y, _v2x, _v2y, _v3x, _v3y, _uvs[ uv1 ].x, _uvs[ uv1 ].y, _uvs[ uv2 ].x, _uvs[ uv2 ].y, _uvs[ uv3 ].x, _uvs[ uv3 ].y, material.map );

				}

			} else if ( material.envMap !== null ) {

				if ( material.envMap.mapping === THREE.SphericalReflectionMapping ) {

					_normal.copy( element.vertexNormalsModel[ uv1 ] ).applyMatrix3( _normalViewMatrix );
					_uv1x = 0.5 * _normal.x + 0.5;
					_uv1y = 0.5 * _normal.y + 0.5;

					_normal.copy( element.vertexNormalsModel[ uv2 ] ).applyMatrix3( _normalViewMatrix );
					_uv2x = 0.5 * _normal.x + 0.5;
					_uv2y = 0.5 * _normal.y + 0.5;

					_normal.copy( element.vertexNormalsModel[ uv3 ] ).applyMatrix3( _normalViewMatrix );
					_uv3x = 0.5 * _normal.x + 0.5;
					_uv3y = 0.5 * _normal.y + 0.5;

					patternPath( _v1x, _v1y, _v2x, _v2y, _v3x, _v3y, _uv1x, _uv1y, _uv2x, _uv2y, _uv3x, _uv3y, material.envMap );

				}

			} else {

				_color.copy( material.color );

				if ( material.vertexColors === THREE.FaceColors ) {

					_color.multiply( element.color );

				}

				material.wireframe === true
					 ? strokePath( _color, material.wireframeLinewidth, material.wireframeLinecap, material.wireframeLinejoin )
					 : fillPath( _color );

			}

		} else if ( material instanceof THREE.MeshDepthMaterial ) {

			_color.r = _color.g = _color.b = 1 - smoothstep( v1.positionScreen.z * v1.positionScreen.w, _camera.near, _camera.far );

			material.wireframe === true
					 ? strokePath( _color, material.wireframeLinewidth, material.wireframeLinecap, material.wireframeLinejoin )
					 : fillPath( _color );

		} else if ( material instanceof THREE.MeshNormalMaterial ) {

			_normal.copy( element.normalModel ).applyMatrix3( _normalViewMatrix );

			_color.setRGB( _normal.x, _normal.y, _normal.z ).multiplyScalar( 0.5 ).addScalar( 0.5 );

			material.wireframe === true
				 ? strokePath( _color, material.wireframeLinewidth, material.wireframeLinecap, material.wireframeLinejoin )
				 : fillPath( _color );

		} else {

			_color.setRGB( 1, 1, 1 );

			material.wireframe === true
				 ? strokePath( _color, material.wireframeLinewidth, material.wireframeLinecap, material.wireframeLinejoin )
				 : fillPath( _color );

		}

	}

	//

	function drawTriangle( x0, y0, x1, y1, x2, y2 ) {

		_context.beginPath();
		_context.moveTo( x0, y0 );
		_context.lineTo( x1, y1 );
		_context.lineTo( x2, y2 );
		_context.closePath();

	}

	function strokePath( color, linewidth, linecap, linejoin ) {

		setLineWidth( linewidth );
		setLineCap( linecap );
		setLineJoin( linejoin );
		setStrokeStyle( color.getStyle() );

		_context.stroke();

		_elemBox.expandByScalar( linewidth * 2 );

	}

	function fillPath( color ) {

		setFillStyle( color.getStyle() );
		_context.fill();

	}

	function onTextureUpdate ( event ) {

		textureToPattern( event.target );

	}

	function textureToPattern( texture ) {

		if ( texture instanceof THREE.CompressedTexture ) return;

		var repeatX = texture.wrapS === THREE.RepeatWrapping;
		var repeatY = texture.wrapT === THREE.RepeatWrapping;

		var image = texture.image;

		var canvas = document.createElement( 'canvas' );
		canvas.width = image.width;
		canvas.height = image.height;

		var context = canvas.getContext( '2d' );
		context.setTransform( 1, 0, 0, - 1, 0, image.height );
		context.drawImage( image, 0, 0 );

		_patterns[ texture.id ] = _context.createPattern(
			canvas, repeatX === true && repeatY === true
				 ? 'repeat'
				 : repeatX === true && repeatY === false
					 ? 'repeat-x'
					 : repeatX === false && repeatY === true
						 ? 'repeat-y'
						 : 'no-repeat'
		);

	}

	function patternPath( x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2, texture ) {

		if ( texture instanceof THREE.DataTexture ) return;

		if ( texture.hasEventListener( 'update', onTextureUpdate ) === false ) {

			if ( texture.image !== undefined && texture.image.width > 0 ) {

				textureToPattern( texture );

			}

			texture.addEventListener( 'update', onTextureUpdate );

		}

		var pattern = _patterns[ texture.id ];

		if ( pattern !== undefined ) {

			setFillStyle( pattern );

		} else {

			setFillStyle( 'rgba(0,0,0,1)' );
			_context.fill();

			return;

		}

		// http://extremelysatisfactorytotalitarianism.com/blog/?p=2120

		var a, b, c, d, e, f, det, idet,
		offsetX = texture.offset.x / texture.repeat.x,
		offsetY = texture.offset.y / texture.repeat.y,
		width = texture.image.width * texture.repeat.x,
		height = texture.image.height * texture.repeat.y;

		u0 = ( u0 + offsetX ) * width;
		v0 = ( v0 + offsetY ) * height;

		u1 = ( u1 + offsetX ) * width;
		v1 = ( v1 + offsetY ) * height;

		u2 = ( u2 + offsetX ) * width;
		v2 = ( v2 + offsetY ) * height;

		x1 -= x0; y1 -= y0;
		x2 -= x0; y2 -= y0;

		u1 -= u0; v1 -= v0;
		u2 -= u0; v2 -= v0;

		det = u1 * v2 - u2 * v1;

		if ( det === 0 ) return;

		idet = 1 / det;

		a = ( v2 * x1 - v1 * x2 ) * idet;
		b = ( v2 * y1 - v1 * y2 ) * idet;
		c = ( u1 * x2 - u2 * x1 ) * idet;
		d = ( u1 * y2 - u2 * y1 ) * idet;

		e = x0 - a * u0 - c * v0;
		f = y0 - b * u0 - d * v0;

		_context.save();
		_context.transform( a, b, c, d, e, f );
		_context.fill();
		_context.restore();

	}

	function clipImage( x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2, image ) {

		// http://extremelysatisfactorytotalitarianism.com/blog/?p=2120

		var a, b, c, d, e, f, det, idet,
		width = image.width - 1,
		height = image.height - 1;

		u0 *= width; v0 *= height;
		u1 *= width; v1 *= height;
		u2 *= width; v2 *= height;

		x1 -= x0; y1 -= y0;
		x2 -= x0; y2 -= y0;

		u1 -= u0; v1 -= v0;
		u2 -= u0; v2 -= v0;

		det = u1 * v2 - u2 * v1;

		idet = 1 / det;

		a = ( v2 * x1 - v1 * x2 ) * idet;
		b = ( v2 * y1 - v1 * y2 ) * idet;
		c = ( u1 * x2 - u2 * x1 ) * idet;
		d = ( u1 * y2 - u2 * y1 ) * idet;

		e = x0 - a * u0 - c * v0;
		f = y0 - b * u0 - d * v0;

		_context.save();
		_context.transform( a, b, c, d, e, f );
		_context.clip();
		_context.drawImage( image, 0, 0 );
		_context.restore();

	}

	// Hide anti-alias gaps

	function expand( v1, v2, pixels ) {

		var x = v2.x - v1.x, y = v2.y - v1.y,
		det = x * x + y * y, idet;

		if ( det === 0 ) return;

		idet = pixels / Math.sqrt( det );

		x *= idet; y *= idet;

		v2.x += x; v2.y += y;
		v1.x -= x; v1.y -= y;

	}

	// Context cached methods.

	function setOpacity( value ) {

		if ( _contextGlobalAlpha !== value ) {

			_context.globalAlpha = value;
			_contextGlobalAlpha = value;

		}

	}

	function setBlending( value ) {

		if ( _contextGlobalCompositeOperation !== value ) {

			if ( value === THREE.NormalBlending ) {

				_context.globalCompositeOperation = 'source-over';

			} else if ( value === THREE.AdditiveBlending ) {

				_context.globalCompositeOperation = 'lighter';

			} else if ( value === THREE.SubtractiveBlending ) {

				_context.globalCompositeOperation = 'darker';

			}

			_contextGlobalCompositeOperation = value;

		}

	}

	function setLineWidth( value ) {

		if ( _contextLineWidth !== value ) {

			_context.lineWidth = value;
			_contextLineWidth = value;

		}

	}

	function setLineCap( value ) {

		// "butt", "round", "square"

		if ( _contextLineCap !== value ) {

			_context.lineCap = value;
			_contextLineCap = value;

		}

	}

	function setLineJoin( value ) {

		// "round", "bevel", "miter"

		if ( _contextLineJoin !== value ) {

			_context.lineJoin = value;
			_contextLineJoin = value;

		}

	}

	function setStrokeStyle( value ) {

		if ( _contextStrokeStyle !== value ) {

			_context.strokeStyle = value;
			_contextStrokeStyle = value;

		}

	}

	function setFillStyle( value ) {

		if ( _contextFillStyle !== value ) {

			_context.fillStyle = value;
			_contextFillStyle = value;

		}

	}

	function setLineDash( value ) {

		if ( _contextLineDash.length !== value.length ) {

			_context.setLineDash( value );
			_contextLineDash = value;

		}

	}

};
/**
 * @author mrdoob / http://mrdoob.com/
 * @author supereggbert / http://www.paulbrunt.co.uk/
 * @author julianwa / https://github.com/julianwa
 */

THREE.RenderableObject = function () {

	this.id = 0;

	this.object = null;
	this.z = 0;

};

//

THREE.RenderableFace = function () {

	this.id = 0;

	this.v1 = new THREE.RenderableVertex();
	this.v2 = new THREE.RenderableVertex();
	this.v3 = new THREE.RenderableVertex();

	this.normalModel = new THREE.Vector3();

	this.vertexNormalsModel = [ new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3() ];
	this.vertexNormalsLength = 0;

	this.color = new THREE.Color();
	this.material = null;
	this.uvs = [ new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2() ];

	this.z = 0;

};

//

THREE.RenderableVertex = function () {

	this.position = new THREE.Vector3();
	this.positionWorld = new THREE.Vector3();
	this.positionScreen = new THREE.Vector4();

	this.visible = true;

};

THREE.RenderableVertex.prototype.copy = function ( vertex ) {

	this.positionWorld.copy( vertex.positionWorld );
	this.positionScreen.copy( vertex.positionScreen );

};

//

THREE.RenderableLine = function () {

	this.id = 0;

	this.v1 = new THREE.RenderableVertex();
	this.v2 = new THREE.RenderableVertex();

	this.vertexColors = [ new THREE.Color(), new THREE.Color() ];
	this.material = null;

	this.z = 0;

};

//

THREE.RenderableSprite = function () {

	this.id = 0;

	this.object = null;

	this.x = 0;
	this.y = 0;
	this.z = 0;

	this.rotation = 0;
	this.scale = new THREE.Vector2();

	this.material = null;

};

//

THREE.Projector = function () {

	var _object, _objectCount, _objectPool = [], _objectPoolLength = 0,
	_vertex, _vertexCount, _vertexPool = [], _vertexPoolLength = 0,
	_face, _faceCount, _facePool = [], _facePoolLength = 0,
	_line, _lineCount, _linePool = [], _linePoolLength = 0,
	_sprite, _spriteCount, _spritePool = [], _spritePoolLength = 0,

	_renderData = { objects: [], lights: [], elements: [] },

	_vA = new THREE.Vector3(),
	_vB = new THREE.Vector3(),
	_vC = new THREE.Vector3(),

	_vector3 = new THREE.Vector3(),
	_vector4 = new THREE.Vector4(),

	_clipBox = new THREE.Box3( new THREE.Vector3( - 1, - 1, - 1 ), new THREE.Vector3( 1, 1, 1 ) ),
	_boundingBox = new THREE.Box3(),
	_points3 = new Array( 3 ),
	_points4 = new Array( 4 ),

	_viewMatrix = new THREE.Matrix4(),
	_viewProjectionMatrix = new THREE.Matrix4(),

	_modelMatrix,
	_modelViewProjectionMatrix = new THREE.Matrix4(),

	_normalMatrix = new THREE.Matrix3(),

	_frustum = new THREE.Frustum(),

	_clippedVertex1PositionScreen = new THREE.Vector4(),
	_clippedVertex2PositionScreen = new THREE.Vector4();

	//

	this.projectVector = function ( vector, camera ) {

		console.warn( 'THREE.Projector: .projectVector() is now vector.project().' );
		vector.project( camera );

	};

	this.unprojectVector = function ( vector, camera ) {

		console.warn( 'THREE.Projector: .unprojectVector() is now vector.unproject().' );
		vector.unproject( camera );

	};

	this.pickingRay = function ( vector, camera ) {

		console.error( 'THREE.Projector: .pickingRay() is now raycaster.setFromCamera().' );

	};

	//

	var RenderList = function () {

		var normals = [];
		var uvs = [];

		var object = null;
		var material = null;

		var normalMatrix = new THREE.Matrix3();

		var setObject = function ( value ) {

			object = value;
			material = object.material;

			normalMatrix.getNormalMatrix( object.matrixWorld );

			normals.length = 0;
			uvs.length = 0;

		};

		var projectVertex = function ( vertex ) {

			var position = vertex.position;
			var positionWorld = vertex.positionWorld;
			var positionScreen = vertex.positionScreen;

			positionWorld.copy( position ).applyMatrix4( _modelMatrix );
			positionScreen.copy( positionWorld ).applyMatrix4( _viewProjectionMatrix );

			var invW = 1 / positionScreen.w;

			positionScreen.x *= invW;
			positionScreen.y *= invW;
			positionScreen.z *= invW;

			vertex.visible = positionScreen.x >= - 1 && positionScreen.x <= 1 &&
					 positionScreen.y >= - 1 && positionScreen.y <= 1 &&
					 positionScreen.z >= - 1 && positionScreen.z <= 1;

		};

		var pushVertex = function ( x, y, z ) {

			_vertex = getNextVertexInPool();
			_vertex.position.set( x, y, z );

			projectVertex( _vertex );

		};

		var pushNormal = function ( x, y, z ) {

			normals.push( x, y, z );

		};

		var pushUv = function ( x, y ) {

			uvs.push( x, y );

		};

		var checkTriangleVisibility = function ( v1, v2, v3 ) {

			if ( v1.visible === true || v2.visible === true || v3.visible === true ) return true;

			_points3[ 0 ] = v1.positionScreen;
			_points3[ 1 ] = v2.positionScreen;
			_points3[ 2 ] = v3.positionScreen;

			return _clipBox.isIntersectionBox( _boundingBox.setFromPoints( _points3 ) );

		};

		var checkBackfaceCulling = function ( v1, v2, v3 ) {

			return ( ( v3.positionScreen.x - v1.positionScreen.x ) *
				    ( v2.positionScreen.y - v1.positionScreen.y ) -
				    ( v3.positionScreen.y - v1.positionScreen.y ) *
				    ( v2.positionScreen.x - v1.positionScreen.x ) ) < 0;

		};

		var pushLine = function ( a, b ) {

			var v1 = _vertexPool[ a ];
			var v2 = _vertexPool[ b ];

			_line = getNextLineInPool();

			_line.id = object.id;
			_line.v1.copy( v1 );
			_line.v2.copy( v2 );
			_line.z = ( v1.positionScreen.z + v2.positionScreen.z ) / 2;

			_line.material = object.material;

			_renderData.elements.push( _line );

		};

		var pushTriangle = function ( a, b, c ) {

			var v1 = _vertexPool[ a ];
			var v2 = _vertexPool[ b ];
			var v3 = _vertexPool[ c ];

			if ( checkTriangleVisibility( v1, v2, v3 ) === false ) return;

			if ( material.side === THREE.DoubleSide || checkBackfaceCulling( v1, v2, v3 ) === true ) {

				_face = getNextFaceInPool();

				_face.id = object.id;
				_face.v1.copy( v1 );
				_face.v2.copy( v2 );
				_face.v3.copy( v3 );
				_face.z = ( v1.positionScreen.z + v2.positionScreen.z + v3.positionScreen.z ) / 3;

				for ( var i = 0; i < 3; i ++ ) {

					var offset = arguments[ i ] * 3;
					var normal = _face.vertexNormalsModel[ i ];

					normal.set( normals[ offset ], normals[ offset + 1 ], normals[ offset + 2 ] );
					normal.applyMatrix3( normalMatrix ).normalize();

					var offset2 = arguments[ i ] * 2;

					var uv = _face.uvs[ i ];
					uv.set( uvs[ offset2 ], uvs[ offset2 + 1 ] );

				}

				_face.vertexNormalsLength = 3;

				_face.material = object.material;

				_renderData.elements.push( _face );

			}

		};

		return {
			setObject: setObject,
			projectVertex: projectVertex,
			checkTriangleVisibility: checkTriangleVisibility,
			checkBackfaceCulling: checkBackfaceCulling,
			pushVertex: pushVertex,
			pushNormal: pushNormal,
			pushUv: pushUv,
			pushLine: pushLine,
			pushTriangle: pushTriangle
		}

	};

	var renderList = new RenderList();

	this.projectScene = function ( scene, camera, sortObjects, sortElements ) {

		_faceCount = 0;
		_lineCount = 0;
		_spriteCount = 0;

		_renderData.elements.length = 0;

		if ( scene.autoUpdate === true ) scene.updateMatrixWorld();
		if ( camera.parent === undefined ) camera.updateMatrixWorld();

		_viewMatrix.copy( camera.matrixWorldInverse.getInverse( camera.matrixWorld ) );
		_viewProjectionMatrix.multiplyMatrices( camera.projectionMatrix, _viewMatrix );

		_frustum.setFromMatrix( _viewProjectionMatrix );

		//

		_objectCount = 0;

		_renderData.objects.length = 0;
		_renderData.lights.length = 0;

		scene.traverseVisible( function ( object ) {

			if ( object instanceof THREE.Light ) {

				_renderData.lights.push( object );

			} else if ( object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Sprite ) {

				if ( object.material.visible === false ) return;

				if ( object.frustumCulled === false || _frustum.intersectsObject( object ) === true ) {

					_object = getNextObjectInPool();
					_object.id = object.id;
					_object.object = object;

					_vector3.setFromMatrixPosition( object.matrixWorld );
					_vector3.applyProjection( _viewProjectionMatrix );
					_object.z = _vector3.z;

					_renderData.objects.push( _object );

				}

			}

		} );

		if ( sortObjects === true ) {

			_renderData.objects.sort( painterSort );

		}

		//

		for ( var o = 0, ol = _renderData.objects.length; o < ol; o ++ ) {

			var object = _renderData.objects[ o ].object;
			var geometry = object.geometry;

			renderList.setObject( object );

			_modelMatrix = object.matrixWorld;

			_vertexCount = 0;

			if ( object instanceof THREE.Mesh ) {

				if ( geometry instanceof THREE.BufferGeometry ) {

					var attributes = geometry.attributes;
					var offsets = geometry.offsets;

					if ( attributes.position === undefined ) continue;

					var positions = attributes.position.array;

					for ( var i = 0, l = positions.length; i < l; i += 3 ) {

						renderList.pushVertex( positions[ i ], positions[ i + 1 ], positions[ i + 2 ] );

					}

					if ( attributes.normal !== undefined ) {

						var normals = attributes.normal.array;

						for ( var i = 0, l = normals.length; i < l; i += 3 ) {

							renderList.pushNormal( normals[ i ], normals[ i + 1 ], normals[ i + 2 ] );

						}

					}

					if ( attributes.uv !== undefined ) {

						var uvs = attributes.uv.array;

						for ( var i = 0, l = uvs.length; i < l; i += 2 ) {

							renderList.pushUv( uvs[ i ], uvs[ i + 1 ] );

						}

					}

					if ( attributes.index !== undefined ) {

						var indices = attributes.index.array;

						if ( offsets.length > 0 ) {

							for ( var o = 0; o < offsets.length; o ++ ) {

								var offset = offsets[ o ];
								var index = offset.index;

								for ( var i = offset.start, l = offset.start + offset.count; i < l; i += 3 ) {

									renderList.pushTriangle( indices[ i ] + index, indices[ i + 1 ] + index, indices[ i + 2 ] + index );

								}

							}

						} else {

							for ( var i = 0, l = indices.length; i < l; i += 3 ) {

								renderList.pushTriangle( indices[ i ], indices[ i + 1 ], indices[ i + 2 ] );

							}

						}

					} else {

						for ( var i = 0, l = positions.length / 3; i < l; i += 3 ) {

							renderList.pushTriangle( i, i + 1, i + 2 );

						}

					}

				} else if ( geometry instanceof THREE.Geometry ) {

					var vertices = geometry.vertices;
					var faces = geometry.faces;
					var faceVertexUvs = geometry.faceVertexUvs[ 0 ];

					_normalMatrix.getNormalMatrix( _modelMatrix );

					var isFaceMaterial = object.material instanceof THREE.MeshFaceMaterial;
					var objectMaterials = isFaceMaterial === true ? object.material : null;

					for ( var v = 0, vl = vertices.length; v < vl; v ++ ) {

						var vertex = vertices[ v ];
						renderList.pushVertex( vertex.x, vertex.y, vertex.z );

					}

					for ( var f = 0, fl = faces.length; f < fl; f ++ ) {

						var face = faces[ f ];

						var material = isFaceMaterial === true
							 ? objectMaterials.materials[ face.materialIndex ]
							 : object.material;

						if ( material === undefined ) continue;

						var side = material.side;

						var v1 = _vertexPool[ face.a ];
						var v2 = _vertexPool[ face.b ];
						var v3 = _vertexPool[ face.c ];

						if ( material.morphTargets === true ) {

							var morphTargets = geometry.morphTargets;
							var morphInfluences = object.morphTargetInfluences;

							var v1p = v1.position;
							var v2p = v2.position;
							var v3p = v3.position;

							_vA.set( 0, 0, 0 );
							_vB.set( 0, 0, 0 );
							_vC.set( 0, 0, 0 );

							for ( var t = 0, tl = morphTargets.length; t < tl; t ++ ) {

								var influence = morphInfluences[ t ];

								if ( influence === 0 ) continue;

								var targets = morphTargets[ t ].vertices;

								_vA.x += ( targets[ face.a ].x - v1p.x ) * influence;
								_vA.y += ( targets[ face.a ].y - v1p.y ) * influence;
								_vA.z += ( targets[ face.a ].z - v1p.z ) * influence;

								_vB.x += ( targets[ face.b ].x - v2p.x ) * influence;
								_vB.y += ( targets[ face.b ].y - v2p.y ) * influence;
								_vB.z += ( targets[ face.b ].z - v2p.z ) * influence;

								_vC.x += ( targets[ face.c ].x - v3p.x ) * influence;
								_vC.y += ( targets[ face.c ].y - v3p.y ) * influence;
								_vC.z += ( targets[ face.c ].z - v3p.z ) * influence;

							}

							v1.position.add( _vA );
							v2.position.add( _vB );
							v3.position.add( _vC );

							renderList.projectVertex( v1 );
							renderList.projectVertex( v2 );
							renderList.projectVertex( v3 );

						}

						if ( renderList.checkTriangleVisibility( v1, v2, v3 ) === false ) continue;

						var visible = renderList.checkBackfaceCulling( v1, v2, v3 );

						if ( side !== THREE.DoubleSide ) {
							if ( side === THREE.FrontSide && visible === false ) continue;
							if ( side === THREE.BackSide && visible === true ) continue;
						}

						_face = getNextFaceInPool();

						_face.id = object.id;
						_face.v1.copy( v1 );
						_face.v2.copy( v2 );
						_face.v3.copy( v3 );

						_face.normalModel.copy( face.normal );

						if ( visible === false && ( side === THREE.BackSide || side === THREE.DoubleSide ) ) {

							_face.normalModel.negate();

						}

						_face.normalModel.applyMatrix3( _normalMatrix ).normalize();

						var faceVertexNormals = face.vertexNormals;

						for ( var n = 0, nl = Math.min( faceVertexNormals.length, 3 ); n < nl; n ++ ) {

							var normalModel = _face.vertexNormalsModel[ n ];
							normalModel.copy( faceVertexNormals[ n ] );

							if ( visible === false && ( side === THREE.BackSide || side === THREE.DoubleSide ) ) {

								normalModel.negate();

							}

							normalModel.applyMatrix3( _normalMatrix ).normalize();

						}

						_face.vertexNormalsLength = faceVertexNormals.length;

						var vertexUvs = faceVertexUvs[ f ];

						if ( vertexUvs !== undefined ) {

							for ( var u = 0; u < 3; u ++ ) {

								_face.uvs[ u ].copy( vertexUvs[ u ] );

							}

						}

						_face.color = face.color;
						_face.material = material;

						_face.z = ( v1.positionScreen.z + v2.positionScreen.z + v3.positionScreen.z ) / 3;

						_renderData.elements.push( _face );

					}

				}

			} else if ( object instanceof THREE.Line ) {

				if ( geometry instanceof THREE.BufferGeometry ) {

					var attributes = geometry.attributes;

					if ( attributes.position !== undefined ) {

						var positions = attributes.position.array;

						for ( var i = 0, l = positions.length; i < l; i += 3 ) {

							renderList.pushVertex( positions[ i ], positions[ i + 1 ], positions[ i + 2 ] );

						}

						if ( attributes.index !== undefined ) {

							var indices = attributes.index.array;

							for ( var i = 0, l = indices.length; i < l; i += 2 ) {

								renderList.pushLine( indices[ i ], indices[ i + 1 ] );

							}

						} else {

							var step = object.mode === THREE.LinePieces ? 2 : 1;

							for ( var i = 0, l = ( positions.length / 3 ) - 1; i < l; i += step ) {

								renderList.pushLine( i, i + 1 );

							}

						}

					}

				} else if ( geometry instanceof THREE.Geometry ) {

					_modelViewProjectionMatrix.multiplyMatrices( _viewProjectionMatrix, _modelMatrix );

					var vertices = object.geometry.vertices;

					if ( vertices.length === 0 ) continue;

					v1 = getNextVertexInPool();
					v1.positionScreen.copy( vertices[ 0 ] ).applyMatrix4( _modelViewProjectionMatrix );

					// Handle LineStrip and LinePieces
					var step = object.mode === THREE.LinePieces ? 2 : 1;

					for ( var v = 1, vl = vertices.length; v < vl; v ++ ) {

						v1 = getNextVertexInPool();
						v1.positionScreen.copy( vertices[ v ] ).applyMatrix4( _modelViewProjectionMatrix );

						if ( ( v + 1 ) % step > 0 ) continue;

						v2 = _vertexPool[ _vertexCount - 2 ];

						_clippedVertex1PositionScreen.copy( v1.positionScreen );
						_clippedVertex2PositionScreen.copy( v2.positionScreen );

						if ( clipLine( _clippedVertex1PositionScreen, _clippedVertex2PositionScreen ) === true ) {

							// Perform the perspective divide
							_clippedVertex1PositionScreen.multiplyScalar( 1 / _clippedVertex1PositionScreen.w );
							_clippedVertex2PositionScreen.multiplyScalar( 1 / _clippedVertex2PositionScreen.w );

							_line = getNextLineInPool();

							_line.id = object.id;
							_line.v1.positionScreen.copy( _clippedVertex1PositionScreen );
							_line.v2.positionScreen.copy( _clippedVertex2PositionScreen );

							_line.z = Math.max( _clippedVertex1PositionScreen.z, _clippedVertex2PositionScreen.z );

							_line.material = object.material;

							if ( object.material.vertexColors === THREE.VertexColors ) {

								_line.vertexColors[ 0 ].copy( object.geometry.colors[ v ] );
								_line.vertexColors[ 1 ].copy( object.geometry.colors[ v - 1 ] );

							}

							_renderData.elements.push( _line );

						}

					}

				}

			} else if ( object instanceof THREE.Sprite ) {

				_vector4.set( _modelMatrix.elements[ 12 ], _modelMatrix.elements[ 13 ], _modelMatrix.elements[ 14 ], 1 );
				_vector4.applyMatrix4( _viewProjectionMatrix );

				var invW = 1 / _vector4.w;

				_vector4.z *= invW;

				if ( _vector4.z >= - 1 && _vector4.z <= 1 ) {

					_sprite = getNextSpriteInPool();
					_sprite.id = object.id;
					_sprite.x = _vector4.x * invW;
					_sprite.y = _vector4.y * invW;
					_sprite.z = _vector4.z;
					_sprite.object = object;

					_sprite.rotation = object.rotation;

					_sprite.scale.x = object.scale.x * Math.abs( _sprite.x - ( _vector4.x + camera.projectionMatrix.elements[ 0 ] ) / ( _vector4.w + camera.projectionMatrix.elements[ 12 ] ) );
					_sprite.scale.y = object.scale.y * Math.abs( _sprite.y - ( _vector4.y + camera.projectionMatrix.elements[ 5 ] ) / ( _vector4.w + camera.projectionMatrix.elements[ 13 ] ) );

					_sprite.material = object.material;

					_renderData.elements.push( _sprite );

				}

			}

		}

		if ( sortElements === true ) {

			_renderData.elements.sort( painterSort );

		}

		return _renderData;

	};

	// Pools

	function getNextObjectInPool() {

		if ( _objectCount === _objectPoolLength ) {

			var object = new THREE.RenderableObject();
			_objectPool.push( object );
			_objectPoolLength ++;
			_objectCount ++;
			return object;

		}

		return _objectPool[ _objectCount ++ ];

	}

	function getNextVertexInPool() {

		if ( _vertexCount === _vertexPoolLength ) {

			var vertex = new THREE.RenderableVertex();
			_vertexPool.push( vertex );
			_vertexPoolLength ++;
			_vertexCount ++;
			return vertex;

		}

		return _vertexPool[ _vertexCount ++ ];

	}

	function getNextFaceInPool() {

		if ( _faceCount === _facePoolLength ) {

			var face = new THREE.RenderableFace();
			_facePool.push( face );
			_facePoolLength ++;
			_faceCount ++;
			return face;

		}

		return _facePool[ _faceCount ++ ];


	}

	function getNextLineInPool() {

		if ( _lineCount === _linePoolLength ) {

			var line = new THREE.RenderableLine();
			_linePool.push( line );
			_linePoolLength ++;
			_lineCount ++
			return line;

		}

		return _linePool[ _lineCount ++ ];

	}

	function getNextSpriteInPool() {

		if ( _spriteCount === _spritePoolLength ) {

			var sprite = new THREE.RenderableSprite();
			_spritePool.push( sprite );
			_spritePoolLength ++;
			_spriteCount ++
			return sprite;

		}

		return _spritePool[ _spriteCount ++ ];

	}

	//

	function painterSort( a, b ) {

		if ( a.z !== b.z ) {

			return b.z - a.z;

		} else if ( a.id !== b.id ) {

			return a.id - b.id;

		} else {

			return 0;

		}

	}

	function clipLine( s1, s2 ) {

		var alpha1 = 0, alpha2 = 1,

		// Calculate the boundary coordinate of each vertex for the near and far clip planes,
		// Z = -1 and Z = +1, respectively.
		bc1near =  s1.z + s1.w,
		bc2near =  s2.z + s2.w,
		bc1far =  - s1.z + s1.w,
		bc2far =  - s2.z + s2.w;

		if ( bc1near >= 0 && bc2near >= 0 && bc1far >= 0 && bc2far >= 0 ) {

			// Both vertices lie entirely within all clip planes.
			return true;

		} else if ( ( bc1near < 0 && bc2near < 0 ) || ( bc1far < 0 && bc2far < 0 ) ) {

			// Both vertices lie entirely outside one of the clip planes.
			return false;

		} else {

			// The line segment spans at least one clip plane.

			if ( bc1near < 0 ) {

				// v1 lies outside the near plane, v2 inside
				alpha1 = Math.max( alpha1, bc1near / ( bc1near - bc2near ) );

			} else if ( bc2near < 0 ) {

				// v2 lies outside the near plane, v1 inside
				alpha2 = Math.min( alpha2, bc1near / ( bc1near - bc2near ) );

			}

			if ( bc1far < 0 ) {

				// v1 lies outside the far plane, v2 inside
				alpha1 = Math.max( alpha1, bc1far / ( bc1far - bc2far ) );

			} else if ( bc2far < 0 ) {

				// v2 lies outside the far plane, v2 inside
				alpha2 = Math.min( alpha2, bc1far / ( bc1far - bc2far ) );

			}

			if ( alpha2 < alpha1 ) {

				// The line segment spans two boundaries, but is outside both of them.
				// (This can't happen when we're only clipping against just near/far but good
				//  to leave the check here for future usage if other clip planes are added.)
				return false;

			} else {

				// Update the s1 and s2 vertices to match the clipped line segment.
				s1.lerp( s2, alpha1 );
				s2.lerp( s1, 1 - alpha2 );

				return true;

			}

		}

	}

};
/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 */
/*global THREE, console */

// This set of controls performs orbiting, dollying (zooming), and panning. It maintains
// the "up" direction as +Y, unlike the TrackballControls. Touch on tablet and phones is
// supported.
//
//    Orbit - left mouse / touch: one finger move
//    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
//    Pan - right mouse, or arrow keys / touch: three finter swipe
//
// This is a drop-in replacement for (most) TrackballControls used in examples.
// That is, include this js file and wherever you see:
//    	controls = new THREE.TrackballControls( camera );
//      controls.target.z = 150;
// Simple substitute "OrbitControls" and the control should work as-is.

THREE.OrbitControls = function ( object, domElement, settings ) {

	//settings
	this.settings = settings;

	this.object = object;
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// API

	// Set to false to disable this control
	this.enabled = true;

	// "target" sets the location of focus, where the control orbits around
	// and where it pans with respect to.
	this.target = new THREE.Vector3();

	// center is old, deprecated; use "target" instead
	this.center = this.target;

	// This option actually enables dollying in and out; left as "zoom" for
	// backwards compatibility
	this.noZoom = false;
	this.zoomSpeed = 1.0;

	// Limits to how far you can dolly in and out
	this.minDistance = 0;
	this.maxDistance = Infinity;

	// Set to true to disable this control
	this.noRotate = false;
	this.rotateSpeed = 1.0;

	// Set to true to disable this control
	this.noPan = false;
	this.panSpeed = .3;
	this.keyPanSpeed = 7.0;	// pixels moved per arrow key push

	// Set to true to automatically rotate around the target
	this.autoRotate = false;
	this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

	// How far you can orbit vertically, upper and lower limits.
	// Range is 0 to Math.PI radians.
	this.minPolarAngle = 0; // radians
	this.maxPolarAngle = Math.PI; // radians

	// How far you can orbit horizontally, upper and lower limits.
	// If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
	this.minAzimuthAngle = - Infinity; // radians
	this.maxAzimuthAngle = Infinity; // radians

	// Set to true to disable use of the keys
	this.noKeys = false;

	// The four arrow keys
	this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

	// Mouse buttons
	this.mouseButtons = { ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT };

	////////////
	// internals

	var scope = this;

	var EPS = 0.000001;

	var rotateStart = new THREE.Vector2();
	var rotateEnd = new THREE.Vector2();
	var rotateDelta = new THREE.Vector2();

	var panStart = new THREE.Vector2();
	var panEnd = new THREE.Vector2();
	var panDelta = new THREE.Vector2();
	var panOffset = new THREE.Vector3();

	var offset = new THREE.Vector3();

	var dollyStart = new THREE.Vector2();
	var dollyEnd = new THREE.Vector2();
	var dollyDelta = new THREE.Vector2();

	var phiDelta = 0;
	var thetaDelta = 0;
	var scale = 1;
	var pan = new THREE.Vector3();

	var lastPosition = new THREE.Vector3();
	var lastQuaternion = new THREE.Quaternion();

	var STATE = { NONE : -1, ROTATE : 0, DOLLY : 1, PAN : 2, TOUCH_ROTATE : 3, TOUCH_DOLLY : 4, TOUCH_PAN : 5 };

	var state = STATE.NONE;

	// for reset

	this.target0 = this.target.clone();
	this.position0 = this.object.position.clone();

	// so camera.up is the orbit axis

	var quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
	var quatInverse = quat.clone().inverse();

	// events

	var changeEvent = { type: 'change' };
	var startEvent = { type: 'start'};
	var endEvent = { type: 'end'};

	this.rotateLeft = function ( angle ) {

		if ( angle === undefined ) {

			angle = getAutoRotationAngle();

		}

		thetaDelta -= angle;

	};

	this.rotateUp = function ( angle ) {

		if ( angle === undefined ) {

			angle = getAutoRotationAngle();

		}

		phiDelta -= angle;

	};

	// pass in distance in world space to move left
	this.panLeft = function ( distance ) {

		var te = this.object.matrix.elements;

		// get X column of matrix
		panOffset.set( te[ 0 ], te[ 1 ], te[ 2 ] );
		panOffset.multiplyScalar( - distance );
		
		pan.add( panOffset );

	};

	// pass in distance in world space to move up
	this.panUp = function ( distance ) {

		var te = this.object.matrix.elements;

		// get Y column of matrix
		panOffset.set( te[ 4 ], te[ 5 ], te[ 6 ] );
		panOffset.multiplyScalar( distance );
		
		pan.add( panOffset );

	};

	// pass in distance in world space to move forward
	this.panForward = function ( distance ) {

		var te = this.object.matrix.elements;

		// get Z column of matrix
		panOffset.set( te[ 8 ], te[ 9 ], te[ 10 ] );
		panOffset.multiplyScalar( distance );
		
		pan.add( panOffset );

	};
	
	// pass in x,y of change desired in pixel space,
	// right and down are positive
	this.pan = function ( deltaX, deltaY ) {

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		if ( scope.object.fov !== undefined ) {

			// perspective
			var position = scope.object.position;
			var offset = position.clone().sub( scope.target );
			var targetDistance = offset.length();

			// half of the fov is center to top of screen
			targetDistance *= Math.tan( ( scope.object.fov / 2 ) * Math.PI / 180.0 );

			// we actually don't use screenWidth, since perspective camera is fixed to screen height
			scope.panLeft( 2 * deltaX * targetDistance / element.clientHeight );
			scope.panUp( 2 * deltaY * targetDistance / element.clientHeight );

		} else if ( scope.object.top !== undefined ) {

			// orthographic
			scope.panLeft( deltaX * (scope.object.right - scope.object.left) / element.clientWidth );
			scope.panUp( deltaY * (scope.object.top - scope.object.bottom) / element.clientHeight );

		} else {

			// camera neither orthographic or perspective
			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );

		}

	};

	this.panXZ = function ( deltaX, deltaY ) {

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		if ( scope.object.fov !== undefined ) {

			// perspective
			var position = scope.object.position;
			var offset = position.clone().sub( scope.target );
			var targetDistance = offset.length();

			// half of the fov is center to top of screen
			targetDistance *= Math.tan( ( scope.object.fov / 2 ) * Math.PI / 180.0 );

			// we actually don't use screenWidth, since perspective camera is fixed to screen height
			scope.panLeft( 2 * deltaX * targetDistance / element.clientHeight );
			scope.panForward( 2 * deltaY * targetDistance / element.clientHeight );

		} else if ( scope.object.top !== undefined ) {

			// orthographic
			scope.panLeft( deltaX * (scope.object.right - scope.object.left) / element.clientWidth );
			scope.panForward( deltaY * (scope.object.top - scope.object.bottom) / element.clientHeight );

		} else {

			// camera neither orthographic or perspective
			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );

		}

	};

	this.dollyIn = function ( dollyScale ) {

		if ( dollyScale === undefined ) {

			dollyScale = getZoomScale();

		}

		scale /= dollyScale;

	};

	this.dollyOut = function ( dollyScale ) {

		if ( dollyScale === undefined ) {

			dollyScale = getZoomScale();

		}

		scale *= dollyScale;

	};

	this.update = function () {

		var position = this.object.position;

		var center = ( this.settings && this.settings.cameraAsOrbitCenter ) ? position : this.target;
		var orbit = ( this.settings && this.settings.cameraAsOrbitCenter ) ? this.target : position;

		offset.copy( position ).sub( this.target );

		// rotate offset to "y-axis-is-up" space
		offset.applyQuaternion( quat );

		// angle from z-axis around y-axis

		var theta = Math.atan2( offset.x, offset.z );

		// angle from y-axis

		var phi = Math.atan2( Math.sqrt( offset.x * offset.x + offset.z * offset.z ), offset.y );

		if ( this.autoRotate ) {

			this.rotateLeft( getAutoRotationAngle() );

		}

		theta += thetaDelta;
		phi += phiDelta;

		// restrict theta to be between desired limits
		theta = Math.max( this.minAzimuthAngle, Math.min( this.maxAzimuthAngle, theta ) );

		// restrict phi to be between desired limits
		phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, phi ) );

		// restrict phi to be betwee EPS and PI-EPS
		phi = Math.max( EPS, Math.min( Math.PI - EPS, phi ) );

		var radius = ( this.settings && this.settings.cameraAsOrbitCenter ) ? 5000 * scale * this.settings.boxScale : offset.length() * scale;

		// restrict radius to be between desired limits
		radius = Math.max( this.minDistance, Math.min( this.maxDistance, radius ) );
		
		// move target to panned location
		 center.add( pan );

		offset.x = radius * Math.sin( phi ) * Math.sin( theta );
		offset.y = radius * Math.cos( phi );
		offset.z = radius * Math.sin( phi ) * Math.cos( theta );

		// rotate offset back to "camera-up-vector-is-up" space
		offset.applyQuaternion( quatInverse );

		( this.settings && this.settings.cameraAsOrbitCenter ) ?  orbit.copy( center ).sub( offset ) : orbit.copy( center ).add( offset );

		this.object.lookAt( this.target );

		thetaDelta = 0;
		phiDelta = 0;
		scale = 1;
		pan.set( 0, 0, 0 );

		// update condition is:
		// min(camera displacement, camera rotation in radians)^2 > EPS
		// using small-angle approximation cos(x/2) = 1 - x^2 / 8

		if ( lastPosition.distanceToSquared( center ) > EPS
		    || 8 * (1 - lastQuaternion.dot(this.object.quaternion)) > EPS ) {

			this.dispatchEvent( changeEvent );

			lastPosition.copy( center );
			lastQuaternion.copy (this.object.quaternion );

		}

	};


	this.reset = function () {

		state = STATE.NONE;

		this.target.copy( this.target0 );
		this.object.position.copy( this.position0 );

		this.update();

	};

	function getAutoRotationAngle() {

		return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

	}

	function getZoomScale() {

		return Math.pow( 0.95, scope.zoomSpeed );

	}

	function onMouseDown( event ) {

		if ( scope.enabled === false ) return;
		event.preventDefault();

		if ( event.button === scope.mouseButtons.ORBIT ) {
			if ( scope.noRotate === true ) return;

			state = STATE.ROTATE;

			rotateStart.set( event.clientX, event.clientY );

		} else if ( event.button === scope.mouseButtons.ZOOM ) {
			if ( scope.noZoom === true ) return;

			state = STATE.DOLLY;

			dollyStart.set( event.clientX, event.clientY );

		} else if ( event.button === scope.mouseButtons.PAN ) {
			if ( scope.noPan === true ) return;

			state = STATE.PAN;

			panStart.set( event.clientX, event.clientY );

		}

		document.addEventListener( 'mousemove', onMouseMove, false );
		document.addEventListener( 'mouseup', onMouseUp, false );
		scope.dispatchEvent( startEvent );

	}

	function onMouseMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		if ( state === STATE.ROTATE ) {

			if ( scope.noRotate === true ) return;

			rotateEnd.set( event.clientX, event.clientY );
			rotateDelta.subVectors( rotateEnd, rotateStart );

			// rotating across whole screen goes 360 degrees around
			scope.rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );

			// rotating up and down along whole screen attempts to go 360, but limited to 180
			scope.rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

			rotateStart.copy( rotateEnd );

		} else if ( state === STATE.DOLLY ) {

			if ( scope.noZoom === true ) return;

			dollyEnd.set( event.clientX, event.clientY );
			dollyDelta.subVectors( dollyEnd, dollyStart );

			if ( dollyDelta.y > 0 ) {

				scope.dollyIn();

			} else {

				scope.dollyOut();

			}

			dollyStart.copy( dollyEnd );

		} else if ( state === STATE.PAN ) {

			if ( scope.noPan === true ) return;

			panEnd.set( event.clientX, event.clientY );
			panDelta.subVectors( panEnd, panStart );
			
			scope.panXZ( panDelta.x * scope.panSpeed, - panDelta.y * scope.panSpeed );

			panStart.copy( panEnd );

		}

		scope.update();

	}

	function onMouseUp( /* event */ ) {

		if ( scope.enabled === false ) return;

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );
		scope.dispatchEvent( endEvent );
		state = STATE.NONE;

	}

	function onMouseWheel( event ) {

		if ( scope.enabled === false || scope.noZoom === true ) return;

		event.preventDefault();
		event.stopPropagation();

		var delta = 0;

		if ( event.wheelDelta !== undefined ) { // WebKit / Opera / Explorer 9

			delta = event.wheelDelta;

		} else if ( event.detail !== undefined ) { // Firefox

			delta = - event.detail;

		}

		if ( delta > 0 ) {

			scope.dollyOut();

		} else {

			scope.dollyIn();

		}

		scope.update();
		scope.dispatchEvent( startEvent );
		scope.dispatchEvent( endEvent );

	}

	function onKeyDown( event ) {

		if ( scope.enabled === false || scope.noKeys === true || scope.noPan === true ) return;
		
		switch ( event.keyCode ) {

			case scope.keys.UP:
				scope.pan( 0, scope.keyPanSpeed );
				scope.update();
				break;

			case scope.keys.FORWARD:
				scope.panXZ( 0, - scope.keyPanSpeed );
				scope.update();
				break;

			case scope.keys.BOTTOM:
				scope.pan( 0, - scope.keyPanSpeed );
				scope.update();
				break;

			case scope.keys.BACKWARD:
				scope.panXZ( 0, scope.keyPanSpeed );
				scope.update();
				break;

			case scope.keys.LEFT:
				scope.pan( scope.keyPanSpeed, 0 );
				scope.update();
				break;

			case scope.keys.RIGHT:
				scope.pan( - scope.keyPanSpeed, 0 );
				scope.update();
				break;

			case scope.keys.DOLLY_IN:
				if ( scope.noZoom === true ) break;
				scope.dollyIn();
				scope.update();
				break;

			case scope.keys.DOLLY_OUT:
				if ( scope.noZoom === true ) break;
				scope.dollyOut();
				scope.update();
				break;

		}

	}

	function touchstart( event ) {

		if ( scope.enabled === false ) return;

		switch ( event.touches.length ) {

			case 1:	// one-fingered touch: rotate

				if ( scope.noRotate === true ) return;

				state = STATE.TOUCH_ROTATE;

				rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
				break;

			case 2:	// two-fingered touch: dolly

				if ( scope.noZoom === true ) return;

				state = STATE.TOUCH_DOLLY;

				var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
				var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
				var distance = Math.sqrt( dx * dx + dy * dy );
				dollyStart.set( 0, distance );
				break;

			case 3: // three-fingered touch: pan

				if ( scope.noPan === true ) return;

				state = STATE.TOUCH_PAN;

				panStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
				break;

			default:

				state = STATE.NONE;

		}

		scope.dispatchEvent( startEvent );

	}

	function touchmove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		switch ( event.touches.length ) {

			case 1: // one-fingered touch: rotate

				if ( scope.noRotate === true ) return;
				if ( state !== STATE.TOUCH_ROTATE ) return;

				rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
				rotateDelta.subVectors( rotateEnd, rotateStart );

				// rotating across whole screen goes 360 degrees around
				scope.rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );
				// rotating up and down along whole screen attempts to go 360, but limited to 180
				scope.rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );

				rotateStart.copy( rotateEnd );

				scope.update();
				break;

			case 2: // two-fingered touch: dolly

				if ( scope.noZoom === true ) return;
				if ( state !== STATE.TOUCH_DOLLY ) return;

				var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
				var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
				var distance = Math.sqrt( dx * dx + dy * dy );

				dollyEnd.set( 0, distance );
				dollyDelta.subVectors( dollyEnd, dollyStart );

				if ( dollyDelta.y > 0 ) {

					scope.dollyOut();

				} else {

					scope.dollyIn();

				}

				dollyStart.copy( dollyEnd );

				scope.update();
				break;

			case 3: // three-fingered touch: pan

				if ( scope.noPan === true ) return;
				if ( state !== STATE.TOUCH_PAN ) return;

				panEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
				panDelta.subVectors( panEnd, panStart );
				
				scope.panXZ( panDelta.x * scope.panSpeed, - panDelta.y * scope.panSpeed );

				panStart.copy( panEnd );

				scope.update();
				break;

			default:

				state = STATE.NONE;

		}

	}

	function touchend( /* event */ ) {

		if ( scope.enabled === false ) return;

		scope.dispatchEvent( endEvent );
		state = STATE.NONE;

	}

	this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
	this.domElement.addEventListener( 'mousedown', onMouseDown, false );
	this.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
	this.domElement.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox

	this.domElement.addEventListener( 'touchstart', touchstart, false );
	this.domElement.addEventListener( 'touchend', touchend, false );
	this.domElement.addEventListener( 'touchmove', touchmove, false );

	window.addEventListener( 'keydown', onKeyDown, false );

	// force an update at start
	this.update();

};

THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );
/**
 * @author alteredq / http://alteredqualia.com/
 * @author mr.doob / http://mrdoob.com/
 */

var Detector = {

	canvas: !! window.CanvasRenderingContext2D,
	webgl: ( function () { try { var canvas = document.createElement( 'canvas' ); return !! ( window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ) ); } catch( e ) { return false; } } )(),
	workers: !! window.Worker,
	fileapi: window.File && window.FileReader && window.FileList && window.Blob,

	getWebGLErrorMessage: function () {

		var element = document.createElement( 'div' );
		element.id = 'webgl-error-message';
		element.style.fontFamily = 'monospace';
		element.style.fontSize = '13px';
		element.style.fontWeight = 'normal';
		element.style.textAlign = 'center';
		element.style.background = '#fff';
		element.style.color = '#000';
		element.style.padding = '1.5em';
		element.style.width = '400px';
		element.style.margin = '5em auto 0';

		if ( ! this.webgl ) {

			element.innerHTML = window.WebGLRenderingContext ? [
				'Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />',
				'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
			].join( '\n' ) : [
				'Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>',
				'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
			].join( '\n' );

		}

		return element;

	},

	addGetWebGLMessage: function ( parameters ) {

		var parent, id, element;

		parameters = parameters || {};

		parent = parameters.parent !== undefined ? parameters.parent : document.body;
		id = parameters.id !== undefined ? parameters.id : 'oldie';

		element = Detector.getWebGLErrorMessage();
		element.id = id;

		parent.appendChild( element );

	}

};

// browserify support
if ( typeof module === 'object' ) {

	module.exports = Detector;

}
/**
*@author Gonster  ( gonster.github.io )
*/

(function ( window, document, THREE, Detector ) {

    var Base = function ( domParent ) {

        if ( typeof domParent === 'object' ) {
            this.domParent = domParent;
        }
        else {
            this.domParent = document.body;
        }

    };



    Base.prototype.init = function ( onWindowResize, subInit, renderer, scene, camera, controls ) {
        //webgl support test
        // if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

        //specify requestAnimation
        if ( ! window.requestAnimationFrame ) {
            window.requestAnimationFrame = ( function() {
                return window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function( callback, element ) {
                    window.setTimeout( callback, 1000 / 60 );
                };
            } )();
        }

        if ( this.domParent === document.body ) {
            this.WINDOW_WIDTH = window.innerWidth;
            this.WINDOW_HEIGHT = window.innerHeight;
            this.WINDOW_HEIGHT_HALF = this.WINDOW_HEIGHT / 2.0;
            this.WINDOW_WIDTH_HALF = this.WINDOW_WIDTH / 2.0;
            window.addEventListener( 'resize', onWindowResize, false );
        }

        //variables
        this.renderType = ( ! Detector.webgl ) ? 'canvas' : 'webgl'; 
        this.renderer = renderer || ( ( ! Detector.webgl ) ? new THREE.CanvasRenderer( { preserveDrawingBuffer: true } ) : new THREE.WebGLRenderer( { antialias: true,preserveDrawingBuffer: true } ) );
        this.renderer.setSize( this.WINDOW_WIDTH, this.WINDOW_HEIGHT );
        this.domParent.appendChild( this.renderer.domElement );
        this.scene = scene || new THREE.Scene();
        this.camera = camera
            || new THREE.PerspectiveCamera( 35, this.WINDOW_WIDTH / this.WINDOW_HEIGHT, .1, 100000 );
        this.camera.position.set( 1000, 500, 1000 );
        this.camera.lookAt( this.scene.position );

        if ( controls ) {
            this.controls =controls;
        }
        else {
            this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement, {cameraAsOrbitCenter: true} );
            this.controls.target.set( 0, 0, 0 );
            this.controls.rotateSpeed = 1.0;
            this.controls.zoomSpeed = 1.2;
            this.controls.keyPanSpeed = 10;
            this.controls.panSpeed = 1;
            this.controls.noZoom = true;
            this.controls.keys = { LEFT: 65, FORWARD: 87, RIGHT: 68, BACKWARD: 83, UP: 81, BOTTOM: 69 };
            this.controls.mouseButtons = { ORBIT: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT };
        }

        this.stats = new Stats();
        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.top = '0px';
        this.stats.domElement.style.zIndex = '999';
        document.body.appendChild( this.stats.domElement );
        subInit();
    };

    window.Base = Base;

    if( typeof module === 'object' ) {
        module.exports = Base;
    }

})( window, document, THREE, Detector );
/**
*@author Gonster  ( gonster.github.io )
*/

(function(){

    var GoUI = {};

    GoUI.Animation = {
        'bubble': function(dom, text) {
            var theBubble = $('<div class="alert alert-info alert-vp fade"></div>').appendTo(dom);
            theBubble.text(text);
            theBubble.finish().fadeTo(200, 1).delay(2500).fadeTo(100, 0, function(){
                $(this).remove();
            });
        }
    }

    //_Container
    _Container = function(){
        this.domElement = document.createElement('div');
    };

    _Container.prototype.createComponets = function(buttonGroups){
        for (var i = 0, l=buttonGroups.length; i < l; i++) {




        };
    }

    GoUI.map = {};

    //Sidebar
    GoUI.Sidebar = function(settings, domParent){

        _Container.call(this);

        var defaultSettings = {
            'align': 'r',            
            'width': 320
        }
        var mixinSettings = this.setting = GoUI.Utils.settingMixin(defaultSettings, settings);

        var classNameString = 'sidebar';
        if(!mixinSettings.align || mixinSettings.align === 'r'){
            classNameString += ' sidebar-right';
        }
        else{
            classNameString += ' sidebar-left';
        }
        this.domElement.className = classNameString;
        if(mixinSettings.id) {
            this.domElement.id = mixinSettings.id;
            GoUI.map[mixinSettings.id] = this;
        }

        this.domElement.style.width = mixinSettings.width.toString()+'px';
        if(mixinSettings.overflow) this.domElement.style.overflow = mixinSettings.overflow.toString();

        domParent.appendChild(this.domElement);

        GoUI.Utils.domCreationDirector(mixinSettings.children, this.domElement)
    };

    GoUI.Sidebar.prototype = Object.create(_Container.prototype);

    //panel
    GoUI.Panel = function(settings, domParent){
        _Container.call(this);
        var defaultSettings = {
            'title': ''
        }
        var mixinSettings = this.setting = GoUI.Utils.settingMixin(defaultSettings, settings);
      
        if(mixinSettings.id) {
            this.domElement.id = mixinSettings.id;
            GoUI.map[mixinSettings.id] = this;
        }   

        var aPanel = this.domElement;
        aPanel.className = 'panel panel-tool';
        domParent.appendChild(aPanel);

        var aPanelHead = document.createElement('div');
        aPanelHead.className = 'panel-heading';
        aPanel.appendChild(aPanelHead);

        var panelHeadText = document.createTextNode(mixinSettings.title)
        aPanelHead.appendChild(panelHeadText);

        var aPanelBody = document.createElement('div');
        aPanelBody.className = 'panel-body';
        if(mixinSettings.overflow) aPanelBody.style.overflow = mixinSettings.overflow.toString();   
        aPanel.appendChild(aPanelBody);

        GoUI.Utils.domCreationDirector(mixinSettings.children, aPanelBody)
    };

    GoUI.Panel.prototype = Object.create(_Container.prototype);

    //toolbar
    GoUI.Toolbar = function(settings, domParent){
        _Container.call(this);
        var defaultSettings = {
            'title': ''
        }
        var mixinSettings = this.setting = GoUI.Utils.settingMixin(defaultSettings, settings);
      
        if(mixinSettings.id) {
            this.domElement.id = mixinSettings.id;
            GoUI.map[mixinSettings.id] = this;
        }     

        var aToolbar = this.domElement;
        aToolbar.className = 'btn-toolbar';
        domParent.appendChild(aToolbar);

        GoUI.Utils.domCreationDirector(mixinSettings.children, aToolbar)
    };

    GoUI.Toolbar.prototype = Object.create(_Container.prototype);

    //button group
    GoUI.ButtonGroup = function(settings, domParent) {
        _Container.call(this);
        var defaultSettings = {
            'title': '',
            'buttonType': 'radio'
        }
        var mixinSettings = this.setting = GoUI.Utils.settingMixin(defaultSettings, settings);
      
        if(mixinSettings.id) {
            this.domElement.id = mixinSettings.id;
            GoUI.map[mixinSettings.id] = this;
        }   

        var aGroup = this.domElement;
        aGroup.className = 'btn-group'+(mixinSettings.appendClass?' '+mixinSettings.appendClass:'');

        if( mixinSettings.buttonType.toLowerCase() !== 'button' ) aGroup.setAttribute('data-toggle', 'buttons');

        aGroup.title = mixinSettings.title;
        domParent.appendChild(aGroup);
        var buttons = mixinSettings.buttons;

        switch( mixinSettings.buttonType.toLowerCase() ){
            default:
            case 'radio':
                for (var j = 0, k = buttons.length; j < k; j++) {

                    var aRadioButtonLabel = document.createElement('label');
                    aRadioButtonLabel.className = 'btn btn-tool'+(buttons[j].checked?' active':'');
                    if(buttons[j].height) aRadioButtonLabel.style.height = buttons[j].height+'px';
                    if(buttons[j].width) aRadioButtonLabel.style.width = buttons[j].width+'px';

                    if(buttons[j].bgType && buttons[j].bgTypeData){

                        var bg;
                        switch(buttons[j].bgType){
                            case 'color':
                                bg = buttons[j].bgTypeData;
                                aRadioButtonLabel.className += ' btn-color';
                                break;
                            case 'image':
                                bg = 'url('+buttons[j].bgTypeData+') no-repeat 50% 50%';
                                aRadioButtonLabel.className += ' btn-image';
                                break;
                            default:
                                return;
                        }

                        aRadioButtonLabel.style.background = bg;    

                    }  

                    aGroup.appendChild(aRadioButtonLabel);
                    var aInput = document.createElement('input');
                    if(buttons[j].checked) aInput.setAttribute('checked','');
                    aInput.type = mixinSettings.buttonType;
                    aInput.name = mixinSettings.name;
                    aInput.id = buttons[j].id;
                    aInput.value = j;
                    aInput.autocomplete = 'off';
                    aRadioButtonLabel.appendChild(aInput);     
                    var text =document.createTextNode(buttons[j].title);    
                    aRadioButtonLabel.appendChild(text);    

                }
                break;
            case 'button':
                for (var j = 0, k = buttons.length; j < k; j++) {

                    var aButton = document.createElement('button');
                    aButton.className = 'btn btn-tool';
                    aButton.id = buttons[j].id;
                    aButton.name = mixinSettings.name;

                    if(buttons[j].height) aButton.style.height = buttons[j].height+'px';
                    if(buttons[j].width) aButton.style.width = buttons[j].width+'px';

                    if(buttons[j].bgType && buttons[j].bgTypeData){

                        var bg;
                        switch(buttons[j].bgType){
                            case 'color':
                                bg = buttons[j].bgTypeData;
                                aRadioButtonLabel.className += ' btn-color';
                                break;
                            case 'image':
                                bg = 'url('+buttons[j].bgTypeData+') no-repeat 50% 50%';
                                aRadioButtonLabel.className += ' btn-image';
                                break;
                            default:
                                return;
                        }

                        aButton.style.background = bg;    

                    }  

                    aGroup.appendChild(aButton);
                    var text =document.createTextNode(buttons[j].title);    
                    aButton.appendChild(text); 

                }
                break;
        }
        GoUI.Utils.domCreationDirector(mixinSettings.children, this.domElement)
    };

    GoUI.ButtonGroup.prototype = Object.create(_Container.prototype);

    GoUI.ButtonGroup.prototype.addButton  = function(button, isPushed){

        if(!isPushed) this.setting.buttons.push(button);

        var aRadioButtonLabel = document.createElement('label');
        aRadioButtonLabel.className = 'btn btn-tool'+(button.checked?' active':'');
        if(button.height) aRadioButtonLabel.style.height = button.height+'px';
        if(button.width) aRadioButtonLabel.style.width = button.width+'px';
        if(button.bgType && button.bgTypeData){
            var bg;
            switch(button.bgType){
                case 'color':
                    bg = button.bgTypeData;
                    aRadioButtonLabel.className += ' btn-color';
                    break;
                case 'image':
                    bg = 'url('+button.bgTypeData+') no-repeat 50% 50%';
                    aRadioButtonLabel.className += ' btn-image';
                    break;
                default:
                    return;
            }

            aRadioButtonLabel.style.background = bg;    
        }    
        this.domElement.appendChild(aRadioButtonLabel);

        var aInput = document.createElement('input');
        if(button.checked) aInput.setAttribute('checked','');
        aInput.type = this.setting.buttonType;
        aInput.name = this.setting.name;
        aInput.id = button.id;
        aInput.value = this.setting.buttons.length - 1;
        aInput.autocomplete = 'off';
        aRadioButtonLabel.appendChild(aInput);    

        var text =document.createTextNode(button.title);    
        aRadioButtonLabel.appendChild(text);   
        return aRadioButtonLabel;
    }

    GoUI.ButtonGroup.prototype.addButtons = function(buttons, isPushed){
        for (var i = 0, l = buttons.length; i < l; i++) {
            this.addButton(buttons[i],isPushed);
        };
    }

    //Utils
    GoUI.Utils = {};

    GoUI.Utils.settingMixin = function(o1, o2){
        if((typeof o1 === 'object') && (typeof o2 === 'object')){
            var dist = {};
            for(var i in o1) {
                dist[i] = o1[i];
            }
            for(var j in o2){
                if(o2[j] !== undefined){
                    dist[j] = o2[j];
                }
            }
            return dist;
        }
        else{
            return o1;
        }
    }

    GoUI.Utils.domCreationDirector = function(children, domParent){
        if(!children) return;
        if(children instanceof Array){
            for (var i = 0, l = children.length; i < l; i++) {
                GoUI.Utils.domCreationDirector(children[i], domParent ? domParent : document.body);
            }
            return;
        }
        if(children instanceof Object){
            if(children.UIType && GoUI[capitaliseFirstLetter(children.UIType)]){
                var UIObject = new GoUI[capitaliseFirstLetter(children.UIType)](children, domParent ? domParent : document.body);
            }
        }
    }

    function capitaliseFirstLetter(string){
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    window.GoUI = GoUI;

    if( typeof module === 'object' ) {
        module.exports = GoUI;
    }
})();/**
*@author Gonster  ( gonster.github.io )
*/
var vertexShader ='varying vec3 vWorldPosition;'
    +'void main() {'
    +'   vec4 worldPosition = modelMatrix * vec4( position, 1.0 );'
    +'   vWorldPosition = worldPosition.xyz;'
    +'    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );'
    +'}';

var fragmentShader = 'uniform vec3 topColor;'
    +'uniform vec3 bottomColor;'
    +'uniform float offset;'
    +'uniform float exponent;'
    +'varying vec3 vWorldPosition;'
    +'void main() {'
    +    'float h = normalize( vWorldPosition + offset ).y;'
    +    'gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h, 0.0 ), exponent ), 0.0 ) ), 1.0 );'
    +'}';


AV.initialize("i5m1bad33f8bm725g0lan5wd8hhc1c4qhyz3cyq4b0qoyvja", "2w44ugxt0z512vitlk5in4c4a95acbyj8qiqlgcuh3p9xm5t");

(function( window, document, Base, THREE, Detector ) {
    //login alert flag
    var loginAlertFlag = false;

    //image download dom element
    var imageCaptureDomElement = document.createElement('a');
    imageCaptureDomElement.id = 'imageCapture';
    imageCaptureDomElement.style.display = 'none';    
    imageCaptureDomElement.target = '_blank';
    document.body.appendChild(imageCaptureDomElement);

    var Box = AV.Object.extend('Box');

    var box = new Box();

    var Keep = AV.Object.extend('Keep');

    var keep = new Keep();

    //utils
    function iterateTextures( isReversed ){
        var textureId = sidebarParams['textures'] + ((isReversed) ? -1 : 1 )
        var radio = document.getElementById('texture'+textureId);
        if(!radio){
            textureId = (isReversed) ? (materials.length - 1) : 0;
            radio = document.getElementById('texture'+textureId);
            if(!radio) return;
        }
        var isColor = radio.parentElement.className.indexOf('btn-color');
        var isImage = radio.parentElement.className.indexOf('btn-image');

        if(isColor > -1) {
            texturesButton.color = Number(radio.value);
            document.getElementById('colorTexture').parentElement.click();
        }
        else if(isImage > -1) {
            texturesButton.image = Number(radio.value);
            document.getElementById('imageTexture').parentElement.click();
        }
    }

    function insertAIntoB(a, b){
        var c = b.clone();
        for(var i in a){
            c[i] = a[i];
        }
        return c;
    }

    function downloadCanvasImage(domElement, filename) {
        if(getInternetExplorerVersion() !== -1){
            window.navigator.saveBlob = window.navigator.saveBlob || window.navigator.msSaveBlob;                
            if (domElement.msToBlob && window.navigator.saveBlob) {
                window.navigator.saveBlob(domElement.msToBlob(), filename);
            }
            else {
              alert('failed to save image, please use other tools to capture it.');
            } 
        }
        else{
            imageCaptureDomElement.href = domElement.toDataURL();
            imageCaptureDomElement.download = filename;
            imageCaptureDomElement.click();
        } 
    }

    function getInternetExplorerVersion()
    // Returns the version of Internet Explorer or a -1
    // (indicating the use of another browser).
    {
      var rv = -1; // Return value assumes failure.
      if (navigator.appName.indexOf("Internet Explorer")!=-1 || navigator.userAgent.toLowerCase().indexOf("trident")!=-1)
      {
        var ua = navigator.userAgent;
        var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
        if (re.exec(ua) != null)
          rv = parseFloat( RegExp.$1 );
        else{
            re  = new RegExp("rv:([0-9]{1,}[\.0-9]{0,})");
            if (re.exec(ua) != null)
              rv = parseFloat( RegExp.$1 );
        }
      }
      return rv;
    }

    function calcEventPagePosition(event){
        if ( event.pageX == null && event.clientX !=  null ) {  
            var doc = document.documentElement, body = document.body;  
            event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft  || body && body.clientLeft || 0);  
            event.pageY = event.clientY + (doc && doc.scrollTop  ||  body && body.scrollTop  || 0) - (doc && doc.clientTop  || body && body.clientTop  || 0);  
        } 
    }

    //classes
    var VoxelAnimationManager = function(endFlag){
        // this.animationCount = 0;     
        // this.animationIntervalHandler = [];
        this.endFlag = endFlag;
        this.currentAnimationIntervalHandler = -1;
        this.currentMeshes = [];
        this.currentIterator = 0;
    };

    VoxelAnimationManager.prototype = {  
        'asyncLoadDefaultInterval': 1,
        'loadBoxAnimation': function() {            
                
                var meshes = voxelAnimationManager.currentMeshes;
                if(voxelAnimationManager.currentIterator < meshes.length){
                    meshes[voxelAnimationManager.currentIterator].meshObject.visible = true;
                }
                else{
                    voxelAnimationManager.endFlag = true;
                    clearInterval(voxelAnimationManager.currentAnimationIntervalHandler);
                }
                voxelAnimationManager.currentIterator++;       

        },
        'begin': function(animation, meshes, interval){
            this.endFlag = false;
            this.currentMeshes = meshes;
            this.currentIterator = 0;
            this.currentAnimationIntervalHandler = setInterval( animation, interval || this.asyncLoadDefaultInterval );
            return;
        },
        'instantComplete': function(animation) {    
            if (this.endFlag === true) return;      
            var meshes = voxelAnimationManager.currentMeshes;
            clearInterval(this.currentAnimationIntervalHandler);
            while(this.currentIterator < meshes.length){
                animation();
            }
            this.endFlag = true;
        }
    };

    var VoxelPaintStorageManager = function(isLoadingBoxEnd){
        //loading animation flag   not end yet
        this.isLoadingBoxEnd = isLoadingBoxEnd;
    };

    VoxelPaintStorageManager.prototype = {
        'LOAD_TYPE': {
            'async': 0,
            'sync': 1
        },
        'storageKeys': {
            'meshes': 'vp_meshs',
            'camera': 'vp_camera',
            'sidebar': 'vp_sidebar',
            'boxId': 'vp_box_id',
            'updatedAt': 'vp_updatedAt',
            'boxName': 'vp_box_name',
            'localChanges': 'vp_local_changes'
        },
        'load': function(key) {
            return  window.localStorage && window.localStorage.getItem(key || this.storageKeys.meshes);
        },
        'save': function(key, data) {
            if( ! window.localStorage ) return;
            var save = '';
            if( ! data ){
                switch(key){
                    default:
                    case this.storageKeys.meshes:
                    case undefined:
                        if( ! this.isLoadingBoxEnd && actionRecorder.currentActionIndex < 0) return;
                        save += DEFAULT_BOX.width + ':';
                        for (var i = 0, l = cubeMeshes.length; i < l; i++) {
                            save += cubeMeshes[i].geo.id.replace('geo','') + ',';
                            save += cubeMeshes[i].material.id.replace('texture','') + ',';
                            save += cubeMeshes[i].meshObject.position.x + ',';
                            save += cubeMeshes[i].meshObject.position.y + ',';
                            save += cubeMeshes[i].meshObject.position.z + ';';
                        }
                        break;
                    case this.storageKeys.camera:
                        save += (base.controls.target.x + ',' + base.controls.target.y + ',' + base.controls.target.z + ';');
                        save += (base.controls.object.position.x + ',' + base.controls.object.position.y + ',' + base.controls.object.position.z + ';');
                        break;
                    case this.storageKeys.sidebar:
                        save += texturesButton.image + ',' + texturesButton.color + ',' + sidebarParams['texturesType'] + ',' + sidebarParams['sidebarResize'];
                        break;
                }
            }
            else save = data;
            window.localStorage.setItem(key || this.storageKeys.meshes, save);
        },
        'loadMeshes': function loadMeshes(key, loadType, animation, isNotLocalStorage) {
            this.isLoadingBoxEnd = false;
            var loadDataArray = []; 
            var boxWidth = DEFAULT_BOX.width; 
            {
                var load = isNotLocalStorage ? key : this.load(key);
                if(load) {
                    var array = load.split(':');
                    if(array){
                        if(array.length === 2){
                            boxWidth = ( Number(array[0]) || 50 ) / DEFAULT_BOX.width;
                            loadDataArray = array[1].split(';');
                        }
                        else{
                            boxWidth = 50 / DEFAULT_BOX.width;
                            loadDataArray = array[0].split(';');
                        }
                    }
                }
            }
            if(loadDataArray.length > 0){
                switch(loadType){
                    case this.LOAD_TYPE.sync:
                        for(var i = 0, l = loadDataArray.length; i < l; i++){
                            var currentData = loadDataArray[i].split(',');
                            if( currentData.length > 2 ){
                                //generate all meshes    visible
                                pen.draw( 
                                    Number(currentData[0]), 
                                    Number(currentData[1]), 
                                    [
                                        Number(currentData[2]) / boxWidth, 
                                        Number(currentData[3]) / boxWidth, 
                                        Number(currentData[4]) / boxWidth
                                    ]
                                );
                            }
                        }
                        this.isLoadingBoxEnd = true;
                        break;
                    default:
                    case this.LOAD_TYPE.async:
                        for(var i = 0, l = loadDataArray.length; i < l; i++){
                            var currentData = loadDataArray[i].split(',');
                            if( currentData.length > 2 ){
                                //generate all meshes    invisible
                                pen.draw( 
                                    Number(currentData[0]), 
                                    Number(currentData[1]), 
                                    [
                                        Number(currentData[2]) / boxWidth, 
                                        Number(currentData[3]) / boxWidth, 
                                        Number(currentData[4]) / boxWidth
                                    ], 
                                    undefined, 
                                    undefined, 
                                    true
                                );
                            }
                        }
                        voxelAnimationManager.begin(animation, cubeMeshes);
                        if(!isNotLocalStorage){
                            bubble('载入本地数据完成，左键单击可立即完成动画');
                        } 
                        else{
                            bubble('载入完成，左键单击可立即完成动画');
                        } 
                        break;
                }
            }
            else{
                bubble('无本地数据，新建文件');
                voxelAnimationManager.endFlag = true;
            }
        },
        'loadRemote': function loadRemote() {
            if( ! window.localStorage ) return;
            var boxId = this.load(this.storageKeys.boxId);
            var updatedAt = this.load(this.storageKeys.updatedAt);
            if(boxId) {
                bubble('载入云端文件...');
                var query = new AV.Query(Box);
                query.select('name', 'user');
                query.equalTo('objectId', boxId)
                query.first({
                    success: function(retrievedBox) {
                        if(retrievedBox.updatedAt === updatedAt) {
                            box = retrievedBox;
                            retrievedBox.set('meshes', voxelPaintStorageManager.load(voxelPaintStorageManager.storageKeys.meshes));
                            retrievedBox.set('camera', voxelPaintStorageManager.load(VoxelPaintStorageManager.storageKeys.camera));

                            voxelPaintStorageManager.loadCamera(box.get('camera'), true);
                            voxelPaintStorageManager.loadMeshes(box.get('meshes'), defaultLoadType, voxelAnimationManager.loadBoxAnimation, true);

                            voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.boxName, box.get('name'));
                            actionRecorder.changed = voxelPaintStorageManager.load(voxelPaintStorageManager.storageKeys.localChanges);
                        }
                        else{
                            box = retrievedBox;
                            if(retrievedBox.get('user').id === AV.User.current().id) {
                                var localChanges = actionRecorder.changed = voxelPaintStorageManager.load(voxelPaintStorageManager.storageKeys.localChanges);
                                if(localChanges === '0') {
                                    var q = new AV.Query(Box);
                                    q.get(retrievedBox.id, {
                                        success: function(currentBox) {
                                            box = currentBox;

                                            voxelPaintStorageManager.loadCamera(box.get('camera'), true);
                                            voxelPaintStorageManager.loadMeshes(box.get('meshes'), defaultLoadType, voxelAnimationManager.loadBoxAnimation, true);

                                            // voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.localChanges, '0');
                                            voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.boxName, box.get('name'));
                                            voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.updatedAt, box.updatedAt);
                                            voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.camera);
                                            voxelPaintStorageManager.save();
                                        },
                                        error: function(currentBox, error) {
                                            retrievedBox.set('meshes', voxelPaintStorageManager.load(voxelPaintStorageManager.storageKeys.meshes));
                                            retrievedBox.set('camera', voxelPaintStorageManager.load(VoxelPaintStorageManager.storageKeys.camera));

                                            voxelPaintStorageManager.loadMeshes(undefined, defaultLoadType, voxelAnimationManager.loadBoxAnimation);
                                        }
                                    });
                                }
                                else{
                                    bubble('由于本地此文件与云端文件在同一文件的基础上做了不同的改动，将本地版本与云端此文件视为不同的文件');

                                    box = new Box();
                                    voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.boxId,'');
                                    voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.updatedAt,'');
                                    voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.boxName,'');       
                                    voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.localChanges,'1');                
                                    this.changed = 1;

                                    voxelPaintStorageManager.loadMeshes(undefined, defaultLoadType, voxelAnimationManager.loadBoxAnimation);
                                }
                            }
                            else{
                                var q = new  AV.Query(Box);
                                q.get(retrievedBox.id, {
                                    success: function(currentBox) {
                                        box = currentBox;

                                        voxelPaintStorageManager.loadCamera(box.get('camera'), true);
                                        voxelPaintStorageManager.loadMeshes(box.get('meshes'), defaultLoadType, voxelAnimationManager.loadBoxAnimation, true);
                                    },
                                    error: function(currentBox, error) {
                                        voxelPaintStorageManager.loadMeshes(undefined, defaultLoadType, voxelAnimationManager.loadBoxAnimation);
                                    }
                                });
                            }
                        }
                    },
                    error: function(retrievedBox, error) {
                        bubble('载入失败，' + error.message);
                        voxelPaintStorageManager.loadMeshes(undefined, defaultLoadType, voxelAnimationManager.loadBoxAnimation);
                    }
                });
            }
            else {
                voxelPaintStorageManager.loadMeshes(undefined, defaultLoadType, voxelAnimationManager.loadBoxAnimation);
            }
        },
        'loadShared': function loadShared(objectId, errorCallback) {
            var q = new  AV.Query(Box);
            q.get(objectId, {
                success: function(currentBox) {
                    box = currentBox;

                    voxelPaintStorageManager.loadCamera(box.get('camera'), true);
                    voxelPaintStorageManager.loadMeshes(box.get('meshes'), defaultLoadType, voxelAnimationManager.loadBoxAnimation, true);

                    bubble('已载入分享文件');
                },
                error: function(currentBox, error) {
                    errorCallback();
                }
            });
        },
        'loadCamera': function loadCamera(key, isNotLocalStorage) {
            var loadDataArray = []; 
            {
                var load = isNotLocalStorage ? key : this.load(key);
                if(load) loadDataArray = load.split(';');
            }
            if(loadDataArray.length > 0){
                for(var i = 0, l = loadDataArray.length; i < l; i++){
                    var currentData = loadDataArray[i].split(',');
                    switch(i){
                        case 0:
                            base.controls.target.set(Number(currentData[0]) || 0, Number(currentData[1]) || 0, Number(currentData[2]) || 0);
                            break;
                        case 1:
                            base.controls.object.position.set(Number(currentData[0]) || 0, Number(currentData[1]) || 0, Number(currentData[2]) || 0);
                            break;
                    }
                }
                base.controls.update();
            }
        },
        'loadSidebarSelectedButtons': function loadSidebarSelectedButtons(key, isNotLocalStorage) {
            var loadDataArray = []; 
            {
                var load = isNotLocalStorage ? key : this.load(key);
                if(load) loadDataArray = load.split(',');
            }
            if(loadDataArray.length > 0){
                for(var i = 0, l = loadDataArray.length; i < l; i++){
                    var currentData = loadDataArray[i];
                    if(currentData === '' || isNaN(Number(currentData)) ) {}
                    else{
                        switch(i){
                            case 0:
                                texturesButton.image = Number(currentData) || 0;
                                break;
                            case 1:
                                texturesButton.color = Number(currentData) || 0;
                                break;
                            case 2:
                                if(Number(currentData) === 1){
                                    document.getElementById('colorTexture').parentElement.click();
                                }
                                else{
                                    document.getElementById('imageTexture').parentElement.click();
                                }
                                break;
                            case 3:
                                if(Number(currentData) === 1){
                                    document.getElementById('minSidebar').parentElement.click();
                                }
                                else{
                                    document.getElementById('normalSidebar').parentElement.click();
                                }
                                break;
                        }
                    }
                }
            }
            else{
                document.getElementById('imageTexture').parentElement.click();
            }
        }
    };


    var ActionRecorder = function () {
        this.currentActionIndex = -1;
        this.actionArray = [];
        this.isCurrentActionAlive = undefined;
        this.changed = '0';
    };

    ActionRecorder.prototype = {
        'undo': function() {
            var currentAction;
            if(this.currentActionIndex < 0) return;
            currentAction = this.actionArray[this.currentActionIndex];
            var reverseOperation = pen.reverseOperationMap[currentAction.type];
            var meshes= currentAction.meshes;
            if(meshes instanceof Array) {
            }
            else{
                meshes = [meshes];
            }
            for (var i = 0, l = meshes.length; i < l; i++) {
                var mesh = meshes[i];
                if(mesh){
                    switch(reverseOperation) {
                        case 'draw':
                            var mesh = pen.draw(
                                mesh.geo, 
                                mesh.material, 
                                [mesh.meshObject.position.x, mesh.meshObject.position.y, mesh.meshObject.position.z],
                                undefined,
                                mesh.meshObject
                            );
                            break;
                        case 'erase':
                            pen.erase(mesh.meshObject);
                            break;
                    }
                }
            }
            this.currentActionIndex--;
            this.updateDom();
        },
        'redo': function() {
            var currentAction;
            if(this.currentActionIndex >= (this.actionArray.length - 1)) return;
            currentAction = this.actionArray[this.currentActionIndex + 1];
            var sameOperation = currentAction.type;
            var meshes= currentAction.meshes;
            if(meshes instanceof Array) {
            }
            else{
                meshes = [meshes];
            }
            for (var i = 0, l = meshes.length; i < l; i++) {
                var mesh = meshes[i];
                if(mesh){
                    switch(sameOperation) {
                        case 'draw':
                            pen.draw(
                                mesh.geo, 
                                mesh.material, 
                                [mesh.meshObject.position.x, mesh.meshObject.position.y, mesh.meshObject.position.z],
                                undefined,
                                mesh.meshObject
                            );
                            break;
                        case 'erase':
                            pen.erase(mesh.meshObject);
                            break;
                    }
                }
            }
            this.currentActionIndex++;
            this.updateDom();
        },
        'addAction': function(actionType, mesh) {
            //截断
            this.actionArray.length = (this.currentActionIndex + 1 > -1) ? this.currentActionIndex + 1 : 0
            this.isCurrentActionAlive = true;
            var action = {
                'type': actionType,
                'meshes': mesh
            };
            this.actionArray.push(action);
            this.currentActionIndex++;
            this.updateDom();
            if(AV.User.current() && box && box.get('user') && (AV.User.current().id !==  box.get('user').id)) {
                if(confirm('确定要修改吗？（将会作为新建的文件覆盖本地保存的数据）')){
                    box = new Box();
                    voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.boxId,'');
                    voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.updatedAt,'');
                    voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.boxName,'');       
                    voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.localChanges,'1');     
                }
                else{
                    this.undo();
                    return;
                }
            }
            this.changed = 1;
        },
        'appendObjectToCurrentAction': function(actionType, mesh) {
            var currentAction = this.actionArray[this.currentActionIndex];

            if( this.isCurrentActionAlive !== true){
                this.addAction(actionType, mesh);
                return;
            }

            if(currentAction.meshes === undefined) {
                currentAction.meshes = mesh;
            }
            else{

                if(currentAction.meshes instanceof Array) {
                }
                else{
                    currentAction.meshes = [currentAction.meshes];
                }

                if(mesh instanceof Array) {
                    for (var i = 0, l = mesh.length; i < l; i++) {
                        currentAction.meshes.push(mesh[i]);
                    };
                }
                else{
                    currentAction.meshes.push(mesh);
                }

            }
        },
        'updateDom': function() {            
            document.getElementById('undo').disabled = (this.currentActionIndex < 0) ? true : false;
            document.getElementById('redo').disabled = (this.currentActionIndex >= (this.actionArray.length - 1)) ? true : false;
        }
    };


    var Pen = function(){        
        this.drawFlag = false;
    };

    function calculateIntersectResult(event) {
        calcEventPagePosition(event);
        mouseOnScreenVector.set( ( event.pageX / base.WINDOW_WIDTH ) * 2 - 1, - ( event.pageY / base.WINDOW_HEIGHT ) * 2 + 1 );
        raycaster.setFromCamera( mouseOnScreenVector, base.camera );
        return raycaster.intersectObjects( allIntersectableObjects );
    }

    function setMeshPositionToFitTheGrid(mesh,intersect) {
        if( ! intersect || ! mesh ) return;
        mesh.position.copy( intersect.point ).add( intersect.face.normal );
        mesh.position.divideScalar( DEFAULT_BOX.width )
        .floor()
        .multiplyScalar( DEFAULT_BOX.width )
        .addScalar( DEFAULT_BOX.width / 2.0 );
    }

    function updateHelperCube(intersects) {
        if( intersects.length > 0 ){
            var intersect = intersects[0];
            setMeshPositionToFitTheGrid( helperCube, intersect );
        }
    }

    Pen.prototype = {
        'calculateIntersectResult': calculateIntersectResult,
        'setMeshPositionToFitTheGrid': setMeshPositionToFitTheGrid,
        'updateHelperCube': updateHelperCube,
        'draw': function (geo, material, xyz, intersect, mesh, notVisibleInTheScene){

            var geoIndex,currentBoxGeometryParent,materialIndex,currentBoxMaterialParent;

            if(geo === undefined || typeof geo === 'number'){
                geoIndex = geo || 0;
                currentBoxGeometryParent = geometries[geoIndex];
            }
            else{
                currentBoxGeometryParent = geo;
            }

            if(material === undefined || typeof material === 'number'){
                materialIndex = material || 0;
                currentBoxMaterialParent = materials[materialIndex];
            }
            else{
                currentBoxMaterialParent = material;
            }

            var currentBoxGeometry = currentBoxGeometryParent.data;
            var currentBoxMaterial = currentBoxMaterialParent.data;
            var currentCube = mesh || new THREE.Mesh( currentBoxGeometry, currentBoxMaterial );
            currentCube.castShadow = true;
            currentCube.receiveShadow = true;
            intersect ? setMeshPositionToFitTheGrid( currentCube, intersect ) : currentCube.position.set(xyz[0], xyz[1], xyz[2]);
            (!notVisibleInTheScene) || (currentCube.visible = false);

            base.scene.add( currentCube );
            allIntersectableObjects.push( currentCube );

            cubeMeshes.push( { 'meshObject': currentCube,  'geo': currentBoxGeometryParent, 'material': currentBoxMaterialParent } );
            return cubeMeshes[cubeMeshes.length - 1];
        },
        'erase': function (intersectObject){
            base.scene.remove( intersectObject );
            var index = allIntersectableObjects.indexOf( intersectObject );
            if(index < 0) return undefined;
            allIntersectableObjects.splice( index , 1 );
            var mesh = cubeMeshes[index - 1];
            cubeMeshes.splice( index - 1, 1 );
            return mesh;
        },
        'reverseOperationMap': {
            'draw': 'erase',
            'erase': 'draw'
        }
    };


    //constants



    var DRAW_VOXEL_SAME_CUBE_DEFINITION = 3;
    THREE.ImageUtils.crossOrigin = 'Anonymous';
    var base;

    var DEFAULT_BOX = {
        'width': 50.0
    };

    var boxScale = DEFAULT_BOX.width / 50;

    var LIGHT_PARAMS = {
        'webgl': {
            'ambientLightColor': 0x303030,
            'directionalLightDensity': 0.8,
            'basePlaneSegments': 2,
            'basePlaneWidth': 50000.0 * boxScale,
            'basePlaneTextureRepeat': 80,
            'fogNear': 8000 * boxScale,
            'fogFar': 25000 * boxScale,
            'sphereRadius': 25000 * boxScale
        },
        'canvas': {
            'ambientLightColor': 0x909090,
            'directionalLightDensity': 1,
            'basePlaneSegments': 32,
            'basePlaneWidth': 6000.0 * boxScale,
            'basePlaneTextureRepeat': 16,
            'fogNear': 2000 * boxScale,
            'fogFar': 3000 * boxScale,
            'sphereRadius': 3000 * boxScale
        }
    }

    var basePlaneGeometry, basePlaneMesh, basePlaneMaterial;
    var reloadFlag = 0;

    var autoSaveInterval = 120*1000;
    var autoSaveIntervalHandler;
    var defaultLoadType = VoxelPaintStorageManager.prototype.LOAD_TYPE.async;
    var defaultTexturesButtonWidth = 50;

    var defaultMaterial = new THREE.MeshLambertMaterial( { color: 0x090909 } );

    var helperBoxMaterialDiff={        
        opacity: .5,
        transparent: true
    };

    var materials = [
        {
            'name': 'default',
            'type': 'color',
            'uniqueData': '#090909',
            'id': 'texture0',
            'data': defaultMaterial,
            'helperData': insertAIntoB(helperBoxMaterialDiff, defaultMaterial)
        }
    ];

    var defaultBoxGeometry = new THREE.BoxGeometry( DEFAULT_BOX.width, DEFAULT_BOX.width, DEFAULT_BOX.width, 1, 1, 1  );
    var geometries = [
        {
            'name': 'default',
            'type': '1',
            'id': 'geo0',
            'data': defaultBoxGeometry
        }
    ];

    var texturesButton = {
        'image': 30,
        'color' : 0 
    };
    var auxToggle = true;
    var sidebarParams = {
        'toolsType': 0,
        'toolsRadius': 0,
        'textures': 0,
        'texturesType': 0,
        'toggleAux': function(){
            (sidebarParams['toolsType'] === 1) || (helperCube.visible = ! helperCube.visible);
            // gridHelper.visible = ! gridHelper.visible;
            auxToggle = ! auxToggle;
        },
        'capture': function(){
            downloadCanvasImage( base.renderer.domElement, 'capture.png' );
        },
        'clearAll': function(){
            if( !voxelAnimationManager.endFlag ){
                voxelAnimationManager.instantComplete(voxelAnimationManager.loadBoxAnimation);
            }
            if (cubeMeshes.length < 1) return; 
            var mesh = pen.erase(cubeMeshes[0].meshObject);
            actionRecorder.addAction('erase', mesh);
            for (var i = 0, l = cubeMeshes.length; i < l; i++) {
                mesh = pen.erase(cubeMeshes[0].meshObject);
                actionRecorder.appendObjectToCurrentAction('erase', mesh);
            };
        },
        'undo': function(){
            actionRecorder.undo();
        },
        'redo': function(){
            actionRecorder.redo();   
        },
        'signInOpener': function(){
            $('#signInEmail').val('');
            $('#signInUsername').val('');
            $('#signInPassword').val('');
            $('#signInError').parent().hide();
            $('#signInModal').modal('show');            
            $('#signInEmail').focus();

        },     
        'loginOpener': function(){
            $('#loginUsername').val('');
            $('#loginPassword').val('');
            $('#loginError').parent().hide();
            $('#loginModal').modal('show');
            $('#loginUsername').focus();
        },   
        'logout': function(){
            if (AV.User.current()) {
                AV.User.logOut();
            }
            loginTrigger(false);
            bubble('已登出');
        },
        'save': function() {

            if(AV.User.current()){
                if (actionRecorder.changed === '0' && !box.id){                    
                            bubble('文件未做任何修改，将本地保存');
                }
                else{
                    var meshSave = '';
                    meshSave += DEFAULT_BOX.width + ':';
                    for (var i = 0, l = cubeMeshes.length; i < l; i++) {
                        meshSave += cubeMeshes[i].geo.id.replace('geo','') + ',';
                        meshSave += cubeMeshes[i].material.id.replace('texture','') + ',';
                        meshSave += cubeMeshes[i].meshObject.position.x + ',';
                        meshSave += cubeMeshes[i].meshObject.position.y + ',';
                        meshSave += cubeMeshes[i].meshObject.position.z + ';';
                    }

                    var cameraSave = '';
                    cameraSave += (base.controls.target.x + ',' + base.controls.target.y + ',' + base.controls.target.z + ';');
                    cameraSave += (base.controls.object.position.x + ',' + base.controls.object.position.y + ',' + base.controls.object.position.z + ';');
      
                    box.set('camera', cameraSave || '0,0,0;1000,500,1000');
                    box.set('meshes', meshSave || '');
                    if(!box.id){
                        var name =  prompt('请输入文件名', box.get('name') || voxelPaintStorageManager.load(voxelPaintStorageManager.storageKeys.boxName) || '未命名');
                        box.set('name', name || '未命名');
                        box.set('user', AV.User.current());
                        box.set('ACL', new AV.ACL(AV.User.current()));
                    }
                    box.save({
                        success: function(box) {
                            bubble('已保存至云端');
                            voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.updatedAt, box.updatedAt);
                            voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.boxId, box.id);
                            voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.boxName, box.get('name'));
                        },
                        error: function(box, error) {
                            bubble('云端保存失败，将会保存在本地' + error.message);
                            voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.boxName, box.get('name'));

                            actionRecorder.changed = '1';

                            voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.localChanges, '1');
                        }
                    });
                }
                actionRecorder.changed = '0';

                voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.localChanges, '0');
                voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.camera);
                voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.sidebar);
                voxelPaintStorageManager.save();
            }
            else{
                voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.camera);
                voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.sidebar);
                voxelPaintStorageManager.save();
                var info = '已保存在本地';
                if(!loginAlertFlag){
                    info += '，登录后可向云端保存多个文件';
                    loginAlertFlag = true;
                }
                bubble(info);
            }
        },
        newFile: function() {

            if(actionRecorder.changed === '0' || ( cubeMeshes.length < 1 && ( !box || (box && !box.id )))) {

            }
            else{
                if(confirm('是否保存当前文件？')) {
                    sidebarParams.save();
                }
            }

            sidebarParams.clearAll();
            actionRecorder = new ActionRecorder();
            actionRecorder.updateDom();
            box = new Box();
            voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.localChanges, '0');
            voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.camera);
            voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.sidebar);
            voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.updatedAt,'');
            voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.boxName,''); 
            voxelPaintStorageManager.save();
            bubble('新建'); 
        },
        'open': function() {

            document.getElementById('openIt').removeEventListener('click', onOpenItClick, false);
            document.getElementById('openIt').removeEventListener('click', onShareItClick, false);

            document.getElementById('openIt').addEventListener('click', onOpenItClick, false);
            var query = new AV.Query(Box);
            query.select('name');
            query.equalTo('user', AV.User.current());

            var query2 = new AV.Query(Keep);
            query2.select('name', 'box');
            query2.equalTo('user', AV.User.current());

            selectModalInit(query.find(), query2.find());

            $('#openModal .modal-body #boxTitle').text('我的文件');
            $('#openModal .modal-body #keepTitle').text('我的收藏');
        },
        share: function() {
            document.getElementById('openIt').removeEventListener('click', onOpenItClick, false);
            document.getElementById('openIt').removeEventListener('click', onShareItClick, false);

            document.getElementById('openIt').addEventListener('click', onShareItClick, false);
            var query = new AV.Query(Box);
            query.select('name');
            query.equalTo('user', AV.User.current());
            selectModalInit(query.find());

            $('#openModal .modal-body #boxTitle').text('我的文件');
            $('#openModal .modal-body #keepTitle').html('<div>分享链接：</div><input type="text" id="shareLink">');
        }
    };

    function selectModalInit(myPromise, keptPromise) {
            if(myPromise) 
            myPromise.then(
                function(results){
                    $('#openModal .modal-body #myBox').html('');
                    for(var i = 0, l = results.length;i < l; i++) {
                        $('#openModal .modal-body #myBox').append(
                          '<label class="btn btn-primary">'
                          + '  <input type="radio" name="boxData" id="boxData'+i+'" value="'+results[i].id+'" autocomplete="off">'
                          + '  <label id="boxDataLabel'+i+'"></label>'
                          + '</label>'
                        );
                        $('#openModal .modal-body #boxDataLabel'+i).text(results[i].get('name'));
                    }
                    $('#openModal').modal('show');
                }
            );
           if(keptPromise)
           keptPromise.then(
                function(results){
                    $('#openModal .modal-body #myKeep').html('');
                    for(var i = 0, l = results.length;i < l; i++) {
                        $('#openModal .modal-body #myKeep').append(
                          '<label class="btn btn-primary">'
                          + '  <input type="radio" name="boxData" id="boxData'+i+'" value="'+results[i].get('box').id+'" autocomplete="off">'
                          + '  <label id="boxDataLabel'+i+'"></label>'
                          + '</label>'
                        );
                        $('#openModal .modal-body #boxDataLabel'+i).text(results[i].get('box').get('name'));
                    }
                    $('#openModal').modal('show');
                }
            );

    }

    var currentBoxMaterialParentIndex = 0;
    var currentBoxMaterialParent = materials[0];
    var currentBoxMaterial = currentBoxMaterialParent.data;
    var currentHelperBoxMaterial = currentBoxMaterialParent.helperData;

    var currentBoxGeometryParentIndex = 0;
    var currentBoxGeometryParent = geometries[0];
    var currentBoxGeometry = currentBoxGeometryParent.data;

    var helperCube, currentCube;
    var gridHelper;
    var allIntersectableObjects = [];
    var cubeMeshes = [];
    var ambientLight, directionalLight, hemisphereLight, spotLight;
    var mouseOnScreenVector, mouseState = [0,0,0];
    var raycaster;
    var fog;

    var voxelAnimationManager = new VoxelAnimationManager();
    var voxelPaintStorageManager = new VoxelPaintStorageManager(false);
    var actionRecorder =new ActionRecorder();
    var pen = new Pen();


    function subInit() {
        //grid
        // gridHelper = new THREE.GridHelper( LIGHT_PARAMS[base.renderType].basePlaneWidth / 2.0, DEFAULT_BOX.width );
        // base.scene.add( gridHelper );

        //base plane
        basePlaneGeometry = new THREE.PlaneBufferGeometry( 
            LIGHT_PARAMS[base.renderType].basePlaneWidth, 
            LIGHT_PARAMS[base.renderType].basePlaneWidth, 
            LIGHT_PARAMS[base.renderType].basePlaneSegments, 
            LIGHT_PARAMS[base.renderType].basePlaneSegments
        );
        basePlaneGeometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );
        var basePlaneTexture = THREE.ImageUtils.loadTexture('texture/grasslight-big.jpg');
        var skyTexture = THREE.ImageUtils.loadTexture('texture/sky.jpg');
        basePlaneTexture.wrapT = basePlaneTexture.wrapS = THREE.RepeatWrapping;
        basePlaneTexture.repeat.set(
            LIGHT_PARAMS[base.renderType].basePlaneTextureRepeat, 
            LIGHT_PARAMS[base.renderType].basePlaneTextureRepeat
        );
        basePlaneMaterial = new THREE.MeshPhongMaterial( { ambient: 0xffffff, color: 0xddcc33, map: basePlaneTexture, bumpMap: basePlaneTexture, bumpScale: 3, specular: 0x335533, shininess: 15, emissive: 0xffffff} );        
        // basePlaneMaterial = new THREE.MeshLambertMaterial( {color: 0x33cc33} );        
        basePlaneMesh = new THREE.Mesh( basePlaneGeometry, basePlaneMaterial );
        basePlaneMesh.receiveShadow = true;
        basePlaneMesh.material.side = THREE.DoubleSide;
        // basePlaneMesh.visible = false;
        base.scene.add( basePlaneMesh );
        allIntersectableObjects.push( basePlaneMesh );

        //light
        ambientLight = new THREE.AmbientLight( LIGHT_PARAMS[base.renderType].ambientLightColor );
        base.scene.add( ambientLight );

        directionalLight = new THREE.DirectionalLight( 0xeeeeee, LIGHT_PARAMS[base.renderType].directionalLightDensity );
        directionalLight.position.set( 0, 6000, 5000 );
        directionalLight.target.position.set( 0, 0, 0 );
        directionalLight.castShadow = true;
        directionalLight.shadowCameraNear = base.camera.near;
        directionalLight.shadowCameraFar = base.camera.far;
        directionalLight.shadowCameraFov = base.cam
        directionalLight.shadowCameraTop = -1024 * boxScale;
        directionalLight.shadowCameraLeft = -1024 * boxScale;
        directionalLight.shadowCameraBottom = 1024 * boxScale;
        directionalLight.shadowCameraRight = 1024 * boxScale;
        directionalLight.shadowBias = .000020;
        directionalLight.shadowDarkness = 0.4;
        directionalLight.shadowMapWidth = 2048 * boxScale;
        directionalLight.shadowMapHeight = 2048 * boxScale;

        // directionalLight.shadowCameraVisible = true;
        // directionalLight.shadowCascade = true;
        // directionalLight.shadowCascadeCount = 3;
        // directionalLight.shadowCascadeNearZ = [ -1.000, 0.9, 0.975 ];
        // directionalLight.shadowCascadeFarZ  = [  0.9, 0.975, 1.000 ];
        // directionalLight.shadowCascadeWidth = [ 2048, 2048, 2048 ];
        // directionalLight.shadowCascadeHeight = [ 2048, 2048, 2048 ];
        // directionalLight.shadowCascadeBias = [ 0.00005, 0.000065, 0.000065 ];
        // directionalLight.shadowCascadeOffset.set( 0, 0, -1024 );
        
        base.scene.add( directionalLight );

        hemisphereLight = new THREE.HemisphereLight( 0xffffff, 0x606060, 1 );
        base.scene.add( hemisphereLight );

        // SKYDOME
        // var uniforms = {
        //     topColor:    { type: "c", value: new THREE.Color( 0x3366ff ) },
        //     bottomColor: { type: "c", value: new THREE.Color( 0xffffff ) },
        //     offset:      { type: "f", value: 200 },
        //     exponent:    { type: "f", value: .85 }
        // }
        // var tc = new THREE.Color();
        // uniforms.topColor.value.copy( tc.setHSL( 0.6, 2, 0.5 ));

        var skyGeo = new THREE.SphereGeometry( LIGHT_PARAMS[base.renderType].sphereRadius , 32, 15, 0, Math.PI * 2, 0, Math.PI / 2);
        // var skyMat = new THREE.ShaderMaterial( {
        //     uniforms: uniforms,
        //     vertexShader: vertexShader,
        //     fragmentShader: fragmentShader,
        //     side: THREE.BackSide,
        //     map: skyTexture
        // } );
        var skyMat  = new THREE.MeshLambertMaterial({color: 0x3366ff, map: skyTexture, side: THREE.BackSide, emissive: 0xffffff });
        var sky = new THREE.Mesh( skyGeo, skyMat );
        base.scene.add( sky );

        //helper cube
        helperCube = new THREE.Mesh( currentBoxGeometry, currentHelperBoxMaterial );
        helperCube.position.set( DEFAULT_BOX.width / 2.0, DEFAULT_BOX.width / 2.0, DEFAULT_BOX.width / 2.0 );
        base.scene.add( helperCube );

        //current cube
        currentCube = new THREE.Mesh( currentBoxGeometry, currentBoxMaterial );

        //intersection detector
        raycaster = new THREE.Raycaster();
        mouseOnScreenVector = new THREE.Vector2();

        //fog
        // fog = new THREE.Fog(0xeeffee, LIGHT_PARAMS[base.renderType].fogNear, LIGHT_PARAMS[base.renderType].fogFar);
        fog = new THREE.FogExp2( 0xffffff, 0.000053 );
        base.scene.fog = fog;

        base.controls.settings.boxScale = boxScale;

        base.renderer.setClearColor( 0xf0f0f0 );
        base.renderer.shadowMapEnabled = true;
        base.renderer.shadowMapType = THREE.PCFSoftShadowMap;
        base.renderer.shadowMapCullFace = THREE.CullFaceBack;
        base.renderer.gammaInput = true;
        base.renderer.gammaOutput = true;

        //listeners
        window.addEventListener('unload', onWindowBeforeUnload, false );
        window.addEventListener('reload', onWindowReload, false );
        base.renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
        base.renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
        base.renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );
        document.addEventListener( 'keydown', onDocumentKeyDown, false );
        document.addEventListener( 'keyup', onDocumentKeyUp, false );
        autoSaveIntervalHandler = setInterval(autoSave, autoSaveInterval);
    }




    function drawVoxel(intersectResult, isDrawOnSameVoxel, isEraseWhileMoving, isMouseMoving){
        var intersects = intersectResult || calculateIntersectResult(event);
        if( intersects.length > 0 ){
            var intersect = intersects[0];
            var currentToolsType = sidebarParams['toolsType'];

            var sameVoxelFlag = false;
            var aioLen = allIntersectableObjects.length;
            if(aioLen && intersect.object !== basePlaneMesh ){
                for(var i = aioLen - 1; i > 0 && i > aioLen - 1 - DRAW_VOXEL_SAME_CUBE_DEFINITION ; i--){
                    if(intersect.object === allIntersectableObjects[i]){
                        sameVoxelFlag=true;
                        break;
                    }
                }
            }
            //add a solid cube
            if(currentToolsType === 0){
                if((sameVoxelFlag === true && isDrawOnSameVoxel === false) || (sameVoxelFlag === false && isDrawOnSameVoxel === true)) return;
                   
                    var mesh = pen.draw(currentBoxGeometryParentIndex, currentBoxMaterialParentIndex, undefined, intersect);
                    if(isMouseMoving) actionRecorder.appendObjectToCurrentAction('draw', mesh);
                    else actionRecorder.addAction('draw', mesh);      
                    //instant render   grant next draw right              
                    base.renderer.render( base.scene, base.camera );
                return;
            }

            //remove cube
            if(currentToolsType === 1 && isEraseWhileMoving){
                if( intersect.object !== basePlaneMesh ) {
                    var mesh = pen.erase(intersect.object);
                    if(isMouseMoving) actionRecorder.appendObjectToCurrentAction('erase', mesh);
                    else actionRecorder.addAction('erase', mesh);
                    return;
                }
            }
        }
    }

    function autoSave(){
      if( (AV.User.current() && box && box.get('user') && AV.User.current().id !== box.get('user').id )){}
      else {
          voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.localChanges, actionRecorder.changed);
          voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.camera);
          voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.sidebar);
          voxelPaintStorageManager.save();

          // voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.boxName, box.get('name') || '');
          // voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.boxId, box.id || '');
          // voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.updatedAt, box.updatedAt || '');
      }
    }

    //listeners
    function onWindowBeforeUnload(event) {
        if(reloadFlag === 0){            
            if( (AV.User.current() && box && box.get('user') && AV.User.current().id !== box.get('user').id )){}
            else if(actionRecorder.changed === '0' || ( cubeMeshes.length < 1 && ( !box || (box && !box.id ))) || !AV.User.current) {
                voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.camera);
                voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.sidebar);
                voxelPaintStorageManager.save();
            }
            else{
                if(confirm('是否保存当前文件？')) {
                    sidebarParams.save();
                }
            }
        }
    }

    function onWindowReload(event) {
        reloadFlag = 1;
        if( (AV.User.current() && box && box.get('user') && AV.User.current().id !== box.get('user').id )){}
        else if(actionRecorder.changed === '0' || ( cubeMeshes.length < 1 && ( !box || (box && !box.id )))) {
            voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.localChanges, actionRecorder.changed);
            voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.camera);
            voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.sidebar);
            voxelPaintStorageManager.save();
        }
        else{
            if(confirm('是否保存当前文件？')) {
                sidebarParams.save();
            }
        }
    }

    function onWindowResize(event) {
        if( base.WINDOW_WIDTH !== window.innerWidth || base.WINDOW_HEIGHT !== window.innerHeight ){
            base.WINDOW_WIDTH = window.innerWidth;
            base.WINDOW_HEIGHT = window.innerHeight;
            base.WINDOW_HEIGHT_HALF = base.WINDOW_HEIGHT / 2.0;
            base.WINDOW_WIDTH_HALF = base.WINDOW_WIDTH / 2.0;

            base.camera.aspect = base.WINDOW_WIDTH / base.WINDOW_HEIGHT;
            base.camera.updateProjectionMatrix();
            base.renderer.setSize( base.WINDOW_WIDTH, base.WINDOW_HEIGHT );
            document.body.height = base.WINDOW_HEIGHT;
        }
    }

    var movingDrawLock = 0;
    function onDocumentMouseMove(event) {
        event.preventDefault();
        var intersects;
        var currentToolsType;
        
        if( mouseState[0] === 1) {
            try{
                if(movingDrawLock === 1) {
                    movingDrawLock = 0;
                    return;
                }
                movingDrawLock = 1;
                intersects = calculateIntersectResult(event);
                drawVoxel(intersects, event.ctrlKey, event.ctrlKey, true);
            }
            catch(e){
                console.warn('draw/erase failed');
            }
            finally{
                movingDrawLock = 0;
            }
        }
        else{
            currentToolsType = sidebarParams['toolsType'];
            if(currentToolsType === 1) {
                if(helperCube.visible) helperCube.visible = false;
            }
            else {
                if(!helperCube.visible && auxToggle) helperCube.visible = true;
                intersects = calculateIntersectResult(event);
                updateHelperCube(intersects);
            }
        }
        
    }

    // function onTouchMove( event ) {
    //     event.preventDefault();
    //     switch ( event.touches.length ) {
    //         case 1:
    //             break;
    //     }
    // }

    function onDocumentMouseDown(event) {        
        event.preventDefault();
        switch(event.button){
            case -1:
                break;
            case 0:
                if( !voxelAnimationManager.endFlag ){
                    voxelAnimationManager.instantComplete(voxelAnimationManager.loadBoxAnimation);
                    break;
                }
                mouseState[0] = 1;
                // onWindowResize();
                var intersects = calculateIntersectResult(event);
                drawVoxel(intersects, undefined, true, false);
                if(sidebarParams['toolsType'] === 0) updateHelperCube(intersects);
                break;
            case 1:
                mouseState[1] = 1;
                break;
            case 2:
                mouseState[2] = 1;
                break;
        }
    }

    function onSidebarBtnClick(event){
        if(this.nodeName.toLowerCase() === 'label'){
            var radio = this.getElementsByTagName('input')[0];
            sidebarParams[radio.name] = Number(radio.value);
            // console.log(sidebarParams);
            switch(radio.name){
                case 'toolsType':
                    var currentToolsType = Number(radio.value);
                    if(currentToolsType === 1) {
                        if(helperCube.visible) helperCube.visible = false;
                    }
                    else {
                        if(!helperCube.visible && auxToggle) helperCube.visible = true;
                    }
                    break;
                case 'textures':
                    currentBoxMaterialParentIndex = sidebarParams[radio.name];
                    currentBoxMaterialParent = materials[currentBoxMaterialParentIndex];
                    currentBoxMaterial = currentBoxMaterialParent.data;
                    currentHelperBoxMaterial = currentBoxMaterialParent.helperData = materials[sidebarParams[radio.name]].helperData || insertAIntoB(helperBoxMaterialDiff, currentBoxMaterial);
                    helperCube.material = currentHelperBoxMaterial;
                    document.getElementById('cube').parentElement.click();
                    switch(sidebarParams['texturesType']){
                        case 0:
                            texturesButton.image = radio.value;
                            break;
                        default:
                        case 1:                            
                            texturesButton.color = radio.value;
                            break;
                    }
                    break;
                case 'sidebarResize' :
                    var sidebar = GoUI.map['sidebar'].domElement;
                    if(radio.value === '0'){
                        $(sidebar).animate({top:'0',height:'100%'});
                    }
                    else{
                        $(sidebar).animate({top:'60%',height:'40%'});
                    }
                    break;
                case 'texturesType':
                    var type = radio.id;
                    if(type === 'imageTexture'){
                        $('.btn-color').hide();
                        $('.btn-image').show(); 
                        document.getElementById('texture'+texturesButton.image).parentElement.click();                  
                    }
                    else if(type === 'colorTexture'){
                        $('.btn-color').show();           
                        $('.btn-image').hide();                           
                        document.getElementById('texture'+texturesButton.color).parentElement.click();                                 
                    }
                    break;
            }
        }
        else if(this.type === 'button' || this.nodeName.toLowerCase() === 'button'){
            if(sidebarParams[this.id]) sidebarParams[this.id]();
        }
    }

    function onDocumentMouseUp(event) {
        switch(event.button){
            case -1:
                break;
            case 0:
                mouseState[0] = 0;
                actionRecorder.isCurrentActionAlive = false;
                break;
            case 1:
                mouseState[1] = 0;
                break;
            case 2:
                mouseState[2] = 0;
                break;
        }
    }

    function onDocumentKeyDown(event) {   
        switch(event.keyCode){
            //c
            case 67:
                iterateTextures();
                break;
            //x
            case 88:
                iterateTextures(true);
                break;
        }
    }

    function onDocumentKeyUp(event) {  
        if(mouseState[0]) return;    
        switch(event.keyCode){
            //shift
            case 16:
                if(sidebarParams['toolsType'] === 0){
                    document.getElementById('eraser').parentElement.click();
                }
                else if(sidebarParams['toolsType'] === 1){
                    document.getElementById('cube').parentElement.click();
                }
                break;
            //z
            case 90:
                if(event.ctrlKey) actionRecorder.undo();
                break;
            //y
            case 89:
                if(event.ctrlKey) actionRecorder.redo();
                break;
        }
    }

    function animate() {
        requestAnimationFrame( animate );
        base.renderer.render( base.scene, base.camera );
        base.stats.update();
    }

    //begin
    base = new Base( document.body );
    base.init( onWindowResize, subInit );
    animate();
    // var sidebar = new GoUI.Sidebar();
    var UI_JSON = {
            'UIType': 'sidebar',
            'id': 'sidebar',  
            'children':[     
                {                    
                    'UIType': 'buttonGroup',
                    'id': 'sidebarResize',
                    'name': 'sidebarResize',
                    'buttons':[
                        {
                            'title': ' + ',
                            'id': 'normalSidebar',
                            'checked': true
                        },
                        {
                            'title': ' -',
                            'id': 'minSidebar'
                        }
                    ] 
                },   
                {                    
                    'UIType': 'buttonGroup',
                    'id': 'accountControl',
                    'name': 'accountControl',
                    'buttonType': 'button',
                    'appendClass': 'btn-group-accountbtn',
                    'buttons':[
                        {
                            'title': '注册',
                            'id': 'signInOpener'
                        },
                        {
                            'title': '登录',
                            'id': 'loginOpener'
                        },
                        {
                            'title': '登出',
                            'id': 'logout'
                        },
                        {
                            'title': '登录后方可保存数据到云端',
                            'id': 'loginMessage'
                        }
                    ] 
                },
                // {
                //     'UIType': 'panel',
                //     'id': 'panel0',
                //     'title': '缩略图',
                //     'name': 'navigator',
                //     'children':[
                //         {
                //             'UIType': 'nav',
                //             'title': '缩略图',
                //             'id': 'map'
                //         }
                //     ]
                // },
                {
                    'UIType': 'panel',
                    'title': '画笔',
                    'name': 'tools',
                    'id': 'panel1',
                    'children':[
                        {
                            'UIType': 'Toolbar',
                            'id': 'toolbar0',
                            'children':[
                                {
                                    'UIType': 'buttonGroup',
                                    'title': '画笔类型(shift切换 按住ctrl方块堆叠或连续擦除)',
                                    'id': 'buttonGroup0',
                                    'name': 'toolsType',
                                    'buttons':[
                                        {
                                            'title': '方块',
                                            'id': 'cube',
                                            'checked': true
                                        },
                                        {
                                            'title': '擦除',
                                            'id': 'eraser'
                                        }
                                    ]    
                                }
                                // {
                                //     'UIType': 'buttonGroup',
                                //     'title': '画笔半径',
                                //     'id': 'buttonGroup1',
                                //     'name': 'toolsRadius',
                                //     'buttons':[
                                //         {
                                //             'title': '1',
                                //             'id': 'radius0',
                                //             'checked': true 
                                //         },
                                //         {
                                //             'title': '2',
                                //             'id': 'radius1'
                                //         },
                                //         {
                                //             'title': '4',
                                //             'id': 'radius2'
                                //         }
                                //     ]
                                // }
                            ]
                        }
                    ]
                },
                {
                    'UIType': 'panel',
                    'title': '文件',
                    'name': 'files',
                    'id': 'panelFiles',
                    'children':[
                        {
                            'UIType': 'buttonGroup',
                            'id': 'currentFileNameGroup',
                            'name': 'cfn',
                            'buttonType': 'button',
                            'appendClass': 'btn-group-cfnbtn',
                            'buttons':[
                                {
                                    'title': '',
                                    'id': 'currentFileName'
                                }
                            ]                                
                        },
                        {
                            'UIType': 'buttonGroup',
                            'id': 'currentFileStateGroup',
                            'name': 'cfs',
                            'buttonType': 'button',
                            'appendClass': 'btn-group-cfsbtn',
                            'buttons':[
                                {
                                    'title': '',
                                    'id': 'currentFileState'
                                }
                            ]                                
                        },
                        {
                            'UIType': 'buttonGroup',
                            'id': 'buttonGroupADM',
                            'name': 'adm',
                            'buttonType': 'button',
                            'appendClass': 'btn-group-toolbtn',
                            'buttons':[
                                {
                                    'title': '新建',
                                    'id': 'newFile'
                                },
                                {
                                    'title': '保存',
                                    'id': 'save'
                                },
                                {
                                    'title': '收藏',
                                    'id': 'keep'
                                },
                                {
                                    'title': '打开...',
                                    'id': 'open'
                                },
                                {
                                    'title': '插入...',
                                    'id': 'insert'
                                },
                                {
                                    'title': '删除...',
                                    'id': 'delete'
                                },
                                {
                                    'title': '共享...',
                                    'id': 'share'
                                }
                            ]                                
                        }
                    ]
                },
                {
                    'UIType': 'panel',
                    'title': '其他功能',
                    'name': 'tools',
                    'id': 'panel3',
                    'children':[
                        {
                            'UIType': 'buttonGroup',
                            'title': '',
                            'id': 'buttonGroup3',
                            'name': 'aux',
                            'buttonType': 'button',
                            'appendClass': 'btn-group-toolbtn',
                            'buttons': [
                                {
                                    'title': '辅助物体开关',
                                    'id': 'toggleAux'
                                },
                                {
                                    'title': '截图',
                                    'id': 'capture'
                                },
                                {
                                    'title': '清空',
                                    'id': 'clearAll'
                                }
                            ]
                        },
                        {
                            'UIType': 'Toolbar',
                            'id': 'toolbar1',
                            'children':[
                                {
                                    'UIType': 'buttonGroup',
                                    'id': 'buttonGroup3',
                                    'name': 'actions',
                                    'buttonType': 'button',
                                    'appendClass': 'btn-group-toolbtn',
                                    'buttons':[
                                        {
                                            'title': '撤销',
                                            'id': 'undo'
                                        },
                                        {
                                            'title': '重做',
                                            'id': 'redo'
                                        }
                                    ]    
                                }
                            ]
                        }
                    ]
                },
                {
                    'UIType': 'panel',
                    'title': '材料',
                    'name': 'tools',                
                    'id': 'panel2',
                    'overflow': 'hidden',
                    'children':[
                        {
                            'UIType': 'buttonGroup',
                            'title': '',
                            'id': 'buttonGroupTexturesType',
                            'name': 'texturesType',
                            'buttons':[
                                {
                                    'title': '贴图',
                                    'id': 'imageTexture',
                                    'checked': true  
                                },
                                {
                                    'title': '颜色',
                                    'id': 'colorTexture'
                                }
                            ]
                        },
                        {
                            'UIType': 'buttonGroup',
                            'title': '材料',
                            'id': 'buttonGroup2',
                            'name': 'textures',
                            'appendClass': 'btn-group-rect',
                            'buttons':[
                                {
                                    'title': '',
                                    'id': 'texture0',
                                    'bgType': materials[0].type,
                                    'bgTypeData': materials[0].uniqueData,
                                    'width': defaultTexturesButtonWidth,
                                    'height': defaultTexturesButtonWidth,
                                    'checked': true  
                                }
                            ]
                        }
                    ]
                }
            ]
        };

    if(base.WINDOW_WIDTH < 600) {
        var children = UI_JSON['children'];
        for(var i = 0, l = children.length; i < l; i++) {
            if(children[i].id === 'sidebarResize'){
                var bottons = children[i].buttons;

                for(var j = 0, l = bottons.length; j < l; j++) {
                    if(bottons[j].id === 'normalSidebar') delete bottons[j].checked;
                    if(bottons[j].id === 'minSidebar') bottons[j].checked = true;
                }
                break;
            }
        }
        sidebarParams['sidebarResize'] = 1;
    }
    else{
        sidebarParams['sidebarResize'] = 0;
    }

    GoUI.Utils.domCreationDirector(UI_JSON);

    actionRecorder.updateDom();
    
    //sidebar event management
    var domArray = document.querySelectorAll('.btn');
    if(domArray instanceof Array || domArray.length){
        for (var i = domArray.length - 1; i >= 0; i--) {
            domArray[i].addEventListener('click', onSidebarBtnClick, false);
        }
    }
    else{
        if(domArray instanceof object){
            domArray.addEventListener('click', onSidebarBtnClick, false);
        }
    }

    //load other textures
    function loadSidebarTextures(raw){

    }

    var basicColors = [
        {'color': '#333333'},{'color': '#7f7f7f'},{'color': '#c3c3c3'},{'color': '#ffffff'},
        {'color': '#b97a57'},{'color': '#ff7f27'},{'color': '#880015'},{'color': '#ed1c24'},{'color': '#ffaec9'},
        {'color': '#ffc90e'},{'color': '#fff200'},{'color': '#efe4b0'},{'color': '#22b14c'},{'color': '#b5e61d'},
        {'color': '#00a2e8'},{'color': '#3f48cc'},{'color': '#7092be'},{'color': '#a349a4'},{'color': '#c8bfe7'},
        {'color': '#66ccff'},{'color': '#ff6600'},{'color': '#cc3333'},{'color': '#ffcc33'},{'color': '#33cc99'},
        {'color': '#ff55cc'},{'color': '#b1eb00'},{'color': '#b1eb88'},{'color': '#ff85cb'},{'color': '#ff432e'}
        // ,
        // {'color': '#000000'},{'color': '#000000'},{'color': '#000000'},{'color': '#000000'},{'color': '#000000'},
        // {'color': '#000000'},{'color': '#000000'},{'color': '#000000'},{'color': '#000000'},{'color': '#000000'},
        // {'color': '#000000'},{'color': '#000000'},{'color': '#000000'},{'color': '#000000'},{'color': '#000000'},
        // {'color': '#000000'},{'color': '#000000'},{'color': '#000000'},{'color': '#000000'},{'color': '#000000'}
    ];

    for (var i = 0, l = basicColors.length ; i < l; i++) {
        var m ={
            'name': basicColors[i].color,
            'type': 'color',
            'id': 'texture' + (i+1),
            'uniqueData': basicColors[i].color,
            'data': new THREE.MeshLambertMaterial( { color: basicColors[i].color } )
        }
        materials.push(m);

        GoUI.map['buttonGroup2'].addButton({
            'title': '',
            'id': m.id,
            'bgType': m.type,
            'bgTypeData': m.uniqueData,
            'width': defaultTexturesButtonWidth,
            'height': defaultTexturesButtonWidth
        }).addEventListener('click', onSidebarBtnClick, false);
    }

    var texturePaths = [
        'texture/grass.png',
        'texture/sand.png',
        'texture/glass.png',
        'texture/rock.png',
        'texture/clay.png',
        'texture/dirt.png',
        'texture/bark.png',
        'texture/slats.png'
    ];


    for (var i = 0, l = texturePaths.length ; i < l; i++) {
        var m ={
            'name': texturePaths[i].replace('texture/','').replace('.png',''),
            'type': 'image',
            'id': 'texture' +materials.length,
            'uniqueData': texturePaths[i],
            'data': new THREE.MeshLambertMaterial( { map: THREE.ImageUtils.loadTexture(texturePaths[i]), transparent: true } )
        }
        if(m.data.name === 'glass') m.data.map.opacity = 0.3;
        m.data.map.magFilter = THREE.NearestFilter;
        m.data.map.minFilter = THREE.LinearMipMapLinearFilter;
        materials.push(m);

        GoUI.map['buttonGroup2'].addButton({
            'title': '',
            'id': m.id,
            'bgType': m.type,
            'bgTypeData': m.uniqueData,
            'width': defaultTexturesButtonWidth,
            'height': defaultTexturesButtonWidth
        }).addEventListener('click', onSidebarBtnClick, false);
    }

     function onLoginClick() {
        var username = $('#loginUsername').val();
        var password = $('#loginPassword').val();
        var loginBtn = $('#login');

        loginBtn.attr('disabled', 'disabled');

        if (AV.User.current()) {
            AV.User.logOut();
        }
        AV.User.logIn(username, password, {
            success:function(user) {
                loginTrigger(true);
                loginBtn.removeAttr('disabled');
                $('#loginModal').modal('hide');
                bubble('你好' + AV.User.current().escape('username'));
                $('#loginUsername').val('');
                $('#loginPassword').val('');
                voxelPaintStorageManager.loadRemote();
            },
            error: function(user, error) {
                $('#loginError').html(error.message);
                $('#loginError').parent().show();
                loginBtn.removeAttr('disabled');
            }
        });
    }

    $('#loginUsername').on('keyup', function(event){
        if(event.which===13) document.getElementById('login').click();
    });
    $('#loginPassword').on('keyup', function(event){
        if(event.which===13) document.getElementById('login').click();
    });

   function onSignInClick() {
        var email = $('#signInEmail').val();
        var username = $('#signInUsername').val();
        var password = $('#signInPassword').val();
        var signInBtn = $('#signIn');

        signInBtn.attr('disabled', 'disabled');

        if (AV.User.current()) {
            AV.User.logOut();
        }
        AV.User.signUp(username, password, { ACL: new AV.ACL(), email: email }, {
            success:function(user) {
                loginTrigger(true);
                signInBtn.removeAttr('disabled');
                $('#signInModal').modal('hide');
                bubble('你好' + AV.User.current().escape('username'));
                $('#signInEmail').val('');
                $('#signInUsername').val('');
                $('#signInPassword').val('');
                voxelPaintStorageManager.loadRemote();
            },
            error: function(user, error) {
                $('#signInError').html(error.message);
                $('#signInError').parent().show();
                signInBtn.removeAttr('disabled');
            }
        });
    }

    function onOpenItClick() {

        document.getElementById('openIt').removeEventListener('click', onOpenItClick, false);
        if(actionRecorder.changed === '0' || ( cubeMeshes.length < 1 && ( !box || (box && !box.id )))) {

        }
        else{
            if(confirm('是否保存当前文件？')) {
                sidebarParams.save();
            }
        }

        var oi = $('#openModal input[type=radio]:checked').val();
        if(oi) {
            var query = new AV.Query(Box);
            query.get( oi, {
                success: function(currentBox) {
                    sidebarParams.clearAll();
                    actionRecorder = new ActionRecorder();
                    actionRecorder.updateDom();
                    box = currentBox;
                    voxelPaintStorageManager.loadCamera(currentBox.get('camera'), true);
                    voxelPaintStorageManager.loadMeshes(currentBox.get('meshes'), defaultLoadType, voxelAnimationManager.loadBoxAnimation, true);
                    if(currentBox.get('user').id === AV.User.current().id) {
                        voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.localChanges, '0');
                        voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.boxName, box.get('name'));
                        voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.boxId, box.id);
                        voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.updatedAt, box.updatedAt);
                        voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.camera);
                        voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.sidebar);
                        voxelPaintStorageManager.save();
                    }
                }
            });
        }
        $('#openModal').modal('hide');
        
    }

    function onShareItClick() {
        document.getElementById('openIt').removeEventListener('click', onShareItClick, false);
        var oi = $('#openModal input[type=radio]:checked').val();
        if(oi) {
            var query = new AV.Query(Box);
            query.equalTo('objectId', oi);
            query.select('shared');
            query.first().then(
                function(currentBox) {
                    if(!currentBox.get('shared')){
                        var acl = new AV.ACL(AV.User.current());
                        acl.setPublicReadAccess(true);
                        currentBox.setACL(acl);
                        currentBox.set('shared', true);
                        currentBox.save().then(
                            function(){},
                            function(){
                                bubble('分享失败');
                            }
                        );
                    }
                    $('#shareLink').val('http://gonster.github.io/helloThreeJS/voxel-paint#'+oi);
                    bubble('分享成功，可通过显示的链接打开分享内容');
                }
            );
        }
    }

    document.getElementById('login').addEventListener('click', onLoginClick, false);
    document.getElementById('signIn').addEventListener('click', onSignInClick, false);


    voxelPaintStorageManager.loadCamera(voxelPaintStorageManager.storageKeys.camera);
    voxelPaintStorageManager.loadSidebarSelectedButtons(voxelPaintStorageManager.storageKeys.sidebar);

    function loginTrigger(flag){
        if(flag) {            
            $('#loginOpener').hide();
            $('#logout').show();
            $('#signInOpener').hide();            
            $('#loginMessage').html('你好 ' + AV.User.current().escape('username'));
            $('#loginMessage').show();
            $('#open').removeAttr('disabled');
            $('#newFile').removeAttr('disabled');
            $('#share').removeAttr('disabled');
            $('#delete').removeAttr('disabled');
            $('#insert').removeAttr('disabled');
        }
        else{
            $('#loginOpener').show();
            $('#logout').hide();
            $('#signInOpener').show();
            $('#loginMessage').hide();
            $('#open').attr('disabled', 'disabled');
            $('#newFile').attr('disabled', 'disabled');
            $('#share').attr('disabled', 'disabled');
            $('#delete').attr('disabled', 'disabled');
            $('#insert').attr('disabled', 'disabled');
        }
    }


    function updateFileInfo() {
        var filename = box.name || '未命名';
        var filestate = (actionRecorder.changed === '0' ? '未修改' : '已修改') + (box.id ? ' - 云端存储' : ' - 本地存储');
        $('#currentFileName').text('文件名：'+filename);    
        $('#currentFileState').text('文件状态：'+filestate);
    }

    function bubble(info) {
        GoUI.Animation.bubble($('#bubble'), info);
        updateFileInfo();
    }
    
    
    if (AV.User.current()) {
        loginTrigger(true);

        var shareHash = window.location.hash;
        if(shareHash) {
            shareHash = shareHash.substring(1);
            voxelPaintStorageManager.loadShared(shareHash, function() {                
                bubble('载入分享文件失败');
                voxelPaintStorageManager.loadRemote();
            });
        }
        else{
            voxelPaintStorageManager.loadRemote();
        }
    } 
    else {
        loginTrigger(false);

        var shareHash = window.location.hash;
        if(shareHash) {
            shareHash = shareHash.substring(1);
            voxelPaintStorageManager.loadShared(shareHash, function() {
                bubble('载入分享文件失败');
                voxelPaintStorageManager.loadMeshes(undefined, defaultLoadType, voxelAnimationManager.loadBoxAnimation);
            });
        }
        else{
            voxelPaintStorageManager.loadMeshes(undefined, defaultLoadType, voxelAnimationManager.loadBoxAnimation);
        }
    }
    
    window.addEventListener("hashchange", function(){
        var shareHash = window.location.hash;
        if(shareHash) {
            shareHash = shareHash.substring(1);
            voxelPaintStorageManager.loadShared(shareHash, function(){
                bubble('载入分享文件失败');
            });
        }
    }, false);

})( window, document, Base, THREE, Detector);