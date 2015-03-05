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
})();