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

    var defaultTexturesButtonWidth = 60;

    var defaultMaterial = new THREE.MeshLambertMaterial( { color: 0x86b74c } );

    var helperCubeMaterialDiff={        
        opacity: .5,
        transparent: true
    };

    var materials = [
        {
            'name': 'default',
            'type': 'color',
            'abstract': '#86b74c',
            'data': defaultMaterial,
            'helperData': insertAIntoB(helperCubeMaterialDiff, defaultMaterial)
        }
    ];

    var defaultBoxGeometry = new THREE.BoxGeometry( DEFAULT_BOX.width, DEFAULT_BOX.width, DEFAULT_BOX.width  );
    var geometries = [
        {
            'name': 'default',
            'type': '1',
            'data': defaultBoxGeometry
        }
    ];

    var sidebarParams = {
        'toolsType': 0,
        'toolsRadius': 0,
        'textures': 0
    };

    var currentBoxMaterial = defaultMaterial;
    var currentHelperBoxMaterial = materials[0].helperData;
    var helperCube, currentCube;
    var gridHelper;
    var allIntersectableObjects = [];
    var cubeMeshes = [];
    var ambientLight, directionalLight, soloPointLight;
    var mouseOnScreenVector;
    var raycaster;

    function insertAIntoB(a, b){
        var c = b.clone();
        for(var i in a){
            c[i] = a[i];
        }
        return c;
    }

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
            if( event.button === 0 ) {
                var currentToolsType = sidebarParams['toolsType'];
                //add a solid cube
                if(currentToolsType === 0){
                    var currentCube = new THREE.Mesh( defaultBoxGeometry, currentBoxMaterial );
                    setMeshPositionToFitTheGrid ( currentCube, intersect );
                    base.scene.add( currentCube );
                    allIntersectableObjects.push( currentCube );
                    cubeMeshes.push( currentCube );
                    onDocumentMouseMove(event);
                    return;
                }

                //remove cube
                if(currentToolsType === 1){
                    if( intersect.object !== basePlaneMesh ) {
                        base.scene.remove( intersect.object );
                        allIntersectableObjects.splice( allIntersectableObjects.indexOf( intersect.object ), 1 );
                        cubeMeshes.splice( cubeMeshes.indexOf( intersect.object ), 1 );
                        onDocumentMouseMove(event);
                    }
                }
            }
        }
    }

    function onDocumentKeyDown(event) {   

    }

    function onDocumentKeyUp(event) {      
        switch(event.keyCode){
            case 16:
                if(sidebarParams['toolsType'] === 0){
                    document.getElementById('eraser').parentElement.click();
                }
                else if(sidebarParams['toolsType'] === 1){
                    document.getElementById('cube').parentElement.click();
                }
                break;
        }
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
        ambientLight = new THREE.AmbientLight( 0x505050 );
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
                'id': 'panel0',
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
                'id': 'panel1',
                'children':[
                    {
                        'UIType': 'Toolbar',
                        'id': 'toolbar0',
                        'children':[
                            {
                                'UIType': 'buttonGroup',
                                'title': '类型(shift)',
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
                            },
                            {
                                'UIType': 'buttonGroup',
                                'title': '画笔半径',
                                'id': 'buttonGroup1',
                                'name': 'toolsRadius',
                                'buttons':[
                                    {
                                        'title': '1',
                                        'id': 'radius0',
                                        'checked': true 
                                    },
                                    {
                                        'title': '2',
                                        'id': 'radius1'
                                    },
                                    {
                                        'title': '4',
                                        'id': 'radius2'
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
                        'title': '材料',
                        'id': 'buttonGroup2',
                        'name': 'textures',
                        'appendClass': 'btn-group-rect',
                        'buttons':[
                            {
                                'title': '',
                                'id': 'texture0',
                                'bgType': materials[0].type,
                                'bgTypeData': materials[0].abstract,
                                'width': defaultTexturesButtonWidth,
                                'height': defaultTexturesButtonWidth,
                                'checked': true  
                            }
                        ]
                    }
                ]
            }
        ]
    });
    
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

    function onSidebarBtnClick(event){
        if(this.nodeName.toLowerCase() === 'label'){
            var radio = this.getElementsByTagName('input')[0];
            sidebarParams[radio.name] = Number(radio.value);
            // console.log(sidebarParams);
            if(radio.name === 'textures'){
                currentBoxMaterial = materials[sidebarParams[radio.name]].data;
                currentHelperBoxMaterial = insertAIntoB(helperCubeMaterialDiff, currentBoxMaterial);
                helperCube.material = currentHelperBoxMaterial;
            }
        }
        else if(this.type === 'button'){
            sidebarParams[this.id]();
        }
    }

    //load other textures
    var basicColors = [
        "#66ccff",
        "#ff6600",
        "#cc3333",
        "#ffcc33",
        "#33cc99",
        "#3399cc",
        "#b1eb00",
        "#53bbf4",
        "#ff85cb",
        "#ff432e",        
        "#ffac00"
    ];

    for (var i = 0, l = basicColors.length ; i < l; i++) {
        var m ={
            'name': basicColors[i],
            'type': 'color',
            'id': 'texture' + (i+1),
            'abstract': basicColors[i],
            'data': new THREE.MeshLambertMaterial( { color: basicColors[i] } )
        }
        materials.push(m);

        GoUI.map['buttonGroup2'].addButton({
            'title': '',
            'id': m.id,
            'bgType': m.type,
            'bgTypeData': m.abstract,
            'width': defaultTexturesButtonWidth,
            'height': defaultTexturesButtonWidth
        }).addEventListener('click', onSidebarBtnClick, false);
    };
    {
        var m ={
            'name': 'dirtTile',
            'type': 'image',
            'id': 'texture' +materials.length,
            'abstract': 'texture/atlas.png',
            'data': new THREE.MeshLambertMaterial( { map: THREE.ImageUtils.loadTexture('texture/atlas.png') } )
        }
        materials.push(m);

        GoUI.map['buttonGroup2'].addButton({
            'title': '',
            'id': m.id,
            'bgType': m.type,
            'bgTypeData': m.abstract,
            'width': defaultTexturesButtonWidth,
            'height': defaultTexturesButtonWidth
        }).addEventListener('click', onSidebarBtnClick, false);
    }

})( window, document, Base, THREE, Detector );