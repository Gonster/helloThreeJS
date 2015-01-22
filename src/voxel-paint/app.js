(function ( window, document, Base, THREE, Detector ) {
    //constants
    var DEFAULT_BOX = {
        "width": 50.0
    };
    var DEFAULT_PLANE = {
        "width": 10000.0,
        "height": 10000.0
    }

    var LIGHT_PARAMS = {
        "webgl": {
            "ambientLightColor": 0x202020,
            "directionalLightDensity": 0.2

        },
        "canvas": {
            "ambientLightColor": 0x909090,
            "directionalLightDensity": 0.9
        }
    }

    var base;
    var basePlaneGeometry, basePlaneMesh;

    var defaultTexturesButtonWidth = 57;

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
    var ambientLight, directionalLight, hemisphereLight, spotLight;
    var mouseOnScreenVector, mouseState = [0,0,0];
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

    function updateHelperCube(intersects) {
        if( intersects.length > 0 ){
            var intersect = intersects[0];
            setMeshPositionToFitTheGrid( helperCube, intersect );
        }
    }

    function drawVoxel(intersectResult, isDrawOnSameVoxel, isEraseWhileMoving){
        var intersects = intersectResult || calculateIntersectResult(event);
        if( intersects.length > 0 ){
            var intersect = intersects[0];
            var currentToolsType = sidebarParams['toolsType'];
            var sameVoxelFlag = false;
            if(intersect.object === cubeMeshes[cubeMeshes.length-1]) sameVoxelFlag=true;
            //add a solid cube
            if(currentToolsType === 0){
                if((sameVoxelFlag === true && isDrawOnSameVoxel === false) || (sameVoxelFlag === false && isDrawOnSameVoxel === true)) return;
                var currentCube = new THREE.Mesh( defaultBoxGeometry, currentBoxMaterial );
                currentCube.castShadow = true;
                currentCube.receiveShadow = true;
                setMeshPositionToFitTheGrid ( currentCube, intersect );
                base.scene.add( currentCube );
                allIntersectableObjects.push( currentCube );
                cubeMeshes.push( currentCube );
                return;
            }

            //remove cube
            if(currentToolsType === 1 && isEraseWhileMoving){
                if( intersect.object !== basePlaneMesh ) {
                    base.scene.remove( intersect.object );
                    allIntersectableObjects.splice( allIntersectableObjects.indexOf( intersect.object ), 1 );
                    cubeMeshes.splice( cubeMeshes.indexOf( intersect.object ), 1 );
                    return;
                }
            }
        }
    }

    function onDocumentMouseMove(event) {
        event.preventDefault();
        var intersects = calculateIntersectResult(event);
        updateHelperCube(intersects);
        ( mouseState[0] === 1 ) && drawVoxel(intersects, event.ctrlKey, event.ctrlKey);
        // base.renderer.render( base.scene, base.camera );
        
    }

    function onDocumentMouseDown(event) {        
        event.preventDefault();
        switch(event.button){
            case -1:
                break;
            case 0:
                mouseState[0] = 1;
                var intersects = calculateIntersectResult(event);
                drawVoxel(intersects, undefined, true);
                updateHelperCube(intersects);
                // base.renderer.render( base.scene, base.camera );
                break;
            case 1:
                mouseState[1] = 1;
                break;
            case 2:
                mouseState[2] = 1;
                break;
        }


        
    }

    function onDocumentMouseUp(event) {
        switch(event.button){
            case -1:
                break;
            case 0:
                mouseState[0] = 0;
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
        ambientLight = new THREE.AmbientLight( LIGHT_PARAMS[base.renderType].ambientLightColor );
        base.scene.add( ambientLight );
        directionalLight = new THREE.DirectionalLight( 0xeeeeee, LIGHT_PARAMS[base.renderType].directionalLightDensity );
        directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
        base.scene.add( directionalLight );
        hemisphereLight = new THREE.HemisphereLight( 0xeeeeee, 0x303030, 0.95 );
        base.scene.add( hemisphereLight );

        spotLight = new THREE.SpotLight( 0xffffff, 0.15, 0, Math.PI / 2, 1 );
        spotLight.position.set( 0, 1500, 1000 );
        spotLight.target.position.set( 0, 0, 0 );

        spotLight.castShadow = true;

        spotLight.shadowCameraNear = 1200;
        spotLight.shadowCameraFar = 2500;
        spotLight.shadowCameraFov = 50;

        //spotLight.shadowCameraVisible = true;

        spotLight.shadowBias = 0.000001;
        spotLight.shadowDarkness = 0.5;

        spotLight.shadowMapWidth = 1024;
        spotLight.shadowMapHeight = 1024;

        base.scene.add( spotLight );

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
        base.renderer.shadowMapEnabled = true;
        base.renderer.shadowMapType = THREE.PCFShadowMap;
        //listeners
        base.renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
        base.renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
        base.renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );
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
    }

    var texturePaths = [
        "texture/grass.png",
        "texture/sand.png"
    ];


    for (var i = 0, l = texturePaths.length ; i < l; i++) {
        var m ={
            'name': texturePaths[i].replace('texture/','').replace('.png',''),
            'type': 'image',
            'id': 'texture' +materials.length,
            'abstract': texturePaths[i],
            'data': new THREE.MeshLambertMaterial( { map: THREE.ImageUtils.loadTexture(texturePaths[i]) } )
        }

        // m.data.magFilter = THREE.NearestFilter;
        // m.data.minFilter = THREE.LinearMipMapLinearFilter;
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