/**
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

(function( window, document, Base, THREE, Detector ){
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
            'sidebar': 'vp_sidebar'
        },
        'load': function (key){
            return  window.localStorage && window.localStorage.getItem(key || this.storageKeys.meshes);
        },
        'save': function (key, data){
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
        'loadMeshes': function loadMeshes(key, loadType, animation, isNotLocalStorage){
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
                        break;
                }
            }
            else{
                voxelAnimationManager.endFlag = true;
            }
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
            'basePlaneTextureRepeat': 200,
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
            $('#signInError').parent().hide();
            $('#signInModal').modal('show');

        },     
        'loginOpener': function(){
            $('#loginError').parent().hide();
            $('#loginModal').modal('show');
        },   
        'logout': function(){
            if (AV.User.current()) {
                AV.User.logOut();
                loginTrigger(false);
            }
        },
        'open': function() {
            var query = new AV.Query(Box);
            query.select('name');
            query.equalTo('user', AV.User.current());
            query.find().then(
                function(results){
                    $('#openModal .modal-body .button-group-vertical').html('');
                    for(var i = 0, l = results.length;i < l; i++) {
                        $('#openModal .modal-body .button-group-vertical').append(
                          '<label class="btn btn-primary">'
                          + '  <input type="radio" name="boxData" id="boxData'+i+'" value="'+results[i].get('objectId')+'" autocomplete="off">'
                          + '  <label id="boxDataLabel'+i+'"></label>'
                          + '</label>'
                        );
                        $('#openModal .modal-body .button-group-vertical #boxDataLabel'+i).text(results[i].get('name');
                    }
                    $('#openModal').modal('show');
                }
            );

        },
        'save': function() {
            if(AV.User.current()){
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
                if(!box.objectId){
                    var name = prompt('请输入文件名', '未命名');
                    box.set('name', name || '未命名');
                    box.set('user', AV.User.current());
                    box.set('ACL', new AV.ACL(AV.User.current()));
                }
                box.save();
            }
            else{
                voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.camera);
                voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.sidebar);
                voxelPaintStorageManager.save();
                if(!loginAlertFlag){
                    alert('未登录状态将只能保存在本地');
                    loginAlertFlag = true;
                }
            }
        }
    };

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
        // var skyTexture = THREE.ImageUtils.loadTexture('texture/sky.jpg');
        basePlaneTexture.wrapT = basePlaneTexture.wrapS = THREE.RepeatWrapping;
        basePlaneTexture.repeat.set(
            LIGHT_PARAMS[base.renderType].basePlaneTextureRepeat, 
            LIGHT_PARAMS[base.renderType].basePlaneTextureRepeat
        );
        basePlaneMaterial = new THREE.MeshLambertMaterial( {color: 0x33cc33, map: basePlaneTexture, bumpMap: basePlaneTexture, emissive: 0xffffff} );        
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
        var uniforms = {
            topColor:    { type: "c", value: new THREE.Color( 0x3366ff ) },
            bottomColor: { type: "c", value: new THREE.Color( 0xffffff ) },
            offset:      { type: "f", value: 200 },
            exponent:    { type: "f", value: .85 }
        }
        var tc = new THREE.Color();
        uniforms.topColor.value.copy( tc.setHSL( 0.6, 2, 0.5 ));

        var skyGeo = new THREE.SphereGeometry( LIGHT_PARAMS[base.renderType].sphereRadius , 32, 15 );
        var skyMat = new THREE.ShaderMaterial( {
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.BackSide
        } );

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
        fog = new THREE.FogExp2( 0xffffff, 0.000055 );
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
        autoSaveIntervalHandler = setInterval(onWindowBeforeUnload, autoSaveInterval);
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

    //listeners
    function onWindowBeforeUnload(event) {
        if(reloadFlag === 0){
            voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.camera);
            voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.sidebar);
            voxelPaintStorageManager.save();
        }
    }

    function onWindowReload(event) {
        voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.camera);
        voxelPaintStorageManager.save(voxelPaintStorageManager.storageKeys.sidebar);
        voxelPaintStorageManager.save();
        reloadFlag = 1;
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
                            'title': '注销',
                            'id': 'logout'
                        },
                        {
                            'title': '登录后方可保存数据到服务器上',
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
                                },
                                {
                                    'UIType': 'buttonGroup',
                                    'id': 'buttonGroupADM',
                                    'name': 'adm',
                                    'buttonType': 'button',
                                    'appendClass': 'btn-group-toolbtn',
                                    'buttons':[
                                        {
                                            'title': '打开',
                                            'id': 'open'
                                        },
                                        {
                                            'title': '保存',
                                            'id': 'save'
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

    var onLoginClick = function(){
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
            },
            error: function(user, error) {
                $('#loginError').html('用户名或密码错误');
                $('#loginError').parent().show();
                loginBtn.removeAttr('disabled');
            }
        });
    };

   var onSignInClick = function(){
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
            },
            error: function(user, error) {
                $('#signInError').html(error.message);
                $('#signInError').parent().show();
                signInBtn.removeAttr('disabled');
            }
        });
    };

    var onOpenItClick = function(){
        if(confirm('是否保存当前文件？')) {
            sidebarParams.save();
        }

        var oi = $('#openModal input[type=radio]:checked').val();
        if(oi) {
            var query = new AV.Query(Box);
            query.get( oi, {
                success: function(currentBox) {
                    box = currentBox;
                    voxelPaintStorageManager.loadCamera(currentBox.get('camera'), true);
                    voxelPaintStorageManager.loadMeshes(currentBox.get('meshes'), defaultLoadType, voxelAnimationManager.loadBoxAnimation, true);
                }
            });
        }
        $('#openModal').modal('hide');
        
    };

    document.getElementById('login').addEventListener('click', onLoginClick, false);
    document.getElementById('signIn').addEventListener('click', onSignInClick, false);
    document.getElementById('openIt').addEventListener('click', onOpenItClick, false);


    voxelPaintStorageManager.loadCamera(voxelPaintStorageManager.storageKeys.camera);
    voxelPaintStorageManager.loadSidebarSelectedButtons(voxelPaintStorageManager.storageKeys.sidebar);

    function loginTrigger(flag){
        if(flag) {            
            $('#loginOpener').hide();
            $('#logout').show();
            $('#signInOpener').hide();            
            $('#loginMessage').html('你好 ' + AV.User.current().escape("username"));
            $('#loginMessage').show();
            $('#open').removeAttr('disabled');
        }
        else{
            $('#loginOpener').show();
            $('#logout').hide();
            $('#signInOpener').show();
            $('#loginMessage').hide();
            $('#open').attr('disabled', 'disabled');
        }
    }

    if (AV.User.current()) {
        loginTrigger(true);
    } 
    else {
        loginTrigger(false);
        voxelPaintStorageManager.loadMeshes(undefined, defaultLoadType, voxelAnimationManager.loadBoxAnimation);
    }


})( window, document, Base, THREE, Detector );