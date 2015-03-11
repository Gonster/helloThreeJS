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

    var insertBox = undefined;

    var Keep = AV.Object.extend('Keep');

    var keep = new Keep();

    //utils
    function isFileOfOthers() {
        return (AV.User.current() && box && box.get('user') && (AV.User.current().id !== box.get('user').id));
    }

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

    var StorageManager = function(isLoadingBoxEnd){
        //loading animation flag   not end yet
        this.isLoadingBoxEnd = isLoadingBoxEnd;
    };

    StorageManager.prototype = {
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
                        // if( ! this.isLoadingBoxEnd && actionRecorder.currentActionIndex < 0) return;
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
        'dataStringToMeshes': function loadMeshes(dataString) {
            var loadDataArray = []; 
            var meshes = [];
            var boxWidth = DEFAULT_BOX.width; 
            {
                var load = dataString;
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
                for(var i = 0, l = loadDataArray.length; i < l; i++){
                    var currentData = loadDataArray[i].split(',');
                    if( currentData.length > 2 ){

                        var geoIndex = Number(currentData[0]) || 0;
                        var currentBoxGeometryParent = geometries[geoIndex];
                    
                        var materialIndex = Number(currentData[1]) || 0;
                        var currentBoxMaterialParent = materials[materialIndex];

                        var currentBoxGeometry = currentBoxGeometryParent.data;
                        var currentBoxMaterial = currentBoxMaterialParent.data;

                        var currentCube = new THREE.Mesh( currentBoxGeometry, currentBoxMaterial );
                        currentCube.position.set(Number(currentData[2]) / boxWidth, Number(currentData[3]) / boxWidth, Number(currentData[4]) / boxWidth);
                        meshes.push(currentCube);
                    }
                }
            }
            return meshes;
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
                        if(retrievedBox.updatedAt.toString() === updatedAt) {
                            box = retrievedBox;
                            retrievedBox.set('meshes', storageManager.load(storageManager.storageKeys.meshes));
                            retrievedBox.set('camera', storageManager.load(storageManager.storageKeys.camera));

                            storageManager.save(storageManager.storageKeys.boxName, box.get('name'));
                            actionRecorder.changed = storageManager.load(storageManager.storageKeys.localChanges);

                            storageManager.loadCamera(box.get('camera'), true);
                            storageManager.loadMeshes(box.get('meshes'), defaultLoadType, voxelAnimationManager.loadBoxAnimation, true);
                        }
                        else{
                            box = retrievedBox;
                            if(retrievedBox.get('user').id === AV.User.current().id) {
                                var localChanges = actionRecorder.changed = storageManager.load(storageManager.storageKeys.localChanges);
                                if(localChanges === '0' || (localChanges !== '0' && confirm('上次关闭前可能未完成保存，是否载入云端文件？若取消则将本地版本视为新文件'))) {
                                    var q = new AV.Query(Box);
                                    q.get(retrievedBox.id, {
                                        success: function(currentBox) {
                                            box = currentBox;

                                            storageManager.loadCamera(box.get('camera'), true);
                                            storageManager.loadMeshes(box.get('meshes'), defaultLoadType, voxelAnimationManager.loadBoxAnimation, true);

                                            // storageManager.save(storageManager.storageKeys.localChanges, '0');
                                            storageManager.save(storageManager.storageKeys.boxName, box.get('name'));
                                            storageManager.save(storageManager.storageKeys.updatedAt, box.updatedAt);
                                            storageManager.save(storageManager.storageKeys.camera);
                                            storageManager.save();
                                        },
                                        error: function(currentBox, error) {
                                            retrievedBox.set('meshes', storageManager.load(storageManager.storageKeys.meshes));
                                            retrievedBox.set('camera', storageManager.load(storageManager.storageKeys.camera));

                                            storageManager.loadMeshes(undefined, defaultLoadType, voxelAnimationManager.loadBoxAnimation);
                                        }
                                    });
                                }
                                else{

                                    box = new Box();
                                    storageManager.save(storageManager.storageKeys.boxId,'');
                                    storageManager.save(storageManager.storageKeys.updatedAt,'');
                                    storageManager.save(storageManager.storageKeys.boxName,'');       
                                    storageManager.save(storageManager.storageKeys.localChanges,'1');                
                                    this.changed = 1;

                                    storageManager.loadMeshes(undefined, defaultLoadType, voxelAnimationManager.loadBoxAnimation);

                                    bubble('由于本地此文件与云端文件在同一文件的基础上做了不同的改动，将本地版本与云端此文件视为不同的文件');

                                }
                            }
                            else{
                                var q = new  AV.Query(Box);
                                q.get(retrievedBox.id, {
                                    success: function(currentBox) {
                                        box = currentBox;

                                        storageManager.loadCamera(box.get('camera'), true);
                                        storageManager.loadMeshes(box.get('meshes'), defaultLoadType, voxelAnimationManager.loadBoxAnimation, true);
                                    },
                                    error: function(currentBox, error) {
                                        storageManager.loadMeshes(undefined, defaultLoadType, voxelAnimationManager.loadBoxAnimation);
                                    }
                                });
                            }
                        }
                    },
                    error: function(retrievedBox, error) {
                        bubble('载入失败，' + error.message);
                        storageManager.loadMeshes(undefined, defaultLoadType, voxelAnimationManager.loadBoxAnimation);
                    }
                });
            }
            else {
                storageManager.loadMeshes(undefined, defaultLoadType, voxelAnimationManager.loadBoxAnimation);
            }
        },
        'loadShared': function loadShared(objectId, errorCallback) {
            var q = new  AV.Query(Box);
            q.get(objectId, {
                success: function(currentBox) {
                    box = currentBox;

                    storageManager.loadCamera(box.get('camera'), true);
                    storageManager.loadMeshes(box.get('meshes'), defaultLoadType, voxelAnimationManager.loadBoxAnimation, true);

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
            if(isFileOfOthers()) {
                if(confirm('确定要修改吗？（将会作为新建的文件覆盖本地保存的数据）')){
                    box = new Box();
                    storageManager.save(storageManager.storageKeys.boxId,'');
                    storageManager.save(storageManager.storageKeys.updatedAt,'');
                    storageManager.save(storageManager.storageKeys.boxName,'');       
                    storageManager.save(storageManager.storageKeys.localChanges,'1');     
                    bubble('已根据当前内容新建文件');
                }
                else{
                    this.undo();
                    return;
                }
            }
            this.changed = 1;
            updateFileInfo();
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
        this.isInsertingFlag = false;
        this.insertMeshes = undefined;
        this.insertMeshesBase = undefined;
        this.insertMeshesNormal = new THREE.Vector3(0, 1, 0);
        this.insertTimes = 0;
        this.insertMaterialOverrideFlag = false;
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

    function adjustInsertMeshes(insertMeshes) {
        if(!insertMeshes) return insertMeshes;
        if(insertMeshes.length < 1) return insertMeshes;
        var basePosition = new THREE.Vector3( DEFAULT_BOX.width / 2.0, DEFAULT_BOX.width / 2.0, DEFAULT_BOX.width / 2.0);
        var minLength = insertMeshes[0].position.length();
        var minHeight =  insertMeshes[0].position.y;
        var baseMeshIndex = 0;

        for(var i = 1, l = insertMeshes.length; i < l; i++) {
            var currentHeight = insertMeshes[i].position.y;
            if(currentHeight < minHeight) {
                minHeight = currentHeight;
                minLength = insertMeshes[i].position.length();
                baseMeshIndex = i;
            }
            else if(currentHeight == minHeight){
                var currentLength = insertMeshes[i].position.length();
                if(currentLength < minLength) {
                    minLength = currentLength;
                    baseMeshIndex = i;
                }
            }
        }

        var baseMesh = this.insertMeshesBase = insertMeshes[baseMeshIndex];
        var baseOffset = baseMesh.position.clone().sub(basePosition);

        for(var i = 0, l = insertMeshes.length; i < l; i++) {
            insertMeshes[i].position.sub(baseOffset);
        }
        return insertMeshes;
    }

    function offsetInsertMeshesBasedOnHelperBox(insertMeshes) {
        if(!insertMeshes) return insertMeshes;
        if(insertMeshes.length < 1) return insertMeshes;
        var basePosition = new THREE.Vector3( DEFAULT_BOX.width / 2.0, DEFAULT_BOX.width / 2.0, DEFAULT_BOX.width / 2.0);
        var baseOffset = helperCube.position.clone().sub(basePosition);

        for(var i = 0, l = insertMeshes.length; i < l; i++) {
            insertMeshes[i].position.sub(baseOffset);
        }
    }

    function addInsertHelperToScene(insertMeshes) {
        this.adjustInsertMeshes(insertMeshes);
        this.offsetInsertMeshesBasedOnHelperBox(insertMeshes);
        for(var i = 0, l = insertMeshes.length; i < l; i++) {
            base.scene.add(insertMeshes[i]);
        }
    }

    function updateInsertHelper(insertMeshes, intersects) {
        if( !intersects ) return;
        if( intersects.length < 1 ) return;
        var intersect = intersects[0];

        if(!insertMeshes || !intersect) return insertMeshes;
        if(insertMeshes.length < 1) return insertMeshes;

        var intersectFaceNormal = intersect.face.normal.clone();
        var quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(this.insertMeshesNormal, intersectFaceNormal);
        var baseOffset = helperCube.position.clone().sub(this.insertMeshesBase.position);
        var rotationAnchor = helperCube.position.clone();
        
        for(var i = 0, l = insertMeshes.length; i < l; i++) {
            insertMeshes[i].position.add(baseOffset);
            var rotateTarget = insertMeshes[i].position.clone().sub(rotationAnchor);
            rotateTarget.applyQuaternion(quaternion);
            insertMeshes[i].position.copy(rotationAnchor.clone().add(rotateTarget));
            insertMeshes[i].position.divideScalar( DEFAULT_BOX.width )
            .floor()
            .multiplyScalar( DEFAULT_BOX.width )
            .addScalar( DEFAULT_BOX.width / 2.0 );
        }
        this.insertMeshesNormal = intersectFaceNormal;
    }

    function endInsert() {
        for(var i = 0, l = this.insertMeshes.length; i < l; i++) {
            base.scene.remove(this.insertMeshes[i]);
        }
        this.isInsertingFlag = false;
        this.insertMeshes = undefined;
        this.insertMeshesBase = undefined;
        this.insertMeshesNormal = new THREE.Vector3(0, 1, 0);
        this.insertTimes = 0;
        this.insertMaterialOverrideFlag = false;
        bubble('插入结束');
    }

    Pen.prototype = {
        'calculateIntersectResult': calculateIntersectResult,
        'setMeshPositionToFitTheGrid': setMeshPositionToFitTheGrid,
        'updateHelperCube': updateHelperCube,
        'adjustInsertMeshes': adjustInsertMeshes,
        'offsetInsertMeshesBasedOnHelperBox': offsetInsertMeshesBasedOnHelperBox,
        'addInsertHelperToScene': addInsertHelperToScene,
        'updateInsertHelper': updateInsertHelper,
        'endInsert': endInsert,
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
        },
        'deleteMesh': function(deleteMeshesO) {
            var deleteMeshes = deleteMeshesO || this.insertMeshes;
            var deleted = [];
            for(var i = 0, l = deleteMeshes.length; i < l; i++) {

                for(var j = 0, dl = cubeMeshes.length; j < dl; j++) {
                    var mesh = cubeMeshes[j].meshObject;
                    if(deleteMeshes[i].position.equals(mesh.position)) {
                        deleted.push(this.erase(mesh));
                        break;
                    }
                }

            }
            return deleted;

        },
        'insert': function(insertMeshesO) {
           
           var insertMeshes = insertMeshesO || this.insertMeshes;
           var inserted = [];
           for(var i = 0, l = insertMeshes.length; i < l; i++) {
                if(this.insertMaterialOverrideFlag) {
                    var mesh = this.draw(currentBoxGeometryParentIndex, 
                        currentBoxMaterialParentIndex, 
                        [ insertMeshes[i].position.x, insertMeshes[i].position.y, insertMeshes[i].position.z ]
                    );
                    inserted.push(mesh);
                }
                else{
                    var geo = 0;
                    for(var j = 0, lg = geometries.length; j < lg; j++) {
                        if(geometries[j].data === insertMeshes[i].geometry) {
                            geo = j;
                            break;
                        }
                    }
                    var mat = 0;
                    for(var k = 0, lm = materials.length; k < lm; k++) {
                        if(materials[k].data === insertMeshes[i].material) {
                            mat = k;
                            break;
                        }
                    }
                    var mesh = this.draw(
                        geo, 
                        mat, 
                        [insertMeshes[i].position.x, insertMeshes[i].position.y, insertMeshes[i].position.z],
                        undefined,
                        insertMeshes[i].clone()
                    );
                    inserted.push(mesh);
                }
           }
           return inserted;
            
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
    var defaultLoadType = StorageManager.prototype.LOAD_TYPE.async;
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
        'toggleShadow': function() {
            directionalLight.castShadow = !directionalLight.castShadow;
            if(directionalLight.castShadow) bubble('阴影打开');
            else bubble('阴影关闭');
        },
        'toggleAux': function(){
            (sidebarParams['toolsType'] === 1) || (helperCube.visible = ! helperCube.visible);
            // gridHelper.visible = ! gridHelper.visible;
            auxToggle = ! auxToggle;
            if(auxToggle) bubble('辅助物体打开');
            else bubble('辅助物体关闭');
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
                        var name =  prompt('请输入文件名', box.get('name') || storageManager.load(storageManager.storageKeys.boxName) || '未命名');
                        box.set('name', name || '未命名');
                        box.set('user', AV.User.current());
                        box.setACL(new AV.ACL(AV.User.current()));
                    }
                    box.save({
                        success: function(box) {
                            bubble('已保存至云端');
                            storageManager.save(storageManager.storageKeys.updatedAt, box.updatedAt);
                            storageManager.save(storageManager.storageKeys.boxId, box.id);
                            storageManager.save(storageManager.storageKeys.boxName, box.get('name'));
                        },
                        error: function(box, error) {
                            bubble('云端保存失败，将会保存在本地' + error.message);
                            storageManager.save(storageManager.storageKeys.boxName, box.get('name'));

                            actionRecorder.changed = '1';

                            storageManager.save(storageManager.storageKeys.localChanges, '1');
                        }
                    });
                }
                actionRecorder.changed = '0';

                storageManager.save(storageManager.storageKeys.localChanges, '0');
                storageManager.save(storageManager.storageKeys.camera);
                storageManager.save(storageManager.storageKeys.sidebar);
                storageManager.save();
            }
            else{
                storageManager.save(storageManager.storageKeys.camera);
                storageManager.save(storageManager.storageKeys.sidebar);
                storageManager.save();
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
            storageManager.save(storageManager.storageKeys.localChanges, '0');
            storageManager.save(storageManager.storageKeys.camera);
            storageManager.save(storageManager.storageKeys.sidebar);
            storageManager.save(storageManager.storageKeys.updatedAt,'');
            storageManager.save(storageManager.storageKeys.boxName,''); 
            storageManager.save();
            bubble('新建'); 
        },
        'open': function() {
            document.getElementById('openIt').removeEventListener('click', onOpenItClick, false);
            document.getElementById('openIt').removeEventListener('click', onDeleteItClick, false);
            document.getElementById('openIt').removeEventListener('click', onInsertItClick, false);

            document.getElementById('openIt').addEventListener('click', onOpenItClick, false);
            var query = new AV.Query(Box);
            query.select('name');
            query.equalTo('user', AV.User.current());

            var query2 = new AV.Query(Keep);
            query2.select('name');
            query2.select('box.name', 'box.user.username');
            query2.include('box.name', 'box.user.username');
            query2.equalTo('user', AV.User.current());

            selectModalInit(query.find(), query2.find());

            $('#openModal .modal-body #boxTitle').text('我的文件');
            $('#openModal .modal-body #keepTitle').text('我的收藏');
        },
        share: function() {
            var query = new AV.Query(Box);
            query.select('name');
            query.equalTo('user', AV.User.current());
            selectModalInit(query.find(), undefined, 'shareModal', ['boxToShare']);
        },
        delete: function() {
            document.getElementById('openIt').removeEventListener('click', onOpenItClick, false);
            document.getElementById('openIt').removeEventListener('click', onDeleteItClick, false);
            document.getElementById('openIt').removeEventListener('click', onInsertItClick, false);

            document.getElementById('openIt').addEventListener('click', onDeleteItClick, false);
            var query = new AV.Query(Box);
            query.select('name');
            query.equalTo('user', AV.User.current());

            var query2 = new AV.Query(Keep);
            query2.select('name');
            query2.select('box.name', 'box.user.username');
            query2.include('box.name', 'box.user.username');
            query2.equalTo('user', AV.User.current());

            selectModalInit(query.find(), query2.find(), undefined, undefined, true);

            $('#openModal .modal-body #boxTitle').text('我的文件');
            $('#openModal .modal-body #keepTitle').text('我的收藏');
        },
        keep: function() {
            if( box && box.id ) {
                var keepingBox = AV.Object.createWithoutData('Box', box.id);
                var query = new AV.Query(Keep);
                query.equalTo('user', AV.User.current());
                query.equalTo('box', keepingBox);
                query.count().then(
                    function(count) {
                        if(count > 0) {
                            bubble('您已收藏过此文件');
                        }
                        else{
                            var keep = new Keep();
                            keep.set('box', keepingBox);
                            keep.set('name', prompt('收藏名称'));
                            keep.set('user', AV.User.current());
                            keep.setACL(new AV.ACL(AV.User.current()));
                            keep.save().then(
                                function(){                                    
                                    bubble('已收藏');
                                },
                                function(){
                                    bubble('收藏失败');
                                }
                            );
                        }
                    },
                    function(error) {
                        bubble('收藏失败');
                    }
                );

            }
            else {
                bubble('只能收藏已保存的文件');
            }
        },
        insert: function() {
          document.getElementById('openIt').removeEventListener('click', onOpenItClick, false);
          document.getElementById('openIt').removeEventListener('click', onDeleteItClick, false);
            document.getElementById('openIt').removeEventListener('click', onInsertItClick, false);

          document.getElementById('openIt').addEventListener('click', onInsertItClick, false);
          var query = new AV.Query(Box);
          query.select('name');
          query.equalTo('user', AV.User.current());

          var query2 = new AV.Query(Keep);
          query2.select('name');
          query2.select('box.name', 'box.user.username');
          query2.include('box.name', 'box.user.username');
          query2.equalTo('user', AV.User.current());

          selectModalInit(query.find(), query2.find());

          $('#openModal .modal-body #boxTitle').text('我的文件');
          $('#openModal .modal-body #keepTitle').text('我的收藏');  
        }
    };

    function selectModalInit(myPromise, keptPromise, modalIdO, bodyIdsO, isKeepIdUsed) {
            var modalId = modalIdO || 'openModal';
            var bodyIds = bodyIdsO || ['myBox', 'myKeep'];

            if(myPromise) 
            myPromise.then(
                function(results){
                    $('#'+modalId+' .modal-body #'+bodyIds[0]).html('');
                    for(var i = 0, l = results.length;i < l; i++) {
                        $('#'+modalId+' .modal-body #'+bodyIds[0]).append(
                          '<label class="btn btn-primary">'
                          + '  <input type="radio" name="boxData" id="myBoxData'+i+'" value="'+results[i].id+'" autocomplete="off">'
                          + '  <label id="myBoxDataLabel'+i+'"></label>'
                          + '</label>'
                        );
                        $('#'+modalId+' .modal-body #myBoxDataLabel'+i).text(results[i].get('name'));
                    }
                    if(results.length < 1) $('#openModal .modal-body #boxTitle').hide();
                    else $('#openModal .modal-body #boxTitle').show();
                }
            );
           if(keptPromise)
           keptPromise.then(
                function(results){
                    $('#'+modalId+' .modal-body #'+bodyIds[1]).html('');
                    for(var i = 0, l = results.length;i < l; i++) {
                        $('#'+modalId+' .modal-body #'+bodyIds[1]).append(
                          '<label class="btn btn-primary">'
                          + '  <input type="radio" name="boxData" id="keepBoxData'+i+'" value="'+(isKeepIdUsed ? results[i].id : (results[i].get('box') ? results[i].get('box').id : '-1'))+'" autocomplete="off">'
                          + '  <label id="keepBoxDataLabel'+i+'"></label>'
                          + '</label>'
                        );
                        $('#'+modalId+' .modal-body #keepBoxDataLabel'+i).text(results[i].get('name')+ (results[i].get('box') ? '('+results[i].get('box').get('user').get('username')+'/'+results[i].get('box').get('name')+')' : ''));
                    }
                    if(results.length < 1) $('#openModal .modal-body #keepTitle').hide();
                    else $('#openModal .modal-body #keepTitle').show();
                }
            );

            $('#'+modalId+'').modal('show');

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
    var storageManager = new StorageManager(false);
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




    function drawVoxel(intersectResult, isDrawOnSameVoxel, isEraseWhileMoving, isMouseMoving, ctrlKey){
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
                if(pen.isInsertingFlag){
                    if(pen.insertTimes > 0 && !ctrlKey) {
                            pen.endInsert();
                            return;
                    } 
                    if(isMouseMoving) return;
                    var deletedMeshes = pen.deleteMesh();
                    actionRecorder.addAction('erase', deletedMeshes);
                    var insertedMeshes = pen.insert();
                    actionRecorder.addAction('draw', insertedMeshes);
                    pen.insertTimes++;
                    if(!ctrlKey) {
                        pen.endInsert();
                    }
                }
                else{
                    if((sameVoxelFlag === true && isDrawOnSameVoxel === false) || (sameVoxelFlag === false && isDrawOnSameVoxel === true)) return;
                       
                    var mesh = pen.draw(currentBoxGeometryParentIndex, currentBoxMaterialParentIndex, undefined, intersect);
                    if(isMouseMoving) actionRecorder.appendObjectToCurrentAction('draw', mesh);
                    else actionRecorder.addAction('draw', mesh);      
                    //instant render   grant next draw right              
                    base.renderer.render( base.scene, base.camera );
                    return;
                }
            }

            //remove cube
            if(currentToolsType === 1 && isEraseWhileMoving){
                if(pen.isInsertingFlag){
                    if(pen.insertTimes > 0 && !ctrlKey) {
                            pen.endInsert();
                            return;
                    } 
                    if(isMouseMoving) return;
                    var deletedMeshes = pen.deleteMesh();
                    actionRecorder.addAction('erase', deletedMeshes);
                    pen.insertTimes++;
                    if(!ctrlKey) {
                        pen.endInsert();
                    }
                }
                else{
                    if( intersect.object !== basePlaneMesh ) {
                        var mesh = pen.erase(intersect.object);
                        if(isMouseMoving) actionRecorder.appendObjectToCurrentAction('erase', mesh);
                        else actionRecorder.addAction('erase', mesh);
                        return;
                    }
                }
            }
        }
    }

    function autoSave(){
      if(isFileOfOthers()){}
      else {
          storageManager.save(storageManager.storageKeys.localChanges, actionRecorder.changed);
          storageManager.save(storageManager.storageKeys.camera);
          storageManager.save(storageManager.storageKeys.sidebar);
          storageManager.save();

          // storageManager.save(storageManager.storageKeys.boxName, box.get('name') || '');
          // storageManager.save(storageManager.storageKeys.boxId, box.id || '');
          // storageManager.save(storageManager.storageKeys.updatedAt, box.updatedAt || '');
      }
    }

    //listeners
    function onWindowBeforeUnload(event) {
        if(reloadFlag === 0){            
            if(isFileOfOthers()){}
            else if(actionRecorder.changed === '0' || ( cubeMeshes.length < 1 && ( !box || (box && !box.id ))) || !AV.User.current) {
                storageManager.save(storageManager.storageKeys.camera);
                storageManager.save(storageManager.storageKeys.sidebar);
                storageManager.save();
            }
            else{
                //give up in saving data to cloud
                storageManager.save(storageManager.storageKeys.localChanges, actionRecorder.changed);
                storageManager.save(storageManager.storageKeys.camera);
                storageManager.save(storageManager.storageKeys.sidebar);
                storageManager.save();
                // sidebarParams.save();
            }
        }
    }

    function onWindowReload(event) {
        reloadFlag = 1;
        if(isFileOfOthers()){}
        else if(actionRecorder.changed === '0' || ( cubeMeshes.length < 1 && ( !box || (box && !box.id )))) {
            storageManager.save(storageManager.storageKeys.camera);
            storageManager.save(storageManager.storageKeys.sidebar);
            storageManager.save();
        }
        else{
                if(confirm('是否保存当前文件？')) {
                    sidebarParams.save();
                }
                else{
                    storageManager.save(storageManager.storageKeys.localChanges, actionRecorder.changed);
                    storageManager.save(storageManager.storageKeys.camera);
                    storageManager.save(storageManager.storageKeys.sidebar);
                    storageManager.save();
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
            }
            intersects = calculateIntersectResult(event);
            updateHelperCube(intersects);
            if(pen.isInsertingFlag) pen.updateInsertHelper(pen.insertMeshes, intersects);
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
                drawVoxel(intersects, undefined, true, false, event.ctrlKey);
                // if(sidebarParams['toolsType'] === 0) {
                    updateHelperCube(intersects);
                    if(pen.isInsertingFlag) pen.updateInsertHelper(pen.insertMeshes, intersects);
                // }
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
                if(!pen.isInsertingFlag){
                    if(sidebarParams['toolsType'] === 0){
                        document.getElementById('eraser').parentElement.click();
                        bubble('已切换至擦除');
                    }
                    else if(sidebarParams['toolsType'] === 1){
                        document.getElementById('cube').parentElement.click();
                        bubble('已切换至画笔');
                    }
                }
                else{
                    pen.insertMaterialOverrideFlag = !pen.insertMaterialOverrideFlag;
                    if(pen.insertMaterialOverrideFlag) bubble('插入方块的材质将使用当前选择材质');
                    else bubble('插入方块的材质将使用原文件中的材质');
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
            //ESC
            case 27:
                if(pen.isInsertingFlag) pen.endInsert();
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
                                },                                
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
                            'UIType': 'Toolbar',
                            'id': 'toolbar1',
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
                                            'title': '阴影开关',
                                            'id': 'toggleShadow'
                                        },
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

    //file command callbacks
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
                storageManager.loadRemote();
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
                storageManager.loadRemote();
            },
            error: function(user, error) {
                $('#signInError').html(error.message);
                $('#signInError').parent().show();
                signInBtn.removeAttr('disabled');
            }
        });
    }

    function onOpenItClick() {
        var oi = $('#openModal input[type=radio]:checked').val();
        if(oi === '-1') { $('#openModal').modal('hide');bubble('收藏的文件无法打开，可能被作者删除或隐藏，可以使用删除功能删除此收藏或联系作者');return;}
        document.getElementById('openIt').removeEventListener('click', onOpenItClick, false);
        if(actionRecorder.changed === '0' || ( cubeMeshes.length < 1 && ( !box || (box && !box.id )))) {

        }
        else{
            if(confirm('是否保存当前文件？')) {
                sidebarParams.save();
            }
        }

        if(oi) {
            var query = new AV.Query(Box);
            query.get( oi, {
                success: function(currentBox) {
                    sidebarParams.clearAll();
                    actionRecorder = new ActionRecorder();
                    actionRecorder.updateDom();
                    box = currentBox;
                    storageManager.loadCamera(currentBox.get('camera'), true);
                    storageManager.loadMeshes(currentBox.get('meshes'), defaultLoadType, voxelAnimationManager.loadBoxAnimation, true);
                    if(currentBox.get('user').id === AV.User.current().id) {
                        storageManager.save(storageManager.storageKeys.localChanges, '0');
                        storageManager.save(storageManager.storageKeys.boxName, box.get('name'));
                        storageManager.save(storageManager.storageKeys.boxId, box.id);
                        storageManager.save(storageManager.storageKeys.updatedAt, box.updatedAt);
                        storageManager.save(storageManager.storageKeys.camera);
                        storageManager.save(storageManager.storageKeys.sidebar);
                        storageManager.save();
                    }
                }
            });
        }
        $('#openModal').modal('hide');
        
    }

    function onShareItClick() {        
        var oi = $('#shareModal input[type=radio]:checked').val();
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
                            function(){                                
                                bubble('分享成功，可通过显示的链接打开分享内容');
                            },
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

    function onSetItPrivateClick() {        
        var oi = $('#shareModal input[type=radio]:checked').val();
        if(oi) {
            var query = new AV.Query(Box);
            query.equalTo('objectId', oi);
            query.select('shared');
            query.first().then(
                function(currentBox) {
                    if(currentBox.get('shared')){
                        var acl = new AV.ACL(AV.User.current());
                        currentBox.setACL(acl);
                        currentBox.set('shared', false);
                        currentBox.save().then(
                            function(){                                
                                bubble('取消分享成功');
                            },
                            function(){
                                bubble('取消分享失败');
                            }
                        );
                    }
                }
            );
        }
    }

    function onDeleteItClick() {
        var className ;
        var radioGroupSubContainer = $('#openModal input[type=radio]:checked').parent().parent();
        if(radioGroupSubContainer[0].id === 'myBox') {
            className = 'Box';
        }
        else {
            className = 'Keep';
        }
        var oi = $('#openModal input[type=radio]:checked').val();
        if(oi && confirm('确定要删除吗？')) {
            var deletingObject = AV.Object.createWithoutData(className, oi);
            deletingObject.destroy().then(
                function(currentObject) {
                    bubble('已删除');
                },
                function(error) {
                    bubble('删除失败');
                }
            );
        }
        $('#openModal').modal('hide');
    }


    function onInsertItClick() {
        document.getElementById('openIt').removeEventListener('click', onInsertItClick, false);

        var oi = $('#openModal input[type=radio]:checked').val();
        if(oi === '-1') { $('#openModal').modal('hide');bubble('收藏的文件无法打开，可能被作者删除或隐藏，可以使用删除功能删除此收藏或联系作者');return;}
        if(oi) {
            var query = new AV.Query(Box);
            query.get( oi, {
                success: function(currentBox) {
                    insertBox = currentBox;
                    pen.isInsertingFlag = true;
                    pen.insertMeshes = storageManager.dataStringToMeshes(insertBox.get('meshes'));
                    pen.addInsertHelperToScene(pen.insertMeshes);

                    bubble('按住ctrl键可插入多个，shift切换使用的材质，ESC取消插入');
                    
                },
                error: function() {
                    bubble('载入失败，无法插入');
                }
            });
        }
        $('#openModal').modal('hide');
        
    }


    document.getElementById('login').addEventListener('click', onLoginClick, false);
    document.getElementById('signIn').addEventListener('click', onSignInClick, false);

    document.getElementById('shareIt').addEventListener('click', onShareItClick, false);
    document.getElementById('setItPrivate').addEventListener('click', onSetItPrivateClick, false);

    storageManager.loadCamera(storageManager.storageKeys.camera);
    storageManager.loadSidebarSelectedButtons(storageManager.storageKeys.sidebar);

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
            $('#keep').removeAttr('disabled');
            $('#currentFileState').show();
            $('#currentFileName').show();
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
            $('#keep').attr('disabled', 'disabled');
            $('#currentFileState').hide();
            $('#currentFileName').hide();            
        }
    }


    function updateFileInfo() {
        var filename = box.escape('name') || '未命名';
        var filestate = (actionRecorder.changed === '0' ? '未修改' : '修改未保存') + (box.id ? ' - 云端存储' : ' - 本地存储');
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
            storageManager.loadShared(shareHash, function() {                
                bubble('载入分享文件失败');
                storageManager.loadRemote();
            });
        }
        else{
            storageManager.loadRemote();
        }
    } 
    else {
        loginTrigger(false);

        var shareHash = window.location.hash;
        if(shareHash) {
            shareHash = shareHash.substring(1);
            storageManager.loadShared(shareHash, function() {
                bubble('载入分享文件失败');
                storageManager.loadMeshes(undefined, defaultLoadType, voxelAnimationManager.loadBoxAnimation);
            });
        }
        else{
            storageManager.loadMeshes(undefined, defaultLoadType, voxelAnimationManager.loadBoxAnimation);
        }
    }
    
    window.addEventListener("hashchange", function(){
        var shareHash = window.location.hash;
        if(shareHash) {
            shareHash = shareHash.substring(1);
            storageManager.loadShared(shareHash, function(){
                bubble('载入分享文件失败');
            });
        }
    }, false);

    //keyboard event toggles along with modal state changes
    function onModalShow() {
        document.removeEventListener( 'keydown', onDocumentKeyDown, false );
        document.removeEventListener( 'keyup', onDocumentKeyUp, false );
        base.controls.removeKeyEventListener();
    }

    function onModalHide() {
        document.addEventListener( 'keydown', onDocumentKeyDown, false );
        document.addEventListener( 'keyup', onDocumentKeyUp, false );
        base.controls.addKeyEventListener();
    }

    $('.modal').on('hidden.bs.modal', onModalHide);
    $('.modal').on('shown.bs.modal', onModalShow);

})( window, document, Base, THREE, Detector);