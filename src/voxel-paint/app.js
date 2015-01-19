(function ( window, document, Base, THREE, Detector ) {
    //constants
    var DEFAULT_BOX = {
        "width": 50.0
    };
    var DEFAULT_PLANE = {
        "width": 10000.0,
        "height": 10000.0
    }

    var base;
    var basePlaneGeometry, basePlaneMesh;
    // var textureMappings = {
    //     "default": THREE.ImageUtils.loadTexture( "texture/atlas.png" )
    // };
    var defaultBoxGeometry = new THREE.BoxGeometry( DEFAULT_BOX.width, DEFAULT_BOX.width, DEFAULT_BOX.width  );
    var currentBoxMaterial = new THREE.MeshLambertMaterial( { 
        color: 0xfeb74c,
        ambient: 0x00ff80, 
        shading: THREE.FlatShading, 
        // map: textureMappings["default"]
    } );
    var currentHelperBoxMaterial = new THREE.MeshLambertMaterial( { 
        color: 0xfeb74c,
        ambient: 0x00ff80, 
        shading: THREE.FlatShading, 
        // map: textureMappings["default"],
        opacity: .5,
        transparent: true
    } );
    var helperCube, currentCube;
    var gridHelper;
    var allIntersectableObjects = [];
    var cubeMeshes = [];
    var ambientLight, directionalLight, soloPointLight;
    var mouseOnScreenVector;
    var raycaster;

    function onWindowResize(event) {

        base.WINDOW_WIDTH = window.innerWidth;
        base.WINDOW_HEIGHT = window.innerHeight;
        base.WINDOW_HEIGHT_HALF = base.WINDOW_HEIGHT / 2.0;
        base.WINDOW_WIDTH_HALF = base.WINDOW_WIDTH / 2.0;

        base.camera.aspect = base.WINDOW_WIDTH / base.WINDOW_HEIGHT;
        base.camera.updateProjectionMatrix();
        base.renderer.setSize( base.WINDOW_WIDTH, base.WINDOW_HEIGHT );

    }

    function calculateIntersectResult(event) {
        mouseOnScreenVector.set( ( event.clientX / base.WINDOW_WIDTH ) * 2 - 1, - ( event.clientY / base.WINDOW_HEIGHT ) * 2 + 1 );
        raycaster.setFromCamera( mouseOnScreenVector, base.camera );
        return raycaster.intersectObjects( allIntersectableObjects );
    }

    function setMeshPositionToFitTheGrid(mesh,intersect) {
            mesh.position.copy( intersect.point ).add( intersect.face.normal );
            mesh.position.divideScalar( DEFAULT_BOX.width )
            .floor()
            .multiplyScalar( DEFAULT_BOX.width )
            .addScalar( DEFAULT_BOX.width / 2.0 );
    }

    function onDocumentMouseMove(event) {
        event.preventDefault();
        var intersects = calculateIntersectResult(event);
        if( intersects.length > 0 ){
            var intersect = intersects[0];
            setMeshPositionToFitTheGrid( helperCube, intersect );
        }

        base.renderer.render( base.scene, base.camera );
    }

    function onDocumentMouseDown(event) {        
        event.preventDefault();
        var intersects = calculateIntersectResult(event);
        if( intersects.length > 0 ){
            var intersect = intersects[0];
            //add a solid cube
            if( event.which === 1 ) {
                var currentCube = new THREE.Mesh( defaultBoxGeometry, currentBoxMaterial );
                setMeshPositionToFitTheGrid ( currentCube, intersect );
                base.scene.add( currentCube );
                allIntersectableObjects.push( currentCube );
                cubeMeshes.push( currentCube );
                onDocumentMouseMove(event);
                return;
            }
            //remove cube
            if(event.which === 2 ){
                if( intersect.object !== basePlaneMesh ) {
                    base.scene.remove( intersect.object );
                    allIntersectableObjects.splice( allIntersectableObjects.indexOf( intersect.object ), 1 );
                    cubeMeshes.splice( cubeMeshes.indexOf( intersect.object ), 1 );
                    onDocumentMouseMove(event);
                }
            }
        }
    }

    function onDocumentKeyDown(event) {        
    }

    function onDocumentKeyUp(event) {        
    }

    function subInit() {
        //grid
        gridHelper = new THREE.GridHelper( DEFAULT_PLANE.width / 2.0, DEFAULT_BOX.width );
        base.scene.add( gridHelper );

        //base plane
        basePlaneGeometry = new THREE.PlaneBufferGeometry( DEFAULT_PLANE.width, DEFAULT_PLANE.height );
        basePlaneGeometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );
        basePlaneMesh = new THREE.Mesh( basePlaneGeometry );
        basePlaneMesh.visible = false;
        base.scene.add( basePlaneMesh );
        allIntersectableObjects.push( basePlaneMesh );

        //light
        ambientLight = new THREE.AmbientLight( 0x606060 );
        base.scene.add( ambientLight );
        directionalLight = new THREE.DirectionalLight( 0xffffff );
        directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
        base.scene.add( directionalLight );

        //helper cube
        helperCube = new THREE.Mesh( defaultBoxGeometry, currentHelperBoxMaterial );
        helperCube.position.set( DEFAULT_BOX.width / 2.0, DEFAULT_BOX.width / 2.0, DEFAULT_BOX.width / 2.0 );
        base.scene.add( helperCube );

        //current cube
        currentCube = new THREE.Mesh( defaultBoxGeometry, currentBoxMaterial );

        //intersection detector
        raycaster = new THREE.Raycaster();
        mouseOnScreenVector = new THREE.Vector2();

        base.renderer.setClearColor( 0xf0f0f0 );

        //listeners
        base.renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
        base.renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
        document.addEventListener( 'keydown', onDocumentKeyDown, false );
        document.addEventListener( 'keyup', onDocumentKeyUp, false );
    }

    function animate() {
        requestAnimationFrame( animate );
        base.renderer.render( base.scene, base.camera );
    }

    base = new Base( document.body );
    base.init( onWindowResize, subInit );
    animate();
    // var sidebar = new GoUI.Sidebar();
    GoUI.Utils.domCreationDirector({
        'UIType': 'sidebar',
        'id': 'sidebar',  
        'children':[
            {
                'UIType': 'panel',
                'title': '缩略图',
                'name': 'navigator',
                'children':[
                    {
                        'UIType': 'nav',
                        'title': '缩略图',
                        'id': 'map'
                    }
                ]
            },
            {
                'UIType': 'panel',
                'title': '画笔类型/半径',
                'name': 'tools',
                'children':[
                    {
                        'UIType': 'buttonGroup',
                        'title': '类型',
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
                    },
                    {
                        'UIType': 'buttonGroup',
                        'title': '画笔半径',
                        'name': 'toolsRadius',
                        'buttons':[
                            {
                                'title': '1',
                                'id': '1',
                                'checked': true 
                            },
                            {
                                'title': '2',
                                'id': '2'
                            },
                            {
                                'title': '4',
                                'id': '4'
                            }
                        ]
                    }
                ]
            },
            {
                'UIType': 'panel',
                'title': '材料',
                'name': 'tools',
                'overflow': 'hidden',
                'children':[
                    {
                        'UIType': 'buttonGroup',
                        'title': '材料',
                        'name': 'textures',
                        'buttons':[
                            {
                                'title': '1',
                                'id': '1',  
                                'checked': true  
                            },
                            {
                                'title': '2',
                                'id': '2'
                            },
                            {
                                'title': '3',
                                'id': '3'       
                            },
                            {
                                'title': '4',
                                'id': '4'
                            },
                            {
                                'title': '4',
                                'id': '4'       
                            },
                            {
                                'title': '5',
                                'id': '5'
                            },
                            {
                                'title': '6',
                                'id': '6'       
                            },
                            {
                                'title': '7',
                                'id': '7'
                            },
                            {
                                'title': '8',
                                'id': '8'       
                            },
                            {
                                'title': '9',
                                'id': '9'
                            },
                            {
                                'title': '10',
                                'id': '10'
                            }
                        ]
                    }
                ]
            }
        ]
    });

})( window, document, Base, THREE, Detector );