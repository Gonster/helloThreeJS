(function(){

    var GoUI = {};

    //_Container
    _Container = function(){
        this.domElement = document.createElement('div');
    };

    _Container.prototype.createComponets = function(buttonGroups){
        for (var i = 0, l=buttonGroups.length; i < l; i++) {




        };
    }

    //Sidebar
    GoUI.Sidebar = function(settings, domParent){

        _Container.call(this);

        var defaultSettings = {
            'align': 'r',            
            'width': 320
        }
        var mixinSettings = GoUI.Utils.settingMixin(defaultSettings, settings);

        var classNameString = 'sidebar';
        if(!mixinSettings.align || mixinSettings.align === 'r'){
            classNameString += ' sidebar-right';
        }
        else{
            classNameString += ' sidebar-left';
        }
        this.domElement.className = classNameString;
        if(mixinSettings.id) this.domElement.id = mixinSettings.id;

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
            'title': '',
        }
        var mixinSettings = GoUI.Utils.settingMixin(defaultSettings, settings);
      
        if(mixinSettings.id) this.domElement.id = mixinSettings.id;     

        var aPanel = this.domElement = document.createElement('div');
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

    //button group
    GoUI.ButtonGroup = function(settings, domParent){
        _Container.call(this);
        var defaultSettings = {
            'title': '',
            'buttonType': 'radio'
        }
        var mixinSettings = GoUI.Utils.settingMixin(defaultSettings, settings);
      
        if(mixinSettings.id) this.domElement.id = mixinSettings.id;     

        var aGroup = this.domElement = document.createElement('div');
        aGroup.className = 'btn-group';
        aGroup.setAttribute('data-toggle', 'buttons');
        aGroup.title = mixinSettings.title;
        domParent.appendChild(aGroup);
        var buttons = mixinSettings.buttons;
        for (var j = 0, k = buttons.length; j < k; j++) {
            var aRadioButtonLabel = document.createElement('label');
            aRadioButtonLabel.className = 'btn btn-tool'+(buttons[j].checked?' active':'');
            aGroup.appendChild(aRadioButtonLabel);
            var aInput = document.createElement('input');
            if(buttons[j].checked) aInput.setAttribute('checked','');
            aInput.type = mixinSettings.buttonType;
            aInput.name = mixinSettings.name;
            aInput.id = buttons[j].id;
            aInput.autocomplete = 'off';
            aRadioButtonLabel.appendChild(aInput);     
            var text =document.createTextNode(buttons[j].title);    
            aRadioButtonLabel.appendChild(text);    
        }

        GoUI.Utils.domCreationDirector(mixinSettings.children, this.domElement)
    };

    GoUI.ButtonGroup.prototype = Object.create(_Container.prototype);

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
})();